import React, { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, CustoFixo } from '../SistemasContext';
import { toast } from 'sonner';
import { InputField } from '../components/InputField';
import { 
  DollarSign, Save, Plus, Trash2, Edit, X, CheckCircle2, TrendingUp
} from 'lucide-react';
export const CustosFixos = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { custosFixos, addCustoFixo, updateCustoFixo, removerCustoFixo } = useSistemas();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nome: '', valor: '' });

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
    if (name === 'valor') {
      setFormData(prev => ({ ...prev, valor: maskCurrency(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = () => {
    if (!formData.nome.trim() || !formData.valor) {
      toast.error('Preencha todos os campos.');
      return;
    }

    const valorNum = parseFloat(formData.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;

    if (editingId) {
      updateCustoFixo(editingId, { nome: formData.nome, valor: valorNum });
      toast.success('Custo atualizado!');
    } else {
      addCustoFixo({ nome: formData.nome, valor: valorNum });
      toast.success('Custo adicionado!');
    }

    setFormData({ nome: '', valor: '' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (c: CustoFixo) => {
    setFormData({ nome: c.nome, valor: maskCurrency(String(c.valor * 100)) });
    setEditingId(c.id);
    setIsAdding(true);
  };

  const totalCustos = custosFixos.reduce((acc, curr) => acc + curr.valor, 0);

  return (
    <PageLayout title="Gestão de Custos Fixos" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col gap-6">
        
        <div className="flex justify-between items-center">
          <div className="bg-gold/10 px-6 py-3 rounded-2xl border border-gold/30 flex items-center gap-4">
            <TrendingUp className="text-gold-dark" size={24} />
            <div>
              <p className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Total de Custos Fixos</p>
              <p className="text-2xl font-mono font-black text-gold-dark">R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-gold-dark to-gold text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/20"
            >
              <Plus size={20} />
              Cadastrar Novo Custo
            </button>
          )}
        </div>

        {isAdding && (
          <div className="glass-panel p-6 rounded-3xl border border-gold/40 bg-white/20 backdrop-blur-md animate-in slide-in-from-top duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif font-bold text-gold-dark text-lg">{editingId ? 'Editar Custo' : 'Novo Custo'}</h3>
              <button onClick={() => { setIsAdding(false); setEditingId(null); setFormData({ nome: '', valor: '' }); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <InputField icon={Edit} label="Nome do Item" name="nome" value={formData.nome} onChange={handleChange} placeholder="Ex: Aluguel" />
              <div className="flex gap-2 items-end">
                <InputField icon={DollarSign} label="Valor (R$)" name="valor" value={formData.valor} onChange={handleChange} placeholder="R$ 0,00" />
                <button 
                  onClick={handleSave}
                  className="bg-gold-dark text-white p-2.5 rounded-xl hover:bg-gold transition-colors shrink-0"
                >
                  <Save size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-gold/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gold/15 border-b border-gold/20">
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Item</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Valor</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Última Alteração</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {custosFixos.map((c) => (
                <tr key={c.id} className="border-b border-gold/10 hover:bg-white/30 transition-colors group">
                  <td className="py-4 px-6 text-sm font-semibold text-gray-800">{c.nome}</td>
                  <td className="py-4 px-6 text-sm font-mono font-bold text-gold-dark">R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-6 text-xs text-gray-500">{c.dataUltimaAlteracao}</td>
                  <td className="py-4 px-6 flex justify-center gap-2">
                    <button onClick={() => handleEdit(c)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => removerCustoFixo(c.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
};
