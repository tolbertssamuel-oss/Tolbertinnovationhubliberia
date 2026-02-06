const mobileMenuQuery = window.matchMedia('(max-width: 920px)');

const setupMobileMenu = () => {
  const navLinks = document.querySelector('.site-header .nav-links');
  if (!navLinks) {
    return;
  }

  const navWrap = navLinks.closest('.nav-wrap');
  if (!navWrap) {
    return;
  }

  if (!navWrap.querySelector('.menu-toggle')) {
    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.className = 'menu-toggle';
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = '☰ Menu';

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
