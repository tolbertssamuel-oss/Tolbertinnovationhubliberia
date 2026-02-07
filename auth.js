const getRedirectTarget = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || 'ielts-toefl.html';
};

const updateAuthUI = async () => {
  const nav = document.querySelector('.site-header .nav-links');
  if (!nav) {
    return;
  }

  let logoutButton = nav.querySelector('.logout-button');
  if (!logoutButton) {
    logoutButton = document.createElement('button');
    logoutButton.type = 'button';
    logoutButton.className = 'logout-button';
    logoutButton.textContent = 'Logout';
    logoutButton.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = 'login.html';
    });
    nav.appendChild(logoutButton);
  }

  const response = await fetch('/api/me', { credentials: 'include' });
  const data = await response.json();
  logoutButton.style.display = data.authenticated ? 'inline-flex' : 'none';
};

const guardProtectedPage = async () => {
  if (!window.__requireAuth) {
    return;
  }

  const protectedContent = document.querySelector('.protected-content');
  const protectedGate = document.querySelector('.protected-gate');

  const response = await fetch('/api/me', { credentials: 'include' });
  const data = await response.json();

  if (!data.authenticated) {
    if (protectedContent) {
      protectedContent.setAttribute('hidden', 'hidden');
    }
    if (protectedGate) {
      protectedGate.removeAttribute('hidden');
    }

    if (window.__requireAuthRedirect) {
      const redirectTarget = encodeURIComponent(window.location.pathname.split('/').pop() || 'ielts-toefl.html');
      window.location.href = `login.html?redirect=${redirectTarget}`;
    }
    return;
  }

  if (protectedContent) {
    protectedContent.removeAttribute('hidden');
  }
  if (protectedGate) {
    protectedGate.setAttribute('hidden', 'hidden');
  }
};

const registerForm = document.querySelector('[data-auth="register"]');
const loginForm = document.querySelector('[data-auth="login"]');
const resetForm = document.querySelector('[data-auth="reset"]');

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = registerForm.querySelector('.form-feedback');
    const formData = new FormData(registerForm);
    const name = formData.get('fullName').trim();
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
    const phone = formData.get('phone').trim();

    if (!name || !email || !password) {
      feedback.textContent = 'Please complete all required fields.';
      feedback.style.color = '#b42318';
      return;
    }

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });

    if (!response.ok) {
      const payload = await response.json();
      feedback.textContent = payload.error || 'Unable to create account.';
      feedback.style.color = '#b42318';
      return;
    }

    const redirectTarget = formData.get('redirect') || 'ielts-toefl.html';
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}&new=1`;
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = loginForm.querySelector('.form-feedback');
    const formData = new FormData(loginForm);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');

    if (!email || !password) {
      feedback.textContent = 'Please enter your email and password.';
      feedback.style.color = '#b42318';
      return;
    }

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const payload = await response.json();
      feedback.textContent = payload.error || 'Unable to login.';
      feedback.style.color = '#b42318';
      return;
    }

    window.location.href = formData.get('redirect') || getRedirectTarget();
  });
}

if (resetForm) {
  resetForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = resetForm.querySelector('.form-feedback');
    const formData = new FormData(resetForm);
    const email = formData.get('email').trim().toLowerCase();

    if (!email) {
      feedback.textContent = 'Please enter your email address.';
      feedback.style.color = '#b42318';
      return;
    }

    await fetch('/api/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    feedback.textContent = 'If an account exists for this email, a reset link will be sent.';
    feedback.style.color = '#0b5a32';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  guardProtectedPage();
});
