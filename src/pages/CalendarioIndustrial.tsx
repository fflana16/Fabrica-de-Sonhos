import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Pedido } from '../SistemasContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, addMonths, subMonths, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Info, Package, Clock, DollarSign, XCircle
} from 'lucide-react';

interface PedidoDoDia {
  pedidoId: string;
  clienteNome: string;
  itens: { nomeProduto: string; quantidade: number; tempoTotal: number }[];
  tempoTotalPedido: number;
  status: Pedido['status'];
}

interface DiaDetalhesModalProps {
  date: Date;
  pedidosDoDia: PedidoDoDia[];
  onClose: () => void;
}

const DiaDetalhesModal: React.FC<DiaDetalhesModalProps> = ({ date, pedidosDoDia, onClose }) => {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">Ordens de Serviço para {format(date, 'dd/MM/yyyy', { locale: ptBR })}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          {pedidosDoDia.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Info size={48} className="mb-4" />
              <p>Nenhuma ordem de serviço agendada para este dia.</p>
            </div>
          ) : (
            pedidosDoDia.map((pedido, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-2">
                <p className="font-semibold text-gray-800">OS: {pedido.pedidoId} - Cliente: {pedido.clienteNome}</p>
                <p className="text-sm text-gray-600">Status: {pedido.status}</p>
                <p className="text-sm text-gray-600">Tempo Total Agendado: {pedido.tempoTotalPedido} min</p>
                <div className="ml-4">
                  {pedido.itens.map((item, itemIndex) => (
                    <p key={itemIndex} className="text-xs text-gray-500">- {item.nomeProduto} (Qtd: {item.quantidade}, Tempo: {item.tempoTotal} min)</p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gray-400/20"
          >
            <XCircle size={20} />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export const CalendarioIndustrial = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { pedidos, clientes } = useSistemas();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ date: Date; pedidos: PedidoDoDia[] } | null>(null);

  const CAPACIDADE_DIARIA_MINUTOS = 420; // 7 horas de produção

  // Lista de feriados/pontos facultativos (exemplo - pode ser carregado de um estado global)
  const FERIADOS: string[] = useMemo(() => [
    '2026-01-01', // Ano Novo
    '2026-02-24', // Carnaval (exemplo)
    '2026-02-25', // Carnaval (exemplo)
    '2026-04-10', // Sexta-feira Santa
    '2026-04-21', // Tiradentes
    '2026-05-01', // Dia do Trabalho
    '2026-06-11', // Corpus Christi
    '2026-09-07', // Independência do Brasil
    '2026-10-12', // Nossa Senhora Aparecida
    '2026-11-02', // Finados
    '2026-11-15', // Proclamação da República
    '2026-12-25', // Natal
  ], []);

  const isBusinessDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return !isWeekend(date) && !FERIADOS.includes(dateString);
  };

  const loadMap = useMemo(() => {
    const map: { [key: string]: number } = {}; // key: YYYY-MM-DD, value: minutos ocupados
    const pedidosAtivos = pedidos.filter(ped => 
      ped.status !== 'Entregue' && ped.status !== 'Pronto' && ped.status !== 'Prioridade Urgente'
    ).sort((a, b) => new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime());

    pedidosAtivos.forEach(order => {
      let totalMinutes = order.itens.reduce((acc, item) => acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade, 0);
      let remainingMins = totalMinutes;
      let checkDate = new Date(order.dataCriacao);

      while (remainingMins > 0) {
        const dateKey = format(checkDate, 'yyyy-MM-dd');
        if (isBusinessDay(checkDate)) {
          const used = map[dateKey] || 0;
          const available = CAPACIDADE_DIARIA_MINUTOS - used;
          
          if (available > 0) {
            const consume = Math.min(remainingMins, available);
            map[dateKey] = (map[dateKey] || 0) + consume;
            remainingMins -= consume;
          }
        }
        checkDate = addDays(checkDate, 1); // Pula para o próximo dia
      }
    });
    return map;
  }, [pedidos, FERIADOS]);

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday...

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const getDayLoad = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const occupiedMinutes = loadMap[dateKey] || 0;
    const percentage = (occupiedMinutes / CAPACIDADE_DIARIA_MINUTOS) * 100;
    return { occupiedMinutes, percentage };
  };

  const getDayColorClass = (date: Date, percentage: number) => {
    if (isWeekend(date) || FERIADOS.includes(format(date, 'yyyy-MM-dd'))) return 'bg-gray-200 text-gray-400'; // Dias não úteis
    if (percentage === 0) return 'bg-green-100 text-green-800'; // Livre
    if (percentage < 70) return 'bg-yellow-100 text-yellow-800'; // Carga leve
    if (percentage < 100) return 'bg-orange-100 text-orange-800'; // Carga média
    return 'bg-red-100 text-red-800'; // Sobrecarga
  };

  const handleDayClick = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const pedidosDoDia: PedidoDoDia[] = [];

    // Encontrar pedidos que contribuem para a carga deste dia
    pedidos.forEach(order => {
      let totalMinutes = order.itens.reduce((acc, item) => acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade, 0);
      let remainingMins = totalMinutes;
      let checkDate = new Date(order.dataCriacao);
      let foundOnDay = false;

      while (remainingMins > 0 && !foundOnDay) {
        const currentDayKey = format(checkDate, 'yyyy-MM-dd');
        if (isBusinessDay(checkDate)) {
          const used = loadMap[currentDayKey] || 0;
          const available = CAPACIDADE_DIARIA_MINUTOS - used;
          
          if (available > 0) {
            const consume = Math.min(remainingMins, available);
            if (currentDayKey === dateKey) {
              pedidosDoDia.push({
                pedidoId: order.id,
                clienteNome: clientes.find(c => c.codigo === order.clienteCodigo)?.nome || 'N/A',
                itens: order.itens.map(item => ({
                  nomeProduto: item.nomeProduto,
                  quantidade: item.quantidade,
                  tempoTotal: (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade
                })),
                tempoTotalPedido: consume, // Apenas o tempo consumido neste dia
                status: order.status,
              });
              foundOnDay = true;
            }
            remainingMins -= consume;
          }
        }
        checkDate = addDays(checkDate, 1);
      }
    });
    setSelectedDayDetails({ date, pedidos: pedidosDoDia });
  };

  return (
    <PageLayout title="Calendário Industrial (PCP)" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-7xl mx-auto mt-8 flex flex-col gap-6">
        
        <div className="flex justify-between items-center bg-white/40 backdrop-blur-sm rounded-full py-2 px-4 shadow-sm border border-gold/30 mb-4">
          <button onClick={handlePreviousMonth} className="p-2 text-gold-dark hover:bg-white/60 rounded-full transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h4 className="font-serif font-bold text-xl text-gray-900">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h4>
          <button onClick={handleNextMonth} className="p-2 text-gold-dark hover:bg-white/60 rounded-full transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center font-semibold text-sm text-gold-dark mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="h-28 rounded-xl bg-gray-100/50"></div>
          ))}
          {daysInMonth.map(date => {
            const { occupiedMinutes, percentage } = getDayLoad(date);
            const dayColorClass = getDayColorClass(date, percentage);
            const isTodayDate = isSameDay(date, new Date());

            return (
              <button 
                key={format(date, 'yyyy-MM-dd')}
                onClick={() => handleDayClick(date)}
                className={`relative h-28 p-2 rounded-xl flex flex-col items-center justify-between text-sm transition-all duration-200
                  ${dayColorClass} ${isTodayDate ? 'border-2 border-gold-dark ring-2 ring-gold-dark' : 'border border-gray-200'}
                  ${isWeekend(date) || FERIADOS.includes(format(date, 'yyyy-MM-dd')) ? 'cursor-not-allowed' : 'hover:scale-[1.02] active:scale-98'}
                `}
                disabled={isWeekend(date) || FERIADOS.includes(format(date, 'yyyy-MM-dd'))}
              >
                <span className={`font-bold ${isTodayDate ? 'text-gold-dark' : 'text-gray-800'}`}>{format(date, 'd')}</span>
                {!isWeekend(date) && !FERIADOS.includes(format(date, 'yyyy-MM-dd')) && (
                  <div className="w-full flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${percentage === 0 ? 'bg-transparent' : (percentage < 70 ? 'bg-green-500' : (percentage < 100 ? 'bg-orange-500' : 'bg-red-500'))}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{occupiedMinutes} / {CAPACIDADE_DIARIA_MINUTOS} min</span>
                  </div>
                )}
                {(isWeekend(date) || FERIADOS.includes(format(date, 'yyyy-MM-dd'))) && (
                  <span className="text-xs text-gray-500">Indisponível</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDayDetails && (
        <DiaDetalhesModal 
          date={selectedDayDetails.date}
          pedidosDoDia={selectedDayDetails.pedidos}
          onClose={() => setSelectedDayDetails(null)}
        />
      )}
    </PageLayout>
  );
};
