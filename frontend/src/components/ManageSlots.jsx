import { useEffect, useState } from "react";
import axios from "axios";

function ManageSlots() {
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState("");
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await axios.get(
                    "https://smart-campus-parking.onrender.com/api/parking/areas"
                );

                setAreas(response.data.areas || []);

            } catch (error) {
                console.error(
                    "Failed to fetch areas:",
                    error
                );
            }
        };

        fetchAreas();
    }, []);

    const fetchSlots = async (areaId) => {
        if (!areaId) {
            setSlots([]);
            return;
        }

        try {
            setLoading(true);

            const response = await axios.get(
                `https://smart-campus-parking.onrender.com/api/parking/areas/${areaId}/slots`
            );

            setSlots(response.data.slots || []);

        } catch (error) {
            console.error(
                "Failed to fetch slots:",
                error
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAreaChange = (e) => {
        const areaId = e.target.value;

        setSelectedArea(areaId);

        fetchSlots(areaId);
    };
    
    const handleBlockToggle = async (slot) => {

        const action =
            slot.status === "blocked"
                ? "unblock"
                : "block";

        const message =
            action === "block"
                ? "Are you sure you want to block this slot?"
                : "Do you want to unblock this slot?";

        const confirmed = window.confirm(message);

        if (!confirmed) {
            return;
        }

        try {

            const token = localStorage.getItem("token");

            if (!token) {
                alert("Please login as admin.");
                return;
            }

            const response = await axios.patch(
                `https://smart-campus-parking.onrender.com/api/parking/slots/${slot._id}/status`,
                {
                    status:
                        action === "block"
                            ? "blocked"
                            : "available"
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(response.data.message);

            fetchSlots(selectedArea);

        } catch (error) {

            console.error(
                "Block/unblock error:",
                error
            );

            console.log(
                "Server response:",
                error.response?.data
            );

            alert(
                error.response?.data?.message ||
                "Failed to update slot"
            );
        }
    };
    
    return (
        <div className="booking-panel">

            {/* Header */}

            <div className="admin-section-header">

                <div>

                    <p className="page-label">
                        SLOT MANAGEMENT
                    </p>

                    <h2>
                        🚗 Manage Parking Slots
                    </h2>

                    <p>
                        Block or unblock parking slots
                        when required.
                    </p>

                </div>

            </div>

            {/* Area Selection */}

            <div className="form-group">

                <label>
                    Select Parking Area
                </label>

                <select
                    value={selectedArea}
                    onChange={handleAreaChange}
                >

                    <option value="">
                        Select Parking Area
                    </option>

                    {areas.map((area) => (

                        <option
                            key={area._id}
                            value={area._id}
                        >
                            {area.name}
                        </option>

                    ))}

                </select>

            </div>

            {/* Loading */}

            {loading && (
                <div className="loading">
                    <p>
                        Loading parking slots...
                    </p>
                </div>
            )}

            {/* Empty */}

            {!loading &&
                selectedArea &&
                slots.length === 0 && (

                    <div className="empty-state">

                        <h3>
                            No slots found
                        </h3>

                        <p>
                            This parking area doesn't
                            have any slots yet.
                        </p>

                    </div>
                )}

            {/* Slots */}

            {!loading && slots.length > 0 && (

                <div className="admin-slot-grid">

                    {slots.map((slot) => {

                        const isAvailable =
                            slot.status ===
                            "available";

                        const isOccupied =
                            slot.status ===
                            "occupied";

                        const isBlocked =
                            slot.status ===
                            "blocked";

                        return (

                            <div
                                key={slot._id}
                                className={`admin-slot-card ${
                                    slot.status
                                }`}
                            >

                                {/* Slot Number */}

                                <div className="admin-slot-number">

                                    {slot.slotNumber}

                                </div>

                                {/* Icon */}

                                <div className="admin-slot-icon">

                                    {isBlocked
                                        ? "🚫"
                                        : "🚗"}

                                </div>

                                {/* Status */}

                                <p className="admin-slot-status">

                                    {isAvailable &&
                                        "🟢 Available"}

                                    {isOccupied &&
                                        "🔴 Occupied"}

                                    {isBlocked &&
                                        "⚫ Blocked"}

                                </p>
                                
                                <button
                                    className={
                                        slot.status === "blocked"
                                            ? "unblock-button"
                                            : "block-button"
                                    }
                                    disabled={
                                        slot.status === "occupied"
                                    }
                                    onClick={() =>
                                        handleBlockToggle(slot)
                                    }
                                >
                                    {slot.status === "blocked"
                                        ? "🔓 Unblock Slot"
                                        : "🚫 Block Slot"}
                                </button>
                            </div>

                        );
                    })}

                </div>
            )}

        </div>
    );
}

export default ManageSlots;