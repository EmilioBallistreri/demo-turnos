/**
 * Controlador de la pantalla de Inicio de Sesión y Registro (index.html)
 */

class AuthPageController {
  constructor() {
    this.barbershopsList = [];
    this.init();
  }

  init() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('logout') === '1') {
      window.turneroStore.setCurrentUser(null);
      window.history.replaceState({}, document.title, 'index.html');
    }

    this.checkActiveSessionBanner();
    this.setupModeCards();
    this.setupBarbershopsTags();
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

  setupModeCards() {
    const cards = document.querySelectorAll('.auth-role-card');
    const formMap = {
      'register-cliente': document.getElementById('formRegisterCliente'),
      'register-peluquero': document.getElementById('formRegisterPeluquero'),
      'login': document.getElementById('formLogin')
    };

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.getAttribute('data-auth-mode');
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        Object.entries(formMap).forEach(([key, formEl]) => {
          if (!formEl) return;
          if (key === mode) {
            formEl.classList.add('active');
          } else {
            formEl.classList.remove('active');
          }
        });
      });
    });
  }

  setupBarbershopsTags() {
    const input = document.getElementById('barShopsInput');
    const btnAdd = document.getElementById('btnAddBarbershop');
    if (!input || !btnAdd) return;

    const addFromInput = () => {
      const raw = input.value.trim();
      if (!raw) return;
      raw.split(',').forEach(part => {
        const clean = part.trim();
        if (clean && !this.barbershopsList.includes(clean)) {
          this.barbershopsList.push(clean);
        }
      });
      input.value = '';
      this.renderBarbershopTags();
    };

    btnAdd.addEventListener('click', addFromInput);

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addFromInput();
      }
    });
  }

  renderBarbershopTags() {
    const container = document.getElementById('barShopsTags');
    if (!container) return;

    if (this.barbershopsList.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this.barbershopsList.map((shop, idx) => `
      <span class="shop-tag-chip">
        <span>💈 ${shop}</span>
        <button type="button" class="shop-tag-remove" data-index="${idx}" title="Quitar">✕</button>
      </span>
    `).join('');

    container.querySelectorAll('.shop-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-index'));
        this.barbershopsList.splice(idx, 1);
        this.renderBarbershopTags();
      });
    });
  }

  setupForms() {
    // 1. Registro Cliente
    const formCli = document.getElementById('formRegisterCliente');
    if (formCli) {
      formCli.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('cliFullName').value.trim();
        const birthDate = document.getElementById('cliBirthDate').value;
        const dni = document.getElementById('cliDni').value.trim();
        const phone = document.getElementById('cliPhone').value.trim();

        if (!fullName || !birthDate || !dni || !phone) {
          alert('Por favor completá todos tus datos (Nombre y Apellido, Fecha de nacimiento, DNI y Teléfono).');
          return;
        }

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
          alert(err.message);
        }
      });
    }

    // 2. Registro Peluquero
    const formBar = document.getElementById('formRegisterPeluquero');
    if (formBar) {
      formBar.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('barFullName').value.trim();
        const birthDate = document.getElementById('barBirthDate').value;
        const dni = document.getElementById('barDni').value.trim();
        const phone = document.getElementById('barPhone').value.trim();
        const shopsInputVal = document.getElementById('barShopsInput').value.trim();

        if (shopsInputVal) {
          shopsInputVal.split(',').forEach(s => {
            const clean = s.trim();
            if (clean && !this.barbershopsList.includes(clean)) {
              this.barbershopsList.push(clean);
            }
          });
        }

        if (!fullName || !birthDate || !dni || !phone) {
          alert('Por favor completá todos tus datos personales.');
          return;
        }

        if (this.barbershopsList.length === 0) {
          alert('Por favor ingresá el nombre de la peluquería o peluquerías en las que trabajás.');
          document.getElementById('barShopsInput')?.focus();
          return;
        }

        try {
          window.turneroStore.registerUser({
            role: 'peluquero',
            fullName,
            birthDate,
            dni,
            phone,
            barbershops: [...this.barbershopsList]
          });
          window.location.href = 'peluquero.html';
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // 3. Login con DNI
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const dni = document.getElementById('loginDni').value.trim();
        const role = document.getElementById('loginRole').value || null;
        const errBox = document.getElementById('loginErrorMsg');

        const user = window.turneroStore.loginByDni(dni, role);
        if (!user) {
          if (errBox) {
            errBox.style.display = 'block';
            errBox.textContent = 'No se encontró ningún usuario registrado con ese DNI. Podés registrarte arriba como Cliente o como Peluquero.';
          }
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
      const shopsInfo = isBarber && u.barbershops?.length
        ? ` • ${u.barbershops.join(', ')}`
        : '';

      return `
        <button type="button" class="quick-account-btn" data-dni="${u.dni}" data-role="${u.role}">
          <span class="qa-role">${badge}</span>
          <span class="qa-name">${u.fullName}</span>
          <span class="qa-meta">DNI: ${u.dni}${shopsInfo}</span>
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

