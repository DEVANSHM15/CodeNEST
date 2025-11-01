# CodeNEST - Full Stack Application

A full-stack web application for tracking coding projects with user authentication and CRUD operations.

## 🚀 Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Lucide React Icons

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs

## 📁 Project Structure
```
project-tracker-fullstack/
├── backend/          # Node.js + Express API
│   ├── server.js
│   └── package.json
├── frontend/         # React Application
│   ├── src/
│   └── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
node server.js
```

Backend runs on: `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

Frontend runs on: `http://localhost:3000`

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## ✨ Features

- ✅ User Authentication (Register/Login)
- ✅ JWT Token-based Authorization
- ✅ Create, Read, Update, Delete Projects
- ✅ Modern Glassmorphism UI Design
- ✅ Responsive Design
- ✅ MongoDB Database Integration
- ✅ RESTful API Architecture

## 🎨 Screenshots

[Add screenshots here]

## 👨‍💻 Author

Your Name - [Your GitHub Profile]

## 📄 License

This project is open source and available under the MIT License.
```

### **Step 4: Create Root `.gitignore`**
```
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local

# Build
/frontend/build
/backend/build

# Logs
*.log

# OS
.DS_Store
Thumbs.db