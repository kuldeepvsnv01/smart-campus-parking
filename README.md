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

## How to Run the Project

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

## Environment Variables

Create a `.env` file inside the `backend` folder.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

**Never commit your `.env` file to GitHub.**

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