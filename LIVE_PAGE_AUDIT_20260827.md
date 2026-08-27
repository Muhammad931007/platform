# Live authenticated page audit — 2026-08-27

Method: Chromium browser, live admin login, page navigation by the visible
hash routes, rendered text/control inspection. No live mutation, delete, approval,
balance adjustment, or configuration save was submitted.

## Page coverage and observed controls

| Route | Controls | What the page is for |
|---|---:|---|
| `/admin/index/main.html` | 48 | Dashboard: applications, users, orders, recharge, withdrawal, commission, balances, and today/yesterday deltas. |
| `/admin/users/index.html` | 248 | Member search/list, sponsor filters, identity, task/money/status projections, member actions. |
| `/admin/users/cs_list.html` | 88 | Customer-service records: type, link, name, created time, edit/delete. |
| `/admin/users/level.html` | 67 | VIP levels: invite count, ordinary/linked commission, minimum balance, order/withdrawal limits and fees. |
| `/admin/users/login_history.html` | 110 | Login evidence: username/phone/IP/status/device/time, refresh, bulk delete, clear history. |
| `/admin/user/index.html` | 64 | Admin accounts: account, contact, use status, login count/time, add/delete/search. |
| `/admin/auth/index.html` | 68 | Permission records: name, description, status, create time, edit/delete. |
| `/admin/menu/index.html` | 436 | Menu tree: add/edit/forbid/delete, links, icons, parent-child visibility. |
| `/admin/oplog/index.html` | 90 | Operator audit: account, node, behavior, description, location, time, user ID, data. |
| `/admin/account/acclog.html` | 90 | Account-change/audit table and filters. |
| `/admin/account/adjustlog.html` | 65 | Financial adjustments: phone, username, start time, type, amount, original/changed balance, operator, note. |
| `/admin/deal/order_list.html` | 64 | Order/account changes: record ID, user, operation amount, original/changed balance, admin, note, time. |
| `/admin/deal/deal_console.html` | 70 | Trading controls: matching range, withdrawal/order windows, customer-service time, task/deal rules. |
| `/admin/deal/deposit_list.html` | 100 | Withdrawal review: batch approve/reject, order/user/phone/time/status, amount, payee, operation. |
| `/admin/deal/deposit_list_test.html` | 58 | Test-account withdrawal review with the same state controls. |
| `/admin/deal/goods_list.html` | 88 | Product catalogue: import/add/search, product ID/name/category/price/store/time/status. |
| `/admin/checkin/member_checkin_log.html` | 51 | Check-in records filtered by phone/date. |
| `/admin/config/info.html` | 63 | System parameters: captcha, multi-level commission, registration bonus, credit withdrawal gate, reserve, fees, task rules. |
| `/admin/plots/index.html` | 82 | Linked-task report: phone/name/create time, start number, task quantity, total amount, order type/status. |
| `/admin/help/active.html` | 52 | Events/promotions: language, title, publish time, view/edit/delete. |
| `/admin/help/agreement.html` | 54 | Global agreements: terms/privacy/registration content and publication. |
| `/admin/help/banner.html` | 51 | Home/banner or announcement copy and language. |
| `/admin/help/helplottery.html` | 52 | About/help-style content and lottery/help presentation. |
| `/admin/help/infomation.html` | 52 | Certificate/information content with language, title, time, view/edit/delete. |
| `/admin/help/jianjie.html` | 52 | Introduction/about content. |
| `/admin/help/notice.html` | 52 | Global notices and popup-announcement type. |
| `/admin/help/pdgz.html` | 52 | Matching/order rules content. |

## Label-to-use-case relationships discovered

### Finance and risk

`用户充值`, `充值管理`, `充值时间`, `提现管理`, `提现列表`, `提现用户`, `提现金额`,
`提现手续费`, `提现最小金额`, `提现最大金额`, `提现余额要保留的金额`, `提现退回`,
`实际到账`, `实际到账时间`, `审核通过`, `驳回`, `待审核`, `待确认`, `支付中`, `收款信息`,
`原余额`, `修改后余额`, `操作金额`, and `操作人` form a reviewable settlement chain.
They relate directly to member `余额`, `冻结`, `禁止提现`, account logs, dashboard totals,
and the wallet/client withdrawal screen.

`用户信用分低于下面的值禁止提现`, `注册用户的默认信用值`, `上级佣金比例`,
`上一级会员收益比例` through `上五级会员收益比例`, `提现手续费`, and reserve settings
are policy inputs. They must be validated server-side and applied consistently to both
the admin decision and client error message.

### Commerce and task engine

`匹配范围`, `抢单开始时间`, `抢单结束时间`, `抢单最小余额`, `抢单扣款`, `抢单返佣`,
`抢单返还本金`, `自动配单间隔时间`, `提交订单延时时间`, `远程主机分配时间`,
`等待商家响应时间`, `第几单`, `触发单数`, `完成配单`, `配单规则`, `交易状态`,
`订单类型`, `订单奖励`, `联单佣金`, `普通佣金`, `交易数量`, and `任务数量` define
order generation and state transitions. They relate to `商品列表`, client Starting/task,
member `已接单/已完成/已重置`, linked-order reservations, and commission projections.

`商品名称`, `商品分类`, `商品价格`, `商品单价`, `商品说明`, `店铺名称`, `商品大小`,
`展示图片`, `销售状态`, `导入商品`, and `添加商品` are catalogue inputs. Product edits
must not rewrite already-settled order snapshots.

### Hierarchy, VIP, and rewards

`邀请码`, `邀请码找下级`, `上级`, `上级邀请码`, `邀请人数`, `直推奖励`, `下级返佣`,
`上级交易返佣`, and multi-level percentages form the team graph and commission route.
`会员等级`, `添加等级`, `门槛显示`, `接单次数`, `提现次数`, `提现最小金额`,
`提现最大金额`, and `提现手续费` define VIP capabilities consumed by client VIP and task screens.

`每日签到积分`, `签到积分`, `补签`, `分享奖励`, `分享注册奖励积分`, `奖励金`,
`待领取奖励金`, `待发放`, `发放奖励金`, `确认奖励金`, `取消奖励金`, `奖品列表`,
and `抽奖记录` connect engagement events to a wallet ledger and member/team projections.

### Content, support, and visuals

`首页文本`, `首页轮播公告`, `首页弹窗公告`, `全局公告管理`, `资讯管理`, `证书展示`,
`条款`, `协议管理`, `使用条款`, `隐私政策`, `关于我们`, `简介管理`, `常见问题`,
`活动管理`, and `配单规则` are publishing surfaces. `语言`, `标题`, `内容`, `分类`,
`发表时间`, `查看内容`, `开启`, `关闭`, and `显示选项` determine whether and where
client content appears.

`客服列表`, `客服名称`, `客服代码`, `客服时间`, `客服服务时间说明`, `短信宝账号`,
`短信宝密码`, `模板签名`, `发送消息`, and `发送通知` relate support discovery and
verification-code delivery to the client Contact/Support and login/recovery flows.

### Access, audit, and platform

`系统用户管理`, `管理员用户名`, `角色`, `权限名称`, `权限描述`, `权限分配`, `公共权限`,
`使用中的权限`, `已禁用的权限`, `菜单管理`, `添加子菜单`, `编辑菜单`, `禁用菜单`,
`删除菜单`, `操作账号`, `操作节点`, `操作行为`, `操作数据`, `操作描述`, `位置地址`,
`操作时间`, `清理日志`, `删除日志`, `清空历史`, `数据库版本`, `服务器操作系统`,
`浏览器支持`, `文件存储引擎`, `本地服务器存储`, `七牛云对象存储`, `阿里云`,
`上传大小限制`, and `检查更新` define governance and deployment behavior. They relate
to every state-changing command, not to a single member row.

## End-to-end interpretation

For each label, the expected path is:

```text
visible label/control → UI event/filter → request route + payload
→ authorization/validation → source record or ledger transition
→ audit event → dependent projection refresh → client/admin render
```

Read-only live traversal confirms the first two stages and visible relationships. Local
contract tests cover the request/response and fixture transition stages. Production
settlement, authorization policy, risk algorithms, and historical data remain private
backend concerns and require their documented contracts for true production parity.
