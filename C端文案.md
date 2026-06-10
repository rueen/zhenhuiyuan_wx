# 贞慧缘 · C 端规则介绍文案

> 变量使用 `{{ }}` 标注，对应接口字段见文末索引。
> 比例字段为 0~1 的小数，展示时乘以 100 转为百分比。

---

## 一、贡献值介绍

### 什么是贡献值？

贡献值是衡量您在平台贡献程度的积分，**不可提现**，专用于两件事：

1. 累计达到门槛后自动升级会员等级
2. 参与每期业绩分红的权重计算

---

### 如何获取贡献值？

贡献值来自**您自己购买**以及**您邀请的成员购买**，每笔订单结算后自动发放。

**① 自购获得**

当您自己完成一笔购买，您获得：

```
贡献值 = 实付金额（不含运费）× {{contribution.coefficient}} × {{contribution.self_rate * 100}}%
```

**② 直推下级购买为您创造**

当您**直接邀请的成员**（直推下级）完成一笔购买，您获得：

```
贡献值 = 该成员实付金额（不含运费）× {{contribution.coefficient}} × {{contribution.direct_rate * 100}}%
```

**③ 间推下级购买为您创造**

当您邀请链上**更下一层及以下的成员**（间推下级）完成一笔购买，您获得：

```
贡献值 = 该成员实付金额（不含运费）× {{contribution.coefficient}} × {{contribution.indirect_rate * 100}}%
```

> 间推不限层级，邀请链越长、下级越活跃，您获得的贡献值越多。

**示例**（以默认配置举例）：您的直推下级购买了 100 元商品，您获得 100 贡献值；您的间推下级购买了 100 元商品，您获得 50 贡献值。

每笔贡献值变动均可在「贡献值流水」中查看。

---

### 贡献值与会员等级

累计贡献值达到对应门槛后，系统**自动升级，一旦升级不会降级**：

<!-- 循环渲染 GET /api/h5/levels 返回的等级列表 -->
```
普通会员    注册即享，无门槛
{{name}}    累计贡献值达 {{upgrade_threshold}} 自动升级
（依此类推）
```

您当前累计贡献值为 **{{cumulative_contribution}}**。

- 若 `next_level` 不为空：距升级至 **{{next_level.name}}**（门槛 {{next_level.upgrade_threshold}}）还差 **{{gap_to_next_level}}** 贡献值。
- 若 `next_level` 为 null：您已是最高等级会员。

---

## 二、会员等级权益

<!-- 循环渲染 GET /api/h5/levels，每个等级一张卡片 -->

**{{name}}**

| 权益项 | 说明 |
|---|---|
| 升级门槛 | 累计贡献值 ≥ {{upgrade_threshold}}（`is_default` 为 true 时显示"注册即享，无门槛"） |
| 自购返利 | 您自己每购一单，实付金额的 {{self_rebate_rate × 100}}% 直接返入您的可提现余额 |
| 直推团队返利 | 您的直推下级处于**本等级**时，其每购一单，您可获得其实付金额的 {{parent_rebate_rate × 100}}% 返利 |
| 间推团队返利 | 您的间推下级处于**本等级**时，其每购一单，您可获得其实付金额的 {{grandpa_rebate_rate × 100}}% 返利 |
| 分红池占比 | 每期分红池中，本等级成员共享 {{dividend_pool_rate × 100}}% 的额度 |

> **注意**：团队为您创造的返利，以**购买者（您的下级）的当前等级**为准，与您自身等级无关。下级等级越高，其单笔购买为您带来的返利越多，鼓励团队成员积极升级。

当前您的等级为 **{{level_name}}**，您自己每完成一笔购买，您本人获得 **{{self_rebate_rate × 100}}%** 自购返利。

---

## 三、业绩分红

### 什么是业绩分红？

平台每期从全平台销售额中提取 **{{dividend.pool_extract_rate × 100}}%** 作为分红池，按各等级会员的**贡献值占比**进行分配。

> 分红为额外奖励，不影响返利余额，由平台**线下转账**发放，系统仅展示应分金额供参考。

---

### 分红如何计算？

**第一步：形成分红池**

```
本期分红池 = 本期全平台销售额 × {{dividend.pool_extract_rate × 100}}%
```

其中公益捐赠占 **{{dividend.charity_rate × 100}}%**，剩余部分按等级切分。

**第二步：按等级切分**

<!-- 循环渲染 GET /api/h5/levels -->
```
{{name}} 等级成员共享：本期分红池 × {{dividend_pool_rate × 100}}%
```

**第三步：等级内按贡献值占比分配**

```
您的应得分红 = 本等级分红额 × （您的本期贡献值 ÷ 本等级全员本期贡献值合计）
```

---

### 如何多得分红？

1. **提升等级**：等级越高，所在等级占池比例通常越大
2. **多消费、多邀请**：贡献值越多，在等级内的分红占比越高
3. **引导下级活跃**：直推和间推下级的购买同样计入您的贡献值，贡献越大分红越多

---

## 字段来源索引

| 变量 | 来源接口 | 说明 |
|---|---|---|
| `contribution.coefficient` | `GET /api/h5/rules` | 每元换算贡献值系数 |
| `contribution.self_rate` | `GET /api/h5/rules` | 自购贡献值比例（0~1） |
| `contribution.direct_rate` | `GET /api/h5/rules` | 直推下级购买为您创造的贡献值比例（0~1） |
| `contribution.indirect_rate` | `GET /api/h5/rules` | 间推下级购买为您创造的贡献值比例（0~1） |
| `dividend.pool_extract_rate` | `GET /api/h5/rules` | 销售额分红池提取比例（0~1） |
| `dividend.charity_rate` | `GET /api/h5/rules` | 公益捐赠占比（0~1） |
| `name` / `upgrade_threshold` / `self_rebate_rate` / `parent_rebate_rate` / `grandpa_rebate_rate` / `dividend_pool_rate` / `is_default` | `GET /api/h5/levels` | 等级列表，循环渲染 |
| `cumulative_contribution` / `level_name` / `next_level` / `next_level.name` / `next_level.upgrade_threshold` / `gap_to_next_level` | `GET /api/h5/auth/profile` | 登录后的个人进度数据 |
