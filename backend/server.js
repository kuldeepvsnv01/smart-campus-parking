require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const parkingRoutes = require("./routes/parkingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");

const authRoutes = require("./routes/authRoutes");
const expireBookings = require("./utils/bookingExpiry");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("🚗 Smart Parking Server is Running!");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`🚗 Server running on http://localhost:${PORT}`);

    // Check expired bookings every 1 minute
    setInterval(async () => {
        await expireBookings();
    }, 60 * 1000);
});