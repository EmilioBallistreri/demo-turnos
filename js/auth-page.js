/**
 * Controlador de la pantalla de Inicio de Sesión y Registro con Pop-up Modal (index.html)
 */

class AuthPageController {
  constructor() {
    this.init();
  }

  init() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') {
      window.turneroStore.setCurrentUser(null);
      window.history.replaceState({}, document.title, 'index.html');
    }

    this.checkActiveSessionBanner();
    this.setupModeCardsAndModal();
    this.setupForms();
    this.renderQuickAccounts();
  }

  checkActiveSessionBanner() {
    const currentUser = window.turneroStore.getCurrentUser();
    const banner = document.getElementById('activeSessionBanner');
    if (!currentUser || !banner) return;

    const targetUrl = currentUser.role === 'peluquero' ? 'peluquero.html' : 'cliente.html';
    const roleLabel = currentUser.role === 'peluquero' ? '✂️ Peluquero' : '👤 Cliente';

    banner.style.display = 'flex';
    banner.innerHTML = `
      <div class="header-status-pill">
        <span class="status-icon"></span>
        <span>Sesión activa: <strong>${currentUser.fullName}</strong> (${roleLabel})</span>
      </div>
      <a href="${targetUrl}" class="btn-table-assign" style="text-decoration:none; padding: 8px 16px;">
        Ir a mi Web →
      </a>
    `;
  }

  setupModeCardsAndModal() {
    const cards = document.querySelectorAll('.auth-role-card');
    const modal = document.getElementById('authPopupModal');
    const modalTitle = document.getElementById('authModalTitle');
    const btnClose = document.getElementById('btnCloseAuthModal');

    const formMap = {
      'register-cliente': {
        el: document.getElementById('formRegisterCliente'),
        title: '👤 Registrarse como Cliente'
      },
      'register-peluquero': {
        el: document.getElementById('formRegisterPeluquero'),
        title: '✂️ Registrarse como Peluquero'
      },
      'login': {
        el: document.getElementById('formLogin'),
        title: '🔑 Iniciar Sesión'
      }
    };

    const closeModal = () => {
      if (modal) modal.classList.remove('active');
      cards.forEach(c => c.classList.remove('active'));
    };

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.getAttribute('data-auth-mode');
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        Object.entries(formMap).forEach(([key, config]) => {
          if (!config.el) return;
          if (key === mode) {
            config.el.classList.add('active');
            if (modalTitle) modalTitle.textContent = config.title;
          } else {
            config.el.classList.remove('active');
          }
        });

        if (modal) {
          modal.classList.add('active');
        }
      });
    });

    if (btnClose) {
      btnClose.addEventListener('click', closeModal);
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  showFormError(elId, message) {
    const box = document.getElementById(elId);
    if (!box) return;
    box.style.display = 'block';
    box.textContent = message;
  }

  hideFormError(elId) {
    const box = document.getElementById(elId);
    if (box) box.style.display = 'none';
  }

  setupForms() {
    // 1. Registro Cliente
    const formCli = document.getElementById('formRegisterCliente');
    if (formCli) {
      formCli.addEventListener('submit', (e) => {
        e.preventDefault();
        this.hideFormError('cliErrorMsg');

        const fullName = document.getElementById('cliFullName').value.trim();
        const birthDate = document.getElementById('cliBirthDate').value;
        const dni = document.getElementById('cliDni').value.trim();
        const phone = document.getElementById('cliPhone').value.trim();

        try {
          window.turneroStore.registerUser({
            role: 'cliente',
            fullName,
            birthDate,
            dni,
            phone
          });
          window.location.href = 'cliente.html';
        } catch (err) {
          this.showFormError('cliErrorMsg', err.message);
        }
      });
    }

    // 2. Registro Peluquero
    const formBar = document.getElementById('formRegisterPeluquero');
    if (formBar) {
      formBar.addEventListener('submit', (e) => {
        e.preventDefault();
        this.hideFormError('barErrorMsg');

        const fullName = document.getElementById('barFullName').value.trim();
        const birthDate = document.getElementById('barBirthDate').value;
        const dni = document.getElementById('barDni').value.trim();
        const phone = document.getElementById('barPhone').value.trim();

        try {
          window.turneroStore.registerUser({
            role: 'peluquero',
            fullName,
            birthDate,
            dni,
            phone
          });
          window.location.href = 'peluquero.html';
        } catch (err) {
          this.showFormError('barErrorMsg', err.message);
        }
      });
    }

    // 3. Login con DNI
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        this.hideFormError('loginErrorMsg');

        const dni = document.getElementById('loginDni').value.trim();
        const role = document.getElementById('loginRole').value || null;

        const user = window.turneroStore.loginByDni(dni, role);
        if (!user) {
          this.showFormError(
            'loginErrorMsg',
            'No se encontró ningún usuario registrado con ese DNI. Podés registrarte como Cliente o como Peluquero.'
          );
          return;
        }

        window.location.href = user.role === 'peluquero' ? 'peluquero.html' : 'cliente.html';
      });
    }
  }

  renderQuickAccounts() {
    const container = document.getElementById('registeredUsersQuickList');
    if (!container) return;

    const users = window.turneroStore.getUsers();
    container.innerHTML = users.map(u => {
      const isBarber = u.role === 'peluquero';
      const badge = isBarber ? '✂️ Peluquero' : '👤 Cliente';

      return `
        <button type="button" class="quick-account-btn" data-dni="${u.dni}" data-role="${u.role}">
          <span class="qa-role">${badge}</span>
          <span class="qa-name">${u.fullName}</span>
          <span class="qa-meta">DNI: ${u.dni}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.quick-account-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dni = btn.getAttribute('data-dni');
        const role = btn.getAttribute('data-role');
        const user = window.turneroStore.loginByDni(dni, role);
        if (user) {
          window.location.href = user.role === 'peluquero' ? 'peluquero.html' : 'cliente.html';
        }
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AuthPageController();
});
