// Datos mock para el dashboard de eventos (demo)

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  companions: number;
  dietaryRequirements: string;
  confirmedAt: string;
  tableNumber?: number | null;
  deleted?: boolean;
  deletedAt?: string | null;
}

export interface Ticket {
  id: string;
  type: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  purchasedAt: string;
  price: number;
}

export interface DashboardStats {
  totalGuests: number;
  totalTicketsSold: number;
  totalTicketsAvailable: number;
  guestsWithDietaryRequirements: number;
  totalCompanions: number;
  ticketsByType: Record<string, number>;
  dietaryRequirementsBreakdown: Record<string, number>;
}

// Nombres y apellidos para generar datos realistas
const firstNames = [
  'María', 'Juan', 'Ana', 'Carlos', 'Laura', 'Diego', 'Sofía', 'Martín',
  'Valentina', 'Andrés', 'Camila', 'Sebastián', 'Isabella', 'Nicolás',
  'Emma', 'Fernando', 'Lucía', 'Gabriel', 'Olivia', 'Ricardo'
];

const lastNames = [
  'García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz',
  'Morales', 'Ortiz', 'Gutiérrez', 'Chávez', 'Ramos', 'Herrera'
];

const dietaryRequirements = [
  'Vegetariano',
  'Vegano',
  'Sin gluten',
  'Sin lactosa',
  'Sin nueces',
  'Halal',
  'Kosher',
  'Vegetariano, sin lactosa',
  'Vegano, sin gluten',
  'Sin mariscos'
];

// Generar invitados mock
export function generateMockGuests(count: number = 25): Guest[] {
  const guests: Guest[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const companions = Math.floor(Math.random() * 4); // 0-3 acompañantes
    const hasDietaryRequirements = Math.random() > 0.6; // 40% tienen requerimientos
    const dietaryReq = hasDietaryRequirements
      ? dietaryRequirements[Math.floor(Math.random() * dietaryRequirements.length)]
      : '';

    // Generar ID único
    let id: string;
    do {
      id = `guest-${Math.random().toString(36).substr(2, 9)}`;
    } while (usedIds.has(id));
    usedIds.add(id);

    // Fecha de confirmación aleatoria en los últimos 30 días
    const daysAgo = Math.floor(Math.random() * 30);
    const confirmedAt = new Date();
    confirmedAt.setDate(confirmedAt.getDate() - daysAgo);
    confirmedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    guests.push({
      id,
      firstName,
      lastName,
      companions,
      dietaryRequirements: dietaryReq,
      confirmedAt: confirmedAt.toISOString(),
      tableNumber: null,
      deleted: false,
      deletedAt: null
    });
  }

  return guests.sort((a, b) => 
    new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
  );
}

// Generar tickets mock
export function generateMockTickets(count: number = 40): Ticket[] {
  const tickets: Ticket[] = [];
  const ticketTypes = ['VIP', 'Regular'];
  const prices = { VIP: 2000, Regular: 1000 };

  for (let i = 0; i < count; i++) {
    const type = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const buyerName = `${firstName} ${lastName}`;
    const buyerEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`;
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 tickets

    // Fecha de compra aleatoria en los últimos 45 días
    const daysAgo = Math.floor(Math.random() * 45);
    const purchasedAt = new Date();
    purchasedAt.setDate(purchasedAt.getDate() - daysAgo);
    purchasedAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

    tickets.push({
      id: `ticket-${Math.random().toString(36).substr(2, 9)}`,
      type,
      buyerName,
      buyerEmail,
      quantity,
      purchasedAt: purchasedAt.toISOString(),
      price: prices[type as keyof typeof prices] * quantity
    });
  }

  return tickets.sort((a, b) => 
    new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()
  );
}

// Calcular estadísticas
export function calculateStats(guests: Guest[], tickets: Ticket[]): DashboardStats {
  const totalCompanions = guests.reduce((sum, guest) => sum + guest.companions, 0);
  const guestsWithDietaryRequirements = guests.filter(
    guest => guest.dietaryRequirements && guest.dietaryRequirements.trim() !== ''
  ).length;

  // Tickets por tipo
  const ticketsByType: Record<string, number> = {};
  tickets.forEach(ticket => {
    ticketsByType[ticket.type] = (ticketsByType[ticket.type] || 0) + ticket.quantity;
  });

  // Requerimientos alimentarios agrupados
  const dietaryRequirementsBreakdown: Record<string, number> = {};
  guests.forEach(guest => {
    if (guest.dietaryRequirements && guest.dietaryRequirements.trim() !== '') {
      const reqs = guest.dietaryRequirements.split(',').map(r => r.trim());
      reqs.forEach(req => {
        dietaryRequirementsBreakdown[req] = (dietaryRequirementsBreakdown[req] || 0) + 1;
      });
    }
  });

  // Total de tickets disponibles (simulado basado en configuración)
  const totalTicketsSold = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0);
  const totalTicketsAvailable = Math.max(0, 200 - totalTicketsSold); // Simulado: máximo 200 tickets

  return {
    totalGuests: guests.length,
    totalTicketsSold,
    totalTicketsAvailable,
    guestsWithDietaryRequirements,
    totalCompanions,
    ticketsByType,
    dietaryRequirementsBreakdown
  };
}

// Generar datos completos para el dashboard
export function generateDashboardData() {
  const guests = generateMockGuests(28);
  const tickets = generateMockTickets(45);
  const stats = calculateStats(guests, tickets);

  return {
    guests,
    tickets,
    stats
  };
}



