# Eraserly Docker 部署文档

本文档介绍如何使用 Docker 和 Nginx 在 Linux 服务器上部署 Eraserly 项目。

## 目录

- [前置要求](#前置要求)
- [快速部署](#快速部署)
- [详细说明](#详细说明)
- [Nginx 反向代理配置](#nginx-反向代理配置)
- [SSL/HTTPS 配置](#sslhttps-配置)
- [常用命令](#常用命令)
- [故障排查](#故障排查)

## 前置要求

在开始部署之前，请确保你的 Linux 服务器已安装以下软件：

- Docker (>= 20.10)
- Docker Compose (>= 2.0)

### 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# CentOS/RHEL
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到 docker 组（可选，避免使用 sudo）
sudo usermod -aG docker $USER
newgrp docker
```

### 安装 Docker Compose

```bash
# Docker Compose V2 通常随 Docker 一起安装
docker compose version
```

## 快速部署

### 1. 克隆项目

```bash
git clone https://github.com/lxfater/inpaint-web.git
cd inpaint-web
```

### 2. 使用 Docker Compose 部署

```bash
# 构建并启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

### 3. 访问应用

部署完成后，可以通过以下地址访问：

- 应用地址: `http://your-server-ip:3000`
- Nginx 代理: `http://your-server-ip`

## 详细说明

### 文件说明

| 文件                 | 说明                                      |
| -------------------- | ----------------------------------------- |
| `Dockerfile`         | 多阶段构建配置，用于构建 Docker 镜像      |
| `nginx.conf`         | 应用内部 nginx 配置，用于提供静态文件服务 |
| `nginx-proxy.conf`   | 外部 nginx 反向代理配置                   |
| `docker-compose.yml` | Docker Compose 编排文件                   |
| `.dockerignore`      | Docker 构建时忽略的文件                   |

### Dockerfile 说明

```dockerfile
# 第一阶段：构建阶段
FROM node:18-alpine AS builder
# 安装依赖并构建项目
RUN npm run paraglide && npm run build

# 第二阶段：生产阶段
FROM nginx:alpine
# 使用 nginx 提供静态文件服务
```

### docker-compose.yml 服务说明

```yaml
services:
  eraserly: # 前端应用容器
    ports:
      - '3000:80' # 映射容器 80 端口到主机 3000 端口

  nginx: # Nginx 反向代理容器
    ports:
      - '80:80' # 映射容器 80 端口到主机 80 端口
```

## Nginx 反向代理配置

### 配置域名

编辑 `nginx-proxy.conf` 文件，修改 `server_name`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 修改为你的域名或服务器 IP
    ...
}
```

### 修改端口映射

如果需要修改端口，编辑 `docker-compose.yml`：

```yaml
services:
  nginx:
    ports:
      - '8080:80' # 将主机 8080 端口映射到容器 80 端口
```

### 重启服务

```bash
# 重启所有服务
docker compose restart

# 重启特定服务
docker compose restart nginx
```

## SSL/HTTPS 配置

### 使用 Let's Encrypt 获取免费 SSL 证书

```bash
# 安装 certbot
sudo apt-get update
sudo apt-get install -y certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书位置
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 配置 HTTPS

1. 复制证书到项目目录：

```bash
mkdir -p ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
sudo chown -R $USER:$USER ssl
```

2. 编辑 `nginx-proxy.conf`，取消 HTTPS 配置的注释：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ...
}
```

3. 取消 HTTP 服务器的重定向注释：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

4. 更新 `docker-compose.yml`，挂载 SSL 证书：

```yaml
nginx:
  volumes:
    - ./nginx-proxy.conf:/etc/nginx/conf.d/default.conf:ro
    - ./ssl:/etc/nginx/ssl:ro
```

5. 重启服务：

```bash
docker compose down
docker compose up -d
```

## 常用命令

### Docker Compose 命令

```bash
# 启动所有服务
docker compose up -d

# 停止所有服务
docker compose down

# 重启所有服务
docker compose restart

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f eraserly

# 重新构建镜像
docker compose build

# 重新构建并启动
docker compose up -d --build

# 进入容器
docker compose exec eraserly sh
```

### Docker 命令

```bash
# 查看运行的容器
docker ps

# 查看容器日志
docker logs -f <container_id>

# 进入容器
docker exec -it <container_id> sh

# 停止容器
docker stop <container_id>

# 删除容器
docker rm <container_id>

# 删除镜像
docker rmi <image_id>

# 清理未使用的资源
docker system prune -a
```

## 故障排查

### 1. 容器无法启动

```bash
# 查看容器日志
docker compose logs -f

# 检查端口是否被占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000
```

### 2. 无法访问应用

```bash
# 检查防火墙设置
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 检查容器是否运行
docker compose ps
```

### 3. WebGPU 不工作

确保 nginx 配置包含正确的 CORS 头部：

```nginx
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
```

### 4. 模型下载问题

由于模型文件托管在 HuggingFace，在某些网络环境下可能无法下载。可以：

- 使用代理服务器
- 手动下载模型文件并挂载到容器中
- 使用镜像站点

### 5. 内存不足

如果服务器内存不足，可以限制容器资源使用：

```yaml
# 在 docker-compose.yml 中添加
services:
  eraserly:
    deploy:
      resources:
        limits:
          memory: 512M
```

## 性能优化

### 1. 启用 Nginx 缓存

```nginx
# 在 nginx-proxy.conf 中添加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;

location / {
    proxy_cache my_cache;
    proxy_cache_valid 200 1d;
    ...
}
```

### 2. 启用 HTTP/2

```nginx
listen 443 ssl http2;  # 在 HTTPS 配置中已启用
```

### 3. 压缩传输

```nginx
# 在 nginx.conf 中已配置 gzip 压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 安全建议

1. **定期更新**: 定期更新 Docker 镜像和系统包

```bash
docker compose pull
docker compose up -d --build
```

2. **使用 HTTPS**: 生产环境务必使用 HTTPS

3. **限制访问**: 使用防火墙限制访问端口

4. **监控日志**: 定期检查应用和 nginx 日志

5. **备份数据**: 虽然这是静态应用，但建议备份配置文件

## 联系方式

如有问题，请联系：zhaozed888@gmail.com

## 许可证

本项目基于 GNU GPL-3.0 许可证开源。
