# 姿势识别（MediaPipe）Demo 部署说明

## 本地开发

- 本地：`python3 -m http.server 5173` 打开 `http://localhost:5173`

## Railway 部署

1. 将当前目录推送到 Git 仓库（GitHub/GitLab）：
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   gh repo create pose-demo --public --source=. --remote=origin --push
   # 或者手动创建仓库并 git remote add origin <repo-url>; git push -u origin main
   ```
2. 打开 Railway，选择 "New Project" → "Deploy from GitHub Repo"，选择该仓库。
3. Railway 会自动检测 `package.json` 并运行 `npm start`。确认 Service 的 `PORT` 由平台注入即可。
4. 部署完成后，点击生成的域名访问。

### 绑定自定义域名
1. 在 Railway 项目中进入该 Service → "Settings" → "Domains" → "Add Domain"，填入你的自定义域名。
2. 按提示在域名 DNS 服务商添加 CNAME 记录指向 Railway 提供的目标。
3. 等待 DNS 生效（通常几分钟到 24 小时），Railway 会自动签发 HTTPS 证书。

> 注意：本项目是纯静态站点，后端不需要。相机权限需在 HTTPS 环境下或 `localhost` 才能工作。 