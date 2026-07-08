import React from 'react';
import { ChevronRight, MessageCircle, Star, Shield, HelpCircle, ArrowUpRight } from 'lucide-react';
import { SiteSettings } from '../types';

interface HeroProps {
  onNavigate: (page: string) => void;
  settings: SiteSettings;
}

export function Hero({ onNavigate, settings }: HeroProps) {
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
    <section className="relative min-h-[85vh] flex items-center justify-center bg-black overflow-hidden pt-12">
      {/* Background with luxury premium sports car and dark gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1600" 
          alt="RaviCar Premium Sports Car" 
          className="w-full h-full object-cover object-center opacity-40 filter brightness-50"
        />
        {/* Dark radial glow overlay to focus eyes on central text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80"></div>
        <div className="absolute inset-0 bg-radial-gradient(circle at center, transparent 20%, black 80%)"></div>
      </div>

      {/* Main Content container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-[#FF6FB5] font-semibold tracking-wider uppercase mb-6 animate-pulse">
          <Star className="w-3.5 h-3.5 fill-[#FF2D8D] text-[#FF2D8D]" />
          <span>A Concessionária Premium Nº1 de São Paulo</span>
        </div>

        {/* Heading */}
        <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-white tracking-tight leading-[1.1] mb-6">
          Encontre o carro ideal <br />
          <span className="bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,45,141,0.3)]">
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
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] hover:glow-pink-strong text-white font-extrabold text-sm tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Ver veículos
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleWhatsappClick}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer shadow-lg hover:shadow-[#25D366]/20"
          >
            <MessageCircle className="w-4.5 h-4.5 text-white fill-white/10 animate-pulse" />
            Falar no WhatsApp
          </button>
        </div>

        {/* Highlights Banner Underneath */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-16 pt-8 border-t border-neutral-900/60">
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px]">
            <h4 className="font-display font-extrabold text-white text-xl md:text-2xl leading-snug">26K+</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Seguidores no Insta</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px]">
            <h4 className="font-display font-extrabold text-[#FF2D8D] text-xl md:text-2xl leading-snug">100%</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Laudo Pericial Aprovado</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px]">
            <h4 className="font-display font-extrabold text-white text-xl md:text-2xl leading-snug">13+</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Financeiras Parceiras</p>
          </div>
          <div className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900/50 text-center flex flex-col items-center justify-center min-h-[96px]">
            <h4 className="font-display font-extrabold text-[#FF6FB5] text-xl md:text-2xl leading-snug">Venda</h4>
            <p className="text-[10px] leading-normal text-gray-500 uppercase tracking-wider mt-1">Consignado Grátis</p>
          </div>
        </div>
      </div>
    </section>
  );
}
