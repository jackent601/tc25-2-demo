import { Viewer, Entity } from "resium";
import * as Cesium from "cesium";
import { useEffect, useState, useRef, useMemo } from "react";

// Compute percentiles
function computePercentiles(values, p) {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// Color ramp function
function getColorFromValue(value, min, max) {
    const ratio = Math.min(Math.max((value - min) / (max - min), 0), 1);
    return Cesium.Color.fromHsl(0.6 - 0.6 * ratio, 1.0, 0.5); // blue to red
}

export default function DrawEnvData() {
    const viewerRef = useRef(null);
    const [geoData, setGeoData] = useState(null);
    const [depthOptions, setDepthOptions] = useState([]);
    const [depth, setDepth] = useState(null);

    // Fetch available depths
    useEffect(() => {
        fetch("http://localhost:8000/available-depths")
            .then(res => res.json())
            .then(data => {
                setDepthOptions(data);
                if (data.length > 0) setDepth(data[0]); // default to first depth
            })
            .catch(err => console.error("Failed to load depth options:", err));
    }, []);

    // Fetch GeoJSON when depth changes
    useEffect(() => {
        if (depth === null) return;
        fetch(`http://localhost:8000/points-geojson?depth=${depth}`)
            .then(res => res.json())
            .then(data => setGeoData(JSON.parse(data)))
            .catch(err => console.error("Failed to load GeoJSON:", err));
    }, [depth]);

    // Compute color ramp bounds
    const { minSo, maxSo } = useMemo(() => {
        if (!geoData) return { minSo: 0, maxSo: 1 };
        const soValues = geoData.features
            .map(f => f.properties.so)
            .filter(v => typeof v === "number");
        return {
            minSo: computePercentiles(soValues, 10),
            maxSo: computePercentiles(soValues, 90),
        };
    }, [geoData]);

    return (
        <>
            <div style={{
                position: "absolute",
                top: "20px",
                left: "20px",
                zIndex: 10,
                backgroundColor: "white",
                padding: "10px",
                borderRadius: "6px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
            }}>
                <label>
                    Depth (m):&nbsp;
                    <select value={depth ?? ""} onChange={e => setDepth(parseFloat(e.target.value))}>
                        {depthOptions.map((d, i) => (
                            <option key={i} value={d}>{d} m</option>
                        ))}
                    </select>
                </label>
            </div>

            <Viewer full ref={viewerRef}>
                {geoData?.features.map((feature, idx) => {
                    const [lon, lat] = feature.geometry.coordinates;
                    const so = feature.properties.so ?? 0;
                    const position = Cesium.Cartesian3.fromDegrees(lon, lat);
                    const color = getColorFromValue(so, minSo, maxSo);

                    return (
                        <Entity
                            key={`geo-point-${idx}`}
                            position={position}
                            point={{
                                pixelSize: 10,
                                color: color,
                            }}
                            description={`Salinity (so): ${so}`}
                        />
                    );
                })}
            </Viewer>
        </>
    );
}
