# Move a Little Game - Pose Recognition Demo

A lightweight motion game based on MediaPipe pose recognition. Stand in front of the camera and follow the movement cards to complete poses.

## 🎮 Features

- **Practice Mode**: Select movements via cards or gestures to practice
- **Play Mode**: Complete all movements sequentially for a comprehensive score
- **Gesture Controls**: Use hand gestures to switch between movements
- **Real-time Feedback**: Live pose detection with fit percentage
- **Voice Guidance**: Encouraging voice tips and feedback

## 🚀 Local Development

```bash
# Simple HTTP server
python3 -m http.server 5173

# Or using Node.js
npm install
npm start
```

Then open `http://localhost:5173/intro.html`

## 📦 Deploy to Railway

### Method 1: Using GitHub (Recommended)

1. **Initialize Git and push to GitHub:**
   ```bash
   cd /path/to/your/project
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   
   # Create GitHub repo (using GitHub CLI)
   gh repo create move-a-little-game --public --source=. --remote=origin --push
   
   # Or manually:
   # 1. Create a new repo on GitHub
   # 2. git remote add origin https://github.com/YOUR_USERNAME/move-a-little-game.git
   # 3. git push -u origin main
   ```

2. **Deploy on Railway:**
   - Go to https://railway.app
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect `package.json` and deploy
   - Wait for deployment to complete
   - Click the generated domain to access your app

### Method 2: Using Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Generate domain:**
   ```bash
   railway domain
   ```

### Method 3: Direct Deployment (No GitHub)

1. Go to https://railway.app
2. Click "New Project" → "Empty Project"
3. Add a new service → "Empty Service"
4. In the service settings, go to "Deploy" tab
5. Upload your project files (drag & drop or zip)
6. Railway will auto-deploy

## 🔧 Configuration Files

- `package.json`: Node.js dependencies and scripts
- `Procfile`: Railway process configuration
- `railway.json`: Railway deployment settings
- `.gitignore`: Files to ignore in version control

## 🌐 Custom Domain (Optional)

1. In Railway project → Service → "Settings" → "Domains"
2. Click "Add Domain" and enter your custom domain
3. Add CNAME record in your DNS provider:
   - Name: `@` or `www`
   - Value: Railway provided target
4. Wait for DNS propagation (few minutes to 24 hours)
5. Railway will automatically provision HTTPS certificate

## ⚠️ Important Notes

- **Camera Permission**: Requires HTTPS or `localhost` to work
- **Pure Static Site**: No backend required
- **Browser Compatibility**: Modern browsers with MediaPipe support
- **CORS**: MediaPipe CDN resources are loaded from external sources

## 📝 Environment Variables (Optional)

If needed, you can set environment variables in Railway:
- Go to your service → "Variables" tab
- Add any required environment variables

## 🛠️ Troubleshooting

**Issue**: Camera not working after deployment
- **Solution**: Ensure the site is served over HTTPS (Railway provides this automatically)

**Issue**: Build fails
- **Solution**: Check Node.js version in `package.json` (should be >=18)

**Issue**: App not starting
- **Solution**: Verify `PORT` environment variable is used (Railway injects this automatically)

## 📄 License

This project is for demonstration purposes. # Force redeploy
