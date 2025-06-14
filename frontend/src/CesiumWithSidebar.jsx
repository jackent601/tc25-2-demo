import { useEffect, useRef, useState } from 'react';
import {
    Viewer,
    Cartesian2,
    Cartesian3,
    Color,
    GeoJsonDataSource,
    PolygonHierarchy,
    BillboardGraphics,
    VerticalOrigin,
    LabelGraphics,
    LabelStyle 
} from 'cesium';
// import 'cesium/Widgets/widgets.css';
// import 'cesium/Build/Cesium/Widgets/widgets.css';
import { ClipLoader } from 'react-spinners';

const ENTITY_COLOR_MAP = {
    A: Color.RED.withAlpha(0.5),
    B: Color.BLUE.withAlpha(0.5),
    C: Color.GREEN.withAlpha(0.5),
};


export default function CesiumWithSidebar() {
    const containerRef = useRef(null);
    const viewerRef = useRef(null);
    const [geojsonList, setGeojsonList] = useState([]);
    const [selected, setSelected] = useState('');
    const dataSourceRef = useRef(null);
    const fillDataSourceRef = useRef(null);
    const [isFilling, setIsFilling] = useState(false);
    const [isCalculating, setIsCalculating] = useState(false);

    useEffect(() => {
        const viewer = new Viewer(containerRef.current, {
            shouldAnimate: true,
            baseLayerPicker: false,
            timeline: false,
        });
        viewerRef.current = viewer;
        // Set initial camera view
        viewerRef.current.camera.setView({
            destination: Cartesian3.fromDegrees(-10.1, 66.9, 10000000.0) // [lon, lat, height in meters]
        });

        // Fetch list of geojsons
        fetch("http://localhost:8000/geojson-names")
            .then(res => res.json())
            .then(setGeojsonList);

        return () => viewer.destroy();
    }, []);

    const handleLoad = async () => {
        if (!selected) return;

        // Clear previous layer
        if (dataSourceRef.current) {
            viewerRef.current.dataSources.remove(dataSourceRef.current);
        }

        // Load selected GeoJSON
        const url = `http://localhost:8000/geojson?name=${selected}`;
        const ds = await GeoJsonDataSource.load(url, {
            stroke: Color.BLACK,
            fill: Color.CYAN.withAlpha(0.5),
            strokeWidth: 2,
        });

        viewerRef.current.dataSources.add(ds);
        // viewerRef.current.zoomTo(ds);
        dataSourceRef.current = ds;
    };

    const handleFill = async () => {
        setIsFilling(true); // Start loading
        try {
            // Clear previous fill result if needed
            if (fillDataSourceRef.current) {
                viewerRef.current.dataSources.remove(fillDataSourceRef.current);
            }

            const res = await fetch('http://localhost:8000/fill');
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

            viewerRef.current.dataSources.add(ds);
            // viewerRef.current.zoomTo(ds);
            fillDataSourceRef.current = ds;
        } catch (error) {
            console.error("Error during fill:", error);
        } finally {
            setIsFilling(false); // Done loading
        }
    };

    const handleCalculate = async () => {
        setIsCalculating(true); // Start loading
        try {
            // Clear previous fill result if needed
            if (fillDataSourceRef.current) {
                viewerRef.current.dataSources.remove(fillDataSourceRef.current);
            }

            const res = await fetch('http://localhost:8000/opt-area');
            const geojson = await res.json();

            const ds = await GeoJsonDataSource.load(geojson);

            // Apply styling based on 'entity' property
            const entities = ds.entities.values;
            for (let entity of entities) {
                const entityType = entity.properties?.entity?.getValue();

                const fillColor = ENTITY_COLOR_MAP[entityType] || Color.GRAY.withAlpha(0.4);

                if (entity.position) {
                    // Remove default point
                    entity.point = undefined;

                    // Add custom billboard (icon) instead
                    entity.billboard = new BillboardGraphics({
                        image: "/icons/markers/marker-icon-2x-black.png", // put this in your `public/icons` folder
                        scale: 0.5, // smaller icon
                        verticalOrigin: VerticalOrigin.BOTTOM
                    });

                    const props = entity.properties;

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

            viewerRef.current.dataSources.add(ds);
            viewerRef.current.zoomTo(ds);
            fillDataSourceRef.current = ds;
        } catch (error) {
            console.error("Error during fill:", error);
        } finally {
            setIsCalculating(false); // Done loading
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

                <button onClick={handleFill} disabled={!selected || isFilling} style={{ width: '100%', marginBottom: '0.5rem' }}>
                    {isFilling ? "Filling..." : "Fill"}
                    {isFilling && (
                        <div style={{ marginTop: '1rem' }}>
                            <ClipLoader color="#666" size={35} />
                        </div>
                    )}
                </button>

                <button onClick={handleCalculate} disabled={!selected || isCalculating} style={{ width: '100%', marginBottom: '0.5rem' }}>
                    {isCalculating ? "Calculating..." : "Calculate"}
                    {isCalculating && (
                        <div style={{ marginTop: '1rem' }}>
                            <ClipLoader color="#666" size={35} />
                        </div>
                    )}
                </button>

                <button style={{ width: '100%', marginBottom: '0.5rem' }}>
                    placeholder 1
                </button>

                <button style={{ width: '100%', marginBottom: '0.5rem' }}>
                    placeholder 2
                </button>

                <button style={{ width: '100%' }}>placeholder 3</button>
            </div>
        </div>
    );
}