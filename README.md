# 🖨️ PrintEase  

**PrintEase** is a **Fullstack Project using Vite + React, Node.js, Express, and PostgreSQL (Supabase)**.  
It is a smart **College Xerox Shop Management System** designed to reduce waiting time and streamline the printing process. Students can upload documents, book slots, and track their requests, while the admin manages everything from a centralized dashboard.  

---

## 📛 Tech Badges  

![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff&style=for-the-badge)  
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000&style=for-the-badge)  
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwindcss&logoColor=fff&style=for-the-badge)  
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=fff&style=for-the-badge)  
![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=fff&style=for-the-badge)  
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff&style=for-the-badge)  
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=000&style=for-the-badge)  
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=000&style=for-the-badge)  
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=fff&style=for-the-badge)  
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=000&style=for-the-badge)  

---

## 🚀 Features  

### 🔹 Student Side
- 📂 Upload PDF documents for printing  
- ⚡ Quick OTP-based authentication  
- 🖨️ Choose print options (pages, copies, black & white / color)  
- 📊 Track order history  
- 📅 Book printing slots in advance  

### 🔹 Admin Side
- 📋 View and manage all print requests  
- 🗑️ Delete completed/invalid requests  
- 📬 Receive messages and feedback  
- 📊 Manage user data with filters & sorting  
- ⏰ Slot management for better queue handling  
- 📈 Dashboard for analytics  

### 🔹 Common Features
- 🔐 Secure login system with Firebase authentication  
- 🌐 Cloud-hosted backend (Node.js + Express + PostgreSQL)  
- ☁️ Database powered by Supabase (PostgreSQL)  
- 🎨 Responsive UI with React + TailwindCSS  
- ⚡ Optimized performance with Vercel & Render deployment  

---

## 🛠️ Tech Stack  

- **Frontend:** Vite + React, Tailwind CSS  
- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL (Supabase)  
- **Authentication:** Firebase  
- **Hosting:**  
  - Frontend → Vercel  
  - Backend → Render / Vercel  
- **Other Tools:** Nodemailer, CORS, dotenv  

---

## 📂 Project Structure  

```bash
PrintEase/
│── backend/                # Express server (APIs + DB connection)
│   ├── server.js           # Main backend entry point
│   ├── routes/             # API routes (admin, user, bookings, etc.)
│   ├── controllers/        # Business logic
│   ├── models/             # Database queries
│   ├── config/             # Database & environment configs
│   ├── package.json        # Backend dependencies
│
│── frontend/               # React + Vite (student & admin UI)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # All app pages (Dashboard, Admin, Login, etc.)
│   │   ├── utils/          # Helper functions
│   │   ├── App.jsx         # Main React entry
│   │   └── main.jsx        # Vite entry
│   ├── index.html          # Root HTML
│   ├── package.json        # Frontend dependencies
│
│── README.md               # Documentation
