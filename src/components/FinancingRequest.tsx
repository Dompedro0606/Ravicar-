import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, 
  Send, 
  CheckCircle2, 
  MessageCircle, 
  Mail, 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  Percent, 
  Check,
  Calendar,
  Gauge,
  ShieldCheck,
  DollarSign,
  ArrowRight,
  User,
  Phone,
  FileText,
  Eye,
  HelpCircle,
  Clock,
  Info,
  ChevronDown,
  Search
} from 'lucide-react';
import { Vehicle, SiteSettings, UserProfile } from '../types';

interface FinancingRequestProps {
  settings: SiteSettings;
  vehicles: Vehicle[];
  preselectedVehicleId?: string;
  currentUser?: UserProfile | null;
}

export function FinancingRequest({ settings, vehicles, preselectedVehicleId, currentUser }: FinancingRequestProps) {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cpf: '',
    birthDate: '',
    vehicleId: preselectedVehicleId || '',
    downPayment: '',
    installments: '48x',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSimulationResult, setAiSimulationResult] = useState<{
    aprovado: boolean;
    score_aprovacao: number;
    valor_financiado: number;
    taxa_juros_mensal: number;
    valor_parcela: number;
    total_pago_final: number;
    parecer_ia: string;
    planos_alternativos: Array<{
      parcelas: string;
      valor_parcela: number;
    }>;
  } | null>(null);

  // Custom dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-populate user data if logged in
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || '',
      }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (preselectedVehicleId) {
      setFormData(prev => ({ ...prev, vehicleId: preselectedVehicleId }));
    }
  }, [preselectedVehicleId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Find currently selected vehicle
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === formData.vehicleId) || null;
  }, [vehicles, formData.vehicleId]);

  // Live Math Calculation for User Feedback BEFORE submission
  const liveCalculation = useMemo(() => {
    if (!selectedVehicle) return null;
    
    const carPrice = selectedVehicle.price;
    const downPaymentNum = Math.max(0, parseFloat(formData.downPayment.replace(/\D/g, '')) || 0);
    const balanceToFinance = Math.max(0, carPrice - downPaymentNum);
    
    // Monthly interest rate heuristic
    let rate = 1.59;
    if (balanceToFinance < 20000) rate = 1.49;
    else if (balanceToFinance > 60000) rate = 1.79;

    const n = parseInt(formData.installments.replace(/\D/g, '')) || 48;
    
    // PMT loan formula: PV * r * (1+r)^n / ((1+r)^n - 1)
    const r = rate / 100;
    let estimatedPMT = 0;
    if (balanceToFinance > 0) {
      estimatedPMT = (balanceToFinance * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    return {
      carPrice,
      downPayment: downPaymentNum,
      balanceToFinance,
      rate,
      term: `${n}x`,
      estimatedPMT: Math.round(estimatedPMT),
      isDownPaymentTooHigh: downPaymentNum >= carPrice
    };
  }, [selectedVehicle, formData.downPayment, formData.installments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.cpf || !formData.vehicleId) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Telefone, CPF e Veículo de Interesse).');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/gemini/simulate-financing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          cpf: formData.cpf,
          birthDate: formData.birthDate,
          vehicleId: formData.vehicleId,
          downPayment: formData.downPayment || '0',
          installments: formData.installments,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSimulationResult(data.simulation);
        setSubmitted(true);
      } else {
        const errData = await response.json();
        alert(`Erro: ${errData.error || 'Não foi possível processar a simulação.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsapp = () => {
    const carName = selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.year})` : 'um veículo do estoque';
    
    let aiText = '';
    if (aiSimulationResult) {
      aiText = `\n\n*Resultado da Simulação IA:*
- *Aprovado:* ${aiSimulationResult.aprovado ? 'Sim (Alta Probabilidade)' : 'Pendente de Garantias'}
- *Score:* ${aiSimulationResult.score_aprovacao}/100
- *Valor Financiado:* R$ ${aiSimulationResult.valor_financiado.toLocaleString('pt-BR')}
- *Parcelas:* ${formData.installments} de R$ ${aiSimulationResult.valor_parcela.toLocaleString('pt-BR')}
- *Taxa de juros:* ${aiSimulationResult.taxa_juros_mensal}% a.m.`;
    }

    const text = `Olá RaviCar! Acabei de enviar uma proposta de simulação de financiamento pelo site:
*Nome:* ${formData.name}
*Telefone:* ${formData.phone}
*CPF:* ${formData.cpf}
*Veículo:* ${carName}
*Valor de Entrada:* R$ ${formData.downPayment || '0'}
*Parcelas desejadas:* ${formData.installments}${aiText}

Por favor, analisem meu cadastro no banco de preferência para confirmar a aprovação imediata!`;

    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 text-left">
      {/* Header Panel with Beautiful Gradient Text & Background */}
      <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl bg-neutral-950 border border-neutral-900/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute right-0 top-0 translate-y-[-30%] translate-x-[30%] w-56 h-56 rounded-full bg-[#FF2D8D]/5 blur-3xl"></div>
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-1 text-[10px] md:text-xs uppercase tracking-widest font-black text-[#FF2D8D]">
            <Sparkles className="w-4 h-4 text-[#FF2D8D] animate-spin-slow" />
            Integrador Inteligente
          </div>
          <h1 className="font-display font-black text-2xl md:text-4xl text-white tracking-tight">
            Financiamento <span className="text-[#FF2D8D]">Sem Burocracia</span>
          </h1>
          <p className="text-xs text-gray-400">
            Ficha cadastral avaliada por Inteligência Artificial conectada em tempo real com as 13 principais financeiras do Brasil.
          </p>
        </div>

        {/* Dynamic Fast Pre-Approval Badge */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-black/60 border border-neutral-800 rounded-2xl z-10 shrink-0">
          <Clock className="w-4 h-4 text-[#FF6FB5] animate-pulse" />
          <div className="text-[10px] md:text-xs">
            <span className="text-gray-400 block font-bold leading-none">Tempo de Resposta</span>
            <strong className="text-white font-extrabold block mt-0.5 font-mono">~ 40 segundos</strong>
          </div>
        </div>
      </div>

      {/* Finance Partner Banks Showcase */}
      <div className="p-5 bg-neutral-950 border border-neutral-900/60 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6FB5] flex items-center gap-1">
            <Landmark className="w-3.5 h-3.5" />
            Parceiros de Crédito Credenciados
          </span>
          <span className="text-[9px] font-bold text-gray-500 bg-neutral-900 px-2.5 py-0.5 rounded-full border border-neutral-800">
            Abaixo da Taxa de Balcão
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[
            { name: 'Santander', promo: true },
            { name: 'Itaú', promo: false },
            { name: 'Bradesco', promo: false },
            { name: 'BV Financeira', promo: true },
            { name: 'Banco PAN', promo: false },
            { name: 'Banco Safra', promo: true },
            { name: 'C6 Bank', promo: false },
            { name: 'Porto Seguro', promo: false },
            { name: 'Creditas', promo: true },
            { name: 'Mercado Pago', promo: false },
            { name: 'Banco Omni', promo: false },
            { name: 'Daycoval', promo: false }
          ].map((bank, index) => (
            <div 
              key={index} 
              className="group p-3 bg-neutral-950/40 border border-neutral-900 rounded-2xl hover:border-[#FF2D8D]/30 transition duration-300 text-center relative overflow-hidden flex flex-col justify-center items-center h-16"
            >
              <span className="font-sans font-black text-xs text-gray-300 group-hover:text-white transition duration-200">
                {bank.name}
              </span>
              {bank.promo && (
                <span className="absolute bottom-1 right-1.5 text-[7px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                  Taxa Vip
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Master Content Layout: Left Form + Right Vehicle Live Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (Forms & Credit Reports) */}
        <div className="lg:col-span-7 bg-neutral-950 border border-neutral-900 rounded-3xl p-6 md:p-8 space-y-6 relative">
          
          {submitted ? (
            // Success State Component
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Central Celebration Header */}
              <div className="text-center py-4 flex flex-col items-center space-y-2">
                <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="font-display font-black text-xl text-white uppercase tracking-wider">
                  Simulação Concluída por IA!
                </h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  Nosso robô de crédito processou seus dados de proponente e calculou as melhores taxas vigentes. A ficha foi integrada ao CRM RaviCar.
                </p>
              </div>

              {/* Robust AI simulation report card */}
              {aiSimulationResult && (
                <div className="p-5 md:p-6 bg-black border border-neutral-900 rounded-2xl space-y-5 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-y-[-30%] translate-x-[30%] w-40 h-40 rounded-full bg-emerald-500/5 blur-2xl"></div>

                  <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#FF2D8D] animate-spin-slow" />
                      <span className="font-display font-black text-xs uppercase tracking-wider text-white">
                        Laudo de Crédito RaviCar AI
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      aiSimulationResult.aprovado ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' : 'bg-amber-950 text-amber-400 border border-amber-900'
                    }`}>
                      {aiSimulationResult.aprovado ? 'Crédito Pré-Aprovado' : 'Requer Análise Manual'}
                    </span>
                  </div>

                  {/* Circular Score Visual Indicator & Plan Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                    
                    {/* Score Bar Panel */}
                    <div className="md:col-span-5 p-4 bg-neutral-950 border border-neutral-900 rounded-2xl flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1">
                          <Percent className="w-3 h-3 text-[#FF2D8D]" /> Score de Crédito IA
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-black text-white font-mono">{aiSimulationResult.score_aprovacao}</span>
                          <span className="text-xs text-gray-500">/ 100</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              aiSimulationResult.score_aprovacao >= 75 ? 'bg-emerald-500' :
                              aiSimulationResult.score_aprovacao >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${aiSimulationResult.score_aprovacao}%` }}
                          />
                        </div>
                        <span className="text-[8px] text-gray-500 mt-1 block">
                          {aiSimulationResult.score_aprovacao >= 75 ? 'Excelente probabilidade de aprovação instantânea.' : 'Probabilidade moderada. Requer vistoria física.'}
                        </span>
                      </div>
                    </div>

                    {/* Loan Breakdown Panel */}
                    <div className="md:col-span-7 p-4 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-[#FF6FB5] font-black flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" /> Plano Proposto ({formData.installments})
                        </span>
                        <p className="text-2xl font-black text-white font-mono">
                          R$ {aiSimulationResult.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-gray-400 font-sans font-medium">/mês</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 pt-2 border-t border-neutral-900/80">
                        <div>
                          Taxa Especial: <strong className="text-white font-mono">{aiSimulationResult.taxa_juros_mensal}% a.m.</strong>
                        </div>
                        <div>
                          Líquido Financiado: <strong className="text-white font-mono">R$ {aiSimulationResult.valor_financiado.toLocaleString('pt-BR')}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Rich Explanatory Parecer */}
                  <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-xl relative overflow-hidden">
                    <div className="absolute top-2 right-2 text-neutral-900">
                      <Sparkles className="w-6 h-6 opacity-30 animate-pulse" />
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-[#FF6FB5] font-black block mb-1">
                      Parecer Técnico da Mesa de Crédito
                    </span>
                    <p className="text-[11px] text-gray-300 leading-relaxed italic">
                      "{aiSimulationResult.parecer_ia}"
                    </p>
                  </div>

                  {/* Other Alternative suggestions */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold block">
                      Planos de Prazo Alternativo Sugeridos:
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {aiSimulationResult.planos_alternativos.map((plano, idx) => (
                        <div key={idx} className="p-2.5 bg-neutral-950 border border-neutral-900 rounded-xl text-center">
                          <span className="text-[10px] text-gray-500 font-black block">{plano.parcelas}</span>
                          <span className="text-white font-black font-mono text-[11px] block mt-0.5">
                            R$ {plano.valor_parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Physical inspection warning / human audit disclaimer */}
              <div className="p-4 bg-gradient-to-r from-neutral-950 to-neutral-900 border border-[#FF2D8D]/20 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#FF2D8D] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-display font-black text-[11px] text-white uppercase tracking-wider">Como Formalizar e Liberar o Carro?</h5>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    A simulação feita pela IA do site garante as taxas promocionais de julho de 2026. Agora, para assinar o contrato final e fazer a vistoria presencial obrigatória, clique no botão abaixo para falar com o gerente perito de plantão no WhatsApp.
                  </p>
                </div>
              </div>

              {/* Gmail dispatch alert */}
              {formData.email && (
                <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#FF2D8D]" />
                  <div className="text-[10px] text-gray-400">
                    Cópia do relatório enviada para <strong className="text-white">{formData.email}</strong>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSendWhatsapp}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition duration-200 shadow-lg cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                  Enviar Ficha de Crédito para WhatsApp
                </button>
                
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setAiSimulationResult(null);
                  }}
                  className="px-6 py-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-gray-400 hover:text-white transition duration-200 text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Fazer Nova Simulação
                </button>
              </div>

            </div>
          ) : (
            // Form Display State (STUNNINGLY BEAUTIFUL AND SHARP)
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              
              {/* Step 1: Client Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                  <div className="w-6 h-6 rounded-lg bg-[#FF2D8D]/10 text-[#FF2D8D] flex items-center justify-center font-black font-display text-xs">1</div>
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">Dados Básicos do Proponente</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">Nome Completo *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl pl-10 pr-4 py-3 text-white outline-none transition duration-200 font-sans text-xs focus:ring-1 focus:ring-[#FF2D8D]/40"
                        placeholder="Nome conforme RG/CNH"
                      />
                    </div>
                  </div>

                  {/* Whatsapp */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">WhatsApp / Celular *</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl pl-10 pr-4 py-3 text-white outline-none transition duration-200 font-sans text-xs focus:ring-1 focus:ring-[#FF2D8D]/40"
                        placeholder="Ex: (11) 99999-9999"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">E-mail (Para receber cópia no Gmail)</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl pl-10 pr-4 py-3 text-white outline-none transition duration-200 font-sans text-xs focus:ring-1 focus:ring-[#FF2D8D]/40"
                        placeholder="Ex: seu_nome@gmail.com"
                      />
                    </div>
                  </div>

                  {/* CPF */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">CPF do Titular *</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        required
                        className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl pl-10 pr-4 py-3 text-white outline-none transition duration-200 font-sans text-xs focus:ring-1 focus:ring-[#FF2D8D]/40"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  {/* Birth Date */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">Data de Nascimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="date"
                        name="birthDate"
                        value={formData.birthDate}
                        onChange={handleChange}
                        className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl pl-10 pr-4 py-3 text-white outline-none transition duration-200 font-sans text-xs focus:ring-1 focus:ring-[#FF2D8D]/40 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Car selection & Down Payment */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
                  <div className="w-6 h-6 rounded-lg bg-[#FF2D8D]/10 text-[#FF2D8D] flex items-center justify-center font-black font-display text-xs">2</div>
                  <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">Veículo de Showroom & Plano de Juros</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Vehicle */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">Veículo do Estoque para Financiar *</label>
                    <div className="relative">
                      {/* Selected Vehicle Trigger Button */}
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-black border border-neutral-800 hover:border-neutral-700 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white text-left transition duration-200 font-sans text-xs flex items-center justify-between cursor-pointer focus:ring-1 focus:ring-[#FF2D8D]/40"
                      >
                        {selectedVehicle ? (
                          <div className="flex items-center gap-3">
                            {selectedVehicle.media && selectedVehicle.media[0] && (
                              <img 
                                src={selectedVehicle.media[0].url} 
                                alt="" 
                                className="w-8 h-8 rounded-lg object-cover bg-neutral-900 shrink-0 border border-neutral-800"
                              />
                            )}
                            <div>
                              <span className="font-extrabold text-white block">
                                {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
                              </span>
                              <span className="text-[10px] text-[#FF2D8D] font-mono font-bold">
                                R$ {selectedVehicle.price.toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500 font-medium">Selecione o veículo do catálogo...</span>
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
                              {vehicles
                                .filter(v => {
                                  const term = searchTerm.toLowerCase();
                                  return (
                                    v.brand.toLowerCase().includes(term) ||
                                    v.model.toLowerCase().includes(term) ||
                                    v.year.toString().includes(term)
                                  );
                                })
                                .map(v => {
                                  const isSelected = v.id === formData.vehicleId;
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData(prev => ({ ...prev, vehicleId: v.id }));
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

                              {vehicles.filter(v => {
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

                  {/* Down payment value */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">Valor de Entrada (R$ - Opcional)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="number"
                        name="downPayment"
                        value={formData.downPayment}
                        onChange={handleChange}
                        className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl pl-10 pr-4 py-3 text-white outline-none transition duration-200 font-sans text-xs focus:ring-1 focus:ring-[#FF2D8D]/40"
                        placeholder="Ex: 25000 (Vazio para Zero Entrada)"
                      />
                    </div>
                  </div>

                  {/* Installment Term selection */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">Prazo de Pagamento Desejado</label>
                    <select
                      name="installments"
                      value={formData.installments}
                      onChange={handleChange}
                      className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition duration-200 font-sans text-xs cursor-pointer focus:ring-1 focus:ring-[#FF2D8D]/40"
                    >
                      <option value="60x">60 parcelas mensais</option>
                      <option value="48x">48 parcelas mensais</option>
                      <option value="36x">36 parcelas mensais</option>
                      <option value="24x">24 parcelas mensais</option>
                      <option value="12x">12 parcelas mensais</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Step 3: Observações */}
              <div className="space-y-2.5 pt-2">
                <label className="block font-bold text-gray-400 uppercase text-[9px] tracking-wider">Observações / Preferência de Banco (Opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full bg-black border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition duration-200 font-sans text-xs resize-none focus:ring-1 focus:ring-[#FF2D8D]/40"
                  placeholder="Ex: Possuo score bom, prefiro simular no Santander ou Banco BV..."
                />
              </div>

              {/* Master Submission CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] hover:opacity-95 text-white font-black text-xs uppercase tracking-widest shadow-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Analisando Histórico e Score com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-white" />
                    <span>Solicitar Análise de Juros RaviCar AI</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

        {/* Right Column: Selected Vehicle Detail & LIVE MATHEMATICAL ESTIMATOR (INTERACTIVE & MIND-BLOWING) */}
        <div className="lg:col-span-5 space-y-6">
          {selectedVehicle ? (
            <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-5 md:p-6 space-y-5 animate-fade-in relative overflow-hidden text-left">
              <div className="absolute right-0 top-0 translate-y-[-20%] translate-x-[20%] w-32 h-32 rounded-full bg-[#FF2D8D]/5 blur-2xl"></div>

              <div>
                <span className="text-[9px] px-2.5 py-0.5 rounded uppercase tracking-wider bg-neutral-900 text-gray-400 border border-neutral-800 font-black">
                  Carro Selecionado
                </span>
                <h3 className="font-display font-black text-white text-lg mt-2 leading-tight">
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Showroom Oficial RaviCar Motors</p>
              </div>

              {/* Image Preview with overlay badge */}
              {selectedVehicle.media && selectedVehicle.media[0] && (
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-neutral-900 group">
                  <img 
                    src={selectedVehicle.media[0].url} 
                    alt={selectedVehicle.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md border border-neutral-800/80 px-2.5 py-1 rounded-xl">
                    <span className="text-[10px] text-[#FF2D8D] font-mono font-black">
                      R$ {selectedVehicle.price.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}

              {/* Fast Spec Icons Grid */}
              <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400">
                <div className="p-2 bg-black border border-neutral-900 rounded-xl flex flex-col justify-center text-center">
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Ano/Mod</span>
                  <span className="text-white font-bold font-mono mt-0.5">{selectedVehicle.year}</span>
                </div>
                <div className="p-2 bg-black border border-neutral-900 rounded-xl flex flex-col justify-center text-center">
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Câmbio</span>
                  <span className="text-white font-bold truncate mt-0.5">{selectedVehicle.transmission}</span>
                </div>
                <div className="p-2 bg-black border border-neutral-900 rounded-xl flex flex-col justify-center text-center">
                  <span className="text-[8px] text-gray-500 font-bold uppercase">Km Rodados</span>
                  <span className="text-white font-bold font-mono mt-0.5">{selectedVehicle.mileage.toLocaleString('pt-BR')} km</span>
                </div>
              </div>

              {/* Live Calculator Feedback Box */}
              {liveCalculation && (
                <div className="p-4 bg-black border border-neutral-800 rounded-2xl space-y-4">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-neutral-900">
                    <TrendingUp className="w-4 h-4 text-[#FF2D8D] shrink-0" />
                    <span className="text-[10px] uppercase font-black text-white tracking-wider">
                      Simulador ao Vivo (Antes de Enviar)
                    </span>
                  </div>

                  {liveCalculation.isDownPaymentTooHigh ? (
                    <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl flex items-start gap-2 text-rose-400 text-[10px] leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>O valor da sua entrada digitada excede ou se iguala ao preço total do veículo (R$ {selectedVehicle.price.toLocaleString('pt-BR')}). Se deseja comprar à vista ou com entrada total, entre em contato via WhatsApp!</span>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {/* Financial Balances Info */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                        <div>
                          Entrada: <strong className="text-white font-mono">R$ {liveCalculation.downPayment.toLocaleString('pt-BR')}</strong>
                        </div>
                        <div>
                          Saldo a Financiar: <strong className="text-white font-mono">R$ {liveCalculation.balanceToFinance.toLocaleString('pt-BR')}</strong>
                        </div>
                      </div>

                      {/* Prime Installment Display */}
                      <div className="text-center bg-neutral-950/40 p-3 rounded-xl border border-neutral-900">
                        <span className="text-[9px] text-gray-500 font-bold uppercase block">Parcela Estimada no Banco</span>
                        <p className="font-display font-black text-2xl text-[#FF2D8D] font-mono leading-none mt-1">
                          R$ {liveCalculation.estimatedPMT.toLocaleString('pt-BR')} <span className="text-[10px] font-sans font-medium text-gray-400">/mês</span>
                        </p>
                        <span className="text-[8px] text-gray-500 font-medium block mt-1.5">
                          Calculado em {liveCalculation.term} com taxa estimada de {liveCalculation.rate}% a.m.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fast Assurance badge */}
              <div className="p-3 bg-[#111111] rounded-xl border border-neutral-900 flex items-center gap-2.5 text-left">
                <ShieldCheck className="w-4 h-4 text-[#FF2D8D] shrink-0" />
                <span className="text-[9px] text-gray-400 leading-normal">
                  Suas informações estão criptografadas e protegidas segundo a LGPD. Sem consultas abusivas.
                </span>
              </div>

            </div>
          ) : (
            // Empty Dream State Selection Placeholder
            <div className="bg-neutral-950 border border-neutral-900 border-dashed rounded-3xl p-8 text-center h-full flex flex-col items-center justify-center space-y-4 py-16 text-left">
              <div className="w-14 h-14 rounded-2xl bg-black border border-neutral-900 flex items-center justify-center text-gray-600">
                <Landmark className="w-7 h-7 text-gray-500" />
              </div>
              <div className="space-y-1 max-w-sm text-center">
                <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider">Aguardando Seleção de Veículo</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Selecione um carro no formulário ao lado para carregar a ficha técnica completa e ver a projeção matemática de parcelas atualizada em tempo real!
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
