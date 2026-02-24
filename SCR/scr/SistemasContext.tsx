import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  nome: string;
  senha: string;
}

export interface Cliente {
  codigo: string;
  dataCadastro: string;
  nome: string;
  dataNascimento: string;
  whatsapp: string;
  telefone: string;
  instagram: string;
  status?: 'ATIVO' | 'ELIMINADO';
  cpfCnpj?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  operadorUltimaModificacao?: string;
}

export interface HistoricoCusto {
  data: string;
  valor: number;
  operador: string;
}

export interface MateriaPrima {
  codigo: string;
  nome: string;
  largura: number;
  altura: number;
  custoChapa: number;
  areaTotal: number;
  custoPorMm2: number;
  status: 'ATIVO' | 'ELIMINADO';
  dataCadastro: string;
  historicoCustos: HistoricoCusto[];
}

export interface ProdutoPapelaria {
  codigo: string;
  nome: string;
  tempoFabricacao: number;
  custoFabricacao: number;
  precoVendaSugerido: number;
  status: 'ATIVO' | 'ELIMINADO';
  dataCadastro: string;
  historicoCustos: HistoricoCusto[];
}

export interface ProdutoLaser {
  codigo: string;
  nome: string;
  materiaPrimaCodigo: string;
  largura: number;
  altura: number;
  tempoMaquina: number;
  tempoPintura?: number;
  tempoMontagem?: number;
  status: 'ATIVO' | 'ELIMINADO';
  dataCadastro: string;
  historicoCustos: HistoricoCusto[];
}

export interface CustoFixo {
  id: string;
  nome: string;
  valor: number;
  dataUltimaAlteracao: string;
}

export interface Configuracoes {
  custoHoraMaquina: number;
  dataUltimaAlteracaoMaquina: string;
}

export interface OrcamentoItem {
  id: string;
  produtoCodigo: string;
  nomeProduto: string;
  quantidade: number;
  tempoMaquina: number;
  tempoPintura: number;
  tempoMontagem: number;
  custoMaterial: number;
  custoMaquina?: number;
  custoMaoDeObra?: number;
  custoTotal?: number;
  margemLucro?: number;
  precoVendaUnitario: number;
  observacoes?: string;
  tipoProduto: 'LASER' | 'PAPELARIA' | 'REVENDA';
}

export interface Orcamento {
  id: string;
  clienteCodigo: string;
  itens: OrcamentoItem[];
  totalGeral: number;
  sinal: number;
  dataEntregaDesejada: string;
  dataSugeriaPCP: string;
  status: 'PENDENTE' | 'APROVADO' | 'CONVERTIDO' | 'RECUSADO' | 'CANCELADO';
  dataCriacao: string;
  operador: string;
  justificativaCancelamento?: string;
}

export interface PedidoItem extends OrcamentoItem {
  justificativaRecusa?: string;
  aprovado: boolean;
}

export interface Pedido {
  id: string;
  orcamentoId?: string;
  clienteCodigo: string;
  itens: PedidoItem[];
  totalGeral: number;
  sinalPago: number;
  formaPagamento: string;
  dataEntrega: string;
  dataSugeriaPCP: string;
  status: 'Confirmado' | 'Em Produção' | 'Em Acabamento' | 'Pronto' | 'Entregue' | 'Prioridade Urgente';
  dataCriacao: string;
  operadorCriacao: string;
  historicoStatus: { status: string; data: string; operador: string; observacao?: string }[];
}

interface SistemasContextType {
  clientes: Cliente[];
  materiasPrimas: MateriaPrima[];
  produtosPapelaria: ProdutoPapelaria[];
  produtosLaser: ProdutoLaser[];
  custosFixos: CustoFixo[];
  configuracoes: Configuracoes;
  orcamentos: Orcamento[];
  pedidos: Pedido[];
  currentUser: User | null;
  users: User[];
  clienteParaEditar: Cliente | null;
  setClienteParaEditar: (cliente: Cliente | null) => void;
  materiaPrimaParaEditar: MateriaPrima | null;
  setMateriaPrimaParaEditar: (mp: MateriaPrima | null) => void;
  produtoPapelariaParaEditar: ProdutoPapelaria | null;
  setProdutoPapelariaParaEditar: (produto: ProdutoPapelaria | null) => void;
  produtoLaserParaEditar: ProdutoLaser | null;
  setProdutoLaserParaEditar: (produto: ProdutoLaser | null) => void;
  orcamentoParaEditar: Orcamento | null;
  setOrcamentoParaEditar: (orcamento: Orcamento | null) => void;
  pedidoParaEditar: Pedido | null;
  setPedidoParaEditar: (pedido: Pedido | null) => void;
  login: (nome: string, senha: string) => boolean;
  logout: () => void;
  updateUserPassword: (nome: string, novaSenha: string) => void;
  updateConfiguracoes: (novasConfigs: Partial<Configuracoes>) => void;
  addCustoFixo: (novoCusto: Omit<CustoFixo, 'id' | 'dataUltimaAlteracao'>) => void;
  updateCustoFixo: (id: string, dados: Partial<CustoFixo>) => void;
  removerCustoFixo: (id: string) => void;
  addCliente: (novoCliente: Cliente) => void;
  updateCliente: (codigo: string, dadosAtualizados: Cliente) => void;
  excluirCliente: (codigo: string) => void;
  addMateriaPrima: (novaMP: Omit<MateriaPrima, 'status' | 'dataCadastro' | 'historicoCustos'>) => void;
  updateMateriaPrima: (codigo: string, dadosAtualizados: MateriaPrima, operador?: string) => void;
  addProdutoPapelaria: (novoProduto: Omit<ProdutoPapelaria, 'status' | 'dataCadastro' | 'historicoCustos'>) => void;
  updateProdutoPapelaria: (codigo: string, dadosAtualizados: ProdutoPapelaria, operador?: string) => void;
  addProdutoLaser: (novoProduto: Omit<ProdutoLaser, 'status' | 'dataCadastro' | 'historicoCustos'>, custoInicial?: number) => void;
  updateProdutoLaser: (codigo: string, dadosAtualizados: ProdutoLaser, operador?: string, novoCusto?: number) => void;
  addOrcamento: (novoOrcamento: Omit<Orcamento, 'status' | 'dataCriacao' | 'operador'>) => void;
  updateOrcamento: (id: string, dadosAtualizados: Partial<Orcamento>) => void;
  addPedido: (novoPedido: Omit<Pedido, 'status' | 'dataCriacao' | 'operadorCriacao' | 'historicoStatus'>) => void;
  updatePedido: (id: string, dadosAtualizados: Partial<Pedido>, operador?: string, observacao?: string) => void;
  removerCliente: (codigo: string) => void;
  removerMateriaPrima: (codigo: string) => void;
  removerProdutoPapelaria: (codigo: string) => void;
  removerProdutoLaser: (codigo: string) => void;
}

const SistemasContext = createContext<SistemasContextType | undefined>(undefined);

export const SistemasProvider = ({ children }: { children: ReactNode }) => {
  // Carrega do localStorage para garantir persistência entre F5
  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('rf_clientes');
    if (saved) return JSON.parse(saved);

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return [
      {
        codigo: 'CLI00001',
        dataCadastro: '2023-01-15T10:00:00Z',
        nome: 'Aniversariante de Hoje',
        dataNascimento: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
        whatsapp: '5531999999999',
        telefone: '5531999999999',
        instagram: '@hoje',
        status: 'ATIVO',
      },
      {
        codigo: 'CLI00002',
        dataCadastro: '2023-01-16T11:00:00Z',
        nome: 'Aniversariante de Amanhã',
        dataNascimento: `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`,
        whatsapp: '5531888888888',
        telefone: '5531888888888',
        instagram: '@amanha',
        status: 'ATIVO',
      },
    ];
  });

  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>(() => {
    const saved = localStorage.getItem('rf_materias_primas');
    return saved ? JSON.parse(saved) : [];
  });

  const [produtosPapelaria, setProdutosPapelaria] = useState<ProdutoPapelaria[]>(() => {
    const saved = localStorage.getItem('rf_produtos_papelaria');
    return saved ? JSON.parse(saved) : [];
  });

  const [produtosLaser, setProdutosLaser] = useState<ProdutoLaser[]>(() => {
    const saved = localStorage.getItem('rf_produtos_laser');
    return saved ? JSON.parse(saved) : [];
  });

  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(() => {
    const saved = localStorage.getItem('rf_configuracoes');
    return saved ? JSON.parse(saved) : {
      custoHoraMaquina: 40.00,
      dataUltimaAlteracaoMaquina: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  });

  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>(() => {
    const saved = localStorage.getItem('rf_custos_fixos');
    if (saved) return JSON.parse(saved);
    
    const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return [
      { id: '1', nome: 'Água', valor: 60.00, dataUltimaAlteracao: agora },
      { id: '2', nome: 'Energia', valor: 100.00, dataUltimaAlteracao: agora },
      { id: '3', nome: 'Telefones', valor: 100.00, dataUltimaAlteracao: agora },
      { id: '4', nome: 'Internet', valor: 130.00, dataUltimaAlteracao: agora },
      { id: '5', nome: 'Investimentos', valor: 1000.00, dataUltimaAlteracao: agora },
      { id: '6', nome: 'Salários', valor: 6000.00, dataUltimaAlteracao: agora },
    ];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('rf_users');
    if (saved) return JSON.parse(saved);
    return [
      { nome: 'Fernando', senha: 'Henrique10*' },
      { nome: 'Rosiele', senha: 'Henrique10*' },
      { nome: 'Ana Lívia', senha: 'Henrique10*' },
      { nome: 'Henrique', senha: 'Henrique10*' }
    ];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('rf_current_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(() => {
    const saved = localStorage.getItem('rf_orcamentos');
    return saved ? JSON.parse(saved) : [];
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const saved = localStorage.getItem('rf_pedidos');
    return saved ? JSON.parse(saved) : [];
  });
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [materiaPrimaParaEditar, setMateriaPrimaParaEditar] = useState<MateriaPrima | null>(null);
  const [produtoPapelariaParaEditar, setProdutoPapelariaParaEditar] = useState<ProdutoPapelaria | null>(null);
  const [produtoLaserParaEditar, setProdutoLaserParaEditar] = useState<ProdutoLaser | null>(null);
  const [orcamentoParaEditar, setOrcamentoParaEditar] = useState<Orcamento | null>(null);
  const [pedidoParaEditar, setPedidoParaEditar] = useState<Pedido | null>(null);

  useEffect(() => {
    localStorage.setItem('rf_clientes', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('rf_materias_primas', JSON.stringify(materiasPrimas));
  }, [materiasPrimas]);

  useEffect(() => {
    localStorage.setItem('rf_produtos_papelaria', JSON.stringify(produtosPapelaria));
  }, [produtosPapelaria]);

  useEffect(() => {
    localStorage.setItem('rf_produtos_laser', JSON.stringify(produtosLaser));
  }, [produtosLaser]);

  useEffect(() => {
    localStorage.setItem('rf_configuracoes', JSON.stringify(configuracoes));
  }, [configuracoes]);

  useEffect(() => {
    localStorage.setItem('rf_custos_fixos', JSON.stringify(custosFixos));
  }, [custosFixos]);

  useEffect(() => {
    localStorage.setItem('rf_orcamentos', JSON.stringify(orcamentos));
  }, [orcamentos]);

  useEffect(() => {
    localStorage.setItem('rf_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  useEffect(() => {
    localStorage.setItem('rf_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('rf_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('rf_current_user');
    }
  }, [currentUser]);

  const login = (nome: string, senha: string) => {
    const user = users.find(u => u.nome.toLowerCase() === nome.toLowerCase() && u.senha === senha);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    // Hard reset of application data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('rf_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const updateUserPassword = (nome: string, novaSenha: string) => {
    setUsers(prev => prev.map(u => u.nome.toLowerCase() === nome.toLowerCase() ? { ...u, senha: novaSenha } : u));
  };

  const addCliente = (novoCliente: Cliente) => {
    setClientes(prev => [...prev, { ...novoCliente, status: 'ATIVO', operadorUltimaModificacao: currentUser?.nome || 'Sistema' }]);
  };

  const updateCliente = (codigo: string, dadosAtualizados: Cliente) => {
    setClientes(prev => prev.map(c => c.codigo === codigo ? { ...dadosAtualizados, status: dadosAtualizados.status || c.status || 'ATIVO', operadorUltimaModificacao: currentUser?.nome || 'Sistema' } : c));
  };

  const excluirCliente = (codigo: string) => {
    setClientes(prev => prev.map(c => 
      c.codigo === codigo ? { ...c, status: 'ELIMINADO', operadorUltimaModificacao: currentUser?.nome || 'Sistema' } : c
    ));
  };

  const addMateriaPrima = (novaMP: Omit<MateriaPrima, 'status' | 'dataCadastro' | 'historicoCustos'>) => {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const mpCompleta: MateriaPrima = {
      ...novaMP,
      status: 'ATIVO',
      dataCadastro: dataFormatada,
      historicoCustos: [{
        data: dataFormatada,
        valor: novaMP.custoChapa,
        operador: currentUser?.nome || 'Sistema (Inicial)'
      }]
    };
    setMateriasPrimas(prev => [...prev, mpCompleta]);
  };

  const updateMateriaPrima = (codigo: string, dadosAtualizados: MateriaPrima, operador: string = currentUser?.nome || 'Operador') => {
    setMateriasPrimas(prev => prev.map(m => {
      if (m.codigo === codigo) {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const novoHistorico = [...(m.historicoCustos || []), {
          data: dataFormatada,
          valor: dadosAtualizados.custoChapa,
          operador: operador
        }];

        return { ...m, ...dadosAtualizados, historicoCustos: novoHistorico };
      }
      return m;
    }));
  };

  const removerCliente = (codigo: string) => {
    setClientes(prev => prev.filter(c => c.codigo !== codigo));
  };

  const removerMateriaPrima = (codigo: string) => {
    setMateriasPrimas(prev => prev.map(m => 
      m.codigo === codigo ? { ...m, status: 'ELIMINADO', historicoCustos: [...(m.historicoCustos || []), {
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        valor: m.custoChapa,
        operador: currentUser?.nome || 'Sistema'
      }] } : m
    ));
  };

  const addProdutoPapelaria = (novoProduto: Omit<ProdutoPapelaria, 'status' | 'dataCadastro' | 'historicoCustos'>) => {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const produtoCompleto: ProdutoPapelaria = {
      ...novoProduto,
      status: 'ATIVO',
      dataCadastro: dataFormatada,
      historicoCustos: [{
        data: dataFormatada,
        valor: novoProduto.custoFabricacao,
        operador: currentUser?.nome || 'Sistema (Inicial)'
      }]
    };
    setProdutosPapelaria(prev => [...prev, produtoCompleto]);
  };

  const updateProdutoPapelaria = (codigo: string, dadosAtualizados: ProdutoPapelaria, operador: string = currentUser?.nome || 'Operador') => {
    setProdutosPapelaria(prev => prev.map(p => {
      if (p.codigo === codigo) {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const novoHistorico = [...(p.historicoCustos || []), {
          data: dataFormatada,
          valor: dadosAtualizados.custoFabricacao,
          operador: operador
        }];

        return { ...p, ...dadosAtualizados, historicoCustos: novoHistorico };
      }
      return p;
    }));
  };

  const removerProdutoPapelaria = (codigo: string) => {
    setProdutosPapelaria(prev => prev.map(p => 
      p.codigo === codigo ? { ...p, status: 'ELIMINADO', historicoCustos: [...(p.historicoCustos || []), {
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        valor: p.custoFabricacao,
        operador: currentUser?.nome || 'Sistema'
      }] } : p
    ));
  };

  const addProdutoLaser = (novoProduto: Omit<ProdutoLaser, 'status' | 'dataCadastro' | 'historicoCustos'>, custoInicial: number = 0) => {
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const produtoCompleto: ProdutoLaser = {
      ...novoProduto,
      status: 'ATIVO',
      dataCadastro: dataFormatada,
      historicoCustos: [{
        data: dataFormatada,
        valor: custoInicial,
        operador: currentUser?.nome || 'Sistema (Inicial)'
      }]
    };
    setProdutosLaser(prev => [...prev, produtoCompleto]);
  };

  const updateProdutoLaser = (codigo: string, dadosAtualizados: ProdutoLaser, operador: string = currentUser?.nome || 'Operador', novoCusto: number = 0) => {
    setProdutosLaser(prev => prev.map(p => {
      if (p.codigo === codigo) {
        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        const novoHistorico = [...(p.historicoCustos || []), {
          data: dataFormatada,
          valor: novoCusto,
          operador: operador
        }];

        return { ...p, ...dadosAtualizados, historicoCustos: novoHistorico };
      }
      return p;
    }));
  };

  const removerProdutoLaser = (codigo: string) => {
    setProdutosLaser(prev => prev.map(p => 
      p.codigo === codigo ? { ...p, status: 'ELIMINADO', historicoCustos: [...(p.historicoCustos || []), {
        data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        valor: 0,
        operador: currentUser?.nome || 'Sistema'
      }] } : p
    ));
  };

  const updateConfiguracoes = (novasConfigs: Partial<Configuracoes>) => {
    setConfiguracoes(prev => {
      const updated = { ...prev, ...novasConfigs };
      if (novasConfigs.custoHoraMaquina !== undefined) {
        updated.dataUltimaAlteracaoMaquina = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      return updated;
    });
  };

  const addCustoFixo = (novoCusto: Omit<CustoFixo, 'id' | 'dataUltimaAlteracao'>) => {
    const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const custo: CustoFixo = {
      ...novoCusto,
      id: Date.now().toString(),
      dataUltimaAlteracao: agora
    };
    setCustosFixos(prev => [...prev, custo]);
  };

  const updateCustoFixo = (id: string, dados: Partial<CustoFixo>) => {
    const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setCustosFixos(prev => prev.map(c => 
      c.id === id ? { ...c, ...dados, dataUltimaAlteracao: agora } : c
    ));
  };

  const removerCustoFixo = (id: string) => {
    setCustosFixos(prev => prev.filter(c => c.id !== id));
  };

  const addOrcamento = (novoOrcamento: Omit<Orcamento, 'status' | 'dataCriacao' | 'operador'>) => {
    const orcamento: Orcamento = {
      ...novoOrcamento,
      status: 'PENDENTE',
      dataCriacao: new Date().toISOString(),
      operador: currentUser?.nome || 'Sistema'
    };
    setOrcamentos(prev => [...prev, orcamento]);
  };

  const updateOrcamento = (id: string, dadosAtualizados: Partial<Orcamento>) => {
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, ...dadosAtualizados } : o));
  };

  const addPedido = (novoPedido: Omit<Pedido, 'status' | 'dataCriacao' | 'operadorCriacao' | 'historicoStatus'>) => {
    const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const pedido: Pedido = {
      ...novoPedido,
      status: 'Confirmado',
      dataCriacao: new Date().toISOString(),
      operadorCriacao: currentUser?.nome || 'Sistema',
      historicoStatus: [{ status: 'Confirmado', data: agora, operador: currentUser?.nome || 'Sistema' }]
    };
    setPedidos(prev => [...prev, pedido]);
  };

  const updatePedido = (id: string, dadosAtualizados: Partial<Pedido>, operador?: string, observacao?: string) => {
    setPedidos(prev => prev.map(p => {
      if (p.id === id) {
        const updatedPedido = { ...p, ...dadosAtualizados };
        if (dadosAtualizados.status && dadosAtualizados.status !== p.status) {
          updatedPedido.historicoStatus = [...p.historicoStatus, {
            status: dadosAtualizados.status,
            data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            operador: operador || currentUser?.nome || 'Sistema',
            observacao: observacao
          }];
        }
        return updatedPedido;
      }
      return p;
    }));
  };

  return (
    <SistemasContext.Provider value={{ 
      clientes, 
      materiasPrimas, 
      produtosPapelaria,
      produtosLaser,
      custosFixos,
      configuracoes,
      orcamentos,
      pedidos,
      currentUser,
      users,
      clienteParaEditar,
      setClienteParaEditar,
      materiaPrimaParaEditar,
      setMateriaPrimaParaEditar,
      produtoPapelariaParaEditar,
      setProdutoPapelariaParaEditar,
      produtoLaserParaEditar,
      setProdutoLaserParaEditar,
      orcamentoParaEditar,
      setOrcamentoParaEditar,
      pedidoParaEditar,
      setPedidoParaEditar,
      login,
      logout,
      updateUserPassword,
      updateConfiguracoes,
      addCustoFixo,
      updateCustoFixo,
      removerCustoFixo,
      addCliente, 
      updateCliente,
      excluirCliente,
      addMateriaPrima,
      updateMateriaPrima,
      addProdutoPapelaria,
      updateProdutoPapelaria,
      addProdutoLaser,
      updateProdutoLaser,
      addOrcamento,
      updateOrcamento,
      addPedido,
      updatePedido,
      removerCliente,
      removerMateriaPrima,
      removerProdutoPapelaria,
      removerProdutoLaser
    }}>
      {children}
    </SistemasContext.Provider>
  );
};

export const useSistemas = () => {
  const context = useContext(SistemasContext);
  if (!context) {
    throw new Error('useSistemas deve ser usado dentro de um SistemasProvider');
  }
  return context;
};
