import React, { useState } from 'react';
import { XCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Pedido, useSistemas } from '../../SistemasContext';
import { toast } from 'sonner';

interface CancelamentoPedidoModalProps {
  pedido: Pedido;
  onClose: () => void;
}

export const CancelamentoPedidoModal: React.FC<CancelamentoPedidoModalProps> = ({ pedido, onClose }) => {
  const { updatePedido } = useSistemas();
  const [justificativa, setJustificativa] = useState('');
  const [step, setStep] = useState(pedido.status === 'Confirmado' ? 2 : 1);

  const handleConfirmar = () => {
    if (!justificativa.trim()) {
      return toast.error('Por favor, informe a justificativa do cancelamento.');
    }

    updatePedido(pedido.id, { 
      status: 'CANCELADO',
      justificativaCancelamento: justificativa 
    }, undefined, `Cancelado: ${justificativa}`);
    
    toast.success('Pedido cancelado com sucesso!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-200 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="text-xl font-bold">Cancelar Pedido</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-red-800 font-bold text-sm mb-1 uppercase tracking-wider">Atenção: Produção Iniciada</p>
                  <p className="text-red-700 text-xs leading-relaxed">
                    Este pedido já está no status <span className="font-black">"{pedido.status}"</span>. 
                    A produção já foi iniciada e o cancelamento deve ser analisado criteriosamente para cada caso.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm">
              Deseja realmente prosseguir com o cancelamento deste pedido?
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Confirmar Cancelamento
              </button>
              <button 
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Você está prestes a cancelar o pedido <span className="font-bold text-gray-800">{pedido.id}</span>. 
              Esta ação alterará o status para <span className="font-bold text-red-600 uppercase">Cancelado</span>.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1 ml-1">Justificativa do Cancelamento</label>
              <textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all min-h-[120px] resize-none"
                placeholder="Descreva o motivo do cancelamento..."
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button 
                onClick={handleConfirmar}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                Confirmar Cancelamento
              </button>
              <button 
                onClick={() => pedido.status === 'Confirmado' ? onClose() : setStep(1)}
                className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
