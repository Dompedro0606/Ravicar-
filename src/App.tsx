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
import { Premium3DTiltCard } from './components/Premium3DTiltCard';
import { 
  Vehicle, UserProfile, SiteSettings, Testimonial 
} from './types';
import { 
  Star, MapPin, Phone, MessageCircle, Calendar, Landmark, 
  HelpCircle, ShieldCheck, ChevronRight, AlertCircle, Sparkles, CheckCircle2, DollarSign, Clock, Wrench, Gauge, Fuel, ArrowUpRight
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
    pixInter: 'ag: 0001 CC: 22066529-0',
    taxaSantander: 1.39,
    taxaItau: 1.49,
    taxaBradesco: 1.59,
    taxaBv: 1.29,
    taxaPan: 1.69,
    taxaSafra: 1.39,
    taxaC6: 1.59,
    taxaPorto: 1.49,
    taxaCreditas: 1.39,
    taxaMercadoPago: 1.69,
    taxaOmni: 1.89,
    taxaDaycoval: 1.79
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

  // Apple-style scroll reveal animation handler
  useEffect(() => {
    // Delay slightly to allow the DOM to fully render after navigation/loading
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('revealed');
            }
          });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
      );

      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach((el) => observer.observe(el));

      return () => {
        elements.forEach((el) => observer.unobserve(el));
      };
    }, 150);

    return () => clearTimeout(timer);
  }, [currentPage, loading]);

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
    <div className="flex flex-col min-h-screen bg-black text-white overflow-x-hidden">
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
            <section className="max-w-7xl mx-auto px-4 reveal-on-scroll">
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
                    <Premium3DTiltCard
                      key={v.id}
                      onClick={() => handleNavigate('detalhes', v.id)}
                      className="group bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1A1A1A]">
                        {v.media && v.media.length > 0 ? (
                          <img
                            src={v.media[0].url}
                            alt={v.title}
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">Sem Foto</div>
                        )}
                        <span className={`absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase flex items-center gap-1.5 backdrop-blur-md border ${
                          v.status === 'Disponível' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          v.status === 'Reservado' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                          'bg-neutral-500/10 border-neutral-500/20 text-gray-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            v.status === 'Disponível' ? 'bg-emerald-500 animate-pulse' :
                            v.status === 'Reservado' ? 'bg-amber-500' : 'bg-gray-400'
                          }`}></span>
                          {v.status}
                        </span>
                      </div>
                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">{v.brand}</span>
                          <h4 className="font-display font-extrabold text-white text-base truncate leading-relaxed py-1 mt-0.5 group-hover:text-[var(--brand-color)] transition-colors">
                            {v.title}
                          </h4>
                          
                          {/* Tags list (matching high-fidelity Catalog style) */}
                          <div className="grid grid-cols-2 gap-y-2 gap-x-3 mt-4 text-xs text-gray-400 font-medium">
                            <span className="flex items-center gap-2 truncate py-0.5">
                              <Calendar className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[var(--brand-color)] transition-colors shrink-0" />
                              <span>{v.year}</span>
                            </span>
                            <span className="flex items-center gap-2 truncate py-0.5">
                              <Wrench className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[var(--brand-color)] transition-colors shrink-0" />
                              <span className="truncate">{v.transmission}</span>
                            </span>
                            <span className="flex items-center gap-2 truncate py-0.5">
                              <Gauge className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[var(--brand-color)] transition-colors shrink-0" />
                              <span className="truncate">{v.mileage === 0 ? 'Zero KM' : `${v.mileage.toLocaleString('pt-BR')} KM`}</span>
                            </span>
                            <span className="flex items-center gap-2 truncate py-0.5">
                              <Fuel className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[var(--brand-color)] transition-colors shrink-0" />
                              <span className="truncate">{v.fuel || 'Flex'}</span>
                            </span>
                          </div>
                        </div>
                        <div className="mt-5 pt-4 border-t border-neutral-900/60 flex items-end justify-between">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-mono">VALOR ESPECIAL</p>
                            <p className="font-display font-black text-white text-lg mt-0.5 group-hover:text-[var(--brand-color)] transition-colors">R$ {v.price.toLocaleString('pt-BR')}</p>
                          </div>
                          <span className="h-8 w-8 rounded-full border border-neutral-900 bg-neutral-950 flex items-center justify-center text-gray-400 group-hover:border-[var(--brand-color)]/40 group-hover:text-[var(--brand-color)] transition-all duration-300">
                            <ArrowUpRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </Premium3DTiltCard>
                  ))}
                </div>
              )}
            </section>

            {/* Quick action buttons with high fidelity illustrations and links */}
            <section className="bg-neutral-950 border-y border-neutral-900/60 py-16 reveal-on-scroll">
              <div className="max-w-7xl mx-auto px-4">
                <div className="mb-10 text-center md:text-left">
                  <span className="text-[10px] font-mono tracking-widest text-[var(--brand-color)] uppercase">// SOLUÇÕES INTEGRADAS</span>
                  <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mt-2">Facilidades Exclusivas RaviCar</h2>
                  <p className="text-xs text-gray-500 mt-1 max-w-xl">Do crédito à entrega, cuidamos de toda a jornada para que sua única preocupação seja aproveitar a estrada.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Action 1 */}
                  <div className="group p-8 rounded-2xl bg-black border border-neutral-900/80 hover:border-[var(--brand-color)]/30 transition-all duration-300 flex flex-col justify-between hover-lift relative overflow-hidden">
                    <div className="absolute top-6 right-6 text-xs font-mono text-neutral-800 group-hover:text-[var(--brand-color)]/20 transition-colors">// 01</div>
                    <div>
                      <div className="h-12 w-12 rounded-xl bg-[var(--brand-color)]/5 flex items-center justify-center border border-[var(--brand-color)]/10 text-[var(--brand-color)] mb-6">
                        <Landmark className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-extrabold text-white text-base mb-2">Simular Financiamento</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">Parcerias estratégicas com 13 bancos líderes para garantir as menores taxas do mercado nacional em até 60x.</p>
                    </div>
                    <button onClick={() => handleNavigate('financiamento')} className="mt-8 text-xs font-extrabold text-[var(--brand-color)] flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                      Iniciar Simulação de Crédito <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action 2 */}
                  <div className="group p-8 rounded-2xl bg-black border border-neutral-900/80 hover:border-[var(--brand-color)]/30 transition-all duration-300 flex flex-col justify-between hover-lift relative overflow-hidden">
                    <div className="absolute top-6 right-6 text-xs font-mono text-neutral-800 group-hover:text-[var(--brand-color)]/20 transition-colors">// 02</div>
                    <div>
                      <div className="h-12 w-12 rounded-xl bg-[var(--brand-color)]/5 flex items-center justify-center border border-[var(--brand-color)]/10 text-[var(--brand-color)] mb-6">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-extrabold text-white text-base mb-2">Avaliar Veículo Usado</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">Tenha a avaliação mais justa e transparente do mercado utilizando inteligência de dados para dar de entrada na troca.</p>
                    </div>
                    <button onClick={() => handleNavigate('avaliacao')} className="mt-8 text-xs font-extrabold text-[var(--brand-color)] flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                      Solicitar Avaliação Física <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action 3 */}
                  <div className="group p-8 rounded-2xl bg-black border border-neutral-900/80 hover:border-[var(--brand-color)]/30 transition-all duration-300 flex flex-col justify-between hover-lift relative overflow-hidden">
                    <div className="absolute top-6 right-6 text-xs font-mono text-neutral-800 group-hover:text-[var(--brand-color)]/20 transition-colors">// 03</div>
                    <div>
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10 text-emerald-400 mb-6">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <h3 className="font-display font-extrabold text-white text-base mb-2">Agendar Test Drive</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">Escolha o melhor dia e horário para testar seu carro dos sonhos com atendimento premium e personalizado.</p>
                    </div>
                    <button onClick={() => handleNavigate('catalogo')} className="mt-8 text-xs font-extrabold text-[var(--brand-color)] flex items-center gap-1 hover:gap-2 transition-all cursor-pointer">
                      Ver Veículos Disponíveis <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials section */}
            <section className="max-w-7xl mx-auto px-4 reveal-on-scroll">
              <div className="text-center max-w-xl mx-auto mb-12">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-950 border border-neutral-900 text-[10px] font-mono tracking-widest text-[var(--brand-color)] uppercase mb-3">
                  <Star className="w-3 h-3 fill-[var(--brand-color)]" /> Depoimentos Reais
                </div>
                <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white">Experiências RaviCar</h2>
                <p className="text-xs text-gray-500 mt-1">A melhor métrica do nosso trabalho é a satisfação de quem confia em nossa curadoria.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {(testimonials.length > 0 ? testimonials : [
                  { id: '1', name: 'Guilherme Silva', role: 'Cliente Satisfeito', rating: 5, text: 'O atendimento é sensacional! Carros super revisados e negociação sem burocracia.' },
                  { id: '2', name: 'Amanda Ramos', role: 'Proprietária de Voyage', rating: 5, text: 'Facilidade de crédito incrível. Fiz a simulação de manhã e à tarde já estava de Voyage novo!' },
                  { id: '3', name: 'Bruno Mendes', role: 'Cliente Recorrente', rating: 5, text: 'Segunda vez que compro na RaviCar e recomendo. Confiança total e carros realmente periciados.' }
                ]).map((t, idx) => {
                  // Generate initials for luxury avatar
                  const initials = t.name ? t.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';
                  return (
                    <div key={t.id || idx} className="p-8 rounded-2xl bg-[#080808] border border-neutral-900/60 relative hover:border-[var(--brand-color)]/25 transition-all duration-500 flex flex-col justify-between group overflow-hidden hover-lift">
                      {/* Quote mark watermark */}
                      <span className="absolute top-2 right-4 text-7xl font-serif text-neutral-900/30 select-none pointer-events-none group-hover:text-[var(--brand-color)]/5 transition-colors">“</span>
                      
                      <div className="relative z-10">
                        <div className="flex gap-1 mb-5">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-[var(--brand-color)] text-[var(--brand-color)]" />
                          ))}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed font-medium italic mb-6">"{t.text}"</p>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-neutral-900/40 relative z-10">
                        <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xs font-mono font-bold text-gray-400 group-hover:border-[var(--brand-color)]/30 group-hover:text-[var(--brand-color)] transition-colors">
                          {initials}
                        </div>
                        <div>
                          <h4 className="font-display font-extrabold text-white text-xs">{t.name}</h4>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase tracking-wide">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* PIX RESERVA OPTIONS BANNER */}
            <section className="max-w-4xl mx-auto px-4 reveal-on-scroll">
              <div className="relative overflow-hidden bg-neutral-950 border border-neutral-900 rounded-3xl p-8 md:p-10 shadow-2xl">
                {/* Visual Accent Glow */}
                <div className="absolute right-0 top-0 -translate-y-1/3 translate-x-1/3 w-96 h-96 bg-[var(--brand-color)]/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute left-0 bottom-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-900/60">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-[var(--brand-color)]/10 flex items-center justify-center border border-[var(--brand-color)]/20 text-[var(--brand-color)]">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-extrabold text-xl text-white">Certificado de Reserva e Sinal</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Garanta a exclusividade imediata do seu veículo de forma ágil e segura.</p>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono uppercase tracking-wider text-emerald-400 self-start md:self-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Operação Instantânea via Pix
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                    {/* Left Column: Pix Keys */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-mono tracking-widest text-[var(--brand-color)] uppercase">// CHAVES PIX OFICIAIS</span>
                      <div className="space-y-3 bg-black/40 border border-neutral-900/80 rounded-2xl p-5">
                        <div className="flex justify-between items-center text-xs py-1 border-b border-neutral-900/30">
                          <span className="text-gray-500">CNPJ RaviCar</span>
                          <span className="text-white font-mono font-bold">{settings.pixCnpj}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-neutral-900/30">
                          <span className="text-gray-500">Pix Celular</span>
                          <span className="text-white font-mono font-bold">{settings.pixCelular}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1">
                          <span className="text-gray-500">Pix E-mail</span>
                          <span className="text-white font-mono font-bold truncate max-w-[180px]">{settings.pixEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Bank details */}
                    <div className="space-y-4">
                      <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">// TRANSFERÊNCIA DIRETA</span>
                      <div className="space-y-3 bg-black/40 border border-neutral-900/80 rounded-2xl p-5">
                        <div className="grid grid-cols-2 gap-2 text-[11px] leading-relaxed">
                          <div className="py-1 border-b border-neutral-900/30">
                            <span className="text-gray-500 block text-[9px] uppercase font-mono">SANTANDER</span>
                            <span className="text-gray-300 font-bold font-mono">{settings.pixSantander}</span>
                          </div>
                          <div className="py-1 border-b border-neutral-900/30">
                            <span className="text-gray-500 block text-[9px] uppercase font-mono">BRADESCO</span>
                            <span className="text-gray-300 font-bold font-mono">{settings.pixBradesco}</span>
                          </div>
                          <div className="py-1">
                            <span className="text-gray-500 block text-[9px] uppercase font-mono">ITAÚ</span>
                            <span className="text-gray-300 font-bold font-mono">{settings.pixItau}</span>
                          </div>
                          <div className="py-1">
                            <span className="text-gray-500 block text-[9px] uppercase font-mono">BANCO INTER</span>
                            <span className="text-gray-300 font-bold font-mono">{settings.pixInter}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-neutral-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-[10px] text-gray-500 italic max-w-xl">
                      * Após concluir o sinal de reserva, envie imediatamente o comprovante ao seu consultor de vendas RaviCar para emitirmos seu termo de reserva legalizado.
                    </p>
                    <button 
                      onClick={() => {
                        const messageText = encodeURIComponent(`Olá, realizei um sinal de reserva para garantir meu seminovo RaviCar. Aqui está meu comprovante.`);
                        const cleanWhatsapp = settings.whatsapp.replace(/\D/g, '');
                        const whatsappNumber = cleanWhatsapp.startsWith('55') && cleanWhatsapp.length >= 12 ? cleanWhatsapp : `55${cleanWhatsapp}`;
                        window.open(`https://wa.me/${whatsappNumber}?text=${messageText}`, '_blank');
                      }}
                      className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-[var(--brand-color)] border border-neutral-800 hover:border-transparent text-xs font-bold text-gray-300 hover:text-white transition-all duration-300 shrink-0 cursor-pointer text-center"
                    >
                      Enviar Comprovante de Reserva
                    </button>
                  </div>
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
