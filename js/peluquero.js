/**
 * Controlador de la Web Exclusiva para Peluqueros (peluquero.html)
 */

class BarberPortalController {
  constructor() {
    this.currentUser = window.turneroStore.getCurrentUser();

    // Guard de acceso exclusivo para peluqueros
    if (!this.currentUser) {
      window.location.href = 'index.html';
      return;
    }
    if (this.currentUser.role !== 'peluquero') {
      window.location.href = 'cliente.html';
      return;
    }

    const now = new Date();
    this.currentCalendarYear = now.getFullYear();
    this.currentCalendarMonth = now.getMonth();
    this.selectedDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    this.selectedDateStr = this.formatDateIso(this.selectedDateObj);

    this.historyStatusFilter = 'todos';
    this.historySearchQuery = '';

    this.monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    this.dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    this.init();
  }

  formatDateIso(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  init() {
    this.renderBarberHeaderInfo();
    this.setupNavigation();
    this.renderBarberCalendar();
    this.renderDaySchedule();
    this.setupHistoryFilters();
    this.renderHistorySection();

    window.addEventListener('storage', () => {
      this.renderBarberCalendar();
      this.renderDaySchedule();
      this.renderHistorySection();
    });
  }

  renderBarberHeaderInfo() {
    const u = this.currentUser;
    const shops = Array.isArray(u.barbershops) && u.barbershops.length > 0
      ? u.barbershops
      : ['Peluquería Central'];

    const nameEl = document.getElementById('headerBarberName');
    const dniEl = document.getElementById('headerBarberDni');
    const subEl = document.getElementById('headerBarberShopsSubtitle');
    const welcomeEl = document.getElementById('barberWelcomeTitle');
    const pillsEl = document.getElementById('barberShopsPills');

    if (nameEl) nameEl.textContent = u.fullName;
    if (dniEl) dniEl.textContent = `DNI ${u.dni}`;
    if (subEl) subEl.textContent = `Peluquerías: ${shops.join(' • ')}`;
    if (welcomeEl) welcomeEl.textContent = `Peluquero: ${u.fullName}`;

    if (pillsEl) {
      const shopBadges = shops.map(s => `<span class="data-pill gold">💈 <strong>${s}</strong></span>`).join('');
      pillsEl.innerHTML = `
        ${shopBadges}
        <span class="data-pill">🪪 DNI: <strong>${u.dni}</strong></span>
        <span class="data-pill">📞 Tel.: <strong>${u.phone}</strong></span>
      `;
    }
  }

  setupNavigation() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    const sections = document.querySelectorAll('.view-section');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target-view');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        sections.forEach(sec => {
          sec.classList.toggle('active', sec.id === target);
        });

        this.renderBarberCalendar();
        this.renderDaySchedule();
        this.renderHistorySection();
      });
    });
  }

  renderBarberCalendar() {
    const calTitle = document.getElementById('barberCalMonthYear');
    const calGrid = document.getElementById('barberCalendarGridDays');
    if (!calTitle || !calGrid) return;

    calTitle.textContent = `${this.monthNames[this.currentCalendarMonth]} ${this.currentCalendarYear}`;

    const btnPrev = document.getElementById('btnBarberPrevMonth');
    const btnNext = document.getElementById('btnBarberNextMonth');

    if (btnPrev && !btnPrev._bound) {
      btnPrev._bound = true;
      btnPrev.addEventListener('click', () => {
        this.currentCalendarMonth--;
        if (this.currentCalendarMonth < 0) {
          this.currentCalendarMonth = 11;
          this.currentCalendarYear--;
        }
        this.renderBarberCalendar();
      });
    }

    if (btnNext && !btnNext._bound) {
      btnNext._bound = true;
      btnNext.addEventListener('click', () => {
        this.currentCalendarMonth++;
        if (this.currentCalendarMonth > 11) {
          this.currentCalendarMonth = 0;
          this.currentCalendarYear++;
        }
        this.renderBarberCalendar();
      });
    }

    const firstDayIndex = new Date(this.currentCalendarYear, this.currentCalendarMonth, 1).getDay();
    const startOffset = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
    const totalDays = new Date(this.currentCalendarYear, this.currentCalendarMonth + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';
    for (let i = 0; i < startOffset; i++) {
      html += `<div class="cal-day-cell disabled"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(this.currentCalendarYear, this.currentCalendarMonth, day);
      cellDate.setHours(0, 0, 0, 0);

      const cellDateStr = this.formatDateIso(cellDate);
      const isToday = cellDate.getTime() === today.getTime();
      const isSelected = cellDateStr === this.selectedDateStr;

      const dayApps = window.turneroStore.getAppointmentsByDate(cellDateStr);
      const hasTurns = dayApps.length > 0;

      let cellClass = 'cal-day-cell';
      if (isToday) cellClass += ' today';
      if (isSelected) cellClass += ' selected';

      const dotHtml = hasTurns
        ? `<span class="barber-day-count-badge">${dayApps.length}</span>`
        : `<span class="dot-indicator avail" style="opacity:0.35;"></span>`;

      html += `
        <div class="${cellClass}" data-date="${cellDateStr}" title="${dayApps.length} cliente(s) anotado(s)">
          <span>${day}</span>
          ${dotHtml}
        </div>
      `;
    }

    calGrid.innerHTML = html;

    calGrid.querySelectorAll('.cal-day-cell:not(.disabled)').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.getAttribute('data-date');
        this.selectedDateStr = dateStr;
        const [y, m, d] = dateStr.split('-').map(Number);
        this.selectedDateObj = new Date(y, m - 1, d);

        calGrid.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');

        this.renderDaySchedule();
      });
    });
  }

  getStatusPillHtml(status) {
    if (status === 'atendido') {
      return `<span class="status-pill-v2 atendido">✓ Atendido</span>`;
    }
    if (status === 'no-atendido') {
      return `<span class="status-pill-v2 no-atendido">✕ No atendido</span>`;
    }
    return `<span class="status-pill-v2 pendiente">⏳ Pendiente</span>`;
  }

  getStatusButtonsHtml(turn) {
    return `
      <div class="status-Segment-control">
        <button type="button"
          class="status-seg-btn pendiente ${turn.status === 'pendiente' ? 'active' : ''}"
          onclick="window.barberPortal.changeTurnStatus('${turn.id}', 'pendiente')">
          ⏳ Pendiente
        </button>
        <button type="button"
          class="status-seg-btn atendido ${turn.status === 'atendido' ? 'active' : ''}"
          onclick="window.barberPortal.changeTurnStatus('${turn.id}', 'atendido')">
          ✓ Atendido
        </button>
        <button type="button"
          class="status-seg-btn no-atendido ${turn.status === 'no-atendido' ? 'active' : ''}"
          onclick="window.barberPortal.changeTurnStatus('${turn.id}', 'no-atendido')">
          ✕ No atendido
        </button>
      </div>
    `;
  }

  renderDaySchedule() {
    const tbody = document.getElementById('barberDayScheduleBody');
    const heading = document.getElementById('barberSelectedDateHeading');
    const statsBox = document.getElementById('barberDayQuickStats');
    if (!tbody) return;

    const dayName = this.dayNames[this.selectedDateObj.getDay()];
    const dNum = this.selectedDateObj.getDate();
    const mName = this.monthNames[this.selectedDateObj.getMonth()];
    const year = this.selectedDateObj.getFullYear();

    if (heading) {
      heading.textContent = `Turnero del ${dayName} ${dNum} de ${mName} de ${year}`;
    }

    const dayTurns = window.turneroStore.getAppointmentsByDate(this.selectedDateStr);
    const pendingCount = dayTurns.filter(t => t.status === 'pendiente').length;
    const attendedCount = dayTurns.filter(t => t.status === 'atendido').length;
    const notAttendedCount = dayTurns.filter(t => t.status === 'no-atendido').length;

    if (statsBox) {
      statsBox.innerHTML = `
        <div class="day-stat-row">
          <span>Clientes anotados ese día:</span>
          <strong>${dayTurns.length} / ${window.ALL_TIME_SLOTS.length}</strong>
        </div>
        <div class="day-stat-row">
          <span>⏳ Pendientes:</span>
          <strong style="color: var(--warning);">${pendingCount}</strong>
        </div>
        <div class="day-stat-row">
          <span>✓ Atendidos:</span>
          <strong style="color: var(--success);">${attendedCount}</strong>
        </div>
        <div class="day-stat-row">
          <span>✕ No atendidos:</span>
          <strong style="color: var(--danger);">${notAttendedCount}</strong>
        </div>
      `;
    }

    let rowsHtml = '';
    window.ALL_TIME_SLOTS.forEach(timeSlot => {
      const turn = dayTurns.find(t => t.time === timeSlot);

      if (turn) {
        rowsHtml += `
          <tr class="booked-slot-row">
            <td>
              <span class="time-cell-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${timeSlot} hs
              </span>
            </td>
            <td>
              ${this.getStatusPillHtml(turn.status)}
            </td>
            <td>
              <div class="client-cell-info">
                <span class="client-name-txt">👤 ${turn.clientName}</span>
                <span class="client-phone-txt" style="color: var(--primary);">Anótado en este turno</span>
              </div>
            </td>
            <td>
              <div class="client-meta-stack">
                <span><strong>DNI:</strong> ${turn.clientDni || '-'}</span>
                <span><strong>Nac.:</strong> ${window.turneroStore.formatDateDisplay(turn.clientBirthDate)}</span>
                <span><strong>Tel.:</strong> ${turn.clientPhone}</span>
              </div>
            </td>
            <td>
              <div class="client-meta-stack">
                <span><strong>💈 ${turn.barbershop || 'Peluquería Central'}</strong></span>
                <span style="color: var(--text-muted);">${turn.notes || 'Corte de pelo'}</span>
              </div>
            </td>
            <td>
              ${this.getStatusButtonsHtml(turn)}
            </td>
          </tr>
        `;
      } else {
        rowsHtml += `
          <tr style="opacity: 0.62;">
            <td>
              <span class="time-cell-badge" style="color: var(--text-muted);">
                ${timeSlot} hs
              </span>
            </td>
            <td>
              <span class="slot-state-pill disponible">Horario Libre</span>
            </td>
            <td colspan="4">
              <span style="color: var(--text-faint); font-style: italic; font-size: 0.84rem;">
                Sin cliente anotado en este horario
              </span>
            </td>
          </tr>
        `;
      }
    });

    tbody.innerHTML = rowsHtml;
  }

  setupHistoryFilters() {
    const filterBtns = document.querySelectorAll('#historyStatusFilterBtns .filter-pill-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.historyStatusFilter = btn.getAttribute('data-status-filter');
        this.renderHistorySection();
      });
    });

    const searchInput = document.getElementById('historySearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.historySearchQuery = e.target.value.trim().toLowerCase();
        this.renderHistorySection();
      });
    }
  }

  renderHistorySection() {
    const allTurns = window.turneroStore.getAppointments()
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

    const total = allTurns.length;
    const pending = allTurns.filter(t => t.status === 'pendiente').length;
    const attended = allTurns.filter(t => t.status === 'atendido').length;
    const notAttended = allTurns.filter(t => t.status === 'no-atendido').length;

    const elTotal = document.getElementById('kpiHistoryTotal');
    const elPending = document.getElementById('kpiHistoryPending');
    const elAttended = document.getElementById('kpiHistoryAttended');
    const elNotAttended = document.getElementById('kpiHistoryNotAttended');
    const badgePending = document.getElementById('historyPendingBadge');

    if (elTotal) elTotal.textContent = total;
    if (elPending) elPending.textContent = pending;
    if (elAttended) elAttended.textContent = attended;
    if (elNotAttended) elNotAttended.textContent = notAttended;

    if (badgePending) {
      if (pending > 0) {
        badgePending.style.display = 'inline-block';
        badgePending.textContent = pending;
      } else {
        badgePending.style.display = 'none';
      }
    }

    const filtered = allTurns.filter(turn => {
      if (this.historyStatusFilter !== 'todos' && turn.status !== this.historyStatusFilter) {
        return false;
      }
      if (this.historySearchQuery) {
        const haystack = `${turn.clientName} ${turn.clientDni} ${turn.clientPhone} ${turn.barbershop}`.toLowerCase();
        if (!haystack.includes(this.historySearchQuery)) return false;
      }
      return true;
    });

    const tbody = document.getElementById('barberHistoryTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 36px; color: var(--text-muted);">
            No se encontraron turnos para el filtro seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(turn => `
      <tr>
        <td>
          <div class="client-meta-stack">
            <strong>📅 ${window.turneroStore.formatDateDisplay(turn.date)}</strong>
            <span class="time-cell-badge" style="margin-top:4px;">⏰ ${turn.time} hs</span>
          </div>
        </td>
        <td>
          <div class="client-cell-info">
            <span class="client-name-txt">👤 ${turn.clientName}</span>
          </div>
        </td>
        <td>
          <div class="client-meta-stack">
            <span><strong>DNI:</strong> ${turn.clientDni || '-'}</span>
            <span><strong>Nac.:</strong> ${window.turneroStore.formatDateDisplay(turn.clientBirthDate)}</span>
          </div>
        </td>
        <td>
          <span style="font-size: 0.85rem;">📞 ${turn.clientPhone}</span>
        </td>
        <td>
          <div class="client-meta-stack">
            <span><strong>💈 ${turn.barbershop || 'Peluquería Central'}</strong></span>
            <span style="color: var(--text-muted);">${turn.notes || 'Corte de pelo'}</span>
          </div>
        </td>
        <td>
          ${this.getStatusPillHtml(turn.status)}
        </td>
        <td>
          ${this.getStatusButtonsHtml(turn)}
        </td>
      </tr>
    `).join('');
  }

  changeTurnStatus(turnId, newStatus) {
    const updated = window.turneroStore.updateAppointmentStatus(turnId, newStatus);
    if (!updated) return;

    const labels = {
      'pendiente': '⏳ Pendiente',
      'atendido': '✓ Atendido',
      'no-atendido': '✕ No atendido'
    };

    if (window.barberNotificationEngine) {
      window.barberNotificationEngine.showToast(
        'Estado del Turno Actualizado',
        `${updated.clientName} (${updated.time} hs) ahora está como: ${labels[newStatus]}`,
        '✂️',
        'info'
      );
    }

    this.renderBarberCalendar();
    this.renderDaySchedule();
    this.renderHistorySection();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.barberPortal = new BarberPortalController();
});

