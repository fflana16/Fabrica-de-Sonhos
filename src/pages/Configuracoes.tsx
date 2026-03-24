import React, { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas } from '../SistemasContext';
import { toast } from 'sonner';
import { InputField } from '../components/InputField';
import { 
  Settings, DollarSign, Save, CheckCircle2, Clock, Trash2, AlertTriangle
} from 'lucide-react';
export const Configuracoes = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { configuracoes, updateConfiguracoes, resetSistema } = useSistemas();

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [formData, setFormData] = useState({
    custoHoraMaquina: maskCurrency(String(configuracoes.custoHoraMaquina * 100))
  });

  function maskCurrency(value: string) {
    let v = value.replace(/\D/g, '');
    if (v === '') return '';
    v = (parseInt(v) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'custoHoraMaquina') {
      setFormData({ custoHoraMaquina: maskCurrency(value) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const custoNum = parseFloat(formData.custoHoraMaquina.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
    
    if (custoNum <= 0) {
      toast.error('O custo da hora deve ser maior que zero.');
      return;
    }

    updateConfiguracoes({ custoHoraMaquina: custoNum });
    toast.success('Configurações atualizadas com sucesso!', {
      icon: <CheckCircle2 className="text-gold" />,
    });
    onNavigate('Dashboard');
  };

  const handleReset = () => {
    if (!showResetPassword) {
      setShowResetPassword(true);
      return;
    }

    if (resetPassword !== 'admin123') {
      toast.error('Senha de administrador incorreta!');
      return;
    }

    if (window.confirm('TEM CERTEZA? Esta ação irá excluir TODOS os clientes, produtos, insumos, orçamentos e pedidos. Esta ação não pode ser desfeita.')) {
      resetSistema();
      toast.success('Sistema resetado com sucesso!');
    }
  };

  return (
    <PageLayout title="Configurações Globais" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-2xl mx-auto mt-12">
        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl flex flex-col gap-6 shadow-xl border border-gold/20 bg-white/10 backdrop-blur-md">
          <div className="flex items-center gap-3 text-gold-dark border-b border-gold/20 pb-4">
            <Settings size={24} />
            <h3 className="text-xl font-serif font-bold">Custos de Operação</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              icon={DollarSign} 
              label="Custo da Hora de Máquina (R$)" 
              name="custoHoraMaquina" 
              value={formData.custoHoraMaquina} 
              onChange={handleChange} 
              required 
              placeholder="R$ 0,00" 
            />
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1">
                Última Alteração
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gold-dark/60">
                  <Clock size={16} />
                </div>
                <input
                  type="text"
                  value={configuracoes.dataUltimaAlteracaoMaquina}
                  readOnly
                  className="w-full bg-gray-50/50 backdrop-blur-sm border border-gold/30 rounded-xl py-2 pl-9 pr-3 text-sm text-gray-500 cursor-not-allowed opacity-70"
                />
              </div>
            </div>
          </div>

          <div className="bg-gold/5 p-4 rounded-2xl border border-gold/20 text-xs text-gray-600 leading-relaxed">
            <p className="font-bold text-gold-dark mb-1">Informação:</p>
            Este valor será utilizado como base para o cálculo do custo de máquina em todos os produtos de Corte a Laser. 
            O custo do minuto será calculado dividindo este valor por 60.
          </div>

          <div className="flex justify-center mt-4">
            <button 
              type="submit"
              className="bg-gradient-to-r from-gold-dark to-gold text-white px-12 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/20"
            >
              <Save size={20} />
              Salvar Configurações
            </button>
          </div>
        </form>

        <div className="mt-12 glass-panel p-8 rounded-3xl flex flex-col gap-6 shadow-xl border border-red-500/20 bg-red-50/5 backdrop-blur-md">
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
