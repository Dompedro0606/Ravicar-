import fs from 'fs';
import path from 'path';

const dbDir = fs.existsSync('/data') ? '/data' : process.cwd();
const dbPath = path.join(dbDir, 'db.json');

function readDb(): any {
  try {
    if (!fs.existsSync(dbPath)) {
      return {
        users: [],
        vehicles: [],
        testimonials: [],
        banners: [],
        messages: [],
        clients: [],
        settings: {}
      };
    }
    const content = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading db.json:', error);
    return {
      users: [],
      vehicles: [],
      testimonials: [],
      banners: [],
      messages: [],
      clients: [],
      settings: {}
    };
  }
}

function writeDb(data: any) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing db.json:', error);
  }
}

export function initFirebase() {
  console.log('[Database] Storage mode: local db.json.');
  return null;
}

export async function migrateIfNeeded() {
  console.log('[Database] Storage is local db.json. No migration needed.');
}

// Users Helpers
export async function getUsers() {
  const data = readDb();
  return data.users || [];
}

export async function getUser(id: string) {
  const users = await getUsers();
  return users.find((u: any) => u.id === id) || null;
}

export async function saveUser(user: any) {
  const dbData = readDb();
  if (!dbData.users) dbData.users = [];
  const index = dbData.users.findIndex((u: any) => u.id === user.id);
  if (index >= 0) {
    dbData.users[index] = user;
  } else {
    dbData.users.push(user);
  }
  writeDb(dbData);
  return user;
}

export async function deleteUser(id: string) {
  const dbData = readDb();
  if (!dbData.users) dbData.users = [];
  dbData.users = dbData.users.filter((u: any) => u.id !== id);
  writeDb(dbData);
}

// Vehicles Helpers
export async function getVehicles() {
  const dbData = readDb();
  const list = dbData.vehicles || [];
  return list.sort((a: any, b: any) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function getVehicle(id: string) {
  const list = await getVehicles();
  return list.find((v: any) => v.id === id) || null;
}

export async function saveVehicle(vehicle: any) {
  const dbData = readDb();
  if (!dbData.vehicles) dbData.vehicles = [];
  const index = dbData.vehicles.findIndex((v: any) => v.id === vehicle.id);
  if (index >= 0) {
    dbData.vehicles[index] = vehicle;
  } else {
    dbData.vehicles.push(vehicle);
  }
  writeDb(dbData);
  return vehicle;
}

export async function deleteVehicle(id: string) {
  const dbData = readDb();
  if (!dbData.vehicles) dbData.vehicles = [];
  dbData.vehicles = dbData.vehicles.filter((v: any) => v.id !== id);
  writeDb(dbData);
}

// Testimonials Helpers
export async function getTestimonials() {
  const dbData = readDb();
  const list = dbData.testimonials || [];
  return list.sort((a: any, b: any) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function saveTestimonial(testimonial: any) {
  const dbData = readDb();
  if (!dbData.testimonials) dbData.testimonials = [];
  const index = dbData.testimonials.findIndex((t: any) => t.id === testimonial.id);
  if (index >= 0) {
    dbData.testimonials[index] = testimonial;
  } else {
    dbData.testimonials.push(testimonial);
  }
  writeDb(dbData);
  return testimonial;
}

export async function deleteTestimonial(id: string) {
  const dbData = readDb();
  if (!dbData.testimonials) dbData.testimonials = [];
  dbData.testimonials = dbData.testimonials.filter((t: any) => t.id !== id);
  writeDb(dbData);
}

// Leads/Messages Helpers
export async function getLeads() {
  const dbData = readDb();
  const list = dbData.messages || [];
  return list.sort((a: any, b: any) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });
}

export async function getLead(id: string) {
  const list = await getLeads();
  return list.find((l: any) => l.id === id) || null;
}

export async function saveLead(lead: any) {
  const dbData = readDb();
  if (!dbData.messages) dbData.messages = [];
  const index = dbData.messages.findIndex((m: any) => m.id === lead.id);
  if (index >= 0) {
    dbData.messages[index] = lead;
  } else {
    dbData.messages.push(lead);
  }
  writeDb(dbData);
  return lead;
}

// Settings Helpers
export async function getSettings() {
  const dbData = readDb();
  return dbData.settings || {};
}

export async function saveSettings(settings: any) {
  const dbData = readDb();
  dbData.settings = { ...(dbData.settings || {}), ...settings };
  writeDb(dbData);
  return settings;
}

// Clients Helpers
export async function getClients() {
  const dbData = readDb();
  const list = dbData.clients || [];
  return list.sort((a: any, b: any) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function getClient(id: string) {
  const list = await getClients();
  return list.find((c: any) => c.id === id) || null;
}

export async function saveClient(client: any) {
  const dbData = readDb();
  if (!dbData.clients) dbData.clients = [];
  const index = dbData.clients.findIndex((c: any) => c.id === client.id);
  if (index >= 0) {
    dbData.clients[index] = client;
  } else {
    dbData.clients.push(client);
  }
  writeDb(dbData);
  return client;
}

export async function deleteClient(id: string) {
  const dbData = readDb();
  if (!dbData.clients) dbData.clients = [];
  dbData.clients = dbData.clients.filter((c: any) => c.id !== id);
  writeDb(dbData);
}

// Notifications Helpers
export async function getNotifications() {
  const dbData = readDb();
  const list = dbData.notifications || [];
  return list.sort((a: any, b: any) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function saveNotification(notif: any) {
  const dbData = readDb();
  if (!dbData.notifications) dbData.notifications = [];
  const index = dbData.notifications.findIndex((n: any) => n.id === notif.id);
  if (index >= 0) {
    dbData.notifications[index] = notif;
  } else {
    dbData.notifications.push(notif);
  }
  writeDb(dbData);
  return notif;
}

export async function clearNotifications() {
  const dbData = readDb();
  dbData.notifications = [];
  writeDb(dbData);
}
