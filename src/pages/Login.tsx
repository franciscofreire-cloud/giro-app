import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Lock, Mail, Eye, EyeOff, Loader2, KeyRound, ShieldAlert, CheckCircle2, Zap } from 'lucide-react';

export function Login() {
  const login = useStore((s) => s.login);
  const users = useStore((s) => s.users);
  const updatePassword = useStore((s) => s.updatePassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados do Modal "Esqueci a Senha"
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [masterCode, setMasterCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Email e Código Mestre, 2: Nova Senha
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await login(email.trim().toLowerCase(), password);
      if (!success) {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao fazer login. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenForgotModal() {
    setForgotEmail('');
    setMasterCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotStep(1);
    setForgotError('');
    setForgotSuccess('');
    setShowForgotModal(true);
  }

  async function handleVerifyRecovery(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');

    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail || !masterCode) {
      setForgotError('Preencha o e-mail e o código de recuperação.');
      return;
    }

    if (!users[targetEmail]) {
      setForgotError('Nenhum usuário encontrado com este e-mail.');
      return;
    }

    // Código mestre de emergência
    if (masterCode.toUpperCase() !== 'GIRO2026') {
      setForgotError('Código de recuperação inválido.');
      return;
    }

    // Se o código estiver correto, vai para o passo 2
    setForgotStep(2);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');

    if (!newPassword || !confirmNewPassword) {
      setForgotError('Preencha e confirme a nova senha.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('As senhas não coincidem.');
      return;
    }

    setForgotLoading(true);
    try {
      const success = await updatePassword(forgotEmail.trim().toLowerCase(), newPassword);
      if (success) {
        setForgotSuccess('Senha redefinida com sucesso! Você já pode fazer login.');
        setTimeout(() => {
          setShowForgotModal(false);
        }, 3000);
      } else {
        setForgotError('Erro ao atualizar a senha no banco de dados.');
      }
    } catch (err) {
      setForgotError('Erro inesperado na redefinição. Tente novamente.');
      console.error(err);
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-zinc-950 p-4 relative overflow-hidden select-none">
      {/* Background gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-3xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative z-10">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-4 animate-pulse">
            <Zap size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Giro App</h2>
          <p className="text-sm text-zinc-400 mt-1">Gestão de Estoque e Vendas</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-400 text-xs">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400">E-mail de Acesso</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none transition-all duration-200"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-400">Senha</label>
              <button
                type="button"
                onClick={handleOpenForgotModal}
                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-xl bg-zinc-950/60 border border-zinc-800 py-3 pl-11 pr-11 text-sm text-white placeholder-zinc-600 focus:border-emerald-500/60 focus:outline-none transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 disabled:bg-emerald-500/50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 mt-6 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <span>Entrar no Sistema</span>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center text-[10px] text-zinc-600 leading-normal">
          <p>Login Administrador padrão: <strong>gilbertofreire624@gmail.com</strong></p>
          <p className="mt-1">Senha padrão de fábrica: <strong>giro123</strong></p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-4">
              <KeyRound className="text-emerald-400" size={20} />
              <h3 className="text-base font-bold text-white">Recuperação de Senha</h3>
            </div>

            {forgotSuccess ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-medium text-emerald-400">{forgotSuccess}</p>
              </div>
            ) : (
              <>
                {/* Informação sobre ativação futura */}
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 text-zinc-400 text-xs leading-relaxed mb-4">
                  <p className="font-semibold text-zinc-300 mb-1">ℹ️ Recuperação por E-mail</p>
                  A funcionalidade automática por e-mail está programada para ativação futura. Por enquanto, utilize a <strong>Redefinição de Emergência</strong> abaixo ou contate o suporte.
                </div>

                {forgotError && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-500/10 border border-rose-500/20 p-2.5 text-rose-400 text-[11px]">
                    <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                    <p>{forgotError}</p>
                  </div>
                )}

                {forgotStep === 1 ? (
                  <form onSubmit={handleVerifyRecovery} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">E-mail cadastrado</label>
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Ex: gilbertofreire624@gmail.com"
                        className="w-full rounded-lg bg-zinc-950/60 border border-zinc-800 py-2.5 px-3 text-xs text-white placeholder-zinc-700 focus:border-emerald-500/60 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Código Mestre de Emergência</label>
                      <input
                        type="password"
                        value={masterCode}
                        onChange={(e) => setMasterCode(e.target.value)}
                        placeholder="Digite o código mestre do sistema"
                        className="w-full rounded-lg bg-zinc-950/60 border border-zinc-800 py-2.5 px-3 text-xs text-white placeholder-zinc-700 focus:border-emerald-500/60 focus:outline-none"
                        required
                      />
                      <p className="text-[9px] text-zinc-600 mt-1">Dica: O código de recuperação inicial do sistema é <strong>GIRO2026</strong></p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold"
                      >
                        Validar Código
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(false)}
                        className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold"
                      >
                        Voltar
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg p-2 font-medium">
                      Código validado! Defina sua nova senha para o e-mail: <strong>{forgotEmail}</strong>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Nova Senha (mín. 6 dígitos)</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nova senha"
                        className="w-full rounded-lg bg-zinc-950/60 border border-zinc-800 py-2.5 px-3 text-xs text-white placeholder-zinc-700 focus:border-emerald-500/60 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        className="w-full rounded-lg bg-zinc-950/60 border border-zinc-800 py-2.5 px-3 text-xs text-white placeholder-zinc-700 focus:border-emerald-500/60 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold disabled:bg-emerald-500/50"
                      >
                        {forgotLoading ? 'Salvando...' : 'Salvar Nova Senha'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotStep(1)}
                        className="flex-1 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
