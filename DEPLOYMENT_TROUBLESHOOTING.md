# 部署故障排查指南

本文档记录了在 Linux VPS 上部署 Eraserly 应用时遇到的问题及解决方案。

## 问题描述

在 1Panel 面板管理的 VPS 服务器上部署应用时，遇到以下问题：

1. **构建产物不更新**：即使 `git pull` 拉取了最新代码，Docker 构建后容器内的文件仍然是旧的
2. **页面加载错误**：访问应用时显示白屏，浏览器控制台报错 `TypeError: (void 0) is not a function`

## 根本原因

### 1. Docker Compose 构建缓存问题

Docker 的多阶段构建使用分层缓存机制，即使使用 `--no-cache` 参数，Docker Compose 有时仍会保留某些层的缓存。导致：

- 修改代码后重新构建，容器内仍是旧的构建产物
- JS 文件名哈希值不变（如 `index-K3oWXP52.js` 而不是新的 `index-ej9wnMEx.js`）

### 2. ort 全局变量类型声明问题

`vite-env.d.ts` 中使用 `declare namespace ort` 导致 Vite 构建时错误地将全局 `ort` 变量当作 ES 模块处理，运行时 `ort` 对象变成 `{__esModule: true}`。

**解决方案**：使用 `declare var ort: any` 简化类型声明。

## 完整部署步骤

### 第一次部署

```bash
# 1. 克隆项目
cd /root
git clone <your-repo-url> inpaint-web
cd inpaint-web

# 2. 构建并启动
docker compose -f docker-compose.1panel.yml up -d --build

# 3. 验证部署
docker compose -f docker-compose.1panel.yml ps
docker compose -f docker-compose.1panel.yml logs -f
```

### 更新代码后重新部署（重要！）

```bash
cd /root/inpaint-web

# 1. 拉取最新代码
git pull

# 2. 验证代码已更新
git log --oneline -1
cat src/vite-env.d.ts | grep ort

# 3. 停止容器
docker compose -f docker-compose.1panel.yml down

# 4. 删除旧镜像（关键步骤！）
docker rmi $(docker images | grep from-inpaint-web | awk '{print $3}') 2>/dev/null || true

# 5. 强制完全重建（关键参数：--no-cache --progress=plain）
docker compose -f docker-compose.1panel.yml build --no-cache --progress=plain

# 6. 启动服务
docker compose -f docker-compose.1panel.yml up -d

# 7. 验证文件已更新
docker exec eraserly-app cat /usr/share/nginx/html/index.html | grep 'src=\"/assets/'
# 应该显示最新的 JS 文件名（如 index-ej9wnMEx.js）
```

## 故障排查

### 问题 1：页面白屏，浏览器控制台报错

**错误信息**：

```
TypeError: (void 0) is not a function
```

**原因**：`ort` 全局变量被错误处理，需要在 `vite-env.d.ts` 中使用正确的类型声明。

**验证方法**：

```javascript
// 在浏览器控制台运行
console.log('ort:', ort)
// 正确输出应该包含 InferenceSession、Tensor 等属性
// 错误输出：{__esModule: true}
```

**解决方案**：确保 `src/vite-env.d.ts` 中使用：

```typescript
declare var ort: any
```

### 问题 2：构建产物不更新

**现象**：

- `git pull` 显示代码已更新
- 但容器内 JS 文件名仍是旧的

**验证方法**：

```bash
# 检查本地代码时间戳
ls -lt src/vite-env.d.ts

# 检查容器内文件
docker exec eraserly-app cat /usr/share/nginx/html/index.html | grep 'src=\"/assets/'
```

**解决方案**：

```bash
# 必须使用以下组合命令
docker compose -f docker-compose.1panel.yml down
docker rmi $(docker images | grep from-inpaint-web | awk '{print $3}') 2>/dev/null
docker compose -f docker-compose.1panel.yml build --no-cache --progress=plain
docker compose -f docker-compose.1panel.yml up -d
```

### 问题 3：1Panel 反向代理配置后页面白屏

**原因**：WebGPU 需要特定的 CORS 头部

**解决方案**：在 1Panel 反向代理中添加以下头部：

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

## 配置文件说明

### docker-compose.1panel.yml

```yaml
services:
  eraserly:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: eraserly-app
    restart: unless-stopped
    ports:
      - '3000:80'
    environment:
      - NODE_ENV=production
```

### 关键参数说明

- **--no-cache**：禁用构建缓存，强制重新执行所有构建步骤
- **--progress=plain**：显示详细构建日志，便于排查问题
- **删除镜像后再构建**：确保所有旧的构建层被清除

## 常用命令

### 查看日志

```bash
docker compose -f docker-compose.1panel.yml logs -f
```

### 重启服务

```bash
docker compose -f docker-compose.1panel.yml restart
```

### 停止服务

```bash
docker compose -f docker-compose.1panel.yml down
```

### 进入容器

```bash
docker exec -it eraserly-app sh
```

### 查看容器资源使用

```bash
docker stats eraserly-app
```

## 关键注意事项

1. ⚠️ **更新代码后必须删除镜像再重建**：这是 Docker Compose 构建缓存特性决定的

2. ⚠️ **必须使用 `--no-cache --progress=plain`**：单纯 `--no-cache` 可能不够

3. ⚠️ **验证构建产物**：重建后务必检查 JS 文件名是否更新

4. ⚠️ **Cloudflare 缓存**：如果使用 Cloudflare CDN，修改代码后需要清除缓存或暂停代理

## 技术细节

### 为什么手动构建成功但 docker-compose 失败？

```bash
# 手动挂载源代码构建（成功）
docker run --rm -v "$(pwd):/app" -w /app node:18-alpine sh -c "npm run build"

# Docker Compose 构建（可能使用缓存）
docker compose build
```

**原因**：手动构建直接挂载源代码，绕过了 Docker 的分层缓存机制。

### Docker 多阶段构建的缓存机制

```
FROM node:18-alpine AS builder   <-- 这一层会被缓存
COPY package*.json ./             <-- 这一层会被缓存
RUN npm ci                        <-- 这一层会被缓存
COPY . .                          <-- 代码变更，这层重建
RUN npm run build                 <-- 依赖上层的产物
```

如果不删除镜像，Docker 可能使用旧的层缓存，导致构建产物不一致。

## 更新历史

- **2026-01-13**：初始版本，记录 Docker 缓存和 ort 类型声明问题
