import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AddParkingArea from "../components/AddParkingArea";
import AddParkingSlot from "../components/AddParkingSlot";
import AllBookings from "../components/AllBookings";
import AdminParkingAreas from "../components/AdminParkingAreas";
import ManageSlots from "../components/ManageSlots";
import BulkCreateSlots from "../components/BulkCreateSlots";
import QRScanner from "../components/QRScanner";

function AdminDashboard() {
    
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [verifiedBooking, setVerifiedBooking] = useState(null);
    const [verificationError, setVerificationError] = useState("");
    const [stats, setStats] = useState({
        totalAreas: 0,
        totalSlots: 0,
        availableSlots: 0,
        reservedSlots: 0,
        occupiedSlots: 0,
        blockedSlots: 0,
        activeBookings: 0
    });

    const navigate = useNavigate();

    useEffect(() => {
    const fetchAdminDashboard = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get(
                "http://localhost:5001/api/admin/dashboard",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(response.data.message);

            const statsResponse = await axios.get(
                "http://localhost:5001/api/admin/stats",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setStats(statsResponse.data);

        } catch (error) {
            console.error("Admin dashboard error:", error);

            setMessage(
                error.response?.data?.message ||
                "Failed to load admin dashboard"
            );
        } finally {
            setLoading(false);
        }
    };

    fetchAdminDashboard();

    const interval = setInterval(() => {
        fetchAdminDashboard();
    }, 30000);

    return () => {
        clearInterval(interval);
    };
    }, []);
    
    const handleQRScan = async (data) => {

        try {

            setVerificationError("");
            setVerifiedBooking(null);

            console.log("Scanned QR:", data);

            // QR contains JSON
            const qrData = JSON.parse(data);

            const bookingId = qrData.bookingId;

            if (!bookingId) {
                setVerificationError(
                    "Invalid QR code: Booking ID not found"
                );
                return;
            }

            const token =
                localStorage.getItem("token");

            const response = await axios.get(
                `http://localhost:5001/api/bookings/verify/${bookingId}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (response.data.valid) {

                setVerifiedBooking(
                    response.data.booking
                );

            }

        } catch (error) {

            console.error(
                "QR verification error:",
                error
            );

            setVerificationError(
                error.response?.data?.message ||
                "Invalid or expired booking"
            );
        }
    };

    const handleVehicleEntry = async () => {

    try {

        const token =
            localStorage.getItem("token");

        const response = await axios.patch(
            `http://localhost:5001/api/bookings/entry/${verifiedBooking.bookingId}`,
            {},
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

        alert(response.data.message);

        setVerifiedBooking(
            response.data.booking
        );

    } catch (error) {

        console.error(
            "Vehicle entry error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to record vehicle entry"
        );
    }
};

const handleVehicleExit = async () => {
    try {
        const token = localStorage.getItem("token");

        const response = await axios.patch(
            `http://localhost:5001/api/bookings/exit/${verifiedBooking.bookingId}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        alert(response.data.message);

        setVerifiedBooking(response.data.booking);

    } catch (error) {
        console.error(
            "Vehicle exit error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to record vehicle exit"
        );
    }
};

    return (
        <div>
            <Navbar />

            <main className="dashboard-content">

                <section className="hero">
                    <p className="welcome-text">
                        ADMIN PANEL
                    </p>

                    <h1>👨‍💼 Admin Dashboard</h1>

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <p>{message}</p>
                    )}
                </section>

                <section className="stats">

                    <div className="stat-card">
                        <h3>🅿️</h3>
                        <p>Parking Areas</p>
                        <strong>{stats.totalAreas}</strong>
                    </div>

                    <div className="stat-card">
                        <h3>🚗</h3>
                        <p>Total Slots</p>
                        <strong>{stats.totalSlots}</strong>
                    </div>

                    <div className="stat-card">
                        <h3>🟢</h3>
                        <p>Available Slots</p>
                        <strong>{stats.availableSlots}</strong>
                    </div>

                    <div className="stat-card">

                        <h3>🟡</h3>

                        <p>
                            Reserved Slots
                        </p>

                        <strong>
                            {stats.reservedSlots}
                        </strong>

                    </div>

                    <div className="stat-card">
                        <h3>🔴</h3>
                        <p>Occupied Slots</p>
                        <strong>{stats.occupiedSlots}</strong>
                    </div>

                    <div className="stat-card">

                        <h3>⚫</h3>

                        <p>
                            Blocked Slots
                        </p>

                        <strong>
                            {stats.blockedSlots}
                        </strong>

                    </div>

                    <div className="stat-card">
                        <h3>📋</h3>
                        <p>Active Bookings</p>
                        <strong>{stats.activeBookings}</strong>
                    </div>
                </section>

                {/* Sticky Admin Actions */}

                <div className="admin-sticky-actions">

                    <button
                        onClick={() =>
                            document
                                .getElementById("qr-scanner")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                })
                        }
                    >
                        📱 Scan QR
                    </button>

                    <button
                        onClick={() =>
                            document
                                .getElementById("manage-slots")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                })
                        }
                    >
                        🚗 Manage Slots
                    </button>

                    <button
                        onClick={() =>
                            document
                                .getElementById("bulk-create-slots")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                })
                        }
                    >
                        ⚡ Bulk Slots
                    </button>

                    <button
                        onClick={() =>
                            document
                                .getElementById("all-bookings")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start"
                                })
                        }
                    >
                        📋 Bookings
                    </button>

                </div>

                <section className="admin-quick-actions">

                    <div className="admin-section-header">

                        <div>
                            <p className="page-label">
                                QUICK ACTIONS
                            </p>

                            <h2>
                                Manage Parking
                            </h2>
                        </div>

                        <button
                            className="admin-refresh-button"
                            onClick={() => window.location.reload()}
                        >
                            🔄 Refresh
                        </button>

                    </div>

                    <div className="quick-action-grid">

                        {/* Scan QR */}

                        <button
                            className="quick-action-card"
                            onClick={() =>
                                document
                                    .getElementById("qr-scanner")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start"
                                    })
                            }
                        >

                            <span className="quick-action-icon">
                                📱
                            </span>

                            <span className="quick-action-title">
                                Scan QR
                            </span>

                            <span className="quick-action-text">
                                Verify parking booking
                            </span>

                        </button>


                        {/* Manage Slots */}

                        <button
                            className="quick-action-card"
                            onClick={() =>
                                document
                                    .getElementById("manage-slots")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start"
                                    })
                            }
                        >

                            <span className="quick-action-icon">
                                🚗
                            </span>

                            <span className="quick-action-title">
                                Manage Slots
                            </span>

                            <span className="quick-action-text">
                                Block or unblock slots
                            </span>

                        </button>


                        {/* Bulk Create */}

                        <button
                            className="quick-action-card"
                            onClick={() =>
                                document
                                    .getElementById("bulk-create-slots")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start"
                                    })
                            }
                        >

                            <span className="quick-action-icon">
                                ⚡
                            </span>

                            <span className="quick-action-title">
                                Bulk Create Slots
                            </span>

                            <span className="quick-action-text">
                                Generate multiple slots
                            </span>

                        </button>


                        {/* All Bookings */}

                        <button
                            className="quick-action-card"
                            onClick={() =>
                                document
                                    .getElementById("all-bookings")
                                    ?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "start"
                                    })
                            }
                        >

                            <span className="quick-action-icon">
                                📋
                            </span>

                            <span className="quick-action-title">
                                All Bookings
                            </span>

                            <span className="quick-action-text">
                                View and manage bookings
                            </span>

                        </button>

                    </div>

                </section>
                
                <div id="qr-scanner">
                    <QRScanner
                        onScan={handleQRScan}
                    />
                </div>

                <div id="manage-slots">
                    <ManageSlots />
                </div>

                <div id="add-parking-area">
                    <AddParkingArea />
                </div>

                <div id="add-parking-slot">
                    <AddParkingSlot />
                </div>

                <div id="bulk-create-slots">
                    <BulkCreateSlots />
                </div>


                <AdminParkingAreas />
                <div id="all-bookings">
                    <AllBookings />
                </div>
                

                {verifiedBooking && (
                    <div className="verification-success">

                        <div className="verification-icon">
                            ✅
                        </div>

                        <h2>
                            Valid Booking
                        </h2>

                        <p>
                            This booking is valid and active.
                        </p>

                        <div className="verification-details">

                            <p>
                                <strong>Booking ID:</strong>{" "}
                                {verifiedBooking.bookingId}
                            </p>

                            <p>
                                <strong>User:</strong>{" "}
                                {verifiedBooking.user?.name ||
                                    "Unknown"}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                {verifiedBooking.user?.email ||
                                    "Unknown"}
                            </p>

                            <p>
                                <strong>Parking Area:</strong>{" "}
                                {verifiedBooking.parkingSlot
                                    ?.parkingArea?.name ||
                                    "Unknown"}
                            </p>

                            <p>
                                <strong>Slot:</strong>{" "}
                                {verifiedBooking.parkingSlot
                                    ?.slotNumber ||
                                    "Unknown"}
                            </p>

                            <p>
                                <strong>Vehicle:</strong>{" "}
                                {verifiedBooking.vehicleNumber}
                            </p>

                            <p>
                                <strong>Start:</strong>{" "}
                                {new Date(
                                    verifiedBooking.startTime
                                ).toLocaleString()}
                            </p>

                            <p>
                                <strong>End:</strong>{" "}
                                {new Date(
                                    verifiedBooking.endTime
                                ).toLocaleString()}
                            </p>
                            

                        </div>
                        {!verifiedBooking.entryTime && (
                            <button
                                className="book-button"
                                style={{ marginTop: "20px" }}
                                onClick={handleVehicleEntry}
                            >
                                🚗 Allow Entry
                            </button>
                        )}

                        {verifiedBooking.entryTime &&
                            !verifiedBooking.exitTime && (
                                <button
                                    className="cancel-button"
                                    style={{ marginTop: "20px" }}
                                    onClick={handleVehicleExit}
                                >
                                    🚪 Mark Exit
                                </button>
                            )}

                        {verifiedBooking.exitTime && (
                            <p
                                style={{
                                    marginTop: "20px",
                                    fontWeight: "600"
                                }}
                            >
                                🔵 Vehicle exited successfully
                            </p>
                        )}

                    </div>
                )}

                {verificationError && (
                    <div className="verification-error">

                        ❌ {verificationError}

                    </div>
                )}
            </main>
        </div>
    );

    
}

export default AdminDashboard;