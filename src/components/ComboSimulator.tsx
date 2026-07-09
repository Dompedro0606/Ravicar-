import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Car, 
  ArrowRightLeft, 
  DollarSign, 
  ChevronRight, 
  Coins, 
  TrendingUp, 
  MapPin, 
  MessageCircle, 
  HelpCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  Search
} from 'lucide-react';
import { Vehicle, SiteSettings, UserProfile } from '../types';

interface ComboSimulatorProps {
  vehicles: Vehicle[];
  settings: SiteSettings;
  currentUser: UserProfile | null;
  onNavigate: (page: string, vehicleId?: string) => void;
}

export default function ComboSimulator({ vehicles, settings, currentUser, onNavigate }: ComboSimulatorProps) {
  // States
  const [selectedDesiredVehicleId, setSelectedDesiredVehicleId] = useState<string>('');
  const [usedBrand, setUsedBrand] = useState('');
  const [usedModel, setUsedModel] = useState('');
  const [usedYear, setUsedYear] = useState('');
  const [usedKm, setUsedKm] = useState('');
  const [usedColor, setUsedColor] = useState('');
  const [usedState, setUsedState] = useState<'excelente' | 'bom' | 'regular'>('bom');
  const [usedNotes, setUsedNotes] = useState('');

  // Client Details
  const [clientName, setClientName] = useState(currentUser?.name || '');
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [selectedBank, setSelectedBank] = useState('Santander');

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Custom dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out sold vehicles for the desired selection
  const availableDesiredVehicles = useMemo(() => {
    return vehicles.filter(v => v.status !== 'Vendido');
  }, [vehicles]);

  const selectedDesiredVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedDesiredVehicleId) || null;
  }, [vehicles, selectedDesiredVehicleId]);

  // Handle local AI calculation
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesiredVehicleId || !usedBrand || !usedModel || !usedYear || !usedKm) return;

    setLoading(true);

    try {
      // Send Lead & calculation to the backend or simulate locally with the exact same AI logic
      const reqBody = {
        name: clientName,
        phone: clientPhone,
        email: clientEmail,
        desiredVehicleId: selectedDesiredVehicleId,
        tradeBrand: usedBrand,
        tradeModel: usedModel,
        tradeYear: usedYear,
        tradeKm: usedKm,
        tradeColor: usedColor,
        tradeState: usedState,
        tradeNotes: usedNotes
      };

      // Call dedicated API route for saving the Combo Lead
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Troca com Troco / Combo',
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          vehicleId: selectedDesiredVehicleId,
          vehicleName: `${selectedDesiredVehicle?.brand} ${selectedDesiredVehicle?.model}`,
          message: `Simulação COMBO Realizada. Troca: ${usedBrand} ${usedModel} (${usedYear}) KM: ${usedKm}. Estado: ${usedState}.`,
          details: {
            tradeVehicleBrand: usedBrand,
            tradeVehicleModel: usedModel,
            tradeVehicleYear: usedYear,
            tradeVehicleKm: usedKm,
            tradeVehicleColor: usedColor,
            notes: usedNotes,
            isCombo: true
          }
        })
      });

      // Calculate localized math estimation with same high fidelity as backend
      const yearNum = parseInt(usedYear.replace(/\D/g, '')) || 2021;
      const kmNum = Number(usedKm.replace(/\D/g, '')) || 70000;
      const desiredPrice = selectedDesiredVehicle?.price || 80000;

      // Local FIPE Heuristic (RaviCar Local AI Model)
      let baseFipe = 50000;
      if (yearNum >= 2026) baseFipe = 110000;
      else if (yearNum >= 2024) baseFipe = 90000;
      else if (yearNum >= 2022) baseFipe = 75000;
      else if (yearNum >= 2020) baseFipe = 60000;
      else if (yearNum >= 2017) baseFipe = 45000;
      else if (yearNum >= 2014) baseFipe = 32000;
      else baseFipe = 22000;

      const lowerBrand = usedBrand.toLowerCase();
      let modifier = 1.0;
      if (lowerBrand.includes('toyota') || lowerBrand.includes('honda')) modifier = 1.15;
      else if (lowerBrand.includes('bmw') || lowerBrand.includes('mercedes') || lowerBrand.includes('audi')) modifier = 1.5;
      else if (lowerBrand.includes('jeep') || lowerBrand.includes('hyundai')) modifier = 1.08;
      else if (lowerBrand.includes('chevrolet') || lowerBrand.includes('fiat') || lowerBrand.includes('volkswagen') || lowerBrand.includes('ford')) modifier = 0.95;

      let adjustedFipe = baseFipe * modifier;

      // Depreciate by KM and State
      if (kmNum > 120000) adjustedFipe *= 0.85;
      else if (kmNum > 80000) adjustedFipe *= 0.92;
      else if (kmNum < 30000) adjustedFipe *= 1.07;

      if (usedState === 'excelente') adjustedFipe *= 1.03;
      if (usedState === 'regular') adjustedFipe *= 0.90;

      adjustedFipe = Math.round(adjustedFipe);
      
      // Used car buy-in offer at RaviCar (approx 83% of estimated FIPE)
      const usedEvaluationOffer = Math.round(adjustedFipe * 0.83);

      // Financial Balance
      const balanceDifference = desiredPrice - usedEvaluationOffer;
      const isTrocaComTroco = balanceDifference < 0;
      const absDifference = Math.abs(balanceDifference);

      // Finance Options (Only if client has to pay a difference)
      let financeOptions: Array<{ term: string; pmt: number }> = [];
      
      const getBankInterestRate = (b: string, s: any) => {
        const rates: { [key: string]: number } = {
          'Santander': Number(s?.taxaSantander) || 1.39,
          'Itaú': Number(s?.taxaItau) || 1.49,
          'Bradesco': Number(s?.taxaBradesco) || 1.59,
          'BV Financeira': Number(s?.taxaBv) || 1.29,
          'Banco PAN': Number(s?.taxaPan) || 1.69,
          'Banco Safra': Number(s?.taxaSafra) || 1.39,
          'C6 Bank': Number(s?.taxaC6) || 1.59,
          'Porto Seguro': Number(s?.taxaPorto) || 1.49,
          'Creditas': Number(s?.taxaCreditas) || 1.39,
          'Mercado Pago': Number(s?.taxaMercadoPago) || 1.69,
          'Banco Omni': Number(s?.taxaOmni) || 1.89,
          'Daycoval': Number(s?.taxaDaycoval) || 1.79,
        };
        return rates[b] || 1.59;
      };

      const rate = getBankInterestRate(selectedBank, settings);

      if (!isTrocaComTroco && absDifference > 0) {
        const calculatePMT = (pv: number, rateMonth: number, n: number) => {
          const r = rateMonth / 100;
          return (pv * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        };

        financeOptions = [
          { term: '24x', pmt: Math.round(calculatePMT(absDifference, rate, 24)) },
          { term: '36x', pmt: Math.round(calculatePMT(absDifference, rate, 36)) },
          { term: '48x', pmt: Math.round(calculatePMT(absDifference, rate, 48)) },
          { term: '60x', pmt: Math.round(calculatePMT(absDifference, rate, 60)) },
        ];
      }

      // Conservation Score (0 to 10)
      let score = 8.0;
      if (kmNum < 35000) score += 1.0;
      if (usedState === 'excelente') score += 1.0;
      if (usedState === 'regular') score -= 1.5;
      score = Math.max(0, Math.min(10, score));

      setTimeout(() => {
        setSimulationResult({
          desiredVehiclePrice: desiredPrice,
          tradeFipeEstimated: adjustedFipe,
          tradeEvaluationOffer: usedEvaluationOffer,
          balanceDifference: balanceDifference,
          absDifference: absDifference,
          isTrocaComTroco: isTrocaComTroco,
          financeOptions: financeOptions,
          interestRate: rate,
          scoreConservacao: score,
          parecer: isTrocaComTroco
            ? `Parabéns, ${clientName}! Seu carro de troca (${usedBrand} ${usedModel}) está super valorizado e vale mais do que o seu veículo de interesse (${selectedDesiredVehicle?.brand} ${selectedDesiredVehicle?.model}). Nessa operação de "Troca com Troco" especial na RaviCar, você leva o novo carro para casa revisado e nós te pagamos a diferença de R$ ${absDifference.toLocaleString('pt-BR')} via PIX direto na sua conta bancária na hora da assinatura! Venha agendar sua vistoria hoje.`
            : `Olá, ${clientName}! Analisamos seu cenário com o suporte do Simulador Inteligente RaviCar. Seu carro atual (${usedBrand} ${usedModel}) obteve uma pré-avaliação incrível de R$ ${usedEvaluationOffer.toLocaleString('pt-BR')} para entrar como crédito de entrada. Com isso, o saldo restante a financiar do seu novo ${selectedDesiredVehicle?.brand} ${selectedDesiredVehicle?.model} é de apenas R$ ${absDifference.toLocaleString('pt-BR')}, com parcelas pré-aprovadas a partir de R$ ${financeOptions[2]?.pmt.toLocaleString('pt-BR')} em 48x. Um plano super equilibrado e sem burocracia!`
        });
        setLoading(false);
      }, 1200);

    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSendWhatsapp = () => {
    if (!simulationResult || !selectedDesiredVehicle) return;

    const text = encodeURIComponent(
      `Olá RaviCar! Fiz a Simulação Combo no site:\n\n` +
      `🚗 *Carro que Quero:* ${selectedDesiredVehicle.brand} ${selectedDesiredVehicle.model} (R$ ${selectedDesiredVehicle.price.toLocaleString('pt-BR')})\n` +
      `🔄 *Meu Carro Atual:* ${usedBrand} ${usedModel} ${usedYear} (${usedKm} KM)\n` +
      `💰 *Pré-Avaliação:* R$ ${simulationResult.tradeEvaluationOffer.toLocaleString('pt-BR')}\n` +
      `📊 *Resultado:* ${simulationResult.isTrocaComTroco ? `Troca com Troco de R$ ${simulationResult.absDifference.toLocaleString('pt-BR')} pra mim!` : `Diferença de R$ ${simulationResult.absDifference.toLocaleString('pt-BR')}`}\n\n` +
      `Gostaria de agendar a vistoria física presencial para aprovação final!`
    );

    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12 text-left">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-900 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#FF2D8D]">
            <Sparkles className="w-4 h-4" />
            Exclusivo RaviCar Motors
          </div>
          <h1 className="font-display font-black text-2xl md:text-4xl text-white tracking-tight mt-1">
            Simulador Combo: <span className="text-[#FF2D8D]">Troca + Financiamento</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            A ferramenta definitiva e inédita no mercado de seminovos. Simule sua troca e o financiamento da diferença ao mesmo tempo!
          </p>
        </div>

        <button 
          onClick={() => setShowExplanation(!showExplanation)}
          className="px-4 py-2 rounded-lg border border-neutral-800 hover:border-[#FF2D8D] bg-neutral-950 text-xs font-bold text-gray-400 hover:text-[#FF2D8D] transition duration-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Info className="w-4 h-4 text-[#FF2D8D]" />
          Como funciona?
        </button>
      </div>

      {/* Explanation Banner */}
      {showExplanation && (
        <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-2xl grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF2D8D]/10 text-[#FF2D8D] flex items-center justify-center font-black font-display">1</div>
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">Escolha seu Interesse</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">Selecione qualquer veículo do nosso catálogo atualizado que deseja adquirir.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF2D8D]/10 text-[#FF2D8D] flex items-center justify-center font-black font-display">2</div>
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">Insira seu Carro Atual</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">Coloque a marca, modelo, ano e quilometragem do seu seminovo para estimativa de mercado.</p>
          </div>
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[#FF2D8D]/10 text-[#FF2D8D] flex items-center justify-center font-black font-display">3</div>
            <h4 className="font-display font-bold text-white text-xs uppercase tracking-wider">Análise de Balanço IA</h4>
            <p className="text-[11px] text-gray-400 leading-relaxed">Nossa calculadora calcula o saldo devedor e te dá as parcelas prontas, ou o seu PIX de troco!</p>
          </div>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Panel */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 rounded-3xl p-6 md:p-8 space-y-6">
          <form onSubmit={handleCalculate} className="space-y-6">
            
            {/* Step 1: Select Desired Vehicle */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#FF2D8D]" />
                1. Qual carro do nosso estoque você quer?
              </label>
              <div className="relative">
                {/* Selected Vehicle Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-black border border-neutral-800 hover:border-neutral-700 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white text-left transition duration-200 font-sans text-xs flex items-center justify-between cursor-pointer focus:outline-none"
                >
                  {selectedDesiredVehicle ? (
                    <div className="flex items-center gap-3">
                      {selectedDesiredVehicle.media && selectedDesiredVehicle.media[0] && (
                        <img 
                          src={selectedDesiredVehicle.media[0].url} 
                          alt="" 
                          className="w-8 h-8 rounded-lg object-cover bg-neutral-900 shrink-0 border border-neutral-800"
                        />
                      )}
                      <div>
                        <span className="font-extrabold text-white block">
                          {selectedDesiredVehicle.brand} {selectedDesiredVehicle.model} ({selectedDesiredVehicle.year})
                        </span>
                        <span className="text-[10px] text-[#FF2D8D] font-mono font-bold">
                          R$ {selectedDesiredVehicle.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500 font-medium">Selecione um carro do showroom...</span>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating custom option list */}
                {isDropdownOpen && (
                  <>
                    {/* Invisible Backdrop to close dropdown on outside clicks */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setSearchTerm('');
                      }}
                    />
                    
                    <div className="absolute left-0 right-0 z-50 mt-2 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in max-h-80 flex flex-col">
                      {/* Search box inside dropdown */}
                      <div className="p-3 border-b border-neutral-900 bg-neutral-950 flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-500 shrink-0" />
                        <input
                          type="text"
                          placeholder="Digite marca, modelo ou ano..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-transparent text-white outline-none placeholder-gray-600 text-xs py-1"
                          onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                        />
                      </div>

                      {/* Scrollable Items */}
                      <div className="overflow-y-auto divide-y divide-neutral-900/50 max-h-60">
                        {availableDesiredVehicles
                          .filter(v => {
                            const term = searchTerm.toLowerCase();
                            return (
                              v.brand.toLowerCase().includes(term) ||
                              v.model.toLowerCase().includes(term) ||
                              v.year.toString().includes(term)
                            );
                          })
                          .map(v => {
                            const isSelected = v.id === selectedDesiredVehicleId;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDesiredVehicleId(v.id);
                                  setIsDropdownOpen(false);
                                  setSearchTerm('');
                                }}
                                className={`w-full p-3 flex items-center justify-between text-left hover:bg-[#FF2D8D]/5 transition duration-150 cursor-pointer ${isSelected ? 'bg-[#FF2D8D]/10' : ''}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {v.media && v.media[0] && (
                                    <img 
                                      src={v.media[0].url} 
                                      alt="" 
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-xl object-cover bg-neutral-900 shrink-0 border border-neutral-900"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-white text-xs truncate">
                                      {v.brand} {v.model}
                                    </h4>
                                    <span className="text-[10px] text-gray-400 block mt-0.5">
                                      Ano: {v.year} • {v.transmission}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black font-mono text-[#FF2D8D]">
                                    R$ {v.price.toLocaleString('pt-BR')}
                                  </span>
                                  {isSelected && (
                                    <span className="text-[8px] bg-[#FF2D8D]/20 text-[#FF6FB5] border border-[#FF2D8D]/30 rounded-md px-1.5 py-0.5 font-bold uppercase block mt-1 text-center">
                                      Selecionado
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}

                        {availableDesiredVehicles.filter(v => {
                          const term = searchTerm.toLowerCase();
                          return (
                            v.brand.toLowerCase().includes(term) ||
                            v.model.toLowerCase().includes(term) ||
                            v.year.toString().includes(term)
                          );
                        }).length === 0 && (
                          <div className="p-4 text-center text-xs text-gray-500">
                            Nenhum carro encontrado para "{searchTerm}"
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 2: Current Used Car details */}
            <div className="space-y-4 pt-4 border-t border-neutral-900">
              <label className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-[#FF2D8D]" />
                2. Detalhes do seu carro atual (seminovo para troca)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Marca</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Toyota, Volkswagen"
                    value={usedBrand}
                    onChange={(e) => setUsedBrand(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Modelo</span>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Corolla XEI, Gol 1.6"
                    value={usedModel}
                    onChange={(e) => setUsedModel(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Ano de Fabricação</span>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 2019"
                    value={usedYear}
                    onChange={(e) => setUsedYear(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Quilometragem (KM)</span>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 68000"
                    value={usedKm}
                    onChange={(e) => setUsedKm(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Cor do Veículo</span>
                  <input
                    type="text"
                    placeholder="Ex: Prata, Preto"
                    value={usedColor}
                    onChange={(e) => setUsedColor(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Estado Geral de Conservação</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'excelente', label: 'Excelente (Sem retoques)' },
                    { value: 'bom', label: 'Bom (Desgaste normal)' },
                    { value: 'regular', label: 'Regular (Precisa reparos)' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setUsedState(opt.value as any)}
                      className={`py-2 px-3 text-[10px] font-bold rounded-xl border transition cursor-pointer ${
                        usedState === opt.value
                          ? 'bg-[#FF2D8D]/10 text-[#FF2D8D] border-[#FF2D8D]'
                          : 'bg-black border-neutral-800 text-gray-400 hover:text-white hover:border-neutral-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Observações, Opcionais ou Histórico de Revisões</span>
                <textarea
                  placeholder="Ex: Único dono, teto solar, revisões feitas na concessionária..."
                  value={usedNotes}
                  onChange={(e) => setUsedNotes(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white h-20 focus:border-[#FF2D8D] focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Step 3: Contact details */}
            <div className="space-y-4 pt-4 border-t border-neutral-900">
              <label className="text-xs font-black text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-[#FF2D8D]" />
                3. Seus Dados de Contato
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Seu Nome Completo</span>
                  <input
                    type="text"
                    required
                    placeholder="Nome"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Seu Celular / WhatsApp</span>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Banco de Preferência</span>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-[#FF2D8D] focus:outline-none cursor-pointer"
                  >
                    <option value="Santander">Santander</option>
                    <option value="Itaú">Itaú</option>
                    <option value="Bradesco">Bradesco</option>
                    <option value="BV Financeira">BV Financeira</option>
                    <option value="Banco PAN">Banco PAN</option>
                    <option value="Banco Safra">Banco Safra</option>
                    <option value="C6 Bank">C6 Bank</option>
                    <option value="Porto Seguro">Porto Seguro</option>
                    <option value="Creditas">Creditas</option>
                    <option value="Mercado Pago">Mercado Pago</option>
                    <option value="Banco Omni">Banco Omni</option>
                    <option value="Daycoval">Daycoval</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] hover:opacity-95 text-xs font-black uppercase tracking-wider text-white shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Analisando Cenário Combo no Showroom...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Calcular Troca e Financiamento Casado</span>
                </>
              )}
            </button>

            {/* Disclaimer */}
            <div className="p-3 bg-neutral-900/40 border border-neutral-900 rounded-xl flex items-start gap-2.5">
              <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 leading-normal">
                *A simulação é apenas uma estimativa e não representa uma aprovação de crédito.*
              </p>
            </div>
          </form>
        </div>

        {/* Results Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          {simulationResult ? (
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 space-y-6 text-left animate-fade-in relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-y-[-20%] translate-x-[20%] w-32 h-32 rounded-full bg-[#FF2D8D]/5 blur-2xl"></div>

              <div>
                <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider bg-[#FF2D8D]/10 text-[#FF6FB5] border border-[#FF2D8D]/20 font-black">
                  Análise Finalizada RaviCar AI
                </span>
                <h3 className="font-display font-black text-white text-xl mt-3">Resultado do Balanceamento</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Estudo preliminar de crédito e permuta de ativos.</p>
              </div>

              {/* Vehicle Comparison Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-black border border-neutral-900 rounded-xl space-y-1 text-center">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Carro que Quero</span>
                  <p className="text-xs text-white font-black truncate">{selectedDesiredVehicle?.brand} {selectedDesiredVehicle?.model}</p>
                  <p className="text-xs text-[#FF2D8D] font-extrabold font-mono">R$ {simulationResult.desiredVehiclePrice.toLocaleString('pt-BR')}</p>
                </div>

                <div className="p-3 bg-black border border-neutral-900 rounded-xl space-y-1 text-center">
                  <span className="text-[9px] text-gray-500 font-bold uppercase">Seu Carro de Entrada</span>
                  <p className="text-xs text-white font-black truncate">{usedBrand} {usedModel}</p>
                  <p className="text-xs text-emerald-400 font-extrabold font-mono">R$ {simulationResult.tradeEvaluationOffer.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Main Balance Display */}
              <div className="p-5 bg-black border border-neutral-800 rounded-2xl space-y-2 text-center relative overflow-hidden">
                {simulationResult.isTrocaComTroco ? (
                  <>
                    <div className="absolute right-3 top-3 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-900">
                      Troca com Troco!
                    </div>
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Você recebe de volta (PIX):</span>
                    <p className="font-display font-black text-3xl text-emerald-400 font-mono leading-none">R$ {simulationResult.absDifference.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed pt-2">
                      Você sai de carro novo e com dinheiro no bolso! A RaviCar deposita esse valor na sua conta bancária na hora.
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-[9px] text-gray-500 font-bold uppercase block">Saldo Restante a Financiar:</span>
                    <p className="font-display font-black text-3xl text-[#FF2D8D] font-mono leading-none">R$ {simulationResult.absDifference.toLocaleString('pt-BR')}</p>
                    <p className="text-[10px] text-gray-400 leading-relaxed pt-1">
                      Este saldo é o valor líquido da diferença a ser diluído em parcelas confortáveis.
                    </p>
                  </>
                )}
              </div>

              {/* Financing simulation plans (Only if not Troca com Troco) */}
              {!simulationResult.isTrocaComTroco && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-[#FF2D8D]" />
                    Simulação de Parcelas para a Diferença
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {simulationResult.financeOptions.map((opt: any) => (
                      <div key={opt.term} className="p-3 bg-black border border-neutral-900 rounded-xl flex flex-col justify-center text-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{opt.term} de</span>
                        <span className="text-sm text-white font-black font-mono mt-0.5">R$ {opt.pmt.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-500 leading-normal text-center">
                    * Calculado com taxa de {simulationResult.interestRate}% a.m. através das nossas 13 instituições integradas.
                  </p>
                </div>
              )}

              {/* Parecer textual */}
              <div className="p-4 bg-[#111111] rounded-2xl border border-neutral-900 text-xs text-gray-400 leading-relaxed italic">
                "{simulationResult.parecer}"
              </div>

              {/* Pre-approved next steps and physical visit guarantee */}
              <div className="p-4 bg-gradient-to-r from-neutral-950 to-neutral-900 border border-[#FF2D8D]/20 rounded-2xl flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-[#FF2D8D] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-display font-black text-[11px] text-white uppercase tracking-wider">Como Aprovar o Saldo?</h5>
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Clique no botão do WhatsApp abaixo para enviar os dados para seu perito e agendar a vistoria cautelar na agência RaviCar para assinar o contrato hoje mesmo!
                  </p>
                </div>
              </div>

              {/* Send leads action */}
              <button
                onClick={handleSendWhatsapp}
                className="w-full py-3.5 bg-[#25D366] hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                Falar com Perito no WhatsApp
              </button>

              {/* Simulation Disclaimer */}
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-start gap-2.5">
                <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-gray-500 leading-relaxed">
                  *A simulação é apenas uma estimativa e não representa uma aprovação de crédito.*
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-neutral-950 border border-neutral-900 border-dashed rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center space-y-4 py-16">
              <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-neutral-800 flex items-center justify-center text-gray-600">
                <ArrowRightLeft className="w-8 h-8 text-gray-500" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="font-display font-bold text-white text-sm">Aguardando Preenchimento</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Preencha os dados do veículo desejado e do seu veículo atual para que nossa inteligência de mercado faça o balanceamento instantâneo.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
