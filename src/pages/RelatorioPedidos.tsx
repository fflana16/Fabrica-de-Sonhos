import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Pedido } from '../SistemasContext';
import { toast } from 'sonner';
import {
  Search, Trash2, Eye, FileText, CheckCircle2, XCircle, Clock, DollarSign, Package, AlertTriangle, ChevronDown, Filter, Check
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFormat, parseDate } from '../utils/dateUtils';
import { RelatorioPedidoModal } from '../components/modals/RelatorioPedidoModal';
import { StatusEntregaModal } from '../components/modals/StatusEntregaModal';
import { CancelamentoPedidoModal } from '../components/modals/CancelamentoPedidoModal';

export const RelatorioPedidos = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { pedidos, clientes, setPedidoParaEditar } = useSistemas();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<Pedido['status'][]>([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [showCancelamentoModal, setShowCancelamentoModal] = useState(false);
  const { updatePedido } = useSistemas();

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(ped => {
      const cliente = clientes.find(c => c.codigo === ped.clienteCodigo);
      const matchesSearch = searchTerm === '' || 
                          ped.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ped.itens.some(item => item.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(ped.status);

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const dateA = parseDate(a.dataCriacao)?.getTime() || 0;
      const dateB = parseDate(b.dataCriacao)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [pedidos, clientes, searchTerm, selectedStatuses]);

  const handleEdit = (pedido: Pedido) => {
    setPedidoParaEditar(pedido);
    onNavigate('CriarPedidoAvulso'); // Navegar para a tela de edição de pedido
  };

  const handleViewDetails = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
    setShowRelatorioModal(true);
  };

  const handleStatusChange = (pedido: Pedido, newStatus: Pedido['status']) => {
    if (newStatus === 'Entregue') {
      setPedidoSelecionado(pedido);
      setShowEntregaModal(true);
      return;
    }
    
    updatePedido(pedido.id, { status: newStatus });
    toast.success(`Status do pedido ${pedido.id} atualizado para ${newStatus}`);
  };

  const handleDeleteClick = (pedido: Pedido) => {
    setPedidoSelecionado(pedido);
    setShowCancelamentoModal(true);
  };

  const toggleStatus = (status: Pedido['status']) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const ALL_STATUS_OPTIONS: Pedido['status'][] = [
    'Confirmado',
    'Prioridade Urgente',
    'Em Produção',
    'Em Acabamento',
    'Pronto',
    'Entregue',
    'CANCELADO'
  ];

  const getStatusColor = (status: Pedido['status']) => {
    switch (status) {
      case 'Confirmado': return 'text-blue-600 bg-blue-100';
      case 'Em Produção': return 'text-yellow-600 bg-yellow-100';
      case 'Em Acabamento': return 'text-orange-600 bg-orange-100';
      case 'Pronto': return 'text-green-600 bg-green-100';
      case 'Entregue': return 'text-purple-600 bg-purple-100';
      case 'Prioridade Urgente': return 'text-red-600 bg-red-100 animate-pulse';
      case 'CANCELADO': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <PageLayout title="Relatório de Pedidos" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-7xl mx-auto mt-8 flex flex-col gap-6">
        
        <div className="flex flex-col gap-4">
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
            
            {selectedStatuses.length > 0 && (
              <button 
                onClick={() => setSelectedStatuses([])}
                className="text-xs font-bold text-gold-dark hover:text-gold transition-colors flex items-center gap-1"
              >
                <XCircle size={14} />
                LIMPAR FILTROS
              </button>
            )}
          </div>

          <div className="bg-white/30 backdrop-blur-sm p-4 rounded-2xl border border-gold/20 flex flex-wrap gap-x-6 gap-y-3">
            <div className="w-full flex items-center gap-2 mb-1">
              <Filter size={14} className="text-gold-dark" />
              <span className="text-[10px] font-bold text-gold-dark uppercase tracking-widest">Filtrar por Status</span>
            </div>
            {ALL_STATUS_OPTIONS.map((status) => (
              <label key={status} className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="peer appearance-none w-5 h-5 border-2 border-gold/30 rounded-md checked:bg-gold checked:border-gold transition-all cursor-pointer"
                  />
                  <Check size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status).split(' ')[0].replace('text-', 'bg-')}`} />
                  <span className={`text-sm transition-colors ${selectedStatuses.includes(status) ? 'text-gold-dark font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                    {status}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden shadow-xl border border-gold/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gold/15 border-b border-gold/20">
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">ID</th>
                <th className="py-4 px-6 font-serif font-bold text-gold-dark text-sm">Urgente?</th>
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
                  <td colSpan={8} className="py-8 text-center text-gray-500">Nenhum pedido encontrado.</td>
                </tr>
              ) : (
                filteredPedidos.map(ped => {
                  const cliente = clientes.find(c => c.codigo === ped.clienteCodigo);
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
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {ped.itens.map(item => item.nomeProduto).join(', ')}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono font-bold text-gold-dark">R$ {ped.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-6">
                        <div className="relative group/status">
                          <select
                            value={ped.status}
                            onChange={(e) => handleStatusChange(ped, e.target.value as any)}
                            disabled={ped.status === 'CANCELADO'}
                            className={`appearance-none px-3 py-1 pr-8 rounded-full text-xs font-medium focus:outline-none transition-all ${ped.status === 'CANCELADO' ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'} ${getStatusColor(ped.status)}`}
                          >
                            <option value="Confirmado">Confirmado</option>
                            <option value="Prioridade Urgente">Prioridade Urgente</option>
                            <option value="Em Produção">Em Produção</option>
                            <option value="Em Acabamento">Em Acabamento</option>
                            <option value="Pronto">Pronto</option>
                            <option value="Entregue">Entregue</option>
                            <option value="CANCELADO" disabled>Cancelado</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">{safeFormat(ped.dataCriacao, 'dd/MM/yyyy HH:mm')}</td>
                      <td className="py-4 px-6 flex justify-center gap-2">
                        <button onClick={() => handleViewDetails(ped)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Detalhes">
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(ped)} 
                          disabled={ped.status === 'CANCELADO'}
                          className={`p-2 rounded-lg transition-colors ${ped.status === 'CANCELADO' ? 'text-gray-300 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                          title="Eliminar Pedido"
                        >
                          <Trash2 size={16} />
                        </button>
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
      {pedidoSelecionado && showRelatorioModal && (
        <RelatorioPedidoModal 
          pedido={pedidoSelecionado}
          onClose={() => {
            setShowRelatorioModal(false);
            setPedidoSelecionado(null);
          }}
          onEdit={(pedido) => {
            setShowRelatorioModal(false);
            handleEdit(pedido);
          }}
        />
      )}
      {/* Modal de Entrega */}
      {pedidoSelecionado && showEntregaModal && (
        <StatusEntregaModal 
          pedido={pedidoSelecionado}
          onClose={() => {
            setShowEntregaModal(false);
            setPedidoSelecionado(null);
          }}
        />
      )}

      {/* Modal de Cancelamento */}
      {pedidoSelecionado && showCancelamentoModal && (
        <CancelamentoPedidoModal 
          pedido={pedidoSelecionado}
          onClose={() => {
            setShowCancelamentoModal(false);
            setPedidoSelecionado(null);
          }}
        />
      )}
    </PageLayout>
  );
};
