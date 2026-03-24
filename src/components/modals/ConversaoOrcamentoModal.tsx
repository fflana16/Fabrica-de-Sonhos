import React, { useState, useEffect } from 'react';
import { useSistemas, Orcamento, PedidoItem, Pedido } from '../../SistemasContext';
import { toast } from 'sonner';
import {
  XCircle, CheckCircle2, AlertTriangle, DollarSign, Package, Info
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePCP } from '../../hooks/usePCP';

interface ConversaoOrcamentoModalProps {
  orcamento: Orcamento;
  onClose: () => void;
}

export const ConversaoOrcamentoModal: React.FC<ConversaoOrcamentoModalProps> = ({ orcamento, onClose }) => {
  const {
    clientes,
    configuracoes,
    addPedido,
    updateOrcamento
  } = useSistemas();

  const { findAvailableDate, addBusinessDays } = usePCP();

  const [itensParaPedido, setItensParaPedido] = useState<PedidoItem[]>([]);
  const [sinalPago, setSinalPago] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [dataEntregaDesejada, setDataEntregaDesejada] = useState(orcamento.dataEntregaDesejada || '');
  const [alertaSobrecarga, setAlertaSobrecarga] = useState(false);
  const [dataSugeriaPCP, setDataSugeriaPCP] = useState(orcamento.dataSugeriaPCP || '');
  const [alertaRiscoFinanceiro, setAlertaRiscoFinanceiro] = useState(false);
  const [aceiteRiscoPrejuizo, setAceiteRiscoPrejuizo] = useState(false);

  // Funções de máscara movidas para fora ou declaradas antes do uso
  const unmaskCurrency = (value: string) => {
    return parseFloat(value.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
  };

  function maskCurrency(value: string) {
    let v = value.replace(/\D/g, '');
    if (v === '') return '';
    v = (parseInt(v) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
  }

  useEffect(() => {
    if (orcamento && orcamento.itens) {
      setItensParaPedido(orcamento.itens.map(item => ({
        ...item,
        aprovado: true,
        justificativaRecusa: undefined,
      })));
      setSinalPago(maskCurrency((orcamento.sinal || 0).toFixed(2).replace('.', ',')));
    }
  }, [orcamento]);

  useEffect(() => {
    const totalAprovado = itensParaPedido.reduce((acc, item) => 
      item.aprovado ? acc + (item.precoVendaUnitario * item.quantidade) : acc, 0
    );
    const sinalNum = unmaskCurrency(sinalPago);
    setAlertaRiscoFinanceiro(sinalNum < (totalAprovado * 0.5));
    
    // Cálculo do PCP usando o hook
    const totalEsforco = itensParaPedido.reduce((acc, item) => {
      return item.aprovado ? acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade : acc;
    }, 0);

    if (totalEsforco > 0) {
      const suggestedProductionDate = findAvailableDate(totalEsforco);
      const suggestedClientDate = addBusinessDays(suggestedProductionDate, 2);
      
      const formattedProductionDate = format(suggestedProductionDate, 'yyyy-MM-dd');
      const formattedClientDate = format(suggestedClientDate, 'yyyy-MM-dd');
      
      setDataSugeriaPCP(formattedProductionDate);
      
      // Se não houver data desejada ou se for a data do orçamento original, sugerir a nova data segura
      if (!dataEntregaDesejada || dataEntregaDesejada === orcamento.dataEntregaDesejada) {
        setDataEntregaDesejada(formattedClientDate);
      }
    }
  }, [itensParaPedido, sinalPago, findAvailableDate, addBusinessDays]);

  useEffect(() => {
    if (dataEntregaDesejada && dataSugeriaPCP) {
      const desiredDate = new Date(dataEntregaDesejada);
      const productionDate = new Date(dataSugeriaPCP);
      const safeClientDate = addBusinessDays(productionDate, 2);
      
      setAlertaSobrecarga(desiredDate < safeClientDate && !isSameDay(desiredDate, safeClientDate));
    }
  }, [dataEntregaDesejada, dataSugeriaPCP, addBusinessDays]);

  const handleConfirmConversion = () => {
    const totalAprovado = itensParaPedido.reduce((acc, item) => 
      item.aprovado ? acc + (item.precoVendaUnitario * item.quantidade) : acc, 0
    );

    if (totalAprovado === 0) return toast.error('Nenhum item aprovado.');
    if (!formaPagamento) return toast.error('Selecione a forma de pagamento.');

    if (formaPagamento === 'Sem Entrada' && !aceiteRiscoPrejuizo) {
      return toast.error('Você deve aceitar o risco de prejuízo para continuar sem entrada.');
    }

    if (alertaSobrecarga && !window.confirm('A data de entrega desejada está antes do prazo de segurança (+2 dias úteis). Deseja continuar e assumir o risco de atraso na entrega?')) {
      return;
    }

    const novoPedido: any = {
      orcamentoId: orcamento.id,
      clienteCodigo: orcamento.clienteCodigo,
      itens: itensParaPedido.filter(i => i.aprovado),
      totalGeral: totalAprovado,
      sinalPago: unmaskCurrency(sinalPago),
      formaPagamento,
      dataEntrega: dataEntregaDesejada,
      dataSugeriaPCP,
      status: 'PENDENTE',
      dataCriacao: new Date().toISOString()
    };

    addPedido(novoPedido);
    updateOrcamento(orcamento.id, { status: 'CONVERTIDO' });
    toast.success('Convertido com sucesso!');
    onClose();
  };

  const cliente = clientes.find(c => c.codigo === orcamento.clienteCodigo);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl border border-gold/30 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold">Converter Orçamento: {orcamento.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium text-gray-700">Data de Entrega Desejada</label>
              <input
                type="date"
                value={dataEntregaDesejada}
                onChange={(e) => setDataEntregaDesejada(e.target.value)}
                className="w-full border rounded-xl py-2 px-3 text-sm"
              />
              {alertaSobrecarga && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> 
                  Atenção! Data desejada antes do prazo de segurança (+2 dias). 
                  Data segura: {format(addBusinessDays(new Date(dataSugeriaPCP), 2), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
              {dataSugeriaPCP && !alertaSobrecarga && (
                <p className="text-[10px] text-gold-dark mt-1 flex items-center gap-1">
                  <Info size={12} /> 
                  Sugestão para o Cliente: {format(addBusinessDays(new Date(dataSugeriaPCP), 2), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormaPagamento(val);
                  if (val === 'Sem Entrada') {
                    setSinalPago(maskCurrency('0'));
                  } else {
                    setAceiteRiscoPrejuizo(false);
                  }
                }}
                className="w-full border rounded-xl py-2 px-3 text-sm"
              >
                <option value="">Selecione...</option>
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Débito">Débito</option>
                <option value="Crédito">Crédito</option>
                <option value="Sem Entrada">Sem Entrada</option>
              </select>
            </div>
          </div>

          {formaPagamento && formaPagamento !== 'Sem Entrada' && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-medium text-gray-700">Valor da Entrada (Sinal)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={sinalPago}
                  onChange={(e) => setSinalPago(maskCurrency(e.target.value))}
                  className="w-full border rounded-xl py-2 pl-9 pr-3 text-sm font-mono"
                  placeholder="R$ 0,00"
                />
              </div>
              {alertaRiscoFinanceiro && (
                <p className="text-[10px] text-orange-500 mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> Sinal inferior a 50% do total aprovado.
                </p>
              )}
            </div>
          )}

          {formaPagamento === 'Sem Entrada' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl animate-in zoom-in duration-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 mt-1" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-red-800">ALERTA: Risco de Prejuízo</h4>
                  <p className="text-xs text-red-700 mb-3">
                    A conversão de orçamento sem entrada representa um risco financeiro elevado para a empresa. 
                    Certifique-se de que o cliente é confiável.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={aceiteRiscoPrejuizo}
                        onChange={(e) => setAceiteRiscoPrejuizo(e.target.checked)}
                        className="w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                      />
                    </div>
                    <span className="text-sm font-bold text-red-800 group-hover:underline">
                      Estou ciente do risco e desejo prosseguir
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {itensParaPedido.map(item => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-xl border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.nomeProduto}</span>
                    {item.isIgreja && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                        IGREJA
                      </span>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={item.aprovado}
                    onChange={() => setItensParaPedido(prev => prev.map(i => i.id === item.id ? {...i, aprovado: !i.aprovado} : i))}
                    className="w-4 h-4 rounded border-gray-300 text-gold-dark focus:ring-gold"
                  />
                </div>
                <p className="text-xs text-gray-500">Qtd: {item.quantidade} | Total: R$ {(item.precoVendaUnitario * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button onClick={handleConfirmConversion} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700">Confirmar</button>
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-xl font-bold">Cancelar</button>
        </div>
      </div>
    </div>
  );
};