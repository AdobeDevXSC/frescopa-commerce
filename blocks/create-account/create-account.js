import {
  accountApi, getSession, safeReturnPath, setSession,
} from '../../scripts/account.js';

const SIGN_IN_PATH = '/account/sign-in';

const MESSAGES = {
  409: 'That email already has an account',
  401: 'Invalid email or password',
  429: 'Too many attempts, try again shortly',
};

function field(id, label, type, autocomplete) {
  const wrap = document.createElement('div');
  wrap.className = 'create-account-field';
  const lbl = document.createElement('label');
  lbl.htmlFor = id;
  lbl.textContent = label;
  const input = document.createElement('input');
  Object.assign(input, {
    id, name: id, type, autocomplete, required: true,
  });
  if (type === 'password') {
    input.minLength = 8;
    input.maxLength = 128;
  }
  wrap.append(lbl, input);
  return wrap;
}

/**
 * decorates the Create account form
 * @param {Element} block The create-account block element
 */
export default function decorate(block) {
  if (getSession()) {
    window.location.replace('/account');
    return;
  }
  const returnParam = new URLSearchParams(window.location.search).get('return');

  const heading = document.createElement('h1');
  heading.textContent = 'Create account';

  const form = document.createElement('form');
  form.append(
    field('name', 'Name', 'text', 'name'),
    field('email', 'Email', 'email', 'email'),
    field('password', 'Password', 'password', 'new-password'),
  );

  const alert = document.createElement('p');
  alert.className = 'create-account-error';
  alert.setAttribute('role', 'alert');

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button primary';
  button.textContent = 'Create account';

  form.append(alert, button);

  const other = document.createElement('p');
  other.className = 'create-account-switch';
  const link = document.createElement('a');
  link.href = returnParam ? `${SIGN_IN_PATH}?return=${encodeURIComponent(returnParam)}` : SIGN_IN_PATH;
  link.textContent = 'Sign in';
  other.append('Already have an account? ', link);

  let pending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (pending) return;
    pending = true;
    button.disabled = true;
    alert.textContent = '';
    try {
      const data = new FormData(form);
      const response = await accountApi('/shopper/signup', {
        method: 'POST',
        body: {
          name: data.get('name').trim(),
          email: data.get('email').trim(),
          password: data.get('password'),
        },
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
