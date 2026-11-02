const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");

const expireBookings = async () => {

    try {

        const now = new Date();

        // --------------------------------
        // 1. Find bookings that just expired (still "active" but endTime has passed)
        //    We need their slot IDs before marking them completed, so we know
        //    which slots to re-evaluate.
        // --------------------------------

        const expiredBookings = await Booking.find(
            {
                status: "active",
                endTime: { $lte: now }
            },
            "parkingSlot"
        );

        const expiredSlotIds = expiredBookings.map(
            (b) => b.parkingSlot.toString()
        );

        // Bulk-complete all expired bookings in a single query
        // instead of looping and calling .save() on each one.
        if (expiredBookings.length > 0) {
            await Booking.updateMany(
                {
                    status: "active",
                    endTime: { $lte: now }
                },
                {
                    $set: { status: "completed" }
                }
            );
        }

        // --------------------------------
        // 2. Fetch all remaining active bookings once, and compute the correct
        //    status for every slot they touch in memory (no per-booking queries).
        // --------------------------------

        const activeBookings = await Booking.find(
            { status: "active" },
            "parkingSlot startTime endTime"
        );

        const slotStatusMap = new Map(); // slotId -> "occupied" | "reserved"

        for (const booking of activeBookings) {
            const slotId = booking.parkingSlot.toString();

            if (booking.startTime <= now && booking.endTime > now) {
                // Currently in progress — occupied takes priority
                slotStatusMap.set(slotId, "occupied");
            } else if (booking.startTime > now && !slotStatusMap.has(slotId)) {
                // Future booking — reserved, unless the slot is already
                // marked occupied by a currently-in-progress booking
                slotStatusMap.set(slotId, "reserved");
            }
        }

        // --------------------------------
        // 3. Union of slots that need re-checking: slots that just had a
        //    booking expire, plus slots tied to any currently active booking.
        // --------------------------------

        const slotIdsToRecheck = new Set([
            ...expiredSlotIds,
            ...activeBookings.map((b) => b.parkingSlot.toString())
        ]);

        if (slotIdsToRecheck.size === 0) {
            return;
        }

        // --------------------------------
        // 4. Single bulk write for all slot status updates.
        //    Blocked slots are never touched (filter excludes them).
        // --------------------------------

        const bulkOps = [];

        for (const slotId of slotIdsToRecheck) {
            const newStatus = slotStatusMap.get(slotId) || "available";

            bulkOps.push({
                updateOne: {
                    filter: {
                        _id: slotId,
                        status: { $ne: "blocked" }
                    },
                    update: {
                        $set: { status: newStatus }
                    }
                }
            });
        }

        if (bulkOps.length > 0) {
            await ParkingSlot.bulkWrite(bulkOps);
        }

    } catch (error) {

        console.error(
            "Booking expiry error:",
            error
        );

    }
};

module.exports = expireBookings;