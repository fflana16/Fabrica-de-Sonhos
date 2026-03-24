import React, { useState } from 'react';
import { useSistemas } from '../SistemasContext';
import { LogIn, Key, User, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const { login, updateUserPassword, addUser, users } = useSistemas();
  const [mode, setMode] = useState<'login' | 'changePassword' | 'register'>('login');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(nome, senha)) {
      toast.success(`Bem-vindo, ${nome}!`, {
        icon: <CheckCircle2 className="text-green-500" />,
      });
      onLoginSuccess();
    } else {
      toast.error('Usuário ou senha incorretos.', {
        icon: <AlertCircle className="text-red-500" />,
      });
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !senha || !confirmarSenha) {
      toast.error('Preencha todos os campos.');
      return;
    }

    if (users.find(u => u.nome.toLowerCase() === nome.toLowerCase())) {
      toast.error('Este usuário já existe.');
      return;
    }

    if (senha !== confirmarSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }

    addUser({ nome, senha });
    toast.success('Usuário cadastrado com sucesso!');
    setMode('login');
    setSenha('');
    setConfirmarSenha('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !senha || !novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos.');
      return;
    }

    const user = users.find(u => u.nome.toLowerCase() === nome.toLowerCase() && u.senha === senha);
    if (!user) {
      toast.error('Senha atual incorreta.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem.');
      return;
    }

    updateUserPassword(nome, novaSenha);
    toast.success('Senha alterada com sucesso!');
    setMode('login');
    setSenha('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-gold/10 p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-[2.5rem] shadow-2xl border border-gold/30 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gold/20 rounded-full flex items-center justify-center mb-4 border border-gold/40 shadow-inner">
            <LogIn size={40} className="text-gold-dark" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-gold-dark">Rosi e Freire</h1>
          <p className="text-sm text-slate-500 font-medium tracking-widest uppercase mt-1">Fábrica de Sonhos</p>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Usuário</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-dark/60">
                  <User size={18} />
                </div>
                <select
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-white/60 backdrop-blur-sm border border-gold/30 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  required
                >
                  <option value="">Selecione seu usuário</option>
                  {users.map(u => (
                    <option key={u.nome} value={u.nome}>{u.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Senha</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-dark/60">
                  <Key size={18} />
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/60 backdrop-blur-sm border border-gold/30 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-gold-dark to-gold text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Entrar no Sistema
            </button>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="w-full text-xs font-bold text-gold-dark hover:text-gold transition-colors flex items-center justify-center gap-1.5"
              >
                <User size={14} />
                Cadastrar Novo Usuário
              </button>

              <button
                type="button"
                onClick={() => setMode('changePassword')}
                className="w-full text-xs font-bold text-gold-dark hover:text-gold transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                Alterar Senha
              </button>
            </div>
          </form>
        ) : mode === 'register' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-gold-dark text-center mb-2">Novo Usuário</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Nome de Usuário</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Fernando"
                className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Confirmar Senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-3 rounded-2xl border border-gold/30 font-bold text-gold-dark hover:bg-gold/10 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gold-dark text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-gold transition-all"
              >
                Cadastrar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-gold-dark text-center mb-2">Alterar Senha</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Usuário</label>
              <select
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                required
              >
                <option value="">Selecione seu usuário</option>
                {users.map(u => (
                  <option key={u.nome} value={u.nome}>{u.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Senha Atual</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-3 rounded-2xl border border-gold/30 font-bold text-gold-dark hover:bg-gold/10 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gold-dark text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-gold transition-all"
              >
                Salvar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
