/**
 * BarberPro - Salon Branding & Live Pitch Customizer
 * Allows instant live personalization during sales demos to prospect barbershops.
 */

class BrandingManager {
  constructor() {
    this.currentSalonName = localStorage.getItem('barberpro_salon_name') || 'BarberPro Studio';
    this.currentTheme = localStorage.getItem('barberpro_theme') || 'gold';
    this.init();
  }

  init() {
    this.applyTheme(this.currentTheme);
    this.applySalonName(this.currentSalonName);

    // Setup input listener
    const nameInput = document.getElementById('demoSalonInput');
    if (nameInput) {
      nameInput.value = this.currentSalonName;
      nameInput.addEventListener('input', (e) => {
        this.updateSalonName(e.target.value.trim() || 'BarberPro Studio');
      });
    }

    // Setup color switcher dots
    const dots = document.querySelectorAll('.color-dot');
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const theme = dot.getAttribute('data-set-theme');
        this.updateTheme(theme);
      });
    });

    // Preset selector if present
    const presetSelect = document.getElementById('salonPresetSelect');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          this.updateSalonName(e.target.value);
          if (nameInput) nameInput.value = e.target.value;
        }
      });
    }
  }

  updateSalonName(newName) {
    this.currentSalonName = newName;
    localStorage.setItem('barberpro_salon_name', newName);
    this.applySalonName(newName);
  }

  applySalonName(name) {
    const targets = document.querySelectorAll('.salon-name-display');
    targets.forEach(el => {
      el.textContent = name;
    });

    const mockupSalon = document.getElementById('mockupSalonTitle');
    if (mockupSalon) mockupSalon.textContent = name;

    document.title = `${name} | Turnos & Reservas Online`;
  }

  updateTheme(themeName) {
    this.currentTheme = themeName;
    localStorage.setItem('barberpro_theme', themeName);
    this.applyTheme(themeName);
  }

  applyTheme(themeName) {
    if (themeName === 'gold') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeName);
    }

    // Update active dot in UI
    document.querySelectorAll('.color-dot').forEach(dot => {
      if (dot.getAttribute('data-set-theme') === themeName) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }
}

// Global instance
window.barberBranding = new BrandingManager();
