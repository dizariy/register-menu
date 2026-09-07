const card = document.querySelector('.auth-card');
const panels = new Map(
  [...document.querySelectorAll('.auth-panel')].map((panel) => [panel.dataset.panel, panel]),
);

const titleByRoute = {
  login: 'SLS Role Play — Авторизация',
  register: 'SLS Role Play — Регистрация',
  recovery: 'SLS Role Play — Восстановление доступа',
};

let currentRoute = 'login';
let isTransitioning = false;

function showPanel(nextRoute) {
  if (isTransitioning || nextRoute === currentRoute || !panels.has(nextRoute)) return;

  const previousPanel = panels.get(currentRoute);
  const nextPanel = panels.get(nextRoute);
  isTransitioning = true;
  card.setAttribute('aria-busy', 'true');
  previousPanel.classList.add('is-leaving');

  window.setTimeout(() => {
    previousPanel.classList.remove('is-active', 'is-leaving');
    previousPanel.hidden = true;

    card.classList.remove(`mode-${currentRoute}`);
    card.classList.add(`mode-${nextRoute}`);

    nextPanel.hidden = false;
    nextPanel.classList.add('is-entering', 'is-active');
    // Starting the animation after the old form is fully gone makes the movement sequential.
    window.setTimeout(() => nextPanel.classList.remove('is-entering'), 360);

    currentRoute = nextRoute;
    document.title = titleByRoute[nextRoute];

    window.setTimeout(() => {
      card.removeAttribute('aria-busy');
      isTransitioning = false;
    }, 360);
  }, 220);
}

document.addEventListener('click', (event) => {
  const routeButton = event.target.closest('[data-route]');
  if (routeButton) showPanel(routeButton.dataset.route);
});

// All form values allow only printable ASCII: English letters, digits, and symbols.
// Values stay intact while their panel is hidden, so registration input survives navigation.
function restrictCharacters(input, invalidCharacters) {
  const invalidBeforeInput = new RegExp(invalidCharacters.source);

  input.addEventListener('beforeinput', (event) => {
    if (event.data && invalidBeforeInput.test(event.data)) event.preventDefault();
  });

  input.addEventListener('input', () => {
    const cleanValue = input.value.replace(invalidCharacters, '');
    if (cleanValue !== input.value) input.value = cleanValue;
  });
}

document.querySelectorAll('[data-ascii-only]').forEach((input) => {
  restrictCharacters(input, /[^\x20-\x7E]/g);
});

function syncFieldState(input) {
  input.closest('.field')?.classList.toggle('is-filled', input.value.length > 0);
}

document.querySelectorAll('.field input').forEach((input) => {
  syncFieldState(input);
  input.addEventListener('input', () => syncFieldState(input));
});

const registerForm = panels.get('register');
const passwordInput = registerForm.querySelector('[name="register-password"]');
const passwordConfirmInput = registerForm.querySelector('[name="register-password-confirm"]');
const passwordFeedback = registerForm.querySelector('.field-with-feedback');

function validatePasswordConfirmation() {
  const hasConfirmation = passwordConfirmInput.value.length > 0;
  const passwordsMismatch = hasConfirmation && passwordInput.value !== passwordConfirmInput.value;

  passwordFeedback.classList.toggle('is-invalid', passwordsMismatch);
  passwordConfirmInput.setAttribute('aria-invalid', String(passwordsMismatch));
  card.classList.toggle('has-password-error', passwordsMismatch && currentRoute === 'register');

  return !passwordsMismatch;
}

passwordConfirmInput.addEventListener('blur', validatePasswordConfirmation);
passwordConfirmInput.addEventListener('input', () => {
  if (passwordFeedback.classList.contains('is-invalid')) validatePasswordConfirmation();
});
passwordInput.addEventListener('input', () => {
  if (passwordConfirmInput.value) validatePasswordConfirmation();
});

document.querySelectorAll('.auth-panel').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (form === registerForm) validatePasswordConfirmation();
  });
});
