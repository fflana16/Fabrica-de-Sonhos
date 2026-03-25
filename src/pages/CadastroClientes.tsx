import React, { useState, useEffect } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Cliente } from '../SistemasContext';
import { toast } from 'sonner';
import { 
  User, 
  Calendar, 
  Phone, 
  Instagram, 
  CreditCard, 
  MapPin, 
  Hash, 
  ShieldCheck, 
  Trash2,
  Save,
  Building,
  Map
} from 'lucide-react';

// Helper para máscaras
const applyMask = (value: string, type: 'whatsapp' | 'cep' | 'cpfCnpj' | 'date') => {
  const digits = value.replace(/\D/g, '');
  
  if (type === 'whatsapp') {
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return digits.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  if (type === 'cep') {
    return digits.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  
  if (type === 'cpfCnpj') {
    if (digits.length <= 11) {
      return digits.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return digits.slice(0, 14).replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  if (type === 'date') {
    return digits.slice(0, 8).replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
  }
  
  return value;
};

const InputField = ({ 
  icon: Icon, 
  label, 
  name, 
  value, 
  onChange, 
  readOnly = false, 
  placeholder = '', 
  required = false,
  className = "",
  type = "text"
}: any) => (
  <div className={`flex flex-col gap-1.5 w-full ${className}`}>
    <label className="text-xs font-semibold text-gold-dark ml-1 flex items-center gap-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative flex items-center group">
      <div className="absolute left-3 text-gold-dark/60 group-focus-within:text-gold transition-colors">
        <Icon size={18} />
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        required={required}
        className={`w-full bg-white/5 backdrop-blur-md border border-gold/30 rounded-xl py-2.5 pl-10 pr-4 text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all placeholder:text-gray-400 ${readOnly ? 'opacity-70 cursor-not-allowed bg-gray-100/10' : 'hover:bg-white/10'}`}
      />
    </div>
  </div>
);

export const CadastroClientes = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { clientes, addCliente, updateCliente, excluirCliente, clienteParaEditar, setClienteParaEditar, currentUser } = useSistemas();
  
  const [codigo, setCodigo] = useState('');
  const [dataCadastro, setDataCadastro] = useState('');
  const [status, setStatus] = useState<'ATIVO' | 'ELIMINADO'>('ATIVO');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    dataNascimento: '',
    whatsapp: '',
    instagram: '',
    cpfCnpj: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    operador: currentUser?.nome || ''
  });

  useEffect(() => {
    if (clienteParaEditar) {
      setCodigo(clienteParaEditar.codigo);
      setDataCadastro(clienteParaEditar.dataCadastro);
      setStatus(clienteParaEditar.status || 'ATIVO');
      setFormData({
        nome: clienteParaEditar.nome,
        dataNascimento: clienteParaEditar.dataNascimento,
        whatsapp: clienteParaEditar.whatsapp,
        instagram: clienteParaEditar.instagram || '',
        cpfCnpj: clienteParaEditar.cpfCnpj || '',
        cep: clienteParaEditar.cep || '',
        endereco: clienteParaEditar.endereco || '',
        numero: clienteParaEditar.numero || '',
        complemento: clienteParaEditar.complemento || '',
        bairro: clienteParaEditar.bairro || '',
        cidade: clienteParaEditar.cidade || '',
        estado: clienteParaEditar.estado || '',
        operador: currentUser?.nome || ''
      });
    } else {
      // Gerar próximo código
      const nextId = clientes.length + 1;
      setCodigo(`Cli${String(nextId).padStart(5, '0')}`);
      setDataCadastro(new Date().toLocaleDateString('pt-BR'));
      setStatus('ATIVO');
      setFormData(prev => ({ ...prev, operador: currentUser?.nome || '' }));
    }
  }, [clienteParaEditar, clientes.length, currentUser]);

  const fetchAddressByCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado
      }));
      toast.success('Endereço preenchido automaticamente!');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar o CEP. Verifique sua conexão.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === 'whatsapp') maskedValue = applyMask(value, 'whatsapp');
    if (name === 'cep') {
      maskedValue = applyMask(value, 'cep');
      const cleanCep = maskedValue.replace(/\D/g, '');
      if (cleanCep.length === 8) {
        fetchAddressByCep(cleanCep);
      }
    }
    if (name === 'cpfCnpj') maskedValue = applyMask(value, 'cpfCnpj');
    if (name === 'dataNascimento') maskedValue = applyMask(value, 'date');

    setFormData(prev => ({ ...prev, [name]: maskedValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Normalização para comparação
    const normalize = (val: string) => val.replace(/\D/g, '');
    const nomeNormalizado = formData.nome.trim().toLowerCase();
    const whatsappNormalizado = normalize(formData.whatsapp);
    const cpfCnpjNormalizado = normalize(formData.cpfCnpj);

    // Validação de Duplicidade
    const duplicado = clientes.find(c => {
      // Ignorar o próprio cliente em caso de edição
      if (clienteParaEditar && c.codigo === clienteParaEditar.codigo) return false;
      
      // Não validar contra clientes eliminados (opcional, mas geralmente desejado)
      if (c.status === 'ELIMINADO') return false;

      const cNome = c.nome.trim().toLowerCase();
      const cWhatsapp = normalize(c.whatsapp);
      const cCpfCnpj = normalize(c.cpfCnpj || '');

      if (cNome === nomeNormalizado) {
        toast.error(`Erro: Já existe um cliente cadastrado com o nome "${c.nome}".`);
        return true;
      }

      if (cWhatsapp === whatsappNormalizado) {
        toast.error(`Erro: O WhatsApp "${formData.whatsapp}" já está vinculado ao cliente ${c.nome}.`);
        return true;
      }

      if (cpfCnpjNormalizado && cCpfCnpj === cpfCnpjNormalizado) {
        toast.error(`Erro: O CPF/CNPJ "${formData.cpfCnpj}" já está cadastrado para ${c.nome}.`);
        return true;
      }

      return false;
    });

    if (duplicado) return;
    
    const novoCliente: Cliente = {
      codigo,
      dataCadastro,
      status,
      ...formData
    };

    if (clienteParaEditar) {
      updateCliente(codigo, novoCliente);
      toast.success('Cadastro atualizado com sucesso!');
    } else {
      addCliente(novoCliente);
      toast.success('Cliente cadastrado com sucesso!');
    }

    setClienteParaEditar(null);
    onNavigate('RelatorioClientes');
  };

  const handleDeleteClick = () => {
    if (!clienteParaEditar) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    excluirCliente(codigo);
    toast.success('Status do cliente alterado para ELIMINADO');
    setClienteParaEditar(null);
    setShowDeleteModal(false);
    onNavigate('RelatorioClientes');
  };

  const handleBack = () => {
    setClienteParaEditar(null);
    onNavigate('Dashboard');
  };

  return (
    <PageLayout title={clienteParaEditar ? "Editar Cliente" : "Cadastro de Clientes"} onBack={handleBack}>
      <div className="w-full max-w-4xl mx-auto relative mt-16">
        
        {/* Botão Trash2 (Exclusão Lógica) */}
        {clienteParaEditar && status === 'ATIVO' && (
          <button 
            type="button"
            onClick={handleDeleteClick}
            className="absolute -top-12 right-0 text-red-500 transition-all hover:scale-110 p-2"
            title="Excluir Cliente"
          >
            <Trash2 size={28} />
          </button>
        )}

        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-3xl flex flex-col gap-8 shadow-2xl border border-gold/30 bg-white/10 backdrop-blur-md">
          
          {/* Seção: Informações de Controle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gold/20">
            <InputField 
              icon={Hash} 
              label="Código do Cliente" 
              name="codigo" 
              value={codigo} 
              readOnly 
            />
            <InputField 
              icon={Calendar} 
              label="Data do Cadastro" 
              name="dataCadastro" 
              value={dataCadastro} 
              readOnly 
            />
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-semibold text-gold-dark ml-1 flex items-center gap-1">
                Status do Cadastro
              </label>
              <div className="relative flex items-center">
                <div className={`absolute left-3 ${status === 'ELIMINADO' ? 'text-red-500' : 'text-gold-dark/60'}`}>
                  <ShieldCheck size={18} />
                </div>
                <div className={`w-full bg-white/5 backdrop-blur-md border border-gold/30 rounded-xl py-2.5 pl-10 pr-4 font-bold text-sm ${status === 'ELIMINADO' ? 'text-red-600' : 'text-gold-dark'}`}>
                  {status}
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Dados Pessoais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              icon={User} 
              label="Nome Completo" 
              name="nome" 
              value={formData.nome} 
              onChange={handleInputChange} 
              required 
              placeholder="Digite o nome completo"
            />
            <InputField 
              icon={Calendar} 
              label="Data de Nascimento" 
              name="dataNascimento" 
              value={formData.dataNascimento} 
              onChange={handleInputChange} 
              required 
              placeholder="DD/MM/AAAA"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              icon={Phone} 
              label="WhatsApp" 
              name="whatsapp" 
              value={formData.whatsapp} 
              onChange={handleInputChange} 
              required 
              placeholder="(99) 99999-9999"
            />
            <InputField 
              icon={Instagram} 
              label="Instagram" 
              name="instagram" 
              value={formData.instagram} 
              onChange={handleInputChange} 
              placeholder="@usuario"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              icon={CreditCard} 
              label="CPF / CNPJ" 
              name="cpfCnpj" 
              value={formData.cpfCnpj} 
              onChange={handleInputChange} 
              placeholder="000.000.000-00"
            />
            <InputField 
              icon={MapPin} 
              label="CEP" 
              name="cep" 
              value={formData.cep} 
              onChange={handleInputChange} 
              placeholder="00000-000"
            />
          </div>

          {/* Seção: Endereço */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField 
              icon={Map} 
              label="Endereço" 
              name="endereco" 
              value={formData.endereco} 
              onChange={handleInputChange} 
              className="md:col-span-2"
              placeholder="Rua, Avenida, etc."
            />
            <InputField 
              icon={Building} 
              label="Número" 
              name="numero" 
              value={formData.numero} 
              onChange={handleInputChange} 
              placeholder="123"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              icon={Building} 
              label="Complemento" 
              name="complemento" 
              value={formData.complemento} 
              onChange={handleInputChange} 
              placeholder="Apto, Bloco, etc."
            />
            <InputField 
              icon={MapPin} 
              label="Bairro" 
              name="bairro" 
              value={formData.bairro} 
              onChange={handleInputChange} 
              placeholder="Nome do bairro"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              icon={Building} 
              label="Cidade" 
              name="cidade" 
              value={formData.cidade} 
              onChange={handleInputChange} 
              placeholder="Cidade"
            />
            <InputField 
              icon={MapPin} 
              label="Estado" 
              name="estado" 
              value={formData.estado} 
              onChange={handleInputChange} 
              placeholder="UF"
            />
          </div>

          <div className="pb-4 border-b border-gold/20">
            <InputField 
              icon={ShieldCheck} 
              label="Operador Responsável" 
              name="operador" 
              value={formData.operador} 
              readOnly
              placeholder="Nome do operador logado" 
            />
          </div>

          {/* Botão Salvar */}
          <div className="flex justify-center mt-4">
            <button 
              type="submit"
              className="bg-gradient-to-r from-gold-dark to-gold text-white px-12 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/20"
            >
              <Save size={20} />
              {clienteParaEditar ? "Salvar Alterações" : "Cadastrar Cliente"}
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
                Deseja realmente eliminar o cadastro de <span className="font-bold text-gray-800">{formData.nome}</span>? 
                Esta ação não pode ser desfeita, mas o registro permanecerá no histórico como ELIMINADO.
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
