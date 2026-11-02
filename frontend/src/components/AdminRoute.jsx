import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
    const token = localStorage.getItem("token");

    let user = null;
    try {
        const rawUser = localStorage.getItem("user");
        user = rawUser ? JSON.parse(rawUser) : null;
    } catch (error) {
        console.error("Failed to parse stored user data:", error);
        user = null;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!user || user.role !== "admin") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default AdminRoute;