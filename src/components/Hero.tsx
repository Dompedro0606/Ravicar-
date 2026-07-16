import React from 'react';
import { ChevronRight, MessageCircle, Shield, HelpCircle, ArrowUpRight, MapPin } from 'lucide-react';
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
      className="relative min-h-[75vh] py-24 md:py-32 flex items-center justify-center bg-black overflow-hidden select-none group/hero"
    >
      {/* Background with luxury premium sports car and dark gradient overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none bg-black">
        <video 
          key="hero-video"
          src="/hero-video.mp4?v=3"
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-cover object-center opacity-80 filter brightness-[0.8] scale-[1.02] pointer-events-none select-none"
        />
        {/* Gradients to fade out the edges of the video into the black background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none select-none"></div>
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none select-none"></div>
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent pointer-events-none select-none opacity-80"></div>
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent pointer-events-none select-none opacity-80"></div>
        {/* Radial vignette for cinematic focus */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)] opacity-80 pointer-events-none select-none mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-[var(--brand-color)]/10 pointer-events-none select-none mix-blend-overlay"></div>
      </div>

        {/* Main Content container */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 flex flex-col items-center mt-12 md:mt-0">
          {/* Coordinates Badge */}
          <div className="mb-8 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-800 bg-[#18181B] text-[10px] font-mono tracking-widest text-gray-400 select-none shadow-lg">
            <MapPin className="w-3 h-3 text-[#FF2A7A]" />
            <span>SÃO MIGUEL PAULISTA, SP | 23.5015° S, 46.4013° W</span>
          </div>

          {/* Heading */}
          <h1 className="font-sans font-black text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] mb-5 text-center animate-fade-in-up">
            Encontre o carro ideal <br />
            <span className="text-[#FF2A7A]">
              para você.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-sm sm:text-base text-gray-400 font-medium leading-relaxed mb-10 text-center px-4">
            Veículos periciados, revisados de para-choque a para-choque, com o selo de procedência RaviCar e financiamento facilitado.
          </p>

          {/* Call-to-actions (Stacked & Full Width on mobile) */}
          <div className="flex flex-col gap-3 w-full max-w-sm mx-auto mb-16">
            <button
              onClick={() => onNavigate('catalogo')}
              className="w-full px-6 py-4 rounded-lg bg-[#FF2A7A] hover:bg-[#D61F62] text-white font-bold text-sm tracking-wide uppercase transition-colors duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,42,122,0.3)]"
            >
              VER VEÍCULOS &gt;
            </button>
            
            <button
              onClick={handleWhatsappClick}
              className="w-full px-6 py-4 rounded-lg bg-[#128C7E] hover:bg-[#075E54] text-white font-bold text-sm tracking-wide uppercase transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              FALAR NO WHATSAPP
            </button>
          </div>

          {/* Highlights Banner Underneath (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
            <div className="p-5 rounded-xl bg-[#18181B] border border-neutral-800 text-center flex flex-col items-center justify-center">
              <h4 className="font-sans font-black text-white text-2xl mb-1">26K+</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Seguidores no Insta</p>
            </div>
            <div className="p-5 rounded-xl bg-[#18181B] border border-neutral-800 text-center flex flex-col items-center justify-center">
              <h4 className="font-sans font-black text-white text-2xl mb-1">100%</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Laudo Aprovado</p>
            </div>
            <div className="p-5 rounded-xl bg-[#18181B] border border-neutral-800 text-center flex flex-col items-center justify-center">
              <h4 className="font-sans font-black text-white text-2xl mb-1">13+</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Bancos Parceiros</p>
            </div>
            <div className="p-5 rounded-xl bg-[#18181B] border border-neutral-800 text-center flex flex-col items-center justify-center">
              <h4 className="font-sans font-black text-[#FF2A7A] text-2xl mb-1">+50</h4>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Carros em Estoque</p>
            </div>
          </div>
        </div>
      </section>
    );
}
