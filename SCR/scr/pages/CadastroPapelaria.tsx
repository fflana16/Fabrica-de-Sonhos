import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas } from '../SistemasContext';
import { toast } from 'sonner';
import { 
  Package, Hash, Clock, DollarSign, Save, CheckCircle2, Trash2, Timer
} from 'lucide-react';

const InputField = ({ icon: Icon, label, name, value, onChange, required = false, readOnly = false, placeholder = '', type = 'text', error }: any) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1">
      {label} {required && <span className="text-gold">*</span>}
    </label>
    <div className="relative flex items-center">
      <div className="absolute left-3 text-gold-dark/60">
        <Icon size={16} />
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full bg-white/40 backdrop-blur-sm border ${error ? 'border-red-400 ring-1 ring-red-400' : 'border-gold/30'} rounded-xl py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all ${readOnly ? 'opacity-70 cursor-not-allowed bg-gray-50/50' : 'hover:bg-white/60'}`}
      />
    </div>
    {error && <span className="text-[10px] text-red-500 ml-1">Campo obrigatório</span>}
  </div>
);

export const CadastroPapelaria = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { produtosPapelaria, addProdutoPapelaria, updateProdutoPapelaria, removerProdutoPapelaria, produtoPapelariaParaEditar, setProdutoPapelariaParaEditar, currentUser } = useSistemas();

  const [codigo, setCodigo] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    tempoFabricacao: '',
    custoFabricacao: '',
    precoVendaSugerido: '',
    status: 'ATIVO',
    operador: currentUser?.nome || '',
    inicioValidadeCusto: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (produtoPapelariaParaEditar) {
      const ultimoHistorico = produtoPapelariaParaEditar.historicoCustos?.[produtoPapelariaParaEditar.historicoCustos.length - 1];
      setCodigo(produtoPapelariaParaEditar.codigo);
      setFormData({
        nome: produtoPapelariaParaEditar.nome,
        tempoFabricacao: String(produtoPapelariaParaEditar.tempoFabricacao),
        custoFabricacao: maskCurrency(String(produtoPapelariaParaEditar.custoFabricacao * 100)),
        precoVendaSugerido: maskCurrency(String(produtoPapelariaParaEditar.precoVendaSugerido * 100)),
        status: produtoPapelariaParaEditar.status || 'ATIVO',
        operador: currentUser?.nome || '',
        inicioValidadeCusto: ultimoHistorico?.data || produtoPapelariaParaEditar.dataCadastro
      });
    } else {
      const nextId = produtosPapelaria.length + 1;
      setCodigo(`PAP${String(nextId).padStart(5, '0')}`);
      setFormData({
        nome: '',
        tempoFabricacao: '',
        custoFabricacao: '',
        precoVendaSugerido: '',
        status: 'ATIVO',
        operador: currentUser?.nome || '',
        inicioValidadeCusto: dataFormatada
      });
    }
  }, [produtoPapelariaParaEditar, produtosPapelaria.length, currentUser]);

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
    let newValue = value;

    if (name === 'custoFabricacao' || name === 'precoVendaSugerido') {
      newValue = maskCurrency(value);
    } else if (name === 'tempoFabricacao') {
      newValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const parseCurrency = (val: string) => parseFloat(val.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {};
    if (!formData.nome.trim()) newErrors.nome = true;
    if (!formData.tempoFabricacao) newErrors.tempoFabricacao = true;
    if (!formData.custoFabricacao) newErrors.custoFabricacao = true;
    if (!formData.precoVendaSugerido) newErrors.precoVendaSugerido = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Preencha os campos corretamente.');
      return;
    }

    const produtoData: any = {
      codigo,
      nome: formData.nome,
      tempoFabricacao: parseInt(formData.tempoFabricacao),
      custoFabricacao: parseCurrency(formData.custoFabricacao),
      precoVendaSugerido: parseCurrency(formData.precoVendaSugerido),
      status: formData.status
    };

    if (produtoPapelariaParaEditar) {
      updateProdutoPapelaria(codigo, { ...produtoPapelariaParaEditar, ...produtoData }, formData.operador);
      toast.success('Produto Atualizado com Sucesso!', {
        icon: <CheckCircle2 className="text-gold" />,
      });
    } else {
      addProdutoPapelaria(produtoData);
      toast.success('Produto Cadastrado com Sucesso!', {
        icon: <CheckCircle2 className="text-gold" />,
      });
    }

    setProdutoPapelariaParaEditar(null);
    onNavigate('RelatorioPapelaria');
  };

  const confirmDelete = () => {
    if (!produtoPapelariaParaEditar) return;
    removerProdutoPapelaria(produtoPapelariaParaEditar.codigo);
    toast.success('Produto marcado como ELIMINADO.');
    setProdutoPapelariaParaEditar(null);
    setShowDeleteModal(false);
    onNavigate('RelatorioPapelaria');
  };

  return (
    <PageLayout title={produtoPapelariaParaEditar ? "Editar Produto de Papelaria" : "Cadastro de Produto de Papelaria"} onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-4xl mx-auto relative mt-8">
        
        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl flex flex-col gap-6 shadow-xl border border-gold/20 relative bg-white/10 backdrop-blur-md">
          {produtoPapelariaParaEditar && (
            <button 
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="absolute -top-12 right-0 p-2 text-red-400 hover:text-red-600 transition-all"
              title="Excluir Produto"
            >
              <Trash2 size={24} />
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gold/20">
            <InputField icon={Hash} label="Código" name="codigo" value={codigo} readOnly />
            <InputField icon={Package} label="Nome do Produto" name="nome" value={formData.nome} onChange={handleChange} error={errors.nome} required placeholder="Ex: Caderno Personalizado" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField icon={Timer} label="Tempo de Fabricação (min)" name="tempoFabricacao" value={formData.tempoFabricacao} onChange={handleChange} error={errors.tempoFabricacao} required placeholder="0" />
            <InputField icon={DollarSign} label="Custo Unitário (R$)" name="custoFabricacao" value={formData.custoFabricacao} onChange={handleChange} error={errors.custoFabricacao} required placeholder="R$ 0,00" />
            <InputField icon={DollarSign} label="Preço de Venda Sugerido (R$)" name="precoVendaSugerido" value={formData.precoVendaSugerido} onChange={handleChange} error={errors.precoVendaSugerido} required placeholder="R$ 0,00" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gold/20">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1">
                Status
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gold-dark/60">
                  <CheckCircle2 size={16} />
                </div>
                <input
                  type="text"
                  value={formData.status}
                  readOnly
                  className="w-full bg-gray-50/50 backdrop-blur-sm border border-gold/30 rounded-xl py-2 pl-9 pr-3 text-sm text-gray-500 cursor-not-allowed opacity-70"
                />
              </div>
            </div>
            <InputField 
              icon={CheckCircle2} 
              label="Operador Responsável" 
              name="operador" 
              value={formData.operador} 
              readOnly
              placeholder="Nome do operador logado" 
            />
            <InputField 
              icon={Clock} 
              label="Início Validade Custo" 
              name="inicioValidadeCusto" 
              value={formData.inicioValidadeCusto} 
              readOnly
              placeholder="Data e horário do sistema" 
            />
          </div>

          <div className="flex justify-center mt-4">
            <button 
              type="submit"
              className="bg-gradient-to-r from-gold-dark to-gold text-white px-12 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/20"
            >
              <Save size={20} />
              {produtoPapelariaParaEditar ? "Salvar Alterações" : "Cadastrar Produto"}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900">Confirmar Exclusão</h3>
              <p className="text-gray-600">
                Deseja realmente eliminar o cadastro do produto <span className="font-bold text-gray-800">{formData.nome}</span>? 
                O registro permanecerá no histórico como ELIMINADO.
              </p>
              <div className="flex gap-3 w-full mt-6">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
