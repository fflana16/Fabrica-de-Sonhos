import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas } from '../SistemasContext';
import { toast } from 'sonner';
import { InputField } from '../components/InputField';
import { 
  Package, Hash, Ruler, DollarSign, Save, CheckCircle2, Calculator, Trash2, Clock
} from 'lucide-react';
export const CadastroMateriaPrima = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { materiasPrimas, addMateriaPrima, updateMateriaPrima, removerMateriaPrima, materiaPrimaParaEditar, setMateriaPrimaParaEditar, currentUser } = useSistemas();

  const [codigo, setCodigo] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    largura: '',
    altura: '',
    custoChapa: '',
    status: 'ATIVO',
    operador: currentUser?.nome || '',
    inicioValidadeCusto: ''
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (materiaPrimaParaEditar) {
      const ultimoHistorico = materiaPrimaParaEditar.historicoCustos?.[materiaPrimaParaEditar.historicoCustos.length - 1];
      setCodigo(materiaPrimaParaEditar.codigo);
      setFormData({
        nome: materiaPrimaParaEditar.nome,
        largura: String(materiaPrimaParaEditar.largura),
        altura: String(materiaPrimaParaEditar.altura),
        custoChapa: maskCurrency(String(materiaPrimaParaEditar.custoChapa * 100)),
        status: materiaPrimaParaEditar.status || 'ATIVO',
        operador: currentUser?.nome || '',
        inicioValidadeCusto: ultimoHistorico?.data || materiaPrimaParaEditar.dataCadastro
      });
    } else {
      const nextId = materiasPrimas.length + 1;
      setCodigo(`MP${String(nextId).padStart(5, '0')}`);
      setFormData({
        nome: '',
        largura: '',
        altura: '',
        custoChapa: '',
        status: 'ATIVO',
        operador: currentUser?.nome || '',
        inicioValidadeCusto: dataFormatada
      });
    }
  }, [materiaPrimaParaEditar, materiasPrimas.length, currentUser]);

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

    if (name === 'custoChapa') {
      newValue = maskCurrency(value);
    } else if (name === 'largura' || name === 'altura') {
      newValue = value.replace(/\D/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const larguraNum = parseFloat(formData.largura) || 0;
  const alturaNum = parseFloat(formData.altura) || 0;
  const areaTotal = larguraNum * alturaNum;
  const custoNum = parseFloat(formData.custoChapa.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
  const custoPorMm2 = areaTotal > 0 ? (custoNum / areaTotal) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, boolean> = {};
    if (!formData.nome.trim()) newErrors.nome = true;
    if (!formData.largura || larguraNum <= 0) newErrors.largura = true;
    if (!formData.altura || alturaNum <= 0) newErrors.altura = true;
    if (!formData.custoChapa || custoNum <= 0) newErrors.custoChapa = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Preencha os campos corretamente.');
      return;
    }

    const mpData: any = {
      codigo,
      nome: formData.nome,
      largura: larguraNum,
      altura: alturaNum,
      custoChapa: custoNum,
      areaTotal,
      custoPorMm2,
      status: formData.status
    };

    if (materiaPrimaParaEditar) {
      updateMateriaPrima(codigo, { ...materiaPrimaParaEditar, ...mpData }, formData.operador);
      toast.success('Matéria-Prima Atualizada com Sucesso!', {
        icon: <CheckCircle2 className="text-gold" />,
      });
    } else {
      addMateriaPrima(mpData);
      toast.success('Matéria-Prima Cadastrada com Sucesso!', {
        icon: <CheckCircle2 className="text-gold" />,
      });
    }

    setMateriaPrimaParaEditar(null);
    onNavigate('RelatorioMateriaPrima');
  };

  const confirmDelete = () => {
    if (!materiaPrimaParaEditar) return;
    removerMateriaPrima(materiaPrimaParaEditar.codigo);
    toast.success('Matéria-prima marcada como ELIMINADA.');
    setMateriaPrimaParaEditar(null);
    setShowDeleteModal(false);
    onNavigate('RelatorioMateriaPrima');
  };

  return (
    <PageLayout title={materiaPrimaParaEditar ? "Editar Matéria-Prima" : "Cadastro de Matéria-Prima"} onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 h-full items-stretch">
        
        <form onSubmit={handleSubmit} className="flex-1 glass-panel p-6 rounded-3xl flex flex-col gap-5 shadow-xl border border-gold/20 relative">
          {materiaPrimaParaEditar && (
            <button 
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="absolute -top-12 right-0 p-2 text-red-400 hover:text-red-600 transition-all"
              title="Excluir Matéria-Prima"
            >
              <Trash2 size={24} />
            </button>
          )}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gold/20">
            <InputField icon={Hash} label="Código" name="codigo" value={codigo} readOnly />
            <InputField icon={Package} label="Nome da Matéria-Prima" name="nome" value={formData.nome} onChange={handleChange} error={errors.nome} required placeholder="Ex: MDF Cru 3mm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField icon={Ruler} label="Largura (mm)" name="largura" value={formData.largura} onChange={handleChange} error={errors.largura} required placeholder="0" />
            <InputField icon={Ruler} label="Altura (mm)" name="altura" value={formData.altura} onChange={handleChange} error={errors.altura} required placeholder="0" />
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gold/20">
            <InputField icon={DollarSign} label="Custo da Chapa (R$)" name="custoChapa" value={formData.custoChapa} onChange={handleChange} error={errors.custoChapa} required placeholder="R$ 0,00" />
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
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gold/20">
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

          <div className="mt-auto pt-2">
            <button 
              type="submit"
              className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-gold-dark to-gold text-white px-6 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:-translate-y-0.5"
            >
              <Save size={18} />
              {materiaPrimaParaEditar ? "Salvar Alterações" : "Salvar Matéria-Prima"}
            </button>
          </div>
        </form>

        <div className="w-full md:w-72 glass-panel p-6 rounded-3xl flex flex-col gap-6 shadow-xl border border-gold/30 bg-gradient-to-b from-white/40 to-gold/5">
          <div className="flex items-center gap-2 text-gold-dark border-b border-gold/20 pb-3">
            <Calculator size={20} />
            <h3 className="font-serif font-bold text-lg">Cálculo de Custos</h3>
          </div>

          <div className="flex flex-col gap-5 flex-1 justify-center">
            <div className="flex flex-col gap-1 bg-white/50 p-4 rounded-2xl border border-gold/20 shadow-sm">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Área Total</span>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-mono font-bold text-gray-800">
                  {areaTotal.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm font-medium text-gray-500 mb-1">mm²</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 bg-gold/10 p-4 rounded-2xl border border-gold/40 shadow-sm relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-gold/20">
                <DollarSign size={64} />
              </div>
              <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider relative z-10">Custo por mm²</span>
              <div className="flex items-end gap-1 relative z-10">
                <span className="text-sm font-medium text-gold-dark mb-1">R$</span>
                <span className="text-3xl font-mono font-bold text-gold-dark">
                  {custoPorMm2.toFixed(6).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        </div>

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
                Deseja realmente excluir a matéria-prima <span className="font-bold text-gray-800">{formData.nome}</span>? 
                Esta ação removerá permanentemente o item do sistema.
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
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
