import React, { useState, useEffect, useMemo } from 'react';
import { useSistemas, Cliente } from '../../SistemasContext';
import { toast } from 'sonner';
import {
  XCircle, Cake, Gift, MessageCircle, Info
} from 'lucide-react';
import { format, isToday, isFuture, parseISO, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseDate, calculateAge } from '../../utils/dateUtils';

interface AniversariosModalProps {
  onClose: () => void;
}

export const AniversariosModal: React.FC<AniversariosModalProps> = ({ onClose }) => {
  const { clientes } = useSistemas();
  const [activeTab, setActiveTab] = useState<'hoje' | 'proximos'>('hoje');

  const aniversariantesHoje = useMemo(() => {
    return clientes.filter(cliente => {
      if (cliente.status === 'ELIMINADO') return false;
      if (!cliente.dataNascimento) return false;
      const dataNascimento = parseDate(cliente.dataNascimento);
      if (!dataNascimento) return false;
      return isToday(new Date(new Date().getFullYear(), dataNascimento.getMonth(), dataNascimento.getDate()));
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clientes]);

  const proximosAniversariantes = useMemo(() => {
    const today = new Date();
    const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));

    return clientes.filter(cliente => {
      if (cliente.status === 'ELIMINADO') return false;
      if (!cliente.dataNascimento) return false;
      const dataNascimento = parseDate(cliente.dataNascimento);
      if (!dataNascimento) return false;
      const aniversarioEsteAno = new Date(today.getFullYear(), dataNascimento.getMonth(), dataNascimento.getDate());
      const aniversarioProximoAno = new Date(today.getFullYear() + 1, dataNascimento.getMonth(), dataNascimento.getDate());

      return next7Days.some(day => isSameDay(day, aniversarioEsteAno) || isSameDay(day, aniversarioProximoAno));
    }).filter(cliente => !aniversariantesHoje.some(a => a.codigo === cliente.codigo)) // Remove de "hoje"
      .sort((a, b) => {
        const getNexBirthday = (c: Cliente) => {
          if (!c.dataNascimento) return Infinity;
          const dob = parseISO(c.dataNascimento);
          let nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (nextBday < today) {
            nextBday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
          }
          return nextBday.getTime();
        };
        return getNexBirthday(a) - getNexBirthday(b);
      });
  }, [clientes, aniversariantesHoje]);

  const handleSendMessage = (cliente: Cliente) => {
    const message = `Olá, ${cliente.nome}! 🥳\n\nHoje o dia está em festa porque é o seu aniversário! Nós, da Fábrica de Sonhos Rosi e Freire, não poderíamos deixar essa data passar em branco.\n\nÉ uma satisfação imensa ter você como nosso cliente e fazer parte da sua trajetória. Estamos muito felizes em poder te parabenizar neste dia tão importante da sua vida! Que seu novo ciclo seja repleto de realizações, saúde e, claro, muitos sonhos realizados.\n\nParabéns e muitas felicidades! ✨`;
    const phone = (cliente.whatsapp || cliente.telefone || '').replace(/\D/g, '');
    // Ensure 55 prefix if not present (assuming Brazil)
    const formattedPhone = phone.length <= 11 ? `55${phone}` : phone;
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">Aniversariantes</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex border-b border-gray-200 mb-4">
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'hoje' ? 'border-b-2 border-gold-dark text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('hoje')}
            >
              Hoje ({aniversariantesHoje.length})
            </button>
            <button
              className={`py-2 px-4 text-sm font-medium ${activeTab === 'proximos' ? 'border-b-2 border-gold-dark text-gold-dark' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('proximos')}
            >
              Próximos 7 Dias ({proximosAniversariantes.length})
            </button>
          </div>

          {(activeTab === 'hoje' ? aniversariantesHoje : proximosAniversariantes).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Info size={48} className="mb-4" />
              <p>{activeTab === 'hoje' ? 'Nenhum aniversariante hoje.' : 'Nenhum próximo aniversariante nos próximos 7 dias.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(activeTab === 'hoje' ? aniversariantesHoje : proximosAniversariantes).map(cliente => (
                <div key={cliente.codigo} className="bg-gold-light/10 p-4 rounded-xl border border-gold/20 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <Cake size={24} className="text-gold-dark" />
                    <div>
                      <p className="font-semibold text-gray-800">{cliente.codigo} - {cliente.nome}</p>
                      <div className="flex flex-col">
                        {cliente.dataNascimento && (
                          <p className="text-sm text-gray-600">
                            {format(parseDate(cliente.dataNascimento)!, 'dd/MM', { locale: ptBR })}
                            {activeTab === 'proximos' && ` (${format(new Date(new Date().getFullYear(), parseDate(cliente.dataNascimento)!.getMonth(), parseDate(cliente.dataNascimento)!.getDate()), 'dd/MM/yyyy', { locale: ptBR })})`}
                          </p>
                        )}
                        {calculateAge(cliente.dataNascimento) !== null && (
                          <p className="text-xs font-medium text-gold-dark">
                            Completando {calculateAge(cliente.dataNascimento)} anos
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSendMessage(cliente)}
                      className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-md"
                      title="Enviar mensagem de WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button 
                      onClick={() => toast.info('Funcionalidade de presente em desenvolvimento')}
                      className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md"
                      title="Registrar presente"
                    >
                      <Gift size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
