const Booking = require("../models/Booking");
const ParkingSlot = require("../models/ParkingSlot");

const expireBookings = async () => {

    try {

        const now = new Date();

        // --------------------------------
        // 1. Complete expired bookings
        // --------------------------------

        const expiredBookings = await Booking.find({
            status: "active",
            endTime: {
                $lte: now
            }
        });

        for (const booking of expiredBookings) {

            booking.status = "completed";

            await booking.save();

            const slot = await ParkingSlot.findById(
                booking.parkingSlot
            );

            if (!slot || slot.status === "blocked") {
                continue;
            }

            // Check if another booking is currently active
            const currentBooking = await Booking.findOne({
                parkingSlot: booking.parkingSlot,
                status: "active",
                startTime: {
                    $lte: now
                },
                endTime: {
                    $gt: now
                }
            });

            if (currentBooking) {

                slot.status = "occupied";

            } else {

                // Check if another future booking exists
                const futureBooking = await Booking.findOne({
                    parkingSlot: booking.parkingSlot,
                    status: "active",
                    startTime: {
                        $gt: now
                    }
                }).sort({
                    startTime: 1
                });

                if (futureBooking) {

                    slot.status = "reserved";

                } else {

                    slot.status = "available";

                }
            }

            await slot.save();
        }


        // --------------------------------
        // 2. Activate current bookings
        // --------------------------------

        const currentBookings = await Booking.find({
            status: "active",
            startTime: {
                $lte: now
            },
            endTime: {
                $gt: now
            }
        });

        for (const booking of currentBookings) {

            const slot = await ParkingSlot.findById(
                booking.parkingSlot
            );

            if (slot && slot.status !== "blocked") {

                slot.status = "occupied";

                await slot.save();

            }
        }


        // --------------------------------
        // 3. Mark future bookings reserved
        // --------------------------------

        const futureBookings = await Booking.find({
            status: "active",
            startTime: {
                $gt: now
            }
        });

        for (const booking of futureBookings) {

            const slot = await ParkingSlot.findById(
                booking.parkingSlot
            );

            if (slot && slot.status !== "blocked") {

                slot.status = "reserved";

                await slot.save();

            }
        }

    } catch (error) {

        console.error(
            "Booking expiry error:",
            error
        );

    }
};

module.exports = expireBookings;