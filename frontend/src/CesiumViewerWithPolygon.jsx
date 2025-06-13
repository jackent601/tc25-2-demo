import { useEffect, useRef } from 'react';
import { Viewer, Cartesian3, Color, PolygonHierarchy } from 'cesium/Cesium.js';
import 'cesium/Widgets/widgets.css';

export default function CesiumViewerWithPolygon() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new Viewer(containerRef.current, {
      shouldAnimate: true,
      baseLayerPicker: false,
      timeline: false,
    });
    viewerRef.current = viewer;

    // Fetch polygon from FastAPI
    fetch("http://localhost:8000/polygon")
      .then((res) => res.json())
      .then((data) => {
        const coords = data.positions;
        const cartesian = coords.map(([lon, lat]) =>
          Cartesian3.fromDegrees(lon, lat)
        );

        viewer.entities.add({
          polygon: {
            hierarchy: new PolygonHierarchy(cartesian),
            material: Color.RED.withAlpha(0.5),
            height: 0,
          },
        });

        viewer.zoomTo(viewer.entities);
      });

    return () => {
      viewer.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
    />
  );
}
