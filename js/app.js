/**
 * Turnero Peluquería - Calendario de Fechas y Horarios
 * Selección de Día, Mes, Año, Horarios Disponibles/Ocupados y Confirmación.
 */

class BarberProApp {
  constructor() {
    const now = new Date();
    this.currentCalendarYear = now.getFullYear();
    this.currentCalendarMonth = now.getMonth();
    this.selectedDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
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
    this.setupViewNavigation();
    this.renderCalendar();
    this.renderTimeSlots();
    this.setupBookingForm();
    this.setupGlobalButtons();
    this.updateSummarySidebar();
  }

  setupViewNavigation() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    const viewSections = document.querySelectorAll('.view-section');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetViewId = btn.getAttribute('data-target-view');
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        viewSections.forEach(sec => {
          if (sec.id === targetViewId) {
            sec.classList.add('active');
          } else {
            sec.classList.remove('active');
          }
        });

        if (targetViewId === 'viewNotifications' && window.barberNotificationEngine) {
          window.barberNotificationEngine.clearBadge();
        }

        if (targetViewId === 'viewTurnero' && window.barberTurnero) {
          window.barberTurnero.renderTurnero();
          window.barberTurnero.updateKPIs();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    const logo = document.getElementById('brandLogo');
    if (logo) {
      logo.addEventListener('click', () => {
        const firstTab = document.getElementById('tabBooking');
        if (firstTab) firstTab.click();
      });
    }
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

      let cellClass = 'cal-day-cell';
      if (isPast || isSunday) cellClass += ' disabled';
      if (isToday) cellClass += ' today';
      if (isSelected) cellClass += ' selected';

      let dotIndicator = '';
      if (!isPast && !isSunday) {
        dotIndicator = '<span class="dot-indicator avail"></span>';
      }

      html += `
        <div class="${cellClass}" data-date="${cellDateStr}" ${isPast || isSunday ? 'title="No disponible"' : ''}>
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

    const morningSlots = ['09:00', '09:45', '10:30', '11:15', '12:00', '12:45'];
    const afternoonSlots = ['14:00', '14:45', '15:30', '16:15', '17:00', '17:45'];
    const eveningSlots = ['18:30', '19:15', '20:00'];

    const renderGroup = (title, slots) => {
      let groupHtml = `
        <div>
          <div class="slot-group-title">${title}</div>
          <div class="slots-grid">
      `;

      slots.forEach(time => {
        const isOccupied = window.barberTurnero ? 
          window.barberTurnero.isSlotBooked(this.selectedDateStr, time) : false;

        const isSelected = this.selectedTimeSlot === time;

        let btnClass = 'time-slot-btn';
        if (isOccupied) btnClass += ' occupied';
        if (isSelected) btnClass += ' selected';

        groupHtml += `
          <button type="button" class="${btnClass}" data-time="${time}" ${isOccupied ? 'disabled' : ''}>
            <span>${time} hs</span>
            <span class="slot-status-label">${isOccupied ? 'Ocupado' : 'Disponible'}</span>
          </button>
        `;
      });

      groupHtml += `</div></div>`;
      return groupHtml;
    };

    let totalAvail = 0;
    const allSlots = [...morningSlots, ...afternoonSlots, ...eveningSlots];
    allSlots.forEach(t => {
      if (!window.barberTurnero || !window.barberTurnero.isSlotBooked(this.selectedDateStr, t)) {
        totalAvail++;
      }
    });

    if (availCounter) {
      availCounter.textContent = `${totalAvail} turnos libres`;
    }

    slotsGroup.innerHTML = `
      ${renderGroup('☀️ Horarios de Mañana (09:00 - 13:00)', morningSlots)}
      ${renderGroup('🌤️ Horarios de Tarde (14:00 - 18:00)', afternoonSlots)}
      ${renderGroup('🌙 Horarios de Noche (18:00 - 20:30)', eveningSlots)}
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
    const sDate = document.getElementById('summaryDate');
    const sTime = document.getElementById('summaryTime');
    const btnConfirm = document.getElementById('btnConfirmBooking');

    if (sDate) {
      const d = this.selectedDateObj;
      sDate.textContent = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }
    if (sTime) {
      sTime.textContent = this.selectedTimeSlot ? `${this.selectedTimeSlot} hs` : 'Elegir horario en la lista';
    }

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

  setupBookingForm() {
    const btnConfirm = document.getElementById('btnConfirmBooking');
    const modalSuccess = document.getElementById('bookingSuccessModal');
    const btnCloseModal = document.getElementById('btnCloseSuccessModal');

    if (btnConfirm) {
      btnConfirm.addEventListener('click', () => {
        const clientNameInput = document.getElementById('clientName');
        const clientPhoneInput = document.getElementById('clientPhone');
        const clientNotesInput = document.getElementById('clientNotes');

        const clientName = clientNameInput ? clientNameInput.value.trim() : '';
        const clientPhone = clientPhoneInput ? clientPhoneInput.value.trim() : '';
        const clientNotes = clientNotesInput ? clientNotesInput.value.trim() : '';

        if (!clientName) {
          alert('Por favor ingresá tu Nombre y Apellido para el turno.');
          clientNameInput?.focus();
          return;
        }

        if (!clientPhone) {
          alert('Por favor ingresá tu número de teléfono / WhatsApp para el recordatorio de 30 minutos.');
          clientPhoneInput?.focus();
          return;
        }

        if (!this.selectedTimeSlot) {
          alert('Por favor seleccioná un horario disponible en el calendario.');
          return;
        }

        const newApp = window.barberTurnero.addAppointment({
          clientName,
          clientPhone,
          notes: clientNotes,
          date: this.selectedDateStr,
          time: this.selectedTimeSlot
        });

        document.getElementById('ticketClient').textContent = clientName;
        document.getElementById('ticketDateTime').textContent = `${this.selectedDateStr} a las ${this.selectedTimeSlot} hs`;
        document.getElementById('ticketPhone').textContent = clientPhone;

        modalSuccess.classList.add('active');
        window.lastBookedAppointment = newApp;

        this.selectedTimeSlot = null;
        this.renderTimeSlots();
        this.updateSummarySidebar();
      });
    }

    if (btnCloseModal && modalSuccess) {
      btnCloseModal.addEventListener('click', () => {
        modalSuccess.classList.remove('active');
      });
    }

    const btnSimulateFromModal = document.getElementById('btnSimulateReminderFromModal');
    if (btnSimulateFromModal) {
      btnSimulateFromModal.addEventListener('click', () => {
        if (modalSuccess) modalSuccess.classList.remove('active');
        
        const notifTab = document.getElementById('tabNotifications');
        if (notifTab) notifTab.click();

        if (window.barberNotificationEngine && window.lastBookedAppointment) {
          window.barberNotificationEngine.trigger30MinuteReminderSimulation(window.lastBookedAppointment);
        }
      });
    }
  }

  setupGlobalButtons() {
    const centerSimulateBtn = document.getElementById('btnCenterSimulate30Min');
    if (centerSimulateBtn) {
      centerSimulateBtn.addEventListener('click', () => {
        if (window.barberNotificationEngine) {
          window.barberNotificationEngine.trigger30MinuteReminderSimulation();
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.barberApp = new BarberProApp();
});
