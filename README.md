
# 🌿 EcoTrack — Smart Waste Management System

**Cleaner Cities. Smarter Waste Management.**

EcoTrack is a full-stack MERN waste management platform designed to make waste collection, garbage reporting, and cleanliness management smarter and more accessible.

The platform allows users to report garbage issues with location details, track complaint status, manage pickup requests, and get waste-management guidance from EcoBot, an AI-powered chatbot. Administrators can manage reports, collection requests, schedules, collectors, and other operational data through a centralized dashboard.

## 🌐 Live Demo

| Component | Link |
|---|---|
| Live Website | https://ecotrack-waste-management-jet.vercel.app |
| Backend API | https://ecotrack-waste-management.onrender.com |
| Backend Health Check | https://ecotrack-waste-management.onrender.com/api/health |
| GitHub Repository | https://github.com/Abhaypatel001/ecotrack-waste-management |

> Note: The live website and backend are deployed services. Some features may require valid login credentials and properly configured production environment variables.

## ✨ Features

### 👤 User Features

- User registration and login.
- User dashboard with pickup and complaint information.
- Garbage collection pickup requests.
- Garbage issue reporting with category, description, address, and map coordinates.
- Optional photo upload for issue reports.
- AI-based image verification to help reject unrelated photos.
- Track complaint status: Pending, In Progress, and Resolved.
- View personal issue reports and pickup information.
- Responsive interface for desktop and mobile screens.

### 🛡️ Admin Features

- Admin dashboard with operational statistics.
- View registered users.
- View and manage pickup requests.
- Update pickup status and record collected waste weight.
- View and manage garbage complaints.
- Update complaint status.
- Manage collection schedules.
- Manage waste collectors.
- Manage waste categories.
- View reports and analytics.
- Configure administrative settings.

### 🤖 EcoBot AI Chatbot

- Interactive floating chatbot available across the website.
- Answers general questions about waste management, recycling, and segregation.
- Supports Hindi, Hinglish, and English.
- Provides guidance for reporting garbage and using the EcoTrack platform.
- Can answer personal pickup or complaint questions using authenticated user records when the backend integration is configured correctly.
- Uses Google's Gemini API through the backend.

### ♻️ AI Garbage Image Verification

- Checks uploaded photos for visible garbage or discarded waste.
- Helps reject unrelated images such as selfies, pets, and scenery.
- Uses server-side AI verification before saving an issue report with a photo.
- Rejects uncertain classifications according to the configured confidence threshold.

> AI classification is not perfect. Rejected images can be reviewed and the detection threshold can be adjusted as needed.

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| MongoDB Atlas | Cloud database |
| Express.js | Backend API framework |
| React | Frontend user interface |
| Node.js | JavaScript runtime |
| Vite | Frontend development and build tool |
| Tailwind CSS | UI styling |
| React Router | Client-side routing |
| Lucide React | Icons |
| JWT | Authentication |
| bcrypt | Password hashing |
| Multer | Image upload handling |
| Gemini API | AI chatbot and image verification |
| Render | Backend deployment |
| Vercel | Frontend deployment |
| Git and GitHub | Version control and source code hosting |

## 🏗️ Project Architecture

```text
EcoTrack
│
├── client/                     # React frontend
│   ├── public/                 # Public assets
│   └── src/
│       ├── api/                # API client
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
│
├── server/                     # Express backend
│   ├── middleware/             # Authentication and related middleware
│   ├── models/                 # Mongoose data models
│   ├── routes/                 # API routes
│   ├── scripts/                # Utility scripts
│   ├── uploads/                # Local uploaded images
│   ├── index.js                # Backend entry point
│   └── package.json
│
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Prerequisites

Before running EcoTrack locally, install:

- Node.js and npm.
- Git.
- A MongoDB Atlas database or another supported MongoDB connection.
- A Gemini API key for chatbot and AI image verification features.
- A code editor such as Visual Studio Code.

## 🚀 Run the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Abhaypatel001/ecotrack-waste-management.git
cd ecotrack-waste-management
```

### 2. Install backend dependencies

Open a terminal in the project root and run:

```bash
cd server
npm ci
```

### 3. Configure backend environment variables

Create a file named `.env` inside the `server` directory.

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
GEMINI_API_KEY=your_gemini_api_key

CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=your_registered_admin_email
```

Replace the example values with your actual credentials.

**Never publish your `.env` file or share your database password, API keys, or JWT secret.**

### 4. Start the backend

From the `server` directory, run:

```bash
npm run dev
```

The backend should start at:

```text
http://localhost:5000
```

If the development script is unavailable, check the scripts defined in `server/package.json`.

### 5. Install frontend dependencies

Open a second terminal:

```bash
cd client
npm ci
```

### 6. Configure the frontend API URL

Create `client/.env` with:

```env
VITE_API_URL=http://localhost:5000
```

The frontend API client must read this variable for its requests to use the configured backend URL.

### 7. Start the frontend

From the `client` directory, run:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## 🔐 Create an Admin Account

1. Register an account through EcoTrack.
2. Add the registered email to `ADMIN_EMAIL` in `server/.env`.
3. From the server directory, run:

```bash
node scripts/makeAdmin.js
```

4. Log out of EcoTrack.
5. Log back in so the refreshed authentication token reflects the admin role.

Only grant administrator privileges to accounts you control.

## 🔌 Main API Endpoints

The backend provides APIs for authentication, pickups, issue reports, administration, and the chatbot.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend and database health |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/pickups` | Fetch pickup requests |
| POST | `/api/pickups` | Create a pickup request |
| PATCH | `/api/pickups/:id` | Update a pickup request where authorized |
| PATCH | `/api/pickups/:id/status` | Update pickup status where authorized |
| GET | `/api/issues` | Fetch authorized issue reports |
| POST | `/api/issues` | Submit a garbage issue report |
| PATCH | `/api/issues/:id/status` | Update issue status where authorized |
| DELETE | `/api/issues/:id` | Delete an issue report where authorized |
| GET | `/api/admin/dashboard` | Fetch admin dashboard data |
| GET | `/api/admin/users` | Fetch user directory data for administrators |
| POST | `/api/chatbot` | Send a message to EcoBot |

Additional admin-management routes support schedules, collectors, categories, and settings.

> Access to protected endpoints depends on authentication and role permissions. Check the corresponding route files for request fields, validation, and authorization rules.

## ☁️ Deployment

### Frontend — Vercel

| Setting | Value |
|---|---|
| GitHub Repository | `Abhaypatel001/ecotrack-waste-management` |
| Root Directory | `client` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment Variable | `VITE_API_URL` |

Set the production frontend variable to:

```env
VITE_API_URL=https://ecotrack-waste-management.onrender.com
```

Redeploy the frontend after changing its environment variables.

### Backend — Render

| Setting | Value |
|---|---|
| GitHub Repository | `Abhaypatel001/ecotrack-waste-management` |
| Root Directory | `server` |
| Build Command | `npm ci` |
| Start Command | `npm start` |

Configure these environment variables in the Render dashboard:

```text
MONGO_URI
JWT_SECRET
GEMINI_API_KEY
NODE_ENV=production
CLIENT_URL=https://ecotrack-waste-management-jet.vercel.app
```

Add `ADMIN_EMAIL` only if it is needed for the admin creation script.

Keep secrets in Render's environment-variable settings, never in committed source code. The backend must allow requests from the deployed frontend origin.

### Database — MongoDB Atlas

- Configure the database connection string in `MONGO_URI`.
- Ensure the database user has the required permissions.
- Configure Atlas network access for the deployed backend.
- Keep database credentials private.

## 🧪 Testing Checklist

- [ ] Home page loads.
- [ ] User registration and login work.
- [ ] User dashboard loads after login.
- [ ] Pickup requests can be created and viewed.
- [ ] Issue reports can be submitted.
- [ ] Garbage image verification rejects unrelated photos.
- [ ] Admin can view issue reports.
- [ ] Admin can update complaint status.
- [ ] Updated complaint status appears in the user dashboard.
- [ ] EcoBot responds to general questions.
- [ ] EcoBot uses the authenticated user's records when available.
- [ ] Frontend can communicate with the deployed backend.
- [ ] Health check reports a connected database.

## 🔒 Security and Production Notes

- Do not commit `.env` files, API keys, database credentials, or JWT secrets.
- Use strong, private secrets in production.
- Keep protected endpoints behind authentication and role checks.
- Do not trust user IDs supplied by the frontend for ownership decisions.
- Keep image file size and allowed MIME types restricted.
- Apply appropriate request limits to public APIs.
- Review AI classification results before relying on them for important decisions.
- Render's temporary filesystem is not guaranteed to preserve uploaded photos across restarts or redeployments. Use persistent or external object storage for durable production image storage.
- Review logs and monitor API failures after deployment.

## 🛠️ Troubleshooting

### Frontend cannot connect to the backend

- Verify `VITE_API_URL` in Vercel.
- Make sure the value has no trailing slash.
- Check the Render service status and runtime logs.
- Confirm that `CLIENT_URL` matches the deployed frontend origin.
- Redeploy after changing environment variables.

### MongoDB connection fails

- Verify `MONGO_URI` in Render.
- Check database credentials and MongoDB Atlas network access.
- Review the backend logs for the connection error.

### EcoBot is unavailable

- Verify `GEMINI_API_KEY` in Render.
- Check the backend runtime logs for API errors.
- Confirm that the configured Gemini model is available to the API key.

### AI image verification fails

- Confirm that an API key is configured.
- Check backend logs and Gemini API availability.
- Retry with a clear, well-lit photo showing visible discarded waste.

## 🎯 Project Objective

EcoTrack aims to make waste-management services more accessible and accountable by bringing garbage reporting, collection management, user dashboards, and AI-assisted guidance into one platform.

## 👨‍💻 Author

**Abhay Patel**

GitHub: [@Abhaypatel001](https://github.com/Abhaypatel001)

---

Made with 💚 for cleaner cities and a greener future.
