const express = require("express");
const ParkingArea = require("../models/ParkingArea");
const ParkingSlot = require("../models/ParkingSlot");
const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");
const Booking = require("../models/Booking");
const expireBookings = require("../utils/bookingExpiry");

const router = express.Router();

// Create a parking area
router.post("/areas", protect, admin, async (req, res) => {
    try {
        const { name, location, totalSlots } = req.body;

        const parkingArea = await ParkingArea.create({
            name,
            location,
            totalSlots
        });

        res.status(201).json({
            message: "Parking area created successfully",
            parkingArea
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create parking area",
            error: error.message
        });
    }
});


// Create a parking slot
router.post("/slots", protect, admin, async (req, res) => {
    try {
        const { slotNumber, parkingArea } = req.body;

        const slot = await ParkingSlot.create({
            slotNumber,
            parkingArea
        });

        // Keep ParkingArea.totalSlots in sync with actual slot count
        const area = await ParkingArea.findById(parkingArea);
        if (area) {
            await area.syncSlotCount();
        }

        res.status(201).json({
            message: "Parking slot created successfully",
            slot
        });

    } catch (error) {
        // Duplicate slotNumber within the same parkingArea (unique index)
        if (error.code === 11000) {
            return res.status(400).json({
                message: "A slot with this number already exists in this parking area"
            });
        }

        res.status(500).json({
            message: "Failed to create parking slot",
            error: error.message
        });
    }
});

// Create multiple parking slots
router.post("/slots/bulk", protect, admin, async (req, res) => {
    try {
        const { parkingArea, totalSlots } = req.body;

        if (!parkingArea || !totalSlots) {
            return res.status(400).json({
                message: "Parking area and total slots are required"
            });
        }

        if (totalSlots < 1) {
            return res.status(400).json({
                message: "Total slots must be at least 1"
            });
        }

        const slots = [];

        for (let i = 1; i <= totalSlots; i++) {
            slots.push({
                slotNumber: `A${i}`,
                parkingArea
            });
        }

        // Check which slots already exist
        const existingSlots = await ParkingSlot.find({
            parkingArea,
            slotNumber: {
                $in: slots.map(slot => slot.slotNumber)
            }
        });

        const existingSlotNumbers = new Set(
            existingSlots.map(slot => slot.slotNumber)
        );

        const newSlots = slots.filter(
            slot => !existingSlotNumbers.has(slot.slotNumber)
        );

        if (newSlots.length === 0) {
            return res.status(400).json({
                message: "All requested slots already exist"
            });
        }

        const createdSlots = await ParkingSlot.insertMany(
            newSlots
        );

        // Keep ParkingArea.totalSlots in sync with actual slot count
        const area = await ParkingArea.findById(parkingArea);
        if (area) {
            await area.syncSlotCount();
        }

        res.status(201).json({
            message: "Parking slots created successfully",
            count: createdSlots.length,
            slots: createdSlots
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create parking slots",
            error: error.message
        });
    }
});

// Get all slots of a parking area
router.get("/areas/:areaId/slots", async (req, res) => {
    try {
        await expireBookings();

        const { areaId } = req.params;

        const slots = await ParkingSlot.find({
            parkingArea: areaId
        })
        .populate("parkingArea")
        .sort({ slotNumber: 1 });

        const now = new Date();

        const slotIds = slots.map(
            (slot) => slot._id
        );

        // Get active bookings for these slots
        const bookings = await Booking.find({
            parkingSlot: {
                $in: slotIds
            },
            status: "active",
            endTime: {
                $gt: now
            }
        }).sort({
            startTime: 1
        });

        // Add booking information to each slot
        const slotsWithBookingInfo = slots.map(
            (slot) => {

                const slotBookings = bookings.filter(
                    (booking) =>
                        booking.parkingSlot.toString() ===
                        slot._id.toString()
                );

                const currentBooking =
                    slotBookings.find(
                        (booking) =>
                            new Date(booking.startTime) <= now &&
                            new Date(booking.endTime) > now
                    );

                const futureBooking =
                    slotBookings.find(
                        (booking) =>
                            new Date(booking.startTime) > now
                    );

                return {
                    ...slot.toObject(),

                    currentBooking: currentBooking || null,

                    futureBooking: futureBooking || null
                };
            }
        );

        res.status(200).json({
            message: "Parking slots fetched successfully",
            count: slotsWithBookingInfo.length,
            slots: slotsWithBookingInfo
        });

    } catch (error) {

        console.error(
            "FETCH SLOTS ERROR:",
            error
        );

        res.status(500).json({
            message: "Failed to fetch parking slots",
            error: error.message
        });
    }
});

// Get available slots for a specific time period
router.get(
    "/areas/:areaId/available-slots",
    async (req, res) => {

        try {

            const { areaId } = req.params;
            const { startTime, endTime } = req.query;

            // Check required times
            if (!startTime || !endTime) {
                return res.status(400).json({
                    message:
                        "Start time and end time are required"
                });
            }

            const start = new Date(startTime);
            const end = new Date(endTime);

            // Validate dates
            if (
                isNaN(start.getTime()) ||
                isNaN(end.getTime())
            ) {
                return res.status(400).json({
                    message:
                        "Invalid start time or end time"
                });
            }

            // End must be after start
            if (end <= start) {
                return res.status(400).json({
                    message:
                        "End time must be after start time"
                });
            }

            // Get all slots in this parking area
            const slots = await ParkingSlot.find({
                parkingArea: areaId
            })
            .populate("parkingArea")
            .sort({
                slotNumber: 1
            });

            // Blocked slots are never available
            const candidateSlots = slots.filter(
                (slot) => slot.status !== "blocked"
            );

            const slotIds = candidateSlots.map(
                (slot) => slot._id
            );

            // Single batched query for all overlapping bookings across every
            // candidate slot, instead of one query per slot (N+1 fix)
            const overlappingBookings = await Booking.find({
                parkingSlot: { $in: slotIds },
                status: "active",
                startTime: { $lt: end },
                endTime: { $gt: start }
            });

            const bookedSlotIds = new Set(
                overlappingBookings.map(
                    (booking) => booking.parkingSlot.toString()
                )
            );

            const availableSlots = candidateSlots.filter(
                (slot) => !bookedSlotIds.has(slot._id.toString())
            );

            res.status(200).json({
                message:
                    "Available slots fetched successfully",

                count:
                    availableSlots.length,

                slots:
                    availableSlots
            });

        } catch (error) {

            console.error(
                "AVAILABLE SLOTS ERROR:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to fetch available slots",

                error:
                    error.message
            });
        }
    }
);

// Get all parking areas
router.get("/areas", async (req, res) => {
    try {
        const areas = await ParkingArea.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Parking areas fetched successfully",
            count: areas.length,
            areas
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch parking areas",
            error: error.message
        });
    }
});

// Get occupancy stats per parking area
router.get("/areas/stats", async (req, res) => {
    try {
        await expireBookings();

        const slotStats = await ParkingSlot.aggregate([
            {
                $group: {
                    _id: {
                        parkingArea: "$parkingArea",
                        status: "$status"
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = {};

        for (const item of slotStats) {
            if (!item._id.parkingArea) continue;
            const areaId = item._id.parkingArea.toString();
            if (!stats[areaId]) {
                stats[areaId] = {
                    total: 0,
                    available: 0,
                    occupied: 0,
                    reserved: 0,
                    blocked: 0
                };
            }
            stats[areaId].total += item.count;
            if (item._id.status === "available") stats[areaId].available = item.count;
            if (item._id.status === "occupied") stats[areaId].occupied = item.count;
            if (item._id.status === "reserved") stats[areaId].reserved = item.count;
            if (item._id.status === "blocked") stats[areaId].blocked = item.count;
        }

        res.status(200).json({
            message: "Parking area stats fetched successfully",
            stats
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch parking area stats",
            error: error.message
        });
    }
});

// Block / Unblock parking slot
router.patch(
    "/slots/:slotId/status",
    protect,
    admin,
    async (req, res) => {
        try {
            const { status } = req.body;

            if (!["available", "blocked"].includes(status)) {
                return res.status(400).json({
                    message: "Invalid slot status"
                });
            }

            const slot = await ParkingSlot.findById(
                req.params.slotId
            );

            if (!slot) {
                return res.status(404).json({
                    message: "Parking slot not found"
                });
            }

            // Don't allow blocking an occupied slot
            if (
                status === "blocked" &&
                slot.status === "occupied"
            ) {
                return res.status(400).json({
                    message:
                        "Cannot block an occupied parking slot"
                });
            }

            slot.status = status;

            await slot.save();

            res.status(200).json({
                message:
                    status === "blocked"
                        ? "Parking slot blocked successfully"
                        : "Parking slot unblocked successfully",
                slot
            });

        } catch (error) {
            console.error(
                "Update slot status error:",
                error
            );

            res.status(500).json({
                message: "Failed to update slot status",
                error: error.message
            });
        }
    }
);

// Block / Unblock parking slot - Admin only
// NOTE: functionally overlaps with PATCH /slots/:slotId/status above.
// Kept both since the frontend may already call one or the other —
// worth consolidating to a single route before final submission.
router.patch(
    "/slots/:slotId/block",
    protect,
    admin,
    async (req, res) => {
        try {

            const slot = await ParkingSlot.findById(
                req.params.slotId
            );

            if (!slot) {
                return res.status(404).json({
                    message: "Parking slot not found"
                });
            }

            // Don't allow blocking an occupied slot
            if (
                slot.status === "occupied" &&
                req.body.action === "block"
            ) {
                return res.status(400).json({
                    message:
                        "Cannot block an occupied parking slot"
                });
            }

            if (req.body.action === "block") {

                slot.status = "blocked";

            } else if (req.body.action === "unblock") {

                slot.status = "available";

            } else {

                return res.status(400).json({
                    message:
                        "Action must be block or unblock"
                });
            }

            await slot.save();

            res.status(200).json({
                message:
                    req.body.action === "block"
                        ? "Parking slot blocked successfully"
                        : "Parking slot unblocked successfully",
                slot
            });

        } catch (error) {

            console.error(
                "Block/unblock slot error:",
                error
            );

            res.status(500).json({
                message:
                    "Failed to update parking slot",
                error: error.message
            });
        }
    }
);

module.exports = router;