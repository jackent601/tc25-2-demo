import { Viewer, Entity } from "resium";
import * as Cesium from "cesium";
import { useRef, useState } from "react";

export default function DrawPolygon() {
    const viewerRef = useRef(null);
    const [positions, setPositions] = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [handler, setHandler] = useState(null);

    const startDrawing = () => {
        if (!viewerRef.current) return;
        const viewer = viewerRef.current.cesiumElement;

        const newHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        newHandler.setInputAction((click) => {
            const cartesian = viewer.scene.pickPosition(click.position);
            if (cartesian) {
                setPositions((prev) => [...prev, cartesian]);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        setHandler(newHandler);
        setDrawing(true);
    };

    const finishDrawing = async () => {
        handler?.destroy();
        setHandler(null);
        setDrawing(false);

        if (positions.length < 3) return;

        // Convert positions to longitude/latitude
        const coordinates = positions.map(pos => {
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
                coordinates: [[...coordinates, coordinates[0]]]  // Close the polygon
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
    };

    const resetDrawing = () => {
        setPositions([]);
        setDrawing(false);
        handler?.destroy();
        setHandler(null);
    };

    return (
        <>
            {/* <div className="absolute top-4 left-4 z-10 space-x-2 bg-white p-2 rounded shadow"> */}
            <div
                style={{
                    position: "absolute",
                    top: "20px",
                    left: "20px",
                    zIndex: 10,
                    backgroundColor: "white",
                    padding: "10px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                }}
            >
                <button onClick={startDrawing}>Start Drawing</button>
                <button onClick={finishDrawing} disabled={!drawing}>Finish</button>
                <button onClick={resetDrawing}>Reset</button>
            </div>

            <Viewer full ref={viewerRef}>
                {positions.length >= 3 && (
                    <Entity
                        polygon={{
                            hierarchy: positions,
                            material: Cesium.Color.BLUE.withAlpha(0.4),
                        }}
                    />
                )}
                {positions.length >= 2 && (
                    <Entity
                        polyline={{
                            positions,
                            width: 2,
                            material: Cesium.Color.YELLOW,
                        }}
                    />
                )}
                {positions.map((pos, idx) => (
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
