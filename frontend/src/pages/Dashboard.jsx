import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Dashboard() {
    const [areas, setAreas] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [availableSlots, setAvailableSlots] = useState(0);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem("token");

                // Get parking areas
                const areasResponse = await axios.get(
                    "https://smart-campus-parking.onrender.com/api/parking/areas"
                );

                const parkingAreas =
                    areasResponse.data.areas || [];

                setAreas(parkingAreas);

                // Get user's bookings
                const bookingsResponse = await axios.get(
                    "https://smart-campus-parking.onrender.com/api/bookings/my-bookings",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                setMyBookings(
                    bookingsResponse.data.bookings || []
                );

                // Get slots for every parking area
                let availableCount = 0;

                for (const area of parkingAreas) {
                    const slotsResponse = await axios.get(
                        `https://smart-campus-parking.onrender.com/api/parking/areas/${area._id}/slots`
                    );

                    const slots =
                        slotsResponse.data.slots || [];

                    availableCount += slots.filter(
                        (slot) =>
                            slot.status === "available"
                    ).length;
                }

                setAvailableSlots(availableCount);

            } catch (error) {
                console.error(
                    "Failed to load dashboard:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const totalSlots = areas.reduce(
        (total, area) =>
            total + Number(area.totalSlots || 0),
        0
    );

    const activeBookings = myBookings.filter(
        (booking) =>
            booking.status === "active"
    ).length;

    return (
        <div className="dashboard">

            <Navbar />

            <main className="dashboard-content">

                {/* Hero */}

                <section className="hero">

                    <div>

                        <p className="welcome-text">
                            Welcome Back 👋
                        </p>

                        <h1>
                            Smart Campus Parking 🚗
                        </h1>

                        <p>
                            Find an available parking slot
                            and book it in seconds.
                        </p>

                    </div>

                </section>

                {/* Statistics */}

                <section className="stats">

                    <div className="stat-card">

                        <h3>🅿️</h3>

                        <p>
                            Parking Areas
                        </p>

                        <strong>
                            {areas.length}
                        </strong>

                    </div>

                    <div className="stat-card">

                        <h3>🚗</h3>

                        <p>
                            Total Slots
                        </p>

                        <strong>
                            {totalSlots}
                        </strong>

                    </div>

                    <div className="stat-card">

                        <h3>🟢</h3>

                        <p>
                            Available Slots
                        </p>

                        <strong>
                            {availableSlots}
                        </strong>

                    </div>

                    <div className="stat-card">

                        <h3>📋</h3>

                        <p>
                            My Active Bookings
                        </p>

                        <strong>
                            {activeBookings}
                        </strong>

                    </div>

                </section>

                {/* Parking Areas */}

                <section className="parking-section">

                    <div className="section-header">

                        <div>

                            <h2>
                                Parking Areas
                            </h2>

                            <p>
                                Choose a parking area
                                to view available slots.
                            </p>

                        </div>

                    </div>

                    {loading ? (

                        <p>
                            Loading parking areas...
                        </p>

                    ) : areas.length === 0 ? (

                        <p>
                            No parking areas available.
                        </p>

                    ) : (

                        <div className="parking-grid">

                            {areas.map((area) => (

                                <div
                                    className="parking-card"
                                    key={area._id}
                                >

                                    <div className="parking-icon">
                                        🅿️
                                    </div>

                                    <h3>
                                        {area.name}
                                    </h3>

                                    <p>
                                        📍 {area.location}
                                    </p>

                                    <p>
                                        Total Slots:{" "}
                                        <strong>
                                            {area.totalSlots}
                                        </strong>
                                    </p>

                                    <button
                                        onClick={() =>
                                            navigate(
                                                `/parking/${area._id}`
                                            )
                                        }
                                    >
                                        View Slots →
                                    </button>

                                </div>

                            ))}

                        </div>

                    )}

                </section>

                {/* My Bookings */}

                <section className="booking-panel">

                    <div className="section-header">

                        <div>

                            <h2>
                                📋 My Bookings
                            </h2>

                            <p>
                                View your current parking bookings.
                            </p>

                        </div>

                    </div>

                    {myBookings.length === 0 ? (

                        <p>
                            You don't have any bookings yet.
                        </p>

                    ) : (

                        <button
                            className="book-button"
                            onClick={() =>
                                navigate("/my-bookings")
                            }
                        >
                            View My Bookings →
                        </button>

                    )}

                </section>

            </main>

        </div>
    );
}

export default Dashboard;