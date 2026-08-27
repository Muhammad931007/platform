# ERP admin/client label and relationship catalogue

This is the second-pass inventory of labels beyond the member list. It is based on
the rendered live admin pages, captured page templates, compiled client routes, and
the local replica. Each group answers: what the label means, which feature owns it,
and which other data or action it affects.

## How to read the relationships

- **Source** is the record or configuration that should be authoritative.
- **Projection** is a number/status shown elsewhere after refresh.
- **Command** changes state and must be confirmed/audited.
- **Filter** only narrows a table and must not mutate data.

## Page-to-feature map (admin)

| Page / visible labels | Feature meaning | Related pages/data |
|---|---|---|
| 后台首页 / 商城统计 | Operational dashboard: applications, users, orders, recharge, withdrawal, commission, balance, today/yesterday deltas. | Users, order, deposit, cash and commission tables. |
| 会员列表 / 条件搜索 | Search members by 用户名, 用户ID, 手机号码, 邀请码找下级, 用户邀请码, IP地址, 注册时间, 状态, 有效状态, 余额 range. | Member profile, team tree, login history, ledger, orders. |
| 会员信息 / 上级资料 / 其他信息 | Member identity, sponsor graph, level, registration/login evidence, reputation. | Team, VIP, risk/status and audit. |
| 任务量 / 资金余额 / 会员状态 | Task counters, ledger-derived money, online/frozen/ordinary status. | Orders, deposits, withdrawals, reset commands. |
| 基础资料 / 加扣款 / 钱包 | Detail, balance adjustment, payment/wallet controls. | Account ledger and operator log. |
| 重置任务 / 重置佣金 / 改单数 | Recalculate/reset task and commission projections. | Order count, reward/commission totals, audit. |
| 添加连单 / 普通方式 / 连单列表 | Linked-order versus ordinary-order operations and records. | Deal console, reserved amount, order state. |
| 查看团队 / 登录历史 | Referral graph and security evidence. | Sponsor codes, commission, risk review. |
| 禁用 / 禁止提现 | Account access versus withdrawal permission. | Session invalidation, cash review, status projection. |
| 发送通知 / 配置奖励金 | Message delivery and reward grant/configuration. | Notification log, wallet ledger, check-in/team eligibility. |
| 联单任务 / 交易控制 | Task/rotation settings: 抢单开始时间, 抢单结束时间, 抢单最小余额, 抢单扣款, 抢单返佣, 抢单返还本金, 匹配范围, 自动配单间隔时间. | Client task state, order generation, wallet reservations. |
| 订单列表 / 用户联单任务列表 | Order number, product, amount, reward, type, status, start/end/complete state. | Member task counters, commission, linked-order amount. |
| 商品列表 / 商品管理 | 产品名称, 商品分类, 商品价格/单价, 商品说明, 商品图片, 销售状态, 商品大小. | Order generation and deal console. |
| 提现管理 / 提现列表 | 提现用户, 提现金额, 手续费, 实际到账, 提现状态, 发起/处理/到账时间, address/payment method. | Wallet balance, 禁止提现, approval ledger. |
| 充值管理 / 用户充值 | Recharge amount, payment method, transaction evidence, status, approved/rejected time. | Balance projection and account ledger. |
| 资金记录 / 上下分记录 / 财务记录 | Immutable income/expense/adjustment entries with 原余额, 修改后余额, 操作金额, 操作人, 操作时间, 操作描述. | Member wallet and dashboard totals. |
| 利息宝列表 / 利息宝设置 / 利息宝记录 | 利息宝日利率, 转入最小/最大额度, 转出到余额, interest subscription/redemption records. | Wallet balance, profit projection, withdrawal availability. |
| 会员等级 / 添加等级 | Level threshold, order limit, commission rate, benefits, member assignment. | Client VIP page and order/task limits. |
| 用户签到记录 | 签到日期, 签到积分, 补签, reward eligibility. | Client check-in and reward ledger. |
| 系统用户管理 / 权限管理 / 访问权限管理 | Admin accounts, roles, 操作权限, 使用中的权限, 已禁用的权限. | Menu visibility and audit log. |
| 菜单管理 | Add/edit/delete/forbid/resume menu, 添加子菜单, 图标, link, ordering. | Sidebar navigation and access control. |
| 系统操作日志 / 日志管理 | 操作账号, 操作行为, 操作节点, 操作数据, 操作描述, 操作时间; delete/clear history. | Every state-changing command. |
| 系统参数配置 / 网站设置 | 网站名称, 图标, 版权, 备案, title/version, balance/status colors, default credit, withdrawal rules. | Client branding, risk gates, dashboard. |
| 短信宝设置 / 客服列表 | SMS provider account/password/template/signature and 客服名称/代码/时间. | Login codes, support/contact feature. |
| 首页文本 / 首页轮播公告 / 首页弹窗公告 | Client landing copy, carousel images, notices and popup visibility. | Client home and badge/notice refresh. |
| 全局公告管理 / 全局协议管理 / 条款 | Global notices, privacy/terms/agreement content. | Registration consent and client content. |
| 关于我们 / 简介管理 / 资讯管理 / 常见问题 | About, company intro, news/articles, FAQ/help content. | Client public content routes. |
| 证书展示 / 活动管理 / 抽奖管理 / 奖品列表 / 抽奖记录 | Certificates, promotions, lottery prizes and participation records. | Client certificate/activity/reward displays. |
| 文件管理 / 文件存储引擎 | Upload size, extension, local/server/object storage, 七牛云/阿里云 options. | Client upload check and content images. |
| 数据库 / 数据清理 | Database/version/runtime information and retention cleanup (days). | Logs, login history, audit retention. |
| 运行环境 / 系统信息 | Server OS, browser support, current program/version, update check. | Deployment diagnostics only. |

## Label dictionary by relationship

### Identity, hierarchy, and risk

`用户`, `用户账号`, `用户名`, `用户名称`, `用户手机`, `手机号`, `联系手机`, `联系邮箱`,
`邮箱`, `邀请码`, `用户邀请码`, `邀请码找下级`, `上级`, `上级资料`, `上级邀请码`,
`直推奖励`, `下级返佣`, `上级佣金比例`, `上级交易返佣`, `上级积分`, `上一级会员收益比例`,
`上两级会员收益比例`, `上三级会员收益比例`, `上四级会员收益比例`, `上五级会员收益比例`,
`用户信用分低于下面的值禁止提现`, `注册用户的默认信用值`, `信誉分` describe the referral
graph and risk inputs. A sponsor change affects team membership and commission routing;
it must never create a cycle. Credit thresholds affect the withdrawal gate, not login.

`注册时间`, `注册IP`, `注册位置`, `最后上线`, `最后上线IP`, `最后上线位置`, `最后上线时间`,
`登录时间`, `登录位置`, `登录状态`, `登录次数`, `设备`, `设备信息`, `设备类型` are
append-only security evidence. They relate to `登录历史`, `操作日志`, `禁用`, and fraud review.

### Order/task state

`联单任务`, `普通连单`, `普通方式`, `连单`, `连单列表`, `连单金额`, `联单佣金`, `联单开始`,
`联单总数`, `任务量`, `任务数量`, `交易数量`, `接单次数`, `当前完成`, `完成配单`, `配单规则`,
`订单号`, `订单类型`, `订单状态`, `订单总量`, `订单总金额`, `订单奖励`, `交易状态`, `进行中`,
`已接单`, `已完成`, `已确认`, `已付款`, `支付中`, `失败`, `撤销重置当日任务量`, `重置单数`,
`重置当日任务量`, `重置会员抢单单数`, `取消单数` form the task state machine. State changes
update member counters, reserved linked-order money, commission, and dashboard totals.

`抢单开始时间`, `抢单结束时间`, `抢单时间`, `抢单最小余额`, `抢单扣款`, `抢单返佣`,
`抢单返还本金`, `第几单`, `触发单数`, `提交订单延时时间`, `远程主机分配时间`,
`等待商家响应时间` are scheduling/rule inputs; they should be validated before generating
an order and never retroactively rewrite a settled order.

### Money and settlement

`总资产`, `资产加利润`, `余额`, `充值`, `提现`, `收益`, `佣金`, `支出`, `收入`, `实际到账`,
`手续费`, `手续费率`, `充值时间`, `提现时间`, `提现金额`, `提现余额要保留的金额`,
`提现最小金额`, `提现最大金额`, `提现次数`, `提现退回`, `收款信息`, `支付方式管理`, `银行卡`,
`地址`, `二维码`, `原余额`, `修改后余额`, `修改后`, `操作金额` are ledger/projection labels.
The source of truth is the immutable ledger; totals and dashboard cards are projections.
Withdrawal rules combine balance, frozen amount, credit threshold, minimum reserve, status,
and payment method. Approval/rejection must create an audit event and a reversible state.

`利息宝`, `利息宝日利率`, `利息宝转入额度最低`, `利息宝转入额度最高`, `转入最大额度`,
`转入最小额度`, `转出到余额`, `转出到余额时间`, `利息宝记录` describe a separate interest
position. Its principal, accrued profit, and redemption must reconcile to the wallet.

### VIP, rewards, and promotion

`会员等级`, `添加等级`, `门槛显示`, `订单奖励`, `普通佣金`, `联单佣金`, `分享奖励`,
`分享注册奖励积分`, `分享注册完成奖励的积分`, `每推荐有效用户满多少人`, `每日签到积分`,
`奖励金`, `奖励多少元`, `待领取奖励金`, `待发放`, `发放`, `发放奖励金`, `确认奖励金`,
`取消奖励金`, `取消礼物`, `显示礼物`, `显示礼物弹窗`, `奖品列表`, `抽奖记录` connect
eligibility rules to reward issuance. A claim must be idempotent; a grant changes the wallet
ledger and should remain visible in the member/account logs.

### Content, communications, and public visuals

`首页文本`, `首页轮播公告`, `首页弹窗公告`, `公告管理`, `全局公告管理`, `标题`, `内容`,
`发表时间`, `分类`, `资讯管理`, `常见问题`, `查看内容`, `证书展示`, `展示图片`, `图片`,
`保存图片`, `协议管理`, `全局协议管理`, `使用条款`, `隐私政策`, `关于我们`, `简介管理`,
`客服列表`, `客服名称`, `客服代码`, `客服时间`, `客服服务时间说明`, `发送消息`, `发送通知`
map directly to client home/news/help/certificate/support screens. `显示选项`, `显示礼物`,
and `开启/关闭` flags control whether a visual is published; unpublished content should not
appear in client projections.

### Administration and platform controls

`管理员`, `管理员用户名`, `系统用户管理`, `角色`, `权限名称`, `权限描述`, `权限分配`,
`公共权限`, `所有权限`, `使用中的权限`, `已禁用的权限`, `操作权限`, `删除权限`, `编辑权限`,
`菜单管理`, `添加菜单`, `添加子菜单`, `编辑菜单`, `删除菜单`, `禁用菜单`, `访问权限管理`
define who may see or execute a command. `操作人`, `操作账号`, `操作节点`, `操作行为`,
`操作数据`, `操作描述`, `操作时间`, `删除日志`, `清理日志`, `清空历史` define the audit trail.

`网站设置`, `网站名称`, `网站名称及网站图标`, `管理程序名称`, `管理程序版本`, `版本号`,
`当前程序版本`, `数据库版本`, `服务器操作系统`, `浏览器`, `浏览器支持`, `运行环境`,
`检查更新`, `文件存储引擎`, `本地服务器存储`, `上传大小限制`, `大小限制`, `扩展名`
are deployment/configuration labels. They affect branding, upload validation, diagnostics,
and retention—not member balances.

## Client-side relationship map

| Client visual/word | Underlying admin/content source | Dependent projections |
|---|---|---|
| Home / VIP Level | Member level, config, public content, banner. | Balance, income, task limit, notices. |
| Event / check-in | 活动管理, 用户签到记录, reward rules. | Check-in count, reward claim, wallet. |
| Withdrawal / Deposit | 提现管理, 充值管理, payment methods, config. | Balance, frozen/reserved funds, ledgers. |
| T&C / Certificate / FAQs / About Us | 条款, 证书展示, 常见问题, 关于我们. | Registration consent and support discovery. |
| Starting / task screen | 联单任务, 交易控制, 商品管理, 配单规则. | Order state, task counters, commissions. |
| Records | 订单列表, 资金记录, 充值/提现 logs, login/activity. | Audit-friendly history, not editable summaries. |
| Profile / Wallet / Team | Member identity, bank/USDT binding, sponsor/team data. | VIP, referral commission, withdrawal gate. |

## Recheck results

- Live admin login succeeded in Chromium; no live mutation was submitted.
- Live dashboard and member list rendered successfully.
- Live member list exposed 234 controls and all requested member/action labels.
- Local member list exposed 232 controls; all captured modal/action routes pass the local
  exhaustive suite (35 actions, 73 modals, 34 embedded actions).
- All 57 non-dependency JavaScript files in `E:\Visual` pass syntax checks.
- Portable verification passes client login/home protocol, admin login, pages, actions,
  modals, and embedded actions.

The local replica can reproduce visible labels, route shapes, fixture state transitions,
and cross-surface refreshes. Private production authorization, real user data, payment
settlement, SMS delivery, Google authentication, and risk/commission algorithms require
the production contracts and are not inferred from labels alone.
