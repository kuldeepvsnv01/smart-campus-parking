const express = require("express");

const User = require("../models/user");
const ParkingArea = require("../models/ParkingArea");
const ParkingSlot = require("../models/ParkingSlot");
const Booking = require("../models/Booking");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

// Create admin account
router.post("/create-admin", async (req, res) => {
    try {
        const { name, email, password, vehicleNumber } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // Password is hashed automatically by the pre("save") hook in the User model.
        // Do NOT hash it manually here — that would double-hash and break login.
        const newAdmin = await User.create({
            name,
            email,
            password,
            vehicleNumber,
            role: "admin"
        });

        res.status(201).json({
            message: "Admin created successfully",
            admin: {
                id: newAdmin._id,
                name: newAdmin.name,
                email: newAdmin.email,
                role: newAdmin.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create admin",
            error: error.message
        });
    }
});

// Protected admin dashboard test
router.get("/dashboard", protect, admin, (req, res) => {
    res.status(200).json({
        message: "Welcome to Admin Dashboard",
        admin: req.user
    });
});

router.get("/stats", protect, admin, async (req, res) => {
    try {
        const expireBookings = require("../utils/bookingExpiry");
        await expireBookings();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [slotStats, totalAreas, activeBookings, totalBookings, completedBookings, cancelledBookings, todayBookings] = await Promise.all([
            ParkingSlot.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            ParkingArea.countDocuments(),
            Booking.countDocuments({ status: "active" }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: "completed" }),
            Booking.countDocuments({ status: "cancelled" }),
            Booking.countDocuments({ createdAt: { $gte: todayStart } })
        ]);

        const statusMap = slotStats.reduce((acc, s) => {
            acc[s._id] = s.count;
            return acc;
        }, { available: 0, reserved: 0, occupied: 0, blocked: 0 });

        const totalSlots = Object.values(statusMap).reduce((a, b) => a + b, 0);
        const usedCapacity = statusMap.occupied + statusMap.reserved;
        const parkingUtilization = totalSlots > 0
            ? Number(((usedCapacity / totalSlots) * 100).toFixed(2))
            : 0;

        res.status(200).json({
            totalAreas,
            totalSlots,
            availableSlots: statusMap.available,
            reservedSlots: statusMap.reserved,
            occupiedSlots: statusMap.occupied,
            blockedSlots: statusMap.blocked,
            activeBookings,
            totalBookings,
            completedBookings,
            cancelledBookings,
            todayBookings,
            parkingUtilization
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch admin statistics",
            error: error.message
        });
    }
});

module.exports = router;