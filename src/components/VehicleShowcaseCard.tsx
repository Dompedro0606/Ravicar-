import React from 'react';
import { Calendar, Gauge, Wrench, Fuel } from 'lucide-react';
import { Vehicle } from '../types';

interface VehicleShowcaseCardProps {
  vehicle: Vehicle;
  onClick?: () => void;
  onContactClick?: (e: React.MouseEvent) => void;
}

export function VehicleShowcaseCard({ vehicle, onClick, onContactClick }: VehicleShowcaseCardProps) {
  return (
    <div 
      onClick={onClick}
      className="flex flex-col bg-[#18181B] rounded-lg overflow-hidden cursor-pointer group transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.7)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {vehicle.media && vehicle.media.length > 0 ? (
          <img
            src={vehicle.media[0].url}
            alt={vehicle.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 rounded-t-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-gray-500 rounded-t-lg">
            Sem Foto
          </div>
        )}
        
        {/* Status Tags */}
        <div className="absolute top-3 left-3 z-10">
          {vehicle.status === 'Disponível' && (
            <span className="px-3 py-1 rounded bg-emerald-100/95 backdrop-blur-sm text-emerald-900 text-[10px] font-bold uppercase tracking-[0.05em] shadow-sm">
              Disponível
            </span>
          )}
          {vehicle.status === 'Reservado' && (
            <span className="px-3 py-1 rounded bg-[#CC4510]/95 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.05em] shadow-sm">
              Reservado
            </span>
          )}
          {vehicle.status !== 'Disponível' && vehicle.status !== 'Reservado' && (
            <span className="px-3 py-1 rounded bg-neutral-600/90 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-[0.05em] shadow-sm">
              {vehicle.status}
            </span>
          )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        {/* Typography */}
        <h3 className="text-[#FFFFFF] font-sans font-bold text-[17px] leading-tight mb-4 group-hover:text-[#FF2A7A] transition-colors line-clamp-2">
          {vehicle.title}
        </h3>
        
        {/* Tech Info */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[#A1A1AA] text-xs font-medium mb-6">
          <div className="flex items-center gap-2 truncate">
            <Calendar className="w-4 h-4 shrink-0 opacity-70" />
            <span>{vehicle.year}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Gauge className="w-4 h-4 shrink-0 opacity-70" />
            <span>{vehicle.mileage === 0 ? 'Zero KM' : `${vehicle.mileage.toLocaleString('pt-BR')} KM`}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Wrench className="w-4 h-4 shrink-0 opacity-70" />
            <span className="truncate">{vehicle.transmission}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <Fuel className="w-4 h-4 shrink-0 opacity-70" />
            <span className="truncate">{vehicle.fuel || 'Flex'}</span>
          </div>
        </div>
        
        {/* Price & Action */}
        <div className="mt-auto flex flex-col gap-4 border-t border-neutral-800/60 pt-5">
          <div className="text-[#FFFFFF] font-sans font-black text-2xl tracking-tight">
            R$ {vehicle.price.toLocaleString('pt-BR')}
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onContactClick) onContactClick(e);
            }}
            className="w-full bg-[#FF2A7A] hover:bg-[#D61F62] text-white font-bold py-3.5 px-4 rounded transition-colors duration-300 text-[13px] tracking-wide uppercase flex items-center justify-center gap-2"
          >
            Falar com Consultor
          </button>
        </div>
      </div>
    </div>
  );
}
