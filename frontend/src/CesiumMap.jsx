import React, { useEffect, useRef, useState } from "react";
import Cesium from "cesium/Cesium.js";
import "cesium/Widgets/widgets.css";

const CesiumMap = () => {
  const cesiumContainerRef = useRef(null);
  const viewerRef = useRef(null);
  const [polygons, setPolygons] = useState([]);

  useEffect(() => {
    if (!viewerRef.current) {
      viewerRef.current = new Cesium.Viewer(cesiumContainerRef.current, {
        terrainProvider: Cesium.createWorldTerrain(),
      });
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Fetch polygons from backend
    fetch("http://localhost:8000/polygons")
      .then((res) => res.json())
      .then((data) => setPolygons(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;

    // Clear previous entities
    viewer.entities.removeAll();

    polygons.forEach((polygon) => {
      const positions = polygon.coordinates.map(([lon, lat]) =>
        Cesium.Cartesian3.fromDegrees(lon, lat)
      );

      viewer.entities.add({
        name: polygon.name,
        polygon: {
          hierarchy: positions,
          material: Cesium.Color.RED.withAlpha(0.5),
          outline: true,
          outlineColor: Cesium.Color.BLACK,
        },
      });
    });

    if (polygons.length > 0) {
      // Zoom to the first polygon
      viewer.zoomTo(viewer.entities);
    }
  }, [polygons]);

  return <div ref={cesiumContainerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default CesiumMap;
