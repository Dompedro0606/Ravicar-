import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ShieldAlert, LogIn, LogOut, Bell, BellOff, Settings, User, Mail, Palette } from 'lucide-react';
import { UserProfile, SiteSettings } from '../types';
// @ts-ignore
import ravicarLogo from '../assets/images/ravicar_logo_1783395977905.jpg';

export function Logo({ className = "w-10 h-10", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 cursor-pointer">
      <div className={`relative bg-white dark:bg-neutral-900 flex items-center justify-center rounded-full overflow-hidden border border-[var(--brand-color)]/20 transition-all duration-300 hover:scale-105 ${className}`}>
        <img
          src={ravicarLogo}
          alt="RaviCar Logo"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="flex items-center justify-center pt-0.5">
          <span className="font-logo tracking-wide text-3xl leading-none text-gray-900 dark:text-white select-none flex items-center" style={{ fontFamily: '"Satisfy", "Playball", "Great Vibes", cursive' }}>
            Ravi<span className="text-[#FF2A7A]">Car</span>
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
  const [activeToast, setActiveToast] = useState<any | null>(null);
  const [browserPermission, setBrowserPermission] = useState<string>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  
  const seenIdsRef = useRef<string[]>([]);
  
  // Theme Switching State & Effects
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    return localStorage.getItem('ravicar_theme') || 'original';
  });
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset classes and attributes
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
    
    if (['original', 'preto', 'azul'].includes(activeTheme)) {
      document.documentElement.classList.add('dark');
      if (activeTheme !== 'original') {
        document.documentElement.setAttribute('data-theme', activeTheme);
      }
    } else {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
  }, [activeTheme]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeTheme = (newTheme: string) => {
    setActiveTheme(newTheme);
    localStorage.setItem('ravicar_theme', newTheme);
    setIsThemeOpen(false);
  };

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
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
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
              if (n.type === 'push' && localStorage.getItem('ravicar_notifications') === 'granted' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  // Android Chrome and modern mobile browsers require using the Service Worker registration to show notifications.
                  if ('serviceWorker' in navigator && navigator.serviceWorker.register) {
                    navigator.serviceWorker.ready.then(registration => {
                      registration.showNotification(n.title, {
                        body: n.message,
                        icon: '/logo.png',
                        badge: '/favicon.png',
                        tag: n.id,
                        vibrate: [120, 80, 120]
                      } as any).catch(err => {
                        console.log('ServiceWorker failed to show notification:', err);
                        // Fallback
                        try {
                          new Notification(n.title, { body: n.message, icon: '/logo.png' });
                        } catch (e) {}
                      });
                    }).catch(err => {
                      console.log('Service worker not ready for notification:', err);
                      // Fallback
                      try {
                        new Notification(n.title, { body: n.message, icon: '/logo.png' });
                      } catch (e) {}
                    });
                  } else {
                    try {
                      new Notification(n.title, {
                        body: n.message,
                        icon: '/logo.png'
                      });
                    } catch (e) {
                      console.log('Error triggering native notification:', e);
                    }
                  }
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
        setBrowserPermission(permission);
        console.log('Notification permission:', permission);
      });
    }
  };

  const triggerNative = (n: any) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.register) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(n.title, {
          body: n.message,
          icon: '/logo.png',
          badge: '/favicon.png',
          tag: n.id,
          vibrate: [120, 80, 120]
        } as any).catch(err => {
          console.log('ServiceWorker failed to show notification:', err);
          try {
            new Notification(n.title, { body: n.message, icon: '/logo.png' });
          } catch (e) {}
        });
      }).catch(err => {
        console.log('Service worker not ready:', err);
        try {
          new Notification(n.title, { body: n.message, icon: '/logo.png' });
        } catch (e) {}
      });
    } else {
      try {
        new Notification(n.title, {
          body: n.message,
          icon: '/logo.png'
        });
      } catch (e) {}
    }
  };

  const testNativeNotification = () => {
    playNotificationChime();
    triggerHapticFeedback();

    const mockNotif = {
      id: `test-notif-${Date.now()}`,
      title: '🔔 Teste de Alerta RaviCar',
      message: 'As notificações nativas do celular estão ativas e funcionando perfeitamente!',
      actionUrl: 'catalogo'
    };

    // Show the in-app glassmorphic toast
    setActiveToast(mockNotif);
    setTimeout(() => {
      setActiveToast((prev: any) => prev && prev.id === mockNotif.id ? null : prev);
    }, 8000);

    // Show native notification if allowed
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setBrowserPermission(perm);
          if (perm === 'granted') {
            triggerNative(mockNotif);
          }
        });
      } else if (Notification.permission === 'granted') {
        triggerNative(mockNotif);
      } else {
        // Since we are in iframe, alert can inform the user nicely
        console.log('Permissions are blocked/denied in browser.');
      }
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
      <header id="nav_header" className="sticky top-0 z-50 bg-white dark:bg-[var(--app-dark-bg)] backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 h-24 flex items-center px-4 md:px-8 transition-all duration-500">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative">
          {/* Logo */}
          <div onClick={() => handleNav('home')}>
            <Logo />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-10 text-[10px] font-mono tracking-[0.2em] uppercase">
            <button 
              onClick={() => handleNav('home')} 
              className={`group relative transition-all duration-300 cursor-pointer py-2 ${currentPage === 'home' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : (activeTheme === 'original' ? 'text-gray-500 dark:text-gray-400 hover:text-[#FF2A7A]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white')}`}
            >
              Início
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ${currentPage === 'home' ? (activeTheme === 'original' ? 'bg-[#FF2A7A] opacity-100 scale-100' : 'bg-[var(--brand-color)] opacity-100 scale-100') : 'bg-transparent opacity-0 scale-0 group-hover:bg-neutral-600 group-hover:opacity-100 group-hover:scale-100'}`}></span>
            </button>
            <button 
              onClick={() => handleNav('catalogo')} 
              className={`group relative transition-all duration-300 cursor-pointer py-2 ${currentPage === 'catalogo' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : (activeTheme === 'original' ? 'text-gray-500 dark:text-gray-400 hover:text-[#FF2A7A]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white')}`}
            >
              Estoque
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ${currentPage === 'catalogo' ? (activeTheme === 'original' ? 'bg-[#FF2A7A] opacity-100 scale-100' : 'bg-[var(--brand-color)] opacity-100 scale-100') : 'bg-transparent opacity-0 scale-0 group-hover:bg-neutral-600 group-hover:opacity-100 group-hover:scale-100'}`}></span>
            </button>
            <button 
              onClick={() => handleNav('financiamento')} 
              className={`group relative transition-all duration-300 cursor-pointer py-2 ${currentPage === 'financiamento' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : (activeTheme === 'original' ? 'text-gray-500 dark:text-gray-400 hover:text-[#FF2A7A]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white')}`}
            >
              Financiamento
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ${currentPage === 'financiamento' ? (activeTheme === 'original' ? 'bg-[#FF2A7A] opacity-100 scale-100' : 'bg-[var(--brand-color)] opacity-100 scale-100') : 'bg-transparent opacity-0 scale-0 group-hover:bg-neutral-600 group-hover:opacity-100 group-hover:scale-100'}`}></span>
            </button>
            <button 
              onClick={() => handleNav('avaliacao')} 
              className={`group relative transition-all duration-300 cursor-pointer py-2 ${currentPage === 'avaliacao' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : (activeTheme === 'original' ? 'text-gray-500 dark:text-gray-400 hover:text-[#FF2A7A]' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white')}`}
            >
              Avalie seu Usado
              <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-300 ${currentPage === 'avaliacao' ? (activeTheme === 'original' ? 'bg-[#FF2A7A] opacity-100 scale-100' : 'bg-[var(--brand-color)] opacity-100 scale-100') : 'bg-transparent opacity-0 scale-0 group-hover:bg-neutral-600 group-hover:opacity-100 group-hover:scale-100'}`}></span>
            </button>
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Selector Button */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                title="Escolher Tema"
                className={`p-2 rounded-full border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer relative ${isThemeOpen ? 'text-[var(--brand-color)] border-[var(--brand-color)]/40 bg-[var(--bg-card-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <Palette className="w-4 h-4" />
              </button>
              
              {isThemeOpen && (
                <div className="absolute right-0 mt-2.5 w-52 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-2xl p-2.5 z-[110] flex flex-col gap-1.5">
                  <div className="px-2 py-1 border-b border-[var(--border-color)]/60 mb-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">Escolha o Tema</span>
                  </div>
                  
                  {/* Theme buttons */}
                  <button
                    data-theme-btn="original"
                    onClick={() => changeTheme('original')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeTheme === 'original' ? 'bg-[#FF2D8D]/10 text-[#FF2D8D] font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF2D8D]"></span>
                      <span>RaviCar Neon</span>
                    </div>
                    {activeTheme === 'original' && <span className="text-[10px] font-bold">●</span>}
                  </button>

                  <button
                    data-theme-btn="branco"
                    onClick={() => changeTheme('branco')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeTheme === 'branco' ? 'bg-blue-600/10 text-blue-500 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-blue-500 shadow-sm"></span>
                      <span>Branco e Azul</span>
                    </div>
                    {activeTheme === 'branco' && <span className="text-[10px] font-bold">●</span>}
                  </button>

                  <button
                    data-theme-btn="azul"
                    onClick={() => changeTheme('azul')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeTheme === 'azul' ? 'bg-cyan-500/10 text-cyan-400 font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                      <span>Azul</span>
                    </div>
                    {activeTheme === 'azul' && <span className="text-[10px] font-bold">●</span>}
                  </button>

                  <button
                    data-theme-btn="preto"
                    onClick={() => changeTheme('preto')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeTheme === 'preto' ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-neutral-700"></span>
                      <span>Preto Puro</span>
                    </div>
                    {activeTheme === 'preto' && <span className="text-[10px] font-bold">●</span>}
                  </button>

                  <button
                    data-theme-btn="creme"
                    onClick={() => changeTheme('creme')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${activeTheme === 'creme' ? 'bg-[#a67537]/10 text-[#a67537] font-bold' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#faf4e8] border border-[#a67537] shadow-sm"></span>
                      <span>Creme Imperial</span>
                    </div>
                    {activeTheme === 'creme' && <span className="text-[10px] font-bold">●</span>}
                  </button>
                </div>
              )}
            </div>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title="Central de Notificações"
                className={`p-2 rounded-full border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition-all cursor-pointer relative ${isNotifOpen ? 'text-[var(--brand-color)] border-[var(--brand-color)]/40 bg-[var(--bg-card-hover)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
              >
                <Bell className={`w-4 h-4 ${notifications.some(n => !n.read) ? 'text-[var(--brand-color)]' : ''}`} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
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
                  className="px-5 py-2 text-xs border border-[var(--brand-color)] text-[var(--brand-color)] rounded-full uppercase font-bold hover:bg-[var(--brand-color)] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5" />
                  {currentUser.role === 'Cliente' ? 'Área do Cliente' : `Painel ${currentUser.role}`}
                </button>
                <div className="text-right">
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{currentUser.name}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sair"
                  className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:text-red-500 hover:bg-white dark:bg-[#1A1A1A] transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2 text-xs border border-[var(--brand-color)] text-[var(--brand-color)] rounded-full uppercase font-bold hover:bg-[var(--brand-color)] hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
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
              className="p-2 rounded-full hover:bg-[var(--bg-card-hover)] relative text-gray-600 dark:text-gray-400"
            >
              <Bell className={`w-4 h-4 ${notifications.some(n => !n.read) ? 'text-[var(--brand-color)]' : ''}`} />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-full text-gray-900 dark:text-white hover:bg-white dark:bg-[#1A1A1A]"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer (Offcanvas) */}
        {isMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
              onClick={() => setIsMenuOpen(false)}
            ></div>
            
            {/* Sidebar content */}
            <div className="relative w-[85%] max-w-sm bg-white dark:bg-[var(--app-dark-bg)] h-full flex flex-col shadow-2xl animate-slide-in-right">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-neutral-900">
                <Logo className="w-8 h-8" showText={true} />
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsNotifOpen(true);
                    }} 
                    className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF2A7A] rounded-full border border-white dark:border-[var(--app-dark-bg)]"></span>
                    )}
                  </button>
                  <button 
                    onClick={() => setIsMenuOpen(false)} 
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-900 dark:text-white transition-colors bg-gray-100 dark:bg-neutral-900 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto flex flex-col pb-6">
                {/* User Profile Block (Moved to top of scrollable area) */}
                {currentUser && (
                  <div className="p-5 border-b border-gray-200 dark:border-neutral-900 bg-gray-50 dark:bg-[#121214]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium text-sm">{currentUser.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{currentUser.role === 'Cliente' ? 'Área do Cliente' : 'Painel de Controle'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            handleNav(
                              currentUser.role === 'Cliente' ? 'cliente' : 
                              currentUser.role === 'Administrador' ? 'admin' : 'vendedor'
                            );
                          }}
                          className="w-full text-center py-2.5 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold text-[10px] uppercase tracking-wide hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                        >
                          Painel
                        </button>
                        <button
                          onClick={() => {
                            setIsMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-center py-2.5 rounded-lg bg-red-500/10 text-red-500 font-bold text-[10px] uppercase tracking-wide hover:bg-red-500/20 transition-colors"
                        >
                          Sair
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!currentUser && (
                  <div className="p-5 border-b border-gray-200 dark:border-neutral-900">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full py-4 rounded-xl bg-[var(--brand-color)] text-white font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2  hover:opacity-90 transition-opacity"
                    >
                      <LogIn className="w-4 h-4" />
                      Entrar / Cadastrar
                    </button>
                  </div>
                )}

                {/* Navigation */}
                <nav className="flex flex-col py-2">
                  <button 
                    onClick={() => handleNav('home')} 
                    className={`text-left px-5 py-4 border-b border-gray-100 dark:border-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors ${currentPage === 'home' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : 'text-gray-800 dark:text-white font-medium'}`}
                  >
                    Início
                  </button>
                  <button 
                    onClick={() => handleNav('catalogo')} 
                    className={`text-left px-5 py-4 border-b border-gray-100 dark:border-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors ${currentPage === 'catalogo' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : 'text-gray-800 dark:text-white font-medium'}`}
                  >
                    Estoque
                  </button>
                  <button 
                    onClick={() => handleNav('financiamento')} 
                    className={`text-left px-5 py-4 border-b border-gray-100 dark:border-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors ${currentPage === 'financiamento' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : 'text-gray-800 dark:text-white font-medium'}`}
                  >
                    Financiamento
                  </button>
                  <button 
                    onClick={() => handleNav('avaliacao')} 
                    className={`text-left px-5 py-4 border-b border-gray-100 dark:border-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors ${currentPage === 'avaliacao' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : 'text-gray-800 dark:text-white font-medium'}`}
                  >
                    Avalie seu Usado
                  </button>
                  <button 
                    onClick={() => handleNav('combo')} 
                    className={`text-left px-5 py-4 border-b border-gray-100 dark:border-neutral-900/50 hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors flex items-center justify-between ${currentPage === 'combo' ? (activeTheme === 'original' ? 'text-[#FF2A7A] font-bold' : 'text-[var(--brand-color)] font-bold') : 'text-gray-800 dark:text-white font-medium'}`}
                  >
                    Simulador Combo
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-color)]"></span>
                  </button>
                  <button 
                    onClick={() => handleNav('termos')} 
                    className="text-left px-5 py-4 border-b border-gray-100 dark:border-neutral-900/50 text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-neutral-900/30 transition-colors"
                  >
                    Termos de Uso
                  </button>
                </nav>

                {/* Theme Selector */}
                <div className="p-5 mt-auto">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-4 block">
                    Tema do App
                  </span>
                  <div className="flex items-center gap-3 overflow-x-auto pb-4 hide-scrollbar">
                    <button
                      onClick={() => changeTheme('original')}
                      className={`flex flex-col items-center justify-center gap-2 min-w-[70px] min-h-[70px] rounded-xl transition-all cursor-pointer border ${activeTheme === 'original' ? 'border-[#FF2A7A] bg-[#FF2A7A]/5 dark:bg-[#FF2A7A]/10' : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-white dark:bg-neutral-900'}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#FF2A7A] shadow-sm"></span>
                      <span className={`text-[10px] font-medium ${activeTheme === 'original' ? 'text-[#FF2A7A]' : 'text-gray-600 dark:text-gray-400'}`}>Rosa</span>
                    </button>
                    <button
                      onClick={() => changeTheme('branco')}
                      className={`flex flex-col items-center justify-center gap-2 min-w-[70px] min-h-[70px] rounded-xl transition-all cursor-pointer border ${activeTheme === 'branco' ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-neutral-800' : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-white dark:bg-neutral-900'}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-white border border-gray-300 shadow-sm"></span>
                      <span className={`text-[10px] font-medium ${activeTheme === 'branco' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>Branco</span>
                    </button>
                    <button
                      onClick={() => changeTheme('azul')}
                      className={`flex flex-col items-center justify-center gap-2 min-w-[70px] min-h-[70px] rounded-xl transition-all cursor-pointer border ${activeTheme === 'azul' ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10' : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-white dark:bg-neutral-900'}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-500 shadow-sm"></span>
                      <span className={`text-[10px] font-medium ${activeTheme === 'azul' ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'}`}>Azul</span>
                    </button>
                    <button
                      onClick={() => changeTheme('preto')}
                      className={`flex flex-col items-center justify-center gap-2 min-w-[70px] min-h-[70px] rounded-xl transition-all cursor-pointer border ${activeTheme === 'preto' ? 'border-black dark:border-white bg-black/5 dark:bg-white/10' : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-white dark:bg-neutral-900'}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 shadow-sm"></span>
                      <span className={`text-[10px] font-medium ${activeTheme === 'preto' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>Preto</span>
                    </button>
                    <button
                      onClick={() => changeTheme('creme')}
                      className={`flex flex-col items-center justify-center gap-2 min-w-[70px] min-h-[70px] rounded-xl transition-all cursor-pointer border ${activeTheme === 'creme' ? 'border-[#a67537] bg-[#a67537]/5 dark:bg-[#a67537]/10' : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-white dark:bg-neutral-900'}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-[#faf4e8] border border-[#a67537] shadow-sm"></span>
                      <span className={`text-[10px] font-medium ${activeTheme === 'creme' ? 'text-[#a67537]' : 'text-gray-600 dark:text-gray-400'}`}>Creme</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Notification Perm banner */}
      {showNotifBanner && (
        <div className="bg-white dark:bg-[#1A1A1A] border-b border-[var(--brand-color)]/30 py-3 px-4 transition-all duration-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[var(--brand-color)]/10 text-[var(--brand-color)]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">RaviCar quer te avisar!</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Receba notificações limpas no navegador sempre que um novo veículo chegar ao estoque.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeclinePermission}
                className="px-3 py-1.5 rounded-md hover:bg-black/30 text-gray-600 dark:text-gray-400 text-xs transition"
              >
                Agora não
              </button>
              <button
                onClick={handleRequestPermission}
                className="px-4 py-1.5 rounded-md bg-[var(--brand-color)] text-white text-xs font-bold shadow-md transition hover:opacity-90"
              >
                Ativar Notificações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Side Drawer Overlay */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)}>
          <div 
            className="fixed inset-y-0 right-0 w-full md:max-w-md bg-[var(--bg-card)] border-l border-[var(--border-color)] shadow-2xl flex flex-col h-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[var(--brand-color)]" />
                <h3 className="font-display font-bold text-gray-900 dark:text-white text-base">Central de Notificações</h3>
              </div>
              <button 
                onClick={() => setIsNotifOpen(false)}
                className="p-1 rounded-full hover:bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {/* Permission Helper Banner */}
              <div className="p-3.5 bg-[var(--brand-color)]/5 border border-[var(--brand-color)]/25 rounded-xl flex flex-col gap-3">
                <div className="flex gap-2.5 items-start">
                  <div className="p-1.5 rounded-full bg-[var(--brand-color)]/10 text-[var(--brand-color)] shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">Alertas no Celular / Navegador</h4>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                      Ative o recebimento nativo no seu celular para receber os alertas em tempo real na sua barra de notificações do celular.
                    </p>
                    
                    {/* Status Indicator */}
                    <div className="mt-2 text-[10px] font-bold">
                      {browserPermission === 'granted' ? (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1 w-fit">
                          ● Navegador Autorizado (Ativo)
                        </span>
                      ) : browserPermission === 'denied' ? (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 flex flex-col gap-1 w-fit leading-normal">
                          <span>● Navegador Bloqueado</span>
                          <span className="font-normal text-gray-600 dark:text-gray-400 normal-case">Clique no ícone de cadeado na barra de endereços para permitir!</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1 w-fit">
                          ● Aguardando Permissão
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-200 dark:border-neutral-800/60 pt-2.5 mt-0.5">
                  <button
                    onClick={handleRequestPermission}
                    className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-color)] hover:opacity-85 transition cursor-pointer"
                  >
                    {browserPermission === 'granted' ? '✓ Configurado' : 'Ativar Permissão'}
                  </button>
                </div>
              </div>

              {notifications.filter(n => n.type === 'push').length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400 gap-2">
                  <BellOff className="w-10 h-10 text-neutral-800" />
                  <p className="text-xs font-bold text-gray-900 dark:text-white">Nenhuma notificação</p>
                  <p className="text-[11px] text-gray-600 dark:text-gray-400 max-w-[240px] mx-auto">Cadastre um novo veículo no Painel Administrativo para ver o alerta celular em tempo real!</p>
                </div>
              ) : (
                notifications
                  .filter(n => n.type === 'push')
                  .map((notif: any) => (
                    <div 
                      key={notif.id}
                      className="p-3.5 rounded-xl bg-gray-100 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-800 flex flex-col gap-2 hover:border-gray-200 dark:border-neutral-700 transition"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-mono">
                          {new Date(notif.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(notif.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{notif.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{notif.message}</p>
                      
                      {notif.actionUrl && (
                        <button
                          onClick={() => {
                            setIsNotifOpen(false);
                            window.location.hash = notif.actionUrl;
                          }}
                          className="mt-1 self-start text-[10px] font-bold text-[var(--brand-color)] uppercase tracking-wider hover:underline cursor-pointer"
                        >
                          Ver Veículo no Estoque ➔
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex justify-between gap-2 items-center">
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Destinatário Admin: {settings.email}</span>
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

      {/* Real-time In-App Glassmorphic Toast Notification */}
      {activeToast && (
        <div 
          onClick={() => {
            if (activeToast.actionUrl) {
              window.location.hash = activeToast.actionUrl;
            }
            setActiveToast(null);
          }}
          className="fixed top-4 left-4 right-4 md:top-24 md:left-auto md:right-8 z-[9999] max-w-sm bg-black/95 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-xl shadow-lg p-4 flex gap-3.5 border-l-4 border-l-[var(--brand-color)] cursor-pointer hover:border-gray-200 dark:border-neutral-700 transition-all duration-300 animate-slide-in-right"
        >
          <div className="w-11 h-11 shrink-0 bg-white dark:bg-neutral-900 border border-[var(--brand-color)]/25 rounded-full flex items-center justify-center overflow-hidden">
            <img src={ravicarLogo} alt="RaviCar" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-[var(--brand-color)] uppercase tracking-wider flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--brand-color)]"></span>
                </span>
                NOVO CADASTRO
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveToast(null);
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white transition p-1 hover:bg-white dark:bg-neutral-800 rounded-full cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-1 leading-snug">{activeToast.title}</h4>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{activeToast.message}</p>
            <div className="mt-2.5 flex justify-between items-center">
              <span className="text-[9px] text-gray-500 dark:text-gray-400">Agora mesmo</span>
              <span className="text-[10px] font-bold text-[var(--brand-color)] hover:underline uppercase tracking-wider flex items-center gap-1">
                Ver Estoque ➔
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
