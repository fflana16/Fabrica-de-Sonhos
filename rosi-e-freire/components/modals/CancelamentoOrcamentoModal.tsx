import React from 'react';

const CancelamentoOrcamentoModal = () => {
  return (
    <div>
      <h2>Cancelar Orçamento</h2>
      <p>Conteúdo do modal de cancelamento.</p>
    </div>
  );
};

export default CancelamentoOrcamentoModal;
import { X, AlertTriangle } from 'lucide-react';
import { Orcamento } from '../../SistemasContext';

interface CancelamentoOrcamentoModalProps {
  orcamento: Orcamento;
  onClose: () => void;
  onConfirm: (justificativa: string) => void;
}

export const CancelamentoOrcamentoModal = ({ orcamento, onClose, onConfirm }: CancelamentoOrcamentoModalProps) => {
  const [justificativaSelecionada, setJustificativaSelecionada] = useState<string>('');
  const [outraJustificativa, setOutraJustificativa] = useState('');

  const opcoes = [
    'Validade Vencida sem Retorno',
    'Prazo',
    'Valor',
    'Outros'
  ];

  const handleConfirm = () => {
    if (!justificativaSelecionada) return;
    const justificativaFinal = justificativaSelecionada === 'Outros' ? outraJustificativa : justificativaSelecionada;
    onConfirm(justificativaFinal);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-2 border-red-500 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6 border-b border-red-200 pb-4">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle size={24} />
            <h3 className="text-xl font-serif font-bold">Cancelar Orçamento</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <p className="text-sm text-gray-700 font-medium mb-2">Selecione o motivo do cancelamento:</p>
          
          <div className="flex flex-col gap-3">
            {opcoes.map(opcao => (
              <label 
                key={opcao} 
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  justificativaSelecionada === opcao 
                    ? 'border-red-500 bg-red-50 text-red-700 font-bold' 
                    : 'border-gray-200 hover:border-red-300 text-gray-700'
                }`}
              >
                <input 
                  type="radio" 
                  name="justificativa" 
                  value={opcao} 
                  checked={justificativaSelecionada === opcao}
                  onChange={(e) => setJustificativaSelecionada(e.target.value)}
                  className="w-4 h-4 text-red-600 focus:ring-red-500"
                />
                {opcao}
              </label>
            ))}
          </div>

          {justificativaSelecionada === 'Outros' && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2">
              <label className="text-xs font-bold text-red-700 uppercase tracking-wider ml-1 mb-1 block">Descreva o motivo:</label>
              <textarea
                value={outraJustificativa}
                onChange={(e) => setOutraJustificativa(e.target.value)}
                className="w-full bg-white border-2 border-red-200 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500 transition-all resize-none h-24"
                placeholder="Digite a justificativa..."
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-red-100">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Voltar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!justificativaSelecionada || (justificativaSelecionada === 'Outros' && !outraJustificativa)}
            className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
          >
            Confirmar Cancelamento
          </button>
        </div>
      </div>
    </div>
  );
};
