import React, { useState, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, Orcamento } from '../SistemasContext';
import { toast } from 'sonner';
import {
  Search, Edit, Trash2, Eye, FileText, CheckCircle2, XCircle, Clock, DollarSign, Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RelatorioOrcamentoModal } from '../components/modals/RelatorioOrcamentoModal';

import { CancelamentoOrcamentoModal } from '../components/modals/CancelamentoOrcamentoModal';
import { ConversaoOrcamentoModal } from '../components/modals/ConversaoOrcamentoModal';

const addBusinessDays = (date: Date, days: number) => {
  let result = new Date(date);
  let addedDays = 0;
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  return result;
};

export const RelatorioOrcamentos = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { orcamentos, clientes, setOrcamentoParaEditar, updateOrcamento } = useSistemas();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'PENDENTE' | 'APROVADO' | 'CONVERTIDO' | 'RECUSADO' | 'CANCELADO'>('TODOS');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const filteredOrcamentos = useMemo(() => {
    return orcamentos.filter(orc => {
      const cliente = clientes.find(c => c.codigo === orc.clienteCodigo);
      const matchesSearch = searchTerm === '' || 
                          orc.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cliente?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          orc.itens.some(item => item.nomeProduto.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'TODOS' || orc.status === statusFilter;

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (statusFilter === 'PENDENTE' || (a.status === 'PENDENTE' && b.status === 'PENDENTE')) {
        // Sort by expiration date (which is based on dataCriacao + 3 business days) ascending for PENDENTE
        return addBusinessDays(new Date(a.dataCriacao), 3).getTime() - addBusinessDays(new Date(b.dataCriacao), 3).getTime();
      }
      // Default: sort by dataCriacao descending
      return new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime();
    });
  }, [orcamentos, clientes, searchTerm, statusFilter]);

  const handleEdit = (orcamento: Orcamento) => {
    setOrcamentoParaEditar(orcamento);
    onNavigate('CriarOrcamento'); // Navegar para a tela de edição de orçamento
  };

  const handleViewDetails = (orcamento: Orcamento) => {
    setOrcamentoSelecionado(orcamento);
    setShowRelatorioModal(true);
  };

  const getStatusColor = (status: Orcamento['status']) => {
    switch (status) {
      case 'PENDENTE': return 'text-yellow-600 bg-yellow-100';
      case 'APROVADO': return 'text-green-600 bg-green-100';
      case 'CONVERTIDO': return 'text-blue-600 bg-blue-100';
      case 'RECUSADO': return 'text-orange-600 bg-orange-100';
      case 'CANCELADO': return 'text-red-600 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <PageLayout title="Relatório de Orçamentos" onBack={() => onNavigate('Dashboard')}>
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
              <option value="PENDENTE">Pendente</option>
              <option value="APROVADO">Aprovado</option>
              <option value="CONVERTIDO">Convertido</option>
              <option value="RECUSADO">Recusado</option>
              <option value="CANCELADO">Cancelado</option>
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
              {filteredOrcamentos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">Nenhum orçamento encontrado.</td>
                </tr>
              ) : (
                filteredOrcamentos.map(orc => {
                  const cliente = clientes.find(c => c.codigo === orc.clienteCodigo);
                  return (
                    <tr key={orc.id} className="border-b border-gold/10 hover:bg-white/30 transition-colors group">
                      <td className="py-4 px-6 text-sm font-semibold text-gray-800">{orc.id}</td>
                      <td className="py-4 px-6 text-sm text-gray-700">{cliente?.nome || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {orc.itens.map(item => item.nomeProduto).join(', ')}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono font-bold text-gold-dark">R$ {orc.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(orc.status)}`}>
                            {orc.status}
                          </span>
                          {orc.status === 'PENDENTE' && (
                            <span className="text-[10px] text-gray-500 font-medium">
                              Vence: {format(addBusinessDays(new Date(orc.dataCriacao), 3), 'dd/MM/yyyy')}
                            </span>
                          )}
                          {orc.status === 'CANCELADO' && orc.justificativaCancelamento && (
                            <span className="text-[10px] text-red-500 font-medium max-w-[150px] truncate" title={orc.justificativaCancelamento}>
                              Motivo: {orc.justificativaCancelamento}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-gray-500">{format(new Date(orc.dataCriacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
                      <td className="py-4 px-6 flex justify-center gap-2">
                        <button onClick={() => handleViewDetails(orc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Relatório">
                          <Eye size={16} />
                        </button>
                        <button onClick={() => handleEdit(orc)} className="p-2 text-gold-dark hover:bg-gold-light rounded-lg transition-colors" title="Editar">
                          <Edit size={16} />
                        </button>
                        {orc.status !== 'CONVERTIDO' && orc.status !== 'RECUSADO' && orc.status !== 'CANCELADO' && (
                          <>
                            <button 
                              onClick={() => { setOrcamentoSelecionado(orc); setShowConvertModal(true); }} 
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Converter em Pedido"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button 
                              onClick={() => { setOrcamentoSelecionado(orc); setShowCancelModal(true); }} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Cancelar Orçamento"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Orçamento */}
      {orcamentoSelecionado && showRelatorioModal && (
        <RelatorioOrcamentoModal 
          orcamento={orcamentoSelecionado}
          onClose={() => {
            setShowRelatorioModal(false);
            setOrcamentoSelecionado(null);
          }}
        />
      )}

      {orcamentoSelecionado && showCancelModal && (
        <CancelamentoOrcamentoModal 
          orcamento={orcamentoSelecionado}
          onClose={() => {
            setShowCancelModal(false);
            setOrcamentoSelecionado(null);
          }}
          onConfirm={(justificativa) => {
            updateOrcamento(orcamentoSelecionado.id, { status: 'CANCELADO', justificativaCancelamento: justificativa });
            toast.success('Orçamento cancelado com sucesso.');
            setShowCancelModal(false);
            setOrcamentoSelecionado(null);
          }}
        />
      )}

      {orcamentoSelecionado && showConvertModal && (
        <ConversaoOrcamentoModal 
          orcamento={orcamentoSelecionado}
          onClose={() => {
            setShowConvertModal(false);
            setOrcamentoSelecionado(null);
          }}
        />
      )}
    </PageLayout>
  );
};
