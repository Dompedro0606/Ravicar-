import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Send, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
import { Vehicle, SiteSettings, UserProfile } from '../types';

interface VisitBookingProps {
  settings: SiteSettings;
  vehicles: Vehicle[];
  preselectedVehicleId?: string;
  onSuccess?: () => void;
  currentUser?: UserProfile | null;
}

export function VisitBooking({ settings, vehicles, preselectedVehicleId, onSuccess, currentUser }: VisitBookingProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    visitDate: '',
    visitTime: '',
    vehicleId: preselectedVehicleId || '',
    message: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.visitDate || !formData.visitTime) {
      alert('Por favor, preencha os campos obrigatórios (Nome, Telefone, Data e Horário).');
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
          type: 'Agendamento',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          vehicleId: formData.vehicleId || null,
          vehicleName: selectedVehicle ? selectedVehicle.title : 'Geral',
          message: `Agendamento de Visita / Test Drive. Data: ${formData.visitDate}. Horário: ${formData.visitTime}. Veículo: ${selectedVehicle ? selectedVehicle.title : 'Visita Geral'}. Mensagem: ${formData.message}`,
          details: {
            visitDate: formData.visitDate,
            visitTime: formData.visitTime,
          },
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        if (onSuccess) onSuccess();
      } else {
        const errData = await response.json();
        alert(`Erro: ${errData.error || 'Não foi possível agendar a visita.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsapp = () => {
    const carInfo = selectedVehicle ? `para ver o veículo *${selectedVehicle.title}*` : 'para conhecer o showroom';
    const text = `Olá RaviCar! Gostaria de confirmar um agendamento de visita/test drive que fiz no site:
*Nome:* ${formData.name}
*Telefone:* ${formData.phone}
*Data:* ${formData.visitDate}
*Horário:* ${formData.visitTime}
*Interesse:* Visita ${carInfo}

Estou livre neste horário!`;

    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 shadow-xl max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[#FF2D8D]/10 text-[#FF2D8D]">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-lg text-white">Agende sua Visita</h2>
          <p className="text-xs text-gray-500">Agende um test drive ou venha ver o veículo de perto.</p>
        </div>
      </div>

      {submitted ? (
        <div className="text-center py-6 flex flex-col items-center space-y-4">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-base text-white">Agendamento Solicitado!</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              Sua solicitação de visita no dia {new Date(formData.visitDate).toLocaleDateString('pt-BR')} às {formData.visitTime} foi encaminhada para a nossa equipe.
            </p>
          </div>

          {formData.email && (
            <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-left flex items-start gap-3">
              <div className="p-2 bg-[#FF2D8D]/10 text-[#FF2D8D] rounded-lg mt-0.5 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Notificação Enviada ao Gmail!</p>
                <p className="text-[10px] text-gray-400 leading-normal">
                  Uma cópia detalhada deste agendamento foi disparada para o seu Gmail: <strong className="text-white">{formData.email}</strong>.
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleSendWhatsapp}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
            Confirmar e Chamar no WhatsApp
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-400 mb-1">Seu Nome *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3.5 py-2.5 text-white outline-none transition"
                placeholder="Ex: João da Silva"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-400 mb-1">Seu WhatsApp / Celular *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3.5 py-2.5 text-white outline-none transition"
                placeholder="Ex: (11) 99999-9999"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-400 mb-1">Seu E-mail (Opcional - Para receber no Gmail)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3.5 py-2.5 text-white outline-none transition"
                placeholder="Ex: joao@gmail.com"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-400 mb-1">Data da Visita *</label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3.5 py-2.5 text-white outline-none transition"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-400 mb-1">Horário Desejado *</label>
              <input
                type="time"
                name="visitTime"
                value={formData.visitTime}
                onChange={handleChange}
                required
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3.5 py-2.5 text-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-400 mb-1">Escolher Veículo (Opcional)</label>
            <select
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleChange}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3.5 py-2.5 text-white outline-none transition"
            >
              <option value="">Apenas conhecer a loja (Visita Geral)</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} - R$ {v.price.toLocaleString('pt-BR')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-400 mb-1">Mensagem ou Observação</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-3.5 py-2.5 text-white outline-none transition resize-none"
              placeholder="Ex: Gostaria de simular troca com meu carro usado..."
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] text-white font-bold uppercase tracking-wider transition hover:glow-pink flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? 'Reservando...' : 'Solicitar Agendamento'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
