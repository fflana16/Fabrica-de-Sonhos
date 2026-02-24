import React, { useState, useEffect, useMemo } from 'react';
import { useSistemas, Orcamento, PedidoItem, Pedido } from '../../SistemasContext';
import { toast } from 'sonner';
import {
  XCircle, CheckCircle2, AlertTriangle, DollarSign, Package, Calendar, Info
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
    materiasPrimas,
    produtosLaser,
    produtosPapelaria,
    configuracoes,
    custosFixos,
    addPedido,
    updateOrcamento,
    pedidos
  } = useSistemas();

  const [itensParaPedido, setItensParaPedido] = useState<PedidoItem[]>([]);
  const [sinalPago, setSinalPago] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [dataEntregaDesejada, setDataEntregaDesejada] = useState(orcamento.dataEntregaDesejada || '');
  const [alertaSobrecarga, setAlertaSobrecarga] = useState(false);
  const [dataSugeriaPCP, setDataSugeriaPCP] = useState(orcamento.dataSugeriaPCP || '');
  const [alertaRiscoFinanceiro, setAlertaRiscoFinanceiro] = useState(false);

  useEffect(() => {
    // Inicializa itens para pedido com base nos itens do orçamento, todos aprovados por padrão
    setItensParaPedido(orcamento.itens.map(item => ({
      ...item,
      aprovado: true,
      justificativaRecusa: undefined,
    })));
    setSinalPago(maskCurrency(orcamento.sinal.toFixed(2).replace('.', ',')));
  }, [orcamento]);

  useEffect(() => {
    const totalAprovado = itensParaPedido.reduce((acc, item) => 
      item.aprovado ? acc + (item.precoVendaUnitario * item.quantidade) : acc, 0
    );
    const sinalNum = unmaskCurrency(sinalPago);
    setAlertaRiscoFinanceiro(sinalNum < (totalAprovado * 0.5));
    calcularDataSugeriaPCP();
  }, [itensParaPedido, sinalPago, pedidos, configuracoes.custoHoraMaquina, custosFixos]);

  useEffect(() => {
    if (dataEntregaDesejada && dataSugeriaPCP) {
      const desiredDate = new Date(dataEntregaDesejada);
      const suggestedDate = new Date(dataSugeriaPCP);
      setAlertaSobrecarga(desiredDate < suggestedDate);
    }
  }, [dataEntregaDesejada, dataSugeriaPCP]);

  function maskCurrency(value: string) {
    let v = value.replace(/\D/g, '');
    if (v === '') return '';
    v = (parseInt(v) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
  }

  const unmaskCurrency = (value: string) => {
    return parseFloat(value.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
  };

  const calcularDataSugeriaPCP = () => {
    const totalEsforcoNovoPedido = itensParaPedido.reduce((acc, item) => {
      return item.aprovado ? acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade : acc;
    }, 0);

    const capacidadeDiaria = 420; 

    let diasNecessarios = Math.ceil(totalEsforcoNovoPedido / capacidadeDiaria);
    if (diasNecessarios === 0) diasNecessarios = 1; 

    let dataCalculada = new Date();
    let diasUteisContados = 0;

    while (diasUteisContados < diasNecessarios) {
      dataCalculada.setDate(dataCalculada.getDate() + 1);
      const dayOfWeek = dataCalculada.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        diasUteisContados++;
      }
    }
    setDataSugeriaPCP(format(dataCalculada, 'dd/MM/yyyy', { locale: ptBR }));
  };

  const handleToggleAprovacao = (itemId: string) => {
    setItensParaPedido(prev => prev.map(item => 
      item.id === itemId ? { ...item, aprovado: !item.aprovado } : item
    ));
  };

  const handleJustificativaChange = (itemId: string, justificativa: string) => {
    setItensParaPedido(prev => prev.map(item => 
      item.id === itemId ? { ...item, justificativaRecusa: justificativa } : item
    ));
  };

  const handleConfirmConversion = () => {
    const totalAprovado = itensParaPedido.reduce((acc, item) => 
      item.aprovado ? acc + (item.precoVendaUnitario * item.quantidade) : acc, 0
    );

    if (totalAprovado === 0) {
      toast.error('Nenhum item aprovado para o pedido.');
      return;
    }
    if (!formaPagamento) {
      toast.error('Selecione a forma de pagamento.');
      return;
    }
    if (alertaSobrecarga && !window.confirm('A data de entrega desejada está antes da data segura do PCP. Deseja continuar e assumir o risco de sobrecarga industrial?')) {
      return;
    }
    if (alertaRiscoFinanceiro && !window.confirm('O valor do sinal é inferior a 50% do total. Deseja continuar e assumir o risco financeiro?')) {
      return;
    }

    const novoPedido: Omit<Pedido, 'status' | 'dataCriacao' | 'operadorCriacao' | 'historicoStatus'> = {
      id: crypto.randomUUID(), // Gerar um ID único para o novo pedido
      orcamentoId: orcamento.id,
      clienteCodigo: orcamento.clienteCodigo,
      itens: itensParaPedido,
      totalGeral: totalAprovado,
      sinalPago: unmaskCurrency(sinalPago),
      formaPagamento,
      dataEntrega: dataEntregaDesejada,
      dataSugeriaPCP,
    };

    addPedido(novoPedido);
    updateOrcamento(orcamento.id, { status: 'CONVERTIDO' });
    toast.success('Orçamento convertido para pedido com sucesso!', { icon: <CheckCircle2 className="text-gold" /> });
    onClose();
  };

  const cliente = clientes.find(c => c.codigo === orcamento.clienteCodigo);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">Converter Orçamento para Pedido: {orcamento.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <p className="text-sm text-gray-700"><span className="font-semibold">Cliente:</span> {cliente?.nome || 'N/A'}</p>
          <p className="text-sm text-gray-700"><span className="font-semibold">Data de Criação do Orçamento:</span> {format(new Date(orcamento.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataEntrega" className="text-xs font-medium text-gray-700 ml-1">Data de Entrega Desejada</label>
              <input
                type="date"
                id="dataEntrega"
                value={dataEntregaDesejada}
                onChange={(e) => setDataEntregaDesejada(e.target.value)}
                className={`w-full bg-white/40 backdrop-blur-sm border ${alertaSobrecarga ? 'border-red-400 ring-1 ring-red-400' : 'border-gold/30'} rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60`}
              />
              {dataEntregaDesejada && dataSugeriaPCP && dataEntregaDesejada.split('-').reverse().join('/') !== dataSugeriaPCP && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                  <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-blue-700 leading-tight">
                    A data sugerida pelo PCP ({dataSugeriaPCP}) é diferente da data desejada. Por favor, informe o cliente sobre a nova data de entrega.
                  </p>
                </div>
              )}
              {alertaSobrecarga && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Sobrecarga Industrial! Data segura: {dataSugeriaPCP}</p>
              )}
            </div>
            <div>
              <label htmlFor="formaPagamento" className="text-xs font-medium text-gray-700 ml-1">Forma de Pagamento</label>
              <select
                id="formaPagamento"
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value)}
                className="w-full bg-white/40 backdrop-blur-sm border border-gold/30 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60"
              >
                <option value="">Selecione a forma</option>
                <option value="PIX">PIX</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          <h4 className="font-serif font-bold text-md text-gold-dark mt-4 border-b border-gold/20 pb-2">Itens do Orçamento</h4>
          <div className="grid grid-cols-1 gap-3">
            {itensParaPedido.map(item => (
              <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 flex items-center gap-2"><Package size={16} /> {item.nomeProduto}</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.aprovado}
                      onChange={() => handleToggleAprovacao(item.id)}
                      className="form-checkbox h-4 w-4 text-gold-dark rounded focus:ring-gold-dark"
                    />
                    <span className="text-sm text-gray-700">Aprovar</span>
                  </label>
                </div>
                <span className="text-sm text-gray-600 ml-6">Qtd: {item.quantidade} | Preço Unitário: R$ {item.precoVendaUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                {item.observacoes && <span className="text-xs text-gray-600 italic ml-6">Obs: {item.observacoes}</span>}
                {!item.aprovado && (
                  <textarea
                    value={item.justificativaRecusa || ''}
                    onChange={(e) => handleJustificativaChange(item.id, e.target.value)}
                    placeholder="Justificativa para recusa (opcional)"
                    className="w-full bg-white/40 backdrop-blur-sm border border-gray-300 rounded-xl py-2 px-3 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all mt-2"
                    rows={2}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-gold/10 rounded-2xl border border-gold/30 flex justify-between items-center">
            <span className="font-bold text-lg text-gold-dark">Total Aprovado:</span>
            <span className="font-mono font-black text-2xl text-gold-dark">R$ {itensParaPedido.reduce((acc, item) => item.aprovado ? acc + (item.precoVendaUnitario * item.quantidade) : acc, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={`p-4 rounded-2xl border flex justify-between items-center relative overflow-hidden ${alertaRiscoFinanceiro ? 'bg-red-50/20 border-red-400' : 'bg-gold-light/20 border-gold/40'}`}>
            {alertaRiscoFinanceiro && (
              <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                <AlertTriangle size={64} className="text-red-400 opacity-20" />
              </div>
            )}
            <div className="absolute -right-4 -top-4 text-gold/20">
              <DollarSign size={64} />
            </div>
            <span className={`font-bold text-md relative z-10 ${alertaRiscoFinanceiro ? 'text-red-600' : 'text-gold-dark'}`}>Sinal Pago:</span>
            <div className="flex items-end gap-1 relative z-10">
              <span className={`text-sm font-medium mb-1 ${alertaRiscoFinanceiro ? 'text-red-600' : 'text-gold-dark'}`}>R$</span>
              <input
                type="text"
                value={sinalPago}
                onChange={(e) => setSinalPago(maskCurrency(e.target.value))}
                className={`bg-transparent text-xl font-mono font-bold focus:outline-none w-full text-right ${alertaRiscoFinanceiro ? 'text-red-600' : 'text-gold-dark'}`}
              />
            </div>
          </div>
          {alertaRiscoFinanceiro && <p className="text-[10px] text-red-500 mt-1 relative z-10">Sinal inferior a 50% do total aprovado!</p>}

        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={handleConfirmConversion}
            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-green-500/20"
          >
            <CheckCircle2 size={20} />
            Confirmar Conversão
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gray-400/20"
          >
            <XCircle size={20} />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
