import { useEffect, useState } from "react";
import api from "../api/axiosInstance";

function BulkCreateSlots() {
    const [areas, setAreas] = useState([]);
    const [parkingArea, setParkingArea] = useState("");
    const [totalSlots, setTotalSlots] = useState("");
    const [isLoadingAreas, setIsLoadingAreas] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await api.get("/parking/areas");
                setAreas(response.data.areas || []);
            } catch (error) {
                console.error(
                    "Failed to fetch parking areas:",
                    error
                );
            } finally {
                setIsLoadingAreas(false);
            }
        };

        fetchAreas();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const response = await api.post("/parking/slots/bulk", {
                parkingArea,
                totalSlots: Number(totalSlots)
            });

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
        } finally {
            setIsSubmitting(false);
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
                        disabled={isLoadingAreas}
                    >

                        <option value="">
                            {isLoadingAreas
                                ? "Loading parking areas..."
                                : "Select Parking Area"}
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
                    disabled={isSubmitting || isLoadingAreas}
                >
                    {isSubmitting ? "Generating..." : "⚡ Generate Slots"}
                </button>

            </form>

        </div>
    );
}

export default BulkCreateSlots;