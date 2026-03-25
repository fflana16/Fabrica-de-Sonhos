import React, { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas } from '../SistemasContext';
import { toast } from 'sonner';
import { InputField } from '../components/InputField';
import { 
  Settings, DollarSign, Save, CheckCircle2, Clock
} from 'lucide-react';

export const CustoMaquina = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { configuracoes, updateConfiguracoes } = useSistemas();

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
    toast.success('Custo de máquina atualizado com sucesso!', {
      icon: <CheckCircle2 className="text-gold" />,
    });
    onNavigate('Dashboard');
  };

  return (
    <PageLayout title="Custo de Máquina" onBack={() => onNavigate('Dashboard')}>
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
              Salvar Custo
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
};
