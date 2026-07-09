import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash, Check, UserPlus, Users, 
  Car, Landmark, Mail, ClipboardList, Settings, DollarSign, 
  Eye, RefreshCw, Upload, Video, Image as ImageIcon, Save, ShieldAlert,
  Search, CheckCircle2, ChevronRight, Phone, Clock, FileText, UserCheck, Percent
} from 'lucide-react';
import { Vehicle, UserProfile, LeadMessage, SiteSettings, MediaItem, VehicleStatus, FuelType, TransmissionType } from '../types';

interface AdminPanelProps {
  currentUser: UserProfile;
  token: string;
  vehicles: Vehicle[];
  onRefreshData: () => void;
  settings: SiteSettings;
  onUpdateSettings: (newSettings: Partial<SiteSettings>) => Promise<boolean>;
}

interface ClientCRM {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

function getEstimatedFipeClient(brand: string, model: string, year: number): number {
  let hash = 0;
  const str = `${brand.toLowerCase()}_${model.toLowerCase()}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  
  let basePrice = 50000;
  if (year >= 2026) {
    basePrice = 110000;
  } else if (year >= 2024) {
    basePrice = 90000;
  } else if (year >= 2022) {
    basePrice = 75000;
  } else if (year >= 2020) {
    basePrice = 60000;
  } else if (year >= 2017) {
    basePrice = 45000;
  } else if (year >= 2014) {
    basePrice = 32000;
  } else {
    basePrice = 22000;
  }

  const b = brand.toLowerCase();
  let modifier = 1.0;
  if (b.includes('toyota') || b.includes('honda')) modifier = 1.15;
  else if (b.includes('bmw') || b.includes('mercedes') || b.includes('audi') || b.includes('porsche')) modifier = 1.6;
  else if (b.includes('jeep') || b.includes('hyundai')) modifier = 1.08;
  else if (b.includes('chevrolet') || b.includes('fiat') || b.includes('volkswagen') || b.includes('ford')) modifier = 0.95;
  
  const variation = 0.85 + ((absHash % 30) / 100); // 0.85 to 1.15
  return Math.round(basePrice * modifier * variation);
}

export function AdminPanel({ currentUser, token, vehicles, onRefreshData, settings, onUpdateSettings }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'leads' | 'clients' | 'users' | 'settings'>('dashboard');
  
  // Market Intelligence Audit States
  const [auditSearch, setAuditSearch] = useState('');
  const [auditFilter, setAuditFilter] = useState<'all' | 'need_adjustment' | 'dentro' | 'acima' | 'abaixo'>('all');
  const [expandedSeoCarId, setExpandedSeoCarId] = useState<string | null>(null);

  // Custom Toast/Alert and Confirmation Dialog States
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  
  // Lists fetched from API
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [leadsList, setLeadsList] = useState<LeadMessage[]>([]);
  const [clientsList, setClientsList] = useState<ClientCRM[]>([]);

  // Filtering lists
  const [leadsFilter, setLeadsFilter] = useState<'Todos' | 'Contato' | 'Agendamento' | 'Financiamento' | 'Avaliação' | 'WhatsAppClick'>('Todos');
  const [leadsStatusFilter, setLeadsStatusFilter] = useState<'Todos' | 'Pendente' | 'Atendido'>('Todos');
  
  // Search Filters
  const [stockSearch, setStockSearch] = useState('');
  const [leadSearch, setLeadSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  
  // Loading & Edit States
  const [loading, setLoading] = useState(false);
  const [carFormOpen, setCarFormOpen] = useState(false);
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  
  // Vehicle Form States
  const [carForm, setCarForm] = useState({
    title: '',
    brand: '',
    model: '',
    year: '',
    mileage: 0,
    color: '',
    fuel: 'Flex' as FuelType,
    transmission: 'Manual' as TransmissionType,
    engine: '',
    power: '',
    description: '',
    price: 0,
    status: 'Disponível' as VehicleStatus,
    media: [] as MediaItem[],
    optionsText: '', // split by commas for final submission
    featured: false,
    newlyArrived: true,
  });

  // RaviCar AI Analysis State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    veiculo: string;
    analise_preco: {
      status: string;
      preco_sugerido: number;
      diferenca_percentual: string;
    };
    conteudo: {
      titulo_seo: string;
      descricao_persuasiva: string;
    };
    score_qualidade: number;
  } | null>(null);

  // Client CRM Form State
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Employee/User Form States
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    role: 'Vendedor',
    phone: '',
    password: ''
  });

  // Settings State
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(settings);

  // Fetch helper
  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch Leads
      const leadsRes = await fetch('/api/leads', { headers });
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeadsList(data);
      }

      // Fetch Clients
      const clientsRes = await fetch('/api/clients', { headers });
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClientsList(data);
      }

      // Fetch Employees (Admin only)
      if (currentUser.role === 'Administrador') {
        const usersRes = await fetch('/api/users', { headers });
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsersList(data);
        }
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Sync settings state when prop changes
  useEffect(() => {
    setSiteSettings(settings);
  }, [settings]);

  // Handle Mark Lead as Atendido
  const handleMarkLeadAtendido = async (leadId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'Pendente' ? 'Atendido' : 'Pendente';
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        setLeadsList(prev => prev.map(l => l.id === leadId ? { ...l, status: nextStatus as any } : l));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Upload Photo/Video base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    setLoading(true);
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: file.name, base64 })
          });

          if (res.ok) {
            const data = await res.json();
            const mediaType = file.type.includes('video') ? 'video' : 'image';
            setCarForm(prev => ({
              ...prev,
              media: [...prev.media, { type: mediaType, url: data.url }]
            }));
          } else {
            showToast('Falha ao enviar arquivo', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Erro ao enviar arquivo.', 'error');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (indexToRemove: number) => {
    setCarForm(prev => ({
      ...prev,
      media: prev.media.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Add or Edit Vehicle Save Action
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carForm.title || !carForm.brand || !carForm.model || !carForm.price) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const optionsArray = carForm.optionsText
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    const payload = {
      title: carForm.title,
      brand: carForm.brand,
      model: carForm.model,
      year: carForm.year,
      mileage: Number(carForm.mileage),
      color: carForm.color,
      fuel: carForm.fuel,
      transmission: carForm.transmission,
      engine: carForm.engine,
      power: carForm.power,
      description: carForm.description,
      price: Number(carForm.price),
      status: carForm.status,
      media: carForm.media,
      options: optionsArray,
      featured: carForm.featured,
      newlyArrived: carForm.newlyArrived,
    };

    try {
      setLoading(true);
      const url = editingCarId ? `/api/vehicles/${editingCarId}` : '/api/vehicles';
      const method = editingCarId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onRefreshData();
        setCarFormOpen(false);
        setEditingCarId(null);
        // reset form state
        setCarForm({
          title: '',
          brand: '',
          model: '',
          year: '',
          mileage: 0,
          color: '',
          fuel: 'Flex',
          transmission: 'Manual',
          engine: '',
          power: '',
          description: '',
          price: 0,
          status: 'Disponível',
          media: [],
          optionsText: '',
          featured: false,
          newlyArrived: true,
        });
      } else {
        const errorData = await res.json();
        showToast(`Erro: ${errorData.error || 'Não foi possível cadastrar o veículo.'}`, 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao salvar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAIAnalysis = async () => {
    if (!carForm.brand || !carForm.model || !carForm.price) {
      showToast('Por favor, preencha Marca, Modelo e Preço de Venda antes de realizar a análise com IA.', 'error');
      return;
    }

    try {
      setAiLoading(true);
      setAiAnalysis(null);
      const res = await fetch('/api/gemini/analyze-car', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          brand: carForm.brand,
          model: carForm.model,
          year: carForm.year,
          mileage: carForm.mileage,
          price: carForm.price,
          description: carForm.description,
          optionsText: carForm.optionsText
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
        showToast('Análise de mercado com IA realizada com sucesso!', 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Erro ao realizar a análise inteligente.', 'error');
      }
    } catch (e: any) {
      console.error(e);
      showToast('Erro ao conectar com a IA RaviCar.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditCarClick = (vehicle: Vehicle) => {
    setEditingCarId(vehicle.id);
    setAiAnalysis(null);
    setCarForm({
      title: vehicle.title,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      mileage: vehicle.mileage,
      color: vehicle.color,
      fuel: vehicle.fuel,
      transmission: vehicle.transmission,
      engine: vehicle.engine,
      power: vehicle.power,
      description: vehicle.description || '',
      price: vehicle.price,
      status: vehicle.status,
      media: vehicle.media || [],
      optionsText: vehicle.options ? vehicle.options.join(', ') : '',
      featured: vehicle.featured || false,
      newlyArrived: vehicle.newlyArrived || false,
    });
    setCarFormOpen(true);
  };

  const handleDeleteCar = async (carId: string) => {
    requestConfirmation(
      'Remover Veículo',
      'Deseja realmente remover este veículo permanentemente do estoque?',
      async () => {
        try {
          const res = await fetch(`/api/vehicles/${carId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Veículo removido com sucesso!', 'success');
            onRefreshData();
          } else {
            const err = await res.json();
            showToast(`Erro: ${err.error || 'Não foi possível excluir o veículo.'}`, 'error');
          }
        } catch (e: any) {
          console.error(e);
          showToast(`Erro de conexão: ${e.message || 'Verifique sua conexão com a internet.'}`, 'error');
        }
      }
    );
  };

  // Client CRM Actions
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.phone) {
      showToast('Nome e Telefone são campos obrigatórios.', 'error');
      return;
    }

    try {
      const url = editingClientId ? `/api/clients/${editingClientId}` : '/api/clients';
      const method = editingClientId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientForm)
      });

      if (res.ok) {
        fetchData();
        setClientFormOpen(false);
        setEditingClientId(null);
        setClientForm({ name: '', phone: '', email: '', notes: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    requestConfirmation(
      'Remover Cliente',
      'Excluir este cliente do banco de dados?',
      async () => {
        try {
          const res = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Cliente removido com sucesso!', 'success');
            fetchData();
          } else {
            showToast('Não foi possível excluir o cliente.', 'error');
          }
        } catch (e) {
          console.error(e);
          showToast('Erro de conexão ao excluir cliente.', 'error');
        }
      }
    );
  };

  // Employee Management Actions (Admin only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email || !userForm.password || !userForm.name) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userForm)
      });

      if (res.ok) {
        showToast('Funcionário cadastrado com sucesso!', 'success');
        fetchData();
        setUserFormOpen(false);
        setUserForm({ email: '', password: '', name: '', phone: '', role: 'Vendedor' });
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao cadastrar funcionário', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Erro de conexão ao cadastrar funcionário.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    requestConfirmation(
      'Remover Funcionário',
      'Excluir este funcionário do painel? Ele perderá todo o acesso.',
      async () => {
        try {
          const res = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            showToast('Funcionário removido com sucesso!', 'success');
            fetchData();
          } else {
            const err = await res.json();
            showToast(err.error || 'Não foi possível excluir.', 'error');
          }
        } catch (e) {
          console.error(e);
          showToast('Erro de conexão ao excluir funcionário.', 'error');
        }
      }
    );
  };

  // Update Settings
  const handleSaveSettings = async () => {
    const success = await onUpdateSettings(siteSettings);
    if (success) {
      showToast('Configurações atualizadas com sucesso!', 'success');
    } else {
      showToast('Erro ao salvar as configurações.', 'error');
    }
  };

  // Stats Calculations
  const stats = React.useMemo(() => {
    const totalCount = vehicles.length;
    const available = vehicles.filter(v => v.status === 'Disponível').length;
    const reserved = vehicles.filter(v => v.status === 'Reservado').length;
    const sold = vehicles.filter(v => v.status === 'Vendido').length;
    const totalViews = vehicles.reduce((acc, v) => acc + (v.views || 0), 0);
    const pendingLeads = leadsList.filter(l => l.status === 'Pendente').length;
    
    const activeVehicles = vehicles.filter(v => v.status !== 'Vendido');
    const totalStockValue = activeVehicles.reduce((acc, v) => acc + v.price, 0);
    const avgPrice = activeVehicles.length > 0 ? totalStockValue / activeVehicles.length : 0;
    
    const adjustmentNeededCount = activeVehicles.filter(v => {
      const yearNum = parseInt(v.year.split('/')[0]) || 2022;
      const fipePrice = getEstimatedFipeClient(v.brand, v.model, yearNum);
      const diffPct = ((v.price - fipePrice) / fipePrice) * 100;
      return diffPct > 10 || diffPct < -10;
    }).length;
    
    return { 
      totalCount, 
      available, 
      reserved, 
      sold, 
      totalViews, 
      pendingLeads,
      totalStockValue,
      avgPrice,
      adjustmentNeededCount
    };
  }, [vehicles, leadsList]);

  // Filtered Vehicles
  const filteredVehicles = React.useMemo(() => {
    return vehicles.filter(v => {
      const query = stockSearch.toLowerCase();
      return (
        v.title.toLowerCase().includes(query) ||
        v.brand.toLowerCase().includes(query) ||
        v.model.toLowerCase().includes(query) ||
        v.year.toLowerCase().includes(query) ||
        (v.color && v.color.toLowerCase().includes(query))
      );
    });
  }, [vehicles, stockSearch]);

  // Filtered Clients
  const filteredClients = React.useMemo(() => {
    return clientsList.filter(c => {
      const query = clientSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.notes && c.notes.toLowerCase().includes(query))
      );
    });
  }, [clientsList, clientSearch]);

  // Filtered Leads
  const filteredLeads = React.useMemo(() => {
    return leadsList.filter(l => {
      const matchType = leadsFilter === 'Todos' || l.type === leadsFilter;
      const matchStatus = leadsStatusFilter === 'Todos' || l.status === leadsStatusFilter;
      const query = leadSearch.toLowerCase();
      const matchQuery = !query || 
        l.name.toLowerCase().includes(query) ||
        l.phone.toLowerCase().includes(query) ||
        (l.email && l.email.toLowerCase().includes(query)) ||
        (l.message && l.message.toLowerCase().includes(query)) ||
        (l.vehicleName && l.vehicleName.toLowerCase().includes(query));
      return matchType && matchStatus && matchQuery;
    });
  }, [leadsList, leadsFilter, leadsStatusFilter, leadSearch]);

  // Filtered audited vehicles for Inteligência de Mercado
  const auditedVehicles = React.useMemo(() => {
    return vehicles.filter(v => {
      const query = auditSearch.toLowerCase();
      const matchQuery = v.title.toLowerCase().includes(query) ||
                         v.brand.toLowerCase().includes(query) ||
                         v.model.toLowerCase().includes(query);
      if (!matchQuery) return false;

      const yearNum = parseInt(v.year.split('/')[0]) || 2022;
      const fipePrice = getEstimatedFipeClient(v.brand, v.model, yearNum);
      const diffPct = ((v.price - fipePrice) / fipePrice) * 100;

      if (auditFilter === 'need_adjustment') {
        return diffPct > 10 || diffPct < -10;
      }
      if (auditFilter === 'dentro') {
        return diffPct <= 10 && diffPct >= -10;
      }
      if (auditFilter === 'acima') {
        return diffPct > 10;
      }
      if (auditFilter === 'abaixo') {
        return diffPct < -10;
      }
      return true;
    });
  }, [vehicles, auditSearch, auditFilter]);

  const handleAutoAdjustPrice = async (vehicle: Vehicle, suggestedPrice: number) => {
    try {
      setLoading(true);
      const payload = {
        ...vehicle,
        price: suggestedPrice,
        newlyArrived: vehicle.newlyArrived ?? true
      };

      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(`Preço do ${vehicle.brand} ${vehicle.model} reajustado com sucesso para R$ ${suggestedPrice.toLocaleString('pt-BR')}`, 'success');
        onRefreshData();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erro ao ajustar o preço.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Erro de conexão ao ajustar preço.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar (3 columns on lg screens) */}
        <div className="lg:col-span-3 lg:border-r lg:border-neutral-900/60 lg:pr-6 space-y-6">
          <div className="bg-neutral-950 border border-neutral-900/60 rounded-2xl p-4 md:p-5">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg md:text-xl text-white tracking-tight">
                Painel RaviCar
              </h1>
              <span className="px-2 py-0.5 bg-[#FF2D8D]/10 text-[#FF2D8D] rounded-full font-bold text-[8px] tracking-wider uppercase border border-[#FF2D8D]/20">
                {currentUser.role}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
              Olá, <strong className="text-white">{currentUser.name}</strong>. Bem-vindo de volta!
            </p>
          </div>

          {/* Tab Selector Links */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none scroll-smooth w-full">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: ClipboardList },
              { id: 'vehicles', label: 'Estoque', icon: Car },
              { id: 'leads', label: `Leads (${stats.pendingLeads})`, icon: Mail },
              { id: 'clients', label: 'Clientes CRM', icon: Users },
              ...(currentUser.role === 'Administrador' ? [
                { id: 'users', label: 'Funcionários', icon: UserPlus },
                { id: 'settings', label: 'Configurações', icon: Settings }
              ] : [])
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition-all border shrink-0 text-left lg:w-full cursor-pointer ${
                    isActive 
                      ? 'bg-[#FF2D8D] border-[#FF2D8D] text-white shadow-[0_4px_15px_rgba(255,45,141,0.15)]'
                      : 'bg-neutral-950/60 border-neutral-900/60 text-gray-400 hover:text-white hover:bg-neutral-900/40 hover:border-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area (9 columns on lg screens) */}
        <div className="lg:col-span-9 space-y-6">

          {/* --- DASHBOARD TAB --- */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
          {/* Bento Stats Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Estoque */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden group hover:border-neutral-800 transition duration-300">
              <div className="absolute right-4 top-4 w-9 h-9 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-[#FF2D8D] transition">
                <Car className="w-4 h-4" />
              </div>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-extrabold">Total do Estoque</span>
              <p className="font-display font-black text-3xl text-white mt-2 leading-none">{stats.totalCount}</p>
              <div className="flex items-center gap-2 mt-4 text-[10px]">
                <span className="text-emerald-400 font-bold">{stats.available} Livres</span>
                <span className="text-gray-700">•</span>
                <span className="text-amber-500 font-bold">{stats.reserved} Reservados</span>
              </div>
            </div>
            
            {/* Leads Pendentes */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden group hover:border-neutral-800 transition duration-300">
              <div className="absolute right-4 top-4 w-9 h-9 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-extrabold">Leads Pendentes</span>
              <p className="font-display font-black text-3xl text-[#FF2D8D] mt-2 leading-none">{stats.pendingLeads}</p>
              <p className="text-[10px] text-gray-400 mt-4 leading-normal">
                Retornos e agendamentos pendentes.
              </p>
            </div>

            {/* Total Cliques */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden group hover:border-neutral-800 transition duration-300">
              <div className="absolute right-4 top-4 w-9 h-9 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-extrabold">Total de Interações</span>
              <p className="font-display font-black text-3xl text-white mt-2 leading-none">{leadsList.length}</p>
              <p className="text-[10px] text-gray-400 mt-4 leading-normal">
                Simulações, cadastros e cliques.
              </p>
            </div>

            {/* Visualizações Showroom */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden group hover:border-neutral-800 transition duration-300">
              <div className="absolute right-4 top-4 w-9 h-9 bg-neutral-900 border border-neutral-800 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-[9px] uppercase tracking-wider text-gray-500 font-extrabold">Cliques no Estoque</span>
              <p className="font-display font-black text-3xl text-[#FF6FB5] mt-2 leading-none">{stats.totalViews}</p>
              <p className="text-[10px] text-gray-400 mt-4 leading-normal">
                Visualizações nos detalhes de veículos.
              </p>
            </div>
          </div>

          {/* Quick CRM View */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
              <h3 className="font-display font-bold text-sm text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FF2D8D]" />
                Inquéritos e Leads de Clientes Recentes (Aguardando Retorno)
              </h3>
              {leadsList.filter(l => l.status === 'Pendente').slice(0, 4).length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-6">Parabéns! Todos os leads pendentes foram respondidos.</p>
              ) : (
                <div className="space-y-3">
                  {leadsList.filter(l => l.status === 'Pendente').slice(0, 4).map(l => (
                    <div key={l.id} className="p-3.5 bg-neutral-900 border border-neutral-800/60 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] leading-normal font-extrabold uppercase ${
                            l.type === 'Financiamento' ? 'bg-indigo-950 text-indigo-400 border border-indigo-900' :
                            l.type === 'Avaliação' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                            'bg-neutral-800 text-gray-300'
                          }`}>
                            {l.type}
                          </span>
                          <span className="font-bold text-xs text-white">{l.name}</span>
                          <span className="text-[10px] leading-normal text-gray-500">{l.phone}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-gray-400 mt-1.5 truncate">{l.message}</p>
                      </div>
                      <button
                        onClick={() => handleMarkLeadAtendido(l.id, l.status)}
                        className="px-3 py-1.5 rounded-lg bg-[#FF2D8D]/10 border border-[#FF2D8D]/20 text-[#FF2D8D] hover:bg-[#FF2D8D] hover:text-white transition text-[10px] font-bold"
                      >
                        Atendido ✓
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick action shortcuts */}
            <div className="md:col-span-4 bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-sm text-white mb-2">Ações Administrativas Rápidas</h3>
                <p className="text-xs text-gray-500 mb-6">Utilize os atalhos abaixo para acelerar as operações no showroom da RaviCar.</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => { setActiveTab('vehicles'); setCarFormOpen(true); setAiAnalysis(null); }}
                  className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#FF2D8D] hover:text-white transition text-left px-4 text-xs font-bold text-gray-300 border border-neutral-800 hover:border-transparent flex items-center justify-between"
                >
                  <span>Cadastrar Veículo Novo</span>
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setActiveTab('clients'); setClientFormOpen(true); }}
                  className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-[#FF6FB5] hover:text-white transition text-left px-4 text-xs font-bold text-gray-300 border border-neutral-800 hover:border-transparent flex items-center justify-between"
                >
                  <span>Cadastrar Cliente no CRM</span>
                  <Plus className="w-4 h-4" />
                </button>
                {currentUser.role === 'Administrador' && (
                  <button
                    onClick={() => { setActiveTab('users'); setUserFormOpen(true); }}
                    className="w-full py-3 rounded-xl bg-[#1A1A1A] hover:bg-white hover:text-black transition text-left px-4 text-xs font-bold text-gray-300 border border-neutral-800 hover:border-transparent flex items-center justify-between"
                  >
                    <span>Cadastrar Funcionário</span>
                    <UserPlus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PAINEL DE INTELIGÊNCIA DE MERCADO E AUDITORIA FIPE */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-900/80">
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <span className="p-1 bg-[#FF2D8D]/15 rounded-lg text-[#FF2D8D] text-xs">📊</span>
                  Painel de Inteligência de Mercado & Auditoria FIPE (Julho de 2026)
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                  Monitore a competitividade do estoque RaviCar de acordo com a tabela referencial de mercado e gere copys persuasivas automatizadas de alta conversão.
                </p>
              </div>

              {/* Mini dashboard insights */}
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col">
                  <span className="text-[7px] text-gray-500 uppercase font-black">Capital Ativo</span>
                  <span className="text-xs font-bold text-white">R$ {stats.totalStockValue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="px-3 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col">
                  <span className="text-[7px] text-gray-500 uppercase font-black">Ticket Médio</span>
                  <span className="text-xs font-bold text-white">R$ {stats.avgPrice.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="px-3 py-1.5 bg-neutral-900 rounded-xl border border-neutral-800 flex flex-col">
                  <span className="text-[7px] text-gray-500 uppercase font-black">Preços Críticos</span>
                  <span className={`text-xs font-bold ${stats.adjustmentNeededCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {stats.adjustmentNeededCount} {stats.adjustmentNeededCount === 1 ? 'carro' : 'carros'}
                  </span>
                </div>
              </div>
            </div>

            {/* Filters & Search Row */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por marca ou modelo na auditoria..."
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#FF2D8D] transition"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 overflow-x-auto scrollbar-none">
                {[
                  { id: 'all', label: 'Todos', count: vehicles.length },
                  { id: 'need_adjustment', label: 'Reajuste Crítico', count: stats.adjustmentNeededCount, isCritical: true },
                  { id: 'dentro', label: 'Preço Saudável', count: vehicles.length - stats.adjustmentNeededCount },
                  { id: 'acima', label: 'Acima da FIPE' },
                  { id: 'abaixo', label: 'Abaixo da FIPE' }
                ].map(pill => {
                  const isActive = auditFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => setAuditFilter(pill.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isActive
                          ? 'bg-[#FF2D8D] text-white'
                          : pill.isCritical && pill.count && pill.count > 0
                          ? 'bg-rose-950/40 text-rose-400 border border-rose-900/50 hover:bg-rose-950/60'
                          : 'bg-neutral-900 text-gray-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      <span>{pill.label}</span>
                      {pill.count !== undefined && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[8px] ${
                          isActive 
                            ? 'bg-white/20 text-white' 
                            : pill.isCritical && pill.count > 0
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-neutral-800 text-gray-500'
                        }`}>
                          {pill.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audited Cars List */}
            {auditedVehicles.length === 0 ? (
              <div className="text-center py-8 bg-neutral-900/20 border border-dashed border-neutral-900 rounded-xl">
                <p className="text-xs text-gray-500">Nenhum veículo encontrado com os filtros selecionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {auditedVehicles.map(v => {
                  const yearNum = parseInt(v.year.split('/')[0]) || 2022;
                  const fipePrice = getEstimatedFipeClient(v.brand, v.model, yearNum);
                  const diffPct = ((v.price - fipePrice) / fipePrice) * 100;
                  const diffFormatted = diffPct > 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`;
                  
                  const isAdjustmentNeeded = diffPct > 10 || diffPct < -10;
                  const statusLabel = diffPct > 10 
                    ? 'ACIMA DO MERCADO' 
                    : diffPct < -10 
                    ? 'ABAIXO DO MERCADO' 
                    : 'DENTRO DO MERCADO';

                  const kmNum = Number(v.mileage) || 40000;
                  
                  // Score de Qualidade (0-10)
                  let scoreQualidade = 7.5;
                  if (kmNum < 40000) scoreQualidade += 1.0;
                  if (v.optionsText && v.optionsText.length > 5) scoreQualidade += 1.0;
                  if (v.description && v.description.length > 15) scoreQualidade += 0.5;
                  scoreQualidade = Math.min(10, scoreQualidade);

                  // SEO Differential and fields
                  let differential = 'IMPECÁVEL';
                  if (kmNum < 20000) {
                    differential = 'BAIXA QUILOMETRAGEM';
                  } else if (v.optionsText && v.optionsText.toLowerCase().includes('teto')) {
                    differential = 'TETO SOLAR';
                  } else if (v.optionsText && v.optionsText.toLowerCase().includes('couro')) {
                    differential = 'BANCOS EM COURO';
                  } else if (yearNum >= 2024) {
                    differential = 'ESTADO DE NOVO';
                  }

                  const seoTitle = `${v.brand.toUpperCase()} ${v.model.toUpperCase()} ${yearNum} - ${differential} - RAVICAR MULTIMARCAS`;
                  const persuasiveDesc = `Imperdível oportunidade! Este ${v.brand} ${v.model} ${yearNum} está disponível na RaviCar Veículos por apenas R$ ${v.price.toLocaleString('pt-BR')}. Com apenas ${kmNum.toLocaleString('pt-BR')} km rodados e uma conservação espetacular. ${v.optionsText ? 'Destaque absoluto para: ' + v.optionsText + '. ' : ''}Veículo 100% periciado com laudo cautelar aprovado, revisado e com garantia total da RaviCar. Perfeito para quem busca segurança, economia e procedência garantida na Zona Leste! Aceitamos seu usado na troca com supervalorização e simulamos seu financiamento na hora!`;

                  const isExpanded = expandedSeoCarId === v.id;

                  return (
                    <div key={v.id} className={`p-4 bg-neutral-900/60 border rounded-xl transition duration-300 ${
                      isAdjustmentNeeded 
                        ? 'border-rose-950/55 hover:border-rose-800/40 bg-neutral-950/40' 
                        : 'border-neutral-900 hover:border-neutral-800'
                    }`}>
                      {/* Grid principal do veículo */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Imagem e Identificação */}
                        <div className="md:col-span-4 flex items-center gap-3">
                          <div className="w-12 h-12 bg-neutral-950 border border-neutral-900 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                            {v.images && v.images[0] ? (
                              <img src={v.images[0]} alt={v.title} className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                            ) : (
                              <Car className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <span className="text-[8px] font-extrabold uppercase text-gray-500 tracking-wide">{v.brand}</span>
                            <h4 className="font-bold text-xs text-white leading-tight mt-0.5">{v.title}</h4>
                            <div className="flex items-center gap-2 text-[9px] text-gray-400 mt-1">
                              <span>Ano {v.year}</span>
                              <span>•</span>
                              <span>{kmNum.toLocaleString('pt-BR')} Km</span>
                            </div>
                          </div>
                        </div>

                        {/* Dados Financeiros */}
                        <div className="md:col-span-4 grid grid-cols-3 gap-2 text-center md:text-left">
                          <div className="flex flex-col">
                            <span className="text-[7px] text-gray-500 uppercase font-bold">Preço RaviCar</span>
                            <span className="text-xs font-bold text-white mt-1">R$ {v.price.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-gray-500 uppercase font-bold">Média FIPE</span>
                            <span className="text-xs font-bold text-gray-300 mt-1">R$ {fipePrice.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[7px] text-gray-500 uppercase font-bold">Desvio FIPE</span>
                            <span className={`text-xs font-black mt-1 ${
                              diffPct > 10 ? 'text-amber-500' : diffPct < -10 ? 'text-indigo-400' : 'text-emerald-400'
                            }`}>
                              {diffFormatted}
                            </span>
                          </div>
                        </div>

                        {/* Status de Auditoria */}
                        <div className="md:col-span-2 flex flex-col items-center md:items-start gap-1">
                          <span className="text-[7px] text-gray-500 uppercase font-bold">Status FIPE</span>
                          <span className={`px-2 py-1 rounded text-[8px] font-extrabold uppercase leading-none mt-1 border ${
                            diffPct > 10 
                              ? 'bg-amber-950/40 text-amber-500 border-amber-900/60' 
                              : diffPct < -10 
                              ? 'bg-indigo-950/40 text-indigo-400 border-indigo-900/60' 
                              : 'bg-emerald-950/40 text-emerald-500 border-emerald-900/60'
                          }`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Score de Qualidade */}
                        <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                          <div className="flex flex-col items-end">
                            <span className="text-[7px] text-gray-500 uppercase font-bold">Score Geral</span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-black text-white">{scoreQualidade.toFixed(1)}</span>
                              <span className="text-[8px] text-gray-500">/10</span>
                            </div>
                          </div>
                          
                          {/* Mini progress ring or bar */}
                          <div className="w-8 h-1.5 bg-neutral-950 border border-neutral-900 rounded-full overflow-hidden shrink-0">
                            <div 
                              className={`h-full rounded-full ${
                                scoreQualidade >= 9 ? 'bg-emerald-400' : scoreQualidade >= 8 ? 'bg-indigo-400' : 'bg-amber-400'
                              }`}
                              style={{ width: `${scoreQualidade * 10}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ações e expansor de SEO */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-3.5 border-t border-neutral-900/80">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => setExpandedSeoCarId(isExpanded ? null : v.id)}
                            className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-gray-300 hover:text-white rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-[#FF2D8D]" />
                            {isExpanded ? 'Esconder Copys SEO' : 'Visualizar Copys SEO'}
                          </button>
                        </div>

                        {/* Botão de Reajuste em 1 Clique */}
                        {isAdjustmentNeeded && (
                          <button
                            onClick={() => handleAutoAdjustPrice(v, fipePrice)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/20 hover:border-transparent rounded-xl text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3 h-3 shrink-0" />
                            Ajustar para Preço FIPE (R$ {fipePrice.toLocaleString('pt-BR')})
                          </button>
                        )}
                      </div>

                      {/* Bloco Expandido de Copys SEO */}
                      {isExpanded && (
                        <div className="mt-4 p-4 bg-neutral-950 border border-neutral-900 rounded-xl space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-extrabold uppercase text-emerald-400 tracking-wider">Título Otimizado (SEO)</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(seoTitle);
                                  showToast('Título SEO copiado para a área de transferência!', 'success');
                                }}
                                className="text-[9px] text-[#FF2D8D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                Copiar Título
                              </button>
                            </div>
                            <p className="p-2.5 bg-neutral-900/60 border border-neutral-900/80 rounded-lg text-[10px] text-white font-mono leading-relaxed select-all">
                              {seoTitle}
                            </p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[8px] font-extrabold uppercase text-emerald-400 tracking-wider">Descrição Persuasiva de Venda</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(persuasiveDesc);
                                  showToast('Descrição persuasiva copiada para a área de transferência!', 'success');
                                }}
                                className="text-[9px] text-[#FF2D8D] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                Copiar Descrição
                              </button>
                            </div>
                            <p className="p-2.5 bg-neutral-900/60 border border-neutral-900/80 rounded-lg text-[10px] text-gray-300 leading-relaxed select-all">
                              {persuasiveDesc}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STOCK VEHICLES TAB --- */}
      {activeTab === 'vehicles' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider text-[#FF2D8D]">
                Estoque do Showroom ({filteredVehicles.length})
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Gerencie os veículos seminovos ativos no showroom.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar carro (marca, modelo, ano...)"
                  value={stockSearch}
                  onChange={e => setStockSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#FF2D8D] transition"
                />
              </div>
              <button
                onClick={() => { setEditingCarId(null); setCarFormOpen(true); setAiAnalysis(null); }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FF2D8D] text-white hover:bg-[#FF6FB5] transition font-bold text-xs rounded-xl shadow-lg cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Cadastrar Veículo
              </button>
            </div>
          </div>

          {/* Add / Edit Vehicle Form Overlay */}
          {carFormOpen && (
            <div className="p-6 bg-neutral-950 border border-neutral-900 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-900">
                <h4 className="font-display font-bold text-sm text-white">
                  {editingCarId ? `Editar Veículo: ${carForm.title}` : 'Cadastrar Novo Veículo Seminovos'}
                </h4>
                <button
                  onClick={() => setCarFormOpen(false)}
                  className="px-3 py-1 bg-neutral-900 text-gray-400 hover:text-white text-xs border border-neutral-800 rounded"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleSaveVehicle} className="space-y-6 text-xs text-gray-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 mb-1">Título do Anúncio *</label>
                    <input
                      type="text"
                      required
                      value={carForm.title}
                      onChange={e => setCarForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: Toyota Corolla 1.8 Hybrid Altis Premium"
                    />
                  </div>
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      required
                      value={carForm.price === 0 ? "" : carForm.price}
                      onChange={e => setCarForm(p => ({ ...p, price: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: 148900"
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Marca *</label>
                    <input
                      type="text"
                      required
                      value={carForm.brand}
                      onChange={e => setCarForm(p => ({ ...p, brand: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: Toyota"
                    />
                  </div>
                  {/* Model */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Modelo *</label>
                    <input
                      type="text"
                      required
                      value={carForm.model}
                      onChange={e => setCarForm(p => ({ ...p, model: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: Corolla"
                    />
                  </div>
                  {/* Year */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Ano (Fabricação/Modelo) *</label>
                    <input
                      type="text"
                      required
                      value={carForm.year}
                      onChange={e => setCarForm(p => ({ ...p, year: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: 2022/2023"
                    />
                  </div>

                  {/* Mileage */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">KM (Quilometragem) *</label>
                    <input
                      type="number"
                      required
                      value={carForm.mileage === 0 ? "" : carForm.mileage}
                      onChange={e => setCarForm(p => ({ ...p, mileage: e.target.value === "" ? 0 : Number(e.target.value) }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    />
                  </div>
                  {/* Color */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Cor Externa *</label>
                    <input
                      type="text"
                      required
                      value={carForm.color}
                      onChange={e => setCarForm(p => ({ ...p, color: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: Prata, Preto"
                    />
                  </div>
                  {/* Fuel */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Combustível *</label>
                    <select
                      value={carForm.fuel}
                      onChange={e => setCarForm(p => ({ ...p, fuel: e.target.value as FuelType }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    >
                      <option value="Gasolina">Gasolina</option>
                      <option value="Etanol">Etanol</option>
                      <option value="Flex">Flex</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Híbrido">Híbrido</option>
                      <option value="Elétrico">Elétrico</option>
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Câmbio *</label>
                    <select
                      value={carForm.transmission}
                      onChange={e => setCarForm(p => ({ ...p, transmission: e.target.value as TransmissionType }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automático">Automático</option>
                    </select>
                  </div>
                  {/* Engine */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Motorização *</label>
                    <input
                      type="text"
                      required
                      value={carForm.engine}
                      onChange={e => setCarForm(p => ({ ...p, engine: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: 1.8 Hybrid, 2.0"
                    />
                  </div>
                  {/* Power */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Potência (CV)</label>
                    <input
                      type="text"
                      value={carForm.power}
                      onChange={e => setCarForm(p => ({ ...p, power: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                      placeholder="Ex: 122 cv, 150 cv"
                    />
                  </div>
                </div>

                {/* Media Manager Block */}
                <div className="p-4 bg-neutral-900 border border-neutral-800/80 rounded-2xl">
                  <h5 className="font-display font-bold text-xs text-[#FF6FB5] mb-2 flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    Upload de Fotos e Vídeos do Veículo (Suporta múltiplos arquivos do dispositivo)
                  </h5>
                  <p className="text-[10px] text-gray-500 mb-4">Escolha fotos ou vídeos para fazer o upload em lote. Eles serão guardados de forma segura na galeria do carro.</p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 items-start mb-4">
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FF2D8D] file:text-white hover:file:opacity-90"
                    />
                    {loading && <span className="text-xs text-[#FF2D8D] font-bold animate-pulse">Processando upload de mídia...</span>}
                  </div>

                  {/* Thumbnail Previews with option to delete */}
                  {carForm.media.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {carForm.media.map((med, idx) => (
                        <div key={idx} className="relative w-16 h-12 rounded border border-neutral-800 overflow-hidden bg-black flex items-center justify-center">
                          {med.type === 'video' ? (
                            <Video className="w-5 h-5 text-[#FF2D8D]" />
                          ) : (
                            <img src={med.url} className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(idx)}
                            className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold px-1 rounded-bl"
                          >
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Optionals list inputs */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Opcionais (Separados por vírgula) *</label>
                  <input
                    type="text"
                    value={carForm.optionsText}
                    onChange={e => setCarForm(p => ({ ...p, optionsText: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    placeholder="Ex: Ar condicionado, Bancos em couro, Teto solar, Câmera de ré"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Descrição Comercial Detalhada</label>
                  <textarea
                    rows={4}
                    value={carForm.description}
                    onChange={e => setCarForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none resize-none"
                    placeholder="Fale sobre o estado de conservação, histórico, garantias, etc."
                  ></textarea>
                </div>

                {/* IA Market Intelligence Panel */}
                <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-neutral-800">
                    <div>
                      <h5 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                        <RefreshCw className={`w-4 h-4 text-[#FF2D8D] ${aiLoading ? 'animate-spin' : ''}`} />
                        Inteligência de Mercado IA (RaviCar)
                      </h5>
                      <p className="text-[10px] text-gray-500 mt-0.5">Audite o preço do veículo e otimize o título para SEO e descrição com 1 clique.</p>
                    </div>
                    <button
                      type="button"
                      disabled={aiLoading}
                      onClick={handleTriggerAIAnalysis}
                      className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-[#FF2D8D] text-white font-extrabold text-[11px] border border-neutral-700 hover:border-transparent transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {aiLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <span>✨ Otimizar com IA</span>
                        </>
                      )}
                    </button>
                  </div>

                  {aiAnalysis && (
                    <div className="space-y-4 text-xs animate-fadeIn">
                      {/* Quality & Price Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Quality Score */}
                        <div className="md:col-span-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Score de Qualidade</span>
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className="text-3xl font-black text-white">{aiAnalysis.score_qualidade}</span>
                              <span className="text-gray-600 font-bold">/ 10</span>
                            </div>
                          </div>
                          <div className="w-full bg-neutral-900 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] h-full rounded-full" 
                              style={{ width: `${aiAnalysis.score_qualidade * 10}%` }}
                            />
                          </div>
                        </div>

                        {/* Price Audit */}
                        <div className="md:col-span-8 p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Auditoria de Preço (Julho/2026)</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              aiAnalysis.analise_preco.status === 'DENTRO_DO_MERCADO' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                              aiAnalysis.analise_preco.status === 'ABAJO_DO_MERCADO' || aiAnalysis.analise_preco.status === 'ABAIXO_DO_MERCADO' ? 'bg-sky-950 text-sky-400 border border-sky-900' :
                              'bg-amber-950 text-amber-400 border border-amber-900'
                            }`}>
                              {aiAnalysis.analise_preco.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500 text-[10px]">Preço Sugerido (FIPE/Margem):</p>
                              <p className="font-bold text-white mt-0.5">R$ {aiAnalysis.analise_preco.preco_sugerido.toLocaleString('pt-BR')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 text-[10px]">Diferença vs. Mercado:</p>
                              <p className="font-bold text-[#FF2D8D] mt-0.5">{aiAnalysis.analise_preco.diferenca_percentual}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-neutral-900 flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setCarForm(prev => ({ ...prev, price: aiAnalysis.analise_preco.preco_sugerido }));
                                showToast('Preço sugerido aplicado com sucesso!', 'success');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#FF2D8D]/10 border border-[#FF2D8D]/20 text-[#FF2D8D] hover:bg-[#FF2D8D] hover:text-white transition font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" /> Aplicar Preço Sugerido
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="space-y-3">
                        {/* Title SEO */}
                        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Título Otimizado para SEO</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCarForm(prev => ({ ...prev, title: aiAnalysis.conteudo.titulo_seo }));
                                showToast('Título SEO aplicado!', 'success');
                              }}
                              className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-gray-300 hover:text-white transition font-bold text-[9px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-2.5 h-2.5" /> Aplicar Título
                            </button>
                          </div>
                          <p className="text-white font-bold text-xs">{aiAnalysis.conteudo.titulo_seo}</p>
                        </div>

                        {/* Description Persuasiva */}
                        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Descrição Curta & Persuasiva</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCarForm(prev => ({ ...prev, description: aiAnalysis.conteudo.descricao_persuasiva }));
                                showToast('Descrição persuasiva aplicada!', 'success');
                              }}
                              className="px-2 py-1 rounded bg-neutral-900 border border-neutral-800 text-gray-300 hover:text-white transition font-bold text-[9px] flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-2.5 h-2.5" /> Aplicar Descrição
                            </button>
                          </div>
                          <p className="text-gray-300 leading-relaxed text-[11px] italic">"{aiAnalysis.conteudo.descricao_persuasiva}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Flags and Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Status de Disponibilidade</label>
                    <select
                      value={carForm.status}
                      onChange={e => setCarForm(p => ({ ...p, status: e.target.value as VehicleStatus }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white outline-none"
                    >
                      <option value="Disponível">Disponível</option>
                      <option value="Reservado">Reservado</option>
                      <option value="Vendido">Vendido</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={carForm.featured}
                      onChange={e => setCarForm(p => ({ ...p, featured: e.target.checked }))}
                      className="accent-[#FF2D8D] w-4 h-4"
                    />
                    <label htmlFor="featured" className="font-bold text-white text-xs cursor-pointer">Anúncio Destaque ⚡</label>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="newlyArrived"
                      checked={carForm.newlyArrived}
                      onChange={e => setCarForm(p => ({ ...p, newlyArrived: e.target.checked }))}
                      className="accent-[#FF2D8D] w-4 h-4"
                    />
                    <label htmlFor="newlyArrived" className="font-bold text-white text-xs cursor-pointer">Novidade no Estoque ✨</label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setCarFormOpen(false)}
                    className="px-5 py-3 rounded-xl bg-neutral-900 border border-neutral-800 font-bold text-gray-400 hover:text-white"
                  >
                    Descartar Alterações
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF2D8D] to-[#FF6FB5] text-white font-extrabold shadow-lg hover:glow-pink"
                  >
                    {editingCarId ? 'Salvar Edição' : 'Cadastrar Carro'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Vehicles List Table */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 bg-neutral-900/30 text-gray-500 font-bold">
                    <th className="p-4">Veículo</th>
                    <th className="p-4">Preço</th>
                    <th className="p-4">Ano</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Cliques/Views</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/60 text-gray-300">
                  {filteredVehicles.map(v => (
                    <tr key={v.id} className="hover:bg-neutral-900/10">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.media[0]?.url || 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=200'}
                            className="w-12 h-9 object-cover rounded bg-neutral-900 border border-neutral-800"
                          />
                          <div>
                            <p className="font-bold text-white text-xs">{v.title}</p>
                            <p className="text-[10px] text-gray-500">{v.brand} • {v.transmission} • {v.fuel}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-[#FF2D8D]">
                        R$ {v.price.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 text-gray-400 font-medium">{v.year}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          v.status === 'Disponível' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50' :
                          v.status === 'Reservado' ? 'bg-amber-950/80 text-amber-400 border border-amber-900/50' :
                          'bg-red-950/80 text-red-400 border border-red-900/50'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="flex items-center gap-1 font-mono text-gray-500">
                          <Eye className="w-3.5 h-3.5" />
                          {v.views || 0}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditCarClick(v)}
                            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-[#FF6FB5] hover:bg-[#FF2D8D] hover:text-white transition cursor-pointer flex items-center justify-center w-8 h-8 shrink-0"
                            title="Editar Veículo"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCar(v.id)}
                            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-red-400 hover:bg-red-600 hover:text-white transition cursor-pointer flex items-center justify-center w-8 h-8 shrink-0"
                            title="Excluir Anúncio"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- LEADS / MESSAGES TAB --- */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 p-4 bg-neutral-950 border border-neutral-900 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs text-gray-400 font-semibold">Tipo:</span>
              <div className="flex flex-wrap gap-1">
                {['Todos', 'Contato', 'Agendamento', 'Financiamento', 'Avaliação', 'WhatsAppClick'].map(type => (
                  <button
                    key={type}
                    onClick={() => setLeadsFilter(type as any)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                      leadsFilter === type 
                        ? 'bg-[#FF2D8D] text-white' 
                        : 'bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs text-gray-400 font-semibold">Status:</span>
              <div className="flex gap-1">
                {['Todos', 'Pendente', 'Atendido'].map(st => (
                  <button
                    key={st}
                    onClick={() => setLeadsStatusFilter(st as any)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition ${
                      leadsStatusFilter === st 
                        ? 'bg-[#FF6FB5] text-white' 
                        : 'bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full xl:w-56">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar lead (nome, fone...)"
                value={leadSearch}
                onChange={e => setLeadSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#FF2D8D] transition"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 bg-neutral-950 border border-neutral-900 rounded-2xl">
                <p className="text-xs text-gray-500">Nenhum lead ou formulário preenchido corresponde à busca.</p>
              </div>
            ) : (
              filteredLeads.map(lead => (
                <div key={lead.id} className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-900">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase ${
                        lead.type === 'Financiamento' ? 'bg-indigo-950/80 text-indigo-400 border border-indigo-900/50' :
                        lead.type === 'Avaliação' ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50' :
                        lead.type === 'Agendamento' ? 'bg-amber-950/80 text-amber-400 border border-amber-900/50' :
                        'bg-neutral-800 text-gray-300'
                      }`}>
                        {lead.type}
                      </span>
                      <h4 className="font-display font-bold text-white text-xs">{lead.name}</h4>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">{new Date(lead.date).toLocaleString('pt-BR')}</span>
                      <button
                        onClick={() => handleMarkLeadAtendido(lead.id, lead.status)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-black transition cursor-pointer ${
                          lead.status === 'Atendido' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                            : 'bg-[#FF2D8D]/10 text-[#FF2D8D] border border-[#FF2D8D]/20 hover:bg-[#FF2D8D] hover:text-white'
                        }`}
                      >
                        {lead.status === 'Atendido' ? 'Atendido ✓' : 'Pendente (Marcar Atendido)'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>
                      <p><strong className="text-white">Celular / WhatsApp:</strong> {lead.phone}</p>
                      {lead.email && <p><strong className="text-white">E-mail:</strong> {lead.email}</p>}
                      {lead.vehicleName && <p><strong className="text-white">Veículo de Interesse:</strong> {lead.vehicleName}</p>}
                    </div>

                    {/* Display form specifics if they exist */}
                    {lead.details && (
                      <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800">
                        <p className="font-bold text-[#FF6FB5] mb-1">Dados de Qualificação Cadastral:</p>
                        {lead.details.cpf && <p><strong>CPF:</strong> {lead.details.cpf}</p>}
                        {lead.details.birthDate && <p><strong>Nascimento:</strong> {lead.details.birthDate}</p>}
                        {lead.details.downPayment && <p><strong>Entrada simulada:</strong> R$ {Number(lead.details.downPayment).toLocaleString('pt-BR')}</p>}
                        {lead.details.visitDate && <p><strong>Data de Visita agendada:</strong> {lead.details.visitDate} às {lead.details.visitTime}</p>}
                        {lead.details.tradeVehicleBrand && (
                          <p><strong>Veículo na Troca:</strong> {lead.details.tradeVehicleBrand} {lead.details.tradeVehicleModel} ({lead.details.tradeVehicleYear}) - {Number(lead.details.tradeVehicleKm).toLocaleString('pt-BR')} KM</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-neutral-900 p-3 rounded-xl border border-neutral-800/50 text-[11px] text-gray-300">
                    <p className="italic">"{lead.message}"</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- CLIENT CRM TAB --- */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider text-[#FF2D8D]">
                CRM - Gestão de Clientes ({filteredClients.length})
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Histórico de contatos e negociações de veículos.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente (nome, fone...)"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-[#FF2D8D] transition"
                />
              </div>
              <button
                onClick={() => { setEditingClientId(null); setClientFormOpen(true); }}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#FF2D8D] text-white hover:bg-[#FF6FB5] transition font-bold text-xs rounded-xl shadow-lg cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Cadastrar Cliente
              </button>
            </div>
          </div>

          {/* Add/Edit Client Form Overlay */}
          {clientFormOpen && (
            <form onSubmit={handleSaveClient} className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
              <h4 className="font-display font-bold text-xs text-[#FF6FB5] uppercase tracking-wide">
                {editingClientId ? 'Editar Dados do Cliente' : 'Cadastrar Novo Cliente no CRM'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.name}
                    onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={clientForm.phone}
                    onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={clientForm.email}
                    onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Anotações e Histórico de Negociação (Carro preferido, limite de valor, etc.)</label>
                <textarea
                  rows={3}
                  value={clientForm.notes}
                  onChange={e => setClientForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white resize-none"
                  placeholder="Ex: Busca SUV preta até R$ 120mil. Tem Onix para dar de troca."
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClientFormOpen(false)}
                  className="px-4 py-2 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-gray-400 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF2D8D] hover:bg-[#FF6FB5] transition rounded-xl text-xs font-bold text-white shadow-md"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          )}

          {/* Client Table List */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-900/30 text-gray-500 font-bold">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Anotações Comerciais</th>
                  <th className="p-4">Criado em</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/60 text-gray-300">
                {filteredClients.map(c => (
                  <tr key={c.id}>
                    <td className="p-4 font-bold text-white">{c.name}</td>
                    <td className="p-4">
                      <p>{c.phone}</p>
                      {c.email && <p className="text-[10px] text-gray-500">{c.email}</p>}
                    </td>
                    <td className="p-4 text-gray-400 font-medium max-w-sm">{c.notes || '-'}</td>
                    <td className="p-4 text-gray-500">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingClientId(c.id);
                            setClientForm({ name: c.name, phone: c.phone, email: c.email || '', notes: c.notes || '' });
                            setClientFormOpen(true);
                          }}
                          className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-[#FF6FB5] hover:bg-[#FF2D8D] hover:text-white transition flex items-center justify-center w-8 h-8 shrink-0 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(c.id)}
                          className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-red-400 hover:bg-red-600 hover:text-white transition flex items-center justify-center w-8 h-8 shrink-0 cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- EMPLOYEES TAB (Admin only) --- */}
      {activeTab === 'users' && currentUser.role === 'Administrador' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider text-[#FF2D8D]">
              Gerenciamento de Funcionários ({usersList.length})
            </h3>
            <button
              onClick={() => setUserFormOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF2D8D] text-white hover:bg-[#FF6FB5] transition font-bold text-xs rounded-xl shadow-lg cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Registrar Funcionário
            </button>
          </div>

          {/* User Registration Form overlay */}
          {userFormOpen && (
            <form onSubmit={handleCreateUser} className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4 max-w-2xl">
              <h4 className="font-display font-bold text-xs text-[#FF6FB5] uppercase tracking-wide">
                Registrar Novo Vendedor / Administrador
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-gray-400 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">E-mail Comercial (Acesso) *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                    placeholder="Min 6 caracteres"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Telefone Celular</label>
                  <input
                    type="text"
                    value={userForm.phone}
                    onChange={e => setUserForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Cargo / Role *</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm(p => ({ ...p, role: e.target.value as any }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  >
                    <option value="Vendedor">Vendedor (Pode gerenciar apenas estoque/clientes)</option>
                    <option value="Administrador">Administrador (Acesso total)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserFormOpen(false)}
                  className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs text-gray-400 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF2D8D] text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Registrar Usuário
                </button>
              </div>
            </form>
          )}

          {/* User Table List */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-900 bg-neutral-900/30 text-gray-500 font-bold">
                  <th className="p-4">Colaborador</th>
                  <th className="p-4">E-mail de Login</th>
                  <th className="p-4">Cargo</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900/60 text-gray-300">
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td className="p-4 font-bold text-white">{u.name}</td>
                    <td className="p-4 font-mono text-gray-400">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        u.role === 'Administrador' ? 'bg-[#FF2D8D]/10 text-[#FF2D8D] border border-[#FF2D8D]/20' : 'bg-neutral-800 text-gray-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{u.phone || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end">
                        {/* Prevent self delete */}
                        {u.id !== currentUser.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded bg-neutral-900 border border-neutral-800 text-red-400 hover:bg-red-600 hover:text-white transition flex items-center justify-center w-8 h-8 shrink-0 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SITE SETTINGS TAB (Admin only) --- */}
      {activeTab === 'settings' && currentUser.role === 'Administrador' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
            <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider text-[#FF2D8D]">
              Configurações do Estabelecimento e Chaves PIX
            </h3>
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FF2D8D] text-white hover:bg-[#FF6FB5] transition font-bold text-xs rounded-xl shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" /> Salvar Configurações
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs text-gray-300">
            {/* Contacts & Address Panel */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
              <h4 className="font-display font-bold text-xs text-[#FF6FB5] mb-2 flex items-center gap-1">
                <Phone className="w-4 h-4" /> Dados de Contato e Localização
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-500 mb-1">WhatsApp de Contato Comercial (Com DDD)</label>
                  <input
                    type="text"
                    value={siteSettings.whatsapp}
                    onChange={e => setSiteSettings(p => ({ ...p, whatsapp: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Telefone Fixo / Comercial (Exibido no site)</label>
                  <input
                    type="text"
                    value={siteSettings.phone}
                    onChange={e => setSiteSettings(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">E-mail Comercial Oficial</label>
                  <input
                    type="email"
                    value={siteSettings.email}
                    onChange={e => setSiteSettings(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Endereço Físico do Showroom</label>
                  <input
                    type="text"
                    value={siteSettings.address}
                    onChange={e => setSiteSettings(p => ({ ...p, address: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Domínio Customizado do Site (ex: www.ravicar.com)</label>
                  <input
                    type="text"
                    placeholder="ex: www.ravicar.com"
                    value={siteSettings.customDomain || ''}
                    onChange={e => setSiteSettings(p => ({ ...p, customDomain: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Insira seu domínio (sem http/https). Todos os links compartilhados no WhatsApp e copiados do estoque serão gerados automaticamente com este domínio.</p>
                </div>
              </div>
            </div>

            {/* Pix & Financial Info Panel */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
              <h4 className="font-display font-bold text-xs text-emerald-400 mb-2 flex items-center gap-1">
                <DollarSign className="w-4 h-4" /> Contas e Dados Bancários para Sinal de Reserva (PIX)
              </h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-500 mb-1">CNPJ Pix</label>
                    <input
                      type="text"
                      value={siteSettings.pixCnpj}
                      onChange={e => setSiteSettings(p => ({ ...p, pixCnpj: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Celular Pix</label>
                    <input
                      type="text"
                      value={siteSettings.pixCelular}
                      onChange={e => setSiteSettings(p => ({ ...p, pixCelular: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Chave Pix E-mail</label>
                  <input
                    type="text"
                    value={siteSettings.pixEmail}
                    onChange={e => setSiteSettings(p => ({ ...p, pixEmail: e.target.value }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-900">
                  <div>
                    <label className="block text-gray-500 mb-1">Santander (CC)</label>
                    <input
                      type="text"
                      value={siteSettings.pixSantander}
                      onChange={e => setSiteSettings(p => ({ ...p, pixSantander: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Bradesco (CC)</label>
                    <input
                      type="text"
                      value={siteSettings.pixBradesco}
                      onChange={e => setSiteSettings(p => ({ ...p, pixBradesco: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Itaú (CC)</label>
                    <input
                      type="text"
                      value={siteSettings.pixItau}
                      onChange={e => setSiteSettings(p => ({ ...p, pixItau: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Banco Inter (CC)</label>
                    <input
                      type="text"
                      value={siteSettings.pixInter}
                      onChange={e => setSiteSettings(p => ({ ...p, pixInter: e.target.value }))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Interest Rates Panel */}
            <div className="p-5 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-4">
              <h4 className="font-display font-bold text-xs text-[#FF2D8D] mb-2 flex items-center gap-1">
                <Percent className="w-4 h-4" /> Taxas de Juros Mensais (%)
              </h4>
              <p className="text-[10px] text-gray-500 leading-normal mb-1">
                Ajuste os juros das simulações de financiamento calculadas para os clientes de acordo com cada banco parceiro.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-500 mb-1">Santander</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaSantander !== undefined ? siteSettings.taxaSantander : 1.39}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaSantander: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Itaú</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaItau !== undefined ? siteSettings.taxaItau : 1.49}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaItau: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Bradesco</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaBradesco !== undefined ? siteSettings.taxaBradesco : 1.59}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaBradesco: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">BV Financeira</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaBv !== undefined ? siteSettings.taxaBv : 1.29}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaBv: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Banco PAN</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaPan !== undefined ? siteSettings.taxaPan : 1.69}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaPan: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Banco Safra</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaSafra !== undefined ? siteSettings.taxaSafra : 1.39}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaSafra: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">C6 Bank</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaC6 !== undefined ? siteSettings.taxaC6 : 1.59}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaC6: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Porto Seguro</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaPorto !== undefined ? siteSettings.taxaPorto : 1.49}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaPorto: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Creditas</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaCreditas !== undefined ? siteSettings.taxaCreditas : 1.39}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaCreditas: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Mercado Pago</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaMercadoPago !== undefined ? siteSettings.taxaMercadoPago : 1.69}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaMercadoPago: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Banco Omni</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaOmni !== undefined ? siteSettings.taxaOmni : 1.89}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaOmni: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Daycoval</label>
                  <input
                    type="number"
                    step="0.01"
                    value={siteSettings.taxaDaycoval !== undefined ? siteSettings.taxaDaycoval : 1.79}
                    onChange={e => setSiteSettings(p => ({ ...p, taxaDaycoval: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        </div> {/* Content Area col-span-9 */}
      </div> {/* Grid container cols-12 */}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[100] max-w-sm bg-neutral-900 border border-neutral-800 text-white p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in-up">
          <div className={`w-2 h-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-[#FF2D8D]'}`} />
          <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-neutral-950 border border-neutral-900 rounded-2xl max-w-md w-full overflow-hidden p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-2">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-neutral-900">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
