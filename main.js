const MENU_BREAKPOINT = 768;

const ensureMobileMenuToggle = () => {
  const header = document.querySelector('.site-header');
  const nav = header?.querySelector('.nav-links');
  const navWrap = header?.querySelector('.nav-wrap');

  if (!header || !nav || !navWrap) {
    return;
  }

  let button = header.querySelector('.menu-toggle');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'menu-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'primary-navigation');
    button.innerHTML = '<span aria-hidden="true">☰</span> Menu';
    navWrap.appendChild(button);
  }

  if (button.dataset.menuBound === 'true') {
    return;
  }

  if (!nav.id) {
    nav.id = 'primary-navigation';
  }

  const updateState = (open) => {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    nav.classList.toggle('open', open);
    if (window.innerWidth <= MENU_BREAKPOINT) {
      nav.style.display = open ? 'flex' : 'none';
    } else {
      nav.style.display = '';
    }
  };

  button.addEventListener('click', () => {
    const isOpen = nav.classList.contains('open');
    updateState(!isOpen);
  });

  const handleResize = () => {
    if (window.innerWidth > MENU_BREAKPOINT) {
      updateState(false);
    if (window.innerWidth <= MENU_BREAKPOINT) {
      const isOpen = nav.classList.contains('open');
      nav.style.display = isOpen ? 'flex' : 'none';
    }
  };

  window.addEventListener('resize', handleResize);
  updateState(false);

  button.dataset.menuBound = 'true';
};

const bindFormHandlers = () => {
  document.querySelectorAll('form.form-card:not(#mini-quiz-form)').forEach((form) => {
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
  initMiniQuiz();


function initMiniQuiz() {
  const form = document.getElementById('mini-quiz-form');
  if (!form) {
    return;
  }

  const feedback = document.getElementById('quiz-feedback');
  const tryAgainBtn = document.getElementById('try-again-btn');
  const nextModuleBtn = document.getElementById('next-module-btn');
  const passThreshold = Number(form.dataset.passThreshold || 70);
  const answers = {
    q1: 'reading',
    q2: 'speaking',
    q3: 'listening',
  };

  const setPassedState = (passed) => {
    if (passed) {
      nextModuleBtn.disabled = false;
      nextModuleBtn.setAttribute('aria-disabled', 'false');
      nextModuleBtn.classList.remove('is-disabled');
    } else {
      nextModuleBtn.disabled = true;
      nextModuleBtn.setAttribute('aria-disabled', 'true');
      nextModuleBtn.classList.add('is-disabled');
    }
  };

  const savedPassed = localStorage.getItem('quiz_passed') === 'true';
  if (savedPassed) {
    feedback.textContent = 'Passed ✅ You can continue to the next module.';
    feedback.style.color = '#0b5a32';
    setPassedState(true);
  } else {
    setPassedState(false);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const total = Object.keys(answers).length;
    let correct = 0;

    Object.entries(answers).forEach(([name, value]) => {
      const selected = form.querySelector(`input[name="${name}"]:checked`);
      if (selected && selected.value === value) {
        correct += 1;
      }
    });

    const percent = Math.round((correct / total) * 100);

    if (percent >= passThreshold) {
      localStorage.setItem('quiz_passed', 'true');
      feedback.textContent = `Passed ✅ Score: ${correct}/${total} (${percent}%).`;
      feedback.style.color = '#0b5a32';
      tryAgainBtn.hidden = true;
      setPassedState(true);
      return;
    }

    localStorage.removeItem('quiz_passed');
    setPassedState(false);
    tryAgainBtn.hidden = false;
    feedback.textContent = `Score too low—try again to continue. Score: ${correct}/${total} (${percent}%).`;
    feedback.style.color = '#b42318';
  });

  tryAgainBtn.addEventListener('click', () => {
    form.reset();
    feedback.textContent = '';
    localStorage.removeItem('quiz_passed');
    tryAgainBtn.hidden = true;
    setPassedState(false);
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

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
