import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, PedidoItem } from '../SistemasContext';
import { toast } from 'sonner';
import {
  DollarSign, Calendar, Clock, Package, Plus, Trash2, Edit, Search, Info, CheckCircle2, AlertTriangle, XCircle
} from 'lucide-react';
import { InputField } from '../components/InputField';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePCP } from '../hooks/usePCP';

export const CriarPedidoAvulso = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const {
    materiasPrimas,
    produtosLaser,
    produtosPapelaria,
    configuracoes,
    custosFixos,
    clientes,
    pedidos,
    addPedido,
    currentUser
  } = useSistemas();

  const { findAvailableDate, addBusinessDays } = usePCP();

  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [itensPedido, setItensPedido] = useState<PedidoItem[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [sinalPago, setSinalPago] = useState('R$ 0,00');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [dataEntregaDesejada, setDataEntregaDesejada] = useState('');
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [searchTermProduto, setSearchTermProduto] = useState('');
  const [produtoToAdd, setProdutoToAdd] = useState<any | null>(null);
  const [quantidadeToAdd, setQuantidadeToAdd] = useState(1);
  const [observacoesToAdd, setObservacoesToAdd] = useState('');
  const [isIgrejaToAdd, setIsIgrejaToAdd] = useState(false);
  const [alertaSobrecarga, setAlertaSobrecarga] = useState(false);
  const [dataSugeriaPCP, setDataSugeriaPCP] = useState('');
  const [alertaRiscoFinanceiro, setAlertaRiscoFinanceiro] = useState(false);

  useEffect(() => {
    const novoTotal = itensPedido.reduce((acc, item) => acc + (item.precoVendaUnitario * item.quantidade), 0);
    setTotalGeral(novoTotal);

    const sinalNum = unmaskCurrency(sinalPago);
    setAlertaRiscoFinanceiro(sinalNum < (novoTotal * 0.5));

    // Cálculo do PCP usando o hook
    const totalEsforco = itensPedido.reduce((acc, item) => {
      return acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade;
    }, 0);

    if (totalEsforco > 0) {
      const suggestedProductionDate = findAvailableDate(totalEsforco);
      const suggestedClientDate = addBusinessDays(suggestedProductionDate, 2);
      
      const formattedProductionDate = format(suggestedProductionDate, 'yyyy-MM-dd');
      const formattedClientDate = format(suggestedClientDate, 'yyyy-MM-dd');
      
      setDataSugeriaPCP(formattedProductionDate);
      
      if (!dataEntregaDesejada) {
        setDataEntregaDesejada(formattedClientDate);
      }
    } else {
      setDataSugeriaPCP('');
    }
  }, [itensPedido, sinalPago, findAvailableDate, addBusinessDays, dataEntregaDesejada]);

  useEffect(() => {
    if (dataEntregaDesejada && dataSugeriaPCP) {
      const desiredDate = new Date(dataEntregaDesejada);
      const productionDate = new Date(dataSugeriaPCP);
      const safeClientDate = addBusinessDays(productionDate, 2);
      
      setAlertaSobrecarga(desiredDate < safeClientDate && !isSameDay(desiredDate, safeClientDate));
    } else {
      setAlertaSobrecarga(false);
    }
  }, [dataEntregaDesejada, dataSugeriaPCP, addBusinessDays]);

  function maskCurrency(value: string) {
    let v = value.replace(/\D/g, '');
    if (v === '') return '';
    v = (parseInt(v) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
  }

  const unmaskCurrency = (value: string) => {
    return parseFloat(value.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) || 0;
  };

  const calcularPrecoItem = (produto: any, quantidade: number, isIgreja?: boolean) => {
    let custoMaterial = 0;
    let custoMaquina = 0;
    let custoPintura = 0;
    let custoMontagem = 0;
    let precoVendaUnitario = 0;

    const totalCustosFixos = custosFixos.reduce((acc, curr) => acc + curr.valor, 0);
    const custoMinutoFixo = totalCustosFixos / (220 * 60); 

    if (produto.tipo === 'LASER') {
      const mp = materiasPrimas.find(m => m.codigo === produto.materiaPrimaCodigo);
      if (!mp) return { custoMaterial: 0, custoMaquina: 0, custoPintura: 0, custoMontagem: 0, precoVendaUnitario: 0 };

      custoMaterial = (produto.largura * produto.altura) * mp.custoPorMm2;
      const custoMinutoMaquina = configuracoes.custoHoraMaquina / 60;
      custoMaquina = produto.tempoMaquina * custoMinutoMaquina;
      
      // Se for para Igreja, o custo da máquina é 50%
      if (isIgreja) {
        custoMaquina = custoMaquina * 0.5;
      }

      custoPintura = (produto.tempoPintura || 0) * custoMinutoFixo;
      custoMontagem = (produto.tempoMontagem || 0) * custoMinutoFixo;

      const custoTotalItem = custoMaterial + custoMaquina + custoPintura + custoMontagem;
      let multiplicador = 2.0; 
      if (isIgreja) {
        multiplicador = 1.5; // Margem reduzida para igreja
      } else if (clienteSelecionado) {
        const cliente = clientes.find(c => c.codigo === clienteSelecionado);
        if (cliente?.perfil === 'IGREJA' || cliente?.nome.toLowerCase().includes('igreja')) {
          multiplicador = 1.5; 
        }
      }
      precoVendaUnitario = custoTotalItem * multiplicador;

    } else if (produto.tipo === 'PAPELARIA' || produto.tipo === 'REVENDA') {
      custoMaterial = produto.custo || 0;
      precoVendaUnitario = produto.precoVenda || 0;
    }

    precoVendaUnitario = Math.round(precoVendaUnitario * 2) / 2; 

    return { custoMaterial, custoMaquina, custoPintura, custoMontagem, precoVendaUnitario };
  };

  const handleAddProdutoToPedido = () => {
    if (!produtoToAdd || quantidadeToAdd <= 0) {
      toast.error('Selecione um produto e uma quantidade válida.');
      return;
    }

    const { custoMaterial, custoMaquina, custoPintura, custoMontagem, precoVendaUnitario } = calcularPrecoItem(produtoToAdd, quantidadeToAdd, isIgrejaToAdd);

    const newItem: PedidoItem = {
      id: Date.now().toString(),
      produtoCodigo: produtoToAdd.codigo,
      nomeProduto: produtoToAdd.nome,
      quantidade: quantidadeToAdd,
      tempoMaquina: produtoToAdd.tempoMaquina || 0,
      tempoPintura: produtoToAdd.tempoPintura || 0,
      tempoMontagem: produtoToAdd.tempoMontagem || 0,
      custoMaterial,
      custoMaquina,
      precoVendaUnitario,
      observacoes: observacoesToAdd,
      isIgreja: isIgrejaToAdd,
      tipoProduto: produtoToAdd.tipo === 'LASER' ? 'LASER' : (produtoToAdd.tipo === 'PAPELARIA' ? 'PAPELARIA' : 'REVENDA'),
      aprovado: true // Em pedido avulso, todos são aprovados inicialmente
    };

    setItensPedido(prev => [...prev, newItem]);
    setProdutoToAdd(null);
    setQuantidadeToAdd(1);
    setObservacoesToAdd('');
    setIsIgrejaToAdd(false);
    setShowProdutoModal(false);
  };

  const handleRemoveItem = (id: string) => {
    setItensPedido(prev => prev.filter(item => item.id !== id));
  };

  const handleSavePedido = () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente para o pedido.');
      return;
    }
    if (itensPedido.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido.');
      return;
    }
    if (!formaPagamento) {
      toast.error('Selecione a forma de pagamento.');
      return;
    }
    if (alertaSobrecarga && !window.confirm('A data de entrega desejada está antes do prazo de segurança (+2 dias úteis). Deseja continuar e assumir o risco de atraso na entrega?')) {
      return;
    }
    if (alertaRiscoFinanceiro && !window.confirm('O valor do sinal é inferior a 50% do total. Deseja continuar e assumir o risco financeiro?')) {
      return;
    }

    const novoPedido = {
      clienteCodigo: clienteSelecionado,
      itens: itensPedido,
      totalGeral,
      sinalPago: unmaskCurrency(sinalPago),
      formaPagamento,
      dataEntrega: dataEntregaDesejada,
      dataSugeriaPCP,
    };

    addPedido(novoPedido);
    toast.success('Pedido avulso criado com sucesso!', { icon: <CheckCircle2 className="text-gold" /> });
    onNavigate('RelatorioPedidos');
  };

  const filteredProdutos = useMemo(() => {
    const allProducts = [
      ...produtosLaser.map(p => ({ ...p, tipo: 'LASER' })),
      ...produtosPapelaria.map(p => ({ ...p, tipo: 'PAPELARIA' }))
    ];
    return allProducts.filter(p => 
      p.nome.toLowerCase().includes(searchTermProduto.toLowerCase()) && p.status === 'ATIVO'
    );
  }, [produtosLaser, produtosPapelaria, searchTermProduto]);

  return (
    <PageLayout title="Criar Pedido Avulso" onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Cabeçalho do Pedido */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-gold/20">
          <div className="flex flex-col w-full md:w-auto">
            <label htmlFor="cliente" className="text-xs font-medium text-gray-700 ml-1">Cliente</label>
            <select
              id="cliente"
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
              className="w-full md:w-64 bg-white/40 backdrop-blur-sm border border-gold/30 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map(c => (
                <option key={c.codigo} value={c.codigo}>{c.nome} {c.cpfCnpj ? `(${c.cpfCnpj})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col w-full md:w-auto">
            <label htmlFor="dataEntrega" className="text-xs font-medium text-gray-700 ml-1">Data de Entrega Desejada</label>
            <input
              type="date"
              id="dataEntrega"
              value={dataEntregaDesejada}
              onChange={(e) => setDataEntregaDesejada(e.target.value)}
              className={`w-full md:w-48 bg-white/40 backdrop-blur-sm border ${alertaSobrecarga ? 'border-red-400 ring-1 ring-red-400' : 'border-gold/30'} rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60`}
            />
            {alertaSobrecarga && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle size={12} /> 
                Atenção! Data desejada antes do prazo de segurança (+2 dias). 
                Data segura: {format(addBusinessDays(new Date(dataSugeriaPCP), 2), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
            {dataSugeriaPCP && !alertaSobrecarga && (
              <p className="text-[10px] text-gold-dark mt-1 flex items-center gap-1">
                <Info size={12} /> 
                Sugestão para o Cliente: {format(addBusinessDays(new Date(dataSugeriaPCP), 2), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carrinho de Pedido */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col gap-5 shadow-xl border border-gold/20">
            <h3 className="font-serif font-bold text-lg text-gold-dark border-b border-gold/20 pb-3">Itens do Pedido</h3>
            
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto custom-scrollbar">
              {itensPedido.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum item adicionado ao pedido.</p>
              ) : (
                itensPedido.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-white/50 p-3 rounded-xl border border-gold/10 shadow-sm">
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{item.nomeProduto}</span>
                        {item.isIgreja && (
                          <span className="bg-gold/20 text-gold-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/30">
                            IGREJA
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">Qtd: {item.quantidade} | R$ {item.precoVendaUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/un.</span>
                      {item.observacoes && <span className="text-xs text-gray-600 italic">Obs: {item.observacoes}</span>}
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded-md">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => setShowProdutoModal(true)}
              className="mt-4 flex items-center justify-center gap-2 bg-gold-light text-gold-dark px-4 py-2 rounded-xl font-medium hover:bg-gold/30 transition-colors"
            >
              <Plus size={16} />
              Adicionar Produto
            </button>
          </div>

          {/* Resumo de Faturamento */}
          <div className="lg:col-span-1 glass-panel p-6 rounded-3xl flex flex-col gap-5 shadow-xl border border-gold/20 bg-gradient-to-b from-white/40 to-gold/5">
            <div className="flex items-center gap-2 text-gold-dark border-b border-gold/20 pb-3">
              <DollarSign size={20} />
              <h3 className="font-serif font-bold text-lg">Resumo de Faturamento</h3>
            </div>

            <div className="flex flex-col gap-4 flex-1 justify-center">
              <div className="flex flex-col gap-1 bg-white/50 p-4 rounded-2xl border border-gold/20 shadow-sm">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Geral</span>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-mono font-black text-gold-dark">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className={`flex flex-col gap-1 p-4 rounded-2xl border shadow-sm relative overflow-hidden ${alertaRiscoFinanceiro ? 'bg-red-50/20 border-red-400' : 'bg-gold/10 border-gold/40'}`}>
                {alertaRiscoFinanceiro && (
                  <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                    <AlertTriangle size={64} className="text-red-400 opacity-20" />
                  </div>
                )}
                <div className="absolute -right-4 -top-4 text-gold/20">
                  <DollarSign size={64} />
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider relative z-10 ${alertaRiscoFinanceiro ? 'text-red-600' : 'text-gold-dark'}`}>Sinal Pago</span>
                <div className="flex items-end gap-1 relative z-10">
                  <span className={`text-sm font-medium mb-1 ${alertaRiscoFinanceiro ? 'text-red-600' : 'text-gold-dark'}`}>R$</span>
                  <input
                    type="text"
                    value={sinalPago}
                    onChange={(e) => setSinalPago(maskCurrency(e.target.value))}
                    className={`bg-transparent text-3xl font-mono font-bold focus:outline-none w-full ${alertaRiscoFinanceiro ? 'text-red-600' : 'text-gold-dark'}`}
                  />
                </div>
                {alertaRiscoFinanceiro && <p className="text-[10px] text-red-500 mt-1 relative z-10">Sinal inferior a 50% do total!</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="formaPagamento" className="text-xs font-medium text-gray-700 ml-1">Forma de Pagamento</label>
                <select
                  id="formaPagamento"
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full bg-white/40 backdrop-blur-sm border border-gold/30 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60"
                >
                  <option value="">Selecione a forma</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>

            <button 
              onClick={handleSavePedido}
              className="mt-auto flex justify-center items-center gap-2 bg-gradient-to-r from-gold-dark to-gold text-white px-6 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:-translate-y-0.5"
            >
              <CheckCircle2 size={18} />
              Finalizar Pedido
            </button>
          </div>
        </div>

        {/* Modal de Seleção de Produto */}
        {showProdutoModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
                <h3 className="text-xl font-serif font-bold text-gray-900">Adicionar Produto ao Pedido</h3>
                <button onClick={() => setShowProdutoModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gold-dark/60">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Buscar produto por nome..."
                  value={searchTermProduto}
                  onChange={(e) => setSearchTermProduto(e.target.value)}
                  className="w-full bg-white/40 backdrop-blur-sm border border-gold/30 rounded-full py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:border-gold transition-all shadow-sm"
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar mb-6">
                {filteredProdutos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Nenhum produto encontrado.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProdutos.map(prod => (
                      <div 
                        key={prod.codigo} 
                        onClick={() => setProdutoToAdd(prod)}
                        className={`p-4 rounded-xl border ${produtoToAdd?.codigo === prod.codigo ? 'border-gold ring-2 ring-gold' : 'border-gray-200'} hover:border-gold transition-all cursor-pointer flex flex-col gap-1`}
                      >
                        <span className="font-semibold text-gray-800">{prod.nome} ({prod.tipo})</span>
                        <span className="text-xs text-gray-500">Custo Estimado: R$ {calcularPrecoItem(prod, 1).precoVendaUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {prod.tipo === 'LASER' && (
                          <span className="text-[10px] text-gray-400">Tempo Máquina: {prod.tempoMaquina}min</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {produtoToAdd && (
                <div className="mt-auto border-t border-gold/20 pt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom duration-200">
                  <h4 className="font-serif font-bold text-gray-800">Produto Selecionado: {produtoToAdd.nome}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      icon={Package} 
                      label="Quantidade" 
                      name="quantidade" 
                      type="number"
                      value={quantidadeToAdd}
                      onChange={(e: any) => setQuantidadeToAdd(parseInt(e.target.value) || 1)}
                      placeholder="1"
                    />
                    <InputField 
                      icon={Info} 
                      label="Observações (Opcional)" 
                      name="observacoes" 
                      value={observacoesToAdd}
                      onChange={(e: any) => setObservacoesToAdd(e.target.value)}
                      placeholder="Detalhes de personalização..."
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gold/5 p-3 rounded-xl border border-gold/20 mb-4">
                    <input 
                      type="checkbox" 
                      id="isIgreja" 
                      checked={isIgrejaToAdd}
                      onChange={(e) => setIsIgrejaToAdd(e.target.checked)}
                      className="w-4 h-4 text-gold-dark border-gold/30 rounded focus:ring-gold"
                    />
                    <label htmlFor="isIgreja" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Produto para Igreja (Custo Máquina 50%)
                    </label>
                  </div>
                  <button 
                    onClick={handleAddProdutoToPedido}
                    className="bg-gradient-to-r from-gold-dark to-gold text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/20"
                  >
                    <Plus size={20} />
                    Adicionar ao Pedido
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
};
