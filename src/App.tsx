import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { Hero } from './components/Hero';
import { Catalog } from './components/Catalog';
import { VehicleDetails } from './components/VehicleDetails';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { TermsOfUse } from './components/TermsOfUse';
import { FinancingRequest } from './components/FinancingRequest';
import { UsedCarEvaluation } from './components/UsedCarEvaluation';
import ComboSimulator from './components/ComboSimulator';
import { ClientPortal } from './components/ClientPortal';
import { Footer } from './components/Footer';
import { 
  Vehicle, UserProfile, SiteSettings, Testimonial 
} from './types';
import { 
  Star, MapPin, Phone, MessageCircle, Calendar, Landmark, 
  HelpCircle, ShieldCheck, ChevronRight, AlertCircle, Sparkles, CheckCircle2, DollarSign, Clock, Wrench, Gauge, Fuel
} from 'lucide-react';

export default function App() {
  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Global App States
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Default initial settings
  const [settings, setSettings] = useState<SiteSettings>({
    whatsapp: '(11) 95720-6096',
    phone: '(11) 95720-6096',
    email: 'ravi_car@outlook.com',
    address: 'Avenida Marechal Tito, 2188 - São Miguel Paulista, São Paulo - SP, 08022-000, Brasil',
    instagram: 'https://instagram.com/ravicar_veiculos',
    facebook: 'https://facebook.com/ravicar_veiculos',
    hoursWeekday: '8h às 18h',
    hoursSaturday: '8h às 16h',
    pixCnpj: '44.169.920/0001-03',
    pixCelular: '11983950665',
    pixEmail: 'ravi_car@outlook.com',
    pixSantander: 'ag: 0696 CC: 13004672-2',
    pixBradesco: 'ag: 0113 CC: 0032823-5',
    pixItau: 'ag: 6453 CC: 99793-1',
    pixInter: 'ag: 0001 CC: 22066529-0'
  });

  // Fetch all vehicles and configurations on mount
  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Fetch Vehicles
      const vRes = await fetch('/api/vehicles');
      if (vRes.ok) {
        const vData = await vRes.json();
        setVehicles(vData);
      }

      // Fetch Settings
      const sRes = await fetch('/api/settings');
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData && sData.whatsapp) {
          setSettings(sData);
        }
      }

      // Fetch Testimonials
      const tRes = await fetch('/api/testimonials');
      if (tRes.ok) {
        const tData = await tRes.json();
        setTestimonials(tData);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Check if token exists in localStorage to auto-login
    const savedToken = localStorage.getItem('ravicar_token');
    if (savedToken) {
      setToken(savedToken);
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${savedToken}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Invalid session');
      })
      .then(user => {
        setCurrentUser(user);
      })
      .catch(() => {
        localStorage.removeItem('ravicar_token');
        setToken(null);
        setCurrentUser(null);
      });
    }

    // Monitor Hash Change for direct linking (e.g., #veiculo-car-1)
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#veiculo-')) {
        const carId = hash.replace('#veiculo-', '');
        setSelectedVehicleId(carId);
        setCurrentPage('detalhes');
      } else if (hash === '#catalogo') {
        setCurrentPage('catalogo');
        setSelectedVehicleId(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // call once initially

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Scroll to top of the page when navigating or selecting a vehicle
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage, selectedVehicleId]);

  // Handle Login Event
  const handleLoginSuccess = (user: UserProfile, sessionToken: string) => {
    setCurrentUser(user);
    setToken(sessionToken);
    localStorage.setItem('ravicar_token', sessionToken);
    
    // Redirect based on user role
    if (user.role === 'Administrador') {
      setCurrentPage('admin');
    } else if (user.role === 'Vendedor') {
      setCurrentPage('vendedor');
    } else {
      setCurrentPage('cliente');
    }
  };

  // Handle Logout Event
  const handleLogout = async () => {
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    }
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('ravicar_token');
    setCurrentPage('home');
  };

  // Handle Update Site Settings
  const handleUpdateSettings = async (newSettings: Partial<SiteSettings>): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  // Custom Navigation proxy
  const handleNavigate = (page: string, vehicleId?: string) => {
    if (page === 'detalhes' && vehicleId) {
      setSelectedVehicleId(vehicleId);
      window.location.hash = `#veiculo-${vehicleId}`;
    } else {
      setSelectedVehicleId(null);
      window.location.hash = page === 'home' ? '' : `#${page}`;
    }
    setCurrentPage(page);
  };

  // Pre-calculated filtered data for home sections
  const featuredVehicles = React.useMemo(() => {
    return vehicles.filter(v => v.featured || v.newlyArrived).slice(0, 3);
  }, [vehicles]);

  const selectedVehicle = React.useMemo(() => {
    if (!selectedVehicleId) return null;
    return vehicles.find(v => v.id === selectedVehicleId) || null;
  }, [vehicles, selectedVehicleId]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Dynamic Header */}
      <Header 
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        settings={settings}
      />

      {/* Main Page Layout Container */}
      <main className="flex-grow">
        
        {/* Loading Indicator */}
        {loading && currentPage === 'home' && (
          <div className="flex items-center justify-center py-20">
            <span className="w-10 h-10 border-4 border-[var(--brand-color)] border-t-transparent rounded-full animate-spin"></span>
          </div>
        )}

        {/* PAGE 1: HOME PAGE */}
        {currentPage === 'home' && !loading && (
          <div className="space-y-16 pb-16">
            {/* Elegant Hero Slider */}
            <Hero onNavigate={handleNavigate} settings={settings} />

            {/* Featured Cars Section */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[var(--brand-color)]">
                    <Sparkles className="w-4 h-4" />
                    Destaques RaviCar
                  </div>
                  <h2 className="font-display font-black text-2xl md:text-3xl text-white mt-1">
                    Veículos em Destaque no Showroom
                  </h2>
                </div>
                <button
                  onClick={() => handleNavigate('catalogo')}
                  className="px-5 py-2.5 rounded-xl border border-neutral-800 hover:border-[var(--brand-color)] bg-neutral-950 text-xs font-bold text-gray-300 hover:text-[var(--brand-color)] transition duration-300 flex items-center gap-1 cursor-pointer"
                >
                  Ver Estoque Completo
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of featured vehicles */}
              {featuredVehicles.length === 0 ? (
                <p className="text-xs text-gray-500 py-10 text-center">Nenhum veículo em destaque no momento.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {featuredVehicles.map(v => (
                    <div
                      key={v.id}
                      onClick={() => handleNavigate('detalhes', v.id)}
                      className="group bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-lg hover:border-[var(--brand-color)]/30 transition transform hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1A1A1A]">
                        {v.media && v.media.length > 0 ? (
                          <img
                            src={v.media[0].url}
                            alt={v.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">Sem Foto</div>
                        )}
                        <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                          {v.status}
                        </span>
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[11px] leading-normal text-gray-500 uppercase tracking-widest font-black">{v.brand}</span>
                          <h4 className="font-display font-bold text-white text-sm truncate leading-relaxed py-1 mt-0.5 group-hover:text-[var(--brand-color)] transition-colors">
                            {v.title}
                          </h4>
                          
                          {/* Tags list (matching high-fidelity Catalog style) */}
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 mt-3 text-[11px] leading-normal text-gray-400">
                            <span className="flex items-center gap-1.5 truncate py-0.5">
                              <Calendar className="w-3.5 h-3.5 text-[var(--brand-color)] shrink-0" />
                              <span>{v.year}</span>
                            </span>
                            <span className="flex items-center gap-1.5 truncate py-0.5">
                              <Wrench className="w-3.5 h-3.5 text-[var(--brand-color)] shrink-0" />
                              <span className="truncate">{v.transmission}</span>
                            </span>
                            <span className="flex items-center gap-1.5 truncate py-0.5">
                              <Gauge className="w-3.5 h-3.5 text-[var(--brand-color)] shrink-0" />
                              <span className="truncate">{v.mileage === 0 ? 'Zero KM' : `${v.mileage.toLocaleString('pt-BR')} KM`}</span>
                            </span>
                            <span className="flex items-center gap-1.5 truncate py-0.5">
                              <Fuel className="w-3.5 h-3.5 text-[var(--brand-color)] shrink-0" />
                              <span className="truncate">{v.fuel || 'Flex'}</span>
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-neutral-900/60 flex items-end justify-between">
                          <div>
                            <p className="text-[10px] leading-normal text-gray-500 uppercase font-black py-0.5">Valor Especial</p>
                            <p className="font-display font-black text-[var(--brand-color)] text-[16px] mt-0.5 py-1">R$ {v.price.toLocaleString('pt-BR')}</p>
                          </div>
                          <span className="text-[11.5px] leading-normal font-bold text-gray-400 group-hover:text-[var(--brand-color)] transition flex items-center gap-0.5">Ver Ficha ➔</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick action buttons with high fidelity illustrations and links */}
            <section className="bg-neutral-950 border-y border-neutral-900/60 py-12">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-black border border-neutral-900 hover:border-[var(--brand-color)]/30 transition duration-300 flex flex-col justify-between hover-lift">
                  <div>
                    <Landmark className="w-8 h-8 text-[var(--brand-color)] mb-4" />
                    <h3 className="font-display font-bold text-white text-base mb-1">Simular Financiamento</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Taxas exclusivas em até 60 parcelas com o respaldo de 13 bancos líderes de mercado.</p>
                  </div>
                  <button onClick={() => handleNavigate('financiamento')} className="mt-6 text-xs font-bold text-[var(--brand-color)] flex items-center gap-1 hover:underline cursor-pointer">
                    Iniciar Simulação de Crédito <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-black border border-neutral-900 hover:border-[var(--brand-color)]/30 transition duration-300 flex flex-col justify-between hover-lift">
                  <div>
                    <Sparkles className="w-8 h-8 text-[var(--brand-color)] mb-4" />
                    <h3 className="font-display font-bold text-white text-base mb-1">Avaliar Veículo Usado</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Faremos a avaliação mais justa do seu veículo seminovo para dar de entrada na troca.</p>
                  </div>
                  <button onClick={() => handleNavigate('avaliacao')} className="mt-6 text-xs font-bold text-[var(--brand-color)] flex items-center gap-1 hover:underline cursor-pointer">
                    Solicitar Avaliação Física <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6 rounded-2xl bg-black border border-neutral-900 hover:border-[var(--brand-color)]/30 transition duration-300 flex flex-col justify-between hover-lift">
                  <div>
                    <Calendar className="w-8 h-8 text-emerald-400 mb-4" />
                    <h3 className="font-display font-bold text-white text-base mb-1">Agendar Test Drive</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">Escolha o dia, horário e veículo de interesse para conhecer nossa equipe pessoalmente.</p>
                  </div>
                  <button onClick={() => handleNavigate('catalogo')} className="mt-6 text-xs font-bold text-[var(--brand-color)] flex items-center gap-1 hover:underline cursor-pointer">
                    Ver Veículos Disponíveis <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>

            {/* Testimonials section */}
            <section className="max-w-7xl mx-auto px-4">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-color)] uppercase tracking-wider mb-2">
                  <Star className="w-4 h-4 fill-[var(--brand-color)]" /> Opinião de Clientes
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl text-white">Quem Compra na RaviCar, Recomenda!</h2>
                <p className="text-xs text-gray-500 mt-1">Transparência e foco total na satisfação do início ao fim da negociação.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(testimonials.length > 0 ? testimonials : [
                  { id: '1', name: 'Guilherme Silva', role: 'Cliente Satisfeito', rating: 5, text: 'O atendimento é sensacional! Carros super revisados e negociação sem burocracia.' },
                  { id: '2', name: 'Amanda Ramos', role: 'Proprietária de Voyage', rating: 5, text: 'Facilidade de crédito incrível. Fiz a simulação de manhã e à tarde já estava de Voyage novo!' },
                  { id: '3', name: 'Bruno Mendes', role: 'Cliente Recorrente', rating: 5, text: 'Segunda vez que compro na RaviCar e recomendo. Confiança total e carros realmente periciados.' }
                ]).map((t, idx) => (
                  <div key={t.id || idx} className="p-6 rounded-2xl bg-neutral-950 border border-neutral-900 relative hover-lift transition-all duration-300">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[var(--brand-color)] text-[var(--brand-color)]" />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed italic mb-6">"{t.text}"</p>
                    <div>
                      <h4 className="font-display font-bold text-white text-xs">{t.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PIX RESERVA OPTIONS BANNER */}
            <section className="max-w-4xl mx-auto px-4">
              <div className="bg-neutral-950 border border-[var(--brand-color)]/30 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-xl">
                <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 opacity-10 text-[var(--brand-color)]">
                  <DollarSign className="w-72 h-72" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-full bg-[var(--brand-color)]/10 text-[var(--brand-color)]">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-extrabold text-lg text-white">Garantia de Reserva por Sinal (PIX)</h3>
                      <p className="text-[10px] text-gray-500">Gostou muito de um veículo e quer segurar ele para você? Faça um sinal de garantia oficial RaviCar.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400 pt-2">
                    <div className="space-y-2">
                      <p><strong>CNPJ Oficial:</strong> <span className="text-white font-mono">{settings.pixCnpj}</span></p>
                      <p><strong>Pix Celular:</strong> <span className="text-white font-mono">{settings.pixCelular}</span></p>
                      <p><strong>Pix E-mail:</strong> <span className="text-white font-mono">{settings.pixEmail}</span></p>
                    </div>
                    <div className="space-y-2 border-t sm:border-t-0 sm:border-l border-neutral-900 sm:pl-4 pt-2 sm:pt-0">
                      <p className="font-bold text-[var(--brand-color)]">Contas para Transferência Direta:</p>
                      <p className="text-[10px]">🏦 <strong>Santander:</strong> {settings.pixSantander}</p>
                      <p className="text-[10px]">🏦 <strong>Bradesco:</strong> {settings.pixBradesco}</p>
                      <p className="text-[10px]">🏦 <strong>Itaú:</strong> {settings.pixItau}</p>
                      <p className="text-[10px]">🏦 <strong>Banco Inter:</strong> {settings.pixInter}</p>
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-500 italic mt-3">
                    * Envie o comprovante de sinal de reserva para seu vendedor no WhatsApp {settings.whatsapp} para emitir o termo de reserva e retirar o anúncio do ar imediatamente.
                  </p>
                </div>
              </div>
            </section>

            {/* Visit card & working hours */}
            <section id="location_section" className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-12 border-t border-neutral-900/60">
              <div className="lg:col-span-5 space-y-5 text-xs text-gray-400">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--brand-color)]/10 border border-[var(--brand-color)]/20 text-[var(--brand-color)] rounded-full text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-color)]"></span>
                  Showroom Físico
                </div>
                <h3 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">
                  Venha nos Visitar
                </h3>
                <p className="leading-relaxed text-gray-400 text-sm">
                  Venha conhecer pessoalmente o nosso showroom luxuoso! Oferecemos um ambiente seguro, totalmente climatizado, com café espresso gourmet e estacionamento exclusivo e gratuito para clientes.
                </p>
                
                <div className="space-y-3.5 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[var(--brand-color)]">
                      <MapPin className="w-4 h-4 shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-0.5">Endereço</p>
                      <p className="text-gray-500 leading-normal">{settings.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[var(--brand-color)]">
                      <Clock className="w-4 h-4 shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-0.5">Horário de Funcionamento</p>
                      <p className="text-gray-500 leading-normal">
                        Segunda a Sexta: <span className="text-gray-300 font-semibold">{settings.hoursWeekday}</span> <br />
                        Sábados: <span className="text-gray-300 font-semibold">{settings.hoursSaturday}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-neutral-900 border border-neutral-800 rounded-xl text-[var(--brand-color)]">
                      <Phone className="w-4 h-4 shrink-0" />
                    </div>
                    <div>
                      <p className="font-bold text-white mb-0.5">Telefone Comercial</p>
                      <p className="text-gray-300 font-semibold text-sm">{settings.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => {
                      const text = encodeURIComponent(`Olá RaviCar! Gostaria de saber como chegar ao showroom físico na ${settings.address}.`);
                      const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
                      const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;
                      window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20ba59] transition-all shadow-lg hover:shadow-[#25D366]/20 cursor-pointer text-xs uppercase tracking-wider"
                  >
                    <MessageCircle className="w-4.5 h-4.5 fill-white text-[#25D366]" />
                    Conversar via WhatsApp
                  </button>
                </div>
              </div>

              {/* Physical Map (Real Google Maps with dark elegant theme and controls) */}
              <div className="lg:col-span-7 h-80 md:h-[400px] bg-neutral-950 border border-neutral-900 rounded-3xl overflow-hidden relative shadow-2xl group">
                <iframe
                  title="Showroom RaviCar Localização"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address || 'Avenida Marechal Tito, 2188, São Paulo - SP')}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                  className="w-full h-full border-0 opacity-70 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                  style={{ filter: 'grayscale(1) invert(0.92) contrast(1.15) brightness(0.95)' }}
                  allowFullScreen
                  loading="lazy"
                ></iframe>

                {/* Glassmorphism Navigation Overlay Card */}
                <div className="absolute top-4 left-4 right-4 bg-black/85 backdrop-blur-md p-4 rounded-2xl border border-neutral-800/80 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[var(--brand-color)]/15 text-[var(--brand-color)] rounded-xl shrink-0 border border-[var(--brand-color)]/20">
                      <MapPin className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="font-display font-black text-white text-sm">Showroom RaviCar</p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{settings.address}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial text-center px-4 py-2 bg-[var(--brand-color)] hover:brightness-110 text-white font-black text-[10px] rounded-xl shadow-lg transition uppercase tracking-wider cursor-pointer"
                    >
                      Google Maps
                    </a>
                    <a
                      href={`https://waze.com/ul?q=${encodeURIComponent(settings.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial text-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-gray-300 hover:text-white font-black text-[10px] rounded-xl shadow-lg transition uppercase tracking-wider cursor-pointer"
                    >
                      Waze
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PAGE 2: CATALOG STATE */}
        {currentPage === 'catalogo' && !loading && (
          <div className="animate-fade-in-up">
            <Catalog 
              vehicles={vehicles} 
              currentUser={currentUser}
              onSelectVehicle={(id) => handleNavigate('detalhes', id)} 
            />
          </div>
        )}

        {/* PAGE 3: VEHICLE DETAILS STATE */}
        {currentPage === 'detalhes' && selectedVehicle && (
          <div className="animate-fade-in-up">
            <VehicleDetails
              vehicle={selectedVehicle}
              settings={settings}
              vehicles={vehicles}
              onBack={() => handleNavigate('catalogo')}
              onNavigate={handleNavigate}
              currentUser={currentUser}
            />
          </div>
        )}

        {/* PAGE 4: FINANCING REQUEST */}
        {currentPage === 'financiamento' && (
          <div className="animate-fade-in-up">
            <FinancingRequest settings={settings} vehicles={vehicles} currentUser={currentUser} />
          </div>
        )}

        {/* PAGE 5: USED CAR EVALUATION */}
        {currentPage === 'avaliacao' && (
          <div className="animate-fade-in-up">
            <UsedCarEvaluation settings={settings} currentUser={currentUser} />
          </div>
        )}

        {/* PAGE 5B: UNIFIED COMBO SIMULATOR (TRADE-IN + FINANCING combo) */}
        {currentPage === 'combo' && (
          <div className="animate-fade-in-up">
            <ComboSimulator 
              vehicles={vehicles} 
              settings={settings} 
              currentUser={currentUser} 
              onNavigate={handleNavigate} 
            />
          </div>
        )}

        {/* PAGE 6: TERMS OF USE LEGAL PAGE */}
        {currentPage === 'termos' && (
          <div className="animate-fade-in-up">
            <TermsOfUse settings={settings} />
          </div>
        )}

        {/* PAGE 6B: CUSTOMER PORTAL */}
        {currentPage === 'cliente' && currentUser && (
          <div className="animate-fade-in-up">
            <ClientPortal
              currentUser={currentUser}
              token={token || ''}
              vehicles={vehicles}
              settings={settings}
              onUpdateCurrentUser={(user) => setCurrentUser(user)}
              onNavigate={handleNavigate}
            />
          </div>
        )}

        {/* PAGE 7: OPERATIONAL ADMIN PANEL */}
        {(currentPage === 'admin' || currentPage === 'vendedor') && currentUser && (
          <div className="animate-fade-in-up">
            <AdminPanel
              currentUser={currentUser}
              token={token || ''}
              vehicles={vehicles}
              onRefreshData={loadInitialData}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          </div>
        )}
      </main>

      {/* Dynamic Footer */}
      <Footer onNavigate={handleNavigate} settings={settings} />

      {/* Restricted Access login Modal */}
      {authModalOpen && (
        <AuthModal 
          onClose={() => setAuthModalOpen(false)} 
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}
