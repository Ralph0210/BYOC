---
description: Deploy app to Vercel and GitHub
---

# Deployment Workflow

This workflow guides you through deploying the Path app to Vercel and pushing the code to GitHub.

## Prerequisites

- GitHub account
- Vercel account linked to GitHub

## Steps

### 1. Initialize Git Repository

Initialize a git repository if one doesn't exist, ignore sensitive files, and commit changes.

```bash
# Initialize git
git init

# Create .gitignore
echo ".DS_Store
node_modules/
dist/
.env
.env.local
.vercel
" > .gitignore

# Add and commit files
git add .
git commit -m "Initial commit for Path app with Google OAuth and Landing Page"
```

### 2. Push to GitHub

Create a new repository on GitHub and push your code.

> [!IMPORTANT]
> You need to create a new repository on [GitHub](https://github.com/new) named `path-app` (or similar).

```bash
# Add remote origin (Replace USERNAME/REPO with actual values)
# git remote add origin https://github.com/USERNAME/path-app.git

# Push to main
# git branch -M main
# git push -u origin main
```

### 3. Deploy to Vercel

Deploy the project using Vercel CLI or Dashboard.

**Option A: Vercel CLI (Recommended)**

```bash
# Install Vercel CLI globally if not installed
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

**Option B: Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** -> **Project**
3. Import your GitHub repository (`path-app`)
4. Configure Environment Variables:
   - `VITE_SUPABASE_URL`: (Your URL)
   - `VITE_SUPABASE_ANON_KEY`: (Your Key)
5. Click **Deploy**

### 4. Post-Deployment Configuration

After deployment, update your Google Cloud and Supabase settings with the production URL.

1. **Google Cloud Console** -> **Credentials** -> **OAuth 2.0 Client IDs**:

   - Add your Vercel URL (e.g., `https://path-app.vercel.app`) to **Authorized JavaScript origins**
   - No change needed for **Authorized redirect URIs** (it stays as Supabase URL)

2. **Supabase Dashboard** -> **Authentication** -> **URL Configuration**:
   - Add your Vercel URL to **Site URL** and **Redirect URLs**
