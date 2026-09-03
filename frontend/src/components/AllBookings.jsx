import { useEffect, useState } from "react";
import axios from "axios";

function AllBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState("");

    const fetchBookings = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            const response = await axios.get(
                "https://smart-campus-parking.onrender.com/api/bookings/all",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setBookings(
                response.data.bookings || []
            );

        } catch (error) {
            console.error(
                "Failed to fetch bookings:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleCancelBooking = async (bookingId) => {

        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this booking?"
        );

        if (!confirmCancel) {
            return;
        }

        try {
            const token =
                localStorage.getItem("token");

            const response = await axios.delete(
                `https://smart-campus-parking.onrender.com/api/bookings/${bookingId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            alert(
                response.data.message ||
                "Booking cancelled successfully"
            );

            fetchBookings();

        } catch (error) {

            console.error(
                "Cancel booking error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to cancel booking"
            );
        }
    };

    const filteredBookings = bookings.filter((booking) => {

        const matchesFilter =
            filter === "all" ||
            booking.status === filter;

        const searchText = search.toLowerCase();

        const matchesSearch =
            booking.bookingId
                ?.toLowerCase()
                .includes(searchText) ||

            booking.vehicleNumber
                ?.toLowerCase()
                .includes(searchText) ||

            booking.user?.name
                ?.toLowerCase()
                .includes(searchText) ||

            booking.user?.email
                ?.toLowerCase()
                .includes(searchText);

        const matchesDate =
            !selectedDate ||
            new Date(booking.startTime)
                .toLocaleDateString("en-CA") === selectedDate;

        return (
            matchesFilter &&
            matchesSearch &&
            matchesDate
        );
    });

    const activeCount =
        bookings.filter(
            (booking) =>
                booking.status === "active"
        ).length;

    const completedCount =
        bookings.filter(
            (booking) =>
                booking.status === "completed"
        ).length;

    const cancelledCount =
        bookings.filter(
            (booking) =>
                booking.status === "cancelled"
        ).length;

    return (
        <div className="booking-panel">

            {/* Header */}

            <div className="admin-section-header">

                <div>

                    <p className="page-label">
                        BOOKING MANAGEMENT
                    </p>

                    <h2>
                        📋 All Bookings
                    </h2>

                    <p>
                        View and manage all parking
                        reservations.
                    </p>

                </div>

                <button
                    className="refresh-button"
                    onClick={fetchBookings}
                >
                    🔄 Refresh
                </button>

            </div>

            {/* Statistics */}

            {!loading && (
                <div className="booking-admin-stats">

                    <button
                        className={
                            filter === "all"
                                ? "booking-filter active"
                                : "booking-filter"
                        }
                        onClick={() =>
                            setFilter("all")
                        }
                    >
                        <span>📋</span>
                        <strong>
                            {bookings.length}
                        </strong>
                        <small>
                            All
                        </small>
                    </button>

                    <button
                        className={
                            filter === "active"
                                ? "booking-filter active"
                                : "booking-filter"
                        }
                        onClick={() =>
                            setFilter("active")
                        }
                    >
                        <span>🟢</span>
                        <strong>
                            {activeCount}
                        </strong>
                        <small>
                            Active
                        </small>
                    </button>

                    <button
                        className={
                            filter === "completed"
                                ? "booking-filter active"
                                : "booking-filter"
                        }
                        onClick={() =>
                            setFilter("completed")
                        }
                    >
                        <span>✅</span>
                        <strong>
                            {completedCount}
                        </strong>
                        <small>
                            Completed
                        </small>
                    </button>

                    <button
                        className={
                            filter === "cancelled"
                                ? "booking-filter active"
                                : "booking-filter"
                        }
                        onClick={() =>
                            setFilter("cancelled")
                        }
                    >
                        <span>❌</span>
                        <strong>
                            {cancelledCount}
                        </strong>
                        <small>
                            Cancelled
                        </small>
                    </button>

                </div>
            )}
            
            {/* Booking Filters */}

            <div className="booking-filters">

                <div className="booking-search">

                    <span className="search-icon">
                        🔎
                    </span>

                    <input
                        type="text"
                        placeholder="Search Booking ID, vehicle, name or email..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                    {search && (
                        <button
                            className="clear-search"
                            onClick={() => setSearch("")}
                        >
                            ✕
                        </button>
                    )}

                </div>

                <div className="booking-date-filter">

                    <span>
                        📅
                    </span>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) =>
                            setSelectedDate(e.target.value)
                        }
                    />

                    {selectedDate && (
                        <button
                            className="clear-date"
                            onClick={() =>
                                setSelectedDate("")
                            }
                        >
                            ✕
                        </button>
                    )}

                </div>

            </div>

            {/* Loading */}

            {loading ? (

                <div className="loading">

                    <p>
                        Loading bookings...
                    </p>

                </div>

            ) : filteredBookings.length === 0 ? (

                <div className="empty-state">

                    <div
                        style={{
                            fontSize: "50px"
                        }}
                    >
                        📋
                    </div>

                    <h3>
                        No bookings found
                    </h3>

                    <p>
                        There are no bookings matching
                        this filter.
                    </p>

                </div>

            ) : (

                <div className="admin-bookings-list">

                    {filteredBookings.map(
                        (booking) => {

                            const isActive =
                                booking.status ===
                                "active";

                            const isCompleted =
                                booking.status ===
                                "completed";

                            return (

                                <div
                                    key={booking._id}
                                    className="admin-booking-card"
                                >

                                    {/* Top */}

                                    <div className="admin-booking-top">

                                        <div>

                                            <span className="booking-label">
                                                PARKING SLOT
                                            </span>

                                            <h3>
                                                🆔 {booking.bookingId || "Unknown ID"}
                                            </h3>

                                            <h3>
                                                🅿️ {booking.parkingSlot?.parkingArea?.name ||
                                                    "Unknown Area"}
                                            </h3>

                                            <p>
                                                🚗 Slot:{" "}
                                                {booking.parkingSlot?.slotNumber ||
                                                    "Unknown"}
                                            </p>

                                        </div>

                                        <span
                                            className={`booking-status ${
                                                isActive
                                                    ? "status-active"
                                                    : isCompleted
                                                        ? "status-completed"
                                                        : "status-cancelled"
                                            }`}
                                        >
                                            {isActive &&
                                                "🟢 ACTIVE"}

                                            {isCompleted &&
                                                "✅ COMPLETED"}

                                            {booking.status ===
                                                "cancelled" &&
                                                "❌ CANCELLED"}
                                        </span>

                                    </div>

                                    {/* User */}

                                    <div className="admin-booking-user">

                                        <div className="user-avatar">
                                            👤
                                        </div>

                                        <div>

                                            <strong>
                                                {booking
                                                    .user
                                                    ?.name ||
                                                    "Unknown User"}
                                            </strong>

                                            <span>
                                                {booking
                                                    .user
                                                    ?.email ||
                                                    "No email"}
                                            </span>

                                        </div>

                                    </div>

                                    {/* Details */}

                                    <div className="admin-booking-details">

                                        <div>

                                            <span>
                                                🚗 Vehicle
                                            </span>

                                            <strong>
                                                {booking
                                                    .vehicleNumber ||
                                                    "Unknown"}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                🕐 Start
                                            </span>

                                            <strong>
                                                {new Date(
                                                    booking.startTime
                                                ).toLocaleString()}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                🕐 End
                                            </span>

                                            <strong>
                                                {new Date(
                                                    booking.endTime
                                                ).toLocaleString()}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                🚗 Entry
                                            </span>

                                            <strong>
                                                {booking.entryTime
                                                    ? new Date(
                                                        booking.entryTime
                                                    ).toLocaleString()
                                                    : "Not entered"}
                                            </strong>

                                        </div>

                                        <div>

                                            <span>
                                                🚪 Exit
                                            </span>

                                            <strong>
                                                {booking.exitTime
                                                    ? new Date(
                                                        booking.exitTime
                                                    ).toLocaleString()
                                                    : "Not exited"}
                                            </strong>

                                        </div>

                                    </div>

                                    {/* Action */}

                                    {isActive && (

                                        <div className="admin-booking-actions">

                                            <button
                                                className="cancel-button"
                                                onClick={() =>
                                                    handleCancelBooking(
                                                        booking._id
                                                    )
                                                }
                                            >
                                                Cancel Booking
                                            </button>

                                        </div>

                                    )}

                                </div>

                            );
                        }
                    )}

                </div>

            )}

        </div>
    );
}

export default AllBookings;