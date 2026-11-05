import {
  accountApi, getSession, safeReturnPath, setSession,
} from '../../scripts/account.js';

const MESSAGES = {
  409: 'That email already has an account',
  401: 'Invalid email or password',
  429: 'Too many attempts, try again shortly',
};

function field(id, label, type, autocomplete) {
  const wrap = document.createElement('div');
  wrap.className = 'sign-in-field';
  const lbl = document.createElement('label');
  lbl.htmlFor = id;
  lbl.textContent = label;
  const input = document.createElement('input');
  Object.assign(input, {
    id, name: id, type, autocomplete, required: true,
  });
  wrap.append(lbl, input);
  return wrap;
}

/**
 * decorates the Sign in form
 * @param {Element} block The sign-in block element
 */
export default function decorate(block) {
  if (getSession()) {
    window.location.replace('/account');
    return;
  }
  const returnParam = new URLSearchParams(window.location.search).get('return');

  const heading = document.createElement('h1');
  heading.textContent = 'Sign in';

  const form = document.createElement('form');
  form.append(
    field('email', 'Email', 'email', 'email'),
    field('password', 'Password', 'password', 'current-password'),
  );

  const alert = document.createElement('p');
  alert.className = 'sign-in-error';
  alert.setAttribute('role', 'alert');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary';
  button.textContent = 'Sign in';

  form.append(alert, button);

  const other = document.createElement('p');
  other.className = 'sign-in-switch';
  const link = document.createElement('a');
  link.href = returnParam ? `/create-account?return=${encodeURIComponent(returnParam)}` : '/create-account';
  link.textContent = 'Create an account';
  other.append('New here? ', link);

  let pending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pending) return;
    pending = true;
    button.disabled = true;
    alert.textContent = '';
    try {
      const data = new FormData(form);
      const response = await accountApi('/shopper/login', {
        method: 'POST',
        body: { email: data.get('email').trim(), password: data.get('password') },
      });
      setSession(response);
      window.location.assign(safeReturnPath(returnParam));
    } catch (err) {
      alert.textContent = MESSAGES[err.status] || err.message || 'Something went wrong, try again';
      pending = false;
      button.disabled = false;
    }
  });

  block.replaceChildren(heading, form, other);
}
