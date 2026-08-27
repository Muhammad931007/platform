# Human-view all-label audit

Audit date: 2026-08-27  
Source of observation: Chromium-rendered live admin pages and live client landing
page, plus the local portable replica. The live session was read-only after login;
no production mutation was submitted.

## Visual evidence

`visual_audit_results.json` contains one record for each of 27 authenticated admin
routes. `visual_audit_screenshots/` contains a full-page screenshot for every admin
route plus the live client home. A page counted as visually present only when its
rendered body contained meaningful text and its controls were discoverable in the
browser DOM.

## Human-view results

- Admin pages visited: **27/27**.
- Admin pages with visible rendered content: **27/27**.
- Total visible admin controls across the pages: **2,341**.
- Client landing page rendered visible copy, navigation, cards, service visuals,
  trust/award/press sections, and footer.
- Live member list rendered **248** controls in this traversal and exposed identity,
  sponsor, metadata, task, financial, status, search, pagination, and operation labels.
- Live admin login, dashboard, member page, and all other captured pages loaded without
  a blank/HTTP-only success state.

## Label/use-case verification model

### 5W1H

For each visible label, the audit asks: **Who** acts; **What** record or projection it
represents; **When** it is valid; **Where** it appears and which route owns it; **Why**
the user/operator needs it; and **How** the event travels through validation, state
transition, persistence, audit, and refresh.

### First principles

Every feature is one of: read a source record, filter a projection, or issue a command.
Commands reduce to authenticate → validate → atomically transition → append ledger/audit
evidence → return typed result → refresh dependent views. Labels such as 余额, 订单状态,
会员状态, and 奖励金 are projections of those sources, not independent truths.

### Second-order effects

Changing one label can affect other pages: a deposit changes balance/dashboard/member
funds; a VIP level changes task limits/commission; a sponsor changes team rewards; a
freeze changes withdrawal and login operations; a product/rule change affects future
orders but must not rewrite settled orders. The UI must invalidate all dependent cards.

### Inversion

The inverse tests are double-click/retry, stale token, negative amount, frozen user,
cyclic sponsor, duplicate reward claim, conflicting deposit decisions, and a failed
upload or partial write. Safe behavior is rejection or one idempotent transition with
no orphaned money/state.

### MECE

Labels were grouped into identity/access; member/hierarchy; tasks/commerce;
money/settlement; rewards/engagement; content/communication; administration/audit;
and platform/quality. Each label has one owning group and explicit cross-group effects.

### GYEFIN

For each feature the catalogue records Goal, Why, Events, Functions, Information, and
Non-functionals. This prevents a visual control from being considered complete when it
has no use-case, source data, validation, or error behavior.

## Frontend → backend protocol proof

1. Visible UI event emits JSON/form data. The client’s nested `data` wrapper and
   `phone/pwd` login names are normalized at the shared handler boundary.
2. Client requests use `/myapi`; admin pages/actions use `/admin/...`; GET query values
   are merged with request input.
3. Client success is `code:0`; admin/local action success is `code:1`; both carry
   `msg/info/data`. `code:302` is a session-expiry event and returns the user to login.
4. The handler validates the actor and command, updates the authoritative fixture
   collection, and returns a typed response. The UI then refetches projections.
5. Local route coverage confirms 35/35 admin actions, 73/73 modal routes, and 34/34
   embedded actions. All 57 non-dependency JavaScript files pass syntax checks.

## What was actually proven

- Labels and controls are visible in real rendered pages, not merely present in source.
- Every captured live admin page has meaningful visual output and discoverable controls.
- Client login can be typed and clicked in Chromium and reaches the local home page.
- Local endpoint, state, and refresh contracts are exercised by the portable suite.
- Live admin authentication and read-only navigation work with the supplied account.

## Boundary

Visual parity does not reveal private production authorization rules, payment/blockchain
settlement, SMS/Google credentials, risk/commission algorithms, or production database
truth. Those require backend contracts and should be added as contract tests before any
real-money or production integration.
