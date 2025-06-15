import { useEffect, useRef, useState } from 'react';
import {
    Cartesian2,
    Cartesian3,
    Color,
    // Viewer,
    GeoJsonDataSource,
    LabelGraphics,
    LabelStyle,
    BillboardGraphics,
    VerticalOrigin
} from 'cesium';
import { ClipLoader } from 'react-spinners';
import * as Cesium from "cesium";
import { Viewer, Entity } from "resium";

// example colouring polygons based on arbitrary attributes
const ENTITY_COLOR_MAP = {
    A: Color.RED.withAlpha(0.5),
    B: Color.BLUE.withAlpha(0.5),
    C: Color.GREEN.withAlpha(0.5),
};


export default function CesiumWithSidebar() {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);

    // Loading AOO
    const [geojsonList, setGeojsonList] = useState([]);
    const [selected, setSelected] = useState('');
    const dataSourceRef = useRef(null);
    
    // Example of shading different polygons based on an attribute
    const fillDataSourceRef = useRef(null);
    const [isColouringPolygons, setColouringPolygons] = useState(false);

    // Drawing Polygons
    const resiumViewerRef = useRef(null);
    const [currentPositions, setCurrentPositions] = useState([]);
    const [allPolygons, setAllPolygons] = useState([]);
    const [drawing, setDrawing] = useState(false);
    const [handler, setHandler] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Optimisation
    const sandBoxResultsRef = useRef(null);
    const [showSensorLocations, setShowSensorLocations] = useState(false);

    useEffect(() => {
        // Fetch list of geojsons
        fetch("http://localhost:8000/geojson-names")
            .then(res => res.json())
            .then(setGeojsonList);
    }, []);

    useEffect(() => {
        if (viewerRef.current && viewerRef.current.cesiumElement) {
            viewerRef.current.cesiumElement.camera.setView({
                destination: Cartesian3.fromDegrees(-10.1, 66.9, 10000000.0),
            });
        }
    }, [viewerRef.current]);

    // Drawing Polygons
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

    // Add drawn polygon to list
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

        // Reset current drawing
        setCurrentPositions([]);
    };

    // remove drawn polygons
    const resetAll = () => {
        handler?.destroy();
        setHandler(null);
        setDrawing(false);
        setCurrentPositions([]);
        setAllPolygons([]);
    };

    // Send drawn polygons to geo-router 
    const sendAllPolygonsToSandbox = async () => {

        setIsCalculating(true); // Start loading

        if (allPolygons.length === 0) {
            alert("No polygons to send.");
            setIsCalculating(false); // Done loading
            return;
        }

        const features = allPolygons.map((positions) => {
            const coordinates = positions.map(pos => {
                const cartographic = Cesium.Cartographic.fromCartesian(pos);
                return [
                    Cesium.Math.toDegrees(cartographic.longitude),
                    Cesium.Math.toDegrees(cartographic.latitude),
                ];
            });
            // Close polygon ring by repeating first coordinate at end
            coordinates.push(coordinates[0]);

            return {
                type: "Feature",
                geometry: {
                    type: "Polygon",
                    coordinates: [coordinates],
                },
                properties: {},
            };
        });

        const featureCollection = {
            type: "FeatureCollection",
            features: features,
        };

        console.log("features: ", features)

        try {
            const response = await fetch("http://localhost:8000/optimise-polygon-coverage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(featureCollection),
            });
            const geojsonResponse = await response.json();
            console.log("Backend result:", geojsonResponse);

            // comment for fast API testing
            // const res = await fetch('http://localhost:8000/opt-placement-example');
            // const geojsonResponse = await res.json();

            // uncomment to keep sensor markers
            const geojsonFiltered = geojsonResponse

            // comment to include sensor markers
            // const geojsonFiltered = {
            // ...geojsonResponse,
            // features: geojsonResponse.features.filter(f => f.geometry.type !== 'Point')
            // };
            const ds = await GeoJsonDataSource.load(geojsonFiltered)


            // new data loaded, remove old if present
            if (sandBoxResultsRef.current) {
                viewerRef.current.cesiumElement.dataSources.remove(sandBoxResultsRef.current);
            }

            // Apply styling based on 'entity' property
            const entities = ds.entities.values;
            for (let entity of entities) {
                const entityType = entity.properties?.entity?.getValue();

                const fillColor = ENTITY_COLOR_MAP[entityType] || Color.GRAY.withAlpha(0.4);

                if (entity.position) {
                    // Remove default point
                    entity.point = undefined;

                    const props = entity.properties;

                    // Add custom billboard (icon) instead
                    entity.billboard = new BillboardGraphics({
                        image: "/icons/markers/marker-icon-2x-black.png", // put this in your `public/icons` folder
                        scale: 0.25, // smaller icon
                        verticalOrigin: VerticalOrigin.BOTTOM
                    });

                    // Optional: Add custom label
                    entity.label = new LabelGraphics({
                        text: props?.name?.getValue?.() || "",
                        font: "12px sans-serif",
                        fillColor: Color.WHITE,
                        outlineColor: Color.BLACK,
                        outlineWidth: 2,
                        style: LabelStyle.FILL_AND_OUTLINE,
                        pixelOffset: new Cartesian2(0, -30),
                        showBackground: true,
                        backgroundColor: Color.BLACK.withAlpha(0.5),
                    });
                }
            }

            ds.entities.values.forEach(entity => {
                if (entity.point) {
                    ds.entities.remove(entity);
                }
            });

            viewerRef.current.cesiumElement.dataSources.add(ds);
            sandBoxResultsRef.current = ds;
        } catch (err) {
            console.error("Failed to send polygons to backend:", err);
        } finally {
            setIsCalculating(false); // Done loading
        }

    };

    // clean plotted results from geo-router
    const wipeSandboxResults = () => {
        if (sandBoxResultsRef.current) {
            viewerRef.current.cesiumElement.dataSources.remove(sandBoxResultsRef.current);
        }
    };

    // load preset AOO data (pre-loaded in backend)
    const handleLoad = async () => {
        if (!selected) return;

        // Clear previous layer
        if (dataSourceRef.current) {
            viewerRef.current.cesiumElement.dataSources.remove(dataSourceRef.current);
        }

        // Load selected GeoJSON
        const url = `http://localhost:8000/geojson?name=${selected}`;
        const ds = await GeoJsonDataSource.load(url, {
            stroke: Color.BLACK,
            fill: Color.CYAN.withAlpha(0.5),
            strokeWidth: 2,
        });

        viewerRef.current.cesiumElement.dataSources.add(ds);
        // viewerRef.current.zoomTo(ds); // uncomment to centre on dataset
        dataSourceRef.current = ds;
    };

    // example colouring polygons based on arbitrary attributes
    const handleColouredPolygons = async () => {
        setColouringPolygons(true); // Start loading
        try {
            // Clear previous fill result if needed
            if (fillDataSourceRef.current) {
                viewerRef.current.dataSources.remove(fillDataSourceRef.current);
            }

            const res = await fetch('http://localhost:8000/coloured-polygons');
            const geojson = await res.json();

            const ds = await GeoJsonDataSource.load(geojson);

            // Apply styling based on 'entity' property
            const entities = ds.entities.values;
            for (let entity of entities) {
                const entityType = entity.properties?.entity?.getValue();

                const fillColor = ENTITY_COLOR_MAP[entityType] || Color.GRAY.withAlpha(0.4);

                entity.polygon.material = fillColor;
                entity.polygon.outline = true;
                entity.polygon.outlineColor = Color.BLACK;
            }

            viewerRef.current.cesiumElement.dataSources.add(ds);
            // viewerRef.current.zoomTo(ds); // uncomment to centre on dataset
            fillDataSourceRef.current = ds;
        } catch (error) {
            console.error("Error during fill:", error);
        } finally {
            setColouringPolygons(false); // Done loading
        }
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

            <div
                style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    width: '260px',
                    background: 'rgba(255,255,255,0.95)',
                    padding: '1rem',
                    borderRadius: '8px',
                    zIndex: 10,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
                }}
            >
                <h3>GeoJSON Viewer</h3>
                <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                    <option value="">Select layer</option>
                    {geojsonList.map(name => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                <button onClick={handleLoad} style={{ width: '100%', marginBottom: '0.5rem' }}>
                    Load
                </button>

                <div
                    style={{
                        backgroundColor: "white",
                        padding: "10px",
                        borderRadius: "6px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                        marginBottom: '0.5rem',
                    }}
                >
                    <button onClick={startDrawing} style={{ marginRight: '0.5rem' }}>Start Drawing</button>
                    <button onClick={finishDrawing} disabled={!drawing} style={{ marginRight: '0.5rem' }}>Add</button>
                    <button onClick={resetAll} >Reset All</button>
                </div>

                <button onClick={sendAllPolygonsToSandbox} disabled={isCalculating} style={{ width: '100%', marginBottom: '0.5rem' }}>
                    {isCalculating ? "Calculating..." : "Send To Sandbox"}
                    {isCalculating && (
                        <div style={{ marginTop: '1rem' }}>
                            <ClipLoader color="#666" size={35} />
                        </div>
                    )}
                </button>

                <button onClick={wipeSandboxResults} style={{ width: '100%', marginBottom: '0.5rem' }}>
                    Clean Sandbox Results
                </button>

                <button style={{ width: '100%', marginBottom: '0.5rem' }}><em>placeholder</em></button>

                <button onClick={handleColouredPolygons} style={{ width: '100%'}}>
                    {isColouringPolygons ? "Filling..." : <em>Coloured Polygons</em>}
                    {isColouringPolygons && (
                        <div style={{ marginTop: '1rem' }}>
                            <ClipLoader color="#666" size={35} />
                        </div>
                    )}
                </button>
            </div>

            <Viewer full ref={viewerRef} shouldAnimate baseLayerPicker={false} timeline={false}>
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

        </div>
    );
}