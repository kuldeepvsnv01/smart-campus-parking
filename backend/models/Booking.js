const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        bookingId: {
            type: String,
            unique: true,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        parkingSlot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ParkingSlot",
            required: true
        },
        vehicleNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ["active", "cancelled", "completed"],
            default: "active"
        },
        entryTime: {
            type: Date,
            default: null
        },
        exitTime: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes for performance
bookingSchema.index({ parkingSlot: 1, status: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ status: 1 });

// Validation: endTime must be after startTime
bookingSchema.pre("validate", function () {
    if (this.endTime <= this.startTime) {
        throw new Error("End time must be after start time");
    }
    if (this.exitTime && !this.entryTime) {
        throw new Error("Exit time cannot be set without entry time");
    }
    if (this.exitTime && this.entryTime && this.exitTime < this.entryTime) {
        throw new Error("Exit time must be after entry time");
    }
});

module.exports = mongoose.model("Booking", bookingSchema);