import { useState } from "react";
import api from "../api/axiosInstance";

function AddParkingArea({ onAreaAdded }) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [totalSlots, setTotalSlots] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/parking/areas", {
                name,
                location,
                totalSlots: Number(totalSlots)
            });

            alert(
                response.data.message ||
                "Parking area created successfully"
            );

            // Clear form
            setName("");
            setLocation("");
            setTotalSlots("");

            if (onAreaAdded) {
                onAreaAdded();
            }

        } catch (error) {
            console.error("Create parking area error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to create parking area"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="booking-panel">
            <h2>➕ Add Parking Area</h2>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Area Name</label>
                    <input
                        type="text"
                        placeholder="ECE Block Parking"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Location</label>
                    <input
                        type="text"
                        placeholder="Near ECE Block"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Total Slots</label>
                    <input
                        type="number"
                        min="1"
                        placeholder="10"
                        value={totalSlots}
                        onChange={(e) => setTotalSlots(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="book-button"
                    style={{ marginTop: "20px" }}
                    disabled={loading}
                >
                    {loading ? "Adding..." : "Add Parking Area"}
                </button>
            </form>
        </div>
    );
}

export default AddParkingArea;