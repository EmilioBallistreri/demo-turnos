/**
 * Turnero Peluquería - Sistema de Notificaciones y Recordatorios (30 min)
 * Alertas sonoras (Web Audio API), avisos de nuevos turnos,
 * y recordatorio automático 30 minutos antes para cliente y peluquero.
 */

class NotificationEngine {
  constructor() {
    this.toastContainer = null;
    this.audioCtx = null;
    this.notifications = JSON.parse(localStorage.getItem('barberpro_notifications')) || [];
    this.unreadCount = 0;
    this.init();
  }

  init() {
    this.toastContainer = document.getElementById('toastContainer');
    this.updateNotificationBadge();
    this.renderNotificationFeed();
  }

  playAudioAlert(type = 'booking') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (type === 'booking') {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(587.33, now);
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15);

        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.6);
        osc2.stop(now + 0.6);

      } else if (type === 'reminder') {
        [0, 0.18, 0.36].forEach((delay, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(idx === 2 ? 1046.50 : 783.99, now + delay);
          gain.gain.setValueAtTime(0.25, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.3);
        });
      }
    } catch (e) {
      console.warn('Audio Context no permitido', e);
    }
  }

  showToast(title, message, icon = '🔔', type = 'info') {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${message}</div>
      </div>
    `;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  logNotification(type, title, message, time = null) {
    const formattedTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item = {
      id: 'notif_' + Date.now(),
      type,
      title,
      message,
      time: formattedTime,
      timestamp: Date.now()
    };

    this.notifications.unshift(item);
    if (this.notifications.length > 50) this.notifications.pop();

    localStorage.setItem('barberpro_notifications', JSON.stringify(this.notifications));
    this.unreadCount++;
    this.updateNotificationBadge();
    this.renderNotificationFeed();
  }

  updateNotificationBadge() {
    const badges = document.querySelectorAll('.notification-badge-target');
    badges.forEach(b => {
      if (this.unreadCount > 0) {
        b.style.display = 'inline-block';
        b.textContent = this.unreadCount;
      } else {
        b.style.display = 'none';
      }
    });
  }

  clearBadge() {
    this.unreadCount = 0;
    this.updateNotificationBadge();
  }

  renderNotificationFeed() {
    const feed = document.getElementById('notificationFeed');
    if (!feed) return;

    if (this.notifications.length === 0) {
      feed.innerHTML = `
        <div style="text-align:center; padding: 30px; color: var(--text-muted); font-size: 0.9rem;">
          No hay notificaciones recientes en el registro.
        </div>
      `;
      return;
    }

    feed.innerHTML = this.notifications.slice(0, 8).map(n => {
      let iconClass = 'booking';
      let iconSymbol = '📅';

      if (n.type === 'reminder') {
        iconClass = 'reminder';
        iconSymbol = '⏰';
      } else if (n.type === 'alert') {
        iconClass = 'alert';
        iconSymbol = '✂️';
      }

      return `
        <div class="feed-item">
          <div class="feed-left">
            <div class="feed-icon ${iconClass}">${iconSymbol}</div>
            <div class="feed-text">
              <h5>${n.title}</h5>
              <p>${n.message}</p>
            </div>
          </div>
          <span class="feed-time">${n.time}</span>
        </div>
      `;
    }).join('');
  }

  trigger30MinuteReminderSimulation(customBooking = null) {
    this.playAudioAlert('reminder');

    const booking = customBooking || {
      clientName: 'Martín Pérez',
      clientPhone: '+54 9 11 4589-2311',
      time: '16:30 hs'
    };

    // 1. Alerta al Peluquero
    this.showToast(
      '✂️ Turno en 30 minutos (Aviso al Peluquero)',
      `Próximo turno: ${booking.clientName} a las ${booking.time}.`,
      '⏰',
      'warning'
    );

    // 2. Alerta al Cliente
    setTimeout(() => {
      this.showToast(
        '⏰ Recordatorio de Turno (Peluquería)',
        `Hola ${booking.clientName}, faltan 30 min para tu turno de las ${booking.time}. ¡Te esperamos!`,
        '💬',
        'success'
      );
    }, 1200);

    // 3. Registro en el historial
    this.logNotification(
      'alert',
      `Recordatorio 30m para peluqueros`,
      `Próximo turno: ${booking.clientName} a las ${booking.time}`
    );

    this.logNotification(
      'reminder',
      `WhatsApp recordatorio 30m enviado a ${booking.clientName}`,
      `Turno agendado para las ${booking.time}`
    );

    this.updateLiveDemoFrames(booking);
  }

  updateLiveDemoFrames(booking) {
    const clientBubble = document.getElementById('mockupClientBubble');
    if (clientBubble) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      clientBubble.innerHTML = `
        <strong>💈 Recordatorio de Turno - Peluquería</strong><br><br>
        ¡Hola <strong>${booking.clientName}</strong>! Te recordamos que en <strong>30 minutos</strong> (${booking.time}) tenés tu turno para cortarte el pelo.<br><br>
        📍 <strong>Lugar:</strong> Peluquería Central<br><br>
        <em>¡Te esperamos puntual! Si necesitás reprogramar avisanos por este medio.</em>
        <div class="bubble-time">${nowTime} ✓✓</div>
      `;
    }

    const barberAlertTitle = document.getElementById('tabletAlertTitle');
    const barberAlertDesc = document.getElementById('tabletAlertDesc');
    const barberAlertTime = document.getElementById('tabletAlertTime');

    if (barberAlertTitle) {
      barberAlertTitle.textContent = `Próximo turno en 30 min: ${booking.clientName}`;
    }
    if (barberAlertDesc) {
      barberAlertDesc.innerHTML = `
        <strong>Horario:</strong> ${booking.time}<br>
        <strong>Cliente:</strong> ${booking.clientName}<br>
        <strong>Teléfono:</strong> ${booking.clientPhone || '+54 9 11 4589-2311'}
      `;
    }
    if (barberAlertTime) {
      barberAlertTime.textContent = 'COMIENZA EN 30 MIN';
    }
  }
}

window.barberNotificationEngine = new NotificationEngine();
