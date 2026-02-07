const AUTH_STORAGE_KEY = 'ti_users';
const SESSION_KEY = 'ti_session';
const LOGIN_ATTEMPTS_KEY = 'ti_login_attempts';
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;

const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)) || [];
  } catch (error) {
    return [];
  }
};

const setUsers = (users) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
};

const setSession = (session) => {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const clearSession = () => {
  sessionStorage.removeItem(SESSION_KEY);
};

const getSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch (error) {
    return null;
  }
};

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const getAttempts = () => {
  try {
    return JSON.parse(localStorage.getItem(LOGIN_ATTEMPTS_KEY)) || [];
  } catch (error) {
    return [];
  }
};

const recordAttempt = () => {
  const now = Date.now();
  const attempts = getAttempts().filter((timestamp) => now - timestamp < ATTEMPT_WINDOW_MS);
  attempts.push(now);
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  return attempts.length;
};

const canAttemptLogin = () => {
  const now = Date.now();
  const attempts = getAttempts().filter((timestamp) => now - timestamp < ATTEMPT_WINDOW_MS);
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(attempts));
  return attempts.length < MAX_ATTEMPTS;
};

const updateAuthUI = () => {
  const session = getSession();
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
    logoutButton.addEventListener('click', () => {
      clearSession();
      window.location.href = 'login.html';
    });
    nav.appendChild(logoutButton);
  }

  logoutButton.style.display = session ? 'inline-flex' : 'none';
};

const guardProtectedPage = () => {
  if (!window.__requireAuth) {
    return;
  }

  const session = getSession();
  const protectedContent = document.querySelector('.protected-content');
  const protectedGate = document.querySelector('.protected-gate');

  if (!session || session.status !== 'Active') {
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

    const users = getUsers();
    if (users.some((user) => user.email === email)) {
      feedback.textContent = 'An account with that email already exists.';
      feedback.style.color = '#b42318';
      return;
    }

    const passwordHash = await hashPassword(password);

    users.push({
      id: crypto.randomUUID(),
      fullName: name,
      email,
      passwordHash,
      phone: phone || null,
      status: 'Active',
      role: 'Student',
      createdAt: new Date().toISOString(),
    });

    setUsers(users);
    setSession({ email, role: 'Student', status: 'Active' });
    window.location.href = formData.get('redirect') || 'ielts-toefl.html';
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const feedback = loginForm.querySelector('.form-feedback');

    if (!canAttemptLogin()) {
      feedback.textContent = 'Too many login attempts. Please wait a few minutes and try again.';
      feedback.style.color = '#b42318';
      return;
    }

    const formData = new FormData(loginForm);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');

    if (!email || !password) {
      feedback.textContent = 'Please enter your email and password.';
      feedback.style.color = '#b42318';
      return;
    }

    const users = getUsers();
    const user = users.find((item) => item.email === email);
    const passwordHash = await hashPassword(password);

    if (!user || user.passwordHash !== passwordHash) {
      recordAttempt();
      feedback.textContent = 'Invalid email or password.';
      feedback.style.color = '#b42318';
      return;
    }

    if (user.status !== 'Active') {
      feedback.textContent = 'Your account is currently blocked. Please contact support.';
      feedback.style.color = '#b42318';
      return;
    }

    setSession({ email: user.email, role: user.role, status: user.status });
    window.location.href = formData.get('redirect') || 'ielts-toefl.html';
  });
}

if (resetForm) {
  resetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const feedback = resetForm.querySelector('.form-feedback');
    feedback.textContent = 'If an account exists for this email, a reset link will be sent.';
    feedback.style.color = '#0b5a32';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  guardProtectedPage();
});
