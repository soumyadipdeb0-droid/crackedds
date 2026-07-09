# CrackedDS - Full-Stack Data Science Interview Prep

A complete interview preparation platform with **783 questions** across **19 topics**, interactive case studies, SQL/Python IDE, and user authentication.

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Push to GitHub

```bash
# Create a new repo on GitHub, then:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/crackedds.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `crackedds` repository
4. Click **Deploy** (it will fail first time - that's okay!)

### Step 3: Add Vercel Postgres Database

1. In your Vercel project, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Name it `crackedds-db` and click **Create**
4. Vercel automatically adds the `POSTGRES_*` environment variables

### Step 4: Set Environment Variables

Go to **Settings** → **Environment Variables** and add:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Generate a random string: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | (Optional) From Google Cloud Console |

### Step 5: Redeploy

Go to **Deployments** → click the `...` menu → **Redeploy**

✅ **Done!** Your app is live at `https://your-project.vercel.app`

---

## 🔐 Google OAuth Setup (Optional)

To enable "Continue with Google":

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add Authorized JavaScript origins:
   - `http://localhost:3000` (for local dev)
   - `https://your-project.vercel.app` (your Vercel URL)
6. Copy the **Client ID**
7. Add to Vercel environment variables as `GOOGLE_CLIENT_ID`
8. Update `public/index.html` - find `GOOGLE_CLIENT_ID` and replace with your ID

---

## 📁 Project Structure

```
crackedds/
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
├── api/                  # Serverless API functions
│   ├── _db.js            # Database operations (Vercel Postgres)
│   ├── _auth.js          # Auth utilities (JWT, bcrypt, Google)
│   ├── auth/
│   │   ├── register.js   # POST /api/auth/register
│   │   ├── login.js      # POST /api/auth/login
│   │   ├── google.js     # POST /api/auth/google
│   │   └── me.js         # GET /api/auth/me
│   ├── progress.js       # GET/POST/DELETE /api/progress
│   ├── bookmarks.js      # GET/POST /api/bookmarks
│   └── sync.js           # GET/POST /api/sync
└── public/
    └── index.html        # Frontend (783 questions, all features)
```

---

## 📡 API Reference

### Authentication

```bash
# Register
POST /api/auth/register
Body: { "email": "...", "password": "...", "name": "..." }

# Login
POST /api/auth/login
Body: { "email": "...", "password": "..." }

# Google OAuth
POST /api/auth/google
Body: { "idToken": "..." }

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Progress & Bookmarks

```bash
# Get progress
GET /api/progress

# Mark complete
POST /api/progress
Body: { "topicId": "ml", "questionIndex": 5 }

# Toggle bookmark
POST /api/bookmarks
Body: { "topicId": "sql", "questionIndex": 3 }

# Full sync
GET /api/sync
POST /api/sync
Body: { "progress": {...}, "bookmarks": [...] }
```

---

## 🛠️ Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Install dependencies
npm install

# Link to Vercel project (pulls env vars)
vercel link

# Pull environment variables
vercel env pull .env.local

# Run locally
vercel dev
```

Open http://localhost:3000

---

## 📊 Features

- **783 Questions** across 19 topics
- **Interactive Case Studies** with guided learning
- **SQL & Python IDE** with real execution
- **Email + Google Authentication**
- **Progress Tracking** synced to cloud
- **Bookmarking** system
- **Streak Counter** for motivation
- **Dark/Light Mode**
- **Company Filters** (Google, Meta, Amazon, etc.)
- **Role Filters** (Data Scientist, ML Engineer, etc.)
- **Daily Challenge**

---

## 🔧 Troubleshooting

### "Database connection failed"
- Make sure Vercel Postgres is set up in Storage tab
- Check that `POSTGRES_*` env vars exist

### "Google Sign-In not working"
- Verify `GOOGLE_CLIENT_ID` is set correctly
- Check authorized origins in Google Cloud Console
- Make sure you updated the client ID in `public/index.html`

### "API returns 401"
- Token may have expired - try logging out and back in
- Check that `JWT_SECRET` is set

---

## 📝 License

MIT License - use freely for personal or commercial projects.

---

Built with ❤️ for data science interview prep.

<!-- redeploy trigger -->

<!-- redeploy trigger -->
