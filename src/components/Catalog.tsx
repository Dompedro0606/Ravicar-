import React, { useState, useMemo, useEffect } from 'react';
import { Search, Fuel, Settings2, SlidersHorizontal, Eye, ArrowUpDown, Tag, Check, Calendar, ChevronDown, Heart } from 'lucide-react';
import { Vehicle, FuelType, TransmissionType, VehicleStatus, UserProfile } from '../types';

interface CatalogProps {
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  currentUser?: UserProfile | null;
}

export function Catalog({ vehicles, onSelectVehicle, currentUser }: CatalogProps) {
  // Favorites State
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const handleSyncFavs = () => {
      if (currentUser) {
        const saved = localStorage.getItem(`ravicar_favs_${currentUser.id}`);
        if (saved) {
          try { setFavorites(JSON.parse(saved)); } catch (e) { console.error(e); }
        } else {
          setFavorites([]);
        }
      } else {
        const saved = localStorage.getItem('ravicar_guest_favs');
        if (saved) {
          try { setFavorites(JSON.parse(saved)); } catch (e) { console.error(e); }
        } else {
          setFavorites([]);
        }
      }
    };

    handleSyncFavs();
    window.addEventListener('favorites-updated', handleSyncFavs);
    return () => window.removeEventListener('favorites-updated', handleSyncFavs);
  }, [currentUser]);

  const toggleFavorite = (vehicleId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Previne abrir os detalhes do carro
    let updated: string[];
    if (favorites.includes(vehicleId)) {
      updated = favorites.filter(id => id !== vehicleId);
    } else {
      updated = [...favorites, vehicleId];
    }
    setFavorites(updated);
    
    if (currentUser) {
      localStorage.setItem(`ravicar_favs_${currentUser.id}`, JSON.stringify(updated));
    } else {
      localStorage.setItem('ravicar_guest_favs', JSON.stringify(updated));
    }
    
    // Dispara o evento para sincronizar outros componentes
    window.dispatchEvent(new Event('favorites-updated'));
  };

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedFuel, setSelectedFuel] = useState('');
  const [selectedTransmission, setSelectedTransmission] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Disponível'); // default to show available, but can change
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'year_desc' | 'views_desc' | 'newest'>('newest');

  // Main Filters Toggle State
  const [showFilters, setShowFilters] = useState(false);

  // Collapsible Filters State - once main panel is opened, we default individual categories to open for faster usability
  const [openFilters, setOpenFilters] = useState<Record<string, boolean>>({
    brand: true,
    status: true,
    transmission: true,
    fuel: true,
    price: true
  });

  const toggleFilter = (key: string) => {
    setOpenFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Compute unique brands, fuels, transmissions for filter options
  const brands = useMemo(() => {
    const list = vehicles.map(v => v.brand);
    return Array.from(new Set(list)).sort();
  }, [vehicles]);

  const maxPossiblePrice = useMemo(() => {
    if (vehicles.length === 0) return 200000;
    return Math.max(...vehicles.map(v => v.price));
  }, [vehicles]);

  // Handle active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedBrand) count++;
    if (selectedFuel) count++;
    if (selectedTransmission) count++;
    if (selectedStatus && selectedStatus !== 'Todos') count++;
    if (maxPrice > 0 && maxPrice < maxPossiblePrice) count++;
    return count;
  }, [selectedBrand, selectedFuel, selectedTransmission, selectedStatus, maxPrice, maxPossiblePrice]);

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedBrand('');
    setSelectedFuel('');
    setSelectedTransmission('');
    setSelectedStatus('Disponível');
    setMaxPrice(0);
    setSearch('');
    setSortBy('newest');
  };

  // Filter & Sort Logic
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // Search text filter (title, model, brand, engine, color)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        v =>
          v.title.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q) ||
          v.engine.toLowerCase().includes(q)
      );
    }

    // Brand filter
    if (selectedBrand) {
      result = result.filter(v => v.brand === selectedBrand);
    }

    // Fuel filter
    if (selectedFuel) {
      result = result.filter(v => v.fuel === selectedFuel);
    }

    // Transmission filter
    if (selectedTransmission) {
      result = result.filter(v => v.transmission === selectedTransmission);
    }

    // Status filter
    if (selectedStatus && selectedStatus !== 'Todos') {
      result = result.filter(v => v.status === selectedStatus);
    }

    // Price filter
    if (maxPrice > 0) {
      result = result.filter(v => v.price <= maxPrice);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'year_desc') {
        const yearA = parseInt(a.year.split('/')[0]) || 0;
        const yearB = parseInt(b.year.split('/')[0]) || 0;
        return yearB - yearA;
      }
      if (sortBy === 'views_desc') return (b.views || 0) - (a.views || 0);
      
      // Default: newest added first (based on ID or timestamp if available)
      return b.createdAt.localeCompare(a.createdAt);
    });

    return result;
  }, [vehicles, search, selectedBrand, selectedFuel, selectedTransmission, selectedStatus, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Intro section */}
      <div className="mb-8">
        <h1 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight">
          Nosso Showroom de Veículos Seminovos
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Explore carros periciados, revisados e de alta procedência. Compre à vista, financie em até 60x ou ofereça seu carro como parte do pagamento.
        </p>
      </div>

      {/* Main Grid: left filters bar (desktop) and right catalog list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Panel */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-4 lg:h-fit lg:sticky lg:top-24 transition-all duration-300">
          {/* Main Clickable Header to Toggle Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between text-left group outline-none focus:outline-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#FF2D8D]" />
              <span className="font-display font-bold text-sm text-white group-hover:text-[#FF6FB5] transition">
                Filtros de Busca
              </span>
              {activeFiltersCount > 0 && (
                <span className="bg-[#FF2D8D]/20 text-[#FF2D8D] text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#FF2D8D]/30">
                  {activeFiltersCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5">
              {activeFiltersCount > 0 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFilters();
                  }}
                  className="text-[10px] text-[#FF6FB5] hover:underline font-bold mr-1 cursor-pointer"
                >
                  Limpar
                </span>
              )}
              <span className="text-[10px] text-gray-500 group-hover:text-gray-300 transition">
                {showFilters ? 'Ocultar' : 'Mostrar'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-white transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {showFilters ? (
            <div className="mt-4 pt-4 border-t border-neutral-900 space-y-4">
              {/* Search Input - Always Visible when panel is open */}
              <div className="pb-3 border-b border-neutral-900/60">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Texto Livre</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Modelo, marca, cor..."
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Brand Collapsible Filter */}
              <div className="border-b border-neutral-900/60 pb-3">
                <button
                  type="button"
                  onClick={() => toggleFilter('brand')}
                  className="w-full flex items-center justify-between text-left py-1 group/btn outline-none focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Marca</span>
                    {selectedBrand ? (
                      <span className="text-xs text-[#FF2D8D] font-bold mt-0.5">{selectedBrand}</span>
                    ) : (
                      <span className="text-[11px] text-gray-400 mt-0.5">Todas as Marcas</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 group-hover/btn:text-white transition-transform duration-200 ${openFilters.brand ? 'rotate-180 text-white' : ''}`} />
                </button>
                
                {openFilters.brand && (
                  <div className="mt-2.5 pt-1.5">
                    <select
                      value={selectedBrand}
                      onChange={e => setSelectedBrand(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                    >
                      <option value="">Todas as Marcas</option>
                      {brands.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Status Collapsible Filter */}
              <div className="border-b border-neutral-900/60 pb-3">
                <button
                  type="button"
                  onClick={() => toggleFilter('status')}
                  className="w-full flex items-center justify-between text-left py-1 group/btn outline-none focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status do Veículo</span>
                    {selectedStatus ? (
                      <span className="text-xs text-[#FF2D8D] font-bold mt-0.5">{selectedStatus}</span>
                    ) : (
                      <span className="text-[11px] text-gray-400 mt-0.5">Todos</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 group-hover/btn:text-white transition-transform duration-200 ${openFilters.status ? 'rotate-180 text-white' : ''}`} />
                </button>
                
                {openFilters.status && (
                  <div className="mt-2.5 pt-1.5 flex flex-wrap gap-1.5">
                    {['Disponível', 'Reservado', 'Vendido', 'Todos'].map(status => (
                      <button
                        key={status}
                        onClick={() => setSelectedStatus(status)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition-all border ${
                          selectedStatus === status
                            ? 'bg-[#FF2D8D] border-[#FF2D8D] text-white'
                            : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Transmission Collapsible Filter */}
              <div className="border-b border-neutral-900/60 pb-3">
                <button
                  type="button"
                  onClick={() => toggleFilter('transmission')}
                  className="w-full flex items-center justify-between text-left py-1 group/btn outline-none focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Câmbio</span>
                    {selectedTransmission ? (
                      <span className="text-xs text-[#FF2D8D] font-bold mt-0.5">{selectedTransmission}</span>
                    ) : (
                      <span className="text-[11px] text-gray-400 mt-0.5">Qualquer Câmbio</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 group-hover/btn:text-white transition-transform duration-200 ${openFilters.transmission ? 'rotate-180 text-white' : ''}`} />
                </button>
                
                {openFilters.transmission && (
                  <div className="mt-2.5 pt-1.5">
                    <select
                      value={selectedTransmission}
                      onChange={e => setSelectedTransmission(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                    >
                      <option value="">Qualquer Câmbio</option>
                      <option value="Manual">Manual</option>
                      <option value="Automático">Automático</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Fuel Collapsible Filter */}
              <div className="border-b border-neutral-900/60 pb-3">
                <button
                  type="button"
                  onClick={() => toggleFilter('fuel')}
                  className="w-full flex items-center justify-between text-left py-1 group/btn outline-none focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Combustível</span>
                    {selectedFuel ? (
                      <span className="text-xs text-[#FF2D8D] font-bold mt-0.5">{selectedFuel}</span>
                    ) : (
                      <span className="text-[11px] text-gray-400 mt-0.5">Qualquer Combustível</span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 group-hover/btn:text-white transition-transform duration-200 ${openFilters.fuel ? 'rotate-180 text-white' : ''}`} />
                </button>
                
                {openFilters.fuel && (
                  <div className="mt-2.5 pt-1.5">
                    <select
                      value={selectedFuel}
                      onChange={e => setSelectedFuel(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                    >
                      <option value="">Qualquer Combustível</option>
                      <option value="Gasolina">Gasolina</option>
                      <option value="Etanol">Etanol</option>
                      <option value="Flex">Flex</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Elétrico">Elétrico</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Price Collapsible Filter */}
              <div className="pb-1">
                <button
                  type="button"
                  onClick={() => toggleFilter('price')}
                  className="w-full flex items-center justify-between text-left py-1 group/btn outline-none focus:outline-none"
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Valor Máximo</span>
                    <span className="text-xs text-[#FF2D8D] font-bold mt-0.5">
                      {maxPrice > 0 ? `Até R$ ${maxPrice.toLocaleString('pt-BR')}` : 'Sem limite'}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 group-hover/btn:text-white transition-transform duration-200 ${openFilters.price ? 'rotate-180 text-white' : ''}`} />
                </button>
                
                {openFilters.price && (
                  <div className="mt-3 pt-1.5">
                    <input
                      type="range"
                      min={20000}
                      max={maxPossiblePrice || 250000}
                      step={5000}
                      value={maxPrice || maxPossiblePrice}
                      onChange={e => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-[#FF2D8D]"
                    />
                    <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-mono">
                      <span>R$ 20.000</span>
                      <span>R$ {(maxPossiblePrice || 250000).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-gray-500 mt-2 leading-normal">
              Clique acima para exibir as opções de filtragem e busca.
            </p>
          )}
        </div>

        {/* Catalog list column */}
        <div className="lg:col-span-3">
          {/* Top sorting selection */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 bg-neutral-950 border border-neutral-900 p-3 rounded-2xl">
            <p className="text-xs text-gray-400 font-medium pl-1">
              Mostrando <span className="text-white font-bold">{filteredVehicles.length}</span> veículos encontrados
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-500 shrink-0 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Ordenar por:
              </span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3 py-1.5 text-xs text-white outline-none transition w-full sm:w-auto"
              >
                <option value="newest">Mais Recentes</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="year_desc">Ano Mais Novo</option>
                <option value="views_desc">Mais Vistos</option>
              </select>
            </div>
          </div>

          {/* Cards Bento-Grid */}
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-20 bg-neutral-950 border border-neutral-900 rounded-3xl flex flex-col items-center">
              <SlidersHorizontal className="w-12 h-12 text-gray-600 mb-4 animate-pulse" />
              <h3 className="font-display font-bold text-lg text-white mb-1">Nenhum veículo corresponde à sua busca</h3>
              <p className="text-xs text-gray-500 max-w-sm">Tente reajustar seus filtros de preço, combustível ou remova o texto da busca livre.</p>
              <button
                onClick={handleClearFilters}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1A1A1A] border border-neutral-800 text-xs text-[#FF2D8D] font-bold hover:bg-neutral-900 transition"
              >
                Redefinir Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredVehicles.map(v => {
                const isAvailable = v.status === 'Disponível';
                const isReserved = v.status === 'Reservado';
                const isSold = v.status === 'Vendido';

                return (
                  <div
                    key={v.id}
                    onClick={() => onSelectVehicle(v.id)}
                    className="group bg-neutral-950 border border-neutral-900/60 rounded-2xl overflow-hidden shadow-lg hover:border-[#FF2D8D]/40 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between cursor-pointer"
                  >
                    {/* Image Area */}
                    <div className="relative h-48 overflow-hidden bg-[#1A1A1A]">
                      {v.media && v.media.length > 0 ? (
                        <img
                          src={v.media[0].url}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          Sem Foto
                        </div>
                      )}

                      {/* Featured Star */}
                      {v.featured && (
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/80 border border-[#FF2D8D]/30 rounded text-[11px] font-extrabold uppercase text-[#FF6FB5] tracking-widest flex items-center gap-1">
                          ⚡ Destaque
                        </div>
                      )}

                      {/* Favorite Heart Button */}
                      <button
                        onClick={(e) => toggleFavorite(v.id, e)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/60 border border-neutral-800 hover:border-[#FF2D8D] text-white hover:text-[#FF2D8D] transition-all cursor-pointer z-20 hover:scale-110"
                        title={favorites.includes(v.id) ? "Remover dos favoritos" : "Salvar nos favoritos"}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${favorites.includes(v.id) ? 'fill-[#FF2D8D] text-[#FF2D8D]' : 'text-gray-300'}`} />
                      </button>

                      {/* New Badge (shifted left of the heart button) */}
                      {v.newlyArrived && (
                        <div className="absolute top-3 right-11 px-2.5 py-1 bg-[#FF2D8D] rounded text-[11px] font-extrabold uppercase text-white tracking-widest z-10 shadow-md">
                          Novo
                        </div>
                      )}

                      {/* Status Overlay */}
                      <div className="absolute bottom-3 left-3">
                        <span className={`px-2.5 py-1 rounded text-[11px] font-black uppercase tracking-wider ${
                          isAvailable ? 'bg-emerald-500/95 text-white' :
                          isReserved ? 'bg-amber-500/95 text-black font-bold' :
                          'bg-neutral-800 text-gray-400'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Area */}
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <span className="text-[12px] leading-normal text-gray-400 uppercase tracking-widest font-extrabold">{v.brand}</span>
                        <h4 className="font-display font-bold text-white text-sm truncate leading-relaxed py-1 mt-0.5 group-hover:text-[#FF2D8D] transition-colors duration-200">
                          {v.title}
                        </h4>
                        
                        {/* Tags list */}
                        <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 mt-3 text-[12.5px] leading-normal text-gray-300">
                          <span className="flex items-center gap-1 truncate py-0.5">
                            📅 {v.year}
                          </span>
                          <span className="flex items-center gap-1 truncate py-0.5">
                            ⚙️ {v.transmission}
                          </span>
                          <span className="flex items-center gap-1 truncate py-0.5">
                            📍 {v.mileage === 0 ? 'Zero KM' : `${v.mileage.toLocaleString('pt-BR')} KM`}
                          </span>
                          <span className="flex items-center gap-1 truncate py-0.5">
                            ⛽ {v.fuel}
                          </span>
                        </div>
                      </div>

                      {/* Pricing block */}
                      <div className="mt-5 pt-3 border-t border-neutral-900/60 flex items-end justify-between">
                        <div>
                          <p className="text-[11.5px] leading-normal text-gray-400 uppercase font-bold py-0.5">Valor Especial</p>
                          <p className="font-display font-black text-[#FF2D8D] text-lg mt-0.5 py-1">
                            R$ {v.price.toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="text-[12.5px] leading-normal font-bold text-gray-400 group-hover:text-[#FF6FB5] transition duration-200 flex items-center gap-1">
                          Ver Detalhes →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
