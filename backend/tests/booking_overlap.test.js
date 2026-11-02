const test = require("node:test");
const assert = require("node:assert");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Test 1: Smart Time-Based Overlap Detection Logic
// Two intervals [s1, e1] and [s2, e2] overlap iff s1 < e2 && e1 > s2
function checkOverlap(reqStart, reqEnd, existingStart, existingEnd) {
    const s1 = new Date(reqStart).getTime();
    const e1 = new Date(reqEnd).getTime();
    const s2 = new Date(existingStart).getTime();
    const e2 = new Date(existingEnd).getTime();
    return s1 < e2 && e1 > s2;
}

test("Smart Time-Based Availability - Overlap Prevention", async (t) => {
    const existingStart = "2026-10-06T10:00:00Z";
    const existingEnd = "2026-10-06T11:00:00Z";

    await t.test("detects partial overlap (10:30 - 11:30)", () => {
        const overlap = checkOverlap("2026-10-06T10:30:00Z", "2026-10-06T11:30:00Z", existingStart, existingEnd);
        assert.strictEqual(overlap, true);
    });

    await t.test("detects fully enclosed booking (10:15 - 10:45)", () => {
        const overlap = checkOverlap("2026-10-06T10:15:00Z", "2026-10-06T10:45:00Z", existingStart, existingEnd);
        assert.strictEqual(overlap, true);
    });

    await t.test("detects fully enclosing booking (09:30 - 11:30)", () => {
        const overlap = checkOverlap("2026-10-06T09:30:00Z", "2026-10-06T11:30:00Z", existingStart, existingEnd);
        assert.strictEqual(overlap, true);
    });

    await t.test("allows non-overlapping prior booking (08:00 - 10:00)", () => {
        const overlap = checkOverlap("2026-10-06T08:00:00Z", "2026-10-06T10:00:00Z", existingStart, existingEnd);
        assert.strictEqual(overlap, false);
    });

    await t.test("allows non-overlapping subsequent booking (11:00 - 12:00)", () => {
        const overlap = checkOverlap("2026-10-06T11:00:00Z", "2026-10-06T12:00:00Z", existingStart, existingEnd);
        assert.strictEqual(overlap, false);
    });
});

test("Parking Utilization Analytics Formula", () => {
    function computeUtilization(total, occupied, reserved) {
        if (!total || total <= 0) return 0;
        return Number((((occupied + reserved) / total) * 100).toFixed(2));
    }

    assert.strictEqual(computeUtilization(100, 30, 20), 50);
    assert.strictEqual(computeUtilization(50, 15, 10), 50);
    assert.strictEqual(computeUtilization(0, 0, 0), 0);
    assert.strictEqual(computeUtilization(10, 1, 0), 10);
});

test("JWT Authentication & Role Claims", () => {
    const secret = "test_secret_key_12345";
    const payload = { id: "user123", role: "admin" };

    const token = jwt.sign(payload, secret, { expiresIn: "1h" });
    assert.ok(token);

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.id, "user123");
    assert.strictEqual(decoded.role, "admin");
});

test("Bcrypt Password Hashing & Verification", async () => {
    const rawPassword = "securePassword123!";
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(rawPassword, salt);

    assert.notStrictEqual(rawPassword, hashed);
    const isMatch = await bcrypt.compare(rawPassword, hashed);
    assert.strictEqual(isMatch, true);

    const isWrongMatch = await bcrypt.compare("wrongPassword", hashed);
    assert.strictEqual(isWrongMatch, false);
});

