import React, { useState } from 'react';
import { useSistemas, User } from '../SistemasContext';
import { PageLayout } from '../components/PageLayout';
import { Search, User as UserIcon, Phone, Shield, Edit, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RelatorioUsuariosProps {
  onNavigate: (tela: string) => void;
  onBack: () => void;
  onBackStep: () => void;
  onBackToCategory?: () => void;
  categoryName?: string;
}

export const RelatorioUsuarios = ({ 
  onNavigate, 
  onBack, 
  onBackStep,
  onBackToCategory,
  categoryName
}: RelatorioUsuariosProps) => {
  const { users, updateUser, currentUser } = useSistemas();
  const [busca, setBusca] = useState('');
  const [userEditando, setUserEditando] = useState<User | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'OPERADOR' | 'VISITANTE'>('OPERADOR');
  const [editSenha, setEditSenha] = useState('');

  const handleEliminar = async (user: User) => {
    if (user.nome === currentUser?.nome) {
      toast.error('Você não pode desativar seu próprio usuário.');
      return;
    }

    if (confirm(`Deseja realmente desativar o usuário ${user.nome}? Ele perderá o acesso ao sistema.`)) {
      try {
        await updateUser(user.nome, { status: 'INATIVO' });
        toast.success(`Usuário ${user.nome} desativado com sucesso.`);
      } catch (error) {
        toast.error('Erro ao desativar usuário.');
      }
    }
  };

  const handleModificar = (user: User) => {
    setUserEditando(user);
    setEditNome(user.nome);
    setEditTelefone(user.telefone || '');
    setEditRole(user.role);
    setEditSenha(user.senha);
  };

  const salvarEdicao = async () => {
    if (!userEditando) return;
    try {
      await updateUser(userEditando.nome, {
        telefone: editTelefone,
        role: editRole,
        senha: editSenha
      });
      toast.success('Usuário atualizado com sucesso!');
      setUserEditando(null);
    } catch (error) {
      toast.error('Erro ao atualizar usuário.');
    }
  };

  const usuariosFiltrados = users.filter(u => 
    (u.nome.toLowerCase().includes(busca.toLowerCase()) || 
     (u.telefone && u.telefone.includes(busca)))
  );

  return (
    <PageLayout 
      title="Relatório de Usuários Cadastrados" 
      onBack={onBack} 
      onBackStep={onBackStep}
      onBackToCategory={onBackToCategory}
      categoryName={categoryName}
    >
      <div className="w-full max-w-[98%] space-y-4">
        {/* ... existing search bar ... */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-2xl border border-gold/20">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dark" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/50 border border-gold/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/50"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertCircle size={16} className="text-gold-dark" />
            <span>Todos os usuários (Ativos e Inativos) são exibidos nesta lista.</span>
          </div>
        </div>

        {/* ... existing table ... */}
        <div className="glass-panel overflow-hidden rounded-3xl border border-gold/20 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gold/10 text-gold-dark uppercase text-xs font-bold tracking-wider">
                  <th className="px-6 py-4">Usuário</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">Tipo de Acesso</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((user) => (
                    <tr key={user.nome} className="hover:bg-gold/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gold/10 rounded-lg text-gold-dark">
                            <UserIcon size={18} />
                          </div>
                          <span className="font-bold text-gray-900">{user.nome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone size={14} />
                          <span>{user.telefone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {user.status === 'ATIVO' ? (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                              ATIVO
                            </span>
                          ) : user.status === 'INATIVO' ? (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                              INATIVO
                            </span>
                          ) : (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                              PENDENTE
                            </span>
                          )}
                          {user.role === 'ADMIN' ? (
                            <span className="flex items-center gap-1 bg-gold/20 text-gold-dark px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <Shield size={12} /> ADMIN
                            </span>
                          ) : user.role === 'VISITANTE' ? (
                            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <UserIcon size={12} /> VISITANTE
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                              <UserIcon size={12} /> OPERADOR
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {currentUser?.role !== 'VISITANTE' && (
                            <>
                              <button
                                onClick={() => handleModificar(user)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                              >
                                <Edit size={14} />
                                Modificar
                              </button>
                              <button
                                onClick={() => handleEliminar(user)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                              >
                                <Trash2 size={14} />
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {userEditando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gold/20 max-h-[90vh] flex flex-col">
            <div className="bg-gold-gradient p-6 text-white flex-shrink-0">
              <h3 className="text-xl font-serif font-bold flex items-center gap-2">
                <Edit size={24} />
                Modificar Usuário
              </h3>
              <p className="text-white/80 text-sm">Editando: {userEditando.nome}</p>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Telefone</label>
                <input
                  type="text"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Senha</label>
                <input
                  type="text"
                  value={editSenha}
                  onChange={(e) => setEditSenha(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo de Acesso</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'ADMIN' | 'OPERADOR' | 'VISITANTE')}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold/50 outline-none"
                >
                  <option value="OPERADOR">OPERADOR</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                  <option value="VISITANTE">VISITANTE (APENAS VISUALIZAÇÃO)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setUserEditando(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarEdicao}
                  className="flex-1 py-3 bg-gold-dark text-white font-bold rounded-xl hover:bg-gold transition-colors shadow-lg shadow-gold/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
};
