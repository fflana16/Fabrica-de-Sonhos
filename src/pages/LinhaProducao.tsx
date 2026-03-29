import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Pedido } from '../SistemasContext';
import { toast } from 'sonner';
import {
  Search, Eye, Clock, DollarSign, Package, AlertTriangle, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { format, differenceInDays, addDays, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFormat, parseDate } from '../utils/dateUtils';
import { RelatorioPedidoModal } from '../components/modals/RelatorioPedidoModal';

export const LinhaProducao = ({ 
  onNavigate, 
  onBack,
  onBackStep,
  onBackToCategory,
  categoryName 
}: { 
  onNavigate: (tela: string) => void;
  onBack: () => void;
  onBackStep?: () => void;
  onBackToCategory?: () => void;
  categoryName?: string;
}) => {
  const { pedidos, clientes, updatePedidoStatus, setPedidoParaEditar } = useSistemas();
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
    }).sort((a, b) => {
      // Prioridade para pedidos com status 'Prioridade Urgente'
      if (a.status === 'Prioridade Urgente' && b.status !== 'Prioridade Urgente') return -1;
      if (b.status === 'Prioridade Urgente' && a.status !== 'Prioridade Urgente') return 1;
      
      // Depois, ordenar por data de entrega desejada
      const dateA = parseDate(a.dataEntrega)?.getTime() || Infinity;
      const dateB = parseDate(b.dataEntrega)?.getTime() || Infinity;
      return dateA - dateB;
    });
  }, [pedidos, clientes, searchTerm, statusFilter]);

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

  const getDeadlineRisk = (pedido: Pedido) => {
    if (!pedido.dataEntrega) return { color: 'text-gray-500', icon: <Info size={16} />, text: 'Sem data de entrega' };

    const today = new Date();
    const deliveryDate = parseDate(pedido.dataEntrega);
    
    if (!deliveryDate || !isValid(deliveryDate)) {
      return { color: 'text-gray-500', icon: <Info size={16} />, text: 'Data inválida' };
    }

    const diffDays = differenceInDays(deliveryDate, today);

    if (pedido.status === 'Entregue') return { color: 'text-green-600', icon: <CheckCircle2 size={16} />, text: 'Entregue' };
    if (diffDays < 0) return { color: 'text-red-600', icon: <XCircle size={16} />, text: `Atrasado em ${Math.abs(diffDays)} dias` };
    if (diffDays <= 3) return { color: 'text-orange-600', icon: <AlertTriangle size={16} />, text: `Risco: ${diffDays} dias restantes` };
    if (diffDays <= 7) return { color: 'text-yellow-600', icon: <AlertTriangle size={16} />, text: `Atenção: ${diffDays} dias restantes` };
    return { color: 'text-green-600', icon: <CheckCircle2 size={16} />, text: `${diffDays} dias restantes` };
  };

  const handleViewDetails = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
  };

  const handleEdit = (pedido: Pedido) => {
    setPedidoParaEditar(pedido);
    onNavigate('CriarPedidoAvulso');
  };

  const handleUpdateStatus = (pedidoId: string, newStatus: Pedido['status']) => {
    updatePedidoStatus(pedidoId, newStatus);
    toast.success(`Status do pedido ${pedidoId} atualizado para ${newStatus}`, { icon: <CheckCircle2 className="text-gold" /> });
    setPedidoSelecionado(prev => prev && prev.id === pedidoId ? { ...prev, status: newStatus } : prev);
  };

  return (
    <PageLayout 
      title="Linha de Produção (O.S.)" 
      onBack={onBack} 
      onBackStep={onBackStep}
      onBackToCategory={onBackToCategory}
      categoryName={categoryName}
    >
      <div className="w-full max-w-[98%] mx-auto mt-8 flex flex-col gap-6">
        
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

        <div className="glass-panel rounded-3xl overflow-x-auto shadow-xl border border-gold/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gold/15 border-b border-gold/20">
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">ID</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Urgente?</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Cliente</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Itens Principais</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Status</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Prazo</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredPedidos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">Nenhuma ordem de produção encontrada.</td>
                </tr>
              ) : (
                filteredPedidos.map(ped => {
                  const cliente = clientes.find(c => c.codigo === ped.clienteCodigo);
                  const deadlineRisk = getDeadlineRisk(ped);
                  const isUrgent = ped.status === 'Prioridade Urgente';
                  return (
                    <tr 
                      key={ped.id} 
                      className={`border-b border-gold/10 hover:bg-white/30 transition-colors group ${isUrgent ? 'bg-red-50/60' : ''}`}
                    >
                      <td className="py-4 px-6 text-sm font-semibold text-gray-800">
                        {ped.id}
                      </td>
                      <td className={`py-4 px-6 text-xs font-bold ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}>
                        {isUrgent ? 'PC Urgente' : 'PC Normal'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          {cliente?.nome || 'N/A'}
                          {ped.itens.some(item => item.isIgreja) && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200" title="Pedido para Igreja">
                              IGREJA
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">{cliente?.nome || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {ped.itens.slice(0, 2).map(item => item.nomeProduto).join(', ')}
                        {ped.itens.length > 2 && ` e mais ${ped.itens.length - 2} itens`}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ped.status)}`}>
                          {ped.status}
                        </span>
                      </td>
                      <td className={`py-4 px-6 text-xs font-medium flex items-center gap-1 ${deadlineRisk.color}`}>
                        {deadlineRisk.icon} {deadlineRisk.text}
                      </td>
                      <td className="py-4 px-6 flex justify-center gap-2">
                        <button onClick={() => handleViewDetails(ped)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={16} />
                        </button>
                        {/* <button onClick={() => toast.info('Funcionalidade de edição de O.S. em desenvolvimento')} className="p-2 text-gold-dark hover:bg-gold-light rounded-lg transition-colors">
                          <Edit size={16} />
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

      {/* Modal de Detalhes da Ordem de Produção */}
      {pedidoSelecionado && (
        <RelatorioPedidoModal 
          pedido={pedidoSelecionado}
          onClose={() => setPedidoSelecionado(null)}
          onEdit={(pedido) => {
            setPedidoSelecionado(null);
            handleEdit(pedido);
          }}
        />
      )}
    </PageLayout>
  );
};
