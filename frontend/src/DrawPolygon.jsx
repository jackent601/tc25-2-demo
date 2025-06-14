import { Viewer, Entity } from "resium";
import * as Cesium from "cesium";
import { useRef, useState } from "react";

export default function DrawPolygon() {
    const viewerRef = useRef(null);

    const [currentPositions, setCurrentPositions] = useState([]);
    const [allPolygons, setAllPolygons] = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [handler, setHandler] = useState(null);

    const startDrawing = () => {
        if (!viewerRef.current) return;
        const viewer = viewerRef.current.cesiumElement;

        const newHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        newHandler.setInputAction((click) => {
            const cartesian = viewer.scene.pickPosition(click.position);
            if (cartesian) {
                setCurrentPositions((prev) => [...prev, cartesian]);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        setHandler(newHandler);
        setCurrentPositions([]);
        setDrawing(true);
    };

    const finishDrawing = async () => {
        if (currentPositions.length < 3) {
            alert("A polygon needs at least 3 points.");
            return;
        }

        handler?.destroy();
        setHandler(null);
        setDrawing(false);

        // Store the polygon
        setAllPolygons((prev) => [...prev, currentPositions]);

        // Send it to the backend
        const coordinates = currentPositions.map(pos => {
            const cartographic = Cesium.Cartographic.fromCartesian(pos);
            return [
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude)
            ];
        });

        const geojson = {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [[...coordinates, coordinates[0]]]
            },
            properties: {}
        };

        try {
            const response = await fetch("http://localhost:8000/test-draw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(geojson)
            });
            const result = await response.json();
            console.log("Backend result:", result);
        } catch (err) {
            console.error("Failed to send to backend:", err);
        }

        // Reset current drawing
        setCurrentPositions([]);
    };

    const resetAll = () => {
        handler?.destroy();
        setHandler(null);
        setDrawing(false);
        setCurrentPositions([]);
        setAllPolygons([]);
    };

    return (
        <>
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    zIndex: 10,
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
            >
                <button onClick={startDrawing}>Start Drawing</button>
                <button onClick={finishDrawing} disabled={!drawing}>Finish</button>
                <button onClick={resetAll}>Reset All</button>
            </div>

            <Viewer full ref={viewerRef}>
                {/* All previously finished polygons */}
                {allPolygons.map((poly, i) => (
                    <div key={`poly-wrapper-${i}`}>
                        <Entity
                            key={`poly-${i}`}
                            polygon={{
                                hierarchy: poly,
                                material: Cesium.Color.CYAN.withAlpha(0.5),
                            }}
                        />
                        <Entity
                            key={`poly-line-${i}`}
                            polyline={{
                                positions: [...poly, poly[0]], // close the loop
                                width: 2,
                                material: Cesium.Color.YELLOW,
                            }}
                        />
                    </div>
                ))}


                {/* In-progress polygon */}
                {currentPositions.length >= 3 && (
                    <Entity
                        polygon={{
                            hierarchy: currentPositions,
                            material: Cesium.Color.YELLOW.withAlpha(0.3),
                        }}
                    />
                )}

                {/* In-progress lines */}
                {currentPositions.length >= 2 && (
                    <Entity
                        polyline={{
                            positions: currentPositions,
                            width: 2,
                            material: Cesium.Color.YELLOW,
                        }}
                    />
                )}

                {/* Drawn points */}
                {currentPositions.map((pos, idx) => (
                    <Entity
                        key={`pt-${idx}`}
                        position={pos}
                        point={{ pixelSize: 8, color: Cesium.Color.RED }}
                    />
                ))}
            </Viewer>
        </>
    );
}
