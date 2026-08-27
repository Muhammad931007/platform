# Client-visible label and feature relationships

This catalogue explains what the client’s words, icons, cards, tabs, forms, and
buttons mean and how they relate to the admin records described in
`LABEL_RELATIONSHIP_CATALOG.md`. A label is not treated as a working feature until
its event, source data, validation, and refreshed projection are understood.

## Client navigation and shared state

| Visible area / label family | Meaning | Related source and state |
|---|---|---|
| Welcome / Sign In / Username / Password | Authenticate a member. | `/login/do_login_v1`; member identity, session token, online heartbeat. |
| Remember me | Persist login identity locally. | Browser storage only; never persist plaintext credentials in production. |
| Forgot password / Contact Support | Recovery or support route. | Verification-code/SMS and客服配置; no local payment mutation. |
| Sign up / Create Account | Register a member. | `/login/do_register`; sponsor/invitation, agreement consent, password rules. |
| Home Page / Starting / Records | Primary navigation tabs. | Home projection, task state, and read-only order/ledger histories. |
| Contact / support headset | Opens configured customer-service channels. | 客服列表,客服时间, Telegram/WhatsApp/live-chat config. |

## Home and public content

| Label / visual | What it communicates | Dependencies and refresh |
|---|---|---|
| Independent ERP Software Research | Landing identity and value proposition. | Site configuration and static branding. |
| VIP Level | Current member level and benefits shortcut. | 会员等级/VIP list; balance/order limit projection. |
| Event | Promotions, check-in, or reward activity. | 活动管理, check-in, reward eligibility. |
| Withdrawal / Deposit | Money-out and money-in entry points. | Wallet balance, payment method, withdrawal gate, recharge status. |
| T&C / Certificate / FAQs / About Us | Terms, credentials, help, and company information. | 条款,证书,常见问题,关于我们 content pages. |
| Notice popup / news / badge | Time-sensitive announcement and unread count. | 公告管理,首页弹窗公告,资讯; badge invalidation after read. |
| Google Advertising / META ADS / Search Engine Optimization / Website Development / Marketing Strategy / Email Marketing | Service cards and visual marketing content. | Static public content; no wallet/order side effect. |
| Results-First Approach / Direct Access to Experts / Proven Across Industries | Trust/value proposition cards. | Static visual copy; should remain accessible and responsive. |
| Media and Press / Our Awards / ERP | Logos and credibility visuals. | Static image assets and certificates. |

## Tasks and order labels

| Label / control | Meaning | Related admin data and transition |
|---|---|---|
| Start / Continue / Stop | Begin, resume, or end a task session. | 联单任务/交易控制; available → accepted → in-progress → stopped/completed. |
| Matching order / rotation task | A generated task requiring an order action. | 商品管理,配单规则,抢单 settings; may reserve linked-order amount. |
| Order number / Product / Price | Identifies the order and its commercial value. | 订单列表,商品列表; immutable after settlement. |
| Commission / Reward / Profit | Earnings from a completed order. | 订单奖励,普通/联单佣金; posts to wallet ledger. |
| Pending / In progress / Completed / Failed | Current order state. | Admin order console; invalid transitions are rejected. |
| Submit order / Confirm / Rate | Commands to operate or review an order. | `/order/do_order`, `/order/rating_order`; idempotent and audited. |
| Task quantity / Completed / Accepted / Reset | Counters displayed on task or profile cards. | Member task projection; reset commands preserve history. |

## Wallet, finance, and VIP labels

| Label / control | Meaning | Related source and safeguards |
|---|---|---|
| Balance / Total assets / Frozen balance | Spendable, combined, and restricted funds. | Account ledger; never calculate from UI-only values. |
| Deposit / Recharge | Submit a funding request and show its status. | 充值管理; pending/approved/rejected states. |
| Withdrawal / Amount / Fee / Actual received | Request payout and show net amount. | 提现管理; minimum reserve, credit, frozen and 禁止提现 gates. |
| USDT / TRC20 / ERC20 / Address / QR code | Select crypto rail and display destination. | Payment method config and bound wallet; never expose another user’s address. |
| Recharge history / Withdrawal history / Account change | Read-only financial records. | 充值记录,提现记录,账变信息; append-only audit projection. |
| Interest product / Lixibao / Transfer in / Transfer out | Place or redeem an interest position. | 利息宝 settings/records; principal and accrued profit reconcile to wallet. |
| VIP 1–VIP 4 / Rate / Daily orders / Benefits / Buy VIP | Level catalogue and upgrade purchase. | 会员等级 thresholds, commission rate, order limits, purchase ledger. |

## Profile, security, and payment identity

| Label / control | Meaning | Related state |
|---|---|---|
| Profile / Username / Phone / Email | Member identity display. | 会员信息; phone/email normalization and verification. |
| Real name / Gender / Avatar | Personal profile edits. | Member profile; audit changes and image validation. |
| Address | Delivery/contact address. | Member profile; not a wallet destination unless explicitly selected. |
| Login password / Payment password | Separate authentication secrets. | Credential store; verify old secret, invalidate sessions when changed. |
| Bank card / USDT wallet binding | Payment destination management. | Bank/USDT binding; ownership and duplicate checks. |
| Wallet password check | Step-up verification before sensitive money actions. | Payment-password state and withdrawal gate. |

## Referral, team, check-in, and rewards

| Label / control | Meaning | Related admin data |
|---|---|---|
| Invite code / Invite link / Share | Acquire and share a sponsor code. | 上级资料, sponsor graph, referral commission. |
| My team / Direct members / Team performance | Downline tree and aggregate contribution. | 查看团队,下级返佣, multi-level commission settings. |
| Daily check-in / Check-in days / Make-up check-in | Record daily presence and any permitted make-up. | 用户签到记录,签到积分; one claim per date. |
| Reward bonus / Claim / Pending / Granted / Cancelled | View and claim an eligible reward. | 奖励金,发放/取消; idempotent wallet ledger entry. |
| SMS/verification code | Prove phone ownership or recover access. | 短信宝 settings; rate-limited, expiring code. |

## Client protocol relationships

- The compiled client wraps payloads in `data` and uses `phone`/`pwd` for login;
  the shared handler normalizes this to the canonical member command.
- Client success is `code:0`; admin action success is `code:1`; both include `msg`,
  `info`, and `data`. `code:302` means session expiry and returns the user to login.
- Any command that changes money, order state, team membership, VIP, or rewards must
  refresh all dependent cards and histories. A stale card is a display defect even if
  the write succeeded.
- Public content can load without a session. Private wallet, team, order, and profile
  data require a valid token and must not be inferred from URL parameters alone.

## Human-view recheck summary

- Client login was completed by typing into the rendered fields and clicking the
  visible Sign In control; the browser reached the home page.
- The home page visibly rendered navigation, balance/action cards, content sections,
  service cards, trust cards, press/award visuals, and bottom navigation.
- Live admin login and member-list inspection confirmed the corresponding source
  labels and controls; no live mutation was submitted.
- Local exhaustive checks remain 35/35 admin actions, 73/73 modal routes, and 34/34
  embedded actions, with 57 non-dependency JavaScript files passing syntax checks.

Private production authorization, payment settlement, SMS/Google credentials, risk
algorithms, and database contents remain backend contracts rather than conclusions
that can be safely inferred from a visible label.
