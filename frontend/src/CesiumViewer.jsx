// src/CesiumViewer.jsx
import { useEffect, useRef } from 'react';
import { Viewer } from 'cesium/Cesium.js';
import 'cesium/Widgets/widgets.css';
// import 'cesium/Build/Cesium/Widgets/widgets.css';

export default function CesiumViewer() {
  const viewerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    viewerRef.current = new Viewer(containerRef.current, {
      shouldAnimate: true,
      baseLayerPicker: true,
      timeline: true
    });

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
    />
  );
}
