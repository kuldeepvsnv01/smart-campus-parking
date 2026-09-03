import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function ParkingSlots() {
    const { areaId } = useParams();
    const navigate = useNavigate();

    const [slots, setSlots] = useState([]);
    const [area, setArea] = useState(null);
    const [totalSlots, setTotalSlots] = useState(0);
    const [loading, setLoading] = useState(true);
    const [bookingSuccess, setBookingSuccess] = useState(null);

    const [vehicleNumber, setVehicleNumber] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const fetchData = async () => {
        try {
            // Fetch parking area
            const areasResponse = await axios.get(
                "https://smart-campus-parking.onrender.com/api/parking/areas"
            );

            const foundArea =
                areasResponse.data.areas.find(
                    (item) => item._id === areaId
                );

            setArea(foundArea);

            setTotalSlots(foundArea?.totalSlots || 0);

            // Fetch slots based on selected time
            if (!startTime || !endTime) {
                setSlots([]);
                return;
            }

            const slotsResponse = await axios.get(
                `https://smart-campus-parking.onrender.com/api/parking/areas/${areaId}/available-slots`,
                {
                    params: {
                        startTime,
                        endTime
                    }
                }
            );

            setSlots(slotsResponse.data.slots || []);

        } catch (error) {
            console.error(
                "Failed to fetch parking data:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 5000);

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
                alert("Please fill all booking details.");
                return;
            }

            if (
                new Date(endTime) <=
                new Date(startTime)
            ) {
                alert(
                    "End time must be after start time."
                );
                return;
            }

            const response = await axios.post(
                "https://smart-campus-parking.onrender.com/api/bookings",
                {
                    parkingSlot: slotId,
                    vehicleNumber,
                    startTime,
                    endTime
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBookingSuccess(response.data.booking);

            // Refresh slots
            fetchData();

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                "Booking failed"
            );
        }
    };

    const availableSlots = slots.length;

    const unavailableSlots =
        Math.max(totalSlots - availableSlots, 0);

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
                                        (slot) =>
                                            slot._id ===
                                            bookingSuccess.parkingSlot
                                    )?.slotNumber || "Unknown"}
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
                                    {new Date(
                                        bookingSuccess.startTime
                                    ).toLocaleString()}
                                </strong>
                            </div>

                            <div>
                                <span>🕐 End Time</span>

                                <strong>
                                    {new Date(
                                        bookingSuccess.endTime
                                    ).toLocaleString()}
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
                                onClick={() =>
                                    navigate("/my-bookings")
                                }
                            >
                                📋 View My Bookings
                            </button>

                            <button
                                className="confirmation-close"
                                onClick={() =>
                                    setBookingSuccess(null)
                                }
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
                                Available for Selected Time
                            </p>

                            <strong>
                                {availableSlots}
                            </strong>

                        </div>

                        <div className="stat-card">

                            <h3>🔴</h3>

                            <p>
                                Unavailable for Selected Time
                            </p>

                            <strong>
                                {unavailableSlots}
                            </strong>

                        </div>

                    </section>
                )}
                
                {/* Booking Details */}

                <div className="booking-panel">

                    <h2>
                        📅 Booking Details
                    </h2>

                    <p>
                        Fill these details before selecting
                        a parking slot.
                    </p>

                    <div className="booking-form">

                        <div className="form-group">

                            <label>
                                Vehicle Number
                            </label>

                            <input
                                type="text"
                                placeholder="e.g. RJ14AB1234"
                                value={vehicleNumber}
                                onChange={(e) =>
                                    setVehicleNumber(
                                        e.target.value.toUpperCase()
                                    )
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Start Time
                            </label>

                            <input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) =>
                                    setStartTime(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                End Time
                            </label>

                            <input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) =>
                                    setEndTime(
                                        e.target.value
                                    )
                                }
                            />

                        </div>

                    </div>

                </div>

                {/* Slots Header */}

                <div className="slot-heading">

                    <div>

                        <h2>
                            Parking Slots
                        </h2>

                        <p>
                            {!startTime || !endTime
                                ? "Select start and end time to check slot availability."
                                : "🟢 Slots shown below are available for your selected time."
                            }
                        </p>

                        <p className="live-status">
                            🟢 Live availability
                        </p>
                    </div>

                    <div className="legend">

                        <span>
                            🟢 Available
                        </span>

                        <span>
                            🟡 Reserved
                        </span>

                        <span>
                            🔴 Occupied
                        </span>

                        <span>
                            ⚫ Blocked
                        </span>

                    </div>

                </div>

                {/* Loading */}

                {loading ? (

                    <div className="loading">

                        <p>
                            Loading parking slots...
                        </p>

                    </div>

                ) : slots.length === 0 ? (

                    <div className="empty-state">

                        {!startTime || !endTime ? (

                            <>
                                <h3>
                                    📅 Select Booking Time
                                </h3>

                                <p>
                                    Please select a start time and
                                    end time to see available slots.
                                </p>
                            </>

                        ) : (

                            <>
                                <h3>
                                    🚫 No Available Slots
                                </h3>

                                <p>
                                    No parking slots are available
                                    for the selected time.
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

                                    {slot.status === "available" &&
                                        "🟢 Available"}

                                    {slot.status === "reserved" &&
                                        "🟡 Reserved"}

                                    {slot.status === "occupied" &&
                                        "🔴 Occupied"}

                                    {slot.status === "blocked" &&
                                        "⚫ Blocked"}

                                </p>

                                {slot.futureBooking &&
                                    slot.status === "reserved" && (
                                    <p className="future-booking">
                                        🟡 Reserved later
                                        <br />

                                        {new Date(
                                            slot.futureBooking.startTime
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}

                                        {" - "}

                                        {new Date(
                                            slot.futureBooking.endTime
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </p>
                                )}

                                <button
                                    className="book-button"
                                    onClick={() =>
                                        handleBooking(slot._id)
                                    }
                                >
                                    Book This Slot →
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