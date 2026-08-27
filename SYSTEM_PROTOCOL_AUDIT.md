# ERP client/admin systems and protocol audit

Audit scope: all visible labels and controls represented by the client build, captured
admin pages, shared local handler, fixture database, launchers, and browser-visible
production comparison. Audit date: 2026-08-26.

## 1. MECE feature domains

The feature universe is partitioned into eight non-overlapping domains:

1. **Identity and access** — login, registration, passwords, roles, permissions,
   sessions, online/offline state.
2. **Member and hierarchy** — member profile, sponsor/invite graph, team, credit,
   VIP level, login evidence.
3. **Tasks and commerce** — products, order/task lifecycle, linked orders, matching,
   scheduling, ratings, completion counters.
4. **Money and settlement** — balance, recharge, withdrawal, fees, reserves, ledgers,
   USDT/bank methods, interest product.
5. **Rewards and engagement** — check-in, bonuses, referral rewards, promotions,
   lottery, gifts.
6. **Content and communication** — home copy, banners, notices, news, FAQs,
   certificates, agreements, support, SMS.
7. **Administration and audit** — dashboards, operator actions, logs, configuration,
   menus, reports, storage, cleanup.
8. **Platform and quality** — HTTP contract, async refresh, portability, browser
   support, error handling, security, observability, and backup.

No label should be implemented outside one owning domain; cross-domain effects are
explicit dependencies below.

## 2. 5W1H traceability contract

For every button, word, icon, table, popup, and chart:

| Question | Required answer |
|---|---|
| Who | Actor and role: guest, member, support, finance, operator, or administrator. |
| What | Record/field changed or projection read; command versus filter is explicit. |
| When | Valid state, timing, idempotency window, expiry, and retry behavior. |
| Where | Client/admin screen, route, modal, API endpoint, and persisted collection. |
| Why | User/operator goal and business justification. |
| How | Validation → authorization → atomic transition → response → UI invalidation/refetch → audit. |

A label is “implemented” only when all six answers are documented or deliberately
marked as a production-contract dependency.

## 3. GYEFIN feature lifecycle

- **Goals:** the measurable outcome (for example, approve a deposit, complete a task,
  or publish a notice).
- **Why:** user value, operational value, and risk reason.
- **Events:** page load, search, click, submit, timeout, approval, rejection, retry.
- **Functions:** query, validate, mutate, calculate, notify, refresh, export.
- **Information:** fields, types, ownership, sensitivity, source-of-truth, retention.
- **Non-functionals:** authorization, idempotency, latency, availability, auditability,
  masking, accessibility, portability, and rollback.

## 4. First-principles protocol model

Every frontend operation reduces to this pipeline:

```text
UI intent
  → canonical command (actor, action, idempotency key, payload)
  → HTTP transport (JSON/form, auth token, locale)
  → validate and authorize
  → atomic state transition + append audit/ledger event
  → typed response
  → invalidate dependent projections
  → refetch and render success/error state
```

### Current local wire contract

- Client URL prefix: `/myapi`; admin page/action URLs: `/admin/...`.
- JSON or URL-encoded POST bodies are accepted. Client-wrapped `data` and nested
  registration `info` are flattened at the shared handler boundary.
- GET query parameters are merged into handler input.
- Client success envelope: `{code:0,msg,info,data}`; admin/local action success:
  `{code:1,msg,data}`. Rejection is `code:0` or a typed error; expired session is
  `code:302`; unknown local route is `code:404`.
- Client `302` is an interceptor event that clears session and navigates to login.
- `LOCAL_ADMIN_PASSWORD` is process-only; credentials are not stored in source.

### Canonical state ownership

| State | Authoritative local source | Projections that must refresh |
|---|---|---|
| Member identity/status | `users[]` | Member list/detail, profile, team, login state. |
| Balance/recharge/withdrawal | ledger-like `recharges[]`, `withdraws[]`, user balance | Wallet, dashboard, member funds, cash/recharge logs. |
| Orders/tasks | `orders[]` and user counters | Client task/order screens, admin order list, commissions. |
| VIP | `vipList[]` plus user `vip_level` | Client VIP cards, member level, task limits. |
| Check-in/rewards | `checkins[]`, `rewardClaims[]` | Client reward/check-in, admin logs, wallet income. |
| Public content | `news[]`, `help[]`, `certificates[]`, config | Client home/news/help/certificate/support surfaces. |
| Admin audit | operator/action log contract | Oplog, adjustment logs, security review. |

## 5. Second-order dependency graph

```text
Admin money/status/order command
  ├─ member projection
  ├─ wallet/ledger projection
  ├─ task/order counters
  ├─ VIP/credit/withdrawal eligibility
  ├─ team commission/reward totals
  ├─ notifications and audit log
  └─ client cards/history after refetch
```

The UI must refresh all downstream projections after a successful command. Updating
only the clicked row is a consistency defect.

## 6. Inversion and failure tests

Ask how each feature could harm a user or corrupt money, then test the inverse:

- Double-click/retry a money or reward command → one ledger event, idempotent result.
- Submit negative/zero/overflow amount → validation rejection, no balance change.
- Use frozen/禁止提现/disabled member → correct gate, no partial reservation.
- Reuse expired/stale token → `302`, no mutation, clear session.
- Submit out-of-order order transition → `code:0`, state unchanged.
- Change sponsor to self/cycle → reject, team graph unchanged.
- Approve then reject same deposit → explicit state machine, no double credit.
- Delete/clear logs → permission, confirmation, retention and audit policy required.
- Fail content/image upload → visible error, no broken client card or orphan record.
- Kill/restart server during write → atomic/recoverable fixture state, no half-write.

## 7. Responsibility (RACI) by operation

| Operation | Responsible | Accountable | Consulted | Informed |
|---|---|---|---|---|
| Member profile/status | Support/operator | Admin owner | Risk/security | Member |
| Balance adjustment/deposit | Finance operator | Finance owner | Audit/risk | Member |
| Withdrawal approval | Finance operator | Finance owner | Risk/compliance | Member |
| Order/task rule | Deal operator | Product/admin owner | Finance/support | Member/team |
| VIP/reward configuration | Product/admin owner | Business owner | Finance/risk | Members |
| Content/support publishing | Content operator | Admin owner | Support | Members |
| Roles/menus/config | System administrator | Security owner | Audit | Operators |

## 8. Technical recheck performed

- All 57 non-dependency JavaScript files in `E:\Visual` pass `node --check`.
- Portable suite passes client/backend home, client login contract, information and
  upload checks, expired-session handling, admin login/page/action, 35 action routes,
  73 modal routes, and 34 embedded actions.
- Chromium human-view pass reaches the client home after typing login credentials and
  clicking the visible control; admin member page renders requested fields/actions.
- Live production admin browser check succeeded; dashboard and member list rendered,
  all requested member/action labels were present, and no live mutation was submitted.
- `E:\Visual` contains the bundled Node runtime, launchers, source, fixtures, captures,
  catalogues, screenshots, and reports; no external Desktop source is required.

## 9. Contract gaps requiring production backend documentation

Visible labels cannot prove private implementation for real payment settlement,
blockchain confirmation, SMS delivery, Google auth, authorization scope, risk/credit
algorithms, commission/lottery generation, audit retention, or production data truth.
Before replacing fixtures, obtain typed contracts for each endpoint and add contract
tests for request schema, response schema, authorization, state transitions,
idempotency, and reconciliation.

## 10. Definition of done

The portable replica is complete for visible UI/route behavior when every label has an
owner and relationship, every command has a safe state transition, every projection
refreshes, every error is visible, and the verification suite remains green. It is
production-integrated only after the contract gaps above are supplied and tested.
