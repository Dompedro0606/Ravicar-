import React, { useState, useEffect } from 'react';
import { ShieldCheck, LogIn, X, User, UserPlus, Key } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, token: string) => void;
  initialTab?: 'cliente' | 'staff';
}

export function AuthModal({ onClose, onLoginSuccess, initialTab = 'cliente' }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'cliente' | 'staff'>(initialTab);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lock background scroll when the modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'staff') {
      if (!email || !password) {
        setError('Por favor, preencha todos os campos.');
        return;
      }
    } else {
      if (isRegistering) {
        if (!name || !email || !phone || !password) {
          setError('Por favor, preencha todos os campos do cadastro.');
          return;
        }
      } else {
        if (!email || !password) {
          setError('Por favor, preencha todos os campos de login.');
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (activeTab === 'cliente' && isRegistering) {
        // Register Client
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, phone, password }),
        });

        if (res.ok) {
          const data = await res.json();
          onLoginSuccess(data.user, data.token);
          onClose();
        } else {
          const errData = await res.json();
          setError(errData.error || 'Erro ao realizar o cadastro.');
        }
      } else {
        // Login (Client or Staff)
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (res.ok) {
          const data = await res.json();
          onLoginSuccess(data.user, data.token);
          onClose();
        } else {
          const errData = await res.json();
          setError(errData.error || 'Credenciais inválidas.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl shadow-2xl p-6 md:p-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-50 p-2.5 md:p-2 rounded-full bg-gray-200 dark:bg-neutral-900/80 hover:bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition-all cursor-pointer flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 dark:border-neutral-900 mb-6 mt-8 md:mt-2">
          <button
            onClick={() => {
              setActiveTab('cliente');
              setIsRegistering(false);
              setError(null);
            }}
            className={`flex-1 pb-3 text-xs uppercase font-extrabold tracking-wider transition-all duration-300 border-b-2 cursor-pointer ${activeTab === 'cliente' ? 'text-[#FF2D8D] border-[#FF2D8D]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-600 dark:text-gray-300'}`}
          >
            Área do Cliente
          </button>
          <button
            onClick={() => {
              setActiveTab('staff');
              setIsRegistering(false);
              setError(null);
            }}
            className={`flex-1 pb-3 text-xs uppercase font-extrabold tracking-wider transition-all duration-300 border-b-2 cursor-pointer ${activeTab === 'staff' ? 'text-[#FF2D8D] border-[#FF2D8D]' : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-600 dark:text-gray-300'}`}
          >
            Acesso Colaborador
          </button>
        </div>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-3 rounded-full bg-[#FF2D8D]/10 text-[#FF2D8D] mb-3">
            {activeTab === 'staff' ? (
              <ShieldCheck className="w-7 h-7" />
            ) : isRegistering ? (
              <UserPlus className="w-7 h-7" />
            ) : (
              <User className="w-7 h-7" />
            )}
          </div>
          <h2 className="font-display font-black text-lg text-gray-900 dark:text-white">
            {activeTab === 'staff' 
              ? 'Acesso Restrito RaviCar' 
              : isRegistering 
                ? 'Criar Conta de Cliente' 
                : 'Portal do Cliente RaviCar'
            }
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[280px] mx-auto">
            {activeTab === 'staff'
              ? 'Insira suas credenciais corporativas autorizadas.'
              : isRegistering
                ? 'Cadastre-se para favoritar carros e acompanhar agendamentos.'
                : 'Entre com e-mail e senha para gerenciar seus agendamentos.'
            }
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 font-bold leading-relaxed">
              ⚠️ {error}
            </div>
          )}

          {activeTab === 'cliente' && isRegistering && (
            <>
              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none transition"
                  placeholder="Seu nome"
                />
              </div>
              
              <div>
                <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1.5">WhatsApp / Celular</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none transition"
                  placeholder="(11) 99999-9999"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1.5">
              {activeTab === 'staff' ? 'E-mail Corporativo' : 'E-mail de Login'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none transition"
              placeholder={activeTab === 'staff' ? 'seu_nome@ravicar.com' : 'seu_email@provedor.com'}
            />
          </div>

          <div>
            <label className="block text-gray-600 dark:text-gray-400 font-semibold mb-1.5">
              {activeTab === 'staff' ? 'Senha Operacional' : 'Sua Senha'}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-gray-900 dark:text-white outline-none transition"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] hover:glow-pink font-bold text-gray-900 dark:text-white uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {loading 
              ? 'Aguarde...' 
              : activeTab === 'staff' 
                ? 'Entrar no Sistema' 
                : isRegistering 
                  ? 'Criar Minha Conta' 
                  : 'Entrar no Portal'
            }
            <LogIn className="w-4 h-4" />
          </button>
        </form>

        {/* Client Toggle Sign up / Sign in */}
        {activeTab === 'cliente' && (
          <div className="mt-4 text-center text-xs">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-[#FF6FB5] hover:underline font-bold"
            >
              {isRegistering 
                ? 'Já tem uma conta? Faça Login' 
                : 'Não tem conta? Cadastre-se agora!'
              }
            </button>
          </div>
        )}

        {/* Info Footnote */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-900 text-center text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
          {activeTab === 'staff'
            ? 'Para solicitar novas contas operacionais (Vendedor ou Admin), fale com o TI.'
            : 'Seus dados pessoais estão protegidos de acordo com as diretrizes da LGPD.'
          }
        </div>
      </div>
    </div>
  );
}
