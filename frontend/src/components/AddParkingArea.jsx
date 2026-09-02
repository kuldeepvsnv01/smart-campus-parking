import { useState } from "react";
import axios from "axios";

function AddParkingArea() {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [totalSlots, setTotalSlots] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5001/api/parking/areas",
                {
                    name,
                    location,
                    totalSlots: Number(totalSlots)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(
                response.data.message ||
                "Parking area created successfully"
            );

            // Clear form
            setName("");
            setLocation("");
            setTotalSlots("");

        } catch (error) {
            console.error("Create parking area error:", error);

            alert(
                error.response?.data?.message ||
                "Failed to create parking area"
            );
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
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Location</label>

                    <input
                        type="text"
                        placeholder="Near ECE Block"
                        value={location}
                        onChange={(e) =>
                            setLocation(e.target.value)
                        }
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
                        onChange={(e) =>
                            setTotalSlots(e.target.value)
                        }
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="book-button"
                    style={{ marginTop: "20px" }}
                >
                    Add Parking Area
                </button>

            </form>

        </div>
    );
}

export default AddParkingArea;