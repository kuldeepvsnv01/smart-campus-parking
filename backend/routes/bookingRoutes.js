const express = require("express");
const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const protect = require("../middleware/authMiddleware");
const expireBookings = require("../utils/bookingExpiry");

const admin = require("../middleware/adminMiddleware");

const router = express.Router();

// Create a booking
router.post("/", protect, async (req, res) => {
    try {
        const {
            parkingSlot,
            startTime,
            endTime,
            vehicleNumber
        } = req.body;

        // Check required fields
        if (
            !parkingSlot ||
            !startTime ||
            !endTime ||
            !vehicleNumber
        ) {
            return res.status(400).json({
                message: "Please provide all booking details"
            });
        }

        // Convert times to Date objects
        const start = new Date(startTime);
        const end = new Date(endTime);

        // Validate dates
        if (
            isNaN(start.getTime()) ||
            isNaN(end.getTime())
        ) {
            return res.status(400).json({
                message: "Invalid date or time"
            });
        }

        // End time must be after start time
        if (end <= start) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        // Find parking slot
        const slot = await ParkingSlot.findById(
            parkingSlot
        );

        if (!slot) {
            return res.status(404).json({
                message: "Parking slot not found"
            });
        }

        if (slot.status === "blocked") {
            return res.status(400).json({
                message: "This parking slot is currently blocked"
        });
}

        // Check for overlapping active booking
        const overlappingBooking =
            await Booking.findOne({
                parkingSlot: parkingSlot,
                status: "active",

                startTime: {
                    $lt: end
                },

                endTime: {
                    $gt: start
                }
            });
            if (overlappingBooking) {
                return res.status(400).json({
                    message:
                        "This parking slot is already booked for the selected time"
                });
            }

        // if (overlappingBooking) {
        //     return res.status(400).json({
        //         message:
        //             "This parking slot is already booked for the selected time"
        //     });
        // }

        // Create booking
        const bookingId =
            "BK-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 6)
                .toUpperCase();

        const booking = await Booking.create({
            bookingId,
            user: req.user.id,
            parkingSlot,
            vehicleNumber,
            startTime: start,
            endTime: end
        });

        // Only mark the slot occupied if the booking
        // is currently in progress.

        const now = new Date();

        if (start <= now && end > now) {

            slot.status = "occupied";

        } else if (start > now) {

            slot.status = "reserved";

        }

        await slot.save();
        res.status(201).json({
            message: "Parking slot booked successfully",
            booking
        });

    } catch (error) {

        console.error(
            "Booking error:",
            error
        );

        res.status(500).json({
            message: "Booking failed",
            error: error.message
        });
    }
});


// Cancel a booking
router.delete("/:bookingId", protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Make sure the booking belongs to the logged-in user
        if (
            booking.user.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                message: "You are not allowed to cancel this booking"
            });
        }

        if (booking.status !== "active") {
            return res.status(400).json({
                message: "Booking is already cancelled or completed"
            });
        }

        // Change booking status
        booking.status = "cancelled";
        await booking.save();

        // Make parking slot available again
        const slot = await ParkingSlot.findById(booking.parkingSlot);

        if (slot) {
            slot.status = "available";
            await slot.save();
        }

        res.status(200).json({
            message: "Booking cancelled successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to cancel booking",
            error: error.message
        });
    }
});
// Verify booking QR - Admin only
router.get("/verify/:bookingId", protect, admin, async (req, res) => {
    try {

        const booking = await Booking.findOne({
            bookingId: req.params.bookingId
        })
        .populate("user", "-password")
        .populate({
            path: "parkingSlot",
            populate: {
                path: "parkingArea"
            }
        });

        if (!booking) {
            return res.status(404).json({
                valid: false,
                message: "Booking not found"
            });
        }

        // Check booking status
        if (booking.status !== "active") {
            return res.status(400).json({
                valid: false,
                message: `Booking is ${booking.status}`
            });
        }

        const now = new Date();

        // Check booking time
        if (now < booking.startTime) {
            return res.status(400).json({
                valid: false,
                message: "Booking has not started yet",
                booking
            });
        }

        if (now >= booking.endTime) {
            return res.status(400).json({
                valid: false,
                message: "Booking has expired",
                booking
            });
        }

        res.status(200).json({
            valid: true,
            message: "Valid booking",
            booking
        });

    } catch (error) {

        console.error(
            "Booking verification error:",
            error
        );

        res.status(500).json({
            valid: false,
            message: "Failed to verify booking",
            error: error.message
        });
    }
});

// Mark vehicle entry - Admin only
router.patch("/entry/:bookingId", protect, admin, async (req, res) => {
    try {

        const booking = await Booking.findOne({
            bookingId: req.params.bookingId
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        if (booking.status !== "active") {
            return res.status(400).json({
                message: `Booking is ${booking.status}`
            });
        }

        if (booking.entryTime) {
            return res.status(400).json({
                message: "Vehicle has already entered"
            });
        }

        const now = new Date();

        if (now < booking.startTime) {
            return res.status(400).json({
                message: "Booking has not started yet"
            });
        }

        if (now >= booking.endTime) {
            return res.status(400).json({
                message: "Booking has expired"
            });
        }

        booking.entryTime = now;

        await booking.save();

        const updatedBooking = await Booking.findById(
            booking._id
        )
            .populate("user", "-password")
            .populate({
                path: "parkingSlot",
                populate: {
                    path: "parkingArea"
                }
            });

        res.status(200).json({
            message: "Vehicle entry recorded successfully",
            entryTime: updatedBooking.entryTime,
            booking: updatedBooking
        });

    } catch (error) {

        console.error(
            "Vehicle entry error:",
            error
        );

        res.status(500).json({
            message: "Failed to record vehicle entry",
            error: error.message
        });
    }
});

// Mark vehicle exit - Admin only
router.patch("/exit/:bookingId", protect, admin, async (req, res) => {
    try {

        const booking = await Booking.findOne({
            bookingId: req.params.bookingId
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        if (booking.status !== "active") {
            return res.status(400).json({
                message: `Booking is ${booking.status}`
            });
        }

        if (!booking.entryTime) {
            return res.status(400).json({
                message: "Vehicle has not entered yet"
            });
        }

        if (booking.exitTime) {
            return res.status(400).json({
                message: "Vehicle has already exited"
            });
        }

        const now = new Date();

        booking.exitTime = now;
        booking.status = "completed";

        await booking.save();

        // Make parking slot available
        const slot = await ParkingSlot.findById(
            booking.parkingSlot
        );

        if (slot) {
            slot.status = "available";
            await slot.save();
        }

        // Fetch booking again WITH all required data
        const updatedBooking = await Booking.findById(
            booking._id
        )
            .populate("user", "-password")
            .populate({
                path: "parkingSlot",
                populate: {
                    path: "parkingArea"
                }
            });

        console.log(
            "UPDATED BOOKING:",
            JSON.stringify(updatedBooking, null, 2)
        );

        res.status(200).json({
            message: "Vehicle exit recorded successfully",
            booking: updatedBooking
        });

    } catch (error) {

        console.error(
            "Vehicle exit error:",
            error
        );

        res.status(500).json({
            message: "Failed to record vehicle exit",
            error: error.message
        });
    }
});

// Get my bookings
router.get("/my-bookings", protect, async (req, res) => {
    try {

        await expireBookings();

        const bookings = await Booking.find({
            user: req.user.id
        })
        .populate({
            path: "parkingSlot",
            populate: {
                path: "parkingArea"
            }
        })
        .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Bookings fetched successfully",
            count: bookings.length,
            bookings
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch bookings",
            error: error.message
        });
    }
});

// Get all bookings - Admin only
router.get("/all", protect, admin, async (req, res) => {
    try {

        await expireBookings();

        const bookings = await Booking.find()
            .populate("user", "-password")
            .populate({
                path: "parkingSlot",
                populate: {
                    path: "parkingArea"
                }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "All bookings fetched successfully",
            count: bookings.length,
            bookings
        });

    } catch (error) {

        console.error(
            "Fetch all bookings error:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch all bookings",
            error: error.message
        });
    }
});

module.exports = router;