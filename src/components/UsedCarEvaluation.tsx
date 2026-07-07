import React, { useState, useEffect } from 'react';
import { Car, Send, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
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
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'Avaliação',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: `Avaliação de Usado: ${formData.brand} ${formData.model} (${formData.year}) - ${formData.km} KM. Cor: ${formData.color}. Obs: ${formData.notes}`,
          details: {
            tradeVehicleBrand: formData.brand,
            tradeVehicleModel: formData.model,
            tradeVehicleYear: formData.year,
            tradeVehicleKm: formData.km,
            tradeVehicleColor: formData.color,
          },
        }),
      });

      if (response.ok) {
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
    const text = `Olá RaviCar! Enviei uma solicitação de avaliação do meu veículo usado pelo site:
*Nome:* ${formData.name}
*Telefone:* ${formData.phone}
*Meu Veículo:* ${formData.brand} ${formData.model}
*Ano:* ${formData.year}
*KM:* ${formData.km}
*Cor:* ${formData.color}
*Observações:* ${formData.notes}

Gostaria de agendar uma avaliação presencial ou receber uma estimativa.`;

    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#FF2D8D]/10 text-[#FF2D8D]">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl md:text-2xl text-white">Avalie seu Veículo Usado</h2>
            <p className="text-xs text-gray-500">Insira as informações do seu carro para receber uma oferta de compra ou troca justa.</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-10 flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-white">Dados Recebidos!</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                Nossa equipe de avaliadores vai analisar a tabela FIPE e o mercado do seu {formData.brand} {formData.model} para lhe retornar com a melhor avaliação possível.
              </p>
            </div>

            {formData.email && (
              <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-left flex items-start gap-3 max-w-md">
                <div className="p-2 bg-[#FF2D8D]/10 text-[#FF2D8D] rounded-lg mt-0.5 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Confirmação enviada ao Gmail!</p>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Uma confirmação detalhada com dicas para valorizar o seu veículo na vistoria foi enviada para o seu Gmail: <strong className="text-white">{formData.email}</strong>.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleSendWhatsapp}
              className="w-full max-w-md flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition shadow-lg cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
              Agilizar Avaliação por WhatsApp
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            
            {/* Seção 1: Dados de Contato */}
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] mb-4">1. Seus Dados de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Seu Nome Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">WhatsApp / Telefone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold text-gray-400 mb-1.5">Seu E-mail (Opcional - Para receber no Gmail)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: joao_silva@gmail.com"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Dados do Veículo */}
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] mb-4">2. Informações do Veículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Marca *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: Toyota, Honda, Ford"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Modelo *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: Corolla XEi, Civic LXR"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Ano de Fabricação/Modelo</label>
                  <input
                    type="text"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: 2018/2019"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Quilometragem (KM)</label>
                  <input
                    type="text"
                    name="km"
                    value={formData.km}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: 68.000"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Cor do Veículo</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: Prata, Preto"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-400 mb-1.5">Opcionais, Acessórios ou Estado de Conservação</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition resize-none"
                placeholder="Ex: Único dono, revisões em concessionária, possui teto solar, pequenos detalhes no para-choque..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] text-white font-bold uppercase tracking-wider transition hover:glow-pink flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Enviando informações...' : 'Solicitar Pré-Avaliação'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
