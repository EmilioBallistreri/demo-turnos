/**
 * Controlador de la Web Exclusiva para Clientes (cliente.html)
 */

class ClientPortalController {
  constructor() {
    this.currentUser = window.turneroStore.getCurrentUser();

    // Guard de acceso exclusivo para clientes
    if (!this.currentUser) {
      window.location.href = 'index.html';
      return;
    }
    if (this.currentUser.role !== 'cliente') {
      window.location.href = 'peluquero.html';
      return;
    }

    const now = new Date();
    this.currentCalendarYear = now.getFullYear();
    this.currentCalendarMonth = now.getMonth();
    this.selectedDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (this.selectedDateObj.getDay() === 0) {
      this.selectedDateObj.setDate(this.selectedDateObj.getDate() + 1);
    }
    this.selectedDateStr = this.formatDateIso(this.selectedDateObj);
    this.selectedTimeSlot = null;

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
    this.preloadClientData();
    this.populateBarbershops();
    this.setupNavigation();
    this.renderCalendar();
    this.renderTimeSlots();
    this.updateSummarySidebar();
    this.setupBookingSubmission();
    this.renderMyTurns();

    window.addEventListener('storage', () => {
      this.renderCalendar();
      this.renderTimeSlots();
      this.renderMyTurns();
    });
  }

  preloadClientData() {
    const u = this.currentUser;

    const headerName = document.getElementById('headerClientName');
    const headerDni = document.getElementById('headerClientDni');
    if (headerName) headerName.textContent = u.fullName;
    if (headerDni) headerDni.textContent = `DNI ${u.dni}`;

    const pills = document.getElementById('clientTopDataPills');
    if (pills) {
      pills.innerHTML = `
        <span class="data-pill">👤 <strong>${u.fullName}</strong></span>
        <span class="data-pill">🪪 DNI: <strong>${u.dni}</strong></span>
        <span class="data-pill">🎂 Nac.: <strong>${window.turneroStore.formatDateDisplay(u.birthDate)}</strong></span>
        <span class="data-pill">📞 Tel.: <strong>${u.phone}</strong></span>
      `;
    }

    const nameIn = document.getElementById('clientName');
    const dniIn = document.getElementById('clientDni');
    const birthIn = document.getElementById('clientBirthDate');
    const phoneIn = document.getElementById('clientPhone');

    if (nameIn) nameIn.value = u.fullName;
    if (dniIn) dniIn.value = u.dni;
    if (birthIn) birthIn.value = u.birthDate;
    if (phoneIn) phoneIn.value = u.phone;
  }

  populateBarbershops() {
    const select = document.getElementById('clientBarbershop');
    if (!select) return;

    const shops = window.turneroStore.getAvailableBarbershops();
    select.innerHTML = shops.map(s => `<option value="${s}">💈 ${s}</option>`).join('');
    select.addEventListener('change', () => this.updateSummarySidebar());
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

        if (target === 'viewClientMyTurns') {
          this.renderMyTurns();
        }
      });
    });
  }

  renderCalendar() {
    const calTitle = document.getElementById('calendarMonthYear');
    const calGrid = document.getElementById('calendarGridDays');
    if (!calTitle || !calGrid) return;

    calTitle.textContent = `${this.monthNames[this.currentCalendarMonth]} ${this.currentCalendarYear}`;

    const btnPrev = document.getElementById('btnPrevMonth');
    const btnNext = document.getElementById('btnNextMonth');

    if (btnPrev && !btnPrev._bound) {
      btnPrev._bound = true;
      btnPrev.addEventListener('click', () => {
        this.currentCalendarMonth--;
        if (this.currentCalendarMonth < 0) {
          this.currentCalendarMonth = 11;
          this.currentCalendarYear--;
        }
        this.renderCalendar();
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
        this.renderCalendar();
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
      const isPast = cellDate < today;
      const isToday = cellDate.getTime() === today.getTime();
      const isSelected = cellDateStr === this.selectedDateStr;
      const isSunday = cellDate.getDay() === 0;

      const dayApps = window.turneroStore.getAppointmentsByDate(cellDateStr);
      const isFull = dayApps.length >= window.ALL_TIME_SLOTS.length;

      let cellClass = 'cal-day-cell';
      if (isPast || isSunday) cellClass += ' disabled';
      if (isToday) cellClass += ' today';
      if (isSelected) cellClass += ' selected';

      let dotIndicator = '';
      if (!isPast && !isSunday) {
        dotIndicator = isFull
          ? '<span class="dot-indicator busy" style="background:var(--danger);"></span>'
          : '<span class="dot-indicator avail"></span>';
      }

      html += `
        <div class="${cellClass}" data-date="${cellDateStr}" ${isPast || isSunday ? 'title="Cerrado / No disponible"' : ''}>
          <span>${day}</span>
          ${dotIndicator}
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
        this.selectedTimeSlot = null;

        calGrid.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');

        this.renderTimeSlots();
        this.updateSummarySidebar();
      });
    });
  }

  renderTimeSlots() {
    const slotsGroup = document.getElementById('slotsGroupContainer');
    const datePreview = document.getElementById('selectedDatePreviewText');
    const availCounter = document.getElementById('slotAvailCounter');
    if (!slotsGroup) return;

    const dayName = this.dayNames[this.selectedDateObj.getDay()];
    const dateNum = this.selectedDateObj.getDate();
    const monthName = this.monthNames[this.selectedDateObj.getMonth()];
    const year = this.selectedDateObj.getFullYear();

    if (datePreview) {
      datePreview.textContent = `${dayName} ${dateNum} de ${monthName}, ${year}`;
    }

    const renderGroup = (title, slots) => {
      let groupHtml = `
        <div>
          <div class="slot-group-title">${title}</div>
          <div class="slots-grid">
      `;

      slots.forEach(time => {
        const isOccupied = window.turneroStore.isSlotOccupied(this.selectedDateStr, time);
        const isSelected = this.selectedTimeSlot === time;

        let btnClass = 'time-slot-btn';
        if (isOccupied) btnClass += ' occupied';
        if (isSelected) btnClass += ' selected';

        groupHtml += `
          <button type="button" class="${btnClass}" data-time="${time}" ${isOccupied ? 'disabled' : ''}>
            <span>${time} hs</span>
            <span class="slot-status-label">${isOccupied ? '🔴 Ocupado' : '🟢 Disponible'}</span>
          </button>
        `;
      });

      groupHtml += `</div></div>`;
      return groupHtml;
    };

    let totalAvail = 0;
    window.ALL_TIME_SLOTS.forEach(t => {
      if (!window.turneroStore.isSlotOccupied(this.selectedDateStr, t)) {
        totalAvail++;
      }
    });

    if (availCounter) {
      const occupiedCount = window.ALL_TIME_SLOTS.length - totalAvail;
      availCounter.textContent = `${totalAvail} libres • ${occupiedCount} ocupados`;
    }

    slotsGroup.innerHTML = `
      ${renderGroup('☀️ Horarios de Mañana (09:00 - 13:00)', window.TIME_SLOTS.morning)}
      ${renderGroup('🌤️ Horarios de Tarde (14:00 - 18:00)', window.TIME_SLOTS.afternoon)}
      ${renderGroup('🌙 Horarios de Noche (18:00 - 20:30)', window.TIME_SLOTS.evening)}
    `;

    slotsGroup.querySelectorAll('.time-slot-btn:not(.occupied)').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedTimeSlot = btn.getAttribute('data-time');
        slotsGroup.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.updateSummarySidebar();
      });
    });
  }

  updateSummarySidebar() {
    const u = this.currentUser;
    const shopSelect = document.getElementById('clientBarbershop');

    document.getElementById('summaryClientName').textContent = u.fullName;
    document.getElementById('summaryClientDni').textContent = u.dni;
    document.getElementById('summaryClientPhone').textContent = u.phone;
    document.getElementById('summaryBarbershop').textContent = shopSelect ? shopSelect.value : 'Peluquería Central';
    document.getElementById('summaryDate').textContent = window.turneroStore.formatDateDisplay(this.selectedDateStr);
    document.getElementById('summaryTime').textContent = this.selectedTimeSlot ? `${this.selectedTimeSlot} hs` : 'Elegir horario libre';

    const btnConfirm = document.getElementById('btnConfirmBooking');
    if (btnConfirm) {
      if (this.selectedTimeSlot) {
        btnConfirm.removeAttribute('disabled');
        btnConfirm.style.opacity = '1';
        btnConfirm.style.cursor = 'pointer';
      } else {
        btnConfirm.setAttribute('disabled', 'true');
        btnConfirm.style.opacity = '0.6';
        btnConfirm.style.cursor = 'not-allowed';
      }
    }
  }

  setupBookingSubmission() {
    const btnConfirm = document.getElementById('btnConfirmBooking');
    const modalSuccess = document.getElementById('bookingSuccessModal');
    const btnCloseModal = document.getElementById('btnCloseSuccessModal');
    const btnGoMyTurns = document.getElementById('btnGoToMyTurns');
    const btnStay = document.getElementById('btnStayInCalendar');

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        if (!this.selectedTimeSlot) {
          alert('Por favor seleccioná un horario disponible en el calendario.');
          return;
        }

        const shop = document.getElementById('clientBarbershop')?.value || 'Peluquería Central';
        const notes = document.getElementById('clientNotes')?.value.trim() || '';

        try {
          const newTurn = window.turneroStore.createAppointment({
            date: this.selectedDateStr,
            time: this.selectedTimeSlot,
            clientId: this.currentUser.id,
            clientName: this.currentUser.fullName,
            clientBirthDate: this.currentUser.birthDate,
            clientDni: this.currentUser.dni,
            clientPhone: this.currentUser.phone,
            barbershop: shop,
            notes
          });

          if (window.barberNotificationEngine) {
            window.barberNotificationEngine.playAudioAlert('booking');
            window.barberNotificationEngine.showToast(
              '✓ ¡Turno Solicitado!',
              `Reservaste para el ${window.turneroStore.formatDateDisplay(newTurn.date)} a las ${newTurn.time} hs.`,
              '📅',
              'success'
            );
          }

          document.getElementById('ticketClient').textContent = newTurn.clientName;
          document.getElementById('ticketDni').textContent = newTurn.clientDni;
          document.getElementById('ticketPhone').textContent = newTurn.clientPhone;
          document.getElementById('ticketShop').textContent = newTurn.barbershop;
          document.getElementById('ticketDateTime').textContent = `${window.turneroStore.formatDateDisplay(newTurn.date)} a las ${newTurn.time} hs`;

          if (modalSuccess) modalSuccess.classList.add('active');

          const notesIn = document.getElementById('clientNotes');
          if (notesIn) notesIn.value = '';

          this.selectedTimeSlot = null;
          this.renderCalendar();
          this.renderTimeSlots();
          this.updateSummarySidebar();
          this.renderMyTurns();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    if (btnCloseModal && modalSuccess) {
      btnCloseModal.addEventListener('click', () => modalSuccess.classList.remove('active'));
    }

    if (btnStay && modalSuccess) {
      btnStay.addEventListener('click', () => modalSuccess.classList.remove('active'));
    }

    if (btnGoMyTurns && modalSuccess) {
      btnGoMyTurns.addEventListener('click', () => {
        modalSuccess.classList.remove('active');
        document.getElementById('tabClientMyTurns')?.click();
      });
    }
  }

  renderMyTurns() {
    const tbody = document.getElementById('clientMyTurnsTableBody');
    const badge = document.getElementById('myTurnsCountBadge');
    if (!tbody) return;

    const allTurns = window.turneroStore.getAppointments();
    const myTurns = allTurns
      .filter(a => a.clientDni === this.currentUser.dni || a.clientId === this.currentUser.id)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

    if (badge) {
      if (myTurns.length > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = myTurns.length;
      } else {
        badge.style.display = 'none';
      }
    }

    if (myTurns.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center; padding: 36px; color: var(--text-muted);">
            Todavía no solicitaste ningún turno. Podés elegir día y horario desde la pestaña <strong>Solicitar Turno</strong>.
          </td>
        </tr>
      `;
      return;
    }

    const statusBadgeMap = {
      'pendiente': `<span class="status-pill-v2 pendiente">⏳ Pendiente</span>`,
      'atendido': `<span class="status-pill-v2 atendido">✓ Atendido</span>`,
      'no-atendido': `<span class="status-pill-v2 no-atendido">✕ No atendido</span>`
    };

    tbody.innerHTML = myTurns.map(turn => `
      <tr>
        <td><strong>${window.turneroStore.formatDateDisplay(turn.date)}</strong></td>
        <td><span class="time-cell-badge">${turn.time} hs</span></td>
        <td>💈 ${turn.barbershop || 'Peluquería Central'}</td>
        <td style="color: var(--text-muted);">${turn.notes || 'Corte de pelo'}</td>
        <td>${statusBadgeMap[turn.status] || statusBadgeMap['pendiente']}</td>
      </tr>
    `).join('');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.clientPortal = new ClientPortalController();
});

