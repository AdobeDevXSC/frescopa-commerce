# Demo accounts: create account, sign in, member switch

Status: draft for approval. Date: 2026-11-05. Marks: **[decided]** = said by the user; **[my call]** = an assumption the user has not confirmed.

## Intent

The Fréscopa demo kit needs an account experience so a presenter can show **member pricing**. A visitor creates an account, signs in, flips a "member" switch, and every product page then shows the member price instead of the guest price. It is a demo feature: no real customers, no checkout, no personal data beyond a throwaway name and email.

Why it is cheap to build: ACO already has `guest` and `member` price books, and the copied storefront code already switches price books when a shopper's group changes (the `auth/adobe-commerce-optimizer` event, which sets the `AC-Price-Book-ID` header). The App Builder app `frescopa-demo-services` already has demo shoppers with scrypt-hashed passwords, signed tokens, rate limits and CORS. What is missing is self-service sign-up, a self-service group change, a welcome email, and the storefront pages.

## Goals

- **[decided]** Real accounts: email and password, passwords hashed, a signed session. Stored in the App Builder Database.
- **[decided]** Anyone can create an account, in **every** registered demo (no per-demo switch).
- **[decided]** A signed-in person can switch member on and off themselves; membership drives guest/member pricing on the PDPs.
- **[decided]** Pages: Create account (name, email, password), Sign in (email, password) and an Account page (name, email, Member switch, Sign out). The switch lives on the Account page, not in a header menu or on the PDP.
- **[decided]** One email: a welcome message when an account is created. Sent through a free email provider's HTTPS API.
- **[my call]** New accounts start as guest.

## Non-goals

- Email verification, password reset, account deletion, social/SSO sign-in, checkout, saved addresses.
- Security-grade pricing protection. ACO prices are public; the switch only changes which price book the browser asks for. State this in the demo notes.
- Anything for the production App Builder workspace (the README says production is not deployed).

## Anti-goals (failure even if it "works")

- Passwords, tokens, API keys, or `JWT_SECRET` in git, logs or error messages.
- A shopper being able to set any group other than guest/member (for example `wholesale`).
- A welcome-email failure blocking sign-up.
- Sign-up being used to flood one demo: it must be rate limited.

## Existing system (read from `/Users/lamont/Workspace/frescopa-demo-services`)

- App Builder app on the stage workspace; Node 22 actions; App Builder Database (`@adobe/aio-lib-db`), collections `demos`, `shoppers`, `carts`, `orders`, `events`, `ratelimits`.
- Public actions go through `publicAction` (CORS for `*.aem.page`, `*.aem.live`, registered demo hosts; per-IP and per-demo rate limits; every request carries `demoId`). Login returns an HS256 JWT (1 hour) with `demoId`, `shopperId`, `group`. `shopper/me` reads `group` from the database.
- Shopper records: `shopperId, demoId, email, name, group, passwordHash, createdAt`. `admin/shoppers` (IMS-authenticated) creates shoppers today.
- Unit tests with an in-memory db fake (`npm test`), and an end-to-end curl script (`e2e/curl-e2e.sh`).

## Design

### Service: `frescopa-demo-services`

1. **`shopper/signup`** (public, no JWT, like `shopper/login`): input `demoId, name, email, password`. Validates with the existing validators, creates the shopper with `group = guest` **[my call: the group value is whatever the demo treats as the non-member default; `guest`]**, returns the same `{ token, expiresIn, shopper }` as login, so the person is signed in immediately. `409` if the email exists in that demo. Stricter per-IP limit than login **[my call]**. Audit event `shopper.signup`.
2. **`shopper/membership`** (public, JWT required): input `demoId, member: boolean`. Sets the caller's own `group` to `member` or back to `guest`; no other group is accepted; the caller is taken from the token, never from the body. Returns `{ shopper }` and a fresh token. Audit event `shopper.membership`.
3. **Welcome email** after sign-up: one HTTPS call from the action to an email provider **[my call: Brevo, free tier, single verified sender; builder may substitute Resend or another]**. Provider key and sender address come from action inputs set in `.env` at deploy (like `JWT_SECRET`), never committed. Send failure is logged and ignored. The email wording is new copy: the builder drafts it and the user approves it before it ships.
4. Sign-out is client-side (drop the token). Tokens are valid for one hour.
5. Tests and docs: unit tests for both actions (including "group other than guest/member is rejected" and "email failure does not fail sign-up"), additions to `e2e/curl-e2e.sh`, README sections for the new endpoints and inputs. Deploy to the **stage** workspace only.

### Storefront: `frescopa-commerce`

- Three blocks and three DA pages: `create-account` (`/account/create`), `sign-in` (`/account/sign-in`), `account` (`/account`) **[my call: block names and paths]**. D1 styling, scoped CSS, accessible forms (labels, inline errors, focus rings, 44px targets), no inline script/style, no `!important`.
- Header: "Sign in" and "Create account" when signed out; "Your account" when signed in.
- Session: the token and shopper are kept in `sessionStorage` **[decided by the service README's guidance; my call to use it]**. On `401` the person is asked to sign in again.
- After sign-in or sign-up the person returns to the page they came from, else `/account`. After sign-out, the home page.
- Pricing: after sign-in, membership change or page load with a valid token, emit `auth/adobe-commerce-optimizer` with the price book for the shopper's group. `guest` maps to price book `guest`, `member` to `member` **[my call; matches the tenant today]**. Signed-out visitors keep `guest` pricing. The mapping must be reconciled with `demo/seed/settings.json`, which currently lists `retail`, `member` and `wholesale`.
- Site config: add the service base URL and the demo's `demoId` to `config.json` (public values) **[my call]**.
- `AGENTS.md`: amend it, which currently says account and login flows stay on the live site, to allow this demo-account feature (and the existing mention of "no `commerce-*` account blocks" stays true: these are new, small blocks).

## Constraints

- EDS rules in `AGENTS.md` (no build step, scoped CSS, `fragment/fragment.js` the only cross-block import, no third-party scripts, no invented copy).
- No secrets in git in either repo.
- Keep `scripts/aem.js` untouched; keep `scripts/scripts.js` changes minimal and generic.

## Calls made after the design review (all **[my call]**)

- **Price books.** The live ACO tenant has `guest` and `member` price books (checked: `guest` returns prices for all 18 products; `retail` returns none). The non-member group is `guest`. `demo/seed/settings.json` still lists `retail`, `member`, `wholesale` and is stale; the plan includes a small change to the seed to match the tenant. No tenant-side change.
- **Other groups.** Sign-in works for every existing shopper. The storefront maps `member` to price book `member` and every other group (including `retail` or `wholesale`) to `guest`. `shopper/membership` refuses (`409`) for a shopper whose group is neither `guest` nor `member`, so their group is never overwritten.
- **Email and third parties.** The welcome email is a server-side call to one free provider with the shopper's name and email. The `AGENTS.md` amendment names that provider as an approved server-side service. No extra consent text on the form (demo accounts, throwaway data); this is the one thing to flag in demo notes.
- **Sign-up limits.** 5 sign-ups per minute per IP, using the existing `ratelimits` collection, plus a cap of 200 self-service shoppers per demo (a count check at sign-up, `429` when reached). Both numbers are configurable inputs.
- **Token life.** Version 1 keeps the one-hour token. If it expires, the person signs in again. No refresh action.
- **Where session code lives.** A small module in `/scripts/` reads `sessionStorage`. The header block uses it on every page without loading the commerce runtime. The price-book event is emitted only on pages that load the commerce runtime.

## Left to the builder

File and class names, exact error wording (kept short and plain), form validation details beyond the service's rules, the token refresh approach if the one-hour limit proves annoying in demos, and test structure.

## Open items that only the user can answer

- Sender email address and provider account for the welcome email.
- Whether this site (`frescopa-commerce`) is already registered in the service's registry and what its `demoId` is.
- Approval of the welcome-email wording.
