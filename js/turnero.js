/**
 * Turnero Peluquería - Gestión de Horarios y Turnos
 * Visualización de turnos disponibles y ocupados por fecha,
 * asignación de turnos y estados en tiempo real.
 */

class TurneroManager {
  constructor() {
    this.appointments = [];
    this.currentDate = this.getTodayDateString();
    this.allTimeSlots = [
      '09:00', '09:45', '10:30', '11:15', '12:00', '12:45',
      '14:00', '14:45', '15:30', '16:15', '17:00', '17:45',
      '18:30', '19:15', '20:00'
    ];
    this.init();
  }

  getTodayDateString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  init() {
    this.loadAppointments();
    this.setupListeners();
    this.renderTurnero();
    this.updateKPIs();
  }

  loadAppointments() {
    const saved = localStorage.getItem('barberpro_appointments');
    if (saved) {
      try {
        this.appointments = JSON.parse(saved);
        return;
      } catch (e) {
        console.error('Error cargando turnos', e);
      }
    }

    const today = this.getTodayDateString();
    this.appointments = [
      {
        id: 'turn_101',
        date: today,
        time: '09:00',
        clientName: 'Alejandro Rossi',
        clientPhone: '+54 9 11 5541-8890',
        status: 'completado',
        notes: 'Corte clásico'
      },
      {
        id: 'turn_102',
        date: today,
        time: '10:30',
        clientName: 'Facundo Gómez',
        clientPhone: '+54 9 11 3214-9988',
        status: 'completado',
        notes: 'Corte + barba'
      },
      {
        id: 'turn_103',
        date: today,
        time: '11:15',
        clientName: 'Mariano Benítez',
        clientPhone: '+54 9 11 6723-4112',
        status: 'completado',
        notes: ''
      },
      {
        id: 'turn_104',
        date: today,
        time: '14:45',
        clientName: 'Santiago Villar',
        clientPhone: '+54 9 11 9832-1100',
        status: 'en-sillon',
        notes: 'En atención ahora'
      },
      {
        id: 'turn_105',
        date: today,
        time: '16:30',
        clientName: 'Martín Pérez',
        clientPhone: '+54 9 11 4589-2311',
        status: 'confirmado',
        notes: 'Próximo turno (Aviso 30 min)'
      },
      {
        id: 'turn_106',
        date: today,
        time: '18:30',
        clientName: 'Rodrigo Méndez',
        clientPhone: '+54 9 11 2289-7654',
        status: 'confirmado',
        notes: 'Fade medio'
      },
      {
        id: 'turn_107',
        date: today,
        time: '20:00',
        clientName: 'Lucas D’Alessandro',
        clientPhone: '+54 9 11 7654-3210',
        status: 'confirmado',
        notes: ''
      }
    ];

    this.saveAppointments();
  }

  saveAppointments() {
    localStorage.setItem('barberpro_appointments', JSON.stringify(this.appointments));
  }

  setupListeners() {
    const dateInput = document.getElementById('turneroDateFilter');
    if (dateInput) {
      dateInput.value = this.currentDate;
      dateInput.addEventListener('change', (e) => {
        this.currentDate = e.target.value;
        this.renderTurnero();
        this.updateKPIs();
      });
    }

    const btnOpenManual = document.getElementById('btnOpenManualTurnModal');
    const modalManual = document.getElementById('manualTurnModal');
    const btnCloseManual = document.getElementById('btnCloseManualModal');
    const formManual = document.getElementById('manualTurnForm');

    if (btnOpenManual && modalManual) {
      btnOpenManual.addEventListener('click', () => {
        const manualDateInput = document.getElementById('manualDate');
        if (manualDateInput) manualDateInput.value = this.currentDate;
        modalManual.classList.add('active');
      });
    }

    if (btnCloseManual && modalManual) {
      btnCloseManual.addEventListener('click', () => {
        modalManual.classList.remove('active');
      });
    }

    if (formManual) {
      formManual.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleManualTurnSubmit();
      });
    }
  }

  getAppointmentsForDate(dateStr) {
    return this.appointments.filter(app => app.date === dateStr);
  }

  isSlotBooked(dateStr, timeStr) {
    return this.appointments.some(app => {
      if (app.date !== dateStr || app.time !== timeStr) return false;
      if (app.status === 'cancelado') return false;
      return true;
    });
  }

  addAppointment(bookingData) {
    const newAppointment = {
      id: 'turn_' + Date.now(),
      date: bookingData.date,
      time: bookingData.time,
      clientName: bookingData.clientName,
      clientPhone: bookingData.clientPhone || '+54 9 11 0000-0000',
      status: 'confirmado',
      notes: bookingData.notes || '',
      bookedAt: new Date().toISOString()
    };

    this.appointments.push(newAppointment);
    this.saveAppointments();

    if (window.barberNotificationEngine) {
      window.barberNotificationEngine.playAudioAlert('booking');
      window.barberNotificationEngine.showToast(
        '✂️ ¡Nuevo Turno Agendado!',
        `${newAppointment.clientName} se anotó para las ${newAppointment.time} hs.`,
        '📅',
        'success'
      );
      window.barberNotificationEngine.logNotification(
        'booking',
        `Nuevo turno de corte: ${newAppointment.clientName}`,
        `Anotado para las ${newAppointment.time} hs`
      );
    }

    this.renderTurnero();
    this.updateKPIs();
    return newAppointment;
  }

  handleManualTurnSubmit() {
    const clientName = document.getElementById('manualClientName').value.trim();
    const clientPhone = document.getElementById('manualClientPhone').value.trim();
    const date = document.getElementById('manualDate').value;
    const time = document.getElementById('manualTimeSelect').value;
    const notes = document.getElementById('manualNotes').value.trim();

    if (!clientName || !time || !date) {
      alert('Por favor completá los campos obligatorios');
      return;
    }

    if (this.isSlotBooked(date, time)) {
      alert(`El horario ${time} ya está ocupado. Por favor seleccioná otro horario.`);
      return;
    }

    this.addAppointment({
      clientName,
      clientPhone,
      date,
      time,
      notes
    });

    document.getElementById('manualTurnModal').classList.remove('active');
    document.getElementById('manualTurnForm').reset();
  }

  updateStatus(appointmentId, newStatus) {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) return;

    app.status = newStatus;
    this.saveAppointments();
    this.renderTurnero();
    this.updateKPIs();

    const statusLabels = {
      'en-sillon': 'Cliente en atención ahora',
      'completado': 'Turno completado / Atendido',
      'cancelado': 'Turno liberado'
    };

    if (window.barberNotificationEngine) {
      window.barberNotificationEngine.showToast(
        'Turnero Actualizado',
        `${app.clientName} (${app.time} hs): ${statusLabels[newStatus] || newStatus}`,
        '✂️',
        'info'
      );
    }
  }

  sendWhatsAppReminder(appointmentId) {
    const app = this.appointments.find(a => a.id === appointmentId);
    if (!app) return;

    const cleanPhone = app.clientPhone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `¡Hola ${app.clientName}! 👋 Te recordamos tu turno en la peluquería:\n\n` +
      `📅 Fecha: ${app.date}\n` +
      `⏰ Horario: ${app.time} hs\n\n` +
      `¡Te esperamos puntual! Si necesitás modificar el turno por favor avisanos por este medio.`
    );

    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  }

  renderTurnero() {
    const tbody = document.getElementById('turneroTableBody');
    if (!tbody) return;

    const dateAppointments = this.getAppointmentsForDate(this.currentDate);
    let rowsHtml = '';

    this.allTimeSlots.forEach(timeSlot => {
      const match = dateAppointments.find(a => a.time === timeSlot && a.status !== 'cancelado');

      if (match) {
        let statePillClass = 'confirmado';
        let stateLabel = 'Confirmado';

        if (match.status === 'en-sillon') {
          statePillClass = 'en-sillon';
          stateLabel = '✂️ En Atención';
        } else if (match.status === 'completado') {
          statePillClass = 'completado';
          stateLabel = '✓ Atendido';
        }

        const isNowActive = match.status === 'en-sillon';

        rowsHtml += `
          <tr class="${isNowActive ? 'active-now' : ''}">
            <td>
              <span class="time-cell-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${match.time} hs
              </span>
            </td>
            <td>
              <span class="slot-state-pill ${statePillClass}">${stateLabel}</span>
            </td>
            <td>
              <div class="client-cell-info">
                <span class="client-name-txt">${match.clientName}</span>
                <span class="client-phone-txt">${match.clientPhone}</span>
              </div>
            </td>
            <td>
              <span style="font-size: 0.85rem; color: var(--text-muted);">${match.notes || 'Turno de corte'}</span>
            </td>
            <td>
              <div class="turnero-actions-cell">
                ${match.status !== 'completado' ? `
                  <button class="action-btn-mini complete" title="Marcar como atendido" onclick="window.barberTurnero.updateStatus('${match.id}', 'completado')">
                    ✓
                  </button>
                  <button class="action-btn-mini" style="color: var(--warning);" title="Marcar en atención ahora" onclick="window.barberTurnero.updateStatus('${match.id}', 'en-sillon')">
                    ✂️
                  </button>
                ` : `
                  <span style="font-size: 0.75rem; color: var(--success); font-weight:700;">Listo</span>
                `}
                <button class="action-btn-mini whatsapp" title="Enviar WhatsApp al cliente" onclick="window.barberTurnero.sendWhatsAppReminder('${match.id}')">
                  💬
                </button>
                <button class="action-btn-mini" style="color: var(--info);" title="Simular recordatorio 30m" onclick="window.barberNotificationEngine.trigger30MinuteReminderSimulation({clientName:'${match.clientName}', clientPhone:'${match.clientPhone}', time:'${match.time}'})">
                  ⏰
                </button>
                <button class="action-btn-mini cancel" title="Liberar horario" onclick="window.barberTurnero.updateStatus('${match.id}', 'cancelado')">
                  ✕
                </button>
              </div>
            </td>
          </tr>
        `;
      } else {
        rowsHtml += `
          <tr style="opacity: 0.7;">
            <td>
              <span class="time-cell-badge" style="color: var(--text-muted);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${timeSlot} hs
              </span>
            </td>
            <td>
              <span class="slot-state-pill disponible">Disponible</span>
            </td>
            <td>
              <span style="color: var(--text-faint); font-style: italic; font-size: 0.82rem;">Horario libre</span>
            </td>
            <td>
              <span style="color: var(--text-faint);">-</span>
            </td>
            <td>
              <button class="btn-table-assign" onclick="window.barberTurnero.quickBookFreeSlot('${timeSlot}')">
                ➕ Asignar
              </button>
            </td>
          </tr>
        `;
      }
    });

    tbody.innerHTML = rowsHtml;
  }

  quickBookFreeSlot(timeSlot) {
    const modal = document.getElementById('manualTurnModal');
    const timeSelect = document.getElementById('manualTimeSelect');
    const dateInput = document.getElementById('manualDate');

    if (dateInput) dateInput.value = this.currentDate;
    if (timeSelect) timeSelect.value = timeSlot;
    if (modal) modal.classList.add('active');
  }

  updateKPIs() {
    const todayApps = this.getAppointmentsForDate(this.currentDate);
    const activeApps = todayApps.filter(a => a.status !== 'cancelado');

    const countEl = document.getElementById('kpiTotalTurns');
    if (countEl) countEl.textContent = activeApps.length;

    const occupancyEl = document.getElementById('kpiOccupancy');
    if (occupancyEl) {
      const percentage = Math.round((activeApps.length / this.allTimeSlots.length) * 100);
      occupancyEl.textContent = `${percentage}%`;
    }

    const nextAppEl = document.getElementById('kpiNextTurn');
    if (nextAppEl) {
      const pending = activeApps.find(a => a.status === 'confirmado' || a.status === 'en-sillon');
      if (pending) {
        nextAppEl.textContent = `${pending.time} hs (${pending.clientName.split(' ')[0]})`;
      } else {
        nextAppEl.textContent = 'Sin pendientes';
      }
    }
  }
}

window.barberTurnero = new TurneroManager();
