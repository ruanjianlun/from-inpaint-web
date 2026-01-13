# Windows 本地测试指南

## 快速开始

### 1. 启动服务

```powershell
# 使用本地测试配置启动
docker compose -f docker-compose.local.yml up -d
```

### 2. 访问应用

浏览器打开: **http://localhost:8080**

### 3. 查看状态

```powershell
# 查看运行状态
docker compose -f docker-compose.local.yml ps

# 查看日志
docker compose -f docker-compose.local.yml logs -f
```

### 4. 停止服务

```powershell
docker compose -f docker-compose.local.yml down
```

## 常用命令

```powershell
# 重启服务
docker compose -f docker-compose.local.yml restart

# 重新构建（代码修改后）
docker compose -f docker-compose.local.yml up -d --build

# 进入容器
docker exec -it eraserly-local sh
```

## 端口说明

| 端口 | 用途                  |
| ---- | --------------------- |
| 8080 | Eraserly 应用访问端口 |

## 多容器部署

如果你本地有多个 Docker 容器，修改 `docker-compose.local.yml` 中的端口：

```yaml
ports:
  - '8081:80' # 改为其他端口，如 8081、8082 等
```

## 网络问题

如果遇到 "Get "https://registry-1.docker.io/v2/": EOF" 错误：

### 方法 1: 重试

```powershell
docker compose -f docker-compose.local.yml up -d
```

### 方法 2: 配置 Docker Desktop 镜像加速

1. 打开 Docker Desktop
2. 点击 Settings (设置)
3. 选择 Docker Engine
4. 添加镜像加速配置：

```json
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

5. 点击 "Apply & Restart"

### 方法 3: 先拉取镜像

```powershell
docker pull nginx:alpine
docker compose -f docker-compose.local.yml up -d
```

## 故障排查

### 端口被占用

```powershell
# 查看端口占用
netstat -ano | findstr :8080

# 如果被占用，修改配置文件中的端口号
```

### 容器启动失败

```powershell
# 查看详细日志
docker compose -f docker-compose.local.yml logs

# 重新构建
docker compose -f docker-compose.local.yml up -d --build
```

## 清理

```powershell
# 停止并删除容器
docker compose -f docker-compose.local.yml down

# 删除镜像（如需重新构建）
docker rmi inpaint-web-eraserly
```
