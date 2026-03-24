import React, { useState } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Cliente } from '../SistemasContext';
import { 
  Search, Plus, Eye, Trash2, Edit, X, Filter, SortAsc, Calendar as CalendarIcon, MapPin, User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';

const DetalhesModal = ({ cliente, onClose }: { cliente: Cliente, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
    <div className="bg-white/95 backdrop-blur-xl w-full max-w-2xl rounded-[2.5rem] p-10 shadow-2xl border border-gold/40 relative animate-in fade-in zoom-in duration-300">
      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-gold/10 text-gold-dark transition-all hover:scale-110"
      >
        <X size={28} />
      </button>

      <div className="flex items-center gap-6 mb-10 border-b border-gold/30 pb-8">
        <div className="w-20 h-20 rounded-full bg-gold/15 flex items-center justify-center border-2 border-gold/40 shadow-inner">
          <span className="font-serif text-3xl font-bold text-gold-dark">{cliente.nome.charAt(0)}</span>
        </div>
        <div>
          <h3 className="text-3xl font-serif font-bold text-gold-dark mb-1">{cliente.nome}</h3>
          <p className="text-sm text-slate-500 font-semibold tracking-widest uppercase">
            <span className="text-gold-dark">{cliente.codigo}</span> • Cadastrado em {cliente.dataCadastro}
          </p>
          {cliente.operadorUltimaModificacao && (
            <p className="text-[10px] text-gold-dark/70 font-bold uppercase mt-1">
              Última modificação por: {cliente.operadorUltimaModificacao}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h4 className="text-xs font-black text-gold-dark uppercase tracking-[0.2em] border-l-4 border-gold pl-3">Informações Pessoais</h4>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Data de Nascimento</span>
              <p className="text-base text-slate-800 font-medium">{cliente.dataNascimento}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">CPF / CNPJ</span>
              <p className="text-base text-slate-800 font-medium">{cliente.cpfCnpj || 'Não informado'}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">WhatsApp</span>
              <p className="text-base text-slate-800 font-medium">{cliente.whatsapp}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Instagram</span>
              <p className="text-base text-slate-800 font-medium">{cliente.instagram || 'Não informado'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-black text-gold-dark uppercase tracking-[0.2em] border-l-4 border-gold pl-3">Endereço Completo</h4>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Logradouro</span>
              <p className="text-base text-slate-800 font-medium">{cliente.endereco}, {cliente.numero}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Bairro / Complemento</span>
              <p className="text-base text-slate-800 font-medium">{cliente.complemento ? `${cliente.complemento} • ` : ''}{cliente.bairro}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Cidade / Estado</span>
              <p className="text-base text-slate-800 font-medium">{cliente.cidade} - {cliente.estado}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">CEP</span>
              <p className="text-base text-slate-800 font-medium">{cliente.cep}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const RelatorioClientes = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { clientes, excluirCliente, setClienteParaEditar, orcamentos, pedidos } = useSistemas();
  const [searchTerm, setSearchTerm] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);
  
  // Novos estados para Filtro e Ordenação
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'ELIMINADO' | 'TODOS'>('ATIVO');
  const [sortBy, setSortBy] = useState<'nome' | 'bairro' | 'cidade' | 'aniversario'>('nome');

  const filteredAndSortedClientes = clientes
    .filter(cliente => {
      // Filtro de Status
      const matchesStatus = statusFilter === 'TODOS' || cliente.status === statusFilter;
      
      // Filtro de Busca
      const matchesSearch = 
        cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.cpfCnpj && cliente.cpfCnpj.includes(searchTerm));
      
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'nome') {
        return a.nome.localeCompare(b.nome);
      }
      if (sortBy === 'bairro') {
        return (a.bairro || '').localeCompare(b.bairro || '');
      }
      if (sortBy === 'cidade') {
        return (a.cidade || '').localeCompare(b.cidade || '');
      }
      if (sortBy === 'aniversario') {
        // Regra Especial: Ignorar o ano (DD/MM/YYYY)
        const parseDate = (dateStr: string) => {
          const [day, month] = dateStr.split('/').map(Number);
          return month * 100 + day; // Peso para ordenação MM DD
        };
        return parseDate(a.dataNascimento) - parseDate(b.dataNascimento);
      }
      return 0;
    });

  const handleEdit = (cliente: Cliente) => {
    if (cliente.status === 'ELIMINADO') return;
    setClienteParaEditar(cliente);
    onNavigate('CadastroClientes');
  };

  const handleDeleteClick = (e: React.MouseEvent, cliente: Cliente) => {
    e.preventDefault();
    e.stopPropagation();

    if (cliente.status === 'ELIMINADO') return;

    // Trava de segurança: verificar se possui orçamentos ou pedidos
    const temOrcamento = (orcamentos || []).some(o => o.clienteCodigo === cliente.codigo);
    const temPedido = (pedidos || []).some(p => p.clienteCodigo === cliente.codigo);

    if (temOrcamento || temPedido) {
      toast.error('Não é possível excluir: este cliente possui histórico de pedidos/orçamentos.');
      return;
    }

    setClienteParaExcluir(cliente);
  };

  const confirmDelete = () => {
    if (!clienteParaExcluir) return;
    
    try {
      excluirCliente(clienteParaExcluir.codigo);
      toast.success(`O cadastro de ${clienteParaExcluir.nome} foi eliminado.`);
    } catch (error) {
      toast.error('Erro ao eliminar o cadastro.');
    } finally {
      setClienteParaExcluir(null);
    }
  };

  return (
    <PageLayout title="Relatório de Clientes" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 w-full">
          <div className="flex flex-col gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-dark/60">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar cliente por nome, código ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/40 backdrop-blur-sm border border-gold/30 rounded-full py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:outline-none focus:border-gold transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 w-full md:w-auto">
            <button 
              onClick={() => { setClienteParaEditar(null); onNavigate('CadastroClientes'); }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold-dark to-gold text-white px-5 py-2 rounded-full font-bold tracking-wide transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-xs"
            >
              <Plus size={16} />
              Novo Cliente
            </button>

            <div className="flex flex-wrap items-center justify-end gap-3">
              {/* Seletor de Status (Caixa de Seleção) */}
              <div className="relative flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-gold/20 shadow-sm">
                <Filter size={16} className="text-gold-dark" />
                <select 
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gold-dark focus:outline-none cursor-pointer"
                >
                  <option value="ATIVO">Filtrar: Ativos</option>
                  <option value="ELIMINADO">Filtrar: Eliminados</option>
                  <option value="TODOS">Filtrar: Todos</option>
                </select>
              </div>

              {/* Seletor de Ordenação */}
              <div className="relative flex items-center gap-2 bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-gold/20 shadow-sm">
                <SortAsc size={16} className="text-gold-dark" />
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gold-dark focus:outline-none cursor-pointer"
                >
                  <option value="nome">Ordenar por Nome</option>
                  <option value="bairro">Ordenar por Bairro</option>
                  <option value="cidade">Ordenar por Cidade</option>
                  <option value="aniversario">Próximos Aniversários</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-gold/20">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gold/10 border-b border-gold/20">
                  <th className="py-3 px-4 font-serif font-semibold text-gold-dark tracking-wide text-sm">Código</th>
                  <th className="py-3 px-4 font-serif font-semibold text-gold-dark tracking-wide text-sm">Nome</th>
                  <th className="py-3 px-4 font-serif font-semibold text-gold-dark tracking-wide text-sm">Localização</th>
                  <th className="py-3 px-4 font-serif font-semibold text-gold-dark tracking-wide text-sm">WhatsApp</th>
                  <th className="py-3 px-4 font-serif font-semibold text-gold-dark tracking-wide text-sm">Aniversário</th>
                  <th className="py-3 px-4 font-serif font-semibold text-gold-dark tracking-wide text-sm">Status</th>
                  <th className="py-3 px-4 font-serif font-semibold text-gold-dark tracking-wide text-sm text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedClientes.map((cliente) => {
                  const isEliminado = cliente.status === 'ELIMINADO';
                  return (
                    <tr key={cliente.codigo} className={`border-b border-gold/10 hover:bg-white/20 transition-all duration-300 group ${isEliminado ? 'bg-red-50/30' : ''}`}>
                      <td className={`py-3 px-4 text-[11px] font-medium ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>{cliente.codigo}</td>
                      <td className={`py-3 px-4 text-[11px] font-semibold flex items-center gap-2 ${isEliminado ? 'text-red-600' : 'text-gray-800'}`}>
                        <UserIcon size={14} className={isEliminado ? 'text-red-400' : 'text-gold'} />
                        {cliente.nome}
                        {isEliminado && (
                          <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">ELIMINADO</span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-[11px] ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>
                        <div className="flex flex-col">
                          <span className="font-bold">{cliente.bairro || '-'}</span>
                          <span className="text-[10px] opacity-70 uppercase tracking-tighter">{cliente.cidade || '-'}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-[11px] ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>{cliente.whatsapp}</td>
                      <td className={`py-3 px-4 text-[11px] ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={14} className="opacity-50" />
                          {cliente.dataNascimento}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${isEliminado ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                          {isEliminado ? 'Eliminado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setClienteSelecionado(cliente)}
                          className={`p-1.5 rounded-lg transition-colors ${isEliminado ? 'text-red-600 hover:bg-red-100' : 'text-gold-dark hover:bg-gold/20'}`} 
                          title="Visualizar"
                        >
                          <Eye size={16} />
                        </button>
                        {!isEliminado && (
                          <>
                            <button 
                              onClick={() => handleEdit(cliente)}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => handleDeleteClick(e, cliente)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300" 
                              title="Eliminar Cadastro"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAndSortedClientes.length === 0 && (
          <div className="p-12 text-center glass-panel rounded-3xl border border-gold/20">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Filter size={48} className="opacity-20" />
              <p className="font-serif italic">Nenhum cliente encontrado com os filtros aplicados.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {clienteParaExcluir && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900">Confirmar Exclusão</h3>
              <p className="text-gray-600">
                Deseja realmente eliminar o cadastro de <span className="font-bold text-gray-800">{clienteParaExcluir.nome}</span>? 
                Esta ação não pode ser desfeita, mas o registro permanecerá no histórico como ELIMINADO.
              </p>
              <div className="flex gap-3 w-full mt-6">
                <button 
                  onClick={() => setClienteParaExcluir(null)}
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

      {clienteSelecionado && (
        <DetalhesModal 
          cliente={clienteSelecionado} 
          onClose={() => setClienteSelecionado(null)} 
        />
      )}
    </PageLayout>
  );
};
