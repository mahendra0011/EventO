# 🎫 Evento - Full Stack MERN Event Booking Platform

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.6.3-green.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.6-38bdf8.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A production-ready event management and ticket booking system built with the MERN stack. Features include OTP verification, secure authentication, admin dashboard, and booking approval workflow.

![Evento Banner](https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200)

## ✨ Features

### 👤 User Features
- 🔍 Browse and search events by category, title, or venue
- 🎟️ Book tickets with secure OTP email verification
- 📊 Personal dashboard to track booking status
- 👤 Profile management
- 🔔 Real-time booking status updates

### 👨‍💼 Admin Features
- 📈 Analytics dashboard with revenue and booking statistics
- ✅ Confirm or reject booking requests
- 🎨 Create, update, and delete events
- 👥 User management
- 📊 Event-specific analytics

### 🔒 Security Features
- 🔐 JWT-based authentication
- 📧 Email OTP verification for bookings
- 👥 Role-based access control (User/Admin)
- 🔑 Password hashing with bcrypt
- 🛡️ Protected routes and API endpoints

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/evento.git
cd evento

# Install backend dependencies
cd backend
npm install

# Configure environment variables
# Create .env file with:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/evento
# JWT_SECRET=your_jwt_secret_key
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password

# Start backend server
npm run dev

# In a new terminal, install frontend dependencies
cd ../frontend
npm install

# Start frontend server
npm start
```

## 📁 Project Structure

```
evento/
├── backend/
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── utils/              # Utility functions
│   ├── server.js           # Express server
│   └── seed.js             # Database seeder
│
├── frontend/
│   ├── public/             # Static files
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   └── utils/          # Utility functions
│   └── package.json
│
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **express-validator** - Input validation

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS
- **Axios** - HTTP client
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications

## 📊 API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register user | Public |
| POST | /api/auth/login | Login user | Public |
| GET | /api/auth/me | Get current user | Private |
| PUT | /api/auth/profile | Update profile | Private |

### Events
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/events | Get all events | Public |
| GET | /api/events/featured | Get featured events | Public |
| GET | /api/events/:id | Get single event | Public |
| POST | /api/events | Create event | Admin |
| PUT | /api/events/:id | Update event | Admin |
| DELETE | /api/events/:id | Delete event | Admin |

### Bookings
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/bookings | Create booking | Private |
| POST | /api/bookings/verify-otp | Verify OTP | Private |
| POST | /api/bookings/resend-otp | Resend OTP | Private |
| GET | /api/bookings/user | Get user bookings | Private |
| GET | /api/bookings/:id | Get single booking | Private |
| PUT | /api/bookings/:id/cancel | Cancel booking | Private |
| GET | /api/bookings/all | Get all bookings | Admin |
| PUT | /api/bookings/:id/confirm | Confirm booking | Admin |
| PUT | /api/bookings/:id/reject | Reject booking | Admin |

### Admin
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/admin/dashboard | Get dashboard stats | Admin |
| GET | /api/admin/users | Get all users | Admin |
| PUT | /api/admin/users/:id/role | Update user role | Admin |
| GET | /api/admin/events/:id/analytics | Get event analytics | Admin |

## 🔄 Booking Workflow

```mermaid
graph TD
    A[User Browses Events] --> B[Select Event]
    B --> C[Request Booking]
    C --> D[System Sends OTP]
    D --> E[User Verifies OTP]
    E --> F[Admin Reviews Booking]
    F --> G{Admin Decision}
    G -->|Confirm| H[Booking Confirmed]
    G -->|Reject| I[Booking Rejected]
    H --> J[User Receives Confirmation]
    I --> K[User Notified]
```

## 📸 Screenshots

### Homepage
![Homepage](https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800)

### Event Detail
![Event Detail](https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800)

### Admin Dashboard
![Admin Dashboard](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Evento Team**
- GitHub: [@https://github.com/mahendra0011)

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icons

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

<div align="center">
  <p>Made with ❤️ by Evento Team</p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
"# EventBooking" 
