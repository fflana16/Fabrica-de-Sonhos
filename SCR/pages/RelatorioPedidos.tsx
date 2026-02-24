import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Pedido } from '../SistemasContext';
import { toast } from 'sonner';
import {
  Search, Edit, Trash2, Eye, FileText, CheckCircle2, XCircle, Clock, DollarSign, Package, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const RelatorioPedidos = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { pedidos, clientes, setPedidoParaEditar } = useSistemas();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | Pedido['status']>('TODOS');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(ped => {
      const cliente = clientes.find(c => c.codigo === ped.clienteCodigo);
      const matchesSearch = searchTerm === '' || 
                          ped.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ped.itens.some(item => item.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'TODOS' || ped.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
  }, [pedidos, clientes, searchTerm, statusFilter]);

  const handleEdit = (pedido: Pedido) => {
    setPedidoParaEditar(pedido);
    onNavigate('CriarPedidoAvulso'); // Navegar para a tela de edição de pedido
  };

  const handleViewDetails = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
  };

  const getStatusColor = (status: Pedido['status']) => {
    switch (status) {
      case 'Confirmado': return 'text-blue-600 bg-blue-100';
      case 'Em Produção': return 'text-yellow-600 bg-yellow-100';
      case 'Em Acabamento': return 'text-orange-600 bg-orange-100';
      case 'Pronto': return 'text-green-600 bg-green-100';
      case 'Entregue': return 'text-purple-600 bg-purple-100';
      case 'Prioridade Urgente': return 'text-red-600 bg-red-100 animate-pulse';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <PageLayout title="Relatório de Pedidos" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-7xl mx-auto mt-8 flex flex-col gap-6">
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-dark/60">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar por ID, cliente ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/40 backdrop-blur-sm border border-gold/30 rounded-full py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-gold transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white/40 backdrop-blur-sm border border-gold/30 rounded-full py-2 px-4 text-sm text-gray-800 focus:outline-none focus:border-gold transition-all hover:bg-white/60"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Em Produção">Em Produção</option>
              <option value="Em Acabamento">Em Acabamento</option>
              <option value="Pronto">Pronto</option>
              <option value="Entregue">Entregue</option>
              <option value="Prioridade Urgente">Prioridade Urgente</option>
            </select>
          </div>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-gold/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gold/15 border-b border-gold/20">
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">ID</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Cliente</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Itens</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Total</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Status</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Data Criação</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">Nenhum pedido encontrado.</td>
                </tr>
              ) : (
                filteredPedidos.map(ped => {
                  const cliente = clientes.find(c => c.codigo === ped.clienteCodigo);
                  return (
                    <tr key={ped.id} className="border-b border-gold/10 hover:bg-white/30 transition-colors group">
                      <td className="py-4 px-6 text-sm font-semibold text-gray-800">{ped.id}</td>
                      <td className="py-4 px-6 text-sm text-gray-700">{cliente?.nome || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {ped.itens.map(item => item.nomeProduto).join(', ')}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono font-bold text-gold-dark">R$ {ped.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ped.status)}`}>
                          {ped.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">{format(new Date(ped.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                      <td className="py-4 px-6 flex justify-center gap-2">
                        <button onClick={() => handleViewDetails(ped)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(ped)} className="p-2 text-gold-dark hover:bg-gold-light rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        {/* <button onClick={() => toast.info('Funcionalidade de exclusão em desenvolvimento')} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button> */}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
              <h3 className="text-xl font-serif font-bold text-gray-900">Detalhes do Pedido: {pedidoSelecionado.id}</h3>
              <button onClick={() => setPedidoSelecionado(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <p className="text-sm text-gray-700"><span className="font-semibold">Cliente:</span> {clientes.find(c => c.codigo === pedidoSelecionado.clienteCodigo)?.nome || 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Data de Criação:</span> {format(new Date(pedidoSelecionado.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Operador:</span> {pedidoSelecionado.operadorCriacao}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pedidoSelecionado.status)}`}>{pedidoSelecionado.status}</span></p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Data Entrega Desejada:</span> {pedidoSelecionado.dataEntrega || 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Data Sugerida PCP:</span> {pedidoSelecionado.dataSugeriaPCP || 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Forma de Pagamento:</span> {pedidoSelecionado.formaPagamento || 'N/A'}</p>

              <h4 className="font-serif font-bold text-md text-gold-dark mt-4">Itens:</h4>
              <div className="grid grid-cols-1 gap-3">
                {pedidoSelecionado.itens.map(item => (
                  <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex flex-col gap-1">
                    <span className="font-semibold text-gray-800 flex items-center gap-2"><Package size={16} /> {item.nomeProduto}</span>
                    <span className="text-sm text-gray-600 ml-6">Qtd: {item.quantidade} | Preço Unitário: R$ {item.precoVendaUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-gray-500 ml-6">Custo Material: R$ {item.custoMaterial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Custo Máquina: R$ {item.custoMaquina.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-gray-500 ml-6">Custo Pintura: R$ {item.custoPintura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Custo Montagem: R$ {item.custoMontagem.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    {item.observacoes && <span className="text-xs text-gray-600 italic ml-6">Obs: {item.observacoes}</span>}
                    {!item.aprovado && <span className="text-xs text-red-500 ml-6 flex items-center gap-1"><AlertTriangle size={12} /> Item Recusado: {item.justificativaRecusa || 'Sem justificativa'}</span>}
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-gold/10 rounded-2xl border border-gold/30 flex justify-between items-center">
                <span className="font-bold text-lg text-gold-dark">Total Geral:</span>
                <span className="font-mono font-black text-2xl text-gold-dark">R$ {pedidoSelecionado.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="p-4 bg-gold-light/20 rounded-2xl border border-gold/40 flex justify-between items-center">
                <span className="font-bold text-md text-gold-dark">Sinal Pago:</span>
                <span className="font-mono font-bold text-xl text-gold-dark">R$ {pedidoSelecionado.sinalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => toast.info('Funcionalidade de gestão de status em desenvolvimento')}
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-blue-500/20"
              >
                <CheckCircle2 size={20} />
                Gerenciar Status
              </button>
              <button 
                onClick={() => handleEdit(pedidoSelecionado)}
                className="bg-gradient-to-r from-gold-dark to-gold text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/20"
              >
                <Edit size={20} />
                Editar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
