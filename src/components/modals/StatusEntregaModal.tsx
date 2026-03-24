import React, { useState } from 'react';
import { XCircle, CheckCircle2, DollarSign, Calendar, User } from 'lucide-react';
import { Pedido, useSistemas } from '../../SistemasContext';
import { toast } from 'sonner';

interface StatusEntregaModalProps {
  pedido: Pedido;
  onClose: () => void;
}

export const StatusEntregaModal: React.FC<StatusEntregaModalProps> = ({ pedido, onClose }) => {
  const { updatePedido } = useSistemas();
  const [dataEntregaEfetiva, setDataEntregaEfetiva] = useState(new Date().toISOString().split('T')[0]);
  const [recebidoPor, setRecebidoPor] = useState('');
  const [pagamentoSaldo, setPagamentoSaldo] = useState('');
  const [formaPagamentoSaldo, setFormaPagamentoSaldo] = useState('');

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

  const saldoPendente = pedido.totalGeral - pedido.sinalPago;

  const handleConfirmar = () => {
    if (!recebidoPor.trim()) {
      return toast.error('Por favor, informe quem recebeu o pedido.');
    }
    if (!formaPagamentoSaldo && unmaskCurrency(pagamentoSaldo) > 0) {
      return toast.error('Selecione a forma de pagamento do saldo.');
    }

    updatePedido(pedido.id, { 
      status: 'Entregue',
      dataEntregaEfetiva,
      recebidoPor,
      pagamentoSaldo: unmaskCurrency(pagamentoSaldo),
      formaPagamentoSaldo
    }, undefined, `Entregue para: ${recebidoPor}`);
    
    toast.success('Pedido marcado como entregue com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gold/30 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
          <div className="flex items-center gap-3 text-gold-dark">
            <CheckCircle2 size={24} />
            <h3 className="text-xl font-bold">Finalizar Entrega</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="bg-gold/5 p-4 rounded-2xl border border-gold/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total do Pedido:</span>
              <span className="font-bold text-gray-800">R$ {pedido.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Sinal Pago:</span>
              <span className="font-bold text-green-600">R$ {pedido.sinalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-t border-gold/20 pt-2">
              <span className="text-sm font-bold text-gold-dark">Saldo Pendente:</span>
              <span className="font-black text-lg text-gold-dark">R$ {saldoPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Data da Entrega</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="date"
                  value={dataEntregaEfetiva}
                  onChange={(e) => setDataEntregaEfetiva(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Quem Recebeu</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={recebidoPor}
                  onChange={(e) => setRecebidoPor(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
                  placeholder="Nome do recebedor"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Pagamento do Saldo</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={pagamentoSaldo}
                  onChange={(e) => setPagamentoSaldo(maskCurrency(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all font-mono"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Forma de Pagamento</label>
              <select
                value={formaPagamentoSaldo}
                onChange={(e) => setFormaPagamentoSaldo(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all"
              >
                <option value="">Selecione...</option>
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Débito">Débito</option>
                <option value="Crédito">Crédito</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button 
            onClick={handleConfirmar}
            className="flex-1 bg-gradient-to-r from-gold-dark to-gold text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-gold/30 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} />
            Finalizar Entrega
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
