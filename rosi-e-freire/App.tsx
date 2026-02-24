import React, { useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { 
  UserPlus, 
  Users, 
  Package, 
  BookOpen, 
  Scissors, 
  FileSignature, 
  BarChart3, 
  ShoppingCart, 
  ClipboardList,
  User,
  Settings,
  Clock,
  Calendar,
  Instagram,
  Phone,
  MapPin,
  DollarSign,
  Cake
} from 'lucide-react';
import { 
  CadastroClientes, RelatorioClientes, CadastroMateriaPrima, RelatorioMateriaPrima,
  CadastroPapelaria, RelatorioPapelaria, CadastroLaser, RelatorioLaser, Configuracoes, CustosFixos, CriarOrcamento, 
  RelatorioOrcamentos, CriarPedidoAvulso, RelatorioPedidos, LinhaProducao, CalendarioIndustrial, Login
} from './pages';
import { SistemasProvider, useSistemas } from './SistemasContext';
import { AniversariosModal } from './components/modals/AniversariosModal';
import { BirthdayAlertModal } from './components/modals/BirthdayAlertModal';
import { isToday, isSameDay, addDays } from 'date-fns';
import { parseDate } from './utils/dateUtils';
import { Cliente } from './SistemasContext';

const Header = ({ onShowAniversarios }: { onShowAniversarios: () => void }) => {
  const [time, setTime] = useState(new Date());
  const { currentUser, logout, clientes } = useSistemas();
  const [aniversariantesHoje, setAniversariantesHoje] = useState<Cliente[]>([]);
  const [aniversariantesProximos, setAniversariantesProximos] = useState<Cliente[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const today = new Date();
    const next7Days = Array.from({ length: 7 }).map((_, i) => addDays(today, i));
    const hoje = clientes.filter(cliente => {
      if (cliente.status === 'ELIMINADO') return false;
      if (!cliente.dataNascimento) return false;
      const dataNascimento = parseDate(cliente.dataNascimento);
      if (!dataNascimento) return false;
      return isToday(new Date(today.getFullYear(), dataNascimento.getMonth(), dataNascimento.getDate()));
    });
    const proximos = clientes.filter(cliente => {
      if (cliente.status === 'ELIMINADO') return false;
      if (!cliente.dataNascimento) return false;
      const dataNascimento = parseDate(cliente.dataNascimento);
      if (!dataNascimento) return false;
      const aniversarioEsteAno = new Date(today.getFullYear(), dataNascimento.getMonth(), dataNascimento.getDate());
      const aniversarioProximoAno = new Date(today.getFullYear() + 1, dataNascimento.getMonth(), dataNascimento.getDate());

      return next7Days.some(day => isSameDay(day, aniversarioEsteAno) || isSameDay(day, aniversarioProximoAno));
    }).filter(cliente => !hoje.some(a => a.codigo === cliente.codigo));

    setAniversariantesHoje(hoje);
    setAniversariantesProximos(proximos);
  }, [clientes, time]); // Recalcular a cada segundo para pegar aniversários que viram à meia-noite

  const getBirthdayButtonClass = () => {
    const hoje = aniversariantesHoje.length > 0;
    const proximos = aniversariantesProximos.length > 0;

    if (hoje && proximos) return 'bg-gradient-to-r from-green-500 to-yellow-500 border-green-600';
    if (hoje) return 'bg-green-500 hover:bg-green-600 border-green-600';
    if (proximos) return 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600';
    return 'bg-orange-500 hover:bg-orange-600 border-orange-600';
  };

  const formattedDate = time.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const formattedTime = time.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="w-full py-3 px-6 flex flex-col md:flex-row justify-between items-center glass-panel rounded-b-3xl mb-4 relative z-10">
      {/* Data e Hora */}
      <div className="flex items-center gap-4 text-gold-dark mb-4 md:mb-0 w-full md:w-1/3">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs font-medium">
            <Calendar size={14} />
            <span className="capitalize">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium mt-0.5">
            <Clock size={14} />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Logo e Nome da Empresa */}
      <div className="flex flex-row items-center justify-center gap-4 w-full md:w-1/3">
        <div className="w-14 h-14 relative flex items-center justify-center shrink-0">
           <div className="absolute inset-0 bg-gold/20 rounded-full blur-md"></div>
           <img 
             src="https://ui-avatars.com/api/?name=RF&background=D4AF37&color=fff&font-size=0.4&rounded=true" 
             alt="Logo Rosi e Freire" 
             className="w-12 h-12 object-contain relative z-10 rounded-full border-2 border-gold shadow-lg"
           />
        </div>
        <div className="flex flex-col items-start">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-left text-gold-gradient tracking-wide leading-tight">
            Rosi e Freire
          </h1>
          <h2 className="font-sans text-[10px] md:text-xs tracking-[0.2em] text-gold-dark uppercase mt-0.5 text-left">
            Fábrica de Sonhos
          </h2>
        </div>
      </div>

      {/* Ícones de Usuário e Configurações */}
      <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-1/3 mt-4 md:mt-0 text-gold-dark">
        <button 
          onClick={onShowAniversarios}
          className={`p-2 rounded-full text-white transition-colors border shadow-sm ${getBirthdayButtonClass()}`}
          title="Aniversariantes"
        >
          <Cake size={20} />
        </button>
        <button className="p-1.5 rounded-full hover:bg-white/40 transition-colors border border-transparent hover:border-gold/30 shadow-sm">
          <Settings size={20} />
        </button>
        <div className="flex items-center gap-2 bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gold/30 shadow-sm">
          <User size={18} />
          <span className="text-xs font-bold">{currentUser?.nome}</span>
          <button 
            onClick={logout}
            className="ml-2 text-[10px] font-black uppercase tracking-tighter text-red-500 hover:text-red-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};

const MenuButton = ({ icon: Icon, title, onClick }: { icon: any, title: string, onClick: () => void, key?: any }) => {
  return (
    <button 
      onClick={onClick}
      className="glass-button flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl gap-1.5 md:gap-2 group h-full w-full"
    >
      <div className="p-2.5 rounded-full bg-gradient-to-br from-gold-light/60 to-gold/20 text-gold-dark group-hover:scale-110 transition-transform duration-300 shadow-inner border border-gold/20">
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <span className="font-sans font-semibold text-gray-800 text-center text-[10px] md:text-xs group-hover:text-gold-dark transition-colors leading-tight">
        {title}
      </span>
    </button>
  );
};

const GridMenu = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const menuItems = [
    { icon: UserPlus, title: "Cadastro de Clientes", tela: "CadastroClientes" },
    { icon: Users, title: "Relatório de Cliente", tela: "RelatorioClientes" },
    { icon: Package, title: "Cadastro de Matéria-Prima", tela: "CadastroMateriaPrima" },
    { icon: ClipboardList, title: "Relatório de Matéria-Prima", tela: "RelatorioMateriaPrima" },
    { icon: BookOpen, title: "Cadastro de Produtos de Papelaria", tela: "CadastroPapelaria" },
    { icon: ClipboardList, title: "Relatório de Produtos de Papelaria", tela: "RelatorioPapelaria" },
    { icon: Scissors, title: "Cadastro de Produtos de Corte a Laser", tela: "CadastroLaser" },
    { icon: ClipboardList, title: "Relatório de Produtos Laser", tela: "RelatorioLaser" },
    { icon: Settings, title: "Custo de Máquina", tela: "Configuracoes" },
    { icon: DollarSign, title: "Custos Fixos", tela: "CustosFixos" },
    { icon: FileSignature, title: "Criar Orçamento", tela: "CriarOrcamento" },
    { icon: BarChart3, title: "Relatório de Orçamentos", tela: "RelatorioOrcamentos" },
    { icon: ShoppingCart, title: "Criar Pedido Avulso", tela: "CriarPedidoAvulso" },
    { icon: ClipboardList, title: "Relatório de Pedidos", tela: "RelatorioPedidos" },
    { icon: Clock, title: "Linha de Produção (O.S.)", tela: "LinhaProducao" },
    { icon: Calendar, title: "Calendário Industrial", tela: "CalendarioIndustrial" },
  ];

  return (
    <main className="flex-grow flex items-center justify-center px-4 py-2 relative z-10">
      <div className="absolute inset-0 max-w-6xl mx-auto my-auto h-[95%] bg-white/10 backdrop-blur-sm rounded-[2.5rem] -z-10 border border-white/20 shadow-2xl"></div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-w-6xl w-full p-4 md:p-6">
        {menuItems.map((item, index) => (
          <MenuButton key={index} icon={item.icon} title={item.title} onClick={() => onNavigate(item.tela)} />
        ))}
      </div>
    </main>
  );
};

const Footer = () => {
  return (
    <footer className="w-full mt-auto bg-black/60 backdrop-blur-md border-t border-gold/30 text-white/90 py-4 px-6 relative z-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Endereço */}
        <div className="flex flex-col items-center md:items-start gap-1 text-xs flex-1">
          <div className="flex items-center gap-1.5 text-gold-light mb-0.5">
            <MapPin size={14} />
            <span className="font-sans font-semibold tracking-wider text-[10px]">ENDEREÇO</span>
          </div>
          <p className="text-center md:text-left font-light leading-relaxed text-gray-300">
            Rua Rio de Janeiro, Nº. 1<br />
            Bairro: Amaro Lanari<br />
            Coronel Fabriciano - MG | CEP: 35171-313
          </p>
        </div>

        {/* Logo Central Rodapé */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          <div className="w-10 h-10 rounded-full border border-gold/50 flex items-center justify-center bg-white/5 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <span className="font-serif font-bold text-gold text-base">RF</span>
          </div>
          <p className="font-serif italic text-gold-light/70 text-xs">Fábrica de Sonhos</p>
        </div>

        {/* Contatos */}
        <div className="flex flex-col items-center md:items-end gap-2 text-xs flex-1">
          <a href="#" className="flex items-center gap-2 hover:text-gold transition-colors cursor-pointer group">
            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-gold/10 transition-colors">
              <Instagram size={14} className="text-gold" />
            </div>
            <span className="font-light tracking-wide text-gray-300">@rosiefreire_fabricadesonhos</span>
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-gold transition-colors cursor-pointer group">
            <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-gold/10 transition-colors">
              <Phone size={14} className="text-gold" />
            </div>
            <span className="font-light tracking-wide text-gray-300">(31) 99444-0225</span>
          </a>
        </div>

      </div>
    </footer>
  );
};

function AppContent() {
  const [telaAtiva, setTelaAtiva] = useState('Dashboard');
  const [showAniversariosModal, setShowAniversariosModal] = useState(false);
  const [showBirthdayAlertModal, setShowBirthdayAlertModal] = useState(false);
  const [aniversariantesHoje, setAniversariantesHoje] = useState<Cliente[]>([]);
  const { currentUser, clientes } = useSistemas();

  const handleNavigation = (tela: string) => {
    console.log('Navigating to:', tela);
    setTelaAtiva(tela);
  };

  useEffect(() => {
    const today = new Date();
    const hoje = clientes.filter(cliente => {
      if (cliente.status === 'ELIMINADO') return false;
      if (!cliente.dataNascimento) return false;
      const dataNascimento = parseDate(cliente.dataNascimento);
      if (!dataNascimento) return false;
      return isToday(new Date(today.getFullYear(), dataNascimento.getMonth(), dataNascimento.getDate()));
    });
    setAniversariantesHoje(hoje);
    if (hoje.length > 0) {
      setShowBirthdayAlertModal(true);
    }
  }, [clientes]);

  const handleShowAniversarios = () => {
    setShowAniversariosModal(true);
  };

  useEffect(() => {
    if (!currentUser && telaAtiva !== 'Dashboard') {
      setTelaAtiva('Dashboard');
    }
  }, [currentUser, telaAtiva]);

  if (!currentUser) {
    return <Login onLoginSuccess={() => handleNavigation('Dashboard')} />;
  }

  const renderTela = () => {
    switch(telaAtiva) {
      case 'Dashboard': return <GridMenu onNavigate={handleNavigation} />;
      case 'CadastroClientes': return <CadastroClientes onNavigate={handleNavigation} />;
      case 'RelatorioClientes': return <RelatorioClientes onNavigate={handleNavigation} />;
      case 'CadastroMateriaPrima': return <CadastroMateriaPrima onNavigate={handleNavigation} />;
      case 'RelatorioMateriaPrima': return <RelatorioMateriaPrima onNavigate={handleNavigation} />;
      case 'CadastroPapelaria': return <CadastroPapelaria onNavigate={handleNavigation} />;
      case 'RelatorioPapelaria': return <RelatorioPapelaria onNavigate={handleNavigation} />;
      case 'CadastroLaser': return <CadastroLaser onNavigate={handleNavigation} />;
      case 'RelatorioLaser': return <RelatorioLaser onNavigate={handleNavigation} />;
      case 'Configuracoes': return <Configuracoes onNavigate={handleNavigation} />;
      case 'CustosFixos': return <CustosFixos onNavigate={handleNavigation} />;
      case 'CriarOrcamento': return <CriarOrcamento onNavigate={handleNavigation} />;
      case 'RelatorioOrcamentos': return <RelatorioOrcamentos onNavigate={handleNavigation} />;
      case 'CriarPedidoAvulso': return <CriarPedidoAvulso onNavigate={handleNavigation} />;
      case 'RelatorioPedidos': return <RelatorioPedidos onNavigate={handleNavigation} />;
      case 'LinhaProducao': return <LinhaProducao onNavigate={handleNavigation} />;
      case 'CalendarioIndustrial': return <CalendarioIndustrial onNavigate={handleNavigation} />;
      default: return <GridMenu onNavigate={handleNavigation} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden selection:bg-gold/30 selection:text-gold-dark">
      <Header onShowAniversarios={handleShowAniversarios} />
      {renderTela()}
      <Footer />

      {showAniversariosModal && (
        <AniversariosModal onClose={() => setShowAniversariosModal(false)} />
      )}
      {showBirthdayAlertModal && aniversariantesHoje.length > 0 && (
        <BirthdayAlertModal 
          onClose={() => setShowBirthdayAlertModal(false)}
          aniversariantes={aniversariantesHoje}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <SistemasProvider>
      <AppContent />
      <Toaster position="top-right" />
    </SistemasProvider>
  );
}

