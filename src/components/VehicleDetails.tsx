import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, MessageCircle, Calendar, Landmark, Check, RefreshCw, Eye, ChevronLeft, ChevronRight, Play, Film, Smartphone, Share2, Heart, Maximize2, Minimize2, Gauge, Cog, Fuel, Shield, Award, X } from 'lucide-react';
import { Vehicle, SiteSettings, UserProfile } from '../types';
import { VisitBooking } from './VisitBooking';
import { FinancingRequest } from './FinancingRequest';
import { UsedCarEvaluation } from './UsedCarEvaluation';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  settings: SiteSettings;
  vehicles: Vehicle[]; // to feed dropdowns
  onBack: () => void;
  onNavigate: (page: string, preselectedVehicleId?: string) => void;
  currentUser?: UserProfile | null;
  recentlyViewedIds?: string[];
}

export function VehicleDetails({ vehicle, settings, vehicles, onBack, onNavigate, currentUser, recentlyViewedIds = [] }: VehicleDetailsProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'description'>('details');
  const [activeFormModal, setActiveFormModal] = useState<'none' | 'visita' | 'financiamento' | 'avaliacao'>('none');
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [fitContain, setFitContain] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        nextMedia();
      } else if (e.key === 'ArrowLeft') {
        prevMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeMediaIndex, vehicle.media]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    const checkFavorite = () => {
      let favs: string[] = [];
      if (currentUser) {
        const saved = localStorage.getItem(`ravicar_favs_${currentUser.id}`);
        if (saved) {
          try { favs = JSON.parse(saved); } catch (e) {}
        }
      } else {
        const saved = localStorage.getItem('ravicar_guest_favs');
        if (saved) {
          try { favs = JSON.parse(saved); } catch (e) {}
        }
      }
      setIsFavorite(favs.includes(vehicle.id));
    };

    checkFavorite();
    window.addEventListener('favorites-updated', checkFavorite);
    return () => window.removeEventListener('favorites-updated', checkFavorite);
  }, [vehicle.id, currentUser]);

  const toggleFavorite = () => {
    let favs: string[] = [];
    const storageKey = currentUser ? `ravicar_favs_${currentUser.id}` : 'ravicar_guest_favs';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { favs = JSON.parse(saved); } catch (e) {}
    }

    if (favs.includes(vehicle.id)) {
      favs = favs.filter(id => id !== vehicle.id);
    } else {
      favs = [...favs, vehicle.id];
    }

    localStorage.setItem(storageKey, JSON.stringify(favs));
    setIsFavorite(favs.includes(vehicle.id));
    window.dispatchEvent(new Event('favorites-updated'));
  };

  const currentMedia = vehicle.media[activeMediaIndex];

  const getShareableUrl = () => {
    if (settings.customDomain) {
      let domain = settings.customDomain.trim();
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = `https://${domain}`;
      }
      return `${domain}/#veiculo-${vehicle.id}`;
    }

    let origin = window.location.origin;
    // Se estiver no domínio de desenvolvimento privado do AI Studio, reescreve para o domínio público de compartilhamento
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return `${origin}/#veiculo-${vehicle.id}`;
  };

  // Helper to pre-populate and send beautiful Whatsapp message
  const handleBuyWhatsapp = () => {
    const pageUrl = getShareableUrl();
    const message = `Olá RaviCar! Tenho interesse neste veículo do site:
🚗 *${vehicle.title}*
💵 *Preço:* R$ ${vehicle.price.toLocaleString('pt-BR')}
📅 *Ano:* ${vehicle.year}
📍 *KM:* ${vehicle.mileage === 0 ? 'Zero KM' : `${vehicle.mileage.toLocaleString('pt-BR')} KM`}
⚙️ *Câmbio:* ${vehicle.transmission}
⛽ *Combustível:* ${vehicle.fuel}
🆔 *ID do Veículo:* ${vehicle.id}
🔗 *Link:* ${pageUrl}

Gostaria de falar com um consultor para negociar ou simular financiamento!`;

    // analytical post to lead system
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'WhatsAppClick',
        name: `Interesse: ${vehicle.title}`,
        phone: settings.whatsapp,
        vehicleId: vehicle.id,
        vehicleName: vehicle.title,
        message: 'Clique no botão Comprar pelo WhatsApp'
      })
    }).catch(e => console.error(e));

    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyLink = () => {
    const pageUrl = getShareableUrl();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(pageUrl)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        })
        .catch(err => {
          fallbackCopyText(pageUrl);
        });
    } else {
      fallbackCopyText(pageUrl);
    }
  };

  const fallbackCopyText = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        window.prompt("Copie o link abaixo:", text);
      }
    } catch (err) {
      window.prompt("Copie o link abaixo:", text);
    }
  };

  const nextMedia = () => {
    setActiveMediaIndex(prev => (prev === vehicle.media.length - 1 ? 0 : prev + 1));
  };

  const prevMedia = () => {
    setActiveMediaIndex(prev => (prev === 0 ? vehicle.media.length - 1 : prev - 1));
  };

  // Touch Swipe Handlers for mobile navigation
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchEndX, setTouchEndX] = useState<number>(0);
  const [touchEndY, setTouchEndY] = useState<number>(0);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;

    // Ensure horizontal gesture is clear and dominant over vertical scroll
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
      if (diffX > 0) {
        nextMedia();
      } else {
        prevMedia();
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pt-8 pb-28">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-[#FF6FB5] hover:text-gray-900 dark:text-white transition mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o Estoque
      </button>

      {/* Grid: Media and core action summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left Column: Media Player (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Stage */}
          <div 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="relative aspect-[16/10] bg-[#111] rounded-2xl overflow-hidden border border-gray-200 dark:border-neutral-900 shadow-xl group touch-pan-y"
          >
            {currentMedia ? (
              currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  controls
                  className="w-full h-full object-contain"
                  poster={vehicle.media.find(m => m.type === 'image')?.url}
                />
              ) : (
                <div 
                  className="relative w-full h-full cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                >
                  <img
                    src={currentMedia.url}
                    alt={vehicle.title}
                    className={`w-full h-full transition-all duration-350 ${fitContain ? 'object-contain' : 'object-cover object-center'} hover:brightness-110`}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFitContain(!fitContain);
                    }}
                    className="absolute bottom-4 right-4 z-30 p-2 rounded-xl bg-white/85 dark:bg-black/85 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white hover:text-[#FF2A7A] transition-all duration-200 cursor-pointer shadow-xl flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
                  >
                    {fitContain ? (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Preencher</span>
                      </>
                    ) : (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Enquadrar</span>
                      </>
                    )}
                  </button>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm">
                Sem fotos ou vídeos para este veículo.
              </div>
            )}

            {/* Media navigation arrows */}
            {vehicle.media.length > 1 && (
              <>
                <button
                  onClick={prevMedia}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-gray-200 dark:border-neutral-800 text-white hover:bg-black/90 transition transform hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-gray-200 dark:border-neutral-800 text-white hover:bg-black/90 transition transform hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Media Counter Badge */}
            {vehicle.media.length > 0 && (
              <div className="absolute top-4 left-4 px-2.5 py-1 rounded bg-black/60 backdrop-blur border border-gray-200 dark:border-neutral-800 text-[10px] text-white font-bold tracking-wider">
                {activeMediaIndex + 1} / {vehicle.media.length}
              </div>
            )}

            {/* Floating Share & Favorite */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button
                onClick={toggleFavorite}
                className={`p-2.5 rounded-full bg-black/60 backdrop-blur border transition-all transform hover:scale-105 cursor-pointer ${
                  isFavorite ? 'border-[#FF2A7A] text-[#FF2A7A]' : 'border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-[#FF2A7A] text-[#FF2A7A]' : 'text-gray-900 dark:text-white'}`} />
              </button>
              
              <button
                onClick={handleCopyLink}
                className={`p-2.5 rounded-full bg-black/60 backdrop-blur border transition-all transform hover:scale-105 cursor-pointer ${
                  copied ? 'border-emerald-500 text-emerald-400' : 'border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white'
                }`}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Thumbnails list */}
          {vehicle.media.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              {vehicle.media.map((media, idx) => {
                const isSelected = idx === activeMediaIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-20 h-14 shrink-0 rounded-lg overflow-hidden border transition-all ${
                      isSelected ? 'border-[#FF2D8D] scale-95 ring-2 ring-[#FF2D8D]/30' : 'border-gray-200 dark:border-neutral-900 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/90 text-[#FF2D8D]">
                        <Film className="w-4 h-4 shrink-0" />
                        <span className="absolute bottom-1 right-1 text-[8px] bg-white dark:bg-black text-gray-900 dark:text-white px-0.5 rounded font-bold">VÍDEO</span>
                      </div>
                    ) : (
                      <img src={media.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Pricing & Core Actions (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Badges & Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#FF6FB5] uppercase tracking-wider">{vehicle.brand}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-800"></span>
                <span className="px-2.5 py-0.5 rounded text-[11.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                  {vehicle.status}
                </span>
              </div>
              <h1 className="font-display font-black text-2xl md:text-3xl text-gray-900 dark:text-white tracking-tight leading-tight">
                {vehicle.title}
              </h1>
            </div>

            {/* Price section */}
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-950 dark:to-neutral-900/90 border border-gray-200 dark:border-neutral-900 overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#FF2D8D]/10 to-transparent rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-gray-600 dark:text-gray-400 uppercase tracking-widest leading-none">Preço à Vista</span>
                <span className="px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 fill-emerald-400/20" />
                  Laudo Cautelar 100% Aprovado
                </span>
              </div>
              
              <p className="font-display font-black text-[#FF2D8D] text-3xl md:text-4xl tracking-tight mt-1.5 py-0.5 drop-shadow-[0_2px_10px_rgba(255,45,141,0.15)]">
                R$ {vehicle.price.toLocaleString('pt-BR')}
              </p>
              
              <div className="mt-3.5 pt-3 border-t border-gray-200 dark:border-neutral-900/80 flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10.5px] text-gray-600 dark:text-gray-400 leading-normal">
                  <strong className="text-gray-900 dark:text-white">Troca inteligente RaviCar:</strong> Supervalorização do seu usado com simulação rápida em até 13 bancos parceiros.
                </p>
              </div>
            </div>

            {/* Main Key specs layout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-gray-100 dark:bg-neutral-900/35 hover:bg-gray-200 dark:hover:bg-gray-100 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-900/80 rounded-xl flex items-center gap-3 transition-all duration-300 group">
                <div className="p-2 rounded-xl bg-[#FF2D8D]/10 text-[#FF2D8D] group-hover:bg-[#FF2D8D]/20 transition-all duration-300">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Ano / Modelo</span>
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white mt-0.5 block">{vehicle.year}</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-100 dark:bg-neutral-900/35 hover:bg-gray-200 dark:hover:bg-gray-100 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-900/80 rounded-xl flex items-center gap-3 transition-all duration-300 group">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <Gauge className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Quilometragem</span>
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white mt-0.5 block">
                    {vehicle.mileage === 0 ? 'Zero KM' : `${vehicle.mileage.toLocaleString('pt-BR')} KM`}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-100 dark:bg-neutral-900/35 hover:bg-gray-200 dark:hover:bg-gray-100 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-900/80 rounded-xl flex items-center gap-3 transition-all duration-300 group">
                <div className="p-2 rounded-xl bg-[#FF6FB5]/10 text-[#FF6FB5] group-hover:bg-[#FF6FB5]/20 transition-all duration-300">
                  <Cog className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Câmbio</span>
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white mt-0.5 block">{vehicle.transmission}</span>
                </div>
              </div>

              <div className="p-3.5 bg-gray-100 dark:bg-neutral-900/35 hover:bg-gray-200 dark:hover:bg-gray-100 dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-900/80 rounded-xl flex items-center gap-3 transition-all duration-300 group">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-all duration-300">
                  <Fuel className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Combustível</span>
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white mt-0.5 block">{vehicle.fuel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Core CTAs block */}
          <div className="pt-4 border-t border-gray-200 dark:border-neutral-900">
            <div className="flex overflow-x-auto gap-3 snap-x scrollbar-none pb-2 md:grid md:grid-cols-3">
              <button
                onClick={() => setActiveFormModal('financiamento')}
                className="shrink-0 snap-center w-28 md:w-auto py-3 px-2 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-[#FF2A7A]/40 hover:bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold text-[10px] uppercase tracking-wide transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <Landmark className="w-5 h-5 text-[#FF2A7A] transition-transform duration-300 group-hover:scale-110" />
                Simular Juros
              </button>
              <button
                onClick={() => setActiveFormModal('visita')}
                className="shrink-0 snap-center w-28 md:w-auto py-3 px-2 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-[#FF2A7A]/40 hover:bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold text-[10px] uppercase tracking-wide transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <Calendar className="w-5 h-5 text-[#FF2A7A] transition-transform duration-300 group-hover:scale-110" />
                Agendar Teste
              </button>
              <button
                onClick={() => setActiveFormModal('avaliacao')}
                className="shrink-0 snap-center w-28 md:w-auto py-3 px-2 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 hover:border-[#FF2A7A]/40 hover:bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold text-[10px] uppercase tracking-wide transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
              >
                <RefreshCw className="w-5 h-5 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
                Avaliar Troca
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Segmented Tabs list: Specs vs Description */}
      <div className="mb-6 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg flex max-w-md">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 px-4 rounded-md text-[11px] uppercase tracking-wider font-extrabold transition-all duration-200 cursor-pointer text-center ${
            activeTab === 'details' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:text-gray-300'
          }`}
        >
          Ficha Técnica e Opcionais
        </button>
        <button
          onClick={() => setActiveTab('description')}
          className={`flex-1 py-2 px-4 rounded-md text-[11px] uppercase tracking-wider font-extrabold transition-all duration-200 cursor-pointer text-center ${
            activeTab === 'description' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:text-gray-300'
          }`}
        >
          Descrição do Veículo
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Specs Sheet (5 cols) */}
          <div className="md:col-span-5 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl p-5 space-y-3.5">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] border-b border-gray-200 dark:border-neutral-900 pb-2">
              Especificações Básicas
            </h3>
            <div className="space-y-2.5 text-[14px] md:text-[14.5px]">
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-neutral-900/50">
                <span className="text-gray-600 dark:text-gray-400">Marca</span>
                <span className="font-bold text-gray-900 dark:text-white">{vehicle.brand}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-neutral-900/50">
                <span className="text-gray-600 dark:text-gray-400">Modelo</span>
                <span className="font-bold text-gray-900 dark:text-white">{vehicle.model}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-neutral-900/50">
                <span className="text-gray-600 dark:text-gray-400">Ano</span>
                <span className="font-bold text-gray-900 dark:text-white">{vehicle.year}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-neutral-900/50">
                <span className="text-gray-600 dark:text-gray-400">Quilometragem</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {vehicle.mileage === 0 ? 'Zero KM' : `${vehicle.mileage.toLocaleString('pt-BR')} KM`}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-neutral-900/50">
                <span className="text-gray-600 dark:text-gray-400">Motor</span>
                <span className="font-bold text-gray-900 dark:text-white">{vehicle.engine}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-neutral-900/50">
                <span className="text-gray-600 dark:text-gray-400">Potência (CV)</span>
                <span className="font-bold text-gray-900 dark:text-white">{vehicle.power}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-neutral-900/50">
                <span className="text-gray-600 dark:text-gray-400">Cor externa</span>
                <span className="font-bold text-gray-900 dark:text-white">{vehicle.color}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-600 dark:text-gray-400">Combustível</span>
                <span className="font-bold text-gray-900 dark:text-white">{vehicle.fuel}</span>
              </div>
            </div>
          </div>

          {/* Optionals list (7 cols) */}
          <div className="md:col-span-7 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl p-5">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] border-b border-gray-200 dark:border-neutral-900 pb-2 mb-4">
              Itens de Série e Opcionais Instalados
            </h3>
            {vehicle.options && vehicle.options.length > 0 ? (
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {vehicle.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="p-0.5 rounded bg-emerald-500/10 text-emerald-400 shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{opt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Nenhum opcional específico cadastrado.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="py-2 text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line max-w-4xl">
          {vehicle.description || 'Nenhuma descrição detalhada disponível.'}
        </div>
      )}

      {/* Form Modals Dialog Box overlays */}
      {activeFormModal !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl shadow-2xl p-1 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Close button inside modal header wrapper */}
            <div className="flex justify-end p-2">
              <button
                onClick={() => setActiveFormModal('none')}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-neutral-900 hover:bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold border border-gray-200 dark:border-neutral-800 cursor-pointer"
              >
                ✕ FECHAR JANELA
              </button>
            </div>

            <div className="px-4 pb-6">
              {activeFormModal === 'visita' && (
                <VisitBooking
                  settings={settings}
                  vehicles={vehicles}
                  preselectedVehicleId={vehicle.id}
                  onSuccess={() => {
                    setTimeout(() => setActiveFormModal('none'), 3000);
                  }}
                />
              )}

              {activeFormModal === 'financiamento' && (
                <FinancingRequest
                  settings={settings}
                  vehicles={vehicles}
                  preselectedVehicleId={vehicle.id}
                />
              )}

              {activeFormModal === 'avaliacao' && (
                <UsedCarEvaluation
                  settings={settings}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* RECENTLY VIEWED SECTION */}
      {recentlyViewedIds && recentlyViewedIds.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 pb-20">
          {(() => {
            const recentVehicles = recentlyViewedIds
              .filter(id => id !== vehicle.id)
              .map(id => vehicles.find(v => v.id === id))
              .filter((v): v is Vehicle => v !== undefined);

            if (recentVehicles.length === 0) return null;

            return (
              <div className="border-t border-gray-200 dark:border-neutral-900 pt-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-[var(--brand-color)] rounded-full"></div>
                  <h3 className="font-display font-black text-2xl tracking-tight text-gray-900 dark:text-white uppercase">Vistos Recentemente</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {recentVehicles.map(v => (
                    <div
                      key={v.id}
                      onClick={() => {
                        window.scrollTo(0, 0);
                        onNavigate('detalhes', v.id);
                      }}
                      className="group bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-xl overflow-hidden cursor-pointer flex flex-col justify-between hover:border-[var(--brand-color)]/30  transition-all duration-300"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white dark:bg-[#1A1A1A]">
                        {v.media && v.media.length > 0 ? (
                          <img
                            src={v.media[0].url}
                            alt={v.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">Sem Foto</div>
                        )}
                        <span className={`absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase flex items-center gap-1 backdrop-blur-md border ${
                          v.status === 'Disponível' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          v.status === 'Reservado' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-neutral-500/10 border-neutral-500/20 text-gray-600 dark:text-gray-400'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-mono tracking-widest text-gray-500 dark:text-gray-400 uppercase">{v.brand}</span>
                          <h4 className="font-display font-bold text-gray-900 dark:text-white text-sm truncate leading-relaxed group-hover:text-[var(--brand-color)] transition-colors">
                            {v.title}
                          </h4>
                          <div className="flex gap-2 text-xs text-gray-600 dark:text-gray-400 mt-2">
                            <span>{v.year}</span>
                            <span>•</span>
                            <span>{v.mileage === 0 ? '0 KM' : `${(v.mileage / 1000).toFixed(0)}k KM`}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-neutral-900 flex items-center justify-between">
                          <p className="font-display font-black text-gray-900 dark:text-white text-sm group-hover:text-[var(--brand-color)] transition-colors">
                            R$ {v.price.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Sticky Bottom Bar for CTA */}
      <div className="fixed bottom-0 left-0 w-full z-40 p-4 bg-white/90 dark:bg-[var(--app-dark-bg-90)] backdrop-blur border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto flex justify-center">
          <button
            onClick={handleBuyWhatsapp}
            className="w-full lg:w-2/3 py-4 rounded-xl bg-[#FF2A7A] hover:bg-[#FF6FB5] text-white font-extrabold text-sm md:text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transform transition duration-300 shadow-xl"
          >
            <MessageCircle className="w-6 h-6 fill-white text-[#FF2D8D]" />
            Comprar pelo WhatsApp
          </button>
        </div>
      </div>

      {/* Lightbox / Fullscreen Image & Video Viewer */}
      {isLightboxOpen && currentMedia && createPortal(
        <div 
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/98 backdrop-blur-md select-none animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white hover:text-[var(--brand-color)] hover:bg-white dark:bg-neutral-800 hover:scale-105 transition-all duration-200 cursor-pointer shadow-2xl z-[210] flex items-center justify-center"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows inside Lightbox */}
          {vehicle.media.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white hover:bg-white dark:bg-neutral-800 hover:text-[var(--brand-color)] transition-all duration-200 z-[210] cursor-pointer flex items-center justify-center active:scale-95"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white hover:bg-white dark:bg-neutral-800 hover:text-[var(--brand-color)] transition-all duration-200 z-[210] cursor-pointer flex items-center justify-center active:scale-95"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main Large Media */}
          <div 
            className="relative w-full h-full max-w-5xl max-h-[85vh] p-4 flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            {currentMedia.type === 'video' ? (
              <video
                src={currentMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={currentMedia.url}
                alt={vehicle.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-zoom-in"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* Media Counter Indicator */}
          {vehicle.media.length > 1 && (
            <div className="absolute bottom-6 px-4 py-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 border border-gray-200 dark:border-neutral-800 text-xs text-gray-600 dark:text-gray-400 font-bold tracking-wider z-[210]">
              {activeMediaIndex + 1} / {vehicle.media.length}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
