# EVENTRA - World-Class Event Management Platform

![React](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-7.6.3-green.svg)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.6-38bdf8.svg)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.38-blue.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A world-class event management and ticket booking platform. Discover extraordinary events, book tickets securely with OTP verification, and host unforgettable experiences with our premium platform.

## Features

### User Features
- Browse and search events by category, title, or venue
- Book tickets with secure OTP email verification
- Personal dashboard to track booking status
- Profile management
- Real-time booking status updates
- Real-time community chat for event attendees
- Direct messaging with event hosts
- Reply to messages with threaded conversations
- Edit and delete your own messages
- React to messages with emojis
- Seen/read receipts and typing indicators

### Host Features
- Analytics dashboard with revenue and booking statistics
- Confirm or reject booking requests
- Create, update, and delete events
- Broadcast messages to all users who booked an event
- Individual messaging with users
- Community chat for event attendees
- Event-specific analytics
- View event attendees

### Security Features
- JWT-based authentication
- Email OTP verification for bookings
- Role-based access control (User/Host)
- Password hashing with bcrypt
- Protected routes and API endpoints


## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

# Clone the repository
git clone https://github.com/mahendra0011/EventO.git
cd EventO

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

## Project Structure

EventO/
├── backend/
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/        # Custom middleware
│   ├── utils/             # Utility functions
│   ├── server.js          # Express server
│   └── seed.js           # Database seeder
│
├── frontend/
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── utils/      # Utility functions
│   └── package.json
│
└── README.md

## Tech Stack

### Backend
- Node.js - JavaScript runtime
- Express.js - Web framework
- MongoDB - NoSQL database
- Mongoose - MongoDB ODM
- JWT - Authentication
- bcryptjs - Password hashing
- Nodemailer - Email service
- express-validator - Input validation

### Frontend
- React.js - UI library
- React Router - Client-side routing
- Tailwind CSS - Utility-first CSS
- Axios - HTTP client
- Lucide React - Icon library
- React Hot Toast - Toast notifications

## API Endpoints

### Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register user | Public |
| POST | /api/auth/login | Login user | Public |
| POST | /api/auth/host-keyword-login | Host login | Public |
| POST | /api/auth/host-keyword-register | Host register | Public |
| GET | /api/auth/me | Get current user | Private |
| PUT | /api/auth/profile | Update profile | Private |

### Events
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/events | Get all events | Public |
| GET | /api/events/featured | Get featured events | Public |
| GET | /api/events/:id | Get single event | Public |
| POST | /api/events | Create event | Host |
| PUT | /api/events/:id | Update event | Host |
| DELETE | /api/events/:id | Delete event | Host |

### Bookings
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/bookings | Create booking | Private |
| POST | /api/bookings/verify-otp | Verify OTP | Private |
| POST | /api/bookings/resend-otp | Resend OTP | Private |
| GET | /api/bookings/user | Get user bookings | Private |
| GET | /api/bookings/:id | Get single booking | Private |
| PUT | /api/bookings/:id/cancel | Cancel booking | Private |
| GET | /api/bookings/all | Get all bookings | Host |
| PUT | /api/bookings/:id/confirm | Confirm booking | Host |
| PUT | /api/bookings/:id/reject | Reject booking | Host |

### Messages
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/messages | Send message | Private |
| GET | /api/messages/inbox | Get inbox | Private |
| GET | /api/messages/conversation/:userId | Get conversation | Private |
| POST | /api/messages/broadcast | Broadcast to event bookers | Host |
| GET | /api/host/events/:id/bookers | Get event bookers | Host |
| PUT | /api/messages/:id | Edit message | Private |
| DELETE | /api/messages/:id | Delete message | Private |
| POST | /api/messages/:id/react | Add/remove reaction | Private |
| GET | /api/messages/:id/reactions | Get reactions count | Private |
| POST | /api/messages/community | Post community message | Attendee/Host |
| GET | /api/messages/community/:eventId | Get community messages | Attendee/Host |

### Host Dashboard
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/host/dashboard | Get dashboard stats | Host |
| GET | /api/host/events/:id/analytics | Get event analytics | Host |

## Booking Workflow

User Browses Events → Select Event → Request Booking → System Sends OTP → User Verifies OTP → Admin Reviews Booking → Decision
                                                                              ↓
                                                     Confirmed ← Booking Confirmed
                                                     ↓
                                           User Receives Confirmation Email

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

EventO Team
- GitHub: @mahendra0011

## Acknowledgments

- React - Frontend framework
- Express - Backend framework
- MongoDB - Database
- Tailwind CSS - CSS framework
- Lucide - Icons
- Framer - Animations

## Support

If you have any questions or need help, please open an issue on GitHub.

---

Made with by EventO Team
