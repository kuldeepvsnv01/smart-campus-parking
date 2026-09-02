const mongoose = require("mongoose");

const parkingSlotSchema = new mongoose.Schema(
    {
        slotNumber: {
            type: String,
            required: true,
            trim: true
        },

        parkingArea: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ParkingArea",
            required: true
        },

        status: {
            type: String,
            enum: ["available", "reserved", "occupied", "blocked"],
            default: "available"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("ParkingSlot", parkingSlotSchema);