# 贞慧缘电商平台 · 前端对接 API 文档

> 版本：v1.3　｜　最后更新：2026-06-03
> 后端：Node.js + Express + MySQL + JWT。本文档供 C 端（微信小程序）与管理端（Web）前端对接使用。

---

## 一、基础约定

### 1.1 基础地址

| 端 | Base URL 前缀 |
| --- | --- |
| C 端（会员） | `/api/h5` |
| 管理端 | `/api/support` |

本地默认端口 `3000`，例：`http://localhost:3000/api/h5/products`。

### 1.2 统一响应结构

所有接口返回 JSON，结构一致：

```json
{ "code": 0, "message": "ok", "data": {} }
```

- `code`：`0` 表示成功；非 `0` 为错误码（见 1.5）。
- `message`：提示文案，可直接展示给用户。
- `data`：业务数据，可能为对象、数组或 `null`。

分页接口的 `data`：

```json
{ "list": [], "total": 100, "page": 1, "pageSize": 20 }
```

### 1.3 鉴权方式

登录后获得 `token`，后续请求在请求头携带：

```
Authorization: Bearer <token>
```

- C 端与管理端 **token 不通用**（密钥独立）。
- C 端 token 有效期 7 天；管理端 12 小时。
- 失效返回 `code=1002`，前端应跳转登录。

### 1.4 通用请求说明

- 请求体统一为 `application/json`。
- 分页参数：`page`（默认 1）、`pageSize`（C 端默认 10，管理端默认 20），通过 query 传递。
- 金额字段均为字符串，保留两位小数（如 `"100.00"`）。
- 管理端写操作（POST/PUT/DELETE）自动记录操作审计日志。

### 1.5 错误码表

| code | 含义 | 典型 HTTP |
| --- | --- | --- |
| 0 | 成功 | 200 |
| 1001 | 参数/校验错误 | 400 |
| 1002 | 未登录 / 凭证失效 | 401 |
| 1003 | 无权限 | 403 |
| 1004 | 资源不存在 | 404 |
| 1005 | 状态冲突（重复操作） | 409 |
| 1006 | 一般业务错误 | 400 |
| 1007 | 触发限流 | 429 |
| 5000 | 系统内部错误 | 500 |

### 1.6 限流

- 全局：300 次/分钟/IP。
- 登录接口：10 次/5 分钟/IP。
- 敏感接口（如提现申请）：20 次/分钟/IP。

### 1.7 枚举字典

**订单状态 `status`**：`0` 待付款、`1` 待发货、`2` 待收货、`3` 已完成、`4` 已取消。
**结算状态 `settlement_status`**：`0` 未结算、`1` 已结算。
**提现账户类型 `account_type`**：`1` 银行卡、`2` 支付宝、`3` 微信。
**提现状态 `status`**：`0` 待审核、`1` 待打款、`2` 已打款、`3` 已驳回。
**会员/通用状态 `status`**：`1` 正常/启用、`0` 禁用。
**商品状态 `status`**：`1` 上架、`0` 下架。
**文章状态 `status`**：`1` 发布、`0` 草稿。
**广告启用状态 `status`**：`1` 启用、`0` 禁用。
**广告时间状态 `time_status`**：`not_started` 未开始、`active` 进行中、`ended` 已结束（动态计算，不存库）。

---

# 二、C 端接口（/api/h5）

## 2.1 认证 Auth

### POST /auth/login — 登录/注册（Mock）
手机号不存在则注册（可带邀请码绑定上级），存在则校验密码登录。

请求体：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| phone | string | 是 | 手机号 `1[3-9]\d{9}` |
| password | string | 是 | 6~32 位 |
| inviteCode | string | 否 | 邀请码（仅注册时生效，绑定上级） |
| nickname | string | 否 | 昵称（注册时） |

> 邀请码绑定规则：仅注册时绑定；上级必须「已首次消费」（`first_consumed_at` 非空）才有邀请资格。C 端不可后续修改/补充邀请人。

响应 `data`：`{ token, member, isNew }`。

### GET /auth/profile — 当前会员资料
需登录。返回会员信息（含 `level_name`、`cumulative_contribution`、`withdrawable_balance`、`invite_code`、`parent_id`、`first_consumed_at`）。

## 2.2 会员 Member（均需登录）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| PUT | /member/profile | 修改昵称/头像（body: `nickname?`, `avatar?`） |
| GET | /member/team | 我的团队（直推 depth=1 / 间推 depth≥2） |
| GET | /member/contribution-logs | 贡献值流水（分页） |
| GET | /member/balance-logs | 余额流水（分页） |
| GET | /member/invite-qrcode | 我的邀请码/二维码信息 |

## 2.3 商品 Product（公开，无需登录）

### GET /categories — 分类列表（仅启用）

### GET /products — 商品列表（分页）
query：`page`、`pageSize`、`categoryId?`、`keyword?`。仅返回上架商品。

### GET /products/:id — 商品详情
仅上架商品可见。返回含 `main_images` 数组（详情页顶部轮播）、`detail_images` 数组（详情页底部图文）、`stock`、`sales`。

## 2.4 收货地址 Address（均需登录）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /addresses | 我的地址列表（默认在前） |
| GET | /addresses/:id | 地址详情 |
| POST | /addresses | 新增（首个自动设默认） |
| PUT | /addresses/:id | 更新 |
| PUT | /addresses/:id/default | 设为默认 |
| DELETE | /addresses/:id | 删除 |

新增/更新地址字段：`receiver_name`(必填)、`phone`(必填)、`detail`(必填)、`province_code/city_code/district_code`、`province_name/city_name/district_name`、`is_default`。地区编码+名称由前端地区插件提供。

## 2.5 购物车 Cart（均需登录）

> 购物车仅存「商品 + 数量」；勾选状态由前端临时管理、不落库。结算时把选中的购物车项 id 传给下单接口（见 2.6）。

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /cart | 购物车列表（含商品实时信息与失效标记） |
| GET | /cart/count | 购物车商品种类数（用于角标） |
| POST | /cart | 加入购物车（已存在同商品则累加数量） |
| PUT | /cart/:id | 修改某项数量 |
| DELETE | /cart/:id | 删除单项 |
| DELETE | /cart | 清空购物车 |

加入购物车：`{ product_id, quantity }`（`quantity` 1~999）。商品须存在且上架；同一商品重复加购累加数量（上限 999）。
修改数量：`{ quantity }`（1~999）。

列表项字段：`id`（购物车项 id，下单用）、`product_id`、`product_name`、`product_cover`、`price`、`quantity`、`subtotal`、`stock`、`status`、`invalid`。

> `invalid=true` 表示该项已失效（商品下架或库存不足以满足当前数量），前端应置灰且不可勾选下单。商品信息（价/图/库存/状态）实时取自商品表，可能与加购时不同。

响应 `data`：`{ items, total_quantity }`（`total_quantity` 为各项数量之和；金额请前端按勾选项的 `subtotal` 自行汇总）。

## 2.6 订单 Order（均需登录）

### POST /orders/preview — 下单预览（算运费）
请求体（`items` 与 `cart_item_ids` 二选一）：

```json
{ "items": [{ "product_id": 1, "quantity": 2 }], "address_id": 10 }
```

或从购物车合并下单，传选中的购物车项 id：

```json
{ "cart_item_ids": [3, 5], "address_id": 10 }
```

`address_id` 可选（不传则运费按未选地址处理）。传 `cart_item_ids` 时后端从购物车反查商品（须全部归属本人且存在，否则报错）。响应 `data`：`{ items, product_amount, shipping_fee, pay_amount, address }`。

> 运费规则：按商品「有效运费模板」（自身模板或默认模板）分组累计重量后分别计费再合计；未配置任何模板则不计运费。

### POST /orders — 创建订单
请求体同上（`items` 与 `cart_item_ids` 二选一），`address_id` **必填**。创建即原子预扣库存（防超卖），订单状态 `待付款`。传 `cart_item_ids` 时，**下单成功后在同一事务内删除这些购物车项**（下单与清空购物车原子一致，任一失败则整体回滚）。响应：订单详情。

### GET /orders — 我的订单列表（分页）
query：`status?`、`page`、`pageSize`。

### GET /orders/:id — 订单详情
含 `items`（明细）、`shipments`（物流包裹）、`receiver_snapshot`（收货快照）。

### POST /orders/:id/pay — 支付（Mock）
`待付款 → 待发货`，记录首次消费时间。

### POST /orders/:id/cancel — 取消订单
仅 `待付款/待发货` 可取消，自动回补库存。

### POST /orders/:id/confirm — 确认收货
`待收货 → 已完成`，**同一事务触发结算**（贡献值 + 返利 + 自动升级 + 销量累加）。

## 2.7 提现 Withdrawal（均需登录）

### 提现账户

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /withdrawal-accounts | 账户列表（卡号脱敏 `**** 1234`） |
| POST | /withdrawal-accounts | 新增账户 |
| GET | /withdrawal-accounts/:id | 账户详情 |
| PUT | /withdrawal-accounts/:id | 编辑账户（字段均可选，仅更新传入项） |
| PUT | /withdrawal-accounts/:id/default | 设为默认 |
| DELETE | /withdrawal-accounts/:id | 删除 |

新增账户字段：`account_type`(1/2/3)、`real_name`、`account_no`(卡号/账号，后端 AES 加密存储)、`bank_name`(银行卡必填)、`is_default?`。

编辑账户字段（均为可选，只传需修改的字段）：`account_type?`、`real_name?`、`account_no?`、`bank_name?`。卡号/账号修改后后端重新加密存储，响应仍返回脱敏串。

### 提现申请

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /withdrawals/info | 可提现概览：`withdrawable_balance`/`frozen_amount`/`available_amount`/`min_amount` |
| GET | /withdrawals | 我的提现列表（分页，`status?`） |
| GET | /withdrawals/:id | 提现详情 |
| POST | /withdrawals | 发起提现（限流） |

发起提现：`{ account_id, amount }`。校验：`amount ≥ 最低门槛` 且 `≤ 可用余额`（可用 = 余额 − 冻结；冻结 = 待审核+待打款金额合计）。

## 2.8 业绩分红 Dividend（需登录）

### GET /dividends — 我的分红明细（分页）
返回本人各周期应分记录：`period_name`、`start_date/end_date`、`level_name`、`member_contribution`、`share_amount`。

## 2.9 OSS 直传签名（需登录）

### GET /oss/signature
返回阿里云 OSS PostObject 直传签名：`{ host, dir, accessKeyId, policy, signature, expire, maxSize }`。前端以 `multipart/form-data` 直传，`key` 须以 `dir` 为前缀。

## 2.10 文章 Article（公开，无需登录）

### GET /articles/column/:location — 按栏目获取文章列表（分页）

按栏目的 `location` 标识获取该栏目下已发布的文章列表。

query：`page`（默认 1）、`pageSize`（默认 20）。

响应 `data`：分页格式，列表字段 `id`、`title`、`location`、`column_id`、`sort`、`created_at`、`updated_at`（不含 `content`）。

### GET /articles/location/:location — 按文章 location 获取详情

按文章自身的 `location` 标识获取详情，仅返回已发布文章。

响应 `data`：完整文章字段，含 `content`（富文本 HTML）、`column_name`。

### GET /articles/:id — 按文章 ID 获取详情

按文章 `id` 获取详情，仅返回已发布文章。

响应 `data`：同上。

> **C 端查文章的三种方式汇总**：
> - 某栏目的文章列表 → `GET /articles/column/{栏目location}`
> - 单篇文章（通过文章 location）→ `GET /articles/location/{文章location}`
> - 单篇文章（通过 ID）→ `GET /articles/{id}`

## 2.11 广告 Ad（公开，无需登录）

### GET /ads — 按广告位获取有效广告列表

query 参数：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| position | string | 是 | 广告位的 `location` 标识（如 `home_banner`） |

只返回**已启用**（`status=1`）且**当前时间在生效范围内**（`start_time ≤ 当前时间 ≤ end_time`）的广告，按 `sort ASC, id ASC` 排序。

响应 `data`：数组，每项字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | number | 广告 ID |
| title | string | 广告标题 |
| image | string | 广告图片 URL |
| link_type | string | 跳转类型（由前端自行约定，后端透传） |
| link_value | string | 跳转内容（由前端自行约定，后端透传） |

> `link_type` 与 `link_value` 的含义由前端团队自行定义，后端仅负责存储和透传，不做枚举校验。

---

# 三、管理端接口（/api/support）

> 除 `/auth/login` 外，所有接口需管理端鉴权 + 细粒度权限点校验（无权限返回 `1003`）。

## 3.1 认证 Auth

### POST /auth/login — 管理员登录
`{ username, password }`。响应：`{ token, admin, permissions }`（`permissions` 为权限码数组，前端据此控制菜单/按钮）。

### GET /auth/profile — 当前管理员（含权限码）

## 3.2 会员管理 Member　权限前缀 `member:`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /members | member:list | 列表（`keyword?/levelId?/status?` + 分页） |
| GET | /members/:id | member:detail | 详情 |
| GET | /members/:id/contribution-logs | member:detail | 某会员贡献值流水 |
| GET | /members/:id/balance-logs | member:detail | 某会员余额流水 |
| PUT | /members/:id | member:update | 改昵称/手机号/状态 |
| PUT | /members/:id/parent | member:parent | 变更上级（含闭包链重建、环路校验） |
| PUT | /members/:id/level | member:level | 手动调整等级（置锁定，不再自动降级） |

> 管理端手动绑定/变更上级须记录操作人；手动调级会写 `member_level_change_log`（source=manual）并锁定等级。

## 3.3 会员等级 Level　权限前缀 `level:`

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | /levels | level:list |
| POST | /levels | level:save |
| PUT | /levels/:id | level:save |
| DELETE | /levels/:id | level:delete |

等级字段：`name`、`sort`、`upgrade_threshold`、`self_rebate_rate`、`parent_rebate_rate`、`grandpa_rebate_rate`、`dividend_pool_rate`、`is_default`。

## 3.4 商品分类与商品 Product　权限前缀 `category:` / `product:`

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | /categories | category:list |
| POST | /categories | category:save |
| PUT | /categories/:id | category:save |
| DELETE | /categories/:id | category:delete |
| GET | /products | product:list |
| GET | /products/:id | product:list |
| POST | /products | product:save |
| PUT | /products/:id | product:save |
| DELETE | /products/:id | product:delete |

商品字段：`name`、`price`、`category_id`、`cover`、`weight`、`stock`、`status`、`main_images`(数组，详情页顶部轮播)、`detail_images`(数组，详情页底部图文)、`shipping_template_id?`、`sort?`。

## 3.5 运费模板 Shipping　权限前缀 `shipping:`

| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | /shipping-templates | shipping:list |
| GET | /shipping-templates/:id | shipping:list |
| POST | /shipping-templates | shipping:save |
| PUT | /shipping-templates/:id | shipping:save |
| DELETE | /shipping-templates/:id | shipping:delete |

模板含多条计费规则 `rules`：`region_codes`(JSON 省编码数组)、`is_default_group`、`first_weight/first_fee`、`additional_weight/additional_fee`。计费：`首费 + ceil((总重 − 首重)/续重) × 续费`。

## 3.6 订单管理 Order　权限前缀 `order:`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /orders | order:list | 列表（`keyword?/status?/memberId?` + 分页） |
| GET | /orders/:id | order:detail | 详情 |
| POST | /orders/:id/ship | order:ship | 发货（`logistics_company`、`tracking_no`，支持多包裹） |
| POST | /orders/:id/cancel | order:cancel | 取消（完成前，回补库存） |

> 发货：首次发货 `待发货 → 待收货`；可多次录入物流包裹。

## 3.7 提现管理 Withdrawal　权限前缀 `withdrawal:`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /withdrawals | withdrawal:list | 列表（`keyword?/status?` + 分页） |
| GET | /withdrawals/:id | withdrawal:list | 详情 |
| POST | /withdrawals/:id/review | withdrawal:review | 审核：`{ approve:boolean, reject_reason? }` |
| POST | /withdrawals/:id/pay | withdrawal:pay | 打款：`{ pay_voucher }`（凭证图 URL） |

> 审核通过 → `待打款`（不动账）；驳回 → `已驳回`（必填原因）。打款 → `已打款`，此时才真正扣减会员可提现余额并记流水。

## 3.8 业绩分红 Dividend　权限前缀 `dividend:`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /dividends | dividend:list | 周期列表（分页） |
| GET | /dividends/:id | dividend:list | 周期详情（头 + 各等级分池 + 会员应分明细） |
| POST | /dividends | dividend:calc | 生成周期：`{ period_name, start_date, end_date }`(YYYY-MM-DD) |
| DELETE | /dividends/:id | dividend:calc | 删除周期 |

> 生成逻辑（仅统计不动账）：周期销售额 = 区间内已完成订单 `product_amount` 合计；分红池 = 销售额 × 提取比例；各等级池 = 池 × 等级 `dividend_pool_rate`；等级内按会员周期贡献值占比分配。

## 3.9 权限管理 RBAC　权限前缀 `role:` / `admin:`

### 角色
| 方法 | 路径 | 权限 |
| --- | --- | --- |
| GET | /roles | role:list |
| GET | /roles/:id | role:list |
| POST | /roles | role:save |
| PUT | /roles/:id | role:save |
| PUT | /roles/:id/permissions | role:save（分配权限 `{ permission_ids:[] }`） |
| DELETE | /roles/:id | role:delete |
| GET | /permissions | role:list（权限树 menu→action） |

### 管理员
| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /admins | admin:list | 列表（`keyword?` + 分页） |
| POST | /admins | admin:save | 新增 `{ username, password, real_name?, role_id? }` |
| PUT | /admins/:id | admin:save | 改 `real_name`/`role_id` |
| PUT | /admins/:id/status | admin:save | 启用/禁用 `{ status:0|1 }` |
| PUT | /admins/:id/password | admin:save | 重置密码 `{ password }` |
| DELETE | /admins/:id | admin:delete | 删除 |

> 保护：超级管理员角色(id=1)不可删除；初始管理员(id=1)不可禁用/删除/改角色；不可禁用或删除自己。

## 3.10 操作日志　权限 `log:list`

### GET /operation-logs — 审计日志（分页）
query：`adminId?`、`keyword?`。返回操作模块、动作、路径、参数、IP、时间、操作人。

## 3.11 系统配置 Config　权限前缀 `config:`

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /configs | config:read | 读取全部配置 |
| PUT | /configs | config:update | 批量更新 `{ items:[{config_key, config_value}] }` |

可配置键：`contribution.coefficient`、`contribution.self_rate`、`contribution.direct_rate`、`contribution.indirect_rate`、`withdrawal.min_amount`、`dividend.pool_extract_rate`、`dividend.charity_rate`。

## 3.12 OSS 直传签名

### GET /oss/signature — 同 C 端，用于上传商品图/打款凭证等。

## 3.13 文章管理 Article　权限前缀 `article:`


### 栏目管理

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /article-columns | 仅需登录 | 栏目列表（全量，用于文章编辑下拉；支持 `keyword?` 模糊搜索） |
| POST | /article-columns | article:column:save | 新建栏目 |
| PUT | /article-columns/:id | article:column:save | 编辑栏目 |
| DELETE | /article-columns/:id | article:column:delete | 删除栏目 |

栏目字段：`name`（必填，最长 50 字）、`location`（必填，唯一标识，只允许小写字母/数字/下划线/连字符，最长 64 字）、`sort?`（默认 0）。

> 删除限制：栏目下存在文章时拒绝删除，需先移除或调整文章所属栏目。

### 文章管理

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /articles | article:list | 文章列表（分页） |
| GET | /articles/:id | article:list | 文章详情（含 `content`） |
| POST | /articles | article:save | 新建文章 |
| PUT | /articles/:id | article:save | 编辑文章 |
| DELETE | /articles/:id | article:delete | 删除文章 |

列表支持筛选 query：`columnId?`（精确；传 `0` 表示"未归栏目"）、`keyword?`（对标题模糊搜索）、`status?`（0/1）、`page`、`pageSize`。

文章字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 标题，最长 100 字 |
| content | string | 是 | 正文富文本 HTML |
| location | string\|null | 否 | 文章唯一标识（格式同栏目 location）；不填则存 `null`，C 端无法通过 location 访问此文章 |
| column_id | number\|null | 否 | 所属栏目 ID；不填或传 `null` 表示不归属任何栏目 |
| sort | number | 否 | 排序，默认 0 |
| status | number | 否 | `1` 发布（默认）、`0` 草稿 |

> `location` 与 `column_id` 的关系：
> - 填了 `column_id` → C 端通过栏目 location 查列表可返回该文章。
> - 未填 `column_id` 但填了 `location` → C 端通过文章 location 直接访问该文章详情。
> - 两者均可同时填写；`location` 在所有文章中全局唯一（NULL 不参与约束）。

## 3.14 营销广告 Ad　权限前缀 `ad:`

### 广告位置管理

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /ad-positions | 仅需登录 | 位置列表（全量，附各位置广告数量；支持 `keyword?` 模糊搜索） |
| POST | /ad-positions | ad:position:save | 新建位置 |
| PUT | /ad-positions/:id | ad:position:save | 编辑位置 |
| DELETE | /ad-positions/:id | ad:position:delete | 删除位置 |

广告位置字段：`name`（必填，最长 50 字）、`location`（必填，唯一标识，只允许小写字母/数字/下划线/连字符，最长 64 字）、`sort?`（默认 0）。

> 删除限制：位置下存在广告时拒绝删除。

### 广告管理

| 方法 | 路径 | 权限 | 说明 |
| --- | --- | --- | --- |
| GET | /ads | ad:list | 广告列表（分页） |
| GET | /ads/:id | ad:list | 广告详情 |
| POST | /ads | ad:save | 新建广告 |
| PUT | /ads/:id | ad:save | 编辑广告 |
| DELETE | /ads/:id | ad:delete | 删除广告 |

列表支持筛选 query：`positionId?`、`status?`（0/1）、`timeStatus?`（`not_started` / `active` / `ended`）、`keyword?`（标题模糊）、`page`、`pageSize`。

广告字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | 是 | 广告标题，最长 100 字 |
| position_id | number | 是 | 广告位置 ID |
| start_time | string | 是 | 生效开始时间，ISO 8601 格式 |
| end_time | string | 是 | 生效结束时间，须晚于 `start_time` |
| image | string | 是 | 广告图片 URL |
| status | number | 否 | `1` 启用（默认）、`0` 禁用 |
| link_type | string | 否 | 跳转类型（前端自定义，默认空字符串） |
| link_value | string | 否 | 跳转内容（前端自定义，默认空字符串） |
| sort | number | 否 | 排序，默认 0 |

管理端列表响应额外含字段：`position_name`（位置名称）、`time_status`（时间状态：`not_started` 未开始 / `active` 进行中 / `ended` 已结束）。

> **时间状态与启用开关是两个独立维度**：`status=0` 可强制下架一个时间内有效的广告；`time_status` 仅表示当前时间是否在生效区间内，不影响管理端查看。C 端只返回 `status=1` 且 `time_status=active` 的广告。

---

# 四、核心业务规则（前端需了解）

### 4.1 结算（确认收货时触发，单事务、幂等）
基数 `base = 订单 product_amount`（实付不含运费）。两条独立线：

- **贡献值（全局比例，无限层级，只增）**：本人 `base×系数×自购率`；直推上级(depth=1) `base×系数×直推率`；间推上级(depth≥2) `base×系数×间推率`。
- **返利（取「购买者」当前等级的比例，最多到祖父级）**：本人 `base×自购返利率`；上级(depth=1) `base×父级返利率`；祖父级(depth=2) `base×祖父返利率`。

> 验证示例：c(V1: 自购25%/父级20%/祖父10%) 购买 100 元 → c 得 25，父级 b 得 20，祖父 a 得 10。

结算后：受益人达更高等级门槛则自动升级（等级锁定者除外）；按明细数量累加商品销量。

### 4.2 库存
下单即原子预扣（`UPDATE ... WHERE stock >= 数量`，防超卖）；取消订单回补；确认收货累加销量。

### 4.3 不在本期范围
售后/退款（线下处理）、贡献值提现（贡献值不可提现，仅可提现「返利余额」）。

---

# 五、初始账号

- 管理端超级管理员：`admin / admin123456`（首次登录后请尽快修改密码）。

# 六、本地启动

```bash
npm install
npm run db:init   # 初始化数据库（建表+种子数据+超管）
npm run dev       # 开发（nodemon）
npm start         # 生产
```
健康检查：`GET /health`。
