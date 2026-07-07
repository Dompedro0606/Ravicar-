import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Calendar, Landmark, Check, RefreshCw, Eye, ChevronLeft, ChevronRight, Play, Film, Smartphone, Share2, Heart } from 'lucide-react';
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
}

export function VehicleDetails({ vehicle, settings, vehicles, onBack, onNavigate, currentUser }: VehicleDetailsProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'details' | 'description'>('details');
  const [activeFormModal, setActiveFormModal] = useState<'none' | 'visita' | 'financiamento' | 'avaliacao'>('none');
  const [copied, setCopied] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-[#FF6FB5] hover:text-white transition mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o Estoque
      </button>

      {/* Grid: Media and core action summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        
        {/* Left Column: Media Player (7/12 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Stage */}
          <div className="relative aspect-[16/10] bg-[#111] rounded-2xl overflow-hidden border border-neutral-900 shadow-xl group">
            {currentMedia ? (
              currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  controls
                  className="w-full h-full object-contain"
                  poster={vehicle.media.find(m => m.type === 'image')?.url}
                />
              ) : (
                <img
                  src={currentMedia.url}
                  alt={vehicle.title}
                  className="w-full h-full object-cover object-center"
                />
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-neutral-800 text-white hover:bg-black/90 transition transform hover:scale-105"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextMedia}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-neutral-800 text-white hover:bg-black/90 transition transform hover:scale-105"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Media Counter Badge */}
            {vehicle.media.length > 0 && (
              <div className="absolute top-4 right-4 px-2.5 py-1 rounded bg-black/75 text-[10px] text-gray-300 font-bold tracking-wider">
                {activeMediaIndex + 1} / {vehicle.media.length}
              </div>
            )}
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
                      isSelected ? 'border-[#FF2D8D] scale-95 ring-2 ring-[#FF2D8D]/30' : 'border-neutral-900 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/90 text-[#FF2D8D]">
                        <Film className="w-4 h-4 shrink-0" />
                        <span className="absolute bottom-1 right-1 text-[8px] bg-black text-white px-0.5 rounded font-bold">VÍDEO</span>
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
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-800"></span>
                <span className="px-2.5 py-0.5 rounded text-[11.5px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                  {vehicle.status}
                </span>
              </div>
              <h1 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight leading-tight">
                {vehicle.title}
              </h1>
            </div>

            {/* Price section */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-900">
              <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider leading-normal">Preço à Vista</span>
              <p className="font-display font-black text-[#FF2D8D] text-3xl md:text-4xl tracking-tight mt-1 py-0.5">
                R$ {vehicle.price.toLocaleString('pt-BR')}
              </p>
              <p className="text-[11.5px] text-gray-400 mt-2">
                * Aceitamos seu carro na troca e fazemos simulação rápida com 13 bancos.
              </p>
            </div>

            {/* Main Key specs layout */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-neutral-900/40 border border-neutral-900 rounded-xl text-center">
                <span className="block text-[12.5px] text-gray-400 uppercase font-bold">📅 Ano / Modelo</span>
                <span className="font-bold text-base text-white mt-1 block">{vehicle.year}</span>
              </div>
              <div className="p-3 bg-neutral-900/40 border border-neutral-900 rounded-xl text-center">
                <span className="block text-[12.5px] text-gray-400 uppercase font-bold">📍 Quilometragem</span>
                <span className="font-bold text-base text-white mt-1 block">
                  {vehicle.mileage === 0 ? 'Zero KM' : `${vehicle.mileage.toLocaleString('pt-BR')} KM`}
                </span>
              </div>
              <div className="p-3 bg-neutral-900/40 border border-neutral-900 rounded-xl text-center">
                <span className="block text-[12.5px] text-gray-400 uppercase font-bold">⚙️ Câmbio / Marchas</span>
                <span className="font-bold text-base text-white mt-1 block">{vehicle.transmission}</span>
              </div>
              <div className="p-3 bg-neutral-900/40 border border-neutral-900 rounded-xl text-center">
                <span className="block text-[12.5px] text-gray-400 uppercase font-bold">⛽ Combustível</span>
                <span className="font-bold text-base text-white mt-1 block">{vehicle.fuel}</span>
              </div>
            </div>
          </div>

          {/* Core CTAs block */}
          <div className="space-y-3 pt-4 border-t border-neutral-900">
            <button
              onClick={handleBuyWhatsapp}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] text-white hover:glow-pink font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 transition duration-300"
            >
              <MessageCircle className="w-5 h-5 fill-white text-[#FF2D8D]" />
              Comprar pelo WhatsApp
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyLink}
                className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 cursor-pointer ${
                  copied 
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                    : 'bg-neutral-900 border-neutral-800 hover:border-[#FF2D8D]/40 text-gray-300 hover:text-white'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-[#FF2D8D] shrink-0" />
                    Compartilhar
                  </>
                )}
              </button>

              <button
                onClick={toggleFavorite}
                className={`py-3 rounded-xl border font-bold text-xs uppercase tracking-wide transition flex items-center justify-center gap-2 cursor-pointer ${
                  isFavorite 
                    ? 'bg-[#FF2D8D]/15 border-[#FF2D8D]/40 text-[#FF6FB5]' 
                    : 'bg-neutral-900 border-neutral-800 hover:border-[#FF2D8D]/40 text-gray-300 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 shrink-0 ${isFavorite ? 'fill-[#FF2D8D] text-[#FF2D8D]' : 'text-gray-400'}`} />
                {isFavorite ? 'Favoritado' : 'Favoritar'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveFormModal('financiamento')}
                className="py-3 px-2 rounded-xl bg-[#1A1A1A]/80 border border-neutral-800 hover:border-[#FF2D8D]/40 text-white font-bold text-[11.5px] uppercase tracking-wide transition flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <Landmark className="w-4 h-4 text-[#FF2D8D]" />
                Simular Juros
              </button>
              <button
                onClick={() => setActiveFormModal('visita')}
                className="py-3 px-2 rounded-xl bg-[#1A1A1A]/80 border border-neutral-800 hover:border-[#FF2D8D]/40 text-white font-bold text-[11.5px] uppercase tracking-wide transition flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-[#FF6FB5]" />
                Agendar Teste
              </button>
              <button
                onClick={() => setActiveFormModal('avaliacao')}
                className="py-3 px-2 rounded-xl bg-[#1A1A1A]/80 border border-neutral-800 hover:border-[#FF2D8D]/40 text-white font-bold text-[11.5px] uppercase tracking-wide transition flex flex-col items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Avaliar Troca
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs list: Specs vs Description */}
      <div className="border-b border-neutral-900 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition ${
              activeTab === 'details' ? 'border-[#FF2D8D] text-white' : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Ficha Técnica e Opcionais
          </button>
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition ${
              activeTab === 'description' ? 'border-[#FF2D8D] text-white' : 'border-transparent text-gray-500 hover:text-white'
            }`}
          >
            Descrição do Veículo
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'details' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Specs Sheet (5 cols) */}
          <div className="md:col-span-5 bg-neutral-950 border border-neutral-900 rounded-2xl p-5 space-y-3.5">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] border-b border-neutral-900 pb-2">
              Especificações Básicas
            </h3>
            <div className="space-y-2.5 text-[14px] md:text-[14.5px]">
              <div className="flex items-center justify-between py-1 border-b border-neutral-900/50">
                <span className="text-gray-400">Marca</span>
                <span className="font-bold text-white">{vehicle.brand}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900/50">
                <span className="text-gray-400">Modelo</span>
                <span className="font-bold text-white">{vehicle.model}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900/50">
                <span className="text-gray-400">Ano</span>
                <span className="font-bold text-white">{vehicle.year}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900/50">
                <span className="text-gray-400">Quilometragem</span>
                <span className="font-bold text-white">
                  {vehicle.mileage === 0 ? 'Zero KM' : `${vehicle.mileage.toLocaleString('pt-BR')} KM`}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900/50">
                <span className="text-gray-400">Motor</span>
                <span className="font-bold text-white">{vehicle.engine}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900/50">
                <span className="text-gray-400">Potência (CV)</span>
                <span className="font-bold text-white">{vehicle.power}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-neutral-900/50">
                <span className="text-gray-400">Cor externa</span>
                <span className="font-bold text-white">{vehicle.color}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-gray-400">Combustível</span>
                <span className="font-bold text-white">{vehicle.fuel}</span>
              </div>
            </div>
          </div>

          {/* Optionals list (7 cols) */}
          <div className="md:col-span-7 bg-neutral-950 border border-neutral-900 rounded-2xl p-5">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] border-b border-neutral-900 pb-2 mb-4">
              Itens de Série e Opcionais Instalados
            </h3>
            {vehicle.options && vehicle.options.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {vehicle.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2 py-1.5 border-b border-neutral-900/40">
                    <div className="p-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-gray-300 font-medium">{opt}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Nenhum opcional específico cadastrado.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 text-xs text-gray-400 leading-relaxed whitespace-pre-line max-w-4xl">
          {vehicle.description || 'Nenhuma descrição detalhada disponível.'}
        </div>
      )}

      {/* Form Modals Dialog Box overlays */}
      {activeFormModal !== 'none' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-neutral-950 border border-neutral-900 rounded-2xl shadow-2xl p-1 max-h-[90vh] overflow-y-auto no-scrollbar">
            {/* Close button inside modal header wrapper */}
            <div className="flex justify-end p-2">
              <button
                onClick={() => setActiveFormModal('none')}
                className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-gray-400 text-[10px] font-bold border border-neutral-800 cursor-pointer"
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
    </div>
  );
}
