import React, { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas } from '../SistemasContext';
import { toast } from 'sonner';
import { InputField } from '../components/InputField';
import { 
  Settings, DollarSign, Save, CheckCircle2, Clock, Trash2, AlertTriangle
} from 'lucide-react';
export const Configuracoes = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { resetSistema, currentUser } = useSistemas();

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState('');

  const handleReset = () => {
    if (currentUser?.nome.toLowerCase() !== 'fernando') {
      toast.error('Apenas o administrador Fernando pode realizar o reset do sistema.', {
        icon: <AlertTriangle className="text-red-500" />,
      });
      return;
    }

    if (!showResetPassword) {
      setShowResetPassword(true);
      return;
    }

    if (resetPassword !== currentUser.senha) {
      toast.error('Senha incorreta!');
      return;
    }

    if (window.confirm('TEM CERTEZA? Esta ação irá excluir TODOS os clientes, produtos, insumos, orçamentos e pedidos. Esta ação não pode ser desfeita.')) {
      resetSistema();
      toast.success('Sistema resetado com sucesso!');
    }
  };

  return (
    <PageLayout title="Configurações do Sistema" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-2xl mx-auto mt-12">
        <div className="glass-panel p-8 rounded-3xl flex flex-col gap-6 shadow-xl border border-red-500/20 bg-red-50/5 backdrop-blur-md">
          <div className="flex items-center gap-3 text-red-600 border-b border-red-500/20 pb-4">
            <AlertTriangle size={24} />
            <h3 className="text-xl font-serif font-bold">Zona de Perigo</h3>
          </div>
          
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Ao efetuar o reset do sistema, todos os dados de clientes, produtos, insumos, orçamentos e pedidos serão permanentemente excluídos. 
              As configurações voltarão aos valores de fábrica.
            </p>
            
            {showResetPassword && (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top duration-200">
                <label className="text-xs font-bold text-red-600 uppercase ml-1">Senha de Administrador</label>
                <input 
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Digite a senha para resetar..."
                  className="w-full bg-white border border-red-300 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                  autoFocus
                />
              </div>
            )}
            
            <div className="flex justify-center gap-4">
              {showResetPassword && (
                <button 
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetPassword('');
                  }}
                  className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={handleReset}
                className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
              >
                <Trash2 size={20} />
                {showResetPassword ? 'Confirmar Reset' : 'Resetar Todo o Sistema'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
