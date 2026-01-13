# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置 npm 官方源 + 加速
RUN npm config set registry https://registry.npmjs.org/
RUN npm config set fetch-timeout 600000 -g
RUN npm config set fetch-retries 5 -g

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 复制 project.inlang 目录（paraglide 编译需要）
COPY project.inlang ./project.inlang

# 安装依赖（禁用 postinstall 避免报错）
RUN npm ci --ignore-scripts

# 编译国际化消息
RUN npm run paraglide

# 复制项目剩余文件
COPY . .

# 构建项目
RUN npm run build

# 生产阶段 - 使用 nginx 提供静态文件服务
FROM nginx:alpine

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
