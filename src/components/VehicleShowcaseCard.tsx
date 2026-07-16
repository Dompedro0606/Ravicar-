import React from 'react';
import { Calendar, Gauge, Wrench, Fuel, Heart, ArrowUpRight } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleShowcaseCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
  onContactClick?: (e: React.MouseEvent) => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (e: React.MouseEvent) => void;
}

export function VehicleShowcaseCard({ vehicle, onClick, onContactClick, isFavorite = false, onFavoriteToggle }: VehicleShowcaseCardProps) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col bg-[#121214] border border-neutral-800/60 rounded-3xl overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--brand-color)]/10"
    >
      {/* Imagem no topo ocupando 100% da largura */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {vehicle.media && vehicle.media.length > 0 ? (
          <img
            src={vehicle.media[0].url}
            alt={vehicle.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-gray-600">
            Sem Foto
          </div>
        )}
        
        {/* Elementos sobrepostos na imagem (Posição Absoluta) */}
        {/* Badge Canto Superior Esquerdo */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {vehicle.newlyArrived ? (
            <span className="px-2.5 py-1.5 rounded-lg bg-[var(--brand-color)] text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
              NOVO
            </span>
          ) : vehicle.featured ? (
            <span className="px-2.5 py-1.5 rounded-lg bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-lg">
              DESTAQUE
            </span>
          ) : null}
        </div>

        {/* Ícone de coração (favoritar) circular translúcido no canto superior direito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onFavoriteToggle) onFavoriteToggle(e);
          }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-black/60 hover:scale-110 transition-all"
        >
          <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-[var(--brand-color)] text-[var(--brand-color)]' : 'text-white'}`} />
        </button>

        {/* Tag verde esmeralda translúcida com bolinha pulsante no canto inferior esquerdo */}
        <div className="absolute bottom-3 left-3 z-10">
          {vehicle.status === 'Disponível' && (
            <span className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              DISPONÍVEL
            </span>
          )}
          {vehicle.status === 'Reservado' && (
            <span className="px-2.5 py-1.5 rounded-xl bg-amber-950/70 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              RESERVADO
            </span>
          )}
        </div>
      </div>
      
      {/* Corpo do card */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Marca em cinza e letras maiúsculas */}
        <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">
          {vehicle.brand}
        </span>
        
        {/* Modelo do carro em branco e negrito */}
        <h3 className="text-white font-sans font-bold text-lg leading-tight mb-5 group-hover:text-[#FF2A7A] transition-colors line-clamp-2">
          {vehicle.title}
        </h3>
        
        {/* Grid de 2x2 com ícones pequenos */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-3 text-gray-400 text-xs font-medium mb-6">
          <div className="flex items-center gap-2 truncate">
            <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Wrench className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="truncate">{vehicle.transmission}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Gauge className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span>{vehicle.mileage === 0 ? 'Zero KM' : `${vehicle.mileage.toLocaleString('pt-BR')} KM`}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Fuel className="w-3.5 h-3.5 shrink-0 opacity-70" />
            <span className="truncate">{vehicle.fuel || 'Flex'}</span>
          </div>
        </div>
        
        {/* Rodapé do card */}
        <div className="mt-auto flex items-end justify-between border-t border-neutral-800/60 pt-5">
          <div className="flex flex-col gap-0.5">
            <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">
              VALOR ESPECIAL
            </span>
            <div className="text-white font-sans font-black text-2xl tracking-tight">
              R$ {vehicle.price.toLocaleString('pt-BR')}
            </div>
          </div>
          
          {/* Botão circular com uma seta apontando para a diagonal */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onContactClick) onContactClick(e);
            }}
            className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-gray-400 group-hover:bg-[#FF2A7A] group-hover:text-white group-hover:border-[#FF2A7A] transition-all duration-300 shadow-sm"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
