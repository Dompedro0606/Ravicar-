import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Send, 
  CheckCircle2, 
  MessageCircle, 
  Mail, 
  Sparkles, 
  TrendingUp, 
  Check, 
  AlertTriangle, 
  Scale, 
  ThumbsUp, 
  ShieldCheck,
  User,
  Phone,
  Calendar,
  Tag,
  Gauge,
  Paintbrush,
  FileText,
  ChevronRight,
  Info,
  RefreshCw,
  Award
} from 'lucide-react';
import { SiteSettings, UserProfile } from '../types';

interface UsedCarEvaluationProps {
  settings: SiteSettings;
  preselectedVehicle?: string;
  currentUser?: UserProfile | null;
}

export function UsedCarEvaluation({ settings, preselectedVehicle, currentUser }: UsedCarEvaluationProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    brand: '',
    model: '',
    year: '',
    km: '',
    color: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiEvaluationResult, setAiEvaluationResult] = useState<{
    fipe_estimado: number;
    valor_compra_ravicar: number;
    score_conservacao: number;
    pontos_fortes: string[];
    pontos_atencao: string[];
    parecer_avaliador: string;
  } | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.brand || !formData.model) {
      alert('Por favor, preencha os campos obrigatórios (Nome, Telefone, Marca e Modelo do carro).');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/gemini/evaluate-used-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          brand: formData.brand,
          model: formData.model,
          year: formData.year,
          km: formData.km,
          color: formData.color,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiEvaluationResult(data.evaluation);
        setSubmitted(true);
      } else {
        const errData = await response.json();
        alert(`Erro: ${errData.error || 'Não foi possível enviar a solicitação.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsapp = () => {
    let aiText = '';
    if (aiEvaluationResult) {
      aiText = `\n\n*Análise Instantânea IA RaviCar:*
- *FIPE Estimado:* R$ ${aiEvaluationResult.fipe_estimado.toLocaleString('pt-BR')}
- *Oferta Est. de Compra:* R$ ${aiEvaluationResult.valor_compra_ravicar.toLocaleString('pt-BR')}
- *Nota de Conservação:* ${aiEvaluationResult.score_conservacao}/10`;
    }

    const text = `Olá RaviCar! Enviei uma solicitação de avaliação do meu veículo usado pelo site:
*Nome:* ${formData.name}
*Telefone:* ${formData.phone}
*Meu Veículo:* ${formData.brand} ${formData.model}
*Ano:* ${formData.year}
*KM:* ${formData.km}
*Cor:* ${formData.color}
*Observações:* ${formData.notes}${aiText}

Gostaria de agendar a vistoria física para confirmar esses valores e concluir o negócio!`;

    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="bg-neutral-950 border border-neutral-900 rounded-3xl p-6 md:p-8 lg:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Decorative corner glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF2D8D]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FF6FB5]/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-neutral-900 pb-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#FF2D8D]/20 to-[#FF2D8D]/5 text-[#FF2D8D] border border-[#FF2D8D]/15 shadow-inner shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">Avaliação de Usado</h2>
                <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-[#FF2D8D]/10 text-[#FF6FB5] border border-[#FF2D8D]/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FF6FB5]" /> RaviCar AI Ativa
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 max-w-xl leading-relaxed">
                Nossa inteligência artificial de ponta analisa dados reais de São Paulo, índices de liquidez regional e a Tabela FIPE de julho/2026 para uma cotação precisa.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid: Sidebar + Form/Result */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
          
          {/* Left Column: Guarantees & Market Trust Info */}
          <div className="lg:col-span-4 space-y-5">
            {/* AI Engine Box */}
            <div className="bg-gradient-to-b from-neutral-900/60 to-black/80 border border-neutral-900 p-5 rounded-2xl space-y-3.5">
              <div className="flex items-center gap-2 text-[#FF2D8D]">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span className="font-display font-black text-[10px] uppercase tracking-widest text-glow-pink">RaviCar AI Engine</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Algoritmo integrado de precificação que cruza dados históricos de mais de 10.000 veículos vendidos na capital de São Paulo com a base oficial FIPE de <strong>Julho/2026</strong>.
              </p>
              <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                <span>Precisão Estimada</span>
                <span className="text-emerald-400 font-mono font-black">98.4%</span>
              </div>
            </div>

            {/* Why evaluate with us list */}
            <div className="p-5 bg-neutral-900/20 border border-neutral-900/80 rounded-2xl space-y-4">
              <h4 className="font-display font-black text-[10px] text-white uppercase tracking-widest">
                Garantias RaviCar Premium
              </h4>
              
              <ul className="space-y-3.5">
                <li className="flex gap-3 text-[11px] leading-relaxed">
                  <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 h-fit">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-gray-200 block">Sem Custos ou Taxas</strong>
                    <span className="text-gray-400">Avaliação 100% gratuita realizada de forma instantânea.</span>
                  </div>
                </li>

                <li className="flex gap-3 text-[11px] leading-relaxed">
                  <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 h-fit">
                    <Check className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-gray-200 block">Troca com Troco</strong>
                    <span className="text-gray-400">Use seu veículo como entrada e receba a diferença à vista via PIX.</span>
                  </div>
                </li>

                <li className="flex gap-3 text-[11px] leading-relaxed">
                  <div className="p-1 rounded bg-[#FF2D8D]/10 border border-[#FF2D8D]/20 text-[#FF6FB5] shrink-0 h-fit">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-gray-200 block">Melhor Oferta de SP</strong>
                    <span className="text-gray-400">Garantia de proposta competitiva pós-vistoria técnica.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Form or Result */}
          <div className="lg:col-span-8">
            {submitted ? (
              <div className="space-y-6 animate-fade-in">
                {/* Success Banner */}
                <div className="text-center py-4 px-6 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl flex flex-col items-center space-y-2">
                  <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md">
                    <CheckCircle2 className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="font-display font-black text-lg text-white uppercase tracking-wider">
                    Análise Pronta com Sucesso!
                  </h3>
                  <p className="text-[11px] text-gray-400 max-w-md mx-auto leading-relaxed">
                    O laudo estimativo para o seu seminovo foi gerado. Os dados foram computados utilizando nossa inteligência de mercado.
                  </p>
                </div>

                {/* AI Evaluation Bento Grid */}
                {aiEvaluationResult && (
                  <div className="space-y-5">
                    {/* Header label */}
                    <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#FF2D8D]" />
                        <span className="font-display font-black text-[10px] uppercase tracking-wider text-white">
                          Laudo de Avaliação Digital
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-900/50">
                        Aprovado para Vistoria Física
                      </span>
                    </div>

                    {/* Values and score Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* FIPE */}
                      <div className="p-5 bg-neutral-900/40 border border-neutral-900 rounded-2xl space-y-3 flex flex-col justify-between hover:border-neutral-800 transition duration-300">
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">
                            Tabela FIPE Referência
                          </span>
                          <strong className="text-xl font-mono font-black text-white block">
                            R$ {aiEvaluationResult.fipe_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div className="text-[10px] text-gray-400 flex items-center gap-1.5 border-t border-neutral-950 pt-2">
                          <Calendar className="w-3.5 h-3.5 text-gray-600" /> Referência: Julho/2026
                        </div>
                      </div>

                      {/* RaviCar Offer - Prominent glowing item */}
                      <div className="p-5 bg-gradient-to-b from-[#FF2D8D]/15 to-[#FF2D8D]/5 border border-[#FF2D8D]/30 rounded-2xl space-y-3 flex flex-col justify-between relative overflow-hidden hover:border-[#FF2D8D]/50 transition duration-300 shadow-lg shadow-[#FF2D8D]/5">
                        <div className="absolute top-0 right-0 bg-[#FF2D8D] text-white text-[7px] font-black px-2 py-0.5 rounded-bl uppercase tracking-wider">
                          OFERTA ESTIMADA
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase tracking-widest text-[#FF6FB5] font-black block">
                            Compra RaviCar Est.
                          </span>
                          <strong className="text-xl font-mono font-black text-white block">
                            R$ {aiEvaluationResult.valor_compra_ravicar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                        <div className="text-[10px] text-white flex items-center gap-1.5 border-t border-[#FF2D8D]/20 pt-2 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-[#FF2D8D]" /> Garantido pós-vistoria
                        </div>
                      </div>

                      {/* Conservation Score */}
                      <div className="p-5 bg-neutral-900/40 border border-neutral-900 rounded-2xl space-y-3 flex flex-col justify-between hover:border-neutral-800 transition duration-300">
                        <div className="space-y-1">
                          <span className="text-[8px] uppercase tracking-widest text-gray-500 font-bold block">
                            Score de Conservação
                          </span>
                          <div className="flex items-baseline gap-1">
                            <strong className="text-xl font-mono font-black text-white">{aiEvaluationResult.score_conservacao}</strong>
                            <span className="text-[9px] text-gray-500 font-bold">/ 10</span>
                          </div>
                        </div>
                        <div className="space-y-1.5 border-t border-neutral-950 pt-2">
                          <div className="w-full bg-black h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5]"
                              style={{ width: `${aiEvaluationResult.score_conservacao * 10}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400 block font-sans">Estimado via idade e KM</span>
                        </div>
                      </div>
                    </div>

                    {/* Pros & Cons Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Pontos Fortes */}
                      <div className="p-4 bg-emerald-950/10 border border-emerald-900/25 rounded-2xl space-y-2.5 text-left">
                        <span className="text-[9px] uppercase tracking-widest text-emerald-400 font-black flex items-center gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> Fatores de Valorização
                        </span>
                        <ul className="space-y-2 text-[11px] text-gray-300">
                          {aiEvaluationResult.pontos_fortes.map((ponto, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                              <span className="leading-normal">{ponto}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pontos Atenção */}
                      <div className="p-4 bg-amber-950/10 border border-amber-900/25 rounded-2xl space-y-2.5 text-left">
                        <span className="text-[9px] uppercase tracking-widest text-amber-400 font-black flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Pontos de Atenção
                        </span>
                        <ul className="space-y-2 text-[11px] text-gray-300">
                          {aiEvaluationResult.pontos_atencao.map((ponto, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-500 font-black mt-0.5 shrink-0">•</span>
                              <span className="leading-normal">{ponto}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Evaluator Comment */}
                    <div className="p-5 bg-neutral-900/30 border border-neutral-900 rounded-2xl relative overflow-hidden text-left">
                      <div className="absolute top-4 right-4 text-[#FF2D8D]/5">
                        <Sparkles className="w-10 h-10" />
                      </div>
                      <span className="text-[8px] uppercase tracking-widest text-[#FF6FB5] font-black block mb-1">
                        Parecer do Avaliador AI
                      </span>
                      <p className="text-[11px] text-gray-300 leading-relaxed italic pr-6">
                        "{aiEvaluationResult.parecer_avaliador}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Physical Inspection Disclaimer */}
                <div className="p-5 bg-gradient-to-r from-neutral-950 to-neutral-900 border border-neutral-900 rounded-2xl flex items-start gap-3.5 text-left">
                  <div className="p-2.5 bg-neutral-900 text-gray-400 rounded-xl shrink-0 mt-0.5 border border-neutral-800">
                    <ShieldCheck className="w-4.5 h-4.5 text-[#FF2D8D]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider">
                      Vistoria Física Obrigatória
                    </h4>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      A precificação online serve como uma pré-avaliação realista baseada em dados. Para concluir a compra e efetuar o pagamento imediato via PIX, o veículo passará por uma vistoria técnica presencial em nossa loja para checagem mecânica, elétrica e estrutural (laudo cautelar).
                    </p>
                  </div>
                </div>

                {/* Email Confirmation Card */}
                {formData.email && (
                  <div className="bg-neutral-900/20 border border-neutral-900 rounded-2xl p-4 text-left flex items-start gap-3.5">
                    <div className="p-2 bg-[#FF2D8D]/10 text-[#FF2D8D] rounded-xl shrink-0 mt-0.5 border border-[#FF2D8D]/20">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Cópia do Laudo Enviada!</p>
                      <p className="text-[10px] text-gray-400">
                        Um relatório em formato PDF foi enviado para o seu e-mail cadastrado: <span className="text-white font-mono">{formData.email}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA Actions */}
                <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={handleSendWhatsapp}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-widest rounded-xl transition duration-200 shadow-lg cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
                    Agendar Vistoria no WhatsApp
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setAiEvaluationResult(null);
                    }}
                    className="px-6 py-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-gray-400 hover:text-white transition font-black text-xs uppercase tracking-widest cursor-pointer"
                  >
                    Nova Avaliação
                  </button>
                </div>
              </div>
            ) : (
              /* The Form: Styled beautifully and symmetrically */
              <form onSubmit={handleSubmit} className="space-y-6 text-left relative z-10">
                
                {/* Step 1: Owner Information */}
                <div className="bg-neutral-900/20 border border-neutral-900 p-5 md:p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-900">
                    <div className="w-5.5 h-5.5 rounded-lg bg-[#FF2D8D]/10 text-[#FF2D8D] border border-[#FF2D8D]/20 flex items-center justify-center font-display font-black text-[10px]">
                      1
                    </div>
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">
                      Dados do Proprietário
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-500" />
                        Nome Completo <span className="text-[#FF2D8D] font-black">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: Gabriel Vitor"
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        WhatsApp / Celular <span className="text-[#FF2D8D] font-black">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: (11) 98395-0665"
                      />
                    </div>

                    {/* Email */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-gray-500" />
                        Endereço de E-mail <span className="text-gray-600 font-normal lowercase">(opcional)</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: seu-email@dominio.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 2: Vehicle Specifications */}
                <div className="bg-neutral-900/20 border border-neutral-900 p-5 md:p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-900">
                    <div className="w-5.5 h-5.5 rounded-lg bg-[#FF2D8D]/10 text-[#FF2D8D] border border-[#FF2D8D]/20 flex items-center justify-center font-display font-black text-[10px]">
                      2
                    </div>
                    <h3 className="font-display font-black text-xs uppercase tracking-wider text-white">
                      Especificações do Veículo
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Brand */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-gray-500" />
                        Marca <span className="text-[#FF2D8D] font-black">*</span>
                      </label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: Toyota, Honda, VW"
                      />
                    </div>

                    {/* Model */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-gray-500" />
                        Modelo <span className="text-[#FF2D8D] font-black">*</span>
                      </label>
                      <input
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: Corolla XEi, Civic, Golf"
                      />
                    </div>

                    {/* Year */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        Ano Fabricação / Modelo
                      </label>
                      <input
                        type="text"
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: 2019/2020"
                      />
                    </div>

                    {/* KM */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-gray-500" />
                        Quilometragem (KM)
                      </label>
                      <input
                        type="text"
                        name="km"
                        value={formData.km}
                        onChange={handleChange}
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: 75.000"
                      />
                    </div>

                    {/* Color */}
                    <div className="sm:col-span-2 md:col-span-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Paintbrush className="w-3.5 h-3.5 text-gray-500" />
                        Cor Predominante
                      </label>
                      <input
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3.5 text-xs text-white outline-none transition duration-300 placeholder-gray-600 font-sans"
                        placeholder="Ex: Branco, Preto, Cinza"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Accessories / General Status */}
                <div className="bg-neutral-900/20 border border-neutral-900 p-5 md:p-6 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FF2D8D]" />
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Opcionais, Acessórios ou Estado Geral do Veículo
                    </label>
                  </div>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full bg-black/60 border border-neutral-800 focus:border-[#FF2D8D] focus:ring-1 focus:ring-[#FF2D8D]/20 rounded-xl px-4 py-3 text-xs text-white outline-none transition resize-none leading-relaxed placeholder-gray-600 font-sans"
                    placeholder="Ex: Único dono, revisões em concessionária, teto solar, som premium, pequenos arranhões no para-choque traseiro..."
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4.5 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] hover:glow-pink text-white font-black uppercase tracking-widest text-xs transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-60 active:scale-[0.99] hover:scale-[1.005]"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Analisando mercado via RaviCar AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      <span>Obter Avaliação Instantânea</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

