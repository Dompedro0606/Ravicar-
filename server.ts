import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { Vehicle, UserProfile, Testimonial, Banner, LeadMessage, SiteSettings } from './src/types';
import {
  initFirebase,
  migrateIfNeeded,
  getUsers,
  getUser,
  saveUser,
  deleteUser,
  getVehicles,
  getVehicle,
  saveVehicle,
  deleteVehicle,
  getTestimonials,
  saveTestimonial,
  deleteTestimonial,
  getLeads,
  getLead,
  saveLead,
  getSettings,
  saveSettings,
  getClients,
  getClient,
  saveClient,
  deleteClient
} from './src/lib/firebase-db';

// Password hash helper
function sha256(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

const JWT_SECRET = process.env.JWT_SECRET || 'ravicar_secret_key_1783395977905';

function generateToken(userId: string): string {
  const timestamp = Date.now().toString();
  const signature = sha256(`${userId}:${timestamp}:${JWT_SECRET}`);
  return `${userId}.${timestamp}.${signature}`;
}

function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [userId, timestamp, signature] = parts;
    const expectedSignature = sha256(`${userId}:${timestamp}:${JWT_SECRET}`);
    if (signature !== expectedSignature) return null;
    
    // Check if token is older than 30 days
    const age = Date.now() - Number(timestamp);
    if (age > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return userId;
  } catch (e) {
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// High limits for image/video base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure upload folders exist
const publicUploadsDir = fs.existsSync('/data')
  ? '/data/uploads'
  : path.join(process.cwd(), 'public', 'uploads');

if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// Middleware to authorize session token
async function getAuthUser(req: express.Request): Promise<any | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  const userId = verifyToken(token);
  if (!userId) return null;

  return await getUser(userId);
}

// Require auth middleware
async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Acesso não autorizado. Por favor, faça login novamente.' });
  }
  (req as any).user = user;
  next();
}

// Require admin middleware
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await getAuthUser(req);
  if (!user || user.role !== 'Administrador') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
  (req as any).user = user;
  next();
}

// --- API ROUTES ---

// 1. Auth Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const emailClean = email.trim().toLowerCase();
  const passwordClean = password.trim();

  const users = await getUsers();
  const user = users.find((u: any) => u.email.toLowerCase() === emailClean);
  
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const hash = sha256(passwordClean);
  if (user.passwordHash !== hash) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  // Generate session token
  const token = generateToken(user.id);

  // Return user (excluding passwordHash) and token
  const { passwordHash, ...userProfile } = user;
  return res.json({ token, user: userProfile });
});

// 1b. Auth Register (for Clients)
app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios para o cadastro.' });
  }

  const emailClean = email.trim().toLowerCase();
  const nameClean = name.trim();
  const phoneClean = phone.trim();
  const passwordClean = password.trim();

  const users = await getUsers();
  const existingUser = users.find((u: any) => u.email.toLowerCase() === emailClean);
  if (existingUser) {
    return res.status(400).json({ error: 'Já existe uma conta cadastrada com este e-mail.' });
  }

  const hash = crypto.createHash('sha256').update(passwordClean).digest('hex');
  const newUser = {
    id: 'user-' + Date.now(),
    name: nameClean,
    email: emailClean,
    phone: phoneClean,
    role: 'Cliente',
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };

  await saveUser(newUser);

  // Generate session token
  const token = generateToken(newUser.id);
  const { passwordHash, ...userProfile } = newUser;
  return res.json({ token, user: userProfile });
});

// 1c. Update profile
app.put('/api/auth/me', requireAuth, async (req, res) => {
  const userId = (req as any).user.id;
  const { name, email, phone, password } = req.body;

  const users = await getUsers();
  const user = users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  if (email) {
    const emailClean = email.trim().toLowerCase();
    const otherUser = users.find((u: any) => u.email.toLowerCase() === emailClean && u.id !== userId);
    if (otherUser) {
      return res.status(400).json({ error: 'E-mail já está sendo utilizado por outra conta.' });
    }
    user.email = emailClean;
  }

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();
  if (password && password.trim()) {
    user.passwordHash = crypto.createHash('sha256').update(password.trim()).digest('hex');
  }

  await saveUser(user);
  const { passwordHash, ...userProfile } = user;
  return res.json(userProfile);
});

// 2. Auth Logout
app.post('/api/auth/logout', (req, res) => {
  // Stateless tokens are discarded on the client side, but we return success here
  return res.json({ success: true });
});

// 3. Auth Me
app.get('/api/auth/me', async (req, res) => {
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Sessão expirada.' });
  }
  const { passwordHash, ...userProfile } = user;
  return res.json(userProfile);
});

// 4. Vehicles (GET - Public)
app.get('/api/vehicles', async (req, res) => {
  const vehicles = await getVehicles();
  return res.json(vehicles);
});

// 5. Vehicle Details & increment views (GET - Public)
app.get('/api/vehicles/:id', async (req, res) => {
  const car = await getVehicle(req.params.id);
  if (!car) {
    return res.status(404).json({ error: 'Veículo não encontrado.' });
  }
  
  // Increment view count
  car.views = (car.views || 0) + 1;
  await saveVehicle(car);

  return res.json(car);
});

// 6. Add Vehicle (POST - Admin or Seller)
app.post('/api/vehicles', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const newCar: Vehicle = {
    ...req.body,
    id: `car-${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy: user.id,
    views: 0
  };

  // Basic validation
  if (!newCar.title || !newCar.brand || !newCar.model || !newCar.price) {
    return res.status(400).json({ error: 'Título, marca, modelo e valor são obrigatórios.' });
  }

  await saveVehicle(newCar);
  return res.json(newCar);
});

// 7. Edit Vehicle (PUT - Admin or Seller)
app.put('/api/vehicles/:id', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const existingCar = await getVehicle(req.params.id);

  if (!existingCar) {
    return res.status(404).json({ error: 'Veículo não encontrado.' });
  }

  // If user is a Vendedor, they can only edit their own vehicles
  if (user.role === 'Vendedor' && existingCar.createdBy !== user.id) {
    return res.status(403).json({ error: 'Você só pode editar veículos cadastrados por você mesmo.' });
  }

  // Update fields
  const updatedCar = {
    ...existingCar,
    ...req.body,
    id: existingCar.id, // preserve ID
    createdAt: existingCar.createdAt, // preserve creation date
    createdBy: existingCar.createdBy, // preserve owner
    views: existingCar.views || 0
  };

  await saveVehicle(updatedCar);
  return res.json(updatedCar);
});

// 8. Delete Vehicle (DELETE - Admin only or Owner)
app.delete('/api/vehicles/:id', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const car = await getVehicle(req.params.id);

  if (!car) {
    return res.status(404).json({ error: 'Veículo não encontrado.' });
  }

  // Non-admins can only delete their own cars
  if (user.role === 'Vendedor' && car.createdBy !== user.id) {
    return res.status(403).json({ error: 'Apenas administradores ou o vendedor que cadastrou o veículo podem excluí-lo.' });
  }

  await deleteVehicle(req.params.id);
  return res.json({ success: true });
});

// 9. Base64 Multi-Media Upload
app.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { name, base64 } = req.body;
    if (!name || !base64) {
      return res.status(400).json({ error: 'Nome e base64 são campos obrigatórios.' });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Formato base64 inválido.' });
    }

    const fileBuffer = Buffer.from(matches[2], 'base64');
    const fileExt = path.extname(name) || (matches[1].includes('video') ? '.mp4' : '.jpg');
    const uniqueName = `media-${Date.now()}-${Math.random().toString(36).substring(2, 11)}${fileExt}`;
    const filePath = path.join(publicUploadsDir, uniqueName);

    fs.writeFileSync(filePath, fileBuffer);

    // Save to dist/uploads as well if running from dist
    const distUploadsDir = path.join(process.cwd(), 'dist', 'uploads');
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      if (!fs.existsSync(distUploadsDir)) {
        fs.mkdirSync(distUploadsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(distUploadsDir, uniqueName), fileBuffer);
    }

    return res.json({ url: `/uploads/${uniqueName}` });
  } catch (err: any) {
    console.error('Upload Error:', err);
    return res.status(500).json({ error: 'Erro no servidor ao processar o upload do arquivo.' });
  }
});

// 10. Users management (Admin only)
app.get('/api/users', requireAdmin, async (req, res) => {
  const users = await getUsers();
  // Map users to remove password hashes before returning
  const profiles = users.map(({ passwordHash, ...p }: any) => p);
  return res.json(profiles);
});

app.post('/api/users', requireAdmin, async (req, res) => {
  const { email, name, role, phone, password } = req.body;
  if (!email || !name || !role || !password) {
    return res.status(400).json({ error: 'Nome, E-mail, Cargo e Senha são campos obrigatórios.' });
  }

  const users = await getUsers();
  if (users.some((u: any) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    name,
    role,
    phone: phone || '',
    passwordHash: sha256(password),
    createdAt: new Date().toISOString()
  };

  await saveUser(newUser);

  const { passwordHash, ...profile } = newUser;
  return res.json(profile);
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  // Prevent deleting oneself
  const admin = (req as any).user;
  if (admin.id === req.params.id) {
    return res.status(400).json({ error: 'Você não pode excluir a sua própria conta de administrador.' });
  }

  const user = await getUser(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  await deleteUser(req.params.id);
  return res.json({ success: true });
});

// 11. Leads and Forms
app.get('/api/leads/client', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const leads = await getLeads();
  
  // Filter leads that belong to this client (by email or phone)
  const clientLeads = leads.filter((lead: any) => {
    const emailMatch = user.email && lead.email && lead.email.toLowerCase() === user.email.toLowerCase();
    
    // Clean up non-digits to compare phone numbers flexibly
    const cleanUserPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
    const cleanLeadPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
    const phoneMatch = cleanUserPhone && cleanLeadPhone && (cleanLeadPhone.includes(cleanUserPhone) || cleanUserPhone.includes(cleanLeadPhone));
    
    return emailMatch || phoneMatch;
  });
  
  return res.json(clientLeads);
});

app.get('/api/leads', requireAuth, async (req, res) => {
  const leads = await getLeads();
  return res.json(leads);
});

app.post('/api/leads', async (req, res) => {
  const newLead: LeadMessage = {
    ...req.body,
    id: `lead-${Date.now()}`,
    date: new Date().toISOString(),
    status: 'Pendente'
  };

  if (!newLead.name || !newLead.phone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
  }

  await saveLead(newLead);
  return res.json(newLead);
});

app.put('/api/leads/:id', requireAuth, async (req, res) => {
  const lead = await getLead(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Contato não encontrado.' });
  }

  lead.status = req.body.status || 'Atendido';
  await saveLead(lead);
  return res.json(lead);
});

// 12. Settings management
app.get('/api/settings', async (req, res) => {
  const settings = await getSettings();
  return res.json(settings);
});

app.put('/api/settings', requireAdmin, async (req, res) => {
  const currentSettings = await getSettings();
  const updatedSettings = {
    ...currentSettings,
    ...req.body
  };
  await saveSettings(updatedSettings);
  return res.json(updatedSettings);
});

// 13. Testimonials
app.get('/api/testimonials', async (req, res) => {
  const testimonials = await getTestimonials();
  return res.json(testimonials);
});

app.post('/api/testimonials', requireAdmin, async (req, res) => {
  const { name, role, rating, text } = req.body;
  if (!name || !text || !rating) {
    return res.status(400).json({ error: 'Nome, avaliação e texto são obrigatórios.' });
  }

  const newTestimonial: Testimonial = {
    id: `test-${Date.now()}`,
    name,
    role: role || 'Cliente',
    rating: Number(rating),
    text,
    createdAt: new Date().toISOString()
  };

  await saveTestimonial(newTestimonial);
  return res.json(newTestimonial);
});

app.delete('/api/testimonials/:id', requireAdmin, async (req, res) => {
  await deleteTestimonial(req.params.id);
  return res.json({ success: true });
});

// 14. Clients management
app.get('/api/clients', requireAuth, async (req, res) => {
  const clients = await getClients();
  return res.json(clients);
});

app.post('/api/clients', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const { name, phone, email, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Nome e telefone são obrigatórios.' });
  }

  const newClient = {
    id: `client-${Date.now()}`,
    name,
    phone,
    email: email || '',
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: user.id
  };

  await saveClient(newClient);
  return res.json(newClient);
});

app.put('/api/clients/:id', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const existingClient = await getClient(req.params.id);
  if (!existingClient) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  // Check if seller created this client or is admin
  if (user.role === 'Vendedor' && existingClient.createdBy !== user.id) {
    return res.status(403).json({ error: 'Você só pode editar clientes cadastrados por você.' });
  }

  const updatedClient = {
    ...existingClient,
    ...req.body,
    id: existingClient.id,
    createdBy: existingClient.createdBy,
    createdAt: existingClient.createdAt
  };

  await saveClient(updatedClient);
  return res.json(updatedClient);
});

app.delete('/api/clients/:id', requireAuth, async (req, res) => {
  const user = (req as any).user;
  const client = await getClient(req.params.id);
  if (!client) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  if (user.role === 'Vendedor' && client.createdBy !== user.id) {
    return res.status(403).json({ error: 'Você só pode excluir clientes cadastrados por você.' });
  }

  await deleteClient(req.params.id);
  return res.json({ success: true });
});

// Serve uploads directory statically (Vite and Express will handle this)
app.use('/uploads', express.static(publicUploadsDir));

// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  // Initialize and migrate Firebase database if empty
  try {
    initFirebase();
    await migrateIfNeeded();
  } catch (error) {
    console.error('Failed to initialize and migrate Firebase database:', error);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Serve uploads from dist if they were copied there, or public
    app.use('/uploads', express.static(path.join(distPath, 'uploads')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RaviCar server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();

