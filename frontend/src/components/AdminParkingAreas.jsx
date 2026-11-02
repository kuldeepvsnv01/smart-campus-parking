import { useEffect, useState } from "react";
import api from "../api/axiosInstance";

function AdminParkingAreas() {
    const [areas, setAreas] = useState([]);
    const [areaStats, setAreaStats] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchAreas = async () => {
        try {
            // Both requests run in parallel — 2 total network calls
            // regardless of how many parking areas exist, instead of
            // 1 + N (one extra request per area).
            const [areasResponse, statsResponse] = await Promise.all([
                api.get("/parking/areas"),
                api.get("/parking/areas/stats")
            ]);

            setAreas(areasResponse.data.areas || []);
            setAreaStats(statsResponse.data.stats || {});

        } catch (error) {

            console.error(
                "Failed to fetch parking areas:",
                error
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAreas();
    }, []);

    if (loading) {
        return (
            <div className="booking-panel">
                <h2>🅿️ Parking Areas</h2>
                <p>
                    Loading parking areas...
                </p>
            </div>
        );
    }

    return (
        <div className="booking-panel">

            <div className="admin-section-header">

                <div>
                    <p className="page-label">
                        MANAGEMENT
                    </p>

                    <h2>
                        🅿️ Parking Areas
                    </h2>

                    <p>
                        Monitor parking capacity and
                        occupancy.
                    </p>
                </div>

                <div className="admin-area-count">
                    {areas.length} Areas
                </div>

            </div>

            {areas.length === 0 ? (

                <div className="empty-state">
                    <h3>
                        No parking areas found
                    </h3>

                    <p>
                        Create a parking area to get started.
                    </p>
                </div>

            ) : (

                <div className="admin-area-grid">

                    {areas.map((area) => {

                        const stats =
                            areaStats[area._id] || {
                                total: 0,
                                available: 0,
                                occupied: 0
                            };

                        const total =
                            stats.total ||
                            area.totalSlots ||
                            0;

                        const occupancy =
                            total > 0
                                ? Math.round(
                                    (stats.occupied / total) * 100
                                )
                                : 0;

                        return (
                            <div
                                className="admin-area-card"
                                key={area._id}
                            >

                                <div className="admin-area-top">

                                    <div className="parking-icon">
                                        🅿️
                                    </div>

                                    <span className="area-id">
                                        ID: {area._id.slice(-6)}
                                    </span>

                                </div>

                                <h3>
                                    {area.name}
                                </h3>

                                <p className="area-location">
                                    📍 {area.location}
                                </p>

                                <div className="area-stat-grid">

                                    <div>
                                        <span>
                                            Total
                                        </span>

                                        <strong>
                                            {total}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Available
                                        </span>

                                        <strong className="available-text">
                                            {stats.available}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Occupied
                                        </span>

                                        <strong className="occupied-text">
                                            {stats.occupied}
                                        </strong>
                                    </div>

                                </div>

                                <div className="occupancy-section">

                                    <div className="occupancy-header">

                                        <span>
                                            Occupancy
                                        </span>

                                        <strong>
                                            {occupancy}%
                                        </strong>

                                    </div>

                                    <div className="occupancy-bar">

                                        <div
                                            className="occupancy-fill"
                                            style={{
                                                width: `${occupancy}%`
                                            }}
                                        />

                                    </div>

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}

        </div>
    );
}

export default AdminParkingAreas;