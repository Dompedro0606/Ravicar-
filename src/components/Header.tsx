import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ShieldAlert, LogIn, LogOut, Bell, BellOff, Settings, User, Mail } from 'lucide-react';
import { UserProfile, SiteSettings } from '../types';
// @ts-ignore
import ravicarLogo from '../assets/images/ravicar_logo_1783395977905.jpg';

export function Logo({ className = "w-10 h-10", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 cursor-pointer">
      <div className={`relative bg-neutral-900 flex items-center justify-center rounded-full overflow-hidden border border-[#FF2D8D]/20 transition-all duration-300 hover:scale-105 ${className}`}>
        <img
          src={ravicarLogo}
          alt="RaviCar Logo"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="flex items-center justify-center pt-0.5">
          <span className="font-logo tracking-wide text-3xl leading-none text-white select-none flex items-center" style={{ fontFamily: '"Satisfy", "Playball", "Great Vibes", cursive' }}>
            Ravi<span className="text-[#FF2D8D]">Car</span>
          </span>
        </div>
      )}
    </div>
  );
}

interface HeaderProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  onNavigate: (page: string, vehicleId?: string) => void;
  currentPage: string;
  settings: SiteSettings;
}

export function Header({ currentUser, onLogout, onOpenAuth, onNavigate, currentPage, settings }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  // Notifications State & Polling
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeNotifTab, setActiveNotifTab] = useState<'push' | 'email'>('push');
  const [selectedEmailHtml, setSelectedEmailHtml] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<any | null>(null);
  
  const seenIdsRef = useRef<string[]>([]);

  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Chime note 1: High quality modern bell chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      // Chime note 2: slightly delayed harmonious pitch
      setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5 note
          gain2.gain.setValueAtTime(0.08, ctx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start();
          osc2.stop(ctx.currentTime + 0.6);
        } catch (e) {}
      }, 100);
    } catch (e) {
      console.log('Audio feedback not initialized:', e);
    }
  };

  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([120, 80, 120]);
      } catch (e) {
        console.log('Haptics not supported/allowed:', e);
      }
    }
  };

  useEffect(() => {
    // Check local notification settings
    const saved = localStorage.getItem('ravicar_notifications');
    if (saved === 'granted') {
      setNotifPermission('granted');
    } else if (saved === 'denied') {
      setNotifPermission('denied');
    } else {
      // Trigger prompt after 5 seconds for simulation
      const timer = setTimeout(() => {
        if (localStorage.getItem('ravicar_notifications') === null) {
          setShowNotifBanner(true);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          
          const currentIds = data.map((n: any) => n.id);
          
          // Trigger native browser notification, chime, and haptics on new arrivals
          if (seenIdsRef.current.length > 0) {
            const freshNotifs = data.filter((n: any) => !seenIdsRef.current.includes(n.id));
            if (freshNotifs.length > 0) {
              playNotificationChime();
              triggerHapticFeedback();
              
              // Trigger in-app glassmorphic toast notification popup
              const pushNotifs = freshNotifs.filter((n: any) => n.type === 'push');
              if (pushNotifs.length > 0) {
                const latestNotif = pushNotifs[0];
                setActiveToast(latestNotif);
                setTimeout(() => {
                  setActiveToast((prev: any) => prev && prev.id === latestNotif.id ? null : prev);
                }, 8000);
              }
            }
            freshNotifs.forEach((n: any) => {
              if (n.type === 'push' && localStorage.getItem('ravicar_notifications') === 'granted' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  new Notification(n.title, {
                    body: n.message,
                    icon: '/favicon.png'
                  });
                } catch (e) {
                  console.log('Error triggering native notification:', e);
                }
              }
            });
          }
          
          seenIdsRef.current = currentIds;
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestPermission = () => {
    localStorage.setItem('ravicar_notifications', 'granted');
    setNotifPermission('granted');
    setShowNotifBanner(false);
    
    // Check native browser permission
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  };

  const handleDeclinePermission = () => {
    localStorage.setItem('ravicar_notifications', 'denied');
    setNotifPermission('denied');
    setShowNotifBanner(false);
  };

  const handleNav = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header id="nav_header" className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#1A1A1A] h-20 flex items-center px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Logo */}
          <div onClick={() => handleNav('home')}>
            <Logo />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest">
            <button 
              onClick={() => handleNav('home')} 
              className={`transition-all duration-200 cursor-pointer py-1 ${currentPage === 'home' ? 'text-[#FF2D8D] border-b-2 border-[#FF2D8D]' : 'text-gray-400 hover:text-white'}`}
            >
              Início
            </button>
            <button 
              onClick={() => handleNav('catalogo')} 
              className={`transition-all duration-200 cursor-pointer py-1 ${currentPage === 'catalogo' ? 'text-[#FF2D8D] border-b-2 border-[#FF2D8D]' : 'text-gray-400 hover:text-white'}`}
            >
              Estoque
            </button>
            <button 
              onClick={() => handleNav('financiamento')} 
              className={`transition-all duration-200 cursor-pointer py-1 ${currentPage === 'financiamento' ? 'text-[#FF2D8D] border-b-2 border-[#FF2D8D]' : 'text-gray-400 hover:text-white'}`}
            >
              Financiamento
            </button>
            <button 
              onClick={() => handleNav('avaliacao')} 
              className={`transition-all duration-200 cursor-pointer py-1 ${currentPage === 'avaliacao' ? 'text-[#FF2D8D] border-b-2 border-[#FF2D8D]' : 'text-gray-400 hover:text-white'}`}
            >
              Avalie seu Usado
            </button>
            <button 
              onClick={() => handleNav('combo')} 
              className={`transition-all duration-200 cursor-pointer py-1 flex items-center gap-1 font-bold ${currentPage === 'combo' ? 'text-[#FF2D8D] border-b-2 border-[#FF2D8D]' : 'text-[#FF6FB5] hover:text-white'}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2D8D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF2D8D]"></span>
              </span>
              Simulador Combo 🔄
            </button>
            <button 
              onClick={() => handleNav('termos')} 
              className={`transition-all duration-200 cursor-pointer py-1 ${currentPage === 'termos' ? 'text-[#FF2D8D] border-b-2 border-[#FF2D8D]' : 'text-gray-400 hover:text-white'}`}
            >
              Termos de Uso
            </button>
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title="Central de Notificações"
                className={`p-2 rounded-full border border-[#1A1A1A] hover:bg-[#1A1A1A] transition-all cursor-pointer relative ${isNotifOpen ? 'text-[#FF2D8D] border-[#FF2D8D]/40 bg-[#1A1A1A]' : 'text-gray-400'}`}
              >
                <Bell className={`w-4 h-4 ${notifications.some(n => !n.read) ? 'animate-pulse text-[#FF2D8D]' : ''}`} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </button>
            </div>

            {/* Admin/User profile & login */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleNav(
                    currentUser.role === 'Cliente' ? 'cliente' : 
                    currentUser.role === 'Administrador' ? 'admin' : 'vendedor'
                  )}
                  className="px-5 py-2 text-xs border border-[#FF2D8D] text-[#FF2D8D] rounded-full uppercase font-bold hover:bg-[#FF2D8D] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  {currentUser.role === 'Cliente' ? 'Área do Cliente' : `Painel ${currentUser.role}`}
                </button>
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-semibold">{currentUser.name}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sair"
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-[#1A1A1A] transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2 text-xs border border-[#FF2D8D] text-[#FF2D8D] rounded-full uppercase font-bold hover:bg-[#FF2D8D] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Entrar / Cadastrar
              </button>
            )}
          </div>

          {/* Mobile Hamburguer and Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-full hover:bg-[#1A1A1A] relative text-gray-400"
            >
              <Bell className={`w-4 h-4 ${notifications.some(n => !n.read) ? 'text-[#FF2D8D] animate-pulse' : ''}`} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full text-white hover:bg-[#1A1A1A]"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-black border-b border-[#1A1A1A] py-4 px-4 flex flex-col gap-3 shadow-xl">
            <button 
              onClick={() => handleNav('home')} 
              className={`text-left py-2 border-b border-[#1A1A1A] ${currentPage === 'home' ? 'text-[#FF2D8D] font-bold' : 'text-gray-300'}`}
            >
              Início
            </button>
            <button 
              onClick={() => handleNav('catalogo')} 
              className={`text-left py-2 border-b border-[#1A1A1A] ${currentPage === 'catalogo' ? 'text-[#FF2D8D] font-bold' : 'text-gray-300'}`}
            >
              Estoque
            </button>
            <button 
              onClick={() => handleNav('financiamento')} 
              className={`text-left py-2 border-b border-[#1A1A1A] ${currentPage === 'financiamento' ? 'text-[#FF2D8D] font-bold' : 'text-gray-300'}`}
            >
              Financiamento
            </button>
            <button 
              onClick={() => handleNav('avaliacao')} 
              className={`text-left py-2 border-b border-[#1A1A1A] ${currentPage === 'avaliacao' ? 'text-[#FF2D8D] font-bold' : 'text-gray-300'}`}
            >
              Avalie seu Usado
            </button>
            <button 
              onClick={() => handleNav('combo')} 
              className={`text-left py-2 border-b border-[#1A1A1A] flex items-center gap-2 ${currentPage === 'combo' ? 'text-[#FF2D8D] font-bold' : 'text-[#FF6FB5] font-semibold'}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2D8D] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF2D8D]"></span>
              </span>
              Simulador Combo 🔄
            </button>
            <button 
              onClick={() => handleNav('termos')} 
              className={`text-left py-2 border-b border-[#1A1A1A] ${currentPage === 'termos' ? 'text-[#FF2D8D] font-bold' : 'text-gray-300'}`}
            >
              Termos de Uso
            </button>

            {currentUser ? (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2 py-1">
                  <User className="w-4 h-4 text-[#FF2D8D]" />
                  <span className="text-xs text-gray-300">{currentUser.name} ({currentUser.role === 'Cliente' ? 'Cliente' : currentUser.role})</span>
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleNav(
                      currentUser.role === 'Cliente' ? 'cliente' : 
                      currentUser.role === 'Administrador' ? 'admin' : 'vendedor'
                    );
                  }}
                  className="w-full text-center py-2 rounded-lg bg-[#1A1A1A] border border-[#FF2D8D]/30 text-[#FF2D8D] font-semibold text-xs"
                >
                  {currentUser.role === 'Cliente' ? 'Ir para Área do Cliente' : 'Ir para o Painel'}
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-center py-2 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 font-semibold text-xs mt-1"
                >
                  Sair da Conta
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAuth();
                }}
                className="w-full text-center py-2 rounded-lg bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] text-white font-semibold text-xs shadow-lg mt-2"
              >
                Entrar / Cadastrar
              </button>
            )}
          </div>
        )}
      </header>

      {/* Notification Perm banner */}
      {showNotifBanner && (
        <div className="bg-[#1A1A1A] border-b border-[#FF2D8D]/30 py-3 px-4 transition-all duration-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[#FF2D8D]/10 text-[#FF2D8D]">
                <Bell className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <p className="font-semibold text-sm text-white">RaviCar quer te avisar!</p>
                <p className="text-xs text-gray-400">Receba notificações limpas no navegador sempre que um novo veículo chegar ao estoque.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeclinePermission}
                className="px-3 py-1.5 rounded-md hover:bg-black/30 text-gray-400 text-xs transition"
              >
                Agora não
              </button>
              <button
                onClick={handleRequestPermission}
                className="px-4 py-1.5 rounded-md bg-[#FF2D8D] text-white text-xs font-bold shadow-md transition hover:bg-[#FF6FB5]"
              >
                Ativar Notificações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Side Drawer Overlay */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-end p-0 md:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)}>
          <div 
            className="w-full h-full md:h-[650px] md:max-w-md bg-neutral-950 border-l md:border border-neutral-800 md:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#FF2D8D]" />
                <h3 className="font-display font-bold text-white text-base">Central de Notificações</h3>
              </div>
              <button 
                onClick={() => setIsNotifOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex border-b border-neutral-800 bg-black/50 p-2 gap-1">
              <button
                onClick={() => setActiveNotifTab('push')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeNotifTab === 'push' ? 'bg-[#FF2D8D] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-neutral-900'}`}
              >
                📱 Alertas no Celular ({notifications.filter(n => n.type === 'push').length})
              </button>
              <button
                onClick={() => setActiveNotifTab('email')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeNotifTab === 'email' ? 'bg-[#FF2D8D] text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-neutral-900'}`}
              >
                📧 E-mails no Gmail ({notifications.filter(n => n.type === 'email').length})
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Permission Helper Banner */}
              <div className="p-3 bg-[#FF2D8D]/5 border border-[#FF2D8D]/20 rounded-xl flex flex-col gap-2">
                <div className="flex gap-2 items-start">
                  <div className="p-1.5 rounded-full bg-[#FF2D8D]/10 text-[#FF2D8D] shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Alertas no Celular / Navegador</h4>
                    <p className="text-[11px] text-gray-400">Ative o recebimento nativo no seu celular para receber alertas em tempo real fora do site.</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleRequestPermission}
                    className="text-[10px] font-bold uppercase tracking-wider text-[#FF2D8D] hover:text-[#FF6FB5] transition cursor-pointer"
                  >
                    {notifPermission === 'granted' ? '✓ Alertas Ativos' : 'Ativar Alertas Nativos'}
                  </button>
                </div>
              </div>

              {notifications.filter(n => n.type === activeNotifTab).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500 gap-2">
                  <BellOff className="w-10 h-10 text-neutral-800 animate-bounce" />
                  <p className="text-xs font-bold text-white">Nenhuma notificação</p>
                  <p className="text-[11px] text-gray-400 max-w-[240px] mx-auto">Cadastre um novo veículo no Painel Administrativo para ver o alerta celular e o e-mail chegando em tempo real!</p>
                </div>
              ) : (
                notifications
                  .filter(n => n.type === activeNotifTab)
                  .map((notif: any) => (
                    <div 
                      key={notif.id}
                      className="p-3.5 rounded-xl bg-neutral-900/50 border border-neutral-800 flex flex-col gap-2 hover:border-neutral-700 transition"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-gray-500 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        {activeNotifTab === 'email' && (
                          <span className="text-[10px] font-bold text-[#FF2D8D] bg-[#FF2D8D]/10 px-2 py-0.5 rounded-full uppercase tracking-widest text-[9px]">
                            Gmail
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">{notif.message}</p>
                      
                      {activeNotifTab === 'push' && notif.actionUrl && (
                        <button
                          onClick={() => {
                            setIsNotifOpen(false);
                            window.location.hash = notif.actionUrl;
                          }}
                          className="mt-1 self-start text-[10px] font-bold text-[#FF2D8D] uppercase tracking-wider hover:underline cursor-pointer"
                        >
                          Ver Veículo no Estoque ➔
                        </button>
                      )}

                      {activeNotifTab === 'email' && notif.htmlBody && (
                        <button
                          onClick={() => {
                            setSelectedEmailHtml(notif.htmlBody);
                          }}
                          className="mt-1 self-start px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#FF2D8D]" />
                          Visualizar E-mail Recebido
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex justify-between gap-2 items-center">
              <span className="text-[10px] text-gray-500">Destinatário Admin: {settings.email}</span>
              {notifications.length > 0 && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/notifications/clear', { method: 'POST' });
                      if (res.ok) {
                        setNotifications([]);
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="px-3 py-1 text-[10px] font-bold uppercase text-red-400 hover:text-red-300 hover:bg-red-950/10 rounded transition cursor-pointer"
                >
                  Limpar Tudo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulated HTML Email Viewer Modal */}
      {selectedEmailHtml && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md" onClick={() => setSelectedEmailHtml(null)}>
          <div 
            className="w-full max-w-2xl h-[85vh] bg-neutral-900 rounded-2xl border border-neutral-800 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-800 bg-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#FF2D8D]" />
                <div>
                  <h3 className="font-display font-bold text-white text-base">Simulador de E-mail de Notificação (Gmail)</h3>
                  <p className="text-[10px] text-gray-400">Enviado para: <span className="font-mono text-gray-200">gabrielvitor72103@gmail.com</span></p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedEmailHtml(null)}
                className="p-1 rounded-full hover:bg-neutral-800 text-gray-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated Gmail Header info */}
            <div className="px-4 py-2 bg-neutral-950 text-[11px] text-gray-400 border-b border-neutral-800 flex flex-wrap items-center gap-x-4 gap-y-1">
              <div><strong>De:</strong> RaviCar Alertas &lt;noreply@ravicar.online&gt;</div>
              <div><strong>Para:</strong> Gabriel &lt;gabrielvitor72103@gmail.com&gt;</div>
              <div className="ml-auto text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono uppercase tracking-wider">Entregue com Sucesso</div>
            </div>

            {/* Email Render Iframe */}
            <div className="flex-1 bg-[#0d0d0d] p-4 flex justify-center overflow-hidden">
              <iframe 
                title="Simulated Email HTML"
                srcDoc={selectedEmailHtml}
                className="w-full h-full border border-neutral-800 rounded-xl"
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-900 text-center">
              <button
                onClick={() => setSelectedEmailHtml(null)}
                className="px-6 py-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Fechar E-mail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time In-App Glassmorphic Toast Notification */}
      {activeToast && (
        <div 
          onClick={() => {
            if (activeToast.actionUrl) {
              window.location.hash = activeToast.actionUrl;
            }
            setActiveToast(null);
          }}
          className="fixed top-4 left-4 right-4 md:top-24 md:left-auto md:right-8 z-[9999] max-w-sm bg-black/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-[0_10px_40px_rgba(255,45,141,0.25)] p-4 flex gap-3.5 border-l-4 border-l-[#FF2D8D] cursor-pointer hover:border-neutral-700 transition-all duration-300 animate-slide-in-right"
        >
          <div className="w-11 h-11 shrink-0 bg-neutral-900 border border-[#FF2D8D]/25 rounded-full flex items-center justify-center overflow-hidden">
            <img src={ravicarLogo} alt="RaviCar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[#FF2D8D] uppercase tracking-wider flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF2D8D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FF2D8D]"></span>
                </span>
                NOVO CADASTRO
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(null);
                }}
                className="text-gray-400 hover:text-white transition p-1 hover:bg-neutral-800 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-white mt-1 leading-snug">{activeToast.title}</h4>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">{activeToast.message}</p>
            <div className="mt-2.5 flex justify-between items-center">
              <span className="text-[9px] text-gray-500">Agora mesmo</span>
              <span className="text-[10px] font-bold text-[#FF2D8D] hover:underline uppercase tracking-wider flex items-center gap-1">
                Ver Estoque ➔
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
