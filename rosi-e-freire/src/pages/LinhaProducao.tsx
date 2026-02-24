import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Pedido } from '../SistemasContext';
import { toast } from 'sonner';
import {
  Search, Eye, Clock, DollarSign, Package, AlertTriangle, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const LinhaProducao = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { pedidos, clientes, updatePedidoStatus } = useSistemas();
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
      const dateA = a.dataEntrega ? new Date(a.dataEntrega).getTime() : Infinity;
      const dateB = b.dataEntrega ? new Date(b.dataEntrega).getTime() : Infinity;
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
    const deliveryDate = new Date(pedido.dataEntrega);
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

  const handleUpdateStatus = (pedidoId: string, newStatus: Pedido['status']) => {
    updatePedidoStatus(pedidoId, newStatus);
    toast.success(`Status do pedido ${pedidoId} atualizado para ${newStatus}`, { icon: <CheckCircle2 className="text-gold" /> });
    setPedidoSelecionado(prev => prev && prev.id === pedidoId ? { ...prev, status: newStatus } : prev);
  };

  return (
    <PageLayout title="Linha de Produção (O.S.)" onBack={() => onNavigate('Dashboard')}>
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
                  return (
                    <tr key={ped.id} className="border-b border-gold/10 hover:bg-white/30 transition-colors group">
                      <td className="py-4 px-6 text-sm font-semibold text-gray-800">{ped.id}</td>
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-3xl w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
              <h3 className="text-xl font-serif font-bold text-gray-900">Detalhes da O.S.: {pedidoSelecionado.id}</h3>
              <button onClick={() => setPedidoSelecionado(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <p className="text-sm text-gray-700"><span className="font-semibold">Cliente:</span> {clientes.find(c => c.codigo === pedidoSelecionado.clienteCodigo)?.nome || 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Orçamento Origem:</span> {pedidoSelecionado.orcamentoId || 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Data de Criação:</span> {format(new Date(pedidoSelecionado.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Operador:</span> {pedidoSelecionado.operadorCriacao}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Status Atual:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pedidoSelecionado.status)}`}>{pedidoSelecionado.status}</span></p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Data Entrega Desejada:</span> {pedidoSelecionado.dataEntrega ? format(new Date(pedidoSelecionado.dataEntrega), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Data Sugerida PCP:</span> {pedidoSelecionado.dataSugeriaPCP || 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Forma de Pagamento:</span> {pedidoSelecionado.formaPagamento || 'N/A'}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Sinal Pago:</span> R$ {pedidoSelecionado.sinalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

              <h4 className="font-serif font-bold text-md text-gold-dark mt-4">Itens da O.S.:</h4>
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
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <select
                value={pedidoSelecionado.status}
                onChange={(e) => handleUpdateStatus(pedidoSelecionado.id, e.target.value as Pedido['status'])}
                className="bg-white/40 backdrop-blur-sm border border-gold/30 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60"
              >
                <option value="Confirmado">Confirmado</option>
                <option value="Em Produção">Em Produção</option>
                <option value="Em Acabamento">Em Acabamento</option>
                <option value="Pronto">Pronto</option>
                <option value="Entregue">Entregue</option>
                <option value="Prioridade Urgente">Prioridade Urgente</option>
              </select>
              <button 
                onClick={() => setPedidoSelecionado(null)}
                className="bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gray-400/20"
              >
                <XCircle size={20} />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
