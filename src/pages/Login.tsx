import React, { useState, useEffect } from 'react';
import { useSistemas, User as UserType } from '../SistemasContext';
import { LogIn, Key, User, CheckCircle2, AlertCircle, RefreshCw, Phone, HelpCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

export const Login = ({ onLoginSuccess }: { onLoginSuccess: () => void }) => {
  const { login, updateUserPassword, updateUser, addUser, users, currentUser } = useSistemas();
  const [mode, setMode] = useState<'login' | 'changePassword' | 'register' | 'forgotPassword' | 'modifyProfile'>('login');
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  useEffect(() => {
    if (mode === 'modifyProfile' && currentUser) {
      setNome(currentUser.nome);
      setTelefone(currentUser.telefone || '');
    }
  }, [mode, currentUser]);

  const maskPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

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
    if (!nome || !senha || !confirmarSenha || !telefone) {
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

    addUser({ nome, senha, telefone });
    toast.success('Usuário cadastrado com sucesso!');
    setMode('login');
    setSenha('');
    setConfirmarSenha('');
    setTelefone('');
  };

  const handleModifyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !telefone) {
      toast.error('Preencha todos os campos.');
      return;
    }

    const updateData: Partial<UserType> = { telefone };
    if (novaSenha) {
      if (novaSenha !== confirmarSenha) {
        toast.error('As senhas não coincidem.');
        return;
      }
      updateData.senha = novaSenha;
    }

    updateUser(nome, updateData);
    toast.success('Cadastro atualizado com sucesso!');
    setMode('login');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = telefone.replace(/\D/g, '');
    const user = users.find(u => u.nome.toLowerCase() === nome.toLowerCase() && u.telefone?.replace(/\D/g, '') === cleanPhone);
    
    if (user) {
      const message = `Olá ${user.nome}, sua senha no sistema Rosi e Freire é: ${user.senha}`;
      const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast.success('Link do WhatsApp aberto!');
      setMode('login');
    } else {
      toast.error('Usuário ou telefone não encontrados.');
    }
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-xs font-bold text-gold-dark hover:text-gold transition-colors flex items-center justify-center gap-1.5 py-2 bg-gold/5 rounded-xl border border-gold/10"
                >
                  <User size={14} />
                  Novo Usuário
                </button>

                <button
                  type="button"
                  onClick={() => setMode('forgotPassword')}
                  className="text-xs font-bold text-gold-dark hover:text-gold transition-colors flex items-center justify-center gap-1.5 py-2 bg-gold/5 rounded-xl border border-gold/10"
                >
                  <HelpCircle size={14} />
                  Esqueci a Senha
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('changePassword')}
                  className="text-xs font-bold text-gold-dark hover:text-gold transition-colors flex items-center justify-center gap-1.5 py-2 bg-gold/5 rounded-xl border border-gold/10"
                >
                  <RefreshCw size={14} />
                  Alterar Senha
                </button>

                <button
                  type="button"
                  onClick={() => setMode('modifyProfile')}
                  className="text-xs font-bold text-gold-dark hover:text-gold transition-colors flex items-center justify-center gap-1.5 py-2 bg-gold/5 rounded-xl border border-gold/10"
                >
                  <RefreshCw size={14} />
                  Modificar Cadastro
                </button>
              </div>
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
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">WhatsApp (com DDD)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-dark/60">
                  <Phone size={16} />
                </div>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold transition-all"
                  required
                />
              </div>
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
        ) : mode === 'forgotPassword' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-gold-dark text-center mb-2">Recuperar Senha</h2>
            <p className="text-xs text-center text-slate-500 mb-4">Informe seu usuário e o WhatsApp cadastrado para receber sua senha.</p>
            
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
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">WhatsApp Cadastrado</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-dark/60">
                  <Phone size={16} />
                </div>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-3 rounded-2xl border border-gold/30 font-bold text-gold-dark hover:bg-gold/10 transition-all"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <Phone size={18} />
                Enviar WhatsApp
              </button>
            </div>
          </form>
        ) : mode === 'modifyProfile' ? (
          <form onSubmit={handleModifyProfile} className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-gold-dark text-center mb-2">Modificar Cadastro</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Usuário</label>
              <input
                type="text"
                value={nome}
                disabled
                className="w-full bg-gray-100 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm text-gray-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">WhatsApp (com DDD)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-dark/60">
                  <Phone size={16} />
                </div>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-gold transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gold/10 mt-4">
              <p className="text-[10px] text-slate-500 mb-2 uppercase font-bold tracking-widest">Alterar Senha (opcional)</p>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Nova Senha</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Deixe em branco para não alterar"
                    className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gold-dark uppercase tracking-wider ml-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full bg-white/60 border border-gold/30 rounded-2xl py-2.5 px-4 text-sm focus:outline-none focus:border-gold transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="flex-1 py-3 rounded-2xl border border-gold/30 font-bold text-gold-dark hover:bg-gold/10 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gold-dark text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-gold transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Salvar
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
