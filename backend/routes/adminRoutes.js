const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/user");
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

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = await User.create({
            name,
            email,
            password: hashedPassword,
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
        const ParkingArea = require("../models/ParkingArea");
        const ParkingSlot = require("../models/ParkingSlot");
        const Booking = require("../models/Booking");

        const totalAreas = await ParkingArea.countDocuments();

        const totalSlots = await ParkingSlot.countDocuments();

        const availableSlots = await ParkingSlot.countDocuments({
            status: "available"
        });

        const occupiedSlots = await ParkingSlot.countDocuments({
            status: "occupied"
        });

        const reservedSlots = await ParkingSlot.countDocuments({
            status: "reserved"
        });

        const blockedSlots = await ParkingSlot.countDocuments({
            status: "blocked"
        });

        const activeBookings = await Booking.countDocuments({
            status: "active"
        });

        res.status(200).json({
            totalAreas,
            totalSlots,
            availableSlots,
            reservedSlots,
            occupiedSlots,
            blockedSlots,
            activeBookings
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch admin statistics",
            error: error.message
        });
    }
});

module.exports = router;