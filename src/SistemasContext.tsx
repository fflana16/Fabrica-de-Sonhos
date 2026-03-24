import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from './firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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
  isIgreja?: boolean;
}

export interface Orcamento {
  id: string;
  clienteCodigo: string;
  itens: OrcamentoItem[];
  totalGeral: number;
  sinal: number;
  dataEntregaDesejada: string;
  dataSugeriaPCP: string;
  status: 'RASCUNHO' | 'PENDENTE' | 'APROVADO' | 'CONVERTIDO' | 'RECUSADO' | 'CANCELADO';
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
  status: 'Confirmado' | 'Em Produção' | 'Em Acabamento' | 'Pronto' | 'Entregue' | 'Prioridade Urgente' | 'CANCELADO';
  dataCriacao: string;
  operadorCriacao: string;
  historicoStatus: { status: string; data: string; operador: string; observacao?: string }[];
  dataEntregaEfetiva?: string;
  recebidoPor?: string;
  pagamentoSaldo?: number;
  formaPagamentoSaldo?: string;
  justificativaCancelamento?: string;
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
  resetSistema: () => void;
}

const SistemasContext = createContext<SistemasContextType | undefined>(undefined);

export const SistemasProvider = ({ children }: { children: ReactNode }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [materiasPrimas, setMateriasPrimas] = useState<MateriaPrima[]>([]);
  const [produtosPapelaria, setProdutosPapelaria] = useState<ProdutoPapelaria[]>([]);
  const [produtosLaser, setProdutosLaser] = useState<ProdutoLaser[]>([]);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    custoHoraMaquina: 40.00,
    dataUltimaAlteracaoMaquina: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);
  const [materiaPrimaParaEditar, setMateriaPrimaParaEditar] = useState<MateriaPrima | null>(null);
  const [produtoPapelariaParaEditar, setProdutoPapelariaParaEditar] = useState<ProdutoPapelaria | null>(null);
  const [produtoLaserParaEditar, setProdutoLaserParaEditar] = useState<ProdutoLaser | null>(null);
  const [orcamentoParaEditar, setOrcamentoParaEditar] = useState<Orcamento | null>(null);
  const [pedidoParaEditar, setPedidoParaEditar] = useState<Pedido | null>(null);

  // Test connection to Firestore
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!isAuthReady) return;

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as User);
      if (data.length === 0) {
        // Initial bootstrap of users if collection is empty
        const initialUsers = [
          { nome: 'Fernando', senha: 'Henrique10*' },
          { nome: 'Rosiele', senha: 'Henrique10*' },
          { nome: 'Ana Lívia', senha: 'Henrique10*' },
          { nome: 'Henrique', senha: 'Henrique10*' }
        ];
        initialUsers.forEach(u => {
          setDoc(doc(db, 'users', u.nome), u).catch(e => handleFirestoreError(e, OperationType.WRITE, 'users'));
        });
      } else {
        setUsers(data);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));

    const unsubClientes = onSnapshot(collection(db, 'clientes'), (snapshot) => {
      setClientes(snapshot.docs.map(doc => doc.data() as Cliente));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clientes'));

    const unsubMP = onSnapshot(collection(db, 'materiasPrimas'), (snapshot) => {
      setMateriasPrimas(snapshot.docs.map(doc => doc.data() as MateriaPrima));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'materiasPrimas'));

    const unsubProdPapelaria = onSnapshot(collection(db, 'produtosPapelaria'), (snapshot) => {
      setProdutosPapelaria(snapshot.docs.map(doc => doc.data() as ProdutoPapelaria));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'produtosPapelaria'));

    const unsubProdLaser = onSnapshot(collection(db, 'produtosLaser'), (snapshot) => {
      setProdutosLaser(snapshot.docs.map(doc => doc.data() as ProdutoLaser));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'produtosLaser'));

    const unsubConfigs = onSnapshot(doc(db, 'configuracoes', 'global'), (snapshot) => {
      if (snapshot.exists()) {
        setConfiguracoes(snapshot.data() as Configuracoes);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'configuracoes/global'));

    const unsubCustosFixos = onSnapshot(collection(db, 'custosFixos'), (snapshot) => {
      setCustosFixos(snapshot.docs.map(doc => doc.data() as CustoFixo));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'custosFixos'));

    const unsubOrcamentos = onSnapshot(collection(db, 'orcamentos'), (snapshot) => {
      setOrcamentos(snapshot.docs.map(doc => doc.data() as Orcamento));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orcamentos'));

    const unsubPedidos = onSnapshot(collection(db, 'pedidos'), (snapshot) => {
      setPedidos(snapshot.docs.map(doc => doc.data() as Pedido));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'pedidos'));

    return () => {
      unsubUsers();
      unsubClientes();
      unsubMP();
      unsubProdPapelaria();
      unsubProdLaser();
      unsubConfigs();
      unsubCustosFixos();
      unsubOrcamentos();
      unsubPedidos();
    };
  }, [isAuthReady]);

  // Carrega currentUser do localStorage (apenas para manter a sessão do navegador)
  useEffect(() => {
    const saved = localStorage.getItem('rf_current_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
    }
  }, []);

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

  const updateUserPassword = async (nome: string, novaSenha: string) => {
    try {
      await setDoc(doc(db, 'users', nome), { nome, senha: novaSenha }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${nome}`);
    }
  };

  const addCliente = async (novoCliente: Cliente) => {
    try {
      const cliente = { ...novoCliente, status: 'ATIVO' as const, operadorUltimaModificacao: currentUser?.nome || 'Sistema' };
      await setDoc(doc(db, 'clientes', novoCliente.codigo), cliente);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `clientes/${novoCliente.codigo}`);
    }
  };

  const updateCliente = async (codigo: string, dadosAtualizados: Cliente) => {
    try {
      const cliente = { ...dadosAtualizados, operadorUltimaModificacao: currentUser?.nome || 'Sistema' };
      await setDoc(doc(db, 'clientes', codigo), cliente);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `clientes/${codigo}`);
    }
  };

  const excluirCliente = async (codigo: string) => {
    try {
      await updateDoc(doc(db, 'clientes', codigo), { 
        status: 'ELIMINADO', 
        operadorUltimaModificacao: currentUser?.nome || 'Sistema' 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `clientes/${codigo}`);
    }
  };

  const addMateriaPrima = async (novaMP: Omit<MateriaPrima, 'status' | 'dataCadastro' | 'historicoCustos'>) => {
    try {
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
      await setDoc(doc(db, 'materiasPrimas', novaMP.codigo), mpCompleta);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `materiasPrimas/${novaMP.codigo}`);
    }
  };

  const updateMateriaPrima = async (codigo: string, dadosAtualizados: MateriaPrima, operador: string = currentUser?.nome || 'Operador') => {
    try {
      const m = materiasPrimas.find(item => item.codigo === codigo);
      if (!m) return;

      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const novoHistorico = [...(m.historicoCustos || []), {
        data: dataFormatada,
        valor: dadosAtualizados.custoChapa,
        operador: operador
      }];

      await setDoc(doc(db, 'materiasPrimas', codigo), { ...dadosAtualizados, historicoCustos: novoHistorico });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `materiasPrimas/${codigo}`);
    }
  };

  const removerCliente = async (codigo: string) => {
    try {
      await deleteDoc(doc(db, 'clientes', codigo));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `clientes/${codigo}`);
    }
  };

  const removerMateriaPrima = async (codigo: string) => {
    try {
      const m = materiasPrimas.find(item => item.codigo === codigo);
      if (!m) return;

      await updateDoc(doc(db, 'materiasPrimas', codigo), { 
        status: 'ELIMINADO', 
        historicoCustos: [...(m.historicoCustos || []), {
          data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          valor: m.custoChapa,
          operador: currentUser?.nome || 'Sistema'
        }] 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `materiasPrimas/${codigo}`);
    }
  };

  const addProdutoPapelaria = async (novoProduto: Omit<ProdutoPapelaria, 'status' | 'dataCadastro' | 'historicoCustos'>) => {
    try {
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
      await setDoc(doc(db, 'produtosPapelaria', novoProduto.codigo), produtoCompleto);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `produtosPapelaria/${novoProduto.codigo}`);
    }
  };

  const updateProdutoPapelaria = async (codigo: string, dadosAtualizados: ProdutoPapelaria, operador: string = currentUser?.nome || 'Operador') => {
    try {
      const p = produtosPapelaria.find(item => item.codigo === codigo);
      if (!p) return;

      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const novoHistorico = [...(p.historicoCustos || []), {
        data: dataFormatada,
        valor: dadosAtualizados.custoFabricacao,
        operador: operador
      }];

      await setDoc(doc(db, 'produtosPapelaria', codigo), { ...dadosAtualizados, historicoCustos: novoHistorico });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `produtosPapelaria/${codigo}`);
    }
  };

  const removerProdutoPapelaria = async (codigo: string) => {
    try {
      const p = produtosPapelaria.find(item => item.codigo === codigo);
      if (!p) return;

      await updateDoc(doc(db, 'produtosPapelaria', codigo), { 
        status: 'ELIMINADO', 
        historicoCustos: [...(p.historicoCustos || []), {
          data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          valor: p.custoFabricacao,
          operador: currentUser?.nome || 'Sistema'
        }] 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `produtosPapelaria/${codigo}`);
    }
  };

  const addProdutoLaser = async (novoProduto: Omit<ProdutoLaser, 'status' | 'dataCadastro' | 'historicoCustos'>, custoInicial: number = 0) => {
    try {
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
      await setDoc(doc(db, 'produtosLaser', novoProduto.codigo), produtoCompleto);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `produtosLaser/${novoProduto.codigo}`);
    }
  };

  const updateProdutoLaser = async (codigo: string, dadosAtualizados: ProdutoLaser, operador: string = currentUser?.nome || 'Operador', novoCusto: number = 0) => {
    try {
      const p = produtosLaser.find(item => item.codigo === codigo);
      if (!p) return;

      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const novoHistorico = [...(p.historicoCustos || []), {
        data: dataFormatada,
        valor: novoCusto,
        operador: operador
      }];

      await setDoc(doc(db, 'produtosLaser', codigo), { ...dadosAtualizados, historicoCustos: novoHistorico });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `produtosLaser/${codigo}`);
    }
  };

  const removerProdutoLaser = async (codigo: string) => {
    try {
      const p = produtosLaser.find(item => item.codigo === codigo);
      if (!p) return;

      await updateDoc(doc(db, 'produtosLaser', codigo), { 
        status: 'ELIMINADO', 
        historicoCustos: [...(p.historicoCustos || []), {
          data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          valor: 0,
          operador: currentUser?.nome || 'Sistema'
        }] 
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `produtosLaser/${codigo}`);
    }
  };

  const resetSistema = async () => {
    try {
      // This is a dangerous operation, in a real app we might want to be more careful
      const collections = ['clientes', 'materiasPrimas', 'produtosPapelaria', 'produtosLaser', 'orcamentos', 'pedidos', 'custosFixos'];
      for (const coll of collections) {
        const snapshot = await getDocs(collection(db, coll));
        for (const d of snapshot.docs) {
          await deleteDoc(doc(db, coll, d.id));
        }
      }
      await deleteDoc(doc(db, 'configuracoes', 'global'));
      
      // Force reload to ensure everything is clean
      window.location.reload();
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'all');
    }
  };

  const updateConfiguracoes = async (novasConfigs: Partial<Configuracoes>) => {
    try {
      const updated = { ...configuracoes, ...novasConfigs };
      if (novasConfigs.custoHoraMaquina !== undefined) {
        updated.dataUltimaAlteracaoMaquina = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      await setDoc(doc(db, 'configuracoes', 'global'), updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'configuracoes/global');
    }
  };

  const addCustoFixo = async (novoCusto: Omit<CustoFixo, 'id' | 'dataUltimaAlteracao'>) => {
    try {
      const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const id = Date.now().toString();
      const custo: CustoFixo = {
        ...novoCusto,
        id,
        dataUltimaAlteracao: agora
      };
      await setDoc(doc(db, 'custosFixos', id), custo);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'custosFixos');
    }
  };

  const updateCustoFixo = async (id: string, dados: Partial<CustoFixo>) => {
    try {
      const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      await updateDoc(doc(db, 'custosFixos', id), { ...dados, dataUltimaAlteracao: agora });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `custosFixos/${id}`);
    }
  };

  const removerCustoFixo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'custosFixos', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `custosFixos/${id}`);
    }
  };

  const addOrcamento = async (novoOrcamento: Omit<Orcamento, 'status' | 'dataCriacao' | 'operador'>) => {
    try {
      const orcamento: Orcamento = {
        ...novoOrcamento,
        status: 'RASCUNHO',
        dataCriacao: new Date().toISOString(),
        operador: currentUser?.nome || 'Sistema'
      };
      await setDoc(doc(db, 'orcamentos', orcamento.id), orcamento);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orcamentos/${novoOrcamento.id}`);
    }
  };

  const updateOrcamento = async (id: string, dadosAtualizados: Partial<Orcamento>) => {
    try {
      await updateDoc(doc(db, 'orcamentos', id), dadosAtualizados);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `orcamentos/${id}`);
    }
  };

  const addPedido = async (novoPedido: Omit<Pedido, 'id' | 'status' | 'dataCriacao' | 'operadorCriacao' | 'historicoStatus'>) => {
    try {
      const agora = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      // Gerar ID sequencial PC 0000000000
      const lastPedido = pedidos.filter(p => p.id.startsWith('PC ')).sort((a, b) => b.id.localeCompare(a.id))[0];
      let nextNum = 1;
      if (lastPedido) {
        const lastNum = parseInt(lastPedido.id.replace('PC ', ''));
        nextNum = lastNum + 1;
      }
      const newId = `PC ${nextNum.toString().padStart(10, '0')}`;

      const pedido: Pedido = {
        ...novoPedido,
        id: newId,
        status: 'Confirmado',
        dataCriacao: new Date().toISOString(),
        operadorCriacao: currentUser?.nome || 'Sistema',
        historicoStatus: [{ status: 'Confirmado', data: agora, operador: currentUser?.nome || 'Sistema' }]
      };
      await setDoc(doc(db, 'pedidos', newId), pedido);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'pedidos');
    }
  };

  const updatePedido = async (id: string, dadosAtualizados: Partial<Pedido>, operador?: string, observacao?: string) => {
    try {
      const p = pedidos.find(item => item.id === id);
      if (!p) return;

      const updatedPedido: any = { ...dadosAtualizados };
      if (dadosAtualizados.status && dadosAtualizados.status !== p.status) {
        updatedPedido.historicoStatus = [...p.historicoStatus, {
          status: dadosAtualizados.status,
          data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          operador: operador || currentUser?.nome || 'Sistema',
          observacao: observacao
        }];
      }
      await updateDoc(doc(db, 'pedidos', id), updatedPedido);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `pedidos/${id}`);
    }
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
      removerProdutoLaser,
      resetSistema
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
