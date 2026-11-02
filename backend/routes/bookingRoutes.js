const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");
const protect = require("../middleware/authMiddleware");
const expireBookings = require("../utils/bookingExpiry");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

// Helper to look up booking by either Mongo _id or human-readable bookingId
const findBookingByIdOrRef = async (param, populate = false) => {
    const isObjectId = mongoose.Types.ObjectId.isValid(param);
    const query = isObjectId
        ? { $or: [{ _id: param }, { bookingId: param }] }
        : { bookingId: param };

    let q = Booking.findOne(query);
    if (populate) {
        q = q.populate("user", "-password").populate({
            path: "parkingSlot",
            populate: { path: "parkingArea" }
        });
    }
    return q;
};

// Recalculates and updates the parking slot status based on real-time bookings
const updateSlotStatusAfterBookingChange = async (slotId, session = null) => {
    const slot = await ParkingSlot.findById(slotId).session(session || null);
    if (!slot || slot.status === "blocked") return;

    const now = new Date();
    const activeBooking = await Booking.findOne({
        parkingSlot: slot._id,
        status: "active",
        startTime: { $lte: now },
        endTime: { $gt: now }
    }).session(session || null);

    if (activeBooking) {
        slot.status = "occupied";
    } else {
        const futureBooking = await Booking.findOne({
            parkingSlot: slot._id,
            status: "active",
            startTime: { $gt: now }
        }).session(session || null);

        slot.status = futureBooking ? "reserved" : "available";
    }

    await slot.save(session ? { session } : {});
};

// Create a booking
router.post("/", protect, async (req, res) => {
    let session = null;
    try {
        session = await mongoose.startSession();
    } catch {
        session = null;
    }

    try {
        const { parkingSlot, startTime, endTime, vehicleNumber } = req.body;

        if (!parkingSlot || !startTime || !endTime || !vehicleNumber) {
            return res.status(400).json({
                message: "Please provide all booking details"
            });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                message: "Invalid date or time"
            });
        }

        if (end <= start) {
            return res.status(400).json({
                message: "End time must be after start time"
            });
        }

        let createdBooking;

        const executeBooking = async (sess = null) => {
            const slot = await ParkingSlot.findById(parkingSlot).session(sess);

            if (!slot) {
                throw { status: 404, message: "Parking slot not found" };
            }

            if (slot.status === "blocked") {
                throw {
                    status: 400,
                    message: "This parking slot is currently blocked"
                };
            }

            // Check for overlapping active booking
            const overlappingBooking = await Booking.findOne({
                parkingSlot,
                status: "active",
                startTime: { $lt: end },
                endTime: { $gt: start }
            }).session(sess);

            if (overlappingBooking) {
                throw {
                    status: 400,
                    message:
                        "This parking slot is already booked for the selected time"
                };
            }

            const bookingId =
                "BK-" +
                Date.now().toString(36).toUpperCase() +
                "-" +
                Math.random().toString(36).substring(2, 6).toUpperCase();

            const createOpts = sess ? { session: sess } : {};
            const bookingArr = await Booking.create(
                [
                    {
                        bookingId,
                        user: req.user.id,
                        parkingSlot,
                        vehicleNumber,
                        startTime: start,
                        endTime: end
                    }
                ],
                createOpts
            );
            createdBooking = bookingArr[0];

            const now = new Date();
            if (start <= now && end > now) {
                slot.status = "occupied";
            } else if (start > now) {
                slot.status = "reserved";
            }

            await slot.save(createOpts);
        };

        if (session) {
            try {
                await session.withTransaction(async () => {
                    await executeBooking(session);
                });
            } catch (txnError) {
                if (
                    txnError.message &&
                    (txnError.message.includes("replica set") ||
                        txnError.message.includes(
                            "Transaction numbers are only allowed"
                        ))
                ) {
                    // Fallback for standalone MongoDB environments
                    await executeBooking(null);
                } else {
                    throw txnError;
                }
            }
        } else {
            await executeBooking(null);
        }

        res.status(201).json({
            message: "Parking slot booked successfully",
            booking: createdBooking
        });

    } catch (error) {
        console.error("Booking error:", error);

        const status = error.status || 500;
        res.status(status).json({
            message: error.message || "Booking failed",
            error: error.message
        });
    } finally {
        if (session) {
            session.endSession();
        }
    }
});

// Shared booking cancellation handler
const cancelBookingHandler = async (req, res) => {
    try {
        const param = req.params.id || req.params.bookingId;
        const booking = await findBookingByIdOrRef(param);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        // Ensure booking belongs to user, or user is admin
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
                message: `Booking is already ${booking.status}`
            });
        }

        booking.status = "cancelled";
        await booking.save();

        await updateSlotStatusAfterBookingChange(booking.parkingSlot);

        res.status(200).json({
            message: "Booking cancelled successfully",
            booking
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to cancel booking",
            error: error.message
        });
    }
};

// Blueprint Section 13: PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", protect, cancelBookingHandler);
router.delete("/:id", protect, cancelBookingHandler);
router.delete("/:bookingId", protect, cancelBookingHandler);

// Verify booking QR - Admin only
router.get("/verify/:bookingId", protect, admin, async (req, res) => {
    try {
        const booking = await findBookingByIdOrRef(req.params.bookingId, true);

        if (!booking) {
            return res.status(404).json({
                valid: false,
                message: "Booking not found"
            });
        }

        if (booking.status !== "active") {
            return res.status(400).json({
                valid: false,
                message: `Booking is ${booking.status}`,
                booking
            });
        }

        const now = new Date();

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
        console.error("Booking verification error:", error);

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
        const booking = await findBookingByIdOrRef(req.params.bookingId);

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

        const updatedBooking = await findBookingByIdOrRef(booking._id, true);

        res.status(200).json({
            message: "Vehicle entry recorded successfully",
            entryTime: updatedBooking.entryTime,
            booking: updatedBooking
        });

    } catch (error) {
        console.error("Vehicle entry error:", error);

        res.status(500).json({
            message: "Failed to record vehicle entry",
            error: error.message
        });
    }
});

// Mark vehicle exit - Admin only
router.patch("/exit/:bookingId", protect, admin, async (req, res) => {
    try {
        const booking = await findBookingByIdOrRef(req.params.bookingId);

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

        await updateSlotStatusAfterBookingChange(booking.parkingSlot);

        const updatedBooking = await findBookingByIdOrRef(booking._id, true);

        res.status(200).json({
            message: "Vehicle exit recorded successfully",
            booking: updatedBooking
        });

    } catch (error) {
        console.error("Vehicle exit error:", error);

        res.status(500).json({
            message: "Failed to record vehicle exit",
            error: error.message
        });
    }
});

// Get my bookings (paginated or full list)
router.get("/my-bookings", protect, async (req, res) => {
    try {
        await expireBookings();

        const hasPagination = req.query.page !== undefined || req.query.limit !== undefined;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const skip = (page - 1) * limit;

        const total = await Booking.countDocuments({ user: req.user.id });

        let query = Booking.find({ user: req.user.id })
            .populate({
                path: "parkingSlot",
                populate: { path: "parkingArea" }
            })
            .sort({ createdAt: -1 });

        if (hasPagination) {
            query = query.skip(skip).limit(limit);
        }

        const bookings = await query;

        res.status(200).json({
            message: "Bookings fetched successfully",
            count: bookings.length,
            total,
            page: hasPagination ? page : 1,
            totalPages: hasPagination ? Math.ceil(total / limit) : 1,
            bookings
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch bookings",
            error: error.message
        });
    }
});

// Get all bookings - Admin only (paginated or full list)
router.get("/all", protect, admin, async (req, res) => {
    try {
        await expireBookings();

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 50, 200);
        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            Booking.find()
                .populate("user", "-password")
                .populate({
                    path: "parkingSlot",
                    populate: { path: "parkingArea" }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Booking.countDocuments()
        ]);

        res.status(200).json({
            message: "All bookings fetched successfully",
            count: bookings.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            bookings
        });

    } catch (error) {
        console.error("Fetch all bookings error:", error);

        res.status(500).json({
            message: "Failed to fetch all bookings",
            error: error.message
        });
    }
});

module.exports = router;