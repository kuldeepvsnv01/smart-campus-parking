// This change is only in my cloned repository
import ParkingSlots from "./pages/ParkingSlots";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MyBookings from "./pages/MyBookings";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Home Page */}
                <Route
                    path="/"
                    element={
                        <div className="home-page">

                            <nav className="home-navbar">

                                <h2>🚗 Smart Parking</h2>

                                <div>
                                    <Link to="/login">
                                        Login
                                    </Link>

                                    <Link to="/register">
                                        Register
                                    </Link>
                                </div>

                            </nav>

                            <main className="home-container">

                                <section className="home-hero">

                                    <div className="home-content">

                                        <p className="home-label">
                                            SMART CAMPUS PARKING
                                        </p>

                                        <h1>
                                            Find Your Parking
                                            <br />
                                            Spot Easily.
                                        </h1>

                                        <p className="home-description">
                                            Book available parking slots
                                            on campus quickly and easily.
                                        </p>

                                        <div className="home-buttons">

                                            <Link
                                                to="/login"
                                                className="primary-button"
                                            >
                                                Login
                                            </Link>

                                            <Link
                                                to="/register"
                                                className="secondary-button"
                                            >
                                                Create Account
                                            </Link>

                                        </div>

                                    </div>

                                    <div className="home-parking-icon">
                                        🅿️
                                    </div>

                                </section>

                                <section className="home-features">

                                    <div className="feature-card">

                                        <div>🅿️</div>

                                        <h3>
                                            Easy Parking
                                        </h3>

                                        <p>
                                            Find available parking
                                            slots quickly.
                                        </p>

                                    </div>

                                    <div className="feature-card">

                                        <div>📱</div>

                                        <h3>
                                            Easy Booking
                                        </h3>

                                        <p>
                                            Reserve your parking slot
                                            in just a few clicks.
                                        </p>

                                    </div>

                                    <div className="feature-card">

                                        <div>🔒</div>

                                        <h3>
                                            Secure System
                                        </h3>

                                        <p>
                                            Your account and booking
                                            information stays protected.
                                        </p>

                                    </div>

                                </section>

                            </main>

                        </div>
                    }
                />

                {/* Parking Slots */}
                <Route
                    path="/parking/:areaId"
                    element={
                        <ProtectedRoute>
                            <ParkingSlots />
                        </ProtectedRoute>
                    }
                />

                {/* My Bookings */}
                <Route
                    path="/my-bookings"
                    element={
                        <ProtectedRoute>
                            <MyBookings />
                        </ProtectedRoute>
                    }
                />

                {/* Admin Dashboard */}
                <Route
                    path="/admin"
                    element={
                        <AdminRoute>
                            <AdminDashboard />
                        </AdminRoute>
                    }
                />

                {/* Login */}
                <Route
                    path="/login"
                    element={<Login />}
                />

                {/* Register */}
                <Route
                    path="/register"
                    element={<Register />}
                />

                {/* User Dashboard */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;