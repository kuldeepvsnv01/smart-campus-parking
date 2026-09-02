import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(
                "http://localhost:5001/api/auth/register",
                {
                    name,
                    email,
                    password,
                    vehicleNumber
                }
            );

            console.log(response.data);

            alert("Registration successful!");

            // Go to login after registration
            navigate("/login");

        } catch (error) {
            console.error(error);

            alert(
                error.response?.data?.message ||
                "Registration failed"
            );
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
                        Park Smarter.
                        <br />
                        Travel Better.
                    </h1>

                    <p>
                        Create your account and start
                        booking parking slots easily.
                    </p>

                    <div className="auth-feature">
                        🅿️
                        <span>
                            Find available parking
                        </span>
                    </div>

                    <div className="auth-feature">
                        📅
                        <span>
                            Book your parking slot
                        </span>
                    </div>

                    <div className="auth-feature">
                        🔒
                        <span>
                            Secure and simple
                        </span>
                    </div>

                </div>

            </div>

            {/* Right Side */}
            <div className="auth-form-section">

                <div className="auth-card">

                    <div className="auth-card-header">

                        <h2>
                            Create your account
                        </h2>

                        <p>
                            Enter your details to get started
                        </p>

                    </div>

                    <form onSubmit={handleRegister}>

                        {/* Name */}

                        <div className="auth-form-group">

                            <label>
                                Full Name
                            </label>

                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) =>
                                    setName(e.target.value)
                                }
                                required
                            />

                        </div>

                        {/* Email */}

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

                        {/* Password */}

                        <div className="auth-form-group">

                            <label>
                                Password
                            </label>

                            <input
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                                required
                            />

                        </div>

                        {/* Vehicle */}

                        <div className="auth-form-group">

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
                                required
                            />

                        </div>

                        <button
                            type="submit"
                            className="auth-submit-button"
                        >
                            Create Account
                        </button>

                    </form>

                    <div className="auth-footer">

                        <p>
                            Already have an account?
                        </p>

                        <Link to="/login">
                            Login
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

export default Register;