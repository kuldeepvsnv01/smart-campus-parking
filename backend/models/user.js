const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false // never return password by default in queries
        },
        vehicleNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        }
    },
    {
        timestamps: true
    }
);

// Hash password automatically before saving, only if it changed
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Helper method to compare password during login (supports legacy plaintext auto-upgrade)
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    const isBcrypt = this.password.startsWith("$2a$") || this.password.startsWith("$2b$") || this.password.startsWith("$2y$");
    if (!isBcrypt) {
        if (candidatePassword === this.password) {
            this.password = candidatePassword;
            await this.save();
            return true;
        }
        return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);