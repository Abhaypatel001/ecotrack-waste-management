# 🌿 EcoTrack — Smart Waste Management System

## 🌐 Live Project : https://ecotrack-waste-management-jet.vercel.app/

**Cleaner Cities. Smarter Waste Management.**

EcoTrack is a full-stack waste-management web application built to help residents report garbage and sanitation issues, request waste pickups, track complaint progress, and access waste-management guidance. Administrators can review reports and manage collection operations through a dedicated dashboard.

## ✨ Features

### User features

- User registration and login.
- Personal dashboard for pickup requests and issue reports.
- Waste pickup request creation and status tracking.
- Garbage and sanitation issue reporting with category, description, address, and map coordinates.
- Optional image attachment for issue reports.
- Complaint status updates visible in the user dashboard.
- Responsive React interface for desktop and mobile browsers.

### Admin features

- Admin dashboard and operational statistics.
- User directory.
- Pickup request management and status updates.
- Recording collected waste weight when applicable.
- Issue/complaint review and status updates.
- Collection schedule management.
- Collector management.
- Waste-category management.
- Reports and administrative settings.

### AI features

- **Garbage image verification:** Uses the Gemini API to assess whether an uploaded photo appears to show discarded waste before the report is saved. Unrelated or uncertain images may be rejected.
- **EcoBot chatbot:** Answers general questions about waste management, recycling, reporting issues, and using EcoTrack. When authenticated user-record integration is configured, it can use that user's pickup and complaint records to answer status questions.
- The AI may make mistakes. Image verification is not a guarantee that a photo definitely contains garbage.

## 🧰 Tech Stack

- **Frontend:** React, Vite, React Router, Tailwind CSS, Lucide React
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** JWT and password hashing
- **Image uploads:** Multer
- **AI:** Google Gemini API via the server
- **Deployment:** Vercel (frontend), Render (backend)
- **Version control:** Git and GitHub

## 📁 Project Structure

```text
waste-management-system/
├── client/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       │   ├── auth/
│       │   ├── chatbot/
│       │   ├── layout/
│       │   └── ui/
│       ├── pages/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   └── user/
│       ├── routes/
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── uploads/
│   ├── index.js
│   └── package.json
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## ✅ Prerequisites

Install the following before running EcoTrack locally:

- Node.js and npm
- Git
- A MongoDB Atlas database (or another accessible MongoDB deployment)
- A Google Gemini API key for AI chatbot and image-verification features
- A code editor such as Visual Studio Code

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Abhaypatel001/ecotrack-waste-management.git
cd ecotrack-waste-management
```

### 2. Install backend dependencies

```powershell
cd server
npm ci
```

### 3. Configure backend environment variables

Create `server/.env` and fill in your own values:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=your_registered_admin_email
```

- `MONGO_URI` is your MongoDB connection string.
- `JWT_SECRET` should be a long, private random value.
- `GEMINI_API_KEY` is required for Gemini-powered features.
- `CLIENT_URL` should match the frontend origin allowed by the backend CORS configuration.
- `ADMIN_EMAIL` is used by the admin-role helper script if you choose to run it.
- Do not commit `.env` files or share their contents.

### 4. Start the backend

From the `server` folder, run:

```bash
npm run dev
```

If the development script is not available, check the scripts in `server/package.json`; the production start command is expected to be `npm start`.

The local backend is expected at `http://localhost:5000`.

### 5. Install frontend dependencies

Open a second terminal:

```powershell
cd client
npm ci
```

### 6. Configure the frontend API URL

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
```

The React app uses this value to build backend API URLs. Vite variables prefixed with `VITE_` are included in the browser bundle, so **never put API keys or secrets in this file**.

### 7. Start the frontend

From the `client` folder:

```bash
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## 👑 Assign an Admin Role

1. Register a normal EcoTrack account first.
2. Set `ADMIN_EMAIL` in `server/.env` to that account's registered email address.
3. From the `server` directory, run:

```bash
node scripts/makeAdmin.js
```

4. Sign out of EcoTrack, then sign in again so the refreshed token includes the current role.

Only grant admin access to accounts you control. Never hardcode passwords or API keys in scripts.

## 🔌 API Overview

The following routes are registered by the backend. Use the route source files for exact request bodies, validation rules, and role permissions.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend/database health check |
| `POST` | `/api/auth/register` | Register an account |
| `POST` | `/api/auth/login` | Log in |
| `GET` | `/api/pickups` | Get authorized pickup requests |
| `POST` | `/api/pickups` | Create a pickup request |
| `PATCH` | `/api/pickups/:id` | Update a pickup where permitted |
| `PATCH` | `/api/pickups/:id/status` | Update pickup status where permitted |
| `GET` | `/api/issues` | Get issue reports visible to the current account |
| `POST` | `/api/issues` | Submit an issue report (multipart image field: `photo`) |
| `PATCH` | `/api/issues/:id/status` | Update issue status (admin) |
| `DELETE` | `/api/issues/:id` | Delete an issue report (admin) |
| `GET` | `/api/admin/dashboard` | Admin dashboard data |
| `GET` | `/api/admin/users` | Admin user directory |
| `POST` | `/api/chatbot` | Send a message to EcoBot |

Additional `/api/admin-management` routes support schedules, collectors, categories, and administrative settings.

## ☁️ Deployment

### Frontend on Vercel

- **Repository:** `Abhaypatel001/ecotrack-waste-management`
- **Root directory:** `client`
- **Framework:** Vite
- **Install command:** `npm ci`
- **Build command:** `npm run build`
- **Output directory:** `dist`

Set the Vercel environment variable:

```env
VITE_API_URL=https://ecotrack-waste-management.onrender.com
```

The client-side route fallback should be configured in `client/vercel.json` to serve the SPA entry page for React Router paths. Redeploy after changing frontend variables or Vercel configuration.

### Backend on Render

- **Repository:** `Abhaypatel001/ecotrack-waste-management`
- **Root directory:** `server`
- **Build command:** `npm ci`
- **Start command:** `npm start`

Configure these in Render's Environment settings (do not commit them):

```text
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<your private random secret>
GEMINI_API_KEY=<your Gemini API key>
NODE_ENV=production
CLIENT_URL=https://ecotrack-waste-management-jet.vercel.app
```

Add `ADMIN_EMAIL` only if needed for the role helper script. Let Render assign the listening `PORT` in production.

### MongoDB Atlas

- Ensure the production backend can reach the cluster through Atlas network access settings.
- Use a dedicated database user with an appropriately scoped password.
- Keep connection strings private.

## 🧪 Testing Checklist

- [ ] The home page loads at the Vercel URL.
- [ ] Registration and login work in production.
- [ ] A user can submit and view a pickup request.
- [ ] A user can submit an issue report with location details.
- [ ] Garbage-image verification accepts a clear waste photo and rejects unrelated photos as expected.
- [ ] Admin can view reports and update their statuses.
- [ ] The updated status appears in the user's dashboard.
- [ ] EcoBot responds to general questions.
- [ ] Authenticated EcoBot status answers match the user's own database records.
- [ ] The health endpoint reports a connected database.
- [ ] Mobile camera and gallery upload work on the deployed site.

## 🔐 Security and Production Considerations

- Never commit `.env` files, database passwords, Gemini API keys, or JWT secrets.
- Keep secrets in Render's environment variable settings; only the non-secret API base URL belongs in `VITE_API_URL`.
- Keep protected API routes behind authentication and role authorization.
- Determine record ownership from the verified token, not from a user ID submitted by the browser.
- Validate uploaded file types and sizes on the server.
- AI-based image classification may be incorrect; do not treat it as perfect proof.
- A deployment's local filesystem may not be durable. The current `server/uploads` approach should not be relied on for permanent image storage across restarts/redeployments. Consider external object storage such as Cloudinary or a persistent disk before production use.
- Render free services may sleep when inactive, so the first request after inactivity can be delayed.
- Check service logs after deployment and verify the live end-to-end workflow.

## 🛠️ Troubleshooting

### Frontend cannot reach the backend

- Confirm `VITE_API_URL` in Vercel is exactly `https://ecotrack-waste-management.onrender.com` (without `/api` or a trailing slash).
- Confirm `CLIENT_URL` in Render matches the deployed Vercel origin exactly.
- Redeploy after changing environment variables.
- Inspect browser DevTools Console/Network and Render runtime logs for the actual response.

### MongoDB connection failure

- Check `MONGO_URI` in Render.
- Verify Atlas credentials and network access.
- Review Render runtime logs for connection errors.

### EcoBot is unavailable

- Confirm `GEMINI_API_KEY` is set in Render.
- Review backend logs for Gemini/API errors.
- Confirm the configured model is available for your API key.

### Mobile image upload problems

- Test both the gallery picker and camera picker on the live site.
- Ensure the selected image is in an accepted format and under the configured size limit after any client-side processing.
- If the browser shows a low-memory message or a Vercel 404 after returning from the camera, inspect the current deployed `ReportIssue.jsx`, SPA rewrite configuration, and mobile browser logs.

## 🎯 Project Goal

EcoTrack brings community issue reporting, waste collection workflows, administrative oversight, and AI-assisted guidance into one platform to support cleaner neighbourhoods and more accountable waste management.

## 👨‍💻 Author

**Abhay Patel**

- GitHub: [@Abhaypatel001](https://github.com/Abhaypatel001)
- Repository: [EcoTrack Waste Management](https://github.com/Abhaypatel001/ecotrack-waste-management)

---

Made with 💚 for cleaner cities and a greener future.
