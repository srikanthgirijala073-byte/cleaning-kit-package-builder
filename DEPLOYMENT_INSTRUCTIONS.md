# 🚀 Deployment Guide: Cleaning Kit Package Builder

This guide explains how to deploy the **Cleaning Kit Package Builder** (both Frontend and Backend) to production.

---

## 📁 Repository Structure
```
/ (Git Root)
├── frontend/   # React + Vite (To be deployed on Vercel)
└── backend/    # Node.js + Express (To be deployed on Render/Railway/etc.)
```

---

## 🌐 Part 1: Deploying the Frontend (Vercel)

### Step 1: Connect your GitHub Repo to Vercel
1. Sign in or sign up at [Vercel](https://vercel.com).
2. Click the **Add New...** button and select **Project**.
3. Select **Import** next to your GitHub repository: `srikanthgirijala073-byte/cleaning-kit-package-builder`.

### Step 2: Configure Project Settings
In the configuration screen, apply the following settings:
- **Framework Preset**: Select `Vite` (it will usually auto-detect).
- **Root Directory**: Click *Edit* and select the **`frontend`** directory.
- **Build & Development Settings**: Keep defaults (Build Command: `npm run build`, Output Directory: `dist`).
- **Environment Variables**:
  - Add `VITE_BACKEND_URL`: `https://your-backend-url.onrender.com` (this is the URL of your deployed Express server).

### Step 3: Deploy
- Click **Deploy**. Vercel will build the frontend and provide you with a deployment URL (e.g., `https://cleaning-kit-package-builder.vercel.app`).

---

## 🖥️ Part 2: Deploying the Backend & Databases

### Step 1: Set up Databases
The application requires both MySQL (main database) and MongoDB (for the RBAC Auth system).

#### 1. Hosted MySQL
- Set up a managed MySQL database instance (e.g., via Aiven, PlanetScale, SingleStore, Supabase, or AWS RDS).
- Import the database schema from [backend/schema.sql](file:///c:/Users/SRIKANTH/Downloads/cleankit_FIXED/cleankit_fixed/backend/schema.sql) into your database:
  ```bash
  mysql -h <your-db-host> -u <your-db-user> -p <your-db-name> < backend/schema.sql
  ```

#### 2. Hosted MongoDB
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Obtain your MongoDB connection string (e.g., `mongodb+srv://<username>:<password>@cluster0.mongodb.net/cleaning_kit_rbac?retryWrites=true&w=majority`).

---

### Step 2: Deploy Backend Server (e.g., on Render or Railway)
1. Sign in to your dashboard (e.g., [Render](https://render.com)).
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   - **Name**: `cleaning-kit-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default)
   - `DB_HOST`: `<your-mysql-host>`
   - `DB_PORT`: `3306` (or custom MySQL port)
   - `DB_USER`: `<your-mysql-user>`
   - `DB_PASSWORD`: `<your-mysql-password>`
   - `DB_NAME`: `<your-mysql-database-name>`
   - `MONGODB_URI`: `<your-mongodb-atlas-connection-string>`
   - `JWT_SECRET`: `<secure-random-string>`
   - `JWT_REFRESH_SECRET`: `<secure-random-string-2>`
   - `SESSION_SECRET`: `<secure-random-string-3>`
   - `FRONTEND_URL`: `https://cleaning-kit-package-builder.vercel.app` *(Must match your Vercel URL for CORS authorization)*
6. Click **Deploy**.

---

## ⚡ Part 3: Verification & Updates

When you push new changes to the `main` branch of your GitHub repository, both Vercel and Render will automatically trigger a build and re-deploy your code.

### Troubleshooting CORS Errors
If you see console errors like:
`CORS policy does not allow access from origin ...`
Double check that `FRONTEND_URL` on your backend environment variables matches your Vercel URL exactly (e.g., including or omitting the trailing slash matching your site domain).
