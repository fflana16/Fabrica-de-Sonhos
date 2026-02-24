import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas } from '../SistemasContext';
import { toast } from 'sonner';
import { 
  Package, Hash, Clock, DollarSign, Save, CheckCircle2, Trash2, Timer, Scissors, Plus
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

export const CadastroLaser = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { 
    produtosLaser, addProdutoLaser, updateProdutoLaser, removerProdutoLaser, 
    produtoLaserParaEditar, setProdutoLaserParaEditar, 
    materiasPrimas, setMateriaPrimaParaEditar,
    configuracoes, custosFixos,
    currentUser 
  } = useSistemas();

  const [codigo, setCodigo] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    materiaPrimaCodigo: '',
    largura: '',
    altura: '',
    tempoMaquina: '',
    tempoPintura: '',
    tempoMontagem: '',
    status: 'ATIVO',
    operador: currentUser?.nome || '',
    inicioValidadeCusto: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (produtoLaserParaEditar) {
      const ultimoHistorico = produtoLaserParaEditar.historicoCustos?.[produtoLaserParaEditar.historicoCustos.length - 1];
      setCodigo(produtoLaserParaEditar.codigo);
      setFormData({
        nome: produtoLaserParaEditar.nome,
        materiaPrimaCodigo: produtoLaserParaEditar.materiaPrimaCodigo,
        largura: String(produtoLaserParaEditar.largura),
        altura: String(produtoLaserParaEditar.altura),
        tempoMaquina: String(produtoLaserParaEditar.tempoMaquina),
        tempoPintura: String(produtoLaserParaEditar.tempoPintura || ''),
        tempoMontagem: String(produtoLaserParaEditar.tempoMontagem || ''),
        status: produtoLaserParaEditar.status || 'ATIVO',
        operador: currentUser?.nome || '',
        inicioValidadeCusto: ultimoHistorico?.data || produtoLaserParaEditar.dataCadastro
      });
    } else {
      const nextId = produtosLaser.length + 1;
      setCodigo(`LASER${String(nextId).padStart(5, '0')}`);
      setFormData({
        nome: '',
        materiaPrimaCodigo: '',
        largura: '',
        altura: '',
        tempoMaquina: '',
        tempoPintura: '',
        tempoMontagem: '',
        status: 'ATIVO',
        operador: currentUser?.nome || '',
        inicioValidadeCusto: dataFormatada
      });
    }
  }, [produtoLaserParaEditar, produtosLaser.length, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    if (['largura', 'altura', 'tempoMaquina', 'tempoPintura', 'tempoMontagem'].includes(name)) {
      newValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {};
    if (!formData.nome.trim()) newErrors.nome = true;
    if (!formData.materiaPrimaCodigo) newErrors.materiaPrimaCodigo = true;
    if (!formData.largura) newErrors.largura = true;
    if (!formData.altura) newErrors.altura = true;
    if (!formData.tempoMaquina) newErrors.tempoMaquina = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Preencha os campos obrigatórios corretamente.');
      return;
    }

    const mp = materiasPrimas.find(m => m.codigo === formData.materiaPrimaCodigo);
    const largura = parseInt(formData.largura) || 0;
    const altura = parseInt(formData.altura) || 0;
    const custoInsumo = mp ? (largura * altura) * mp.custoPorMm2 : 0;
    const custoMinutoMaquina = configuracoes.custoHoraMaquina / 60;
    const custoMaquina = parseInt(formData.tempoMaquina) * custoMinutoMaquina;
    
    const totalCustosFixos = custosFixos.reduce((acc, curr) => acc + curr.valor, 0);
    const custoMinutoFixo = totalCustosFixos / (220 * 60);
    
    const custoPintura = (formData.tempoPintura ? parseInt(formData.tempoPintura) : 0) * custoMinutoFixo;
    const custoMontagem = (formData.tempoMontagem ? parseInt(formData.tempoMontagem) : 0) * custoMinutoFixo;
    const custoTotal = custoInsumo + custoMaquina + custoPintura + custoMontagem;

    const produtoData: any = {
      codigo,
      nome: formData.nome,
      materiaPrimaCodigo: formData.materiaPrimaCodigo,
      largura: parseInt(formData.largura),
      altura: parseInt(formData.altura),
      tempoMaquina: parseInt(formData.tempoMaquina),
      tempoPintura: formData.tempoPintura ? parseInt(formData.tempoPintura) : 0,
      tempoMontagem: formData.tempoMontagem ? parseInt(formData.tempoMontagem) : 0,
      status: formData.status
    };

    if (produtoLaserParaEditar) {
      updateProdutoLaser(codigo, { ...produtoLaserParaEditar, ...produtoData }, formData.operador, custoTotal);
      toast.success('Produto Atualizado com Sucesso!', {
        icon: <CheckCircle2 className="text-gold" />,
      });
    } else {
      addProdutoLaser(produtoData, custoTotal);
      toast.success('Produto Cadastrado com Sucesso!', {
        icon: <CheckCircle2 className="text-gold" />,
      });
    }

    setProdutoLaserParaEditar(null);
    onNavigate('RelatorioLaser');
  };

  const confirmDelete = () => {
    if (!produtoLaserParaEditar) return;
    removerProdutoLaser(produtoLaserParaEditar.codigo);
    toast.success('Produto marcado como ELIMINADO.');
    setProdutoLaserParaEditar(null);
    setShowDeleteModal(false);
    onNavigate('RelatorioLaser');
  };

  const handleNewMateriaPrima = () => {
    setMateriaPrimaParaEditar(null);
    onNavigate('CadastroMateriaPrima');
  };

  return (
    <PageLayout title={produtoLaserParaEditar ? "Editar Produto Laser" : "Cadastro de Produto Laser"} onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-4xl mx-auto relative mt-8">
        
        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl flex flex-col gap-6 shadow-xl border border-gold/20 relative bg-white/10 backdrop-blur-md">
          {produtoLaserParaEditar && (
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
            <InputField icon={Package} label="Nome do Produto" name="nome" value={formData.nome} onChange={handleChange} error={errors.nome} required placeholder="Ex: Topo de Bolo" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-medium text-gray-700 ml-1 flex items-center gap-1">
                Matéria Prima Utilizada <span className="text-gold">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-gold-dark/60">
                  <Package size={16} />
                </div>
                <select
                  name="materiaPrimaCodigo"
                  value={formData.materiaPrimaCodigo}
                  onChange={handleChange}
                  className={`w-full bg-white/40 backdrop-blur-sm border ${errors.materiaPrimaCodigo ? 'border-red-400 ring-1 ring-red-400' : 'border-gold/30'} rounded-xl py-2 pl-9 pr-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60 appearance-none`}
                >
                  <option value="">Selecione a Matéria Prima</option>
                  {materiasPrimas.filter(mp => mp.status === 'ATIVO').map(mp => (
                    <option key={mp.codigo} value={mp.codigo}>{mp.nome}</option>
                  ))}
                </select>
              </div>
              {errors.materiaPrimaCodigo && <span className="text-[10px] text-red-500 ml-1">Campo obrigatório</span>}
            </div>
            <button 
              type="button"
              onClick={handleNewMateriaPrima}
              className="flex items-center justify-center gap-2 bg-gold/10 text-gold-dark px-4 py-2 rounded-xl border border-gold/30 hover:bg-gold/20 transition-all text-xs font-bold h-[38px]"
            >
              <Plus size={16} />
              Nova Matéria Prima
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField icon={Timer} label="Largura (mm)" name="largura" value={formData.largura} onChange={handleChange} error={errors.largura} required placeholder="0" />
            <InputField icon={Timer} label="Altura (mm)" name="altura" value={formData.altura} onChange={handleChange} error={errors.altura} required placeholder="0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField icon={Timer} label="Tempo de Máquina (min)" name="tempoMaquina" value={formData.tempoMaquina} onChange={handleChange} error={errors.tempoMaquina} required placeholder="0" />
            <InputField icon={Timer} label="Tempo de Pintura (min)" name="tempoPintura" value={formData.tempoPintura} onChange={handleChange} placeholder="0" />
            <InputField icon={Timer} label="Tempo de Montagem (min)" name="tempoMontagem" value={formData.tempoMontagem} onChange={handleChange} placeholder="0" />
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
              {produtoLaserParaEditar ? "Salvar Alterações" : "Cadastrar Produto"}
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
