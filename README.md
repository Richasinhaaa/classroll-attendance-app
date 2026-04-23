# ClassRoll — Attendance Tracker

A full-stack attendance management app for teachers. Built with React + Node.js + MongoDB.

> ✨ Improvements over the original:
> - Role-based auth (teacher / admin)
> - "Late" and "Excused" attendance statuses (not just present/absent)
> - Per-session notes on individual students
> - Analytics dashboard with Recharts (bar + pie charts)
> - Rate limiting + Helmet security headers
> - Soft-delete for students (data preserved)
> - Monthly attendance % per student with color-coded warnings
> - Mobile-responsive sidebar with hamburger menu
> - Docker + docker-compose support

---

## Project Structure

```
classroll/
├── backend/
│   ├── models/          User.js, Student.js, Attendance.js
│   ├── routes/          auth.js, students.js, attendance.js, reports.js
│   ├── middleware/       auth.js (JWT protect)
│   ├── server.js
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── context/     AuthContext.jsx
│   │   ├── components/  Layout.jsx
│   │   └── pages/       Dashboard, Students, TakeAttendance, History, Reports
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── render.yaml
└── package.json
```

---

## ⚡ Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd classroll
npm run install:all
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your values:
#   MONGO_URI=mongodb://localhost:27017/attendanceDB   (or Atlas URI)
#   JWT_SECRET=some_long_random_string
```

### 3. Run both servers

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## 🐳 Docker (with local MongoDB)

```bash
docker-compose up --build
```

Starts MongoDB + backend + frontend together.

---

## ☁️ Deploy to Render.com (Free Tier)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/<you>/classroll.git
git push -u origin main
```

### Step 2: Deploy backend
1. Go to https://render.com → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** → `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add environment variables:
   - `MONGO_URI` → your MongoDB Atlas connection string
   - `JWT_SECRET` → any long random string
   - `NODE_ENV` → `production`
   - `FRONTEND_URL` → your Render frontend URL (set after frontend is deployed)

### Step 3: MongoDB Atlas (free)
1. Go to https://mongodb.com/atlas → create free cluster
2. Create a database user (username + password)
3. Whitelist all IPs: `0.0.0.0/0`
4. Get the connection string and put it in `MONGO_URI`

### Step 4: Deploy frontend
1. Render → New → Static Site
2. Connect same repo
3. **Root Directory** → `frontend`
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`
6. Add rewrite rule: `/* → /index.html` (for SPA routing)
7. Set env var: `VITE_API_URL` → your backend Render URL

---

## 🔌 API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → returns JWT |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/students` | List students |
| POST | `/api/students` | Add student |
| PUT  | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Soft-delete student |
| GET  | `/api/students/classes` | List distinct classes |
| POST | `/api/attendance` | Save attendance session |
| GET  | `/api/attendance` | List sessions |
| GET  | `/api/attendance/:id` | Session detail |
| DELETE | `/api/attendance/:id` | Delete session |
| GET  | `/api/reports/summary` | Per-student attendance % |
| GET  | `/api/reports/dashboard` | Overview stats |

All routes except auth require `Authorization: Bearer <token>` header.

---

## 🎨 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TailwindCSS, React Query, Recharts |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB (Atlas or local) |
| Auth | JWT + bcryptjs |
| Hosting | Render.com (backend) + Render Static (frontend) |
| Container | Docker + docker-compose |

---

## 📝 Notes

- All passwords are bcrypt-hashed (cost factor 12)
- Attendance sessions are upserted — re-saving on the same date+class overwrites gracefully
- Students are soft-deleted (set `isActive: false`) to preserve attendance history
- Rate limiting: 200 requests per 15 minutes per IP
