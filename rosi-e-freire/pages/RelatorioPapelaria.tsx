import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, ProdutoPapelaria } from '../SistemasContext';
import { toast } from 'sonner';
import { 
  Search, Plus, Eye, Trash2, Edit, X, Filter,
  ArrowUpDown, TrendingDown, TrendingUp, Package, Clock, DollarSign, Timer
} from 'lucide-react';

const DetalhesProdutoModal = ({ produto, onClose }: { produto: ProdutoPapelaria, onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
    <div className="bg-white/95 backdrop-blur-xl w-full max-w-3xl rounded-[2.5rem] p-10 shadow-2xl border border-gold/40 relative animate-in fade-in zoom-in duration-300">
      <button 
        onClick={onClose} 
        className="absolute top-8 right-8 p-2.5 rounded-full hover:bg-gold/10 text-gold-dark transition-all hover:scale-110"
      >
        <X size={28} />
      </button>

      <div className="flex items-center gap-6 mb-10 border-b border-gold/30 pb-8">
        <div className="w-20 h-20 rounded-full bg-gold/15 flex items-center justify-center border-2 border-gold/40 shadow-inner">
          <Package size={32} className="text-gold-dark" />
        </div>
        <div>
          <h3 className="text-3xl font-serif font-bold text-gold-dark mb-1">{produto.nome}</h3>
          <p className="text-sm text-slate-500 font-semibold tracking-widest uppercase">
            Código: <span className="text-gold-dark">{produto.codigo}</span> • Cadastrado em {produto.dataCadastro}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <h4 className="text-xs font-black text-gold-dark uppercase tracking-[0.2em] border-l-4 border-gold pl-3">Produção</h4>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Tempo de Fabricação</span>
              <p className="text-base text-slate-800 font-medium">{produto.tempoFabricacao} minutos</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-black text-gold-dark uppercase tracking-[0.2em] border-l-4 border-gold pl-3">Valores Atuais</h4>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Custo de Fabricação</span>
              <p className="text-base text-slate-800 font-medium">R$ {produto.custoFabricacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Preço de Venda Sugerido</span>
              <p className="text-base text-gold-dark font-bold">R$ {produto.precoVendaSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Início Validade Custo</span>
              <p className="text-sm text-slate-800 font-medium">
                {produto.historicoCustos?.[produto.historicoCustos.length - 1]?.data || produto.dataCadastro}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-wider">Operador Responsável</span>
              <p className="text-sm text-slate-800 font-medium">
                {produto.historicoCustos?.[produto.historicoCustos.length - 1]?.operador || 'Sistema'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-black text-gold-dark uppercase tracking-[0.2em] border-l-4 border-gold pl-3">Histórico de Custos</h4>
          <div className="max-h-48 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {(produto.historicoCustos || []).slice().reverse().map((h, idx) => (
              <div key={idx} className="bg-gold/5 p-2 rounded-lg border border-gold/10 text-[10px]">
                <div className="flex justify-between font-bold text-gold-dark mb-1">
                  <span>R$ {h.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <span>{h.data}</span>
                </div>
                <p className="text-slate-500 italic">Alt. por: {h.operador}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const RelatorioPapelaria = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { produtosPapelaria, removerProdutoPapelaria, setProdutoPapelariaParaEditar } = useSistemas();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ATIVO' | 'ELIMINADO' | 'TODOS'>('ATIVO');
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoPapelaria | null>(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<ProdutoPapelaria | null>(null);

  const filteredAndSortedProdutos = useMemo(() => {
    let result = produtosPapelaria.filter(p => {
      const matchesStatus = statusFilter === 'TODOS' || p.status === statusFilter;
      const matchesSearch = 
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });

    if (sortOrder === 'desc') {
      result.sort((a, b) => b.custoFabricacao - a.custoFabricacao);
    } else if (sortOrder === 'asc') {
      result.sort((a, b) => a.custoFabricacao - b.custoFabricacao);
    }

    return result;
  }, [produtosPapelaria, searchTerm, sortOrder, statusFilter]);

  const toggleSort = () => {
    if (sortOrder === null) setSortOrder('desc');
    else if (sortOrder === 'desc') setSortOrder('asc');
    else setSortOrder(null);
  };

  const handleEdit = (p: ProdutoPapelaria) => {
    if (p.status === 'ELIMINADO') return;
    setProdutoPapelariaParaEditar(p);
    onNavigate('CadastroPapelaria');
  };

  const confirmDelete = () => {
    if (!produtoParaExcluir) return;
    removerProdutoPapelaria(produtoParaExcluir.codigo);
    toast.success(`Produto "${produtoParaExcluir.nome}" marcado como ELIMINADO.`);
    setProdutoParaExcluir(null);
  };

  return (
    <PageLayout title="Relatório de Produtos de Papelaria" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-3 h-full overflow-hidden">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 w-full shrink-0">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-dark/60">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar por Nome ou Código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/40 backdrop-blur-sm border border-gold/30 rounded-full py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-500 focus:outline-none focus:border-gold transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center gap-2 bg-white/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-gold/20 shadow-sm">
              <Filter size={14} className="text-gold-dark" />
              <select 
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-gold-dark focus:outline-none cursor-pointer"
              >
                <option value="ATIVO">Filtrar: Ativos</option>
                <option value="ELIMINADO">Filtrar: Eliminados</option>
                <option value="TODOS">Filtrar: Todos</option>
              </select>
            </div>

            <button 
              onClick={toggleSort}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                sortOrder 
                  ? 'bg-gold/20 border-gold text-gold-dark shadow-sm' 
                  : 'bg-white/30 border-gold/30 text-gray-600 hover:bg-white/50'
              }`}
            >
              {sortOrder === 'desc' ? <TrendingDown size={12} /> : sortOrder === 'asc' ? <TrendingUp size={12} /> : <ArrowUpDown size={12} />}
              Custo
            </button>

            <button 
              onClick={() => { setProdutoPapelariaParaEditar(null); onNavigate('CadastroPapelaria'); }}
              className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-gold-dark to-gold text-white px-4 py-1.5 rounded-full font-bold tracking-wide transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-[10px]"
            >
              <Plus size={14} />
              Novo Produto
            </button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-gold/20 flex flex-col flex-grow min-h-0">
          <div className="overflow-y-auto custom-scrollbar flex-grow">
            <table className="w-full text-left border-collapse table-fixed">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gold/15 backdrop-blur-md border-b border-gold/20">
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] w-16">Código</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px]">Nome</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] w-20">Tempo (min)</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] w-20">Custo Unit.</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] w-20">Preço Venda</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] w-28">Início Validade</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] w-24">Operador</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] w-20">Status</th>
                  <th className="py-2 px-3 font-serif font-semibold text-gold-dark tracking-wide text-[10px] text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProdutos.map((p) => {
                  const isEliminado = p.status === 'ELIMINADO';
                  const ultimoHistorico = p.historicoCustos?.[p.historicoCustos.length - 1];
                  return (
                    <tr key={p.codigo} className={`border-b border-gold/10 hover:bg-white/20 transition-all duration-300 group ${isEliminado ? 'bg-red-50/30' : ''}`}>
                      <td className={`py-2 px-3 text-[10px] font-medium ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>{p.codigo}</td>
                      <td className={`py-2 px-3 text-[10px] font-semibold flex items-center gap-2 ${isEliminado ? 'text-red-600' : 'text-gray-800'}`}>
                        <Package size={12} className={isEliminado ? 'text-red-400' : 'text-gold'} />
                        <span className="truncate">{p.nome}</span>
                        {isEliminado && (
                          <span className="bg-red-600 text-white text-[7px] px-1 py-0.5 rounded font-black uppercase tracking-tighter shrink-0">ELIMINADO</span>
                        )}
                      </td>
                      <td className={`py-2 px-3 text-[10px] ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>{p.tempoFabricacao} min</td>
                      <td className={`py-2 px-3 text-[10px] ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>R$ {p.custoFabricacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className={`py-2 px-3 text-[10px] font-bold ${isEliminado ? 'text-red-600' : 'text-gold-dark'}`}>R$ {p.precoVendaSugerido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className={`py-2 px-3 text-[9px] ${isEliminado ? 'text-red-600' : 'text-gray-600'}`}>
                        {ultimoHistorico?.data || p.dataCadastro}
                      </td>
                      <td className={`py-2 px-3 text-[9px] font-bold ${isEliminado ? 'text-red-600' : 'text-gold-dark'} truncate`}>
                        {ultimoHistorico?.operador || 'Sistema'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider border ${isEliminado ? 'bg-red-100 text-red-700 border-red-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                          {isEliminado ? 'Eliminado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="py-2 px-3 flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => setProdutoSelecionado(p)}
                          className={`p-1 rounded-lg transition-colors ${isEliminado ? 'text-red-600 hover:bg-red-100' : 'text-gold-dark hover:bg-gold/20'}`} 
                          title="Visualizar"
                        >
                          <Eye size={14} />
                        </button>
                        {!isEliminado && (
                          <>
                            <button 
                              onClick={() => handleEdit(p)}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300" 
                              title="Excluir" 
                              onClick={() => setProdutoParaExcluir(p)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredAndSortedProdutos.length === 0 && (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-gray-400 h-full min-h-[200px]">
                <Filter size={40} className="opacity-20 mb-3" />
                <p className="font-serif italic text-sm">Nenhum produto encontrado com os filtros aplicados.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {produtoParaExcluir && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-serif font-bold text-gray-900">Confirmar Exclusão</h3>
              <p className="text-gray-600">
                Deseja realmente eliminar o cadastro do produto <span className="font-bold text-gray-800">{produtoParaExcluir.nome}</span>? 
                O registro permanecerá no histórico como ELIMINADO.
              </p>
              <div className="flex gap-3 w-full mt-6">
                <button 
                  onClick={() => setProdutoParaExcluir(null)}
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

      {produtoSelecionado && (
        <DetalhesProdutoModal 
          produto={produtoSelecionado} 
          onClose={() => setProdutoSelecionado(null)} 
        />
      )}
    </PageLayout>
  );
};
