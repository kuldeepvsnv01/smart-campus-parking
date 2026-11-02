import { useState } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/auth/login", {
                email,
                password
            });

            // Save JWT token and user info
            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            alert("Login successful!");

            // Redirect based on role
            if (response.data.user.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/dashboard");
            }

        } catch (error) {
            console.error(error);
            alert(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">

            {/* Left Side */}
            <div className="auth-info">

                <Link
                    to="/"
                    className="auth-logo"
                >
                    🚗 Smart Parking
                </Link>

                <div className="auth-info-content">

                    <p className="auth-label">
                        SMART CAMPUS PARKING
                    </p>

                    <h1>
                        Welcome Back!
                    </h1>

                    <p>
                        Login to find and book your
                        parking slot easily.
                    </p>

                    <div className="auth-feature">
                        🅿️
                        <span>
                            Find available parking
                        </span>
                    </div>

                    <div className="auth-feature">
                        ⚡
                        <span>
                            Book your slot quickly
                        </span>
                    </div>

                    <div className="auth-feature">
                        🔒
                        <span>
                            Secure account
                        </span>
                    </div>

                </div>

            </div>

            {/* Right Side */}
            <div className="auth-form-section">

                <div className="auth-card">

                    <div className="auth-card-header">

                        <h2>
                            Login to your account
                        </h2>

                        <p>
                            Enter your details to continue
                        </p>

                    </div>

                    <form onSubmit={handleLogin}>

                        <div className="auth-form-group">

                            <label>
                                Email Address
                            </label>

                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                required
                            />

                        </div>

                        <div className="auth-form-group">

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                        </div>

                        <button
                            type="submit"
                            className="auth-submit-button"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>

                    </form>

                    <div className="auth-footer">

                        <p>
                            Don't have an account?
                        </p>

                        <Link to="/register">
                            Create an account
                        </Link>

                    </div>

                    <Link
                        to="/"
                        className="back-home"
                    >
                        ← Back to Home
                    </Link>

                </div>

            </div>

        </div>
    );
}

export default Login;