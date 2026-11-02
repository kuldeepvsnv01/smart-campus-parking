/**
 * make-admin.js — Run once to create or promote an admin account.
 * Usage:  node scripts/make-admin.js <email>
 *  OR  :  node scripts/make-admin.js --create <name> <email> <password> <vehicleNumber>
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("../models/user");

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const args = process.argv.slice(2);

    if (args[0] === "--create") {
        // Create a brand-new admin
        const [, name, email, password, vehicleNumber] = args;
        if (!name || !email || !password || !vehicleNumber) {
            console.error("Usage: node scripts/make-admin.js --create <name> <email> <password> <vehicleNumber>");
            process.exit(1);
        }
        const existing = await User.findOne({ email });
        if (existing) {
            existing.role = "admin";
            await existing.save();
            console.log(`✅ Promoted existing user to admin: ${email}`);
        } else {
            await User.create({ name, email, password, vehicleNumber, role: "admin" });
            console.log(`✅ Admin account created: ${email}`);
        }
    } else {
        // Promote an existing user by email
        const email = args[0];
        if (!email) {
            console.error("Usage: node scripts/make-admin.js <existing-email>");
            process.exit(1);
        }
        const user = await User.findOne({ email });
        if (!user) {
            console.error(`❌ No user found with email: ${email}`);
            process.exit(1);
        }
        user.role = "admin";
        await user.save();
        console.log(`✅ User promoted to admin: ${user.name} (${user.email})`);
    }

    await mongoose.disconnect();
    console.log("🔌 Disconnected. Done.");
}

run().catch(err => {
    console.error("❌ Error:", err.message);
    process.exit(1);
});

