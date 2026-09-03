import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                "https://smart-campus-parking.onrender.com/api/bookings/my-bookings",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBookings(response.data.bookings || []);

        } catch (error) {
            console.error(
                "Failed to fetch bookings:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {

        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this booking?"
        );

        if (!confirmCancel) {
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await axios.delete(
                `https://smart-campus-parking.onrender.com/api/bookings/${bookingId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);

            fetchBookings();

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                "Failed to cancel booking"
            );
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const activeBookings = bookings.filter(
        (booking) => booking.status === "active"
    ).length;

    const cancelledBookings = bookings.filter(
        (booking) => booking.status === "cancelled"
    ).length;
    
    const getBookingDisplayStatus = (booking) => {

        if (booking.status === "cancelled") {
            return {
                text: "❌ CANCELLED",
                className: "status-cancelled"
            };
        }

        if (booking.status === "completed") {
            return {
                text: "✅ COMPLETED",
                className: "status-completed"
            };
        }

        const now = new Date();
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);

        if (now < start) {
            return {
                text: "🟡 RESERVED",
                className: "status-reserved"
            };
        }

        if (now >= start && now < end) {
            return {
                text: "🟢 ACTIVE",
                className: "status-active"
            };
        }

        return {
            text: "✅ COMPLETED",
            className: "status-completed"
        };
    };

    return (
        <div className="parking-page">

            <Navbar />

            <main className="parking-container">

                {/* Header */}

                <div className="parking-header">

                    <p className="page-label">
                        BOOKING MANAGEMENT
                    </p>

                    <h1>
                        📋 My Bookings
                    </h1>

                    <p>
                        View and manage your parking bookings.
                    </p>

                </div>

                {/* Statistics */}

                {!loading && (
                    <section className="stats">

                        <div className="stat-card">

                            <h3>📋</h3>

                            <p>
                                Total Bookings
                            </p>

                            <strong>
                                {bookings.length}
                            </strong>

                        </div>

                        <div className="stat-card">

                            <h3>🟢</h3>

                            <p>
                                Active Bookings
                            </p>

                            <strong>
                                {activeBookings}
                            </strong>

                        </div>

                        <div className="stat-card">

                            <h3>❌</h3>

                            <p>
                                Cancelled
                            </p>

                            <strong>
                                {cancelledBookings}
                            </strong>

                        </div>

                    </section>
                )}

                {/* Loading */}

                {loading ? (

                    <div className="loading">

                        <p>
                            Loading your bookings...
                        </p>

                    </div>

                ) : bookings.length === 0 ? (

                    <div className="empty-state">

                        <div style={{ fontSize: "55px" }}>
                            🅿️
                        </div>

                        <h3>
                            No bookings yet
                        </h3>

                        <p>
                            You haven't booked a parking
                            slot yet.
                        </p>

                        <button
                            className="book-button"
                            style={{
                                maxWidth: "220px",
                                marginTop: "15px"
                            }}
                            onClick={() =>
                                navigate("/dashboard")
                            }
                        >
                            Find Parking →
                        </button>

                    </div>

                ) : (

                    <div className="my-bookings-list">

                        {bookings.map((booking) => (

                            <div
                                className="my-booking-card"
                                key={booking._id}
                            >

                                {/* Booking Header */}

                                <div className="my-booking-header">

                                    <div>

                                        <p className="booking-label">
                                            PARKING AREA
                                        </p>

                                        <h2>
                                            🅿️{" "}
                                            {booking.parkingSlot?.parkingArea?.name ||
                                                "Parking Area"}
                                        </h2>

                                        <p className="booking-slot-title">
                                            Slot:{" "}
                                            {booking.parkingSlot?.slotNumber ||
                                                "Unknown"}
                                        </p>

                                    </div>

                                    {(() => {

                                        const displayStatus =
                                            getBookingDisplayStatus(booking);

                                        return (
                                            <span
                                                className={`booking-status ${displayStatus.className}`}
                                            >
                                                {displayStatus.text}
                                            </span>
                                        );

                                    })()}

                                </div>

                                {/* Details */}

                                <div className="booking-details-grid">

                                    <div className="booking-detail">

                                        <span>
                                            🆔 Booking ID
                                        </span>

                                        <strong>
                                            {booking.bookingId || "N/A"}
                                        </strong>

                                    </div>


                                    <div className="booking-detail">

                                        <span>
                                            🅿️ Parking Area
                                        </span>

                                        <strong>
                                            {booking.parkingSlot?.parkingArea?.name ||
                                                "Unknown"}
                                        </strong>

                                    </div>


                                    <div className="booking-detail">

                                        <span>
                                            🚗 Parking Slot
                                        </span>

                                        <strong>
                                            {booking.parkingSlot?.slotNumber ||
                                                "Unknown"}
                                        </strong>

                                    </div>


                                    <div className="booking-detail">

                                        <span>
                                            🚘 Vehicle
                                        </span>

                                        <strong>
                                            {booking.vehicleNumber ||
                                                "Not provided"}
                                        </strong>

                                    </div>


                                    <div className="booking-detail">

                                        <span>
                                            🕐 Start Time
                                        </span>

                                        <strong>
                                            {new Date(
                                                booking.startTime
                                            ).toLocaleString()}
                                        </strong>

                                    </div>


                                    <div className="booking-detail">

                                        <span>
                                            🕐 End Time
                                        </span>

                                        <strong>
                                            {new Date(
                                                booking.endTime
                                            ).toLocaleString()}
                                        </strong>

                                    </div>

                                </div>

                                {booking.status === "active" &&

                                    new Date() >= new Date(booking.startTime) &&
                                    new Date() < new Date(booking.endTime) && (
                                        
                                    <div className="booking-qr-section">

                                        <p className="booking-qr-title">
                                            🎫 Scan Booking QR
                                        </p>

                                        <QRCodeCanvas
                                            value={JSON.stringify({
                                                bookingId: booking.bookingId,
                                                parkingArea:
                                                    booking.parkingSlot?.parkingArea?.name,
                                                slot:
                                                    booking.parkingSlot?.slotNumber,
                                                vehicleNumber:
                                                    booking.vehicleNumber,
                                                startTime:
                                                    booking.startTime,
                                                endTime:
                                                    booking.endTime
                                            })}
                                            size={180}
                                            level="H"
                                        />

                                        <p className="booking-qr-id">
                                            {booking.bookingId}
                                        </p>

                                    </div>
                                )}

                                {booking.status === "completed" && (
                                    <div className="booking-completed-message">
                                        ✅ This booking has been completed.
                                    </div>
                                )}

                                {booking.status === "cancelled" && (
                                    <div className="booking-cancelled-message">
                                        ❌ This booking was cancelled.
                                    </div>
                                )}

                                {/* Action */}

                                {booking.status === "active" && (

                                    <div className="booking-actions">

                                        <button
                                            className="cancel-button"
                                            onClick={() =>
                                                handleCancel(
                                                    booking._id
                                                )
                                            }
                                        >
                                            Cancel Booking
                                        </button>

                                    </div>

                                )}

                            </div>

                        ))}

                    </div>

                )}

            </main>

        </div>
    );
}

export default MyBookings;