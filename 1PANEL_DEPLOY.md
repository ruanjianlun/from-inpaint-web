# 1Panel 面板部署指南

本指南适用于已使用 1Panel 面板的 VPS 服务器。

## 部署步骤

### 1. 上传项目文件到服务器

```bash
# 使用 scp 上传（在本地 Windows PowerShell 执行）
scp -r D:\workSpace\vscodeWorkSpace\from-inpaint-web root@your-server-ip:/root/

# 或使用 Git 克隆
ssh root@your-server-ip
cd /root
git clone <your-repo-url> inpaint-web
cd inpaint-web
```

### 2. 构建并启动容器

```bash
# 进入项目目录
cd /root/inpaint-web

# 使用 1Panel 专用配置启动
docker compose -f docker-compose.1panel.yml up -d --build
```

### 3. 在 1Panel 中配置反向代理

1. 登录 1Panel 面板
2. 进入 **网站** → **反向代理**
3. 点击 **创建反向代理**
4. 填写配置：
   - **代理名称**: eraserly
   - **监听端口**: 80 或 443（如果您配置了 SSL）
   - **域名（可选）**: eraserly.yourdomain.com
   - **目标地址**: `http://127.0.0.1:3000`
5. 点击 **确认**

### 4. 访问应用

配置完成后，通过以下方式访问：

- **http://your-server-ip** （如果没有配置域名）
- **http://eraserly.yourdomain.com** （如果配置了域名）

## 常用命令

```bash
# 查看容器状态
docker compose -f docker-compose.1panel.yml ps

# 查看日志
docker compose -f docker-compose.1panel.yml logs -f

# 重启容器
docker compose -f docker-compose.1panel.yml restart

# 停止容器
docker compose -f docker-compose.1panel.yml down

# 重新构建（代码修改后）
docker compose -f docker-compose.1panel.yml up -d --build
```

## 端口说明

| 容器内端口 | 宿主机端口 | 用途          |
| ---------- | ---------- | ------------- |
| 80         | 3000       | Eraserly 应用 |

## 与现有博客共存

由于 1Panel 已经管理着端口 80/443，本配置：

- **不启动独立的 nginx 容器**
- 应用运行在 3000 端口
- 通过 1Panel 的反向代理统一管理

这样可以避免端口冲突，且方便统一管理 SSL 证书。

## 故障排查

### 端口 3000 被占用

如果 3000 端口被占用，修改 `docker-compose.1panel.yml`：

```yaml
ports:
  - '3001:80' # 改为其他端口
```

同时修改 1Panel 反向代理的目标地址为 `http://127.0.0.1:3001`

### 容器启动失败

```bash
# 查看详细日志
docker compose -f docker-compose.1panel.yml logs

# 检查容器状态
docker ps -a
```

### 无法访问

1. 检查容器是否正常运行：`docker ps`
2. 检查防火墙是否开放对应端口
3. 检查 1Panel 反向代理配置是否正确
