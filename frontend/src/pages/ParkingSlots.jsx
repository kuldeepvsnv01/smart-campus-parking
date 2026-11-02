import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const getInitialTimes = () => {
    const now = new Date();
    // Round to nearest future 5-minute block
    now.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);

    const pad = (n) => String(n).padStart(2, "0");
    const formatLocal = (d) => {
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const mins = pad(d.getMinutes());
        return `${year}-${month}-${day}T${hours}:${mins}`;
    };

    const start = new Date(now.getTime());
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    return {
        startStr: formatLocal(start),
        endStr: formatLocal(end)
    };
};

function ParkingSlots() {
    const { areaId } = useParams();
    const navigate = useNavigate();

    const initialTimes = getInitialTimes();

    const [slots, setSlots] = useState([]);
    const [area, setArea] = useState(null);
    const [totalSlots, setTotalSlots] = useState(0);
    const [loading, setLoading] = useState(true);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Pre-fill user vehicleNumber if available
    const [vehicleNumber, setVehicleNumber] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");
            return user.vehicleNumber || "";
        } catch {
            return "";
        }
    });

    const [startTime, setStartTime] = useState(initialTimes.startStr);
    const [endTime, setEndTime] = useState(initialTimes.endStr);

    const fetchData = async () => {
        try {
            // Fetch parking area
            const areasResponse = await api.get("/parking/areas");
            const foundArea = (areasResponse.data.areas || []).find(
                (item) => item._id === areaId
            );

            setArea(foundArea);
            setTotalSlots(foundArea?.totalSlots || 0);

            // If time range is specified, query available slots for that time range
            if (startTime && endTime) {
                const slotsResponse = await api.get(
                    `/parking/areas/${areaId}/available-slots`,
                    {
                        params: {
                            startTime: new Date(startTime).toISOString(),
                            endTime: new Date(endTime).toISOString()
                        }
                    }
                );
                setSlots(slotsResponse.data.slots || []);
            } else {
                // Otherwise fetch all slots for the area
                const allSlotsResponse = await api.get(
                    `/parking/areas/${areaId}/slots`
                );
                setSlots(allSlotsResponse.data.slots || []);
            }

        } catch (error) {
            console.error("Failed to fetch parking data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 15000); // 15-second refresh

        return () => {
            clearInterval(interval);
        };
    }, [areaId, startTime, endTime]);

    const handleBooking = async (slotId) => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                alert("Please login first.");
                navigate("/login");
                return;
            }

            if (!vehicleNumber || !startTime || !endTime) {
                alert("Please fill all booking details (Vehicle Number, Start Time, and End Time).");
                return;
            }

            if (new Date(endTime) <= new Date(startTime)) {
                alert("End time must be after start time.");
                return;
            }

            setBookingLoading(true);

            const response = await api.post("/bookings", {
                parkingSlot: slotId,
                vehicleNumber: vehicleNumber.trim().toUpperCase(),
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString()
            });

            setBookingSuccess(response.data.booking);

            // Refresh slot availability
            fetchData();

        } catch (error) {
            console.error("Booking error:", error);

            alert(
                error.response?.data?.message ||
                "Booking failed"
            );
        } finally {
            setBookingLoading(false);
        }
    };

    const availableSlots = slots.length;
    const unavailableSlots = Math.max(totalSlots - availableSlots, 0);

    return (
        <div className="parking-page">
            <Navbar />

            <main className="parking-container">
                {bookingSuccess && (
                    <div className="booking-confirmation">
                        <div className="confirmation-icon">
                            ✅
                        </div>

                        <p className="page-label">
                            BOOKING CONFIRMED
                        </p>

                        <h2>
                            Parking Slot Booked Successfully!
                        </h2>

                        <div className="confirmation-booking-id">
                            <span>Booking ID</span>
                            <strong>
                                {bookingSuccess.bookingId}
                            </strong>
                        </div>

                        <div className="confirmation-details">
                            <div>
                                <span>🅿️ Parking Area</span>
                                <strong>
                                    {area?.name || "Parking Area"}
                                </strong>
                            </div>

                            <div>
                                <span>🚗 Parking Slot</span>
                                <strong>
                                    {slots.find(
                                        (slot) => slot._id === bookingSuccess.parkingSlot
                                    )?.slotNumber || "Reserved"}
                                </strong>
                            </div>

                            <div>
                                <span>🚘 Vehicle</span>
                                <strong>
                                    {bookingSuccess.vehicleNumber}
                                </strong>
                            </div>

                            <div>
                                <span>🕐 Start Time</span>
                                <strong>
                                    {new Date(bookingSuccess.startTime).toLocaleString()}
                                </strong>
                            </div>

                            <div>
                                <span>🕐 End Time</span>
                                <strong>
                                    {new Date(bookingSuccess.endTime).toLocaleString()}
                                </strong>
                            </div>

                            <div>
                                <span>📌 Status</span>
                                <strong>
                                    🟢 CONFIRMED
                                </strong>
                            </div>
                        </div>

                        <div className="confirmation-actions">
                            <button
                                className="book-button"
                                onClick={() => navigate("/my-bookings")}
                            >
                                📋 View My Bookings
                            </button>

                            <button
                                className="confirmation-close"
                                onClick={() => setBookingSuccess(null)}
                            >
                                Continue Parking
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="parking-header">
                    <p className="page-label">
                        PARKING AREA
                    </p>

                    <h1>
                        🅿️ {area?.name || "Parking Slots"}
                    </h1>

                    <p>
                        {area?.location
                            ? `📍 ${area.location}`
                            : "Select an available slot and complete your booking."}
                    </p>
                </div>

                {/* Statistics */}
                {!loading && (
                    <section className="stats">
                        <div className="stat-card">
                            <h3>🅿️</h3>
                            <p>Total Slots</p>
                            <strong>{totalSlots}</strong>
                        </div>

                        <div className="stat-card">
                            <h3>🟢</h3>
                            <p>Available for Selected Time</p>
                            <strong>{availableSlots}</strong>
                        </div>

                        <div className="stat-card">
                            <h3>🔴</h3>
                            <p>Unavailable for Selected Time</p>
                            <strong>{unavailableSlots}</strong>
                        </div>
                    </section>
                )}

                {/* Booking Details */}
                <div className="booking-panel">
                    <h2>📅 Booking Details</h2>
                    <p>
                        Select your reservation timeframe and vehicle number.
                    </p>

                    <div className="booking-form">
                        <div className="form-group">
                            <label>Vehicle Number</label>
                            <input
                                type="text"
                                placeholder="e.g. RJ14AB1234"
                                value={vehicleNumber}
                                onChange={(e) =>
                                    setVehicleNumber(e.target.value.toUpperCase())
                                }
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Start Time</label>
                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>End Time</label>
                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Slots Header */}
                <div className="slot-heading">
                    <div>
                        <h2>Parking Slots</h2>
                        <p>
                            {!startTime || !endTime
                                ? "Select start and end time above to filter available slots."
                                : "🟢 Slots shown below are available for your selected reservation window."}
                        </p>
                        <p className="live-status">
                            🟢 Live Availability & Overlap Protection Active
                        </p>
                    </div>

                    <div className="legend">
                        <span>🟢 Available</span>
                        <span>🟡 Reserved</span>
                        <span>🔴 Occupied</span>
                        <span>⚫ Blocked</span>
                    </div>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="loading">
                        <p>Loading parking slots...</p>
                    </div>
                ) : slots.length === 0 ? (
                    <div className="empty-state">
                        {!startTime || !endTime ? (
                            <>
                                <h3>📅 Select Booking Time</h3>
                                <p>
                                    Please select a start time and end time to see available slots.
                                </p>
                            </>
                        ) : (
                            <>
                                <h3>🚫 No Available Slots</h3>
                                <p>
                                    No parking slots are available for the selected time window. Try a different time slot or check other areas.
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="slot-grid">
                        {slots.map((slot) => (
                            <div
                                key={slot._id}
                                className={`slot-card ${slot.status}`}
                            >
                                <div className="slot-number">
                                    {slot.slotNumber}
                                </div>

                                <div className="slot-icon">
                                    🚗
                                </div>

                                <p className="slot-status">
                                    {slot.status === "available" && "🟢 Available"}
                                    {slot.status === "reserved" && "🟡 Reserved"}
                                    {slot.status === "occupied" && "🔴 Occupied"}
                                    {slot.status === "blocked" && "⚫ Blocked"}
                                </p>

                                {slot.futureBooking && slot.status === "reserved" && (
                                    <p className="future-booking">
                                        🟡 Reserved later
                                        <br />
                                        {new Date(slot.futureBooking.startTime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                        {" - "}
                                        {new Date(slot.futureBooking.endTime).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </p>
                                )}

                                <button
                                    className="book-button"
                                    onClick={() => handleBooking(slot._id)}
                                    disabled={bookingLoading || slot.status === "blocked"}
                                >
                                    {bookingLoading ? "Booking..." : "Book This Slot →"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default ParkingSlots;