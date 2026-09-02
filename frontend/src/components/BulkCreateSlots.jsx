import { useEffect, useState } from "react";
import axios from "axios";

function BulkCreateSlots() {
    const [areas, setAreas] = useState([]);
    const [parkingArea, setParkingArea] = useState("");
    const [totalSlots, setTotalSlots] = useState("");

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await axios.get(
                    "http://localhost:5001/api/parking/areas"
                );

                setAreas(response.data.areas || []);
            } catch (error) {
                console.error(
                    "Failed to fetch parking areas:",
                    error
                );
            }
        };

        fetchAreas();
    }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("Please login as admin first.");
            return;
        }

        const response = await axios.post(
            "http://localhost:5001/api/parking/slots/bulk",
            {
                parkingArea,
                totalSlots: Number(totalSlots)
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        alert(
            `${response.data.message}\nCreated: ${response.data.count} slots`
        );

        setTotalSlots("");

    } catch (error) {
        console.error(
            "Bulk slot creation error:",
            error
        );

        alert(
            error.response?.data?.message ||
            "Failed to create slots"
        );
    }
};

    return (
        <div className="booking-panel">

            <h2>⚡ Generate Multiple Slots</h2>

            <form onSubmit={handleSubmit}>

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

                <div className="form-group">

                    <label>Number of Slots</label>

                    <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="20"
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
                    ⚡ Generate Slots
                </button>

            </form>

        </div>
    );
}

export default BulkCreateSlots;