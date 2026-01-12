# 快速部署指南

## 一键部署

```bash
# 1. 克隆项目
git clone https://github.com/lxfater/inpaint-web.git
cd inpaint-web

# 2. 启动服务
docker compose up -d

# 3. 访问应用
# 浏览器打开: http://your-server-ip
```

## 配置域名

编辑 `nginx-proxy.conf`:

```nginx
server_name your-domain.com;
```

重启服务:

```bash
docker compose restart nginx
```

## 配置 HTTPS (可选)

```bash
# 1. 获取 SSL 证书
sudo certbot certonly --standalone -d your-domain.com

# 2. 复制证书
mkdir ssl
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem ssl/
sudo chown -R $USER:$USER ssl

# 3. 修改 nginx-proxy.conf 启用 HTTPS 配置

# 4. 重启服务
docker compose restart
```

## 常用命令

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 更新并重新部署
git pull
docker compose up -d --build
```

## 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 完整文档

详细部署文档请查看 [DOCKER_DEPLOY.md](./DOCKER_DEPLOY.md)
