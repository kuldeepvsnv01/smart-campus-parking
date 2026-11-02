import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    let user = null;
    try {
        const raw = localStorage.getItem("user");
        user = raw ? JSON.parse(raw) : null;
    } catch {
        user = null;
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const isAdminView = location.pathname.startsWith("/admin");
    const isAdminUser = user?.role === "admin";

    return (
        <nav className="site-navbar">
            <div className="nav-brand-section">
                <Link
                    to={isAdminUser ? "/admin" : "/dashboard"}
                    style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "10px" }}
                >
                    <h2 style={{ margin: 0, fontSize: "22px" }}>🚗 Smart Parking</h2>
                </Link>

                {isAdminView && (
                    <span className="nav-context-badge admin-badge-tag">
                        🛡️ ADMIN PORTAL
                    </span>
                )}
                {!isAdminView && isAdminUser && (
                    <span className="nav-context-badge driver-badge-tag">
                        🚗 DRIVER PORTAL
                    </span>
                )}
            </div>

            <div className="nav-links-section">
                {isAdminView ? (
                    // ── In Admin Console: Show only Admin-specific context ──
                    <>
                        <span className="nav-current-mode-label">
                            Campus Control Mode
                        </span>

                        <Link
                            to="/dashboard"
                            className="nav-role-switch-btn"
                            title="Switch to student/staff slot reservation view"
                        >
                            🚗 Switch to Driver Mode
                        </Link>
                    </>
                ) : (
                    // ── In Driver / User Portal: Show driver booking links ──
                    <>
                        <Link
                            to="/dashboard"
                            className={location.pathname === "/dashboard" ? "nav-link-active" : ""}
                        >
                            Book a Slot
                        </Link>

                        <Link
                            to="/my-bookings"
                            className={location.pathname === "/my-bookings" ? "nav-link-active" : ""}
                        >
                            My Bookings
                        </Link>

                        {isAdminUser && (
                            <Link
                                to="/admin"
                                className="nav-admin-switch-btn"
                                title="Open Campus Parking Admin Console"
                            >
                                ⚡ Admin Console ↗
                            </Link>
                        )}
                    </>
                )}

                {user?.name && (
                    <span className="nav-user-indicator">
                        {isAdminUser ? "👑 Admin" : "👤"} {user.name}
                    </span>
                )}

                <button className="nav-logout-action" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
