let formCount = 0;

/**
 * Builds the ZIP search form from the authored cell:
 * heading, label paragraph, placeholder paragraph, link (text = button, URL = action)
 * @param {Element} cell The authored form cell
 * @returns {Element} The search column
 */
function buildSearch(cell) {
  const search = document.createElement('div');
  search.className = 'store-locator-search';
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  const link = cell.querySelector('a');
  const paragraphs = [...cell.querySelectorAll(':scope > p')]
    .filter((p) => !p.contains(link) && p.textContent.trim());
  const [labelText, placeholder] = paragraphs.map((p) => p.textContent.trim());

  if (heading) search.append(heading);

  formCount += 1;
  const id = `store-locator-zip-${formCount}`;
  const form = document.createElement('form');
  form.className = 'store-locator-form';
  form.method = 'get';
  form.setAttribute('role', 'search');
  if (link) form.action = link.href;

  const label = document.createElement('label');
  label.className = 'store-locator-label';
  label.htmlFor = id;
  label.textContent = labelText || '';

  const field = document.createElement('div');
  field.className = 'store-locator-field';
  const input = document.createElement('input');
  input.id = id;
  input.type = 'text';
  input.name = 'q';
  input.autocomplete = 'postal-code';
  if (placeholder) input.placeholder = placeholder;
  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'button';
  button.textContent = link ? link.textContent.trim() : '';
  field.append(input, button);

  form.append(label, field);
  search.append(form);
  return search;
}

/**
 * Builds the address card: heading, tagline, and the last paragraph as an <address>
 * @param {Element} [cell] The authored card cell
 * @returns {Element|null} The card
 */
function buildCard(cell) {
  if (!cell || !cell.textContent.trim()) return null;
  const card = document.createElement('div');
  card.className = 'store-locator-card';
  card.append(...cell.childNodes);
  const paragraphs = card.querySelectorAll(':scope > p');
  const last = paragraphs[paragraphs.length - 1];
  if (paragraphs.length > 1 && last) {
    const address = document.createElement('address');
    address.append(...last.childNodes);
    last.replaceWith(address);
  }
  return card;
}

/**
 * decorates the store locator: ZIP form and a static address card (no map)
 * @param {Element} block The store-locator block element
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const formCell = cells.find((cell) => cell.querySelector('a')) || cells[0];
  const cardCell = cells.find((cell) => cell !== formCell);
  if (!formCell) return;

  const card = buildCard(cardCell);
  block.replaceChildren(buildSearch(formCell));
  if (card) block.append(card);
}
