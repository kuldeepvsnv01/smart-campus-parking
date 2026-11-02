import { useEffect, useState } from "react";
import api from "../api/axiosInstance";

function AddParkingSlot({ onSlotAdded }) {
    const [areas, setAreas] = useState([]);
    const [parkingArea, setParkingArea] = useState("");
    const [slotNumber, setSlotNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingAreas, setLoadingAreas] = useState(true);

    // Get parking areas
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await api.get("/parking/areas");
                setAreas(response.data.areas || []);
            } catch (error) {
                console.error("Failed to fetch parking areas:", error);
            } finally {
                setLoadingAreas(false);
            }
        };

        fetchAreas();
    }, []);

    // Create parking slot
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/parking/slots", {
                slotNumber,
                parkingArea
            });

            alert(
                response.data.message ||
                "Parking slot created successfully"
            );

            // Clear slot number
            setSlotNumber("");

            if (onSlotAdded) {
                onSlotAdded();
            }

        } catch (error) {
            console.error("Create parking slot error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to create parking slot"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="booking-panel">
            <h2>➕ Add Parking Slot</h2>

            <form onSubmit={handleSubmit}>
                {/* Parking Area */}
                <div className="form-group">
                    <label>Parking Area</label>

                    <select
                        value={parkingArea}
                        onChange={(e) => setParkingArea(e.target.value)}
                        required
                        disabled={loadingAreas}
                    >
                        <option value="">
                            {loadingAreas ? "Loading areas..." : "Select Parking Area"}
                        </option>

                        {areas.map((area) => (
                            <option key={area._id} value={area._id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Slot Number */}
                <div className="form-group">
                    <label>Slot Number</label>

                    <input
                        type="text"
                        placeholder="A1"
                        value={slotNumber}
                        onChange={(e) =>
                            setSlotNumber(e.target.value.toUpperCase())
                        }
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="book-button"
                    style={{ marginTop: "20px" }}
                    disabled={loading || loadingAreas}
                >
                    {loading ? "Adding Slot..." : "Add Slot"}
                </button>
            </form>
        </div>
    );
}

export default AddParkingSlot;