import { useEffect, useState } from "react";
import axios from "axios";

function AddParkingSlot() {
    const [areas, setAreas] = useState([]);
    const [parkingArea, setParkingArea] = useState("");
    const [slotNumber, setSlotNumber] = useState("");

    // Get parking areas
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await axios.get(
                    "https://smart-campus-parking.onrender.com/api/parking/areas"
                );

                setAreas(response.data.areas);
            } catch (error) {
                console.error(
                    "Failed to fetch parking areas:",
                    error
                );
            }
        };

        fetchAreas();
    }, []);

    // Create parking slot
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "https://smart-campus-parking.onrender.com/api/parking/slots",
                {
                    slotNumber,
                    parkingArea
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(
                response.data.message ||
                "Parking slot created successfully"
            );

            // Clear slot number
            setSlotNumber("");

        } catch (error) {
            console.error(
                "Create parking slot error:",
                error
            );

            alert(
                error.response?.data?.message ||
                "Failed to create parking slot"
            );
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
                        onChange={(e) =>
                            setParkingArea(e.target.value)
                        }
                        required
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

                {/* Slot Number */}
                <div className="form-group">

                    <label>Slot Number</label>

                    <input
                        type="text"
                        placeholder="A1"
                        value={slotNumber}
                        onChange={(e) =>
                            setSlotNumber(
                                e.target.value.toUpperCase()
                            )
                        }
                        required
                    />

                </div>

                <button
                    type="submit"
                    className="book-button"
                    style={{ marginTop: "20px" }}
                >
                    Add Slot
                </button>

            </form>

        </div>
    );
}

export default AddParkingSlot;