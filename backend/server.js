require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const parkingRoutes = require("./routes/parkingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const expireBookings = require("./utils/bookingExpiry");

// Fail fast with a clear message if required environment variables are missing
const requiredEnvVars = ["JWT_SECRET", "MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
    process.exit(1);
}

const app = express();

connectDB();

// Optional compression middleware
try {
    const compression = require("compression");
    app.use(compression());
} catch {
    // compression package not installed, proceed without it
}

const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "https://smart-campus-parking.vercel.app"
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
            return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/production with credentials
    },
    credentials: true
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("🚗 Smart Parking Server is Running!");
});

// 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Something went wrong" });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚗 Server running on http://localhost:${PORT}`);

    // Run one expiry sweep immediately on boot, then every 60s after that
    expireBookings().catch((err) =>
        console.error("Initial booking expiry check failed:", err)
    );

    setInterval(() => {
        expireBookings().catch((err) =>
            console.error("Scheduled booking expiry check failed:", err)
        );
    }, 60 * 1000);
});