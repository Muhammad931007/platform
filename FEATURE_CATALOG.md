# ERP Research Prime — feature catalogue and reasoning specification

This is the portable, implementation-oriented inventory of every visible client and
admin surface captured in this workspace. “Feature” includes text, a button, a form,
a table, a chart, a popup, or a route consumed by the UI.

## Scope and completeness

The local bundle contains 28 captured admin pages, 70 client POST routes, client
information/upload GET routes, 35 explicit admin actions, 73 modal routes, and 34
embedded action routes. Client and admin share `Backend/api_handler.js` and
`Backend/data/db.json`, so a successful write is observable by the other surface on
the next fetch. This is a browser-visible functional replica: private production
database rules, payment gateways, SMS/Google credentials, risk algorithms, and server
source were not exposed and are not fabricated here.

## Reasoning framework used

### 5W1H acceptance test

For each domain, define **Who** acts, **What** changes, **When** it is valid, **Where**
it appears, **Why** it exists, and **How** it is requested, authorized, persisted,
and refreshed. A feature is incomplete if any of these six questions has no answer.

### MECE information architecture

The inventory is mutually exclusive at the top level and collectively exhaustive:
identity/access; content/support; tasks/orders; wallet/settlement; profile/security;
team/rewards; administration/audit; and platform/non-functional behavior. A label is
listed once in its owning domain, with cross-links described where it is consumed.

### First principles

Every operation reduces to four primitives: authenticate an actor, validate a command,
apply an atomic state transition, and return a typed result. Balances are ledger
outcomes (not arbitrary display numbers); order/task counts are state machines; status
flags are explicit permissions; and all displayed summaries are projections that may
be refreshed from the source record.

### Second-order thinking

An admin mutation affects more than the clicked row: it can change client balances,
VIP eligibility, team commissions, withdrawal availability, audit history, and user
notifications. Therefore local handlers return a result and the UI should invalidate
and reload dependent summaries after success.

### Inversion method

For each dangerous flow ask “How could this lose money, lock a user out, or create a
false record?” Controls include idempotency, explicit confirmation, reason fields,
permission checks, immutable/audited ledger entries, and clear error/rollback paths.

### GYEFIN lens

Use **G**oals, **Y** (why/user value), **E**vents, **F**unctions, **I**nformation, and
**N**on-functionals for each feature. This makes a visual control meaningful rather
than merely decorative.

## Admin console

### 1. 会员列表 (member list)

**Goal / 5W1H.** Who: support, finance, and authorized admins. What: find a member,
inspect a complete account projection, or issue an audited command. When: after
search/filter or opening a row. Where: `/admin/users/index.html` and its modal/detail
routes. Why: resolve account, task, and money questions from one place. How: async
JSON/form request, server validation, atomic fixture update, then list/detail refresh.

#### 会员信息 (identity)

| Label | Filled meaning | Event / validation |
|---|---|---|
| ID | Stable internal member key used by every action. | Required, immutable; never use display name as key. |
| 邀请码 | This member’s referral code. | Unique format; used to build the team graph. |
| 手机 | Registered phone (mask in production display). | Normalized and uniqueness-checked. |
| 用户名 | Login/display name. | Required; duplicate policy belongs to backend. |
| 邮箱 | Email address when supplied. | Format check; verification state should be visible. |

#### 上级资料 (sponsor/referrer)

| Label | Filled meaning | Event / validation |
|---|---|---|
| 上级 | Direct sponsoring member and link to their detail. | Must not point to self or create a cycle. |
| 上级邀请码 | Sponsor’s invitation code. | Resolved against the sponsor record, not free text. |

#### 其他信息 (metadata)

| Label | Filled meaning |
|---|---|
| 会员等级 | VIP/member level controlling benefits and limits. |
| 注册时间 | Account creation timestamp. |
| 注册IP / 注册位置 | Registration IP and derived location, if available. |
| 信誉分 | Trust/risk score used by policy gates. |
| 最后上线IP / 最后上线位置 / 最后上线时间 | Latest successful-login network and timestamp projection. |

#### 任务量 (task counters)

| Label | Filled meaning |
|---|---|
| 已完成 | Completed task/order count. |
| 总任务量 | Assigned/available task count. |
| 已接单 | Accepted and currently open count. |
| 已重置 | Number of resets, retained for audit context. |
| 已签到 | Check-in count or current check-in indicator. |

#### 资金余额 (financial projection)

| Label | Filled meaning | Inversion safeguard |
|---|---|---|
| 总资产 | Combined account assets. | Reconcile from ledger; do not hand-edit a total. |
| 资产加利润 | Principal plus accumulated profit. | Show component values and calculation timestamp. |
| 余额 | Spendable wallet balance. | Reject negative spend and concurrent double-spend. |
| 充值 | Deposits/recharges credited or pending. | Separate pending, approved, rejected. |
| 提现 | Withdrawal requested/paid amount. | Enforce frozen/禁止提现 and approval state. |
| 收益 | Profit/commission earned. | Link to source order/commission entries. |
| 连单金额 | Funds reserved or involved in linked orders. | Reserve/release atomically with order state. |

#### 会员状态 (status)

| Label | Filled meaning |
|---|---|
| 离线 | No active online session. |
| 会员状态 | Overall state such as active, disabled, or frozen. |
| 冻结 | Account/funds restricted pending review. |
| 普通账号 | Non-VIP/ordinary account flag. |
| 历史订单完成量 | Historical completed-order count. |

#### 操作 (commands)

| Action | What it does | Required second-order effect |
|---|---|---|
| 基础资料 | View/edit identity, sponsor, metadata, status. | Recheck uniqueness and write audit event. |
| 加扣款 | Add/deduct balance adjustment. | Ledger entry, reason, operator, before/after balance. |
| 钱包 | Open balances, payment methods, wallet controls. | Respect payment-password and withdrawal locks. |
| 重置任务 | Reset task/order progress. | Recompute counters; preserve prior history. |
| 重置佣金 | Recalculate/reset commission counters. | Reconcile team totals and record reason. |
| 添加连单 | Attach linked/combined order. | Reserve funds and update task state atomically. |
| 普通方式 | Use ordinary, non-linked order flow. | Avoid applying linked-order reservation rules. |
| 账变信息 | View balance-change ledger. | Read-only, paginated, operator-visible. |
| 连单列表 | View linked-order records/states. | Show reserved, active, settled, released states. |
| 改单数 | Change task/order count. | Require confirmation and audit before/after values. |
| 查看团队 | Show direct/downline referral tree. | Prevent cycles; respect data-access scope. |
| 登录历史 | Review login IP/location/time history. | Append-only security evidence. |
| 禁用 | Disable login/operations. | Invalidate sessions and explain user-facing reason. |
| 禁止提现 | Keep account active but block withdrawals. | Reject withdrawal commands with explicit status. |
| 发送通知 | Send in-app/SMS-style notification. | Record delivery attempt and avoid duplicate sends. |
| 配置奖励金 | Configure/grant reward or bonus. | Eligibility check, ledger entry, expiry, audit. |

### 2. Other admin modules (MECE map)

| Route / visual | Feature filled from its words and controls |
|---|---|
| `/admin/index/main.html` | Dashboard cards, totals, shortcuts, operational health. |
| `/admin/users/index.html`, `cs_list.html` | Member search/list, customer-service filtering, detail modals. |
| `/admin/users/level.html` | VIP/level definitions, limits, benefits, member assignment. |
| `/admin/users/login_history.html` | Login time, IP, location, device/session history. |
| `/admin/user/index.html` | Admin/operator accounts and enable/disable actions. |
| `/admin/auth/index.html` | Roles, permissions, scope, and access assignment. |
| `/admin/menu/index.html` | Navigation/menu visibility and ordering. |
| `/admin/oplog/index.html` | Operator audit/action log and filters. |
| `/admin/account/acclog.html` | Account balance-change ledger. |
| `/admin/account/adjustlog.html` | Manual adjustment records and reasons. |
| `/admin/deal/order_list.html` | Order/task table, filters, status, detail, rating/result. |
| `/admin/deal/deal_console.html` | Live deal/order operations and state controls. |
| `/admin/deal/deposit_list.html`, `deposit_list_test.html` | Deposit review, approve/reject, bulk actions. |
| `/admin/deal/goods_list.html` | Goods/product catalogue used by order generation. |
| `/admin/checkin/member_checkin_log.html` | Check-in records, eligibility, and rewards. |
| `/admin/config/info.html` | System/service configuration values. |
| `/admin/plots/index.html` | Charts/plots for volume, money, and activity trends. |
| `/admin/help/*.html` | Notices, banners, agreements, help, lottery/rules, information content. |
| `/admin/login/index.html` | Admin authentication; portable launcher reads `LOCAL_ADMIN_PASSWORD`. |

## Client application

### Authentication and session

**GYEFIN:** Goal is safe entry/recovery; events are submit, verification, success,
failure, expiry; functions are login, register, forgot-password, language, agreement;
information is identity/token/error; non-functionals are rate limiting, no password
logging, and deterministic expiry. Routes: `/login/do_login_v1`, `/login/do_register`,
`/login/getcode`, `/login/do_forget`, `/login/getlang`, `/login/getagree`, plus the
provider hooks `/login/google_login` and `/login/google_register` (credentials are not
bundled).

### Home, content, and support

`/index/index` renders the home summary/cards; `/Index/getNoticePopup` renders a notice
popup; `/index/getNewsList` and `getNewsDetail` provide news feed/detail;
`/index/getHelpMsgDetail` provides help/FAQ detail; `/index/getCertificate` provides
certificates; `/index/getIndexLogList` provides public activity; `/index/updateBadge`
updates unread badges; `/Support/index` opens support; and
`/user/getCustomerServiceTime` returns service hours. Inversion: stale content must
show its timestamp or refresh state rather than silently look current.

### Tasks and orders

`/rotorder/index` is the task page; `startqd`, `startqd2`, and `stopqd` start, continue,
and stop a task session. `/order/order_list` and `order_info` show history/detail;
`/order/do_order` submits an order; `rating_order` rates a completed order. First
principles state machine: available → accepted → in-progress → completed/failed;
invalid transitions return code 0 and do not alter money or counters.

### Wallet, recharge, withdrawal, and VIP

`/My/myWallet` and `checkmywallet` show/verify wallet; `recharge_before`, `recharge_do`,
and `recharge2` implement recharge; `deposit`, `do_deposit`, and `getUsdtInfo` expose
deposit/USDT information; the `lixibao*` routes cover interest-product display,
subscribe, redeem, notices, and records; `rechargelog`, `cashlog`, and `acclog` show
financial history; `vipList`, `indexVipList`, `getVipInfo`, and `buyVip` cover VIP
catalogue, level, benefits, and purchase. Production settlement requires real gateway
contracts; local behavior is fixture-only.

### Profile, security, and payment methods

`getMyInfo`/`My/index` show profile; `edit_realname`, `edit_gender`, `update_avatar`,
`do_setHeadImg`, `edit_address`, and `do_editaddress` update profile; `bind_bank`/
`do_bindbank` bind a bank card; `bind_usdt`/`do_bindusdt` bind a USDT wallet;
`changePwd`, `changePayPwd`, and `checkwalletpwd` change/verify credentials. Inversion:
mask secrets, validate ownership, and invalidate relevant sessions after credential
changes.

### Team, referral, check-in, rewards, messaging

`/My/invite` provides invitation code/link; `myTeam` and `myTeamYjLog` show the team
tree and performance; `checkIn` and `myCheckIn` handle daily check-in/history;
`getRewardBonusStatus` and `claimRewardBonus` handle eligibility/claim;
`/Send/sendsms` is the notification/verification hook. Second-order effect: a reward
claim must be idempotent and reflected in both wallet and team projections.

## Protocol and non-functional contract

1. Requests are HTTP JSON or URL-encoded form. GET query parameters are merged into
   handler input; POST accepts either body style.
2. Every response is `{code,msg,data}`: `1` success, `0` rejected/validation error,
   `302` missing/expired session (client redirects to login), `404` unknown local route.
3. Writes are serialized against the shared fixture. After a mutation, invalidate the
   affected row and dependent cards, then refetch; never trust stale in-memory totals.
4. Admin commands should be permission-scoped, confirmed for money/state changes,
   idempotent where retried, and append an audit record.
5. `launch_all.bat` uses relative paths and bundled `system/nodejs/node.exe`, making
   the folder movable. No service should remain running after verification.

## Verification checklist (5W1H + inversion)

- Who: correct role/session can see and execute the control; unauthorized users cannot.
- What: response and persisted state match the command; no unrelated fields change.
- When: valid state transitions succeed; duplicate, expired, or out-of-order requests fail safely.
- Where: client and admin projections converge after refresh; route and modal both work.
- Why: visible label has a user/operator purpose and an auditable outcome.
- How: request envelope, validation, atomic write, error path, refresh, and audit are testable.
- Invert the test: retry, double-click, stale session, negative amount, frozen user,
  missing sponsor, and partial gateway response must not create money or permission inconsistencies.
