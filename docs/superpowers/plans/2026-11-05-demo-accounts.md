# Demo Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a visitor create an account, sign in, and switch "member" on and off so product pages show member prices, using the existing App Builder app `frescopa-demo-services` and the `frescopa-commerce` storefront.

**Architecture:** Two new public actions (`shopper/signup`, `shopper/membership`) and a welcome-email helper join the existing shopper API (scrypt passwords, HS256 JWT, CORS, rate limits). The storefront adds one small module `scripts/account.js` (session, API client, group to price book), three blocks (`create-account`, `sign-in`, `account`), header links, and one line in `scripts/scripts.js` that applies the session's price book after commerce initialisation.

**Tech Stack:** Service: Node 22 App Builder actions, `@adobe/aio-lib-db`, Jest with the in-memory fake db. Storefront: vanilla ES modules, `node --test` for pure helpers, stylelint/eslint, Playwright (ad hoc, not saved) for browser checks.

**Spec:** `docs/superpowers/specs/2026-11-05-demo-accounts-design.md`

Repos: **SVC** = `/Users/lamont/Workspace/frescopa-demo-services` (branch `feature/self-service-accounts`), **SITE** = this repo (branch `migrate/accounts-design`, then `migrate/accounts-site` for code).

## Global Constraints

- Group values for self-service: `guest` (default) and `member` only. Price books: `guest` and `member`.
- Passwords: 8 to 128 characters (`v.password`), stored only as `scrypt$...` hashes. Never log passwords, tokens, API keys or `JWT_SECRET`.
- Token: HS256, 1 hour, claims `demoId, shopperId, group`; no refresh action.
- Sign-up limits: 5 per minute per IP (`SIGNUP_RATE_LIMIT_IP`), 200 self-service shoppers per demo (`MAX_SELF_SIGNUPS`).
- A welcome-email failure never fails sign-up; email call times out after 3 seconds.
- Service errors are `{ "error": "message" }`; this API never returns `403`.
- Storefront: no inline `<script>`, inline `style=""`, or `!important`; CSS scoped to `.blockname`; the only cross-block import is `fragment/fragment.js`, shared code lives in `/scripts/`; `scripts/aem.js` untouched; `scripts/scripts.js` changes minimal.
- Accessibility: labelled inputs, inline errors announced with `role="alert"`, 44px targets, visible focus ring, one `h1` per page.
- UI strings (exact): `Create account`, `Sign in`, `Your account`, `Name`, `Email`, `Password`, `Member`, `Sign out`, `Already have an account? Sign in`, `New here? Create an account`. Welcome-email wording is drafted by the implementer and approved by the user before deploy (Task 4).
- No secrets in git in either repo. Deploy to the **stage** workspace only.

## Review Focus

- `return` query parameter on the sign-in and create-account pages must only allow same-origin paths (`/x`, not `//host` or `https://...`): otherwise it is an open redirect. Test in Task 6.
- Double-click or repeated submit on the forms must not create two accounts or two emails: the button is disabled while pending, and a repeat returns `409`. Tests in Tasks 1 and 6.
- Email provider down, slow or misconfigured must still return `201` with a working token. Test in Task 4.
- Token expiring mid-demo: the account page and price-book code treat an expired or `401` session as signed out and send the person to sign in with `return` set. Test in Tasks 5 and 7.
- Body tampering on membership: `member` not a boolean, or an extra `group` field, must not change anything other than guest/member. Test in Task 3.

---

## Part A: Service (SVC)

### Task 1: Registration and `shopper/signup`

**Files:**
- Modify: `actions/lib/validate.js` (no change expected; confirm `str`, `email`, `password` are exported), `app.config.yaml` (add `signup` under package `shopper`)
- Create: `actions/shopper/signup/index.js`
- Test: `test/signup.test.js`

**Interfaces:**
- Produces: web action `shopper/signup`, `POST {demoId, name, email, password}` returning `201 { token, expiresIn, shopper: { shopperId, email, name, group: 'guest' } }`; shopper doc gets `source: 'signup'`. Errors: `400` invalid input, `409` email exists, `404` demo not found or archived (from `publicAction`).

- [ ] **Step 1: Register this site (user-run, once).** The user runs `aio login`, then `POST registry/register` on the stage base URL with `{customer: "Fréscopa", scEmail: <their address>, repo: "AdobeDevXSC/frescopa-commerce", daSite: "frescopa-commerce", hosts: ["main--frescopa-commerce--adobedevxsc.aem.page", "main--frescopa-commerce--adobedevxsc.aem.live"]}` (add branch preview hosts used for testing, e.g. `migrate-accounts-site--frescopa-commerce--adobedevxsc.aem.page`). Record the returned `demoId` for Task 7. Expected: `201` the first time, `200` and the same id on repeat.
- [ ] **Step 2: Write failing tests** in `test/signup.test.js`, following the setup pattern of `test/shopper.test.js` (mock `withDb`, `createFakeDb`, register a demo):
  - `signup creates a guest and returns a working token`: assert `201`, `body.shopper.group === 'guest'`, `jwt.verify(body.token, SECRET).group === 'guest'`, and `shopper/me` with that token returns the same email.
  - `stores a scrypt hash and source "signup"`: assert `docs[0].passwordHash.startsWith('scrypt$')`, `docs[0].source === 'signup'`, no plain password anywhere in `JSON.stringify(docs)`.
  - `lowercases email and rejects a duplicate with 409`: sign up `Jo@Example.com`, then `jo@example.com` returns `409`.
  - `rejects short password, bad email, missing name with 400`.
  - `unknown or archived demo returns 404`; `origin not allowed returns 400`.
  - `writes a shopper.signup audit event` (no password or token in it).
- [ ] **Step 3: Run `npm test -- signup` and confirm the tests fail** (module not found).
- [ ] **Step 4: Implement `actions/shopper/signup/index.js`** with `publicAction('shopper-signup', fn, { login: true })` (no JWT required). Use `v.email`, `v.password`, `v.str(params.name, 'name', { max: 120 })`; `crypto.randomUUID()` for `shopperId`; `hashPassword`; insert `{ shopperId, demoId, email, name, group: 'guest', passwordHash, source: 'signup', createdAt }`; sign with `jwt.sign({ demoId, shopperId, group }, params.JWT_SECRET)`; audit `shopper.signup`. Add the manifest entry copying `login`'s inputs and annotations (`web-custom-options: true`).
- [ ] **Step 5: Run `npm test`.** Expected: all pass (existing 46 plus new).
- [ ] **Step 6: Commit** `feat: self-service shopper signup`.

### Task 2: Sign-up limits

**Files:**
- Modify: `actions/shopper/signup/index.js`, `app.config.yaml` (add inputs `SIGNUP_RATE_LIMIT_IP`, `MAX_SELF_SIGNUPS` to `signup`)
- Test: `test/signup.test.js`

**Interfaces:**
- Consumes: `hit(db, key, limit)` from `actions/lib/ratelimit.js`; `clientIp(params)` from `actions/lib/http.js`.
- Produces: signup returns `429 { error: 'rate limit exceeded, retry shortly' }` after the per-IP limit and `429 { error: 'sign-up limit reached for this demo' }` at the cap.

- [ ] **Step 1: Write failing tests:** `sixth signup from one IP within a minute returns 429` (limit 5, different emails); `limit is configurable via SIGNUP_RATE_LIMIT_IP`; `signup at the per-demo cap returns 429` (set `MAX_SELF_SIGNUPS: 2`, third signup fails; admin-created shoppers do not count because only `source: 'signup'` is counted); `a second demo is unaffected`.
- [ ] **Step 2: Run and confirm failures.**
- [ ] **Step 3: Implement** in `signup`: before inserting, `await hit(db, \`signup-ip:${clientIp(params)}\`, parseInt(params.SIGNUP_RATE_LIMIT_IP, 10) || 5)`, then `countDocuments({ demoId, source: 'signup' }) >= (parseInt(params.MAX_SELF_SIGNUPS, 10) || 200)` throws `HttpError(429, 'sign-up limit reached for this demo')`.
- [ ] **Step 4: Run `npm test`; commit** `feat: sign-up rate limit and per-demo cap`.

### Task 3: `shopper/membership`

**Files:**
- Create: `actions/shopper/membership/index.js`
- Modify: `app.config.yaml` (action under `shopper`, JWT required: use `publicAction` default, not `login`)
- Test: `test/membership.test.js`

**Interfaces:**
- Produces: `POST {demoId, member: boolean}` with `Authorization: Bearer <token>` returning `200 { token, expiresIn, shopper }` with `group` `'member'` or `'guest'` and a fresh token carrying the new group. `409 { error: 'membership is not available for this account' }` when the stored group is neither `guest` nor `member`. `400` when `member` is not a boolean.

- [ ] **Step 1: Write failing tests:** `member true sets group member and returns a token with group member`; `member false sets guest`; `no token returns 401`; `a token for another demo returns 401`; `member "true" (string), 1, null or missing returns 400 and leaves the group unchanged`; `an extra group field in the body is ignored` (body `{ member: true, group: 'wholesale' }` ends with `group === 'member'`); `a shopper whose group is wholesale returns 409 and the group stays wholesale`; `the shopper is taken from the token, not the body` (a `shopperId` in the body is ignored); `writes a shopper.membership audit event`.
- [ ] **Step 2: Run and confirm failures.**
- [ ] **Step 3: Implement** with `publicAction('shopper-membership', fn)`: read `claims.shopperId`, load the shopper (`401 shopper no longer exists` if gone), check `typeof params.member === 'boolean'` (JSON body only), check stored group in `['guest','member']`, `updateOne({ demoId, shopperId }, { $set: { group } })`, sign a new token, audit.
- [ ] **Step 4: Run `npm test`; commit** `feat: self-service membership switch`.

### Task 4: Welcome email

**Files:**
- Create: `actions/lib/email.js`, `actions/lib/welcome-copy.js`
- Modify: `actions/shopper/signup/index.js`, `app.config.yaml` (inputs `EMAIL_API_KEY: $EMAIL_API_KEY`, `EMAIL_FROM: $EMAIL_FROM`, `EMAIL_FROM_NAME: $EMAIL_FROM_NAME` on `signup`)
- Test: `test/email.test.js`, `test/signup.test.js`

**Interfaces:**
- Produces: `sendWelcome(params, { to, name }): Promise<boolean>` in `actions/lib/email.js`. Returns `true` when the provider accepts, `false` on any error, missing config or a 3 second timeout; never throws; never logs the key. `welcomeMessage(name): { subject: string, text: string }` in `actions/lib/welcome-copy.js`.
- Uses the global `fetch` and an `AbortController`. Default provider call (Brevo): `POST https://api.brevo.com/v3/smtp/email`, header `api-key`, body `{ sender: { email, name }, to: [{ email, name }], subject, textContent }`. The implementer confirms the request shape against the provider's current documentation before deploy.

- [ ] **Step 1: Write failing tests** in `test/email.test.js` with `global.fetch` mocked: `posts to the provider with the key in a header and the shopper's email and name in the body`; `returns false and does not throw when fetch rejects`; `returns false on a non-2xx response`; `returns false when the call exceeds 3 seconds` (fake timers); `returns false and makes no call when EMAIL_API_KEY or EMAIL_FROM is missing`; `the key never appears in any console output`.
- [ ] **Step 2: Add to `test/signup.test.js`:** `sign-up returns 201 and a working token when the email send rejects`; `sign-up calls sendWelcome once with the new shopper's email and name`.
- [ ] **Step 3: Run and confirm failures.**
- [ ] **Step 4: Implement `sendWelcome` and `welcomeMessage`,** and call `sendWelcome` from `signup` after the insert, `await`ed but its result ignored (failure logged without secrets). The implementer drafts the subject and body in `welcome-copy.js` (short, plain, uses the person's name, no promises about prices beyond "member pricing"), then **stops and shows the wording to the user for approval** before any deploy.
- [ ] **Step 5: Run `npm test`; commit** `feat: welcome email on sign-up` (after wording approval).

### Task 5: End-to-end script, README, stage deploy

**Files:**
- Modify: `e2e/curl-e2e.sh`, `README.md`, `.env` (local only, not committed: add `EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, optional `SIGNUP_RATE_LIMIT_IP`, `MAX_SELF_SIGNUPS`)

- [ ] **Step 1: Extend `e2e/curl-e2e.sh`** with checks (same `check` style): sign-up `201` and `me` works with the returned token; duplicate email `409`; short password `400`; membership on then `me` shows `member`; membership off shows `guest`; membership without token `401`; sign-up from a disallowed origin `400`; archived demo sign-up `404`; delete the created shopper in cleanup.
- [ ] **Step 2: Document in `README.md`:** endpoints `shopper/signup` and `shopper/membership`, the new inputs, the collections note (`shoppers.source`), and the sign-up limits.
- [ ] **Step 3: User runs the deploy:** `npx -y @adobe/aio-cli@11.2.0 app deploy --no-publish` to stage, then `BASE=... ORG=... e2e/curl-e2e.sh`. Expected: all checks pass (31 existing plus the new ones).
- [ ] **Step 4: Commit** `docs: README and e2e for self-service accounts`; open a PR in SVC.

---

## Part B: Storefront (SITE)

### Task 6: Account module, config and housekeeping

**Files:**
- Create: `scripts/account.js`, `tests/account.test.mjs`
- Modify: `config.json`, `package.json` (script `"test": "node --test tests/"`), `AGENTS.md`, `demo/seed/settings.json`

**Interfaces:**
- Produces from `scripts/account.js` (ES module, no top-level browser access):
  - `SESSION_KEY = 'frescopa-account'`
  - `getSession(storage?: Storage, now?: number): { token: string, expiresAt: number, shopper: { shopperId: string, email: string, name: string, group: string } } | null` (returns `null` when missing, malformed or expired)
  - `setSession(payload: { token: string, expiresIn: number, shopper: object }, storage?: Storage, now?: number): void`
  - `clearSession(storage?: Storage): void`
  - `priceBookFor(group?: string): 'member' | 'guest'` (only `member` maps to `member`)
  - `safeReturnPath(value: string | null, fallback = '/account'): string` (same-origin absolute path only: starts with `/`, not `//`, no backslash, no scheme)
  - `getAccountConfig(fetchFn?): Promise<{ apiBase: string, demoId: string }>` reading `/config.json` keys `public.default['shopper-api']` and `public.default['demo-id']`
  - `accountApi(path: string, options?: { method?: string, body?: object, auth?: boolean }): Promise<object>` sending `demoId` in the body (POST) or query (GET), the bearer token when `auth`, and throwing an `Error` with `.status` and the service's `error` message otherwise
  - `applySessionPriceBook(): Promise<void>` (dynamic-imports `@dropins/tools/event-bus.js`; emits `events.emit('auth/adobe-commerce-optimizer', { priceBookId })` using `priceBookFor(getSession()?.shopper.group)`; does nothing when signed out)

- [ ] **Step 1: Write failing tests** in `tests/account.test.mjs` (`node:test`, fake storage object): `getSession returns null when empty, malformed JSON or expired`; `setSession then getSession round-trips and computes expiresAt from expiresIn`; `clearSession removes it`; `priceBookFor: member -> member; guest, wholesale, retail, undefined -> guest`; `safeReturnPath accepts /products/x?y=1 and rejects //evil.com, https://evil.com, /\\evil.com, javascript:alert(1), empty and null (returns fallback)`.
- [ ] **Step 2: Run `npm test`; confirm failures.**
- [ ] **Step 3: Implement `scripts/account.js` to the interfaces above.** Storage and clock are injectable parameters so tests need no browser.
- [ ] **Step 4: Run `npm test` and `npm run lint`; confirm pass.**
- [ ] **Step 5: Housekeeping edits:**
  - `config.json`: add under `public.default` `"shopper-api": "<stage base URL from the SVC README>"` and `"demo-id": "<demoId from Task 1>"`.
  - `demo/seed/settings.json`: change the price books to `guest` and `member` to match the tenant, and `defaultPriceBookId` to `guest`; run `cd demo && npm test && npm run validate -- --source=local` and fix any product price rows still using `retail`.
  - `AGENTS.md`: add a section "Demo accounts" saying sign-up, sign-in and the member switch are allowed through `frescopa-demo-services`; the welcome email provider is an approved server-side service; the session token lives in `sessionStorage`; the `commerce-*` blocks remain out of scope.
- [ ] **Step 6: Commit** `feat: account module, config and AGENTS.md`.

### Task 7: Price book applied from the session

**Files:**
- Modify: `scripts/scripts.js` (one line after `await initializeCommerce()` in the commerce branch)
- Test: browser check

**Interfaces:**
- Consumes: `applySessionPriceBook()` from `scripts/account.js` (dynamic import: `(await import('./account.js')).applySessionPriceBook()`).

- [ ] **Step 1: Add the call** immediately after `await initializeCommerce();` so the price-book event fires after the auth drop-in's own empty emit (which otherwise clears the header) and before the product block loads.
- [ ] **Step 2: Browser check on a PDP (`/products/fresco-original/csm5125`, `aem up`):** with no session the price is `$299.00`; after `sessionStorage.setItem('frescopa-account', JSON.stringify({ token: 'x', expiresAt: Date.now() + 3.6e6, shopper: { shopperId: 'x', email: 'a@b.c', name: 'A', group: 'member' } }))` and a reload the price is `$254.15`; with an expired `expiresAt` it is `$299.00` again. Expected: matches, and no new console errors.
- [ ] **Step 3: `npm run lint`; commit** `feat: apply session price book on commerce pages`.

### Task 8: `create-account` and `sign-in` blocks

**Files:**
- Create: `blocks/create-account/create-account.js|css`, `blocks/sign-in/sign-in.js|css`

**Interfaces:**
- Consumes: `accountApi`, `setSession`, `getSession`, `safeReturnPath` from `scripts/account.js`.
- Produces: `export default function decorate(block: Element): void` in each block. Form fields use `autocomplete` values: `name`, `email`, `new-password` (create) / `current-password` (sign in). On success: `setSession(response)` then `window.location.assign(safeReturnPath(new URLSearchParams(location.search).get('return')))`. Errors render in a `role="alert"` element: `409` shows "That email already has an account", `401` shows "Invalid email or password", `429` shows "Too many attempts, try again shortly", anything else shows the service's message or "Something went wrong, try again".

- [ ] **Step 1: Implement both blocks** from the approved mockup (labels and links from Global Constraints; create form has Name, Email, Password; each links to the other with `?return=` preserved). The submit button is disabled while the request is pending and re-enabled on error. A signed-in visitor who opens either page is sent to `/account`.
- [ ] **Step 2: Style** with D1 tokens (`--crema`, `--ink`, `--roast`, `--ember`), 44px inputs and buttons, pill button, focus ring from `styles/styles.css`, mobile-first with no horizontal scroll at 390 and 1440. Run `npm run lint`.
- [ ] **Step 3: Browser check** with a throwaway page (`drafts/`, not committed) at 1440 and 390: create an account (real service), land on `/account`; submit twice quickly and see one account and one error; wrong password shows the alert; `?return=//evil.com` lands on `/account`. Expected: all pass, no console errors.
- [ ] **Step 4: Commit** `feat: create-account and sign-in blocks`.

### Task 9: `account` block

**Files:**
- Create: `blocks/account/account.js|css`

**Interfaces:**
- Consumes: `getSession`, `clearSession`, `setSession`, `accountApi` from `scripts/account.js`.
- Produces: `export default function decorate(block: Element): void`. Signed out or expired: `location.replace('/account/sign-in?return=/account')`. Signed in: shows the `Your account` heading (one `h1` on the page), name, email, a switch (`<button role="switch" aria-checked>` labelled `Member`) and `Sign out`. Toggling calls `accountApi('shopper/membership', { method: 'POST', body: { member }, auth: true })`, then `setSession(response)`. A `401` clears the session and redirects as above; a `409` shows an inline message and leaves the switch unchanged.

- [ ] **Step 1: Implement and style** (D1; switch is a visible control with a text label, state not carried by colour alone).
- [ ] **Step 2: Browser check:** sign in, toggle on, open a PDP and see `$254.15`; toggle off, see `$299.00`; reload `/account` stays signed in; **Sign out** clears the session and returns to `/`; with an expired session the page redirects to sign-in with `return=/account`. Expected: all pass at 1440 and 390.
- [ ] **Step 3: Commit** `feat: account block`.

### Task 10: Header, DA pages and nav

**Files:**
- Modify: `blocks/header/header.js`, `blocks/header/header.css` (only if needed)
- DA content (via the DA tools): `/account/create`, `/account/sign-in`, `/account`, and `/nav`

**Interfaces:**
- Consumes: `getSession` from `scripts/account.js`.

- [ ] **Step 1: Header behaviour.** After `buildTools`, when a session exists remove the tool links whose `href` ends with `/account/sign-in` or `/account/create`; the account icon link stays. No commerce code is loaded.
- [ ] **Step 2: Author DA content.** Each page is one section with one block (`create-account`, `sign-in`, `account`) and metadata `title` and `robots: noindex`. Edit `/nav` tools list to: `My Account` (icon link to `/account`), `Sign in` (`/account/sign-in`), `Create account` (`/account/create`). Preview all four, never publish.
- [ ] **Step 3: Full browser check at 1440 and 390 on the branch preview:** signed out shows `Sign in` and `Create account`; after sign-up the header hides them and the icon link opens `/account`; no console errors beyond the known cart/wishlist ones; no horizontal scroll at 360, 390, 768, 1024, 1440, 1920.
- [ ] **Step 4: `npm run lint`; open the SITE PR** with preview links for `/account`, `/account/sign-in`, `/account/create` and one PDP; state that the welcome email is verified separately by the user.
- [ ] **Step 5: Commit** `feat: header account links and account pages`.

---

## Self-review

- **Spec coverage:** goals (real accounts, open sign-up, member switch, account page, three forms, welcome email, guest default) map to Tasks 1, 3, 4, 8, 9; non-goals have no tasks by design; anti-goals map to Tasks 1 to 4 tests; registration is Task 1; service config, price-book mapping, group handling for non-guest/member groups, limits, token life, session location and AGENTS.md amendment are in Tasks 2, 3, 6, 7 and 6.
- **Types:** `getSession`, `setSession`, `priceBookFor`, `safeReturnPath`, `accountApi` and `applySessionPriceBook` are defined in Task 6 and used with the same names in Tasks 7 to 10; `sendWelcome` and `welcomeMessage` are defined in Task 4 and used only there.
- **Proportion:** the plan states decisions, signatures and test assertions, with bodies left to the implementer.
