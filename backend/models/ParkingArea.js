const mongoose = require("mongoose");

const parkingAreaSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        totalSlots: {
            type: Number,
            required: true,
            min: 1
        }
    },
    {
        timestamps: true
    }
);

// Index for faster lookups when listing/searching areas
parkingAreaSchema.index({ name: 1 });

// Recalculates totalSlots from actual ParkingSlot documents
// Call this after bulk slot creation/deletion to keep counts accurate
parkingAreaSchema.methods.syncSlotCount = async function () {
    const ParkingSlot = mongoose.model("ParkingSlot");
    const count = await ParkingSlot.countDocuments({ parkingArea: this._id });
    this.totalSlots = count;
    await this.save();
    return count;
};

module.exports = mongoose.model("ParkingArea", parkingAreaSchema);