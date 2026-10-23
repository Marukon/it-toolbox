# KV 缓存使用说明

## 概述

本项目使用 Cloudflare KV 作为缓存存储，用于提高 API 响应速度、减少外部 API 调用频率，从而提升用户体验并降低成本。

## 使用 KV 缓存的工具

### 1. Headers 检查工具

**文件路径**: `functions/api/routes/headers-check.ts`

**缓存用途**:
- 缓存 HTTP 头检查结果
- 缓存键格式: `cache:headers:{urlHash}`
- 缓存过期时间: 3600 秒 (1 小时)

**使用场景**:
- 当用户检查相同 URL 的 HTTP 头时，直接返回缓存结果
- 减少重复的网络请求，提高响应速度

### 2. SSL 检查工具

**文件路径**: `functions/api/routes/ssl-check.ts`

**缓存用途**:
- 缓存 SSL 证书检查结果
- 缓存键格式: `cache:ssl:{domainHash}`
- 缓存过期时间: 3600 秒 (1 小时)

**使用场景**:
- 当用户检查相同域名的 SSL 证书时，直接返回缓存结果
- 减少重复的证书检查请求，提高响应速度

### 3. WHOIS 查询工具

**文件路径**: `functions/api/routes/whois.ts`

**缓存用途**:
- 缓存域名 WHOIS 信息
- 缓存键格式: `cache:whois:{domainHash}`
- 缓存过期时间: 3600 秒 (1 小时)

**使用场景**:
- 当用户查询相同域名的 WHOIS 信息时，直接返回缓存结果
- 减少重复的 WHOIS 查询，避免超过 API 限制

### 4. 汇率转换工具

**文件路径**: `functions/api/routes/exchange.ts`

**缓存用途**:
- 缓存汇率数据
- 缓存键格式:
  - 汇率列表: `cache:exchange:rates:{base}`
  - 汇率转换结果: `cache:exchange:convert:{from}:{to}:{amount}`
- 缓存过期时间: 3600 秒 (1 小时)

**使用场景**:
- 当用户查询相同基准货币的汇率列表时，直接返回缓存结果
- 当用户进行相同的货币转换时，直接返回缓存结果
- 减少重复的汇率 API 调用，避免超过 API 限制

## 缓存键生成

所有缓存键均使用 URL 或域名的哈希值作为标识符，确保缓存键的唯一性和安全性。

## 缓存策略

- **缓存过期时间**: 所有缓存项均设置 1 小时的过期时间，确保数据及时更新
- **缓存失效**: 当 API 调用失败时，不会更新缓存，保持原有缓存数据
- **错误处理**: 当 KV 操作失败时，会降级为直接调用 API，确保工具功能正常

## 本地开发配置

在本地开发时，需要创建 `wrangler.toml` 文件并配置 KV 命名空间：

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"
preview_id = "YOUR_PREVIEW_KV_ID_HERE"
```

## 生产环境配置

在生产环境中，需要在 Cloudflare Dashboard 中绑定 KV 命名空间：

1. 进入 **Workers & Pages** → **你的项目** → **Settings** → **Functions**
2. 找到 **KV namespace bindings** 部分
3. 点击 **Add binding**
4. 填写：
   - **Variable name**: `CACHE`
   - **KV namespace**: 选择你创建的 KV 命名空间
5. 点击 **Save**

## 性能影响

使用 KV 缓存后，工具的响应速度将显著提升，特别是对于重复查询的场景。同时，通过减少外部 API 调用，也降低了项目的运营成本。

## 监控与维护

- 可以在 Cloudflare Dashboard 中监控 KV 存储的使用情况
- 定期检查缓存命中率，优化缓存策略
- 根据实际使用情况调整缓存过期时间
