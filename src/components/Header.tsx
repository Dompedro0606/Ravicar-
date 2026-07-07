import React, { useState, useEffect } from 'react';
import { Menu, X, ShieldAlert, LogIn, LogOut, Bell, BellOff, Settings, User } from 'lucide-react';
import { UserProfile, SiteSettings } from '../types';
// @ts-ignore
import ravicarLogo from '../assets/images/ravicar_logo_1783395977905.jpg';

export function Logo({ className = "w-10 h-10", showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer">
      <div className={`relative bg-neutral-900 flex items-center justify-center rounded-full overflow-hidden border border-[#FF2D8D]/20 transition-all duration-300 hover:scale-105 ${className}`}>
        <img
          src={ravicarLogo}
          alt="RaviCar Logo"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="flex flex-col py-0.5">
          <span className="font-logo tracking-normal text-3xl leading-none text-white py-0.5" style={{ fontFamily: '"Satisfy", "Playball", "Great Vibes", cursive' }}>
            Ravi<span className="text-[#FF2D8D]">Car</span>
          </span>
          <span className="text-[9px] text-[#FF6FB5] tracking-[.3em] uppercase font-bold leading-tight mt-0.5">
            Premium Motors
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
              onClick={() => handleNav('termos')} 
              className={`transition-all duration-200 cursor-pointer py-1 ${currentPage === 'termos' ? 'text-[#FF2D8D] border-b-2 border-[#FF2D8D]' : 'text-gray-400 hover:text-white'}`}
            >
              Termos de Uso
            </button>
          </nav>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-4">
            {/* Notification bell */}
            <button
              onClick={() => {
                if (notifPermission === 'granted') {
                  localStorage.setItem('ravicar_notifications', 'denied');
                  setNotifPermission('denied');
                } else {
                  handleRequestPermission();
                }
              }}
              title={notifPermission === 'granted' ? "Notificações Ativas" : "Ativar Notificações"}
              className={`p-2 rounded-full border border-[#1A1A1A] hover:bg-[#1A1A1A] transition-all cursor-pointer ${notifPermission === 'granted' ? 'text-[#FF2D8D] border-[#FF2D8D]/30' : 'text-gray-400'}`}
            >
              {notifPermission === 'granted' ? <Bell className="w-4 h-4 animate-bounce" /> : <BellOff className="w-4 h-4" />}
            </button>

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
              onClick={() => {
                if (notifPermission === 'granted') {
                  localStorage.setItem('ravicar_notifications', 'denied');
                  setNotifPermission('denied');
                } else {
                  handleRequestPermission();
                }
              }}
              className={`p-2 rounded-full hover:bg-[#1A1A1A] ${notifPermission === 'granted' ? 'text-[#FF2D8D]' : 'text-gray-400'}`}
            >
              {notifPermission === 'granted' ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
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
    </>
  );
}
