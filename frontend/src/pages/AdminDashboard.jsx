import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axiosInstance";
import Navbar from "../components/Navbar";
import AddParkingArea from "../components/AddParkingArea";
import AddParkingSlot from "../components/AddParkingSlot";
import AllBookings from "../components/AllBookings";
import AdminParkingAreas from "../components/AdminParkingAreas";
import ManageSlots from "../components/ManageSlots";
import BulkCreateSlots from "../components/BulkCreateSlots";
import { Html5Qrcode } from "html5-qrcode";

/* ─── Modern Controlled QR Scanner (does NOT auto-start camera) ─── */
function QRScannerCard({ onScan }) {
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraStarting, setCameraStarting] = useState(false);
    const [scannerError, setScannerError] = useState("");
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");

    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);
    const onScanRef = useRef(onScan);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    // Pre-fetch available cameras on mount so user can see them
    useEffect(() => {
        Html5Qrcode.getCameras()
            .then((cams) => {
                if (cams && cams.length > 0) {
                    setAvailableCameras(cams);
                    setSelectedCameraId(cams[0].id);
                }
            })
            .catch(() => {
                // Ignore silent error on pre-fetch if permissions not yet granted
            });
    }, []);

    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                await scannerRef.current.clear();
            } catch (err) {
                console.warn("Scanner stop warning:", err);
            }
            scannerRef.current = null;
        }
        setCameraActive(false);
        setCameraStarting(false);
    };

    const startCamera = async (overrideCameraId) => {
        setScannerError("");
        setCameraStarting(true);
        // Make sure the view container is visible in DOM so Html5Qrcode calculates correct video dimensions
        setCameraActive(true);

        try {
            // Clean up any existing instance first
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                    await scannerRef.current.clear();
                } catch (_) {}
            }

            // Fetch available cameras if not already present
            let cams = availableCameras;
            if (!cams || cams.length === 0) {
                try {
                    cams = await Html5Qrcode.getCameras();
                    if (cams && cams.length > 0) {
                        setAvailableCameras(cams);
                        if (!selectedCameraId) {
                            setSelectedCameraId(cams[0].id);
                        }
                    }
                } catch (e) {
                    console.warn("Camera enumeration error:", e);
                }
            }

            const activeCamId = overrideCameraId || selectedCameraId || (cams && cams.length > 0 ? cams[0].id : null);
            // Default to device ID if known, otherwise fall back to user (front) webcam
            const cameraConfig = activeCamId ? { deviceId: { exact: activeCamId } } : { facingMode: "user" };

            const scanner = new Html5Qrcode("qr-camera-view");
            scannerRef.current = scanner;

            await scanner.start(
                cameraConfig,
                {
                    fps: 10,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1.333333
                },
                (decodedText) => {
                    console.log("QR decoded:", decodedText);
                    if (onScanRef.current) {
                        onScanRef.current(decodedText);
                    }
                },
                () => {
                    // Frame tick
                }
            );

            setCameraActive(true);
        } catch (err) {
            console.error("Camera start error, trying fallback to default user camera:", err);
            // Fallback attempt: request standard user facingMode (e.g. built-in FaceTime HD camera)
            try {
                if (scannerRef.current) {
                    try { await scannerRef.current.clear(); } catch (_) {}
                }
                const fallbackScanner = new Html5Qrcode("qr-camera-view");
                scannerRef.current = fallbackScanner;

                await fallbackScanner.start(
                    { facingMode: "user" },
                    {
                        fps: 10,
                        qrbox: { width: 220, height: 220 },
                        aspectRatio: 1.333333
                    },
                    (decodedText) => {
                        if (onScanRef.current) {
                            onScanRef.current(decodedText);
                        }
                    },
                    () => {}
                );
                setCameraActive(true);
            } catch (fallbackErr) {
                console.error("Fallback camera start failed:", fallbackErr);
                setScannerError(
                    fallbackErr?.message || err?.message || "Could not access camera. Please check browser permissions or select a different camera."
                );
                setCameraActive(false);
            }
        } finally {
            setCameraStarting(false);
        }
    };

    const handleCameraChange = async (e) => {
        const newCamId = e.target.value;
        setSelectedCameraId(newCamId);
        if (cameraActive) {
            await stopCamera();
            await startCamera(newCamId);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setScannerError("");
        try {
            const tempScanner = scannerRef.current || new Html5Qrcode("qr-camera-view");
            const decodedText = await tempScanner.scanFile(file, true);
            if (decodedText && onScanRef.current) {
                onScanRef.current(decodedText);
            }
        } catch (err) {
            console.error("File scan error:", err);
            setScannerError("No valid QR code detected in the selected image. Please try another image.");
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch(() => {});
                    }
                    scannerRef.current.clear().catch(() => {});
                } catch (_) {}
            }
        };
    }, []);

    return (
        <div className="admin-qr-card">
            <div className="card-top-bar">
                <div className="card-title-group">
                    <span className="card-badge">LIVE SCANNER</span>
                    <h3>📷 Camera QR Scanner</h3>
                </div>
                <span className={`status-pill ${cameraActive ? "status-live" : "status-idle"}`}>
                    <span className="status-dot"></span>
                    {cameraActive ? "Camera Active" : "Camera Idle"}
                </span>
            </div>

            <p className="card-desc">
                Scan driver's digital pass using your device webcam or upload a QR screenshot.
            </p>

            {/* Camera Selector (shown when multiple video sources exist) */}
            {availableCameras.length > 1 && (
                <div className="camera-select-row">
                    <label htmlFor="camera-dropdown">📷 Video Source:</label>
                    <select
                        id="camera-dropdown"
                        value={selectedCameraId}
                        onChange={handleCameraChange}
                        disabled={cameraStarting}
                        className="camera-dropdown-select"
                    >
                        {availableCameras.map((cam, idx) => (
                            <option key={cam.id} value={cam.id}>
                                {cam.label || `Camera ${idx + 1}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Viewfinder Area */}
            <div className="scanner-viewfinder-wrapper">
                <div
                    id="qr-camera-view"
                    className="scanner-view-container"
                    style={{
                        display: cameraActive ? "block" : "none",
                        width: "100%",
                        minHeight: "280px"
                    }}
                ></div>

                {!cameraActive && (
                    <div className="scanner-idle-placeholder">
                        <div className="placeholder-scan-box">
                            <span className="scan-corner top-left"></span>
                            <span className="scan-corner top-right"></span>
                            <span className="scan-corner bottom-left"></span>
                            <span className="scan-corner bottom-right"></span>
                            <div className="scan-icon-pulse">📱</div>
                        </div>
                        <p className="placeholder-text">Camera scanner is off</p>
                        <span className="placeholder-subtext">Click below to activate webcam</span>
                    </div>
                )}
            </div>

            {scannerError && (
                <div className="scanner-alert-box">
                    <span>⚠️</span>
                    <p>{scannerError}</p>
                </div>
            )}

            {/* Scanner Controls */}
            <div className="scanner-controls-row">
                {!cameraActive ? (
                    <button
                        type="button"
                        className="btn-primary-scanner"
                        onClick={() => startCamera()}
                        disabled={cameraStarting}
                    >
                        {cameraStarting ? "⏳ Activating Camera..." : "📷 Start Camera Scanner"}
                    </button>
                ) : (
                    <button
                        type="button"
                        className="btn-stop-scanner"
                        onClick={stopCamera}
                    >
                        ⏹️ Stop Camera
                    </button>
                )}

                <button
                    type="button"
                    className="btn-upload-scanner"
                    onClick={() => fileInputRef.current?.click()}
                >
                    🖼️ Upload QR Image
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                />
            </div>
        </div>
    );
}

/* ─── Admin Navigation Tabs ─── */
const TABS = [
    { id: "qr",       label: "QR Verification",   icon: "📱" },
    { id: "slots",    label: "Manage Slots",      icon: "🚗" },
    { id: "areas",    label: "Parking Areas",     icon: "🅿️" },
    { id: "add",      label: "Add Area & Slot",   icon: "➕" },
    { id: "bulk",     label: "Bulk Generate",     icon: "⚡" },
    { id: "bookings", label: "All Bookings",      icon: "📋" },
];

/* ─── Main Admin Dashboard Component ─── */
function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("qr");
    const [message, setMessage] = useState("");
    const [stats, setStats] = useState({
        totalAreas: 0,
        totalSlots: 0,
        availableSlots: 0,
        reservedSlots: 0,
        occupiedSlots: 0,
        blockedSlots: 0,
        activeBookings: 0,
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        todayBookings: 0,
        parkingUtilization: 0,
    });

    /* Verification state */
    const [verifiedBooking, setVerifiedBooking] = useState(null);
    const [verificationError, setVerificationError] = useState("");
    const [manualBookingId, setManualBookingId] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const utilization = stats.parkingUtilization !== undefined
        ? stats.parkingUtilization
        : (stats.totalSlots > 0
            ? Math.round(((stats.occupiedSlots + stats.reservedSlots) / stats.totalSlots) * 100)
            : 0);

    /* ── Fetch stats ── */
    const fetchStats = useCallback(async () => {
        try {
            const [dashRes, statsRes] = await Promise.all([
                api.get("/admin/dashboard"),
                api.get("/admin/stats"),
            ]);
            setMessage(dashRes.data.message);
            setStats(statsRes.data);
        } catch (err) {
            console.error("Admin dashboard error:", err);
            if (err.response?.status === 403) {
                setMessage("⚠️ Access denied — make sure you are logged in as admin.");
            } else {
                setMessage(err.response?.data?.message || "Failed to load dashboard");
            }
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const id = setInterval(fetchStats, 30000);
        return () => clearInterval(id);
    }, [fetchStats]);

    /* ── Verify Booking ID ── */
    const verifyBookingId = async (idToVerify) => {
        if (!idToVerify || !idToVerify.trim()) return;

        setVerifying(true);
        setVerificationError("");
        setVerifiedBooking(null);

        try {
            const cleanId = idToVerify.trim();
            const response = await api.get(`/bookings/verify/${cleanId}`);

            if (response.data.valid) {
                setVerifiedBooking(response.data.booking);
            } else {
                setVerificationError(response.data.message || "Invalid booking");
            }
        } catch (err) {
            console.error("Verification error:", err);
            setVerificationError(
                err.response?.data?.message || "Invalid or expired booking reference"
            );
        } finally {
            setVerifying(false);
        }
    };

    /* ── Handle QR Scan (Camera or File) ── */
    const handleQRScan = useCallback(async (data) => {
        let bookingId = data;
        try {
            const parsed = JSON.parse(data);
            if (parsed.bookingId) {
                bookingId = parsed.bookingId;
            }
        } catch (_) {
            bookingId = data;
        }

        setManualBookingId(bookingId);
        await verifyBookingId(bookingId);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    /* ── Vehicle Entry ── */
    const handleVehicleEntry = async () => {
        if (!verifiedBooking?.bookingId) return;
        setActionLoading(true);
        try {
            const response = await api.patch(`/bookings/entry/${verifiedBooking.bookingId}`);
            alert(response.data.message || "Vehicle entry recorded successfully!");
            setVerifiedBooking(response.data.booking);
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to record vehicle entry");
        } finally {
            setActionLoading(false);
        }
    };

    /* ── Vehicle Exit ── */
    const handleVehicleExit = async () => {
        if (!verifiedBooking?.bookingId) return;
        setActionLoading(true);
        try {
            const response = await api.patch(`/bookings/exit/${verifiedBooking.bookingId}`);
            alert(response.data.message || "Vehicle exit recorded. Slot released!");
            setVerifiedBooking(response.data.booking);
            fetchStats();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to record vehicle exit");
        } finally {
            setActionLoading(false);
        }
    };

    const clearVerification = () => {
        setVerifiedBooking(null);
        setVerificationError("");
        setManualBookingId("");
    };

    return (
        <div>
            <Navbar />

            <main className="dashboard-content">
                {/* ── Upper Section: Header (Unchanged as requested) ── */}
                <div className="admin-header">
                    <div>
                        <p className="admin-badge">ADMIN CONSOLE</p>
                        <h1>⚡ Smart Campus Control Panel</h1>
                        <p>Real-time campus parking management, slot control, and vehicle verification.</p>
                    </div>

                    <div className="admin-status">
                        <span className="live-dot"></span>
                        {message || "System Operational"}
                    </div>
                </div>

                {/* ── Upper Section: 9 Stat Cards (Unchanged as requested) ── */}
                <section className="stats admin-stats-grid">
                    <StatCard icon="🅿️" label="Parking Areas"   value={stats.totalAreas} />
                    <StatCard icon="🚗" label="Total Slots"      value={stats.totalSlots} />
                    <StatCard icon="🟢" label="Available"        value={stats.availableSlots} color="#16a34a" />
                    <StatCard icon="🟡" label="Reserved"         value={stats.reservedSlots}  color="#d97706" />
                    <StatCard icon="🔴" label="Occupied"         value={stats.occupiedSlots}  color="#dc2626" />
                    <StatCard icon="⚫" label="Blocked"          value={stats.blockedSlots}   color="#6b7280" />
                    <StatCard icon="⚡" label="Active Bookings"  value={stats.activeBookings} />
                    <StatCard icon="📅" label="Today's Bookings" value={stats.todayBookings} />
                    <StatCard icon="📊" label="Utilization"      value={`${utilization}%`} />
                </section>

                {/* ── Middle Section: Beautiful Segmented Navigation Tabs ── */}
                <div className="admin-nav-segment-container">
                    <div className="admin-nav-segment">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    className={`segment-btn ${isActive ? "is-active" : ""}`}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        if (tab.id !== "qr") {
                                            clearVerification();
                                        }
                                    }}
                                >
                                    <span className="segment-icon">{tab.icon}</span>
                                    <span className="segment-label">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Middle Section: Tab Content Panels ── */}
                <div className="admin-tab-viewport">

                    {/* TAB 1: QR & Manual Verification */}
                    {activeTab === "qr" && (
                        <div className="tab-pane-fade">
                            <div className="section-intro-bar">
                                <div>
                                    <span className="badge-subtitle">GATE CONTROL & CHECK-IN</span>
                                    <h2>📱 Ticket Verification & Gate Access</h2>
                                    <p>Scan a driver's QR code or type their Booking Reference ID to verify, check-in, or check-out.</p>
                                </div>
                            </div>

                            <div className="qr-verification-dual-grid">
                                {/* Left Card: Live QR Scanner */}
                                <QRScannerCard onScan={handleQRScan} />

                                {/* Right Card: Manual Verification & Result */}
                                <div className="admin-manual-card">
                                    <div className="card-top-bar">
                                        <div className="card-title-group">
                                            <span className="card-badge">MANUAL ENTRY</span>
                                            <h3>⌨️ Booking ID Verification</h3>
                                        </div>
                                        <span className="status-pill status-fast">
                                            ⚡ Instant Search
                                        </span>
                                    </div>

                                    <p className="card-desc">
                                        Enter driver's Booking Reference ID (e.g. <code>BK-9872</code>) or Mongo ID to verify.
                                    </p>

                                    {/* Manual Form */}
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            verifyBookingId(manualBookingId);
                                        }}
                                        className="manual-verify-form"
                                    >
                                        <div className="search-input-wrap">
                                            <span className="input-prefix-icon">🔍</span>
                                            <input
                                                type="text"
                                                className="manual-id-input"
                                                placeholder="e.g. BK-9872"
                                                value={manualBookingId}
                                                onChange={(e) => setManualBookingId(e.target.value.toUpperCase())}
                                            />
                                            {manualBookingId && (
                                                <button
                                                    type="button"
                                                    className="input-clear-btn"
                                                    onClick={() => setManualBookingId("")}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn-verify-action"
                                            disabled={verifying || !manualBookingId.trim()}
                                        >
                                            {verifying ? "Verifying..." : "Verify Booking"}
                                        </button>
                                    </form>

                                    {/* Error Banner */}
                                    {verificationError && (
                                        <div className="verify-error-banner">
                                            <div className="error-icon">❌</div>
                                            <div className="error-text">
                                                <strong>Verification Failed</strong>
                                                <p>{verificationError}</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="banner-close-btn"
                                                onClick={() => setVerificationError("")}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    {/* Verification Success Ticket Card */}
                                    {verifiedBooking ? (
                                        <div className="verified-ticket-card">
                                            <div className="ticket-header">
                                                <div className="ticket-title-row">
                                                    <span className="ticket-check-badge">✅ VALID PASS</span>
                                                    <span className="ticket-id-tag">{verifiedBooking.bookingId}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="ticket-dismiss-btn"
                                                    onClick={clearVerification}
                                                    title="Scan next booking"
                                                >
                                                    🔄 Scan Next
                                                </button>
                                            </div>

                                            <div className="ticket-details-grid">
                                                <div className="ticket-cell">
                                                    <span className="cell-label">👤 Driver Name</span>
                                                    <strong className="cell-value">{verifiedBooking.user?.name || "Campus Guest"}</strong>
                                                </div>

                                                <div className="ticket-cell">
                                                    <span className="cell-label">🚘 Vehicle Number</span>
                                                    <strong className="cell-value plate-number">{verifiedBooking.vehicleNumber}</strong>
                                                </div>

                                                <div className="ticket-cell">
                                                    <span className="cell-label">🅿️ Parking Area</span>
                                                    <strong className="cell-value">{verifiedBooking.parkingSlot?.parkingArea?.name || "Main Campus"}</strong>
                                                </div>

                                                <div className="ticket-cell">
                                                    <span className="cell-label">📍 Assigned Slot</span>
                                                    <strong className="cell-value slot-highlight">{verifiedBooking.parkingSlot?.slotNumber || "N/A"}</strong>
                                                </div>

                                                <div className="ticket-cell">
                                                    <span className="cell-label">⏱️ Start Window</span>
                                                    <strong className="cell-value time-val">{new Date(verifiedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</strong>
                                                </div>

                                                <div className="ticket-cell">
                                                    <span className="cell-label">🏁 End Window</span>
                                                    <strong className="cell-value time-val">{new Date(verifiedBooking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</strong>
                                                </div>
                                            </div>

                                            {/* Gate Action Buttons */}
                                            <div className="ticket-action-row">
                                                {!verifiedBooking.entryTime && (
                                                    <button
                                                        type="button"
                                                        className="btn-gate-entry"
                                                        onClick={handleVehicleEntry}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? "Processing..." : "🚗 Record Vehicle Entry"}
                                                    </button>
                                                )}

                                                {verifiedBooking.entryTime && !verifiedBooking.exitTime && (
                                                    <button
                                                        type="button"
                                                        className="btn-gate-exit"
                                                        onClick={handleVehicleExit}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? "Processing..." : "🚪 Record Vehicle Exit"}
                                                    </button>
                                                )}

                                                {verifiedBooking.exitTime && (
                                                    <div className="ticket-completed-flag">
                                                        <span>🔵 Vehicle Exited & Slot Released</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        !verificationError && (
                                            <div className="manual-waiting-state">
                                                <div className="waiting-icon">📋</div>
                                                <p>Ready to verify ticket.</p>
                                                <span>Scan a barcode/QR code on the left or enter a Booking ID above.</span>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Manage Slots */}
                    {activeTab === "slots" && (
                        <div className="tab-pane-fade">
                            <ManageSlots />
                        </div>
                    )}

                    {/* TAB 3: Parking Areas */}
                    {activeTab === "areas" && (
                        <div className="tab-pane-fade">
                            <AdminParkingAreas />
                        </div>
                    )}

                    {/* TAB 4: Add Area & Add Slot (Balanced 2-Column Grid) */}
                    {activeTab === "add" && (
                        <div className="tab-pane-fade">
                            <div className="section-intro-bar">
                                <div>
                                    <span className="badge-subtitle">INFRASTRUCTURE SETUP</span>
                                    <h2>➕ Create Parking Capacity</h2>
                                    <p>Add a new parking zone or append individual parking slots to an existing zone.</p>
                                </div>
                            </div>

                            <div className="dual-form-grid">
                                <div>
                                    <AddParkingArea onAreaAdded={fetchStats} />
                                </div>
                                <div>
                                    <AddParkingSlot onSlotAdded={fetchStats} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 5: Bulk Generate Slots */}
                    {activeTab === "bulk" && (
                        <div className="tab-pane-fade">
                            <BulkCreateSlots />
                        </div>
                    )}

                    {/* TAB 6: All Bookings */}
                    {activeTab === "bookings" && (
                        <div className="tab-pane-fade">
                            <AllBookings />
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

/* ─── Stat Card Helper (Matches existing visual style) ─── */
function StatCard({ icon, label, value, color }) {
    return (
        <div className="stat-card">
            <h3>{icon}</h3>
            <p>{label}</p>
            <strong style={color ? { color } : {}}>{value}</strong>
        </div>
    );
}

export default AdminDashboard;
