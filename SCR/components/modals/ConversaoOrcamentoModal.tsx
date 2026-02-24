import React, { useState, useEffect } from 'react';
import { useSistemas, Orcamento, PedidoItem, Pedido } from '../../SistemasContext';
import { toast } from 'sonner';
import {
  XCircle, CheckCircle2, AlertTriangle, DollarSign, Package, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

  const [itensParaPedido, setItensParaPedido] = useState<PedidoItem[]>([]);
  const [sinalPago, setSinalPago] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [dataEntregaDesejada, setDataEntregaDesejada] = useState(orcamento.dataEntregaDesejada || '');
  const [alertaSobrecarga, setAlertaSobrecarga] = useState(false);
  const [dataSugeriaPCP, setDataSugeriaPCP] = useState(orcamento.dataSugeriaPCP || '');
  const [alertaRiscoFinanceiro, setAlertaRiscoFinanceiro] = useState(false);

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
    
    // Cálculo do PCP
    const totalEsforco = itensParaPedido.reduce((acc, item) => {
      return item.aprovado ? acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade : acc;
    }, 0);

    const capacidadeDiaria = 420; 
    let diasNecessarios = Math.ceil(totalEsforco / capacidadeDiaria) || 1;
    let dataCalculada = new Date();
    let diasUteisContados = 0;

    while (diasUteisContados < diasNecessarios) {
      dataCalculada.setDate(dataCalculada.getDate() + 1);
      if (dataCalculada.getDay() !== 0 && dataCalculada.getDay() !== 6) diasUteisContados++;
    }
    setDataSugeriaPCP(format(dataCalculada, 'dd/MM/yyyy', { locale: ptBR }));
  }, [itensParaPedido, sinalPago]);

  useEffect(() => {
    if (dataEntregaDesejada && dataSugeriaPCP) {
      const parts = dataSugeriaPCP.split('/');
      const suggestedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const desiredDate = new Date(dataEntregaDesejada);
      setAlertaSobrecarga(desiredDate < suggestedDate);
    }
  }, [dataEntregaDesejada, dataSugeriaPCP]);

  const handleConfirmConversion = () => {
    const totalAprovado = itensParaPedido.reduce((acc, item) => 
      item.aprovado ? acc + (item.precoVendaUnitario * item.quantidade) : acc, 0
    );

    if (totalAprovado === 0) return toast.error('Nenhum item aprovado.');
    if (!formaPagamento) return toast.error('Selecione a forma de pagamento.');

    const novoPedido: any = {
      id: window.crypto.randomUUID(),
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
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Sobrecarga! Sugerido: {dataSugeriaPCP}</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Forma de Pagamento</label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full border rounded-xl py-2 px-3 text-sm"
              >
                <option value="">Selecione...</option>
                <option value="PIX">PIX</option>
                <option value="Cartão">Cartão</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {itensParaPedido.map(item => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-xl border">
                <div className="flex justify-between">
                  <span className="font-semibold text-sm">{item.nomeProduto}</span>
                  <input
                    type="checkbox"
                    checked={item.aprovado}
                    onChange={() => setItensParaPedido(prev => prev.map(i => i.id === item.id ? {...i, aprovado: !i.aprovado} : i))}
                  />
                </div>
                <p className="text-xs text-gray-500">Qtd: {item.quantidade} | Total: R$ {(item.precoVendaUnitario * item.quantidade).toFixed(2)}</p>
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