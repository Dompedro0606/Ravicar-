import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Lock, Heart, ClipboardList, CheckCircle, Clock, Save, Eye, Trash2, Calendar, CreditCard, DollarSign, Car, MessageSquare } from 'lucide-react';
import { UserProfile, Vehicle, LeadMessage, SiteSettings } from '../types';

interface ClientPortalProps {
  currentUser: UserProfile;
  token: string;
  vehicles: Vehicle[];
  settings: SiteSettings;
  onUpdateCurrentUser: (user: UserProfile) => void;
  onNavigate: (page: string, vehicleId?: string) => void;
}

export function ClientPortal({ currentUser, token, vehicles, settings, onUpdateCurrentUser, onNavigate }: ClientPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'favorites' | 'requests'>('favorites');
  
  // Profile Form State
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Client Leads State
  const [leads, setLeads] = useState<LeadMessage[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load client favorites and leads
  useEffect(() => {
    // 1. Favorites from localStorage
    const savedFavs = localStorage.getItem(`ravicar_favs_${currentUser.id}`);
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Leads from Backend
    const fetchLeads = async () => {
      setLoadingLeads(true);
      try {
        const res = await fetch('/api/leads/client', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          // Sort leads by date descending
          data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setLeads(data);
        }
      } catch (e) {
        console.error('Error fetching client leads:', e);
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchLeads();
  }, [currentUser.id, token]);

  // Remove Favorite
  const handleRemoveFavorite = (vehicleId: string) => {
    const updatedFavs = favorites.filter(id => id !== vehicleId);
    setFavorites(updatedFavs);
    localStorage.setItem(`ravicar_favs_${currentUser.id}`, JSON.stringify(updatedFavs));
    
    // Also update global event to keep layout sync
    window.dispatchEvent(new Event('favorites-updated'));
  };

  // Update Profile Submit
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          ...(password ? { password } : {})
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        onUpdateCurrentUser(updatedUser);
        setProfileSuccess(true);
        setPassword('');
        setTimeout(() => setProfileSuccess(false), 4000);
      } else {
        const err = await res.json();
        setProfileError(err.error || 'Erro ao atualizar dados.');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Erro de conexão com o servidor.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Find vehicles marked as favorite
  const favoriteVehicles = vehicles.filter(v => favorites.includes(v.id));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF2D8D] uppercase tracking-widest">Painel de Relacionamento</span>
          <h2 className="font-display font-black text-2xl md:text-3xl text-gray-900 dark:text-white mt-1">
            Olá, {currentUser.name}!
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">
            Seja bem-vindo à sua Área Exclusiva RaviCar. Acompanhe seus veículos salvos, vistorias e simulações.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl p-4 w-full md:w-auto">
          <div className="p-2.5 bg-[#FF2D8D]/10 text-[#FF2D8D] rounded-full">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white">Status da Conta</p>
            <p className="text-[10px] text-[#FF6FB5] font-semibold uppercase tracking-wider mt-0.5">Cliente Verificado RaviCar</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: MEUS DADOS */}
        <div className="lg:col-span-4 p-5 md:p-6 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-3xl space-y-6">
          <div>
            <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-[#FF2D8D]" /> Meus Dados Cadastrais
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 mt-1">Mantenha seu cadastro atualizado para agilizar os contatos comerciais.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            {profileSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 rounded-xl font-bold">
                ✓ Seus dados foram atualizados com sucesso!
              </div>
            )}
            
            {profileError && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 rounded-xl font-bold">
                ⚠️ {profileError}
              </div>
            )}

            <div>
              <label className="block text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1 font-semibold">Nome Completo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 dark:text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1 font-semibold">WhatsApp / Celular</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1 font-semibold">E-mail Principal</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 dark:text-gray-400 dark:text-gray-400 mb-1 font-semibold">Alterar Senha (Opcional)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 dark:text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Deixe em branco para manter a atual"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl pl-9 pr-3.5 py-2.5 text-gray-900 dark:text-white placeholder-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-3 bg-[#FF2D8D] text-white hover:bg-[#FF6FB5] transition font-bold rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Salvando...' : 'Atualizar Meus Dados'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: TABS (FAVORITOS & SOLICITAÇÕES) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-gray-200 dark:border-neutral-900">
            <button
              onClick={() => setActiveSubTab('favorites')}
              className={`pb-3.5 px-6 font-display font-extrabold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${activeSubTab === 'favorites' ? 'text-[#FF2D8D] border-[#FF2D8D]' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400 border-transparent hover:text-gray-700 dark:text-gray-300'}`}
            >
              <Heart className={`w-4 h-4 ${activeSubTab === 'favorites' ? 'fill-[#FF2D8D]' : ''}`} />
              Meus Favoritos ({favoriteVehicles.length})
            </button>
            <button
              onClick={() => setActiveSubTab('requests')}
              className={`pb-3.5 px-6 font-display font-extrabold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition cursor-pointer ${activeSubTab === 'requests' ? 'text-[#FF2D8D] border-[#FF2D8D]' : 'text-gray-500 dark:text-gray-400 dark:text-gray-400 border-transparent hover:text-gray-700 dark:text-gray-300'}`}
            >
              <ClipboardList className="w-4 h-4" />
              Minhas Solicitações e Histórico ({leads.length})
            </button>
          </div>

          {/* TAB 1: FAVORITES GRID */}
          {activeSubTab === 'favorites' && (
            <div className="space-y-4">
              {favoriteVehicles.length === 0 ? (
                <div className="p-8 md:p-12 text-center bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center text-gray-500 dark:text-gray-400 dark:text-gray-400 mx-auto">
                    <Heart className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">Nenhum veículo favoritado</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Navegue pelo nosso estoque e clique no coração em qualquer veículo para salvá-lo aqui e acompanhar propostas rápidas.
                  </p>
                  <button
                    onClick={() => onNavigate('catalogo')}
                    className="mt-2 px-5 py-2.5 bg-gray-100 dark:bg-neutral-900 hover:bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-800 text-xs font-bold text-gray-900 dark:text-white rounded-xl transition cursor-pointer"
                  >
                    Ver Todo o Estoque
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteVehicles.map(v => (
                    <div key={v.id} className="p-4 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl flex flex-col justify-between hover:border-[#FF2D8D]/20 transition-all group">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-neutral-900 shrink-0 border border-gray-200 dark:border-neutral-900">
                          <img
                            src={v.media[0]?.url || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400'}
                            alt={v.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="space-y-1 overflow-hidden">
                          <h4 className="font-bold text-gray-900 dark:text-white text-xs truncate">{v.title}</h4>
                          <p className="text-[10px] text-[#FF6FB5] font-extrabold">R$ {v.price.toLocaleString('pt-BR')}</p>
                          <div className="flex items-center gap-2 text-[9px] text-gray-500 dark:text-gray-400 dark:text-gray-400 font-semibold uppercase">
                            <span>{v.year}</span>
                            <span>•</span>
                            <span>{v.mileage === 0 ? 'Zero KM' : `${v.mileage.toLocaleString('pt-BR')} KM`}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-neutral-900 text-[10px]">
                        <button
                          onClick={() => onNavigate('detalhes', v.id)}
                          className="flex-1 py-2 bg-gray-100 dark:bg-neutral-900 hover:bg-white dark:bg-neutral-800 text-gray-900 dark:text-white font-bold rounded-lg border border-gray-200 dark:border-neutral-800 text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Detalhes
                        </button>
                        <button
                          onClick={() => handleRemoveFavorite(v.id)}
                          title="Remover dos favoritos"
                          className="p-2 bg-gray-100 dark:bg-neutral-900 hover:bg-red-950/40 text-gray-500 dark:text-gray-400 dark:text-gray-400 hover:text-red-400 border border-gray-200 dark:border-neutral-800 hover:border-red-900/50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REQUESTS HISTORY */}
          {activeSubTab === 'requests' && (
            <div className="space-y-4">
              {loadingLeads ? (
                <div className="p-8 text-center bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-3xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF2D8D] mx-auto mb-2"></div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400">Carregando seu histórico de solicitações...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="p-8 md:p-12 text-center bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-900 flex items-center justify-center text-gray-500 dark:text-gray-400 dark:text-gray-400 mx-auto">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">Nenhuma solicitação registrada</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Você ainda não enviou propostas de financiamento, avaliações de usado ou agendamento de visitas pelo site.
                  </p>
                  <button
                    onClick={() => onNavigate('catalogo')}
                    className="mt-2 px-5 py-2.5 bg-[#FF2D8D] text-white font-bold text-xs rounded-xl hover:bg-[#FF6FB5] transition cursor-pointer shadow-lg"
                  >
                    Simular ou Agendar Visita
                  </button>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {leads.map(lead => {
                    const dateFormatted = new Date(lead.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={lead.id} className="p-4 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-900 rounded-2xl space-y-3 hover:border-gray-200 dark:border-neutral-800 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#FF6FB5]">
                              {lead.type === 'Contato' && 'Mensagem de Contato'}
                              {lead.type === 'Agendamento' && 'Agendamento de Test-Drive'}
                              {lead.type === 'Financiamento' && 'Proposta de Financiamento'}
                              {lead.type === 'Avaliação' && 'Avaliação de Usado'}
                              {lead.type === 'WhatsAppClick' && 'Interesse via WhatsApp'}
                            </span>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{lead.vehicleName || 'Interesse Geral / Atendimento'}</h4>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400">{dateFormatted}</p>
                          </div>

                          <div className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase flex items-center gap-1 ${lead.status === 'Atendido' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'bg-amber-950/40 text-amber-400 border border-amber-900/50'}`}>
                            {lead.status === 'Atendido' ? (
                              <>
                                <CheckCircle className="w-3 h-3" /> Atendido
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" /> Em Análise
                              </>
                            )}
                          </div>
                        </div>

                        {/* Proposal details */}
                        <div className="bg-gray-100 dark:bg-neutral-900/40 border border-gray-200 dark:border-neutral-900 rounded-xl p-3 text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5">
                          {lead.type === 'Agendamento' && lead.details?.visitDate && (
                            <p className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#FF2D8D] shrink-0" /> <span className="text-gray-700 dark:text-gray-300">Data sugerida:</span> {new Date(lead.details.visitDate).toLocaleDateString('pt-BR')} às {lead.details.visitTime || 'horário comercial'}</p>
                          )}
                          {lead.type === 'Financiamento' && (
                            <>
                              {lead.details?.cpf && <p className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-[#FF2D8D] shrink-0" /> <span className="text-gray-700 dark:text-gray-300">CPF do titular:</span> ***.{lead.details.cpf.substring(3,6)}.***-**</p>}
                              {lead.details?.downPayment && <p className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[#FF2D8D] shrink-0" /> <span className="text-gray-700 dark:text-gray-300">Valor de Entrada:</span> R$ {parseFloat(lead.details.downPayment).toLocaleString('pt-BR')}</p>}
                            </>
                          )}
                          {lead.type === 'Avaliação' && lead.details?.tradeVehicleBrand && (
                            <p className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-[#FF2D8D] shrink-0" /> <span className="text-gray-700 dark:text-gray-300">Veículo para troca:</span> {lead.details.tradeVehicleBrand} {lead.details.tradeVehicleModel} ({lead.details.tradeVehicleYear}) - {lead.details.tradeVehicleKm ? parseInt(lead.details.tradeVehicleKm).toLocaleString('pt-BR') : '0'} KM</p>
                          )}
                          {lead.message && (
                            <p className="italic text-gray-600 dark:text-gray-400 mt-1.5 border-t border-gray-200 dark:border-neutral-900/60 pt-1.5 flex items-start gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 shrink-0 mt-0.5" /> "{lead.message}"</p>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-500 dark:text-gray-400 dark:text-gray-400 leading-relaxed">
                          {lead.status === 'Pendente' 
                            ? '➜ Um de nossos consultores humanos está analisando sua proposta e entrará em contato em breve via WhatsApp.' 
                            : '➜ Esta solicitação já foi atendida por nosso consultor. Verifique o seu WhatsApp.'
                          }
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
