// src/CesiumWithSidebar.jsx
import { useEffect, useRef } from 'react';
// import {
//   Viewer,
//   Cartesian3,
//   Color,
//   PolygonHierarchy,
// } from 'cesium/Source/Cesium.js';
// import 'cesium/Build/Cesium/Widgets/widgets.css';
import {
  Viewer,
  Cartesian3,
  Color,
  PolygonHierarchy,
}from 'cesium/Cesium.js';
import 'cesium/Widgets/widgets.css';

export default function CesiumWithSidebar() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    const viewer = new Viewer(containerRef.current, {
      shouldAnimate: true,
      baseLayerPicker: false,
      timeline: false,
    });
    viewerRef.current = viewer;

    return () => viewer.destroy();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Cesium Map */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
      />

      {/* Sidebar Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          width: '250px',
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        <h3>Tools</h3>

        <button style={{ width: '100%', marginBottom: '0.5rem' }}>
          Upload Shapefile
        </button>

        <button style={{ width: '100%', marginBottom: '0.5rem' }}>
          Draw Polygon
        </button>

        <button style={{ width: '100%' }}>Clear Shapes</button>
      </div>
    </div>
  );
}
