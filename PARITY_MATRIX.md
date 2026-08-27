# Live-to-portable parity matrix

Comparison date: 2026-08-26. Live checks were read-only after authentication; no
production mutation was submitted.

## Verified parity

| Surface | Live observation | Portable observation | Status |
|---|---|---|---|
| Admin login | Live login page accepted the supplied admin credentials and opened the dashboard. | Local login accepts `LOCAL_ADMIN_PASSWORD` without storing it in source. | Verified shape |
| Admin dashboard | Dashboard navigation, cards, totals, and admin identity rendered. | Dashboard shell and local fixture cards render. | Visual/route parity |
| Member list | Live page rendered 234 controls and all requested member/action labels. | Local page rendered 232 controls and all requested member/action labels. | Label parity; count differs by live data/toolbar state |
| Member detail/modal | Live detail controls and modal links are present. | Representative detail/modal opens; 73 referenced modal routes pass. | Verified route behavior |
| Admin action routes | Live controls expose status, ledger, team, order, reward, and notification actions. | 35/35 local action routes return the expected local envelope. | Local functional parity |
| Client authentication | Live client surface is available. | Real Chromium typing/clicking login reaches local home dashboard. | Local human-view pass |
| Client home visuals | Live/public branding and home content are visible. | Home cards, navigation, service/press/award visuals render locally. | Visual surface pass |
| Client/admin synchronization | Live data source is private. | Shared local handler and fixture make local writes visible after refetch. | Local contract pass |

## Local-only exhaustive checks

- 57 non-dependency JavaScript files pass `node --check`.
- 73/73 modal/form routes referenced by captured admin pages return HTTP 200.
- 34/34 embedded admin action routes return successful local responses.
- Client GET information/upload checks and expired-session redirect contract pass.
- Portable verification passes from `E:\Visual` using bundled Node.js 24.19.0.

## Intentionally not claimed as identical

These require private production contracts, credentials, or server-side state and
cannot be proved from public browser output alone:

- Real payment/USDT settlement, confirmations, refunds, and blockchain monitoring.
- SMS provider delivery, Google authentication, and anti-abuse/rate-limit policy.
- Production authorization scope, operator audit retention, and session invalidation.
- Risk/credit scoring, commission calculation, linked-order generation, and lottery
  algorithms.
- Production database records, balances, users, and historical order truth.

## Operational interpretation

“Pass” means the visible route/control, request shape, response contract, and local
state transition were exercised. It does not mean a local fixture can settle real
funds or reproduce private production algorithms. Before production use, connect the
handlers to documented backend contracts and add contract tests for each row/action
in the admin member view.
