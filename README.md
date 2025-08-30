Live Link : https://social-postgres.onrender.com

# JWT Social App

JWT Social is a social media application built with **Node.js**, **Express**, and **PostgreSQL**.  
It provides features such as **user authentication, posts, comments, user connections, and personalized feeds**.

---

## 🚀 Features

- **User Authentication**  
  Register, login, logout, and verify accounts using JWT and OTP.

- **Posts**  
  Create, update, delete, and like posts.

- **Comments**  
  Add, update, delete, and like comments on posts.

- **User Connections**  
  Follow/unfollow users and manage connection requests.

- **Personalized Feed**  
  View posts from users you follow.

- **Email Notifications**  
  Send welcome emails and OTPs for account verification and password reset.

---

## 📂 Project Structure

```
JWT_social/
├── client/               # Frontend (not included in this repository)
├── server/               # Backend
│   ├── config/           # Configuration files (PostgreSQL, Nodemailer, etc.)
│   ├── controllers/      # API controllers
│   ├── middleware/       # Middleware (e.g., authentication)
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts (e.g., database setup)
│   ├── src/              # Source files
│   ├── .env              # Environment variables
│   ├── package.json      # Node.js dependencies and scripts
│   └── server.js         # Main server file
├── render.yaml           # Render deployment configuration
└── .gitignore            # Ignored files and directories
```


🔑 Environment Variables

Create a .env file in the server/ directory with the following variables:

DB_USER=<your-database-username>
DB_HOST=<your-database-host>
DB_NAME=<your-database-name>
DB_PASSWORD=<your-database-password>
DB_PORT=5432
JWT_SECRET=<your-jwt-secret>
SMTP_USER=<your-smtp-username>
SMTP_PASS=<your-smtp-password>
SENDER_EMAIL=<your-sender-email>
CLIENT_URL=<your-frontend-url>



🚀 Deployment

This project is configured for deployment on Render.
The deployment configuration is defined in the render.yaml file.

Build Command: npm install

Start Command: npm start

Health Check Path: /health

📡 API Endpoints
🔐 Authentication

POST /api/auth/register → Register a new user

POST /api/auth/login → Login a user

POST /api/auth/logout → Logout a user

POST /api/auth/send-verify-otp → Send account verification OTP

POST /api/auth/verify-account → Verify account with OTP

POST /api/auth/send-reset-otp → Send password reset OTP

POST /api/auth/reset-password → Reset password

👤 User

GET /api/user/data → Get user data

GET /api/user/profile → Get user profile

PUT /api/user/profile → Update user profile

GET /api/user/search → Search users

📝 Posts

POST /api/posts/create → Create a post

GET /api/posts → Get all posts

GET /api/posts/:postId → Get a single post

PUT /api/posts/:postId/like → Like/unlike a post

DELETE /api/posts/:postId → Delete a post

💬 Comments

POST /api/comments/:postId → Add a comment

GET /api/comments/:postId → Get comments for a post

PUT /api/comments/:commentId → Update a comment

DELETE /api/comments/:commentId → Delete a comment

🔗 Connections

POST /api/connections/send-request → Send a connection request

PUT /api/connections/accept/:connectionId → Accept a connection request

DELETE /api/connections/reject/:connectionId → Reject a connection request

GET /api/connections/pending → Get pending connection requests

GET /api/connections/accepted → Get accepted connections

📰 Feed

GET /api/feed/personalized → Get personalized feed

GET /api/feed/user/:userId → Get a user's feed

POST /api/feed/refresh → Refresh feed
