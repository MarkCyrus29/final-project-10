# ✈ Airline Reservation System

A full-stack MERN web application where passengers search flights, book seats, and manage reservations, while admins manage flight schedules, monitor all bookings, and maintain user accounts.

> **Course:** Full-Stack MERN Web Application (Final Project)
> **Group:** 10 | **Section:** C3A
> **Members:** Mark Cyrus F. Serrano, Alejandro H. Umila

---

## Features

| Feature | Description |
|---|---|
| **User Authentication** | Register / login for passengers and admins; JWT sessions; protected routes |
| **Home and Quick Search** | Landing page with a quick search (from, to, date) and popular route shortcuts that open the flight list already filtered |
| **Flight Search** | Filter by origin, destination, and travel date (matched in the passenger's local time zone); departed flights are hidden |
| **Flight Booking** | Pick a flight, choose class (Economy 1x, Business 1.8x, First Class 2.5x of the base fare), add up to 9 passengers (name, date of birth, gender); live total price; unique booking reference (e.g. `BK-2026-A1B2`) |
| **Seat Inventory** | Seats are taken and released with atomic database updates, so simultaneous bookings and cancellations never oversell a flight |
| **Booking Management** | View booking history and details; cancel active reservations (seats return to the flight) |
| **Flight Management (Admin)** | Add, edit, delete flights (schedule, pricing, capacity, status) |
| **User Management (Admin)** | View all users; delete accounts |
| **System-wide Booking View (Admin)** | View all reservations; passenger manifest per flight |
| **Profile Management** | Update name, phone, nationality; change password |
| **Form Validation** | Frontend: React Hook Form + Yup. Backend: Mongoose schema constraints + express-validator |

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React (Vite), React Router, Axios, Tailwind CSS, React Hook Form + Yup |
| **Backend** | Node.js, Express.js, express-validator, cors, dotenv |
| **Database** | MongoDB (Atlas), Mongoose ODM |
| **Auth** | JSON Web Tokens (JWT), bcryptjs |
| **Deployment** | Vercel (frontend), Render (backend), MongoDB Atlas (database) |

---

## Folder Structure

```
airline-reservation/
├── backend/
│   ├── config/db.js              # MongoDB connection
│   ├── controllers/              # authController, flightController, bookingController, userController
│   ├── middleware/               # auth.js (protect, adminOnly, passengerOnly), error.js
│   ├── models/                   # User.js, Flight.js, Booking.js
│   ├── routes/                   # authRoutes, flightRoutes, bookingRoutes, userRoutes
│   ├── utils/                    # generateReference.js, generateToken.js, pricing.js, seats.js
│   ├── tests/                    # api.test.js (npm test)
│   ├── seedAdmin.js              # Seeds the admin account
│   ├── seedFlights.js            # Seeds sample flight data
│   ├── server.js                 # Express entry point
│   ├── .env.example              # Template for environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/axios.js          # Axios instance with JWT interceptor and expired session handling
│   │   ├── context/              # Auth, Theme, Toast, Confirm
│   │   ├── components/           # Navbar, FlightCard, layout/, ui/
│   │   ├── lib/                  # format.js, pricing.js
│   │   ├── pages/                # Home, Login, Register, Flights, FlightDetails, BookFlight,
│   │   │   │                     #   MyBookings, BookingDetails, Profile, NotFound
│   │   │   └── admin/            # AdminDashboard, ManageFlights, FlightForm,
│   │   │                         #   AllBookings, FlightManifest, ManageUsers
│   │   ├── routes/               # ProtectedRoute, AdminRoute, PassengerRoute
│   │   └── App.jsx
│   ├── vercel.json               # SPA rewrites for Vercel
│   └── package.json
│
├── docs/test-checklist.md        # Access table and manual test checklist
└── README.md
```

---

## Local Setup

### Prerequisites

- **Node.js** v18+ and npm
- A **MongoDB Atlas** cluster (or local MongoDB)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/final-project-10.git
cd final-project-10
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (use `.env.example` as a template):

```env
PORT=5000
MONGO_URI=mongodb+srv://<db_user>:<db_password>@<cluster-host>/airline?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_string
CLIENT_URL=http://localhost:5173
```

The server stops with a clear message if `MONGO_URI` or `JWT_SECRET` is missing, or if it cannot reach the database.

Seed the database:

```bash
npm run seed:admin       # Creates admin@airline.com / admin123 (see the note below)
npm run seed:flights     # Adds or refreshes 11 sample flights with future dates
```

`seed:flights` is safe to run again: it moves the sample flights to future dates and keeps seat counts in line with existing bookings.

> **Admin password:** without extra settings, `seed:admin` creates the public default login above, which is fine for local use only. Before seeding a deployed database, set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env` (they are documented in `.env.example`). The password is never printed.

Start the backend:

```bash
npm run dev              # Development (nodemon)
# or
npm start                # Production (node server.js)
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open **http://localhost:5173** in the browser.

### 4. Run the tests

```bash
cd backend
npm test
```

43 API tests start the app on a free port and run against the database in `backend/.env` (the admin account must exist). They create their own users and flights and delete them afterwards. See `docs/test-checklist.md` for the full manual checklist.

---

## Live URLs

| Service | URL |
|---|---|
| **Frontend** | `https://<your-vercel-app>.vercel.app` |
| **Backend API** | `https://<your-render-service>.onrender.com` |
| **Health Check** | `https://<your-render-service>.onrender.com/api/health` |

> Update these URLs after deployment.

---

## Test Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@airline.com` | `admin123` |
| **Passenger** | *(Register a new account on the site)* | *(Your choice, min 6 chars)* |

---

## API Endpoints Summary

### Auth: `/api/auth`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |

### Users: `/api/users`
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users` | Admin |
| GET | `/api/users/:id` | Auth (owner/admin) |
| PUT | `/api/users/:id` | Auth (owner/admin) |
| DELETE | `/api/users/:id` | Admin |

### Flights: `/api/flights`
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/flights` | Public |
| GET | `/api/flights/:id` | Public |
| POST | `/api/flights` | Admin |
| PUT | `/api/flights/:id` | Admin |
| DELETE | `/api/flights/:id` | Admin |

### Bookings: `/api/bookings`
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/bookings` | Passenger |
| GET | `/api/bookings` | Auth (admin=all, passenger=own) |
| GET | `/api/bookings/:id` | Auth (owner/admin) |
| PUT | `/api/bookings/:id` | Admin |
| DELETE | `/api/bookings/:id` | Passenger (owner) |

---

## Team Contributions

| Phase | Description | Owner |
|---|---|---|
| 1 | Dependency check + Authentication (backend + frontend) | Mark Cyrus Serrano (Member A) |
| 2 | Flights (backend + frontend, incl. admin flight CRUD) | Alejandro Umila (Member B) |
| 3 | Bookings (backend + passenger booking pages) | Mark Cyrus Serrano (Member A) |
| 4 | Profile + Admin user management | Alejandro Umila (Member B) |
| 5 | Admin dashboard (all bookings, passenger manifest) | Mark Cyrus Serrano (Member A) |
| 6 | Validation check + final testing | Alejandro Umila (Member B) |
| 7 | Deployment + README | Mark Cyrus Serrano (Member A) |

---

## License

This project was created as a school requirement and is not licensed for commercial use.
