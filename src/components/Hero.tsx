import React from 'react';
import { ChevronRight, MessageCircle, Shield, HelpCircle, ArrowUpRight } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroProps {
  onNavigate: (page: string) => void;
  settings: SiteSettings;
}

export function Hero({ onNavigate, settings }: HeroProps) {
  const heroRef = React.useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  const handleWhatsappClick = () => {
    // Record contact lead in DB via fetch first for metrics, then open WhatsApp
    const messageText = encodeURIComponent(`Olá RaviCar! Vi o site e gostaria de falar com um vendedor para tirar algumas dúvidas.`);
    
    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${messageText}`, '_blank');
    
    // Fire analytical tracking to backend
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'WhatsAppClick',
        name: 'Interesse Geral (Botão Hero)',
        phone: settings.whatsapp,
        message: 'Clique no botão Falar no WhatsApp da Home'
      })
    }).catch(e => console.error(e));
  };

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 50, y: 50 });
      }}
      className="relative min-h-[85vh] flex items-center justify-center bg-black overflow-hidden pt-12 select-none group/hero"
    >
      {/* Background with luxury premium sports car and dark gradient overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img 
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1600" 
          alt="RaviCar Premium Sports Car" 
          className="w-full h-full object-cover object-center opacity-40 filter brightness-50 pointer-events-none select-none"
        />
        {/* Dark radial glow overlay to focus eyes on central text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80 pointer-events-none select-none"></div>
      </div>

      {/* Main Content container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center flex flex-col items-center">
        {/* Coordinates Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-900 bg-neutral-950/80 text-[10px] font-mono tracking-widest text-gray-400 select-none backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-color)] animate-pulse"></span>
          <span>SÃO MIGUEL PAULISTA, SP</span>
          <span className="text-neutral-800">|</span>
          <span>23.5015° S, 46.4013° W</span>
        </div>

        {/* Heading */}
        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.1] mb-6 animate-fade-in-up">
          Encontre o carro ideal <br />
          <span className="text-[var(--brand-color)]">
            para você.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl text-sm sm:text-base md:text-lg text-gray-400 font-medium leading-relaxed mb-8">
          "Seu próximo carro está aqui." Veículos periciados, revisados de para-choque a para-choque, com o selo de procedência RaviCar e financiamento facilitado em até 13 financeiras.
        </p>

        {/* Call-to-actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('catalogo')}
            className="relative overflow-hidden w-full sm:w-auto px-8 py-4 rounded-xl bg-[var(--brand-color)] text-white font-extrabold text-sm tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 shadow-lg hover:shadow-[var(--brand-color)]/30 cursor-pointer group"
          >
            {/* Shimmer element inside button */}
            <span className="absolute inset-0 premium-shimmer pointer-events-none opacity-40"></span>
            <span className="relative z-10 flex items-center gap-2">
              Ver veículos
              <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>
          
          <button
            onClick={handleWhatsappClick}
            className="relative overflow-hidden w-full sm:w-auto px-8 py-4 rounded-xl bg-[#25D366] text-white font-extrabold text-sm tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer shadow-lg hover:shadow-[#25D366]/20 group"
          >
            <MessageCircle className="w-4.5 h-4.5 text-white fill-white/10" />
            <span className="relative z-10">Falar no WhatsApp</span>
          </button>
        </div>

        {/* Highlights Banner Underneath */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-16">
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px] hover-lift transition-all duration-300">
            <h4 className="font-display font-extrabold text-white text-xl md:text-2xl leading-snug">26K+</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Seguidores no Insta</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px] hover-lift transition-all duration-300">
            <h4 className="font-display font-extrabold text-[var(--brand-color)] text-xl md:text-2xl leading-snug">100%</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Laudo Pericial Aprovado</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px] hover-lift transition-all duration-300">
            <h4 className="font-display font-extrabold text-white text-xl md:text-2xl leading-snug">13+</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Financeiras Parceiras</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px] hover-lift transition-all duration-300">
            <h4 className="font-display font-extrabold text-[var(--brand-color)] text-xl md:text-2xl leading-snug">Venda</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Consignado Grátis</p>
          </div>
        </div>
      </div>
    </section>
  );
}
