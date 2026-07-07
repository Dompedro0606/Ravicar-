import React, { useState, useEffect } from 'react';
import { Landmark, Send, CheckCircle2, MessageCircle, Mail } from 'lucide-react';
import { Vehicle, SiteSettings, UserProfile } from '../types';

interface FinancingRequestProps {
  settings: SiteSettings;
  vehicles: Vehicle[];
  preselectedVehicleId?: string;
  currentUser?: UserProfile | null;
}

export function FinancingRequest({ settings, vehicles, preselectedVehicleId, currentUser }: FinancingRequestProps) {
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

  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.cpf || !formData.vehicleId) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Telefone, CPF e Veículo de Interesse).');
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
          type: 'Financiamento',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          vehicleId: formData.vehicleId,
          vehicleName: selectedVehicle ? selectedVehicle.title : 'Geral',
          message: `Solicitação de Financiamento para o veículo ${selectedVehicle ? selectedVehicle.title : 'Não especificado'}. Entrada: R$ ${formData.downPayment || '0'}. Parcelas: ${formData.installments}. CPF: ${formData.cpf}. Data de Nascimento: ${formData.birthDate}. Obs: ${formData.notes}`,
          details: {
            cpf: formData.cpf,
            birthDate: formData.birthDate,
            downPayment: formData.downPayment,
          },
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errData = await response.json();
        alert(`Erro: ${errData.error || 'Não foi possível registrar a proposta.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsapp = () => {
    const carName = selectedVehicle ? `${selectedVehicle.title} (R$ ${selectedVehicle.price.toLocaleString('pt-BR')})` : 'um veículo do estoque';
    const text = `Olá RaviCar! Acabei de enviar uma proposta de simulação de financiamento pelo site:
*Nome:* ${formData.name}
*Telefone:* ${formData.phone}
*CPF:* ${formData.cpf}
*Veículo:* ${carName}
*Valor de Entrada:* R$ ${formData.downPayment}
*Parcelas desejadas:* ${formData.installments}

Por favor, simule com as melhores financeiras e me envie os valores das parcelas!`;

    const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
    const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;

    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Finance Companies Banner */}
      <div className="mb-8 p-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl animate-fade-in">
        <h3 className="text-center font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] mb-3">
          Trabalhamos com mais de 13 Financeiras Parceiras
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 items-center opacity-60 text-center font-bold text-gray-500 text-[10px] md:text-xs">
          <span className="p-1 bg-black rounded">Santander</span>
          <span className="p-1 bg-black rounded">Itaú</span>
          <span className="p-1 bg-black rounded">Bradesco</span>
          <span className="p-1 bg-black rounded">BV Financeira</span>
          <span className="p-1 bg-black rounded">Banco PAN</span>
          <span className="p-1 bg-black rounded">Safra</span>
          <span className="p-1 bg-black rounded">C6 Bank</span>
          <span className="p-1 bg-black rounded">Porto Seguro</span>
          <span className="p-1 bg-black rounded">Creditas</span>
          <span className="p-1 bg-black rounded">Mercado Livre</span>
          <span className="p-1 bg-black rounded">Omni</span>
          <span className="p-1 bg-black rounded">Daycoval</span>
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-[#FF2D8D]/10 text-[#FF2D8D]">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-black text-xl md:text-2xl text-white">Simulador de Financiamento</h2>
            <p className="text-xs text-gray-500">Envie seus dados para uma análise de crédito instantânea e sem compromisso.</p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-10 flex flex-col items-center space-y-4">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-bold text-lg text-white">Simulação Recebida!</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                Nossa equipe de consultores vai repassar sua ficha de crédito nas 13 financeiras parceiras para encontrar a menor parcela para você.
              </p>
            </div>

            {formData.email && (
              <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-left flex items-start gap-3 max-w-md">
                <div className="p-2 bg-[#FF2D8D]/10 text-[#FF2D8D] rounded-lg mt-0.5 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Comprovante enviado ao seu Gmail!</p>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Uma cópia da simulação e detalhes dos parcelamentos foi disparada diretamente para o seu Gmail: <strong className="text-white">{formData.email}</strong>.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handleSendWhatsapp}
              className="w-full max-w-md flex items-center justify-center gap-2 py-3.5 bg-[#25D366] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 transition shadow-lg cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-[#25D366]" />
              Chamar no WhatsApp para Aprovação Imediata
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            
            {/* Dados Pessoais */}
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] mb-4">1. Dados do Proponente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Nome Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Celular / WhatsApp *</label>
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
                  <label className="block font-semibold text-gray-400 mb-1.5">E-mail (Opcional - Para receber no Gmail)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: seu_email@gmail.com"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">CPF do Titular *</label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Data de Nascimento</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Veículo */}
            <div className="border-b border-neutral-900 pb-4">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-[#FF6FB5] mb-4">2. Plano Desejado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Veículo de Interesse *</label>
                  <select
                    name="vehicleId"
                    value={formData.vehicleId}
                    onChange={handleChange}
                    required
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                  >
                    <option value="">Selecione o carro para simular</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.year}) - R$ {v.price.toLocaleString('pt-BR')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Valor de Entrada (R$)</label>
                  <input
                    type="number"
                    name="downPayment"
                    value={formData.downPayment}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                    placeholder="Ex: 20000"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-400 mb-1.5">Número de Parcelas</label>
                  <select
                    name="installments"
                    value={formData.installments}
                    onChange={handleChange}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition"
                  >
                    <option value="60x">60 parcelas</option>
                    <option value="48x">48 parcelas</option>
                    <option value="36x">36 parcelas</option>
                    <option value="24x">24 parcelas</option>
                    <option value="12x">12 parcelas</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-400 mb-1.5">Observações ou Dúvidas</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-[#FF2D8D] rounded-xl px-4 py-3 text-white outline-none transition resize-none"
                placeholder="Ex: Tenho pressa na simulação, prefiro parcela mais longa ou menor taxa..."
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] text-white font-bold uppercase tracking-wider transition hover:glow-pink flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Analisando ficha...' : 'Enviar Dados para Análise'}
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
