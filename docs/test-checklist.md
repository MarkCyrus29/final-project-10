# Phase 6: Access Audit and Final Test Checklist

Test admin: `admin@airline.com` / `admin123` (created by `npm run seed:admin`).
Sample flights: `npm run seed:flights`.

## 1. Access table (every API route)

Legend: Public = no token. Auth = any logged-in user. Owner/Admin = the account owner or an admin.
All rows match the endpoint tables in `context.md`.

| Method | Route | Middleware | Allowed | Anonymous | Wrong role |
|---|---|---|---|---|---|
| GET | `/api/health` | none | Public | 200 | n/a |
| POST | `/api/auth/register` | validator | Public | 201 / 400 | n/a |
| POST | `/api/auth/login` | validator | Public | 200 / 401 | n/a |
| GET | `/api/auth/me` | protect | Auth | 401 | n/a |
| GET | `/api/users` | protect, adminOnly | Admin | 401 | 403 |
| GET | `/api/users/:id` | protect, validator | Owner/Admin | 401 | 403 |
| PUT | `/api/users/:id` | protect, validator | Owner/Admin (password: owner only) | 401 | 403 |
| DELETE | `/api/users/:id` | protect, adminOnly | Admin (not self) | 401 | 403 |
| GET | `/api/flights` | none | Public | 200 | n/a |
| GET | `/api/flights/:id` | validator | Public | 200 / 404 | n/a |
| POST | `/api/flights` | protect, adminOnly, validator | Admin | 401 | 403 |
| PUT | `/api/flights/:id` | protect, adminOnly, validator | Admin | 401 | 403 |
| DELETE | `/api/flights/:id` | protect, adminOnly, validator | Admin | 401 | 403 |
| POST | `/api/bookings` | protect, passengerOnly, validator | Passenger | 401 | 403 (admin) |
| GET | `/api/bookings` | protect | Auth (admin: all, passenger: own) | 401 | n/a |
| GET | `/api/bookings/:id` | protect, validator | Owner/Admin | 401 | 403 |
| PUT | `/api/bookings/:id` | protect, adminOnly, validator | Admin | 401 | 403 |
| DELETE | `/api/bookings/:id` | protect, passengerOnly, validator | Passenger (owner) | 401 | 403 |

Frontend route guards:

| Route | Guard | Logged out | Passenger | Admin |
|---|---|---|---|---|
| `/flights`, `/flights/:id`, `/login`, `/register` | none | allowed | allowed | allowed |
| `/book/:id`, `/my-bookings` | PassengerRoute | to `/login` | allowed | to `/admin` |
| `/bookings/:id`, `/profile` | ProtectedRoute | to `/login` | allowed | allowed |
| `/admin`, `/admin/flights*`, `/admin/bookings`, `/admin/users` | AdminRoute | to `/login` | to `/flights` | allowed |

## 2. Validation summary

| Where | Backend (express-validator + Mongoose) | Frontend (Yup) |
|---|---|---|
| Register | names, email format, password min 6, phone format; User schema: required, unique, email match | same rules, names trimmed, phone format |
| Login | email format, password required | same |
| Flight add/edit | all fields, price > 0, seats >= 1, enums; schema: arrival after departure, available <= total, 3-letter code | same, plus airport code letters only |
| Booking | flight id, class enum, 1 to 9 passengers, names, date of birth valid and not in the future; schema: 1 to 9 passengers | names, date of birth required and not in the future |
| Profile | names not empty, phone format, new password min 6, current password verified | names, phone format |
| Change password | current password verified, new password min 6 | current required, new min 6, confirm must match |

## 3. Final test checklist

Passenger and admin steps use the running app (`npm run dev` in both folders).

### Authentication

| Feature | Steps | Expected |
|---|---|---|
| Register | Fill the form with valid data and submit | Goes to `/flights`, Navbar shows My Bookings and Profile |
| Register validation | Submit empty, then bad email, short password, bad phone | A clear error under each field, nothing is sent |
| Duplicate email | Register `admin@airline.com` | "Email is already registered" |
| Login | Log in as a passenger | Goes to `/flights` |
| Login admin | Log in as the admin | Goes to `/admin`, Navbar shows admin links |
| Wrong password | Log in with a wrong password | "Invalid email or password" |
| Stay logged in | Refresh the page | Still logged in |
| Logout | Click Logout | Navbar shows Login and Register |

### Passenger

| Feature | Steps | Expected |
|---|---|---|
| Search flights | Enter origin, destination or date, press Search | Only matching flights, "No flights found" when none |
| Flight details | Open a flight card | Details and a Book button |
| Book | Choose class, 2 passengers, fill names and dates of birth, submit | Reference code `BK-YYYY-XXXX` shown, price = base x class x passengers |
| Booking validation | Leave names empty, or pick a future date of birth | Yup errors, nothing is sent |
| Not enough seats | Book more passengers than available | Error message |
| My bookings | Open `/my-bookings` | Only your own bookings |
| Booking details | Open a booking | Passenger list and flight info |
| Cancel | Cancel a Confirmed booking | Status Cancelled, Cancel button disappears, seats go back to the flight |
| Cancel twice | Try to cancel it again by API | 400 message |
| Other user's booking | Open another user's booking id | 403, error page, no crash |
| Edit profile | Change name, phone, nationality, save | Success message, Navbar name updates, data survives a refresh |
| Profile validation | Empty first name, bad phone | Yup errors |
| Change password | Wrong current password, then correct one | Server error first, then success, new password logs in |
| Role tampering | Send `role: "admin"` in a profile update | Ignored |

### Admin

| Feature | Steps | Expected |
|---|---|---|
| Dashboard | Open `/admin` | Counts match flights, bookings and users |
| Add flight | Manage Flights, Add New Flight, valid data | Appears in the list |
| Flight validation | Empty form, code with digits, arrival before departure, price 0 | Yup errors |
| Duplicate flight number | Add an existing flight number | "Flight number already exists" |
| Edit flight | Change price and status | Saved, list updates |
| Cancel flight | Set status Cancelled | Hidden from passenger search, visible in admin list, cannot be booked |
| Delete flight | Delete a flight with no bookings | Removed after the confirm dialog |
| Delete flight with bookings | Delete a flight that has bookings | "This flight has bookings" message, flight stays |
| All bookings | Open `/admin/bookings` | Every booking with passenger and route |
| Update status | Set a Confirmed booking to Completed, refresh | Still Completed |
| Cancelled is final | Open the dropdown on a Cancelled booking | Disabled (API returns 400 if forced) |
| Manifest | Open a flight's Manifest | Every passenger with booking reference and status |
| Manage users | Open `/admin/users` | All users, no Delete button on your own row |
| Delete user | Delete a user who has bookings | Confirm dialog, user and bookings removed, Confirmed seats released |
| Delete self | Call DELETE on your own id by API | 400 "You cannot delete your own account" |

### Access blocking

| Feature | Steps | Expected |
|---|---|---|
| Passenger on admin URLs | Open `/admin`, `/admin/flights`, `/admin/bookings`, `/admin/users` and the other admin URLs | Redirected to `/flights` |
| Admin on passenger URLs | Open `/book/:id` and `/my-bookings` | Redirected to `/admin` |
| Logged out on protected URLs | Open `/profile`, `/my-bookings`, `/admin` | Redirected to `/login` |
| Admin booking by API | POST `/api/bookings` as admin | 403 |
| Passenger admin APIs | Call admin routes with a passenger token | 403 |
| No token | Call protected routes without a token | 401 |

### Errors and empty states

| Feature | Steps | Expected |
|---|---|---|
| Missing flight | Open `/flights/<unknown id>` | "Flight Not Found" page |
| Missing booking | Open `/bookings/<unknown id>` | "Booking not found" page |
| Unknown URL | Open `/some/unknown/url` | Redirected to `/flights` |
| Empty bookings | New passenger opens `/my-bookings` | "No bookings yet" message |
| Unknown API route | GET `/api/nope` | 404 `{ "message": "Route not found" }` |
| Bad JSON body | Send malformed JSON | 400 with a message |

## 4. Automated results (Phase 6 run)

Run against the Atlas database with the real server:

- Access matrix, booking flows and validation fixes: 63 of 63 passed.
- Auth, flights, filters, users and password flows: 74 of 74 passed.
- User deletion against the real bookings API: 12 of 12 passed.
- No API response contained a `password` key.
- Browser checks on login, register, booking, profile and flight forms, both route guards, and the not-found pages: all passed.

## 5. Known limits (not fixed on purpose)

- Two people booking the last seats at the same moment could oversell a flight, because the seat check and update are separate steps.
- Flights that already departed can still be booked while their status is Scheduled.
- The flight date filter uses UTC days.
- CORS is open to every origin until Phase 7 restricts it to `CLIENT_URL`.
