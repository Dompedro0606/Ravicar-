export type VehicleStatus = 'Disponível' | 'Reservado' | 'Vendido';
export type FuelType = 'Gasolina' | 'Etanol' | 'Flex' | 'Diesel' | 'Híbrido' | 'Elétrico';
export type TransmissionType = 'Manual' | 'Automático';
export type UserRole = 'Administrador' | 'Vendedor' | 'Cliente';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface Vehicle {
  id: string;
  title: string;
  brand: string;
  model: string;
  year: string; // e.g. "2020/2021"
  mileage: number;
  color: string;
  fuel: FuelType;
  transmission: TransmissionType;
  engine: string;
  power: string;
  options: string[];
  description: string;
  price: number;
  status: VehicleStatus;
  media: MediaItem[];
  featured: boolean;
  newlyArrived: boolean;
  createdAt: string;
  createdBy: string; // user ID
  views?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  rating: number;
  text: string;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface LeadMessage {
  id: string;
  type: 'Contato' | 'Agendamento' | 'Financiamento' | 'Avaliação' | 'WhatsAppClick';
  name: string;
  email?: string;
  phone: string;
  vehicleId?: string;
  vehicleName?: string;
  message?: string;
  date: string;
  status: 'Pendente' | 'Atendido';
  details?: {
    visitDate?: string;
    visitTime?: string;
    downPayment?: string;
    cpf?: string;
    birthDate?: string;
    tradeVehicleBrand?: string;
    tradeVehicleModel?: string;
    tradeVehicleYear?: string;
    tradeVehicleKm?: string;
    tradeVehicleColor?: string;
  };
}

export interface SiteSettings {
  whatsapp: string;
  phone: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  hoursWeekday: string;
  hoursSaturday: string;
  pixCnpj: string;
  pixCelular: string;
  pixEmail: string;
  pixSantander: string;
  pixBradesco: string;
  pixItau: string;
  pixInter: string;
  customDomain?: string;
}
