# Smart Campus Parking Management System

## 🌐 Live Demo

**Frontend:** https://smart-campus-parking.vercel.app

**Backend:** https://smart-campus-parking.onrender.com

A web-based parking management system designed to make campus parking easier, faster, and more organized.

The system allows users to view parking availability, reserve parking slots for specific time periods, manage bookings, and use QR codes for parking verification.

Administrators can manage parking areas and slots, monitor bookings, verify QR codes, and track parking statistics through an admin dashboard.

## Features

### User Features

- User registration and login
- JWT-based authentication
- View parking areas and available slots
- Select parking slots based on required time
- Future parking reservations
- Unique booking ID generation
- View personal bookings
- Cancel bookings
- QR code generation for active bookings
- Booking status tracking

### Admin Features

- Admin authentication and role-based access
- Create and manage parking areas
- Create individual parking slots
- Bulk create parking slots
- Block and unblock parking slots
- View all bookings
- Search bookings by booking ID, vehicle number, user name, or email
- Filter bookings by status
- Filter bookings by date
- QR code scanner for booking verification
- Parking entry and exit management
- Admin dashboard statistics
- Automatic statistics refresh
- Booking status management

### Smart Time-Based Availability

The system checks the selected start and end time before showing available parking slots.

A slot that is reserved for one time period can still be available for another non-overlapping time period.

## Tech Stack

### Frontend

- React.js
- Vite
- Axios
- React Router DOM
- CSS
- html5-qrcode
- qrcode.react

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- CORS
- dotenv

### Development Tools

- Git
- GitHub
- VS Code
- Postman

## Quick Start (Root Directory)

You can run commands directly from the root workspace:

```bash
# Install dependencies in both backend and frontend
npm run install:all

# Start backend server (port 5001)
npm run backend

# Start frontend dev server (port 5173)
npm run frontend

# Run automated backend test suite
npm test

# Build frontend for production
npm run build
```

---

## How to Run the Project (Separate Terminals)

### Start the Backend

Open a terminal and run:

```bash
cd backend
npm install
npm start
```

### Start the Frontend

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

### Create or Promote an Admin Account

To promote any registered user to an administrator:

```bash
cd backend
npm run make-admin <user-email>
# Example: npm run make-admin kul@gmail.com
```

Or create a new admin account:
```bash
cd backend
node scripts/make-admin.js --create "Admin Name" "admin@campus.edu" "SecurePassword123" "ADMIN01"
```
npm install
npm run dev
```

### Run Automated Tests

```bash
cd backend
npm test
```

## Environment Variables

### Backend (`backend/.env`)
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
FRONTEND_URL=https://smart-campus-parking.vercel.app
```

### Frontend (`frontend/.env` / `frontend/.env.local`)
```env
VITE_API_URL=https://smart-campus-parking.onrender.com/api
# Or for local development:
# VITE_API_URL=http://localhost:5001/api
```

## System Architecture

```text
User Browser
    │
    ▼
Vercel (React + Vite Single-Page Application)
    │
    ▼ HTTPS / REST API (JWT Authenticated)
Render (Node.js + Express.js API Server)
    │
    ▼ Mongoose ODM
MongoDB Atlas (Cloud Database with Compound Indexes & Transactions)
```

## REST API Reference

### 🔐 Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account with hashed password |
| `POST` | `/api/auth/login` | Public | User login returning JWT authentication token |
| `GET` | `/api/auth/profile` | Protected | Fetch current user authenticated profile |

### 🅿️ Parking Areas & Slots
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/parking/areas` | Public | List all parking areas |
| `GET` | `/api/parking/areas/stats` | Public | Real-time occupancy statistics per parking area |
| `GET` | `/api/parking/areas/:areaId/slots` | Public | List all slots of a parking area with live status |
| `GET` | `/api/parking/areas/:areaId/available-slots` | Public | Filter slots available for requested time period |
| `POST` | `/api/parking/areas` | Admin | Create a new parking area |
| `POST` | `/api/parking/slots` | Admin | Create an individual parking slot |
| `POST` | `/api/parking/slots/bulk` | Admin | Bulk create parking slots (A1, A2, etc.) |
| `PATCH`| `/api/parking/slots/:slotId/status` | Admin | Block or unblock a parking slot |

### 📋 Bookings
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/bookings` | Protected | Create booking with overlap prevention |
| `GET` | `/api/bookings/my-bookings` | Protected | Fetch user's booking history (with pagination) |
| `PATCH`| `/api/bookings/:id/cancel` | Protected | Cancel an active reservation |
| `DELETE`| `/api/bookings/:id` | Protected | Cancel an active reservation |
| `GET` | `/api/bookings/verify/:bookingId` | Admin | Verify QR code booking validity |
| `PATCH`| `/api/bookings/entry/:bookingId` | Admin | Record vehicle arrival / entry timestamp |
| `PATCH`| `/api/bookings/exit/:bookingId` | Admin | Record vehicle exit timestamp and complete booking |
| `GET` | `/api/bookings/all` | Admin | View all system bookings with search & date filters |

### ⚡ Admin & Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/admin/dashboard` | Admin | Verify admin authentication and dashboard status |
| `GET` | `/api/admin/stats` | Admin | Comprehensive metrics (total, occupied, utilization %) |
| `POST` | `/api/admin/create-admin` | Admin/Setup | Create admin user account |

## Project Structure

```text
smart-campus-parking/
├── backend/
└── frontend/
```

### Backend

```text
backend/
├── config/
│   └── db.js
├── middleware/
│   ├── adminMiddleware.js
│   └── authMiddleware.js
├── models/
│   ├── Booking.js
│   ├── ParkingArea.js
│   ├── ParkingSlot.js
│   └── user.js
├── routes/
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── bookingRoutes.js
│   └── parkingRoutes.js
├── utils/
│   └── bookingExpiry.js
├── server.js
├── package.json
└── package-lock.json
```

### Frontend

```text
frontend/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── AddParkingArea.jsx
│   │   ├── AddParkingSlot.jsx
│   │   ├── AdminParkingAreas.jsx
│   │   ├── AdminRoute.jsx
│   │   ├── AllBookings.jsx
│   │   ├── BulkCreateSlots.jsx
│   │   ├── ManageSlots.jsx
│   │   ├── Navbar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── QRScanner.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── MyBookings.jsx
│   │   ├── ParkingSlots.jsx
│   │   └── Register.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   └── style.css
├── index.html
├── package.json
└── package-lock.json
```

### Backend

The backend handles the server-side logic of the application, including authentication, parking management, booking management, QR verification, and communication with the MongoDB database.

### Frontend

The frontend provides the user interface for both users and administrators. It handles parking slot selection, bookings, QR code generation and scanning, booking management, and the admin dashboard.

## 📸 Screenshots

### Login Page
![Login Page](screenshots/login%20page.jpeg)

### Register Page
![Register Page](screenshots/register%20page.jpeg)

### Parking Areas
![Parking Areas](screenshots/parking%20area.jpeg)

### My Bookings
![My Bookings](screenshots/my%20booking.jpeg)

### Admin Dashboard
![Admin Dashboard](screenshots/admin%20dashboard.jpeg)

### All Bookings
![All Bookings](screenshots/all%20bookings.jpeg)

### QR Scanner
![QR Scanner](screenshots/QR%20scanner.jpeg)

## Future Improvements

Some possible improvements for future versions of the project:

- Online payment integration for paid parking
- Mobile application for Android and iOS
- Real-time parking availability using IoT sensors
- Automatic number plate recognition (ANPR)
- Navigation to the selected parking slot
- Email or SMS notifications for bookings
- Advanced parking analytics and reports
- Cloud deployment for real-world campus usage

## Author

**Kuldeep Vaishnav**

This project was developed as a Smart Campus Parking Management System using the MERN stack.