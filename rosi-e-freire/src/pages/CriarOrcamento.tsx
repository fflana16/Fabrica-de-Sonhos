import React, { useState, useEffect, useMemo } from 'react';
import { PageLayout } from '../components/PageLayout';
import { useSistemas, OrcamentoItem } from '../SistemasContext';
import { toast } from 'sonner';
import {
  DollarSign, Calendar, Clock, Package, Plus, Trash2, Edit, Search, Info, CheckCircle2, AlertTriangle, Save, X
} from 'lucide-react';
import { InputField } from '../components/InputField';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePCP } from '../hooks/usePCP';


export const CriarOrcamento = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const {
    materiasPrimas,
    produtosLaser,
    produtosPapelaria,
    configuracoes,
    custosFixos,
    clientes,
    orcamentos,
    currentUser,
    addOrcamento,
    updateOrcamento,
    orcamentoParaEditar,
    setOrcamentoParaEditar
  } = useSistemas();
  const { findAvailableDate } = usePCP();

  const [orcamentoId, setOrcamentoId] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<string>('');
  const [itensOrcamento, setItensOrcamento] = useState<OrcamentoItem[]>([]);
  const [totalGeral, setTotalGeral] = useState(0);
  const [sinal, setSinal] = useState('R$ 0,00');
  const [dataEntregaDesejada, setDataEntregaDesejada] = useState('');
  const [showProdutoModal, setShowProdutoModal] = useState(false);
  const [searchTermProduto, setSearchTermProduto] = useState('');
  const [produtoToAdd, setProdutoToAdd] = useState<any | null>(null);
  const [quantidadeToAdd, setQuantidadeToAdd] = useState(1);
  const [observacoesToAdd, setObservacoesToAdd] = useState('');
  const [alertaSobrecarga, setAlertaSobrecarga] = useState(false);
  const [dataSugeriaPCP, setDataSugeriaPCP] = useState('');
  const [visualizacao, setVisualizacao] = useState<'INDUSTRIAL' | 'COMERCIAL'>('COMERCIAL');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (orcamentoParaEditar) {
      setOrcamentoId(orcamentoParaEditar.id);
      setClienteSelecionado(orcamentoParaEditar.clienteCodigo);
      setItensOrcamento(orcamentoParaEditar.itens);
      setDataEntregaDesejada(orcamentoParaEditar.dataEntregaDesejada);
      setDataSugeriaPCP(orcamentoParaEditar.dataSugeriaPCP);
    } else {
      const draft = localStorage.getItem('rf_orcamento_draft');
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setOrcamentoId(parsedDraft.orcamentoId);
        setClienteSelecionado(parsedDraft.clienteSelecionado);
        setItensOrcamento(parsedDraft.itensOrcamento);
        setDataEntregaDesejada(parsedDraft.dataEntregaDesejada);
      }
    }
  }, [orcamentoParaEditar]);

  useEffect(() => {
    // Clear edit state when leaving the component
    return () => {
      if (orcamentoParaEditar) {
        setOrcamentoParaEditar(null);
      }
    };
  }, [orcamentoParaEditar, setOrcamentoParaEditar]);

  useEffect(() => {
    if (!orcamentoParaEditar) {
      const draft = {
        orcamentoId,
        clienteSelecionado,
        itensOrcamento,
        dataEntregaDesejada
      };
      localStorage.setItem('rf_orcamento_draft', JSON.stringify(draft));
    }
  }, [orcamentoId, clienteSelecionado, itensOrcamento, dataEntregaDesejada, orcamentoParaEditar]);

  useEffect(() => {
    if (!orcamentoParaEditar) {
      const nextId = orcamentos.length + 1;
      setOrcamentoId(`ORC${String(nextId).padStart(5, '0')}`);
    }
  }, [orcamentos.length, orcamentoParaEditar]);

  useEffect(() => {
    const novoTotal = itensOrcamento.reduce((acc, item) => acc + (item.precoVendaUnitario * item.quantidade), 0);
    setTotalGeral(novoTotal);
    setSinal(maskCurrency(String(novoTotal * 0.5 * 100)));

    const totalMinutes = itensOrcamento.reduce((acc, item) => acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade, 0);
    if (totalMinutes > 0) {
      const suggestedDate = findAvailableDate(totalMinutes);
      const formattedDate = format(suggestedDate, 'yyyy-MM-dd');
      setDataSugeriaPCP(formattedDate);
      if (!dataEntregaDesejada) {
        setDataEntregaDesejada(formattedDate);
      }
    } else {
      setDataSugeriaPCP('');
    }
  }, [itensOrcamento, findAvailableDate, dataEntregaDesejada]);

  useEffect(() => {
    // Validar sobrecarga se data desejada for anterior à sugerida
    if (dataEntregaDesejada && dataSugeriaPCP) {
      const desiredDate = new Date(dataEntregaDesejada);
      const suggestedDate = new Date(dataSugeriaPCP);
      setAlertaSobrecarga(desiredDate < suggestedDate && !isSameDay(desiredDate, suggestedDate));
    } else {
      setAlertaSobrecarga(false);
    }
  }, [dataEntregaDesejada, dataSugeriaPCP]);

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

  const calcularPrecoItem = (produto: any, quantidade: number, margemLucro?: number) => {
    let custoMaterial = 0;
    let custoMaquina = 0;
    let custoPintura = 0;
    let custoMontagem = 0;
    let precoVendaUnitario = 0;

    const totalCustosFixos = custosFixos.reduce((acc, curr) => acc + curr.valor, 0);
    const custoMinutoFixo = totalCustosFixos / (220 * 60); // 220 horas/mês

    if (produto.tipo === 'LASER') {
      const mp = materiasPrimas.find(m => m.codigo === produto.materiaPrimaCodigo);
      if (mp) {
        custoMaterial = (produto.largura * produto.altura) * mp.custoPorMm2;
      }
      const custoMinutoMaquina = configuracoes.custoHoraMaquina / 60;
      custoMaquina = produto.tempoMaquina * custoMinutoMaquina;
      custoPintura = (produto.tempoPintura || 0) * custoMinutoFixo;
      custoMontagem = (produto.tempoMontagem || 0) * custoMinutoFixo;

    } else if (produto.tipo === 'PAPELARIA' || produto.tipo === 'REVENDA') {
      custoMaterial = produto.custo || produto.custoFabricacao || 0;
    }

    const custoMaoDeObra = custoPintura + custoMontagem;
    const custoTotal = custoMaterial + custoMaquina + custoMaoDeObra;

    // Margem dinâmica (simplificado)
    let margem = margemLucro !== undefined ? margemLucro : 100; // Padrão 100%
    if (margemLucro === undefined) {
      const cliente = clientes.find(c => c.codigo === clienteSelecionado);
      if (cliente?.nome.toLowerCase().includes('igreja')) {
        margem = 50; // Margem reduzida
      }
    }
    
    precoVendaUnitario = custoTotal * (1 + (margem / 100));

    // Arredondamento para 0,50 ou 1,00 mais próximo
    precoVendaUnitario = Math.round(precoVendaUnitario * 2) / 2;

    return { custoMaterial, custoMaquina, custoPintura, custoMontagem, custoMaoDeObra, custoTotal, precoVendaUnitario, margemLucro: margem };
  };

  const handleAddProdutoToOrcamento = () => {
    if (!produtoToAdd || quantidadeToAdd <= 0) {
      toast.error('Selecione um produto e uma quantidade válida.');
      return;
    }

    const { custoMaterial, custoMaquina, custoPintura, custoMontagem, custoMaoDeObra, custoTotal, precoVendaUnitario, margemLucro } = calcularPrecoItem(produtoToAdd, quantidadeToAdd);

    const newItem: OrcamentoItem = {
      id: Date.now().toString(),
      produtoCodigo: produtoToAdd.codigo,
      nomeProduto: produtoToAdd.nome,
      quantidade: quantidadeToAdd,
      tempoMaquina: produtoToAdd.tempoMaquina || 0,
      tempoPintura: produtoToAdd.tempoPintura || 0,
      tempoMontagem: produtoToAdd.tempoMontagem || 0,
      custoMaterial,
      custoMaquina,
      custoMaoDeObra,
      custoTotal,
      margemLucro,
      precoVendaUnitario,
      observacoes: observacoesToAdd,
      tipoProduto: produtoToAdd.tipo === 'LASER' ? 'LASER' : (produtoToAdd.tipo === 'PAPELARIA' ? 'PAPELARIA' : 'REVENDA')
    };

    setItensOrcamento(prev => [...prev, newItem]);
    setProdutoToAdd(null);
    setQuantidadeToAdd(1);
    setObservacoesToAdd('');
    setShowProdutoModal(false);
  };

  const handleRemoveItem = (id: string) => {
    setItensOrcamento(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItemMargin = (id: string, newMargin: number) => {
    setItensOrcamento(prev => prev.map(item => {
      if (item.id === id) {
        const custoTotal = item.custoTotal || 0;
        let novoPreco = custoTotal * (1 + (newMargin / 100));
        novoPreco = Math.round(novoPreco * 2) / 2;
        return { ...item, margemLucro: newMargin, precoVendaUnitario: novoPreco };
      }
      return item;
    }));
  };

  const handleUpdateItemPrice = (id: string, newPriceStr: string) => {
    const newPrice = parseFloat(newPriceStr) || 0;
    setItensOrcamento(prev => prev.map(item => {
      if (item.id === id) {
        const custoTotal = item.custoTotal || 0;
        let novaMargem = 0;
        if (custoTotal > 0) {
          novaMargem = ((newPrice / custoTotal) - 1) * 100;
        }
        return { ...item, precoVendaUnitario: newPrice, margemLucro: novaMargem };
      }
      return item;
    }));
  };

  const handleSaveOrcamento = () => {
    if (!clienteSelecionado) {
      toast.error('Selecione um cliente para o orçamento.');
      return;
    }
    if (itensOrcamento.length === 0) {
      toast.error('Adicione pelo menos um item ao orçamento.');
      return;
    }
    if (alertaSobrecarga && !window.confirm('A data de entrega desejada está antes da data segura do PCP. Deseja continuar e assumir o risco de sobrecarga industrial?')) {
      return;
    }

    setIsSaving(true);

    if (orcamentoParaEditar) {
      updateOrcamento(orcamentoParaEditar.id, {
        clienteCodigo: clienteSelecionado,
        itens: itensOrcamento,
        totalGeral,
        sinal: unmaskCurrency(sinal),
        dataEntregaDesejada,
        dataSugeriaPCP,
        operador: currentUser?.nome || 'Sistema'
      });
      toast.success('Orçamento atualizado com sucesso!', { icon: <CheckCircle2 className="text-gold" /> });
      setTimeout(() => {
        onNavigate('RelatorioOrcamentos');
        setIsSaving(false);
      }, 1000);
      return;
    }

    const novoOrcamento = {
      id: orcamentoId,
      clienteCodigo: clienteSelecionado,
      itens: itensOrcamento,
      totalGeral,
      sinal: unmaskCurrency(sinal),
      dataEntregaDesejada,
      dataSugeriaPCP,
      status: 'PENDENTE' as const,
      dataCriacao: new Date().toISOString(),
      operador: currentUser?.nome || 'Sistema'
    };

    addOrcamento(novoOrcamento);
    localStorage.removeItem('rf_orcamento_draft');
    toast.success('Orçamento salvo como pendente!', { icon: <CheckCircle2 className="text-gold" /> });
    setTimeout(() => {
      onNavigate('RelatorioOrcamentos');
      setIsSaving(false);
    }, 1000);
  };

  const filteredProdutos = useMemo(() => {
    const allProducts = [
      ...produtosLaser.map(p => ({ ...p, tipo: 'LASER' })),
      ...produtosPapelaria.map(p => ({ ...p, tipo: 'PAPELARIA' }))
      // Adicionar produtos de revenda se houver
    ];
    return allProducts.filter(p => 
      p.nome.toLowerCase().includes(searchTermProduto.toLowerCase()) && p.status === 'ATIVO'
    );
  }, [produtosLaser, produtosPapelaria, searchTermProduto]);

  return (
    <PageLayout title={orcamentoParaEditar ? "Editar Orçamento" : "Novo Orçamento"} onBack={() => onNavigate('Dashboard')}>
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Cabeçalho do Orçamento */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-gold/20">
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-500">Nº do Orçamento</span>
            <span className="text-xl font-bold text-gold-dark">{orcamentoId}</span>
          </div>
          <div className="flex flex-col w-full md:w-auto">
            <label htmlFor="cliente" className="text-xs font-medium text-gray-700 ml-1">Cliente</label>
            <select
              id="cliente"
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
              className="w-full md:w-64 bg-white/40 backdrop-blur-sm border border-gold/30 rounded-xl py-2 px-3 text-sm text-gray-800 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all hover:bg-white/60"
            >
              <option value="">Selecione um cliente</option>
              {clientes.filter(c => c.status !== 'ELIMINADO').map(c => (
                <option key={c.codigo} value={c.codigo}>{c.nome}</option>
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
            {dataSugeriaPCP && (
              <div className="mt-2 text-xs text-gray-600 flex flex-col gap-1">
                <span className="font-medium text-gold-dark">Próxima data livre: {format(new Date(dataSugeriaPCP), 'dd/MM/yyyy', { locale: ptBR })}</span>
                <span>Tempo de produção: {(itensOrcamento.reduce((acc, item) => acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade, 0) / 60).toFixed(1)}h ({Math.ceil(itensOrcamento.reduce((acc, item) => acc + (item.tempoMaquina + item.tempoPintura + item.tempoMontagem) * item.quantidade, 0) / 420)} dias úteis)</span>
              </div>
            )}
            {alertaSobrecarga && (
              <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle size={12} /> Sobrecarga Industrial! Data segura: {format(new Date(dataSugeriaPCP), 'dd/MM/yyyy', { locale: ptBR })}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Carrinho Técnico */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-3xl flex flex-col gap-5 shadow-xl border border-gold/20">
            <h3 className="font-serif font-bold text-lg text-gold-dark border-b border-gold/20 pb-3">Itens do Orçamento</h3>
            
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto custom-scrollbar">
              {itensOrcamento.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum item adicionado ao orçamento.</p>
              ) : (
                itensOrcamento.map(item => (
                  <div key={item.id} className="flex flex-col gap-2 bg-white/50 p-4 rounded-xl border border-gold/10 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 flex flex-col">
                        <span className="font-semibold text-gray-800">{item.nomeProduto}</span>
                        <span className="text-xs text-gray-500">Qtd: {item.quantidade}</span>
                        {item.observacoes && <span className="text-xs text-gray-600 italic mt-1">Obs: {item.observacoes}</span>}
                      </div>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded-md">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 pt-2 border-t border-gold/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase">Material</span>
                        <span className="text-xs font-medium text-gray-700">R$ {(item.custoMaterial || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase">Máquina</span>
                        <span className="text-xs font-medium text-gray-700">R$ {(item.custoMaquina || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase">Mão de Obra</span>
                        <span className="text-xs font-medium text-gray-700">R$ {(item.custoMaoDeObra || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-bold text-gold-dark">Custo Total</span>
                        <span className="text-xs font-bold text-gold-dark">R$ {(item.custoTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-2 bg-gold/5 p-3 rounded-lg border border-gold/20">
                      <div className="flex flex-col w-full md:w-1/3">
                        <label className="text-[10px] font-medium text-gray-600 uppercase mb-1">Margem de Lucro</label>
                        <select
                          value={item.margemLucro || 100}
                          onChange={(e) => handleUpdateItemMargin(item.id, parseInt(e.target.value))}
                          className="w-full bg-white/60 border border-gold/30 rounded-md py-1 px-2 text-sm focus:outline-none focus:border-gold"
                        >
                          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300].map(m => (
                            <option key={m} value={m}>{m}%</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col w-full md:w-2/3">
                        <label className="text-[10px] font-medium text-gray-600 uppercase mb-1">Preço de Venda Unitário</label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-500">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.precoVendaUnitario}
                            onChange={(e) => handleUpdateItemPrice(item.id, e.target.value)}
                            className="flex-1 bg-white/60 border border-gold/30 rounded-md py-1 px-2 text-sm font-bold text-gold-dark focus:outline-none focus:border-gold"
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">
                          Margem calculada: <span className="font-medium text-gold-dark">{(item.margemLucro || 0).toFixed(1)}%</span>
                        </span>
                      </div>
                    </div>
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

              <div className="flex flex-col gap-1 bg-gold/10 p-4 rounded-2xl border border-gold/40 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-gold/20">
                  <DollarSign size={64} />
                </div>
                <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider relative z-10">Sinal (50%)</span>
                <div className="flex items-end gap-1 relative z-10">
                  <span className="text-sm font-medium text-gold-dark mb-1">R$</span>
                  <input
                    type="text"
                    value={sinal}
                    onChange={(e) => setSinal(maskCurrency(e.target.value))}
                    className="bg-transparent text-3xl font-mono font-bold text-gold-dark focus:outline-none w-full"
                  />
                </div>
              </div>
            </div>

              <button 
                onClick={handleSaveOrcamento}
                disabled={isSaving}
                className="mt-auto flex justify-center items-center gap-2 bg-gradient-to-r from-gold-dark to-gold text-white px-6 py-3 rounded-xl font-medium tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                {isSaving ? 'Salvando...' : 'Salvar Orçamento'}
              </button>
          </div>
        </div>

        {/* Modal de Seleção de Produto */}
        {showProdutoModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 border-b border-gold/20 pb-4">
                <h3 className="text-xl font-serif font-bold text-gray-900">Adicionar Produto ao Orçamento</h3>
                <button onClick={() => setShowProdutoModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
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
                        <span className="text-xs text-gray-500">Preço de Venda: R$ {calcularPrecoItem(prod, 1).precoVendaUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        {(prod.tipo === 'LASER' || prod.tipo === 'PAPELARIA') && (
                          <span className="text-[10px] text-gray-400">Tempo de Fabricação: {prod.tempoMaquina || prod.tempoFabricacao}min</span>
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
                  <button 
                    onClick={handleAddProdutoToOrcamento}
                    className="bg-gradient-to-r from-gold-dark to-gold text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-gold/20"
                  >
                    <Plus size={20} />
                    Adicionar ao Orçamento
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botão de alternar visualização */}
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setVisualizacao(prev => prev === 'COMERCIAL' ? 'INDUSTRIAL' : 'COMERCIAL')}
            className="bg-gold-dark text-white px-5 py-2 rounded-full shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            {visualizacao === 'COMERCIAL' ? <Clock size={18} /> : <DollarSign size={18} />}
            Visão {visualizacao === 'COMERCIAL' ? 'Industrial' : 'Comercial'}
          </button>
        </div>

      </div>
    </PageLayout>
  );
};
