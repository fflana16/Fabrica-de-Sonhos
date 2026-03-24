import React, { useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas } from '../SistemasContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShoppingCart, 
  XCircle,
  DollarSign,
  Calendar,
  BarChart3,
  Package,
  Users
} from 'lucide-react';
import { 
  format, 
  parseISO, 
  isSameMonth, 
  startOfMonth, 
  subMonths, 
  isAfter, 
  isBefore,
  startOfDay,
  isValid
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFormat, parseDate } from '../utils/dateUtils';

const COLORS = ['#D4AF37', '#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

export const RelatoriosGerenciais = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { orcamentos, pedidos, custosFixos } = useSistemas();
  const today = startOfDay(new Date());

  // 1. Orçamentos Pendentes
  const orcamentosPendentes = useMemo(() => 
    orcamentos.filter(o => o.status === 'PENDENTE'),
    [orcamentos]
  );

  // 2. Pedidos Pendentes de Entrega
  const pedidosPendentes = useMemo(() => 
    pedidos.filter(p => p.status !== 'Entregue' && p.status !== 'CANCELADO'),
    [pedidos]
  );

  // 3. Pedidos Atrasados
  const pedidosAtrasados = useMemo(() => 
    pedidos.filter(p => {
      if (p.status === 'Entregue' || p.status === 'CANCELADO') return false;
      const dataEntrega = parseDate(p.dataEntrega);
      if (!dataEntrega) return false;
      return isBefore(dataEntrega, today);
    }),
    [pedidos, today]
  );

  // 4. Pedidos Cancelados
  const pedidosCancelados = useMemo(() => 
    pedidos.filter(p => p.status === 'CANCELADO'),
    [pedidos]
  );

  // 5. Faturamento e Custos Mensais (Últimos 6 meses)
  const dadosMensais = useMemo(() => {
    const meses = Array.from({ length: 6 }).map((_, i) => startOfMonth(subMonths(new Date(), i))).reverse();
    
    return meses.map(mes => {
      const pedidosMes = pedidos.filter(p => {
        if (p.status === 'CANCELADO') return false;
        const dataCriacao = parseDate(p.dataCriacao);
        if (!dataCriacao) return false;
        return isSameMonth(dataCriacao, mes);
      });

      const faturamento = pedidosMes.reduce((acc, p) => acc + p.totalGeral, 0);
      
      // Custos fixos (assumindo que são mensais)
      const custoFixoTotal = custosFixos.reduce((acc, c) => acc + c.valor, 0);
      
      // Custos variáveis (material + máquina dos itens dos pedidos)
      const custoVariavelTotal = pedidosMes.reduce((acc, p) => {
        return acc + p.itens.reduce((itemAcc, item) => {
          return itemAcc + (item.custoTotal || 0) * item.quantidade;
        }, 0);
      }, 0);

      return {
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        faturamento,
        custos: custoFixoTotal + custoVariavelTotal,
        lucro: faturamento - (custoFixoTotal + custoVariavelTotal)
      };
    });
  }, [pedidos, custosFixos]);

  // 6. Valores Recebidos vs Previstos (Mês Atual)
  const financeiroMesAtual = useMemo(() => {
    const mesAtual = startOfMonth(new Date());
    const pedidosMes = pedidos.filter(p => {
      if (p.status === 'CANCELADO') return false;
      const dataCriacao = parseDate(p.dataCriacao);
      if (!dataCriacao) return false;
      return isSameMonth(dataCriacao, mesAtual);
    });

    const recebido = pedidosMes.reduce((acc, p) => acc + (p.sinalPago || 0) + (p.pagamentoSaldo || 0), 0);
    const previsto = pedidosMes.reduce((acc, p) => acc + p.totalGeral, 0);

    return [
      { name: 'Recebido', value: recebido },
      { name: 'A Receber', value: Math.max(0, previsto - recebido) }
    ];
  }, [pedidos]);

  // 7. Top Produtos (Mais Vendidos)
  const topProdutos = useMemo(() => {
    const contagem: { [key: string]: { nome: string, qtd: number, total: number } } = {};
    
    pedidos.filter(p => p.status !== 'CANCELADO').forEach(p => {
      p.itens.forEach(item => {
        if (!contagem[item.produtoCodigo]) {
          contagem[item.produtoCodigo] = { nome: item.nomeProduto, qtd: 0, total: 0 };
        }
        contagem[item.produtoCodigo].qtd += item.quantidade;
        contagem[item.produtoCodigo].total += item.precoVendaUnitario * item.quantidade;
      });
    });

    return Object.values(contagem)
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5);
  }, [pedidos]);

  // 8. Top Clientes
  const topClientes = useMemo(() => {
    const contagem: { [key: string]: { nome: string, total: number, pedidos: number } } = {};
    
    pedidos.filter(p => p.status !== 'CANCELADO').forEach(p => {
      if (!contagem[p.clienteCodigo]) {
        contagem[p.clienteCodigo] = { nome: p.clienteCodigo, total: 0, pedidos: 0 };
      }
      contagem[p.clienteCodigo].total += p.totalGeral;
      contagem[p.clienteCodigo].pedidos += 1;
    });

    return Object.values(contagem)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [pedidos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <PageLayout 
      title="Relatórios Gerenciais" 
      onBack={() => onNavigate('Dashboard')}
    >
      <div className="space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold/20 flex items-center gap-4">
            <div className="p-3 bg-gold/10 rounded-xl text-gold-dark">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Orçamentos Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{orcamentosPendentes.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold/20 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pedidos Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{pedidosPendentes.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold/20 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pedidos Atrasados</p>
              <p className="text-2xl font-bold text-gray-900">{pedidosAtrasados.length}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold/20 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Faturamento Mês</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dadosMensais[dadosMensais.length - 1]?.faturamento || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Faturamento vs Custos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold/20">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="text-gold" size={20} />
              Faturamento vs Custos (6 Meses)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="custos" name="Custos" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recebido vs Previsto */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold/20">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="text-gold" size={20} />
              Recebido vs Previsto (Mês Atual)
            </h3>
            <div className="h-80 w-full flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={financeiroMesAtual}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {financeiroMesAtual.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                {financeiroMesAtual.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">Total Previsto</span>
                    <span className="text-sm font-black text-gold-dark">
                      {formatCurrency(financeiroMesAtual.reduce((acc, curr) => acc + curr.value, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Produtos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gold/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-gold" size={20} />
                Top 5 Produtos (Mais Vendidos)
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {topProdutos.length === 0 ? (
                <p className="text-center text-gray-500 italic">Nenhum dado disponível</p>
              ) : (
                topProdutos.map((p, i) => (
                  <div key={p.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gold/20 text-gold-dark rounded-full text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{p.nome}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{p.qtd} unidades vendidas</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gold-dark">{formatCurrency(p.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top Clientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gold/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="text-gold" size={20} />
                Top 5 Clientes (Maior Faturamento)
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {topClientes.length === 0 ? (
                <p className="text-center text-gray-500 italic">Nenhum dado disponível</p>
              ) : (
                topClientes.map((c, i) => (
                  <div key={c.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gold/20 text-gold-dark rounded-full text-xs font-bold">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{c.nome}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{c.pedidos} pedidos realizados</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gold-dark">{formatCurrency(c.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Detailed Tables Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Pedidos Atrasados */}
          <div className="bg-white rounded-2xl shadow-sm border border-gold/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
              <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle size={20} />
                Acompanhamento de Atrasos
              </h3>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                {pedidosAtrasados.length} Pedidos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-3 border-b">ID Pedido</th>
                    <th className="px-6 py-3 border-b">Urgente?</th>
                    <th className="px-6 py-3 border-b">Cliente</th>
                    <th className="px-6 py-3 border-b">Data Entrega</th>
                    <th className="px-6 py-3 border-b">Status</th>
                    <th className="px-6 py-3 border-b">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidosAtrasados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">Nenhum pedido atrasado</td>
                    </tr>
                  ) : (
                    pedidosAtrasados.map(p => {
                      const isUrgent = p.status === 'Prioridade Urgente';
                      return (
                        <tr key={p.id} className={`hover:bg-gray-50 transition-colors text-sm ${isUrgent ? 'bg-red-50/60' : ''}`}>
                          <td className="px-6 py-4 font-bold text-gold-dark">
                            {p.id}
                          </td>
                          <td className={`px-6 py-4 text-[10px] font-bold ${isUrgent ? 'text-red-600' : 'text-gray-500'}`}>
                            {isUrgent ? 'PC Urgente' : 'PC Normal'}
                          </td>
                          <td className="px-6 py-4">{p.clienteCodigo}</td>
                          <td className="px-6 py-4 text-red-600 font-medium">{safeFormat(p.dataEntrega)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${isUrgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-orange-100 text-orange-700'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold">{formatCurrency(p.totalGeral)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pedidos Cancelados */}
          <div className="bg-white rounded-2xl shadow-sm border border-gold/20 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="text-gray-400" size={20} />
                Pedidos Cancelados
              </h3>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                {pedidosCancelados.length} Pedidos
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-3 border-b">ID Pedido</th>
                    <th className="px-6 py-3 border-b">Urgente?</th>
                    <th className="px-6 py-3 border-b">Cliente</th>
                    <th className="px-6 py-3 border-b">Data Cancelamento</th>
                    <th className="px-6 py-3 border-b">Motivo</th>
                    <th className="px-6 py-3 border-b">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pedidosCancelados.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">Nenhum pedido cancelado</td>
                    </tr>
                  ) : (
                    pedidosCancelados.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors text-sm">
                        <td className="px-6 py-4 font-bold text-gray-400 line-through">
                          {p.id}
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-400">
                          PC Normal
                        </td>
                        <td className="px-6 py-4">{p.clienteCodigo}</td>
                        <td className="px-6 py-4">
                          {p.historicoStatus.find(h => h.status === 'CANCELADO')?.data || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-gray-500 italic max-w-xs truncate">
                          {p.justificativaCancelamento || 'Não informada'}
                        </td>
                        <td className="px-6 py-4 font-bold text-gray-400">{formatCurrency(p.totalGeral)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
