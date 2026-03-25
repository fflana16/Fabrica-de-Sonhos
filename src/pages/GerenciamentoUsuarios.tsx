import React, { useState } from 'react';
import { useSistemas, User } from '../SistemasContext';
import { Users, CheckCircle2, XCircle, Shield, User as UserIcon, Trash2, Phone, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const GerenciamentoUsuarios = ({ onNavigate }: { onNavigate: (tela: string) => void }) => {
  const { users, updateUser, removeUser, currentUser } = useSistemas();
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (user: User, role: 'ADMIN' | 'OPERADOR') => {
    setLoading(user.nome);
    try {
      await updateUser(user.nome, { status: 'ATIVO', role });
      toast.success(`Usuário ${user.nome} autorizado como ${role}!`);
    } catch (e) {
      toast.error('Erro ao autorizar usuário.');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (user: User) => {
    if (!confirm(`Tem certeza que deseja rejeitar/excluir o usuário ${user.nome}?`)) return;
    setLoading(user.nome);
    try {
      await removeUser(user.nome);
      toast.success(`Usuário ${user.nome} removido.`);
    } catch (e) {
      toast.error('Erro ao remover usuário.');
    } finally {
      setLoading(null);
    }
  };

  const pendingUsers = users.filter(u => u.status === 'PENDENTE');
  const activeUsers = users.filter(u => u.status === 'ATIVO' && u.nome !== currentUser?.nome);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gold/20 rounded-2xl text-gold-dark border border-gold/30">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-gold-dark">Gerenciamento de Usuários</h2>
            <p className="text-sm text-slate-500">Autorize novos acessos e gerencie permissões</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('Dashboard')}
          className="bg-white border border-gold/30 text-gold-dark px-4 py-2 rounded-xl font-bold hover:bg-gold/5 transition-all"
        >
          Voltar ao Início
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usuários Pendentes */}
        <div className="glass-panel p-6 rounded-3xl border border-gold/20 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="text-yellow-500" size={20} />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Aguardando Autorização</h3>
            <span className="ml-auto bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {pendingUsers.length}
            </span>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <UserIcon className="mx-auto text-gray-300 mb-2" size={40} />
              <p className="text-gray-500 text-sm italic">Nenhum usuário aguardando aprovação.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(user => (
                <div key={user.nome} className="bg-white p-4 rounded-2xl border border-gold/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gold/10 rounded-full flex items-center justify-center text-gold-dark">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.nome}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone size={12} /> {user.telefone}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReject(user)}
                      disabled={loading === user.nome}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                      title="Rejeitar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleApprove(user, 'OPERADOR')}
                      disabled={loading === user.nome}
                      className="bg-gold/10 text-gold-dark py-2 rounded-xl text-xs font-bold hover:bg-gold/20 transition-all flex items-center justify-center gap-2"
                    >
                      <UserIcon size={14} />
                      Aprovar como Operador
                    </button>
                    <button
                      onClick={() => handleApprove(user, 'ADMIN')}
                      disabled={loading === user.nome}
                      className="bg-gold-dark text-white py-2 rounded-xl text-xs font-bold hover:bg-gold transition-all flex items-center justify-center gap-2"
                    >
                      <Shield size={14} />
                      Aprovar como Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usuários Ativos */}
        <div className="glass-panel p-6 rounded-3xl border border-gold/20 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="text-green-500" size={20} />
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Usuários Ativos</h3>
            <span className="ml-auto bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {activeUsers.length}
            </span>
          </div>

          <div className="space-y-3">
            {activeUsers.map(user => (
              <div key={user.nome} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.role === 'ADMIN' ? 'bg-gold/20 text-gold-dark' : 'bg-gray-100 text-gray-500'}`}>
                    {user.role === 'ADMIN' ? <Shield size={16} /> : <UserIcon size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.nome}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{user.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateUser(user.nome, { role: user.role === 'ADMIN' ? 'OPERADOR' : 'ADMIN' })}
                    className="text-xs font-bold text-gold-dark hover:underline"
                  >
                    Mudar para {user.role === 'ADMIN' ? 'Operador' : 'Admin'}
                  </button>
                  <button
                    onClick={() => handleReject(user)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {/* Current User (Self) */}
            <div className="flex items-center justify-between p-3 bg-gold/5 rounded-2xl border border-gold/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-gold-dark">
                  <Shield size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{currentUser?.nome} (Você)</p>
                  <p className="text-[10px] text-gold-dark uppercase tracking-widest font-bold">ADMIN</p>
                </div>
              </div>
              <span className="text-[10px] bg-gold/20 text-gold-dark px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Sessão Atual</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
