import React from 'react';
import { Mail, MapPin, Phone, Instagram, Clock, ShieldCheck } from 'lucide-react';
import { Logo } from './Header';
import { SiteSettings } from '../types';

interface FooterProps {
  onNavigate: (page: string) => void;
  settings: SiteSettings;
}

export function Footer({ onNavigate, settings }: FooterProps) {
  const handleNav = (page: string) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050505] border-t border-neutral-900/60 text-gray-400 text-sm relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-[var(--brand-color)]/20 to-transparent"></div>
      
      {/* Top Footer */}
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="text-[11px] text-gray-500 leading-relaxed mt-2 font-medium">
            A RaviCar redefine a experiência de compra automotiva. Curadoria de excelência, transparência total e condições exclusivas de mercado.
          </p>
          
          {/* Social icons */}
          <div className="flex items-center gap-3 mt-4">
            <a 
              href={settings.instagram} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full border border-neutral-800 bg-neutral-900/50 flex items-center justify-center hover:bg-[var(--brand-color)] hover:border-[var(--brand-color)] hover:text-white text-gray-400 transition-all duration-300"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-mono text-[10px] tracking-widest uppercase font-bold text-gray-300 mb-6">
            // Navegação
          </h3>
          <ul className="flex flex-col gap-3">
            <li>
              <button onClick={() => handleNav('home')} className="hover:text-[var(--brand-color)] hover:translate-x-1 transition-all duration-300 text-xs cursor-pointer flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-700"></span> Início
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('catalogo')} className="hover:text-[var(--brand-color)] hover:translate-x-1 transition-all duration-300 text-xs cursor-pointer flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-700"></span> Estoque Premium
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('financiamento')} className="hover:text-[var(--brand-color)] hover:translate-x-1 transition-all duration-300 text-xs cursor-pointer flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-neutral-700"></span> Simular Financiamento

              </button>
            </li>
            <li>
              <button onClick={() => handleNav('avaliacao')} className="hover:text-[var(--brand-color)] transition text-xs cursor-pointer">
                Avaliar meu Veículo
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('combo')} className="hover:text-[var(--brand-color)] transition text-xs cursor-pointer font-bold">
                Simulador Combo
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('termos')} className="hover:text-[var(--brand-color)] transition text-xs cursor-pointer">
                Termos de Uso & Privacidade
              </button>
            </li>
            <li>
              <button onClick={() => handleNav('reserva')} className="hover:text-[var(--brand-color)] transition text-xs cursor-pointer text-emerald-400">
                Certificado de Reserva
              </button>
            </li>
          </ul>
        </div>

        {/* Working Hours */}
        <div>
          <h3 className="font-display font-bold text-white text-base mb-4 border-b border-[#1A1A1A] pb-2">
            Horário de Atendimento
          </h3>
          <ul className="flex flex-col gap-3 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[var(--brand-color)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Segunda a Sexta-feira</p>
                <p className="text-gray-500">{settings.hoursWeekday}</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-[var(--brand-color)] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Sábados</p>
                <p className="text-gray-500">{settings.hoursSaturday}</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Physical Contact Info */}
        <div>
          <h3 className="font-display font-bold text-white text-base mb-4 border-b border-[#1A1A1A] pb-2">
            Onde Estamos
          </h3>
          <ul className="flex flex-col gap-3 text-xs text-gray-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[var(--brand-color)] shrink-0 mt-0.5" />
              <span className="leading-relaxed text-gray-500">
                {settings.address}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[var(--brand-color)] shrink-0" />
              <span className="text-gray-500">{settings.phone}</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--brand-color)] shrink-0" />
              <span className="text-gray-500 truncate">{settings.email}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-[#020202] py-6 border-t border-[#111]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© 2026 RaviCar Veículos LTDA. Todos os direitos reservados. CNPJ: {settings.pixCnpj}.</p>
          <div className="flex items-center gap-1 text-[var(--brand-color)]/60">
            <ShieldCheck className="w-4 h-4" />
            <span>Site de Alta Segurança & LGPD Garantido</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
