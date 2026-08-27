# Human-view feature description and test report

Test date: 2026-08-26  
Test method: Chromium rendered UI at 1440×900, real text entry and visible-control
clicks, screenshots, and browser console/network observation. This is a user-flow
test, not only a route/unit test.

## What each visible feature does

### Client

- **Sign In / 登录**: accepts the registered username/phone and password, stores the
  session, marks the user online, then opens the home dashboard.
- **Sign up / 注册**: collects phone, password, payment password, invitation code,
  gender, verification code, and agreement consent to create an account.
- **Forgot password / 忘记密码**: starts account recovery through a verification
  code; the local replica displays its configured local limitation.
- **Remember me**: toggles persistence of the typed login identity.
- **Home cards**: show balance, income, VIP level, notice, banners, and activity.
- **Notice/news/help/certificate**: popup notices, news list/detail, FAQ/help detail,
  certificates, and public activity logs.
- **Tasks / rotation orders**: starts, continues, and stops a task session; the order
  state moves through accepted, in-progress, completed, or failed.
- **Order list/detail/rating**: displays history, opens an order, submits an order
  operation, and rates a completed order.
- **Wallet**: shows spendable/frozen balance, USDT address, recharge, withdrawal,
  and account/recharge/cash ledgers.
- **VIP**: lists levels, rates, order limits, current level, benefits, and purchase.
- **Profile/security**: edits real name, gender, avatar, address, login password,
  payment password, and wallet-password verification.
- **Bank/USDT binding**: stores a bank card or USDT address/type for payment flows.
- **Invite/team**: displays referral code/link, team tree, and team performance log.
- **Check-in/reward**: records daily check-in and makes an eligible reward claim
  idempotently.
- **Support/contact**: shows configured Telegram, WhatsApp, live-chat, and service
  hours. Public support configuration is available before login.

### Admin

- **会员列表**: searchable table of members with identity, sponsor, metadata, task
  counters, financial projection, status, and operation controls.
- **会员信息**: ID, invitation code, phone, username, email, sponsor, sponsor code,
  level, registration/login IP and location/time, reputation, and task counters.
- **资金余额**: total assets, principal-plus-profit, balance, recharge, withdrawal,
  income, and linked-order amount; totals are projections of fixture ledger data.
- **会员状态**: offline/online, active/disabled, frozen, ordinary account, and
  historical completed-order quantity.
- **基础资料**: opens member detail/edit modal.
- **加扣款**: records a balance addition/deduction with an operator reason in a real
  deployment; local fixture behavior is constrained to its local handler.
- **钱包**: opens wallet/payment controls.
- **重置任务 / 重置佣金**: resets task or commission projections while preserving
  the operation response/audit intent.
- **添加连单 / 普通方式**: creates linked-order or ordinary-order paths.
- **账变信息 / 连单列表**: read-only financial and linked-order history.
- **改单数**: changes task/order count with confirmation expected.
- **查看团队 / 登录历史**: opens referral tree or login evidence.
- **禁用 / 禁止提现**: disables account operations or only withdrawal operations.
- **发送通知 / 配置奖励金**: sends a notification or configures/grants a bonus.
- **Dashboard**: totals and shortcuts.
- **Deals**: order console, order list, product catalogue, deposit review and bulk
  approve/reject.
- **Accounts/logs**: account ledger, adjustment log, operator log, and login history.
- **Users/access**: admin users, roles, permissions, menu visibility, and member
  levels.
- **Check-in/config/reports/content**: check-in records, system values, charts,
  notices, banners, agreements, help, rules, and information pages.

## Browser-visible test results

| Flow | Result | Evidence |
|---|---|---|
| Client opens | PASS | Rendered sign-in page visible with logo, fields, remember-me, recovery, sign-up, support, footer. |
| Client invalid/pre-session state | PASS | Expired-session toast and redirect behavior are visible rather than a blank page. |
| Client login typing/click | PASS | Typed `testuser` / password into rendered fields and clicked visible Sign In; browser reached `/` home. |
| Client home after login | PASS | Home visibly rendered “Independent ERP Software Research”, balance/deposit/withdrawal/VIP/content sections. |
| Admin member list | PASS | Rendered Chinese table with member information, sponsor data, metadata, task quantity, funds, status, and action buttons. |
| Admin controls | PASS | Visible operation controls include 基础资料, 添加连单, 普通账号, 查看团队 and related actions. |
| Admin detail/modal route | PASS | Representative member action opens a local detail/form surface and returns a success envelope. |
| Cross-surface persistence | PASS (local) | Shared fixture handler means successful local writes are available on the next client/admin fetch. |

Screenshots captured during this test:

- `client_human_home.png` — sign-in surface before authentication.
- `client_human_after_login.png` — client home after the corrected login flow.
- `admin_human_users.png` — admin member list and visible operations.

## Fix made as a result of human testing

The compiled client sends `{data:{phone,pwd}}`, treats `code:0` as success, and sends
`/user/online` immediately after login. The shared handler now flattens wrapped
payloads, accepts phone/password aliases, returns client-compatible `code:0` plus
`info`, exposes the heartbeat, and keeps pre-login support requests public so an
in-flight 302 cannot clear a newly established session.

## What “same as production” can and cannot mean

The visible labels, layout, routes, request shapes, and local state transitions are
tested here. Exact production parity for authorization, settlement, payment/USDT
confirmation, SMS delivery, Google authentication, risk scoring, and private data
requires the real backend contracts and credentials; those are not present in the
browser-visible assets and are intentionally not invented.

## Live production-visible comparison (read-only)

On 2026-08-26 the supplied admin credentials were used only to sign in and inspect
the live pages; no live mutation button was submitted. Both production URLs returned
HTTP 200. The live admin dashboard rendered successfully, then the live member-list
hash rendered with 234 clickable/input controls and every requested member label and
operation label. The local E:\\Visual member-list rendered the same requested labels
and the same functional control groups; local exhaustive testing covered 232 rendered
controls plus all referenced action/modal routes. The small control-count difference
is expected from live data/toolbar state and is not treated as proof of backend
identity. Screenshots: `live_admin_login_check.png` and
`live_admin_member_list_check.png`.
