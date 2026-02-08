const MENU_BREAKPOINT = 768;

const ensureMobileMenuToggle = () => {
  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('.nav-links');
  const navWrap = header?.querySelector('.nav-wrap');

  if (!header || !nav || !navWrap || header.querySelector('.menu-toggle')) {
    return;
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'menu-toggle';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'primary-navigation');
  button.innerHTML = '<span aria-hidden="true">☰</span> Menu';

  if (!nav.id) {
    nav.id = 'primary-navigation';
  }

  const updateState = (open) => {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
  };

  button.addEventListener('click', () => {
    const isOpen = nav.classList.contains('open');
    updateState(!isOpen);
  });

  const handleResize = () => {
    if (window.innerWidth > MENU_BREAKPOINT) {
      updateState(false);
  };

  window.addEventListener('resize', handleResize);
  updateState(false);

  navWrap.appendChild(button);
};

const bindFormHandlers = () => {
  document.querySelectorAll('form.form-card').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const feedback = form.querySelector('.form-feedback');
      const message = form.dataset.successMessage || 'Form submitted successfully.';
      if (!form.checkValidity()) {
        feedback.textContent = 'Please complete all required fields before submitting.';
        feedback.style.color = '#b42318';
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const entries = Object.fromEntries(data.entries());
      console.log('Form submission preview:', entries);

      feedback.textContent = message;
      feedback.style.color = '#0b5a32';
      form.reset();
    });
};

document.addEventListener('DOMContentLoaded', () => {
  ensureMobileMenuToggle();
  bindFormHandlers();

    if (!navLinks.id) {
      navLinks.id = 'mobile-menu-options';
    }

    menuButton.setAttribute('aria-controls', navLinks.id);

    navWrap.insertBefore(menuButton, navLinks);

    menuButton.addEventListener('click', () => {
      const willExpand = !navLinks.classList.contains('menu-open');
      navLinks.classList.toggle('menu-open', willExpand);
      menuButton.setAttribute('aria-expanded', String(willExpand));
    });

    const syncMenuState = () => {
      if (!mobileMenuQuery.matches) {
        navLinks.classList.remove('menu-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    };

    if (typeof mobileMenuQuery.addEventListener === 'function') {
      mobileMenuQuery.addEventListener('change', syncMenuState);
    } else if (typeof mobileMenuQuery.addListener === 'function') {
      mobileMenuQuery.addListener(syncMenuState);
    }
  }
};

setupMobileMenu();

document.querySelectorAll('form.form-card').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const feedback = form.querySelector('.form-feedback');
    const message = form.dataset.successMessage || 'Form submitted successfully.';

    if (!form.checkValidity()) {
      feedback.textContent = 'Please complete all required fields before submitting.';
      feedback.style.color = '#b42318';
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const entries = Object.fromEntries(data.entries());
    console.log('Form submission preview:', entries);

    feedback.textContent = message;
    feedback.style.color = '#0b5a32';
    form.reset();
  });
});
