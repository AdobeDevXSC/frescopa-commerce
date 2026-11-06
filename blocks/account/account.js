import {
  accountApi, clearSession, getSession, setSession,
} from '../../scripts/account.js';

const SIGN_IN_PATH = '/account/sign-in?return=/account';
const MEMBERSHIP_PATH = '/shopper/membership';
const HOME_PATH = '/';

function row(label, value) {
  const wrap = document.createElement('div');
  wrap.className = 'account-detail';
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  wrap.append(dt, dd);
  return wrap;
}

/**
 * decorates the account page
 * @param {Element} block The account block element
 */
export default function decorate(block) {
  const session = getSession();
  if (!session) {
    clearSession();
    window.location.replace(SIGN_IN_PATH);
    return;
  }
  const { shopper } = session;

  const heading = document.createElement('h1');
  heading.textContent = 'Your account';

  const details = document.createElement('dl');
  details.className = 'account-details';
  details.append(row('Name', shopper.name || ''), row('Email', shopper.email || ''));

  const toggle = document.createElement('div');
  toggle.className = 'account-member';
  const label = document.createElement('span');
  label.className = 'account-member-label';
  label.id = 'account-member-label';
  label.textContent = 'Member';

  const sw = document.createElement('button');
  sw.type = 'button';
  sw.className = 'account-switch';
  sw.setAttribute('role', 'switch');
  sw.setAttribute('aria-labelledby', 'account-member-label');
  const track = document.createElement('span');
  track.className = 'account-switch-track';
  track.setAttribute('aria-hidden', 'true');
  const thumb = document.createElement('span');
  thumb.className = 'account-switch-thumb';
  track.append(thumb);
  const state = document.createElement('span');
  state.className = 'account-switch-state';
  sw.append(track, state);

  const render = (isMember) => {
    sw.setAttribute('aria-checked', String(isMember));
    state.textContent = isMember ? 'On' : 'Off';
  };
  render(shopper.group === 'member');

  const alert = document.createElement('p');
  alert.className = 'account-error';
  alert.setAttribute('role', 'alert');

  let pending = false;
  sw.addEventListener('click', async () => {
    if (pending) return;
    pending = true;
    sw.disabled = true;
    alert.textContent = '';
    const next = sw.getAttribute('aria-checked') !== 'true';
    try {
      const response = await accountApi(MEMBERSHIP_PATH, {
        method: 'POST',
        body: { member: next },
        auth: true,
      });
      setSession(response);
      render(response.shopper.group === 'member');
    } catch (err) {
      if (err.status === 401) {
        clearSession();
        window.location.replace(SIGN_IN_PATH);
        return;
      }
      alert.textContent = err.message || 'Something went wrong, try again';
    }
    pending = false;
    sw.disabled = false;
    sw.focus();
  });

  toggle.append(label, sw);

  const signOut = document.createElement('button');
  signOut.type = 'button';
  signOut.className = 'button';
  signOut.textContent = 'Sign out';
  signOut.addEventListener('click', () => {
    clearSession();
    window.location.assign(HOME_PATH);
  });

  block.replaceChildren(heading, details, toggle, alert, signOut);
}
