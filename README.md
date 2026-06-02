# Evento

Evento is a full-stack event booking platform built with React, Express, MongoDB, and Tailwind CSS. It supports public event discovery, ticket booking with OTP verification, host dashboards, attendee messaging, support tickets, admin controls, reports, and deployment-ready configuration for Render.

## Highlights

- Public event browsing with search, categories, featured events, trending flags, and wishlists.
- User authentication with JWT, bcrypt password hashing, email OTP verification, Google sign-in, login notifications, and password reset OTPs.
- Host accounts with a dedicated dashboard for events, bookings, attendee communication, broadcasts, analytics, and community chat.
- BookMyShow-style organizer workflow with business/GST/PAN/bank registration, event planning fields, review approval, multi-category tickets, event-day operation notes, and settlement tracking.
- Ticket booking flow with email OTP verification before confirmation, QR ticket validation, cancellation, and refund tracking.
- User dashboard for bookings, upcoming events, notifications, broadcasts, wishlist, payments, reviews, profile, and support.
- Admin console for users, events, bookings, refunds, disputes, categories, locations, notifications, reviews, support tickets, fraud signals, security logs, analytics, and CSV exports.
- Email delivery through Brevo with diagnostics endpoints.
- Production deployment support through `render.yaml`.

## Tech Stack

### Frontend

- React 18
- React Router
- Tailwind CSS
- Framer Motion
- Axios
- Lucide React
- React Hot Toast
- QR code ticket components

### Backend

- Node.js 22
- Express 4
- MongoDB with Mongoose
- JSON Web Tokens
- bcryptjs
- Nodemailer and Brevo email API
- CSV exports for admin reports

## Project Structure

```text
.
|-- backend/
|   |-- controllers/      API request handlers
|   |-- middleware/       Auth and role guards
|   |-- models/           Mongoose schemas
|   |-- routes/           Express routers
|   |-- utils/            Email, seed, and activity helpers
|   |-- server.js         Express app and MongoDB bootstrap
|   `-- package.json
|-- frontend/
|   |-- public/           Static assets and redirects
|   |-- src/
|   |   |-- components/   Shared UI and chat components
|   |   |-- context/      Auth provider
|   |   |-- pages/        Route screens
|   |   `-- utils/        API client helpers
|   `-- package.json
|-- render.yaml           Render backend deployment config
`-- package.json          Workspace metadata
```

## Prerequisites

- Node.js 22 recommended
- npm
- MongoDB, either local or Atlas
- Brevo account for production email delivery

## Environment Variables

Create `backend/.env` for local development:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/evento
MONGODB_DB_NAME=evento
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=

BREVO_API_KEY=
FROM_EMAIL=
FROM_NAME=Evento
REPLY_TO_EMAIL=
EMAIL_DIAGNOSTIC_TO=

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
ADMIN_NAME=Evento Admin
ADMIN_RESET_PASSWORD=false

PLATFORM_FEE_RATE=0.1
```

## Database Migration

To copy the existing Atlas `test` database into a new `evento` database, run this from `backend/` with the Atlas connection string set in `MONGODB_URI`:

```powershell
npm run migrate:db -- --from test --to evento --drop-target
```

MongoDB creates the `evento` database when the script writes the copied collections. The script refuses to run against `localhost` unless `--allow-local` is passed.

Frontend variables are optional because React uses the development proxy in `frontend/package.json`:

```env
REACT_APP_API_URL=
REACT_APP_API_TIMEOUT_MS=20000
REACT_APP_GOOGLE_CLIENT_ID=
```

Set `REACT_APP_API_URL` only when the frontend should call a separate API origin.
Set both Google client ID variables to the same OAuth web client ID to enable Google login.

For Google login, create an OAuth 2.0 web client in Google Cloud Console and add these authorized JavaScript origins as needed:

- `http://localhost:3000`
- Your deployed frontend origin, for example `https://enento.onrender.com`

## Docker

Build one production image for the API and React app:

```bash
docker build -t evento \
  --build-arg REACT_APP_API_URL=/api \
  --build-arg REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id \
  .
```

Run it with production environment variables:

```bash
docker run --rm -p 5000:5000 \
  -e NODE_ENV=production \
  -e PORT=5000 \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-jwt-secret \
  -e BREVO_API_KEY=your-brevo-api-key \
  -e FROM_EMAIL=your-sender-email \
  -e GOOGLE_CLIENT_ID=your-google-client-id \
  evento
```

Open `http://localhost:5000` for the app and `http://localhost:5000/api/health` for the API health check.

## Local Setup

Install dependencies:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

Start MongoDB, then run the backend:

```bash
cd backend
npm run dev
```

Seed demo data:

```bash
npm run seed
```

The seed creates demo users, hosts, categories, locations, events, bookings, reviews, messages, notifications, support tickets, and activity logs. It is idempotent for its own sample records.

In another terminal, run the frontend:

```bash
cd frontend
npm start
```

Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:5000/api/health`
- Email diagnostics: `http://localhost:5000/api/health/email`

## Organizer Workflow

1. Hosts register with organizer business, tax, contact, and bank details.
2. Hosts create events with event type, venue/date/time, budget, permissions, terms, on-ground operations notes, and ticket categories such as VIP, General, or Early Bird.
3. New events are submitted as `pending` and hidden from public ticket sales.
4. Admins review event details and approve/reject from the admin event control panel.
5. Approved events become live and users can book available ticket categories.
6. Hosts track sales, capacity, attendees, broadcasts, and event-day QR check-ins from the host dashboard.
7. Admin reports and settlement status track gross revenue, platform fees, and organizer payouts.

## Available Scripts

Backend:

```bash
npm run dev
npm run dev:local
npm run seed
npm start
```

Frontend:

```bash
npm start
npm run build
npm test
```

## Core Workflows

### User Booking

1. User browses public events.
2. User starts a booking.
3. Backend creates a pending booking and sends a booking OTP by email.
4. User verifies the OTP.
5. Booking is confirmed, tickets are reduced, notifications are created, and a confirmation email is sent.
6. User can view the e-ticket and QR code in the dashboard.

### Cancellation and Refunds

1. Users can cancel eligible pending or confirmed bookings from the dashboard or ticket confirmation page.
2. The backend evaluates the event timing and refund policy before allowing cancellation.
3. Cancelled confirmed bookings return ticket inventory to the event.
4. Paid bookings can start a refund request with payout details, refund amount, policy result, and timeline tracking.
5. Admins can approve, reject, process, or mark refunds from the admin booking controls.

### Host Management

1. Host registers with email, password, and phone.
2. Host verifies email OTP before using protected host routes.
3. Host creates and manages events.
4. Host views bookings, analytics, attendees, notifications, messages, broadcasts, and community chat.

### Admin Operations

Admins can:

- Manage users, roles, blocked status, and verification status.
- Manage events, moderation flags, featured/trending status, reminders, categories, and locations.
- Review bookings, payment status, refunds, disputes, and confirmation emails.
- Send notifications to users or roles.
- Manage support tickets and reviews.
- Review fraud signals and security activity.
- Export CSV reports for users, events, bookings, revenue, ticket sales, support, and fraud signals.

## API Overview

All backend routes are mounted under `/api`.

### Auth

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register a user |
| POST | `/auth/host-register` | Public | Register a host |
| POST | `/auth/login` | Public | User/admin login |
| POST | `/auth/host-login` | Public | Host login |
| POST | `/auth/verify-email` | Public | Verify email OTP |
| POST | `/auth/resend-verification` | Public | Resend email OTP |
| POST | `/auth/forgot-password` | Public | Send password reset OTP |
| POST | `/auth/reset-password` | Public | Reset password with OTP |
| GET | `/auth/me` | Private | Current user profile |
| PUT | `/auth/profile` | Private | Update profile |

### Events

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/events` | Public | List events |
| GET | `/events/featured` | Public | Featured events |
| GET | `/events/categories` | Public | Active category names |
| GET | `/events/:id` | Public | Event details |
| GET | `/events/organizer` | Host | Host events |
| POST | `/events` | Host | Create event |
| PUT | `/events/:id` | Host | Update owned event |
| DELETE | `/events/:id` | Host | Delete owned event |

### Bookings

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| POST | `/bookings` | Private | Start booking and send OTP |
| POST | `/bookings/verify-otp` | Private | Confirm booking with OTP |
| POST | `/bookings/resend-otp` | Private | Resend booking OTP |
| GET | `/bookings/user` | Private | User bookings |
| GET | `/bookings/all` | Host | Bookings for host events |
| GET | `/bookings/:id/refund-policy` | Private | Preview refund eligibility |
| GET | `/bookings/:id` | Private | Booking details |
| PUT | `/bookings/:id/cancel` | Private | Cancel eligible booking and start refund request when applicable |
| PUT | `/bookings/:id/confirm` | Host | Confirm OTP-verified booking |
| PUT | `/bookings/:id/reject` | Host | Reject booking |

### Admin

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/admin/dashboard` | Platform dashboard stats |
| GET | `/admin/users` | User management |
| PUT | `/admin/users/:id` | Update user |
| GET | `/admin/events` | Event management |
| PUT | `/admin/events/:id` | Update event moderation and metadata |
| GET | `/admin/bookings` | Booking management |
| PUT | `/admin/bookings/:id` | Update booking/payment/refund/dispute state |
| PUT | `/admin/bookings/:id/refund` | Mark booking refunded |
| POST | `/admin/bookings/:id/confirmation` | Resend booking confirmation email |
| GET | `/admin/payments` | Payment summary |
| GET | `/admin/fraud` | Fraud and moderation signals |
| GET | `/admin/reports/:type` | CSV exports |

## Deployment

The included `render.yaml` deploys the backend from `backend/`.

Required production variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `BREVO_API_KEY`
- `FROM_EMAIL`
- `GOOGLE_CLIENT_ID` for Google login

Recommended production variables:

- `FRONTEND_URL`
- `REACT_APP_GOOGLE_CLIENT_ID` on the frontend/static site
- `REPLY_TO_EMAIL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

Build the frontend separately with:

```bash
cd frontend
npm run build
```

In production mode, the backend can serve `frontend/build` if both projects are deployed together.

## Security Notes

- Change seeded admin credentials in every deployed environment.
- Use a strong `JWT_SECRET`.
- Keep Brevo sender email verified.
- Do not commit `.env` files.
- Configure CORS with the real frontend URL in production.
- Use HTTPS for deployed frontend and backend URLs.

## Troubleshooting

- `401 Token is not valid`: log in again or check `JWT_SECRET`.
- `403 Please verify your email via OTP`: complete email verification.
- Booking OTP email failed: check `BREVO_API_KEY`, `FROM_EMAIL`, and sender verification.
- MongoDB connection error: verify `MONGODB_URI`, network access, and database credentials.
- Frontend API calls fail locally: confirm the backend is running on port `5000`.

## License

No license file is currently included. Add one before publishing this project for reuse by others.
