/**
 * Turnero Web App - Almacenamiento Central de Usuarios, Sesiones y Turnos
 * Soporta roles: 'cliente' y 'peluquero'
 * Estados de turno: 'pendiente', 'atendido', 'no-atendido'
 */

const STORAGE_KEYS = {
  USERS: 'turnero_webapp_users',
  SESSION: 'turnero_webapp_session',
  APPOINTMENTS: 'turnero_webapp_appointments'
};

const TIME_SLOTS = {
  morning: ['09:00', '09:45', '10:30', '11:15', '12:00', '12:45'],
  afternoon: ['14:00', '14:45', '15:30', '16:15', '17:00', '17:45'],
  evening: ['18:30', '19:15', '20:00']
};

const ALL_TIME_SLOTS = [
  ...TIME_SLOTS.morning,
  ...TIME_SLOTS.afternoon,
  ...TIME_SLOTS.evening
];

class TurneroStore {
  constructor() {
    this.ensureSeedData();
  }

  getTodayIso() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getOffsetDateIso(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  ensureSeedData() {
    const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existingUsers) {
      const seedUsers = [
        {
          id: 'usr_cli_1',
          role: 'cliente',
          fullName: 'Martín Pérez',
          birthDate: '1996-05-14',
          dni: '39456123',
          phone: '+54 9 11 4589-2311',
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr_bar_1',
          role: 'peluquero',
          fullName: 'Nicolás Lombardo',
          birthDate: '1990-11-22',
          dni: '35112890',
          phone: '+54 9 11 6789-4321',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(seedUsers));
    }

    const existingApps = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!existingApps) {
      const today = this.getTodayIso();
      const yesterday = this.getOffsetDateIso(-1);
      const tomorrow = this.getOffsetDateIso(1);

      const seedAppointments = [
        {
          id: 'trn_1001',
          date: yesterday,
          time: '10:30',
          clientId: 'usr_cli_demo1',
          clientName: 'Alejandro Rossi',
          clientBirthDate: '1992-03-10',
          clientDni: '36789012',
          clientPhone: '+54 9 11 5541-8890',
          status: 'atendido',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'trn_1002',
          date: yesterday,
          time: '15:30',
          clientId: 'usr_cli_demo2',
          clientName: 'Facundo Gómez',
          clientBirthDate: '1998-08-25',
          clientDni: '41234567',
          clientPhone: '+54 9 11 3214-9988',
          status: 'no-atendido',
          createdAt: new Date(Date.now() - 82000000).toISOString()
        },
        {
          id: 'trn_1003',
          date: today,
          time: '09:45',
          clientId: 'usr_cli_demo3',
          clientName: 'Mariano Benítez',
          clientBirthDate: '1989-01-19',
          clientDni: '34567891',
          clientPhone: '+54 9 11 6723-4112',
          status: 'atendido',
          createdAt: new Date(Date.now() - 18000000).toISOString()
        },
        {
          id: 'trn_1004',
          date: today,
          time: '14:45',
          clientId: 'usr_cli_demo4',
          clientName: 'Santiago Villar',
          clientBirthDate: '1995-07-03',
          clientDni: '38901234',
          clientPhone: '+54 9 11 9832-1100',
          status: 'pendiente',
          createdAt: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'trn_1005',
          date: today,
          time: '18:30',
          clientId: 'usr_cli_1',
          clientName: 'Martín Pérez',
          clientBirthDate: '1996-05-14',
          clientDni: '39456123',
          clientPhone: '+54 9 11 4589-2311',
          status: 'pendiente',
          createdAt: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'trn_1006',
          date: tomorrow,
          time: '11:15',
          clientId: 'usr_cli_demo5',
          clientName: 'Rodrigo Méndez',
          clientBirthDate: '2000-12-05',
          clientDni: '42876543',
          clientPhone: '+54 9 11 2289-7654',
          status: 'pendiente',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(seedAppointments));
    }
  }

  /* ==================== VALIDACIONES ==================== */

  validateUserFields({ fullName, birthDate, dni, phone }) {
    const cleanName = String(fullName || '').trim();
    if (cleanName.length < 3) {
      throw new Error('Por favor ingresá un Nombre y Apellido válido (mínimo 3 caracteres).');
    }

    const cleanDni = String(dni || '').replace(/\D/g, '');
    if (cleanDni.length < 7 || cleanDni.length > 9) {
      throw new Error('Por favor ingresá un DNI válido (entre 7 y 9 números, sin puntos).');
    }

    if (!birthDate) {
      throw new Error('Por favor seleccioná tu fecha de nacimiento.');
    }
    const birthObj = new Date(birthDate + 'T00:00:00');
    const today = new Date();
    if (isNaN(birthObj.getTime()) || birthObj >= today || birthObj.getFullYear() < 1920) {
      throw new Error('Por favor ingresá una fecha de nacimiento válida.');
    }

    const cleanPhoneDigits = String(phone || '').replace(/\D/g, '');
    if (cleanPhoneDigits.length < 8) {
      throw new Error('Por favor ingresá un número de teléfono válido (al menos 8 dígitos).');
    }

    return {
      cleanName,
      cleanDni,
      birthDate,
      cleanPhone: String(phone).trim()
    };
  }

  /* ==================== USUARIOS Y SESIÓN ==================== */

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    } catch (e) {
      return [];
    }
  }

  saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION)) || null;
    } catch (e) {
      return null;
    }
  }

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    }
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    window.location.href = 'index.html';
  }

  registerUser(userData) {
    const { cleanName, cleanDni, birthDate, cleanPhone } = this.validateUserFields(userData);
    const users = this.getUsers();

    const existingIndex = users.findIndex(
      u => String(u.dni).replace(/\D/g, '') === cleanDni && u.role === userData.role
    );

    const newUser = {
      id: existingIndex >= 0 ? users[existingIndex].id : `usr_${userData.role.slice(0, 3)}_${Date.now()}`,
      role: userData.role, // 'cliente' | 'peluquero'
      fullName: cleanName,
      birthDate,
      dni: cleanDni,
      phone: cleanPhone,
      createdAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      users[existingIndex] = newUser;
    } else {
      users.push(newUser);
    }

    this.saveUsers(users);
    this.setCurrentUser(newUser);
    return newUser;
  }

  loginByDni(dni, role = null) {
    const cleanDni = String(dni || '').replace(/\D/g, '');
    if (!cleanDni) return null;

    const users = this.getUsers();
    const user = users.find(u => {
      const matchDni = String(u.dni).replace(/\D/g, '') === cleanDni;
      return role ? (matchDni && u.role === role) : matchDni;
    });

    if (!user) {
      return null;
    }

    this.setCurrentUser(user);
    return user;
  }

  /* ==================== TURNOS ==================== */

  getAppointments() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) || [];
    } catch (e) {
      return [];
    }
  }

  saveAppointments(appointments) {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  }

  getAppointmentsByDate(dateStr) {
    return this.getAppointments().filter(a => a.date === dateStr);
  }

  isSlotOccupied(dateStr, timeStr) {
    return this.getAppointments().some(a => a.date === dateStr && a.time === timeStr);
  }

  isSlotInPast(dateStr, timeStr) {
    const todayStr = this.getTodayIso();
    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;

    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const slotMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slotMinutes <= nowMinutes;
  }

  getAppointmentAtSlot(dateStr, timeStr) {
    return this.getAppointments().find(a => a.date === dateStr && a.time === timeStr) || null;
  }

  createAppointment(data) {
    if (this.isSlotInPast(data.date, data.time)) {
      throw new Error(`El horario de las ${data.time} hs ya pasó. Por favor elegí un horario posterior.`);
    }

    if (this.isSlotOccupied(data.date, data.time)) {
      throw new Error(`El horario de las ${data.time} hs en la fecha ${this.formatDateDisplay(data.date)} ya se encuentra ocupado.`);
    }

    const appointments = this.getAppointments();
    const newTurn = {
      id: 'trn_' + Date.now(),
      date: data.date,
      time: data.time,
      clientId: data.clientId || null,
      clientName: data.clientName.trim(),
      clientBirthDate: data.clientBirthDate || '',
      clientDni: String(data.clientDni || '').trim(),
      clientPhone: data.clientPhone.trim(),
      status: 'pendiente', // 'pendiente' | 'atendido' | 'no-atendido'
      createdAt: new Date().toISOString()
    };

    appointments.push(newTurn);
    this.saveAppointments(appointments);
    return newTurn;
  }

  updateAppointmentStatus(turnId, newStatus) {
    const validStatuses = ['pendiente', 'atendido', 'no-atendido'];
    if (!validStatuses.includes(newStatus)) return null;

    const appointments = this.getAppointments();
    const target = appointments.find(a => a.id === turnId);
    if (!target) return null;

    target.status = newStatus;
    target.updatedAt = new Date().toISOString();
    this.saveAppointments(appointments);
    return target;
  }

  deleteAppointment(turnId) {
    const appointments = this.getAppointments().filter(a => a.id !== turnId);
    this.saveAppointments(appointments);
  }

  /* ==================== UTILIDADES DE FORMATO ==================== */

  formatDateDisplay(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
}

window.turneroStore = new TurneroStore();
window.TIME_SLOTS = TIME_SLOTS;
window.ALL_TIME_SLOTS = ALL_TIME_SLOTS;
