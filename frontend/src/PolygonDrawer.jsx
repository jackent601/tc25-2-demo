// import { Viewer, Entity, PolygonGraphics, PolylineGraphics, PointGraphics } from "resium";
// import { useState, useRef } from "react";
// import { Cartesian3, ScreenSpaceEventHandler, ScreenSpaceEventType, Color } from "cesium";

// function PolygonDrawer() {
//   const [positions, setPositions] = useState([]);
//   const viewerRef = useRef();

//   const handleClick = (movement) => {
//     const viewer = viewerRef.current.cesiumElement;
//     const cartesian = viewer.scene.pickPosition(movement.position);
//     if (cartesian) {
//       setPositions([...positions, cartesian]);
//     }
//   };

//   return (
//     <Viewer full ref={viewerRef}>
//       <ScreenSpaceEventHandler>
//         <ScreenSpaceEventHandler.ScreenSpaceEvent
//           action={handleClick}
//           type={ScreenSpaceEventType.LEFT_CLICK}
//         />
//       </ScreenSpaceEventHandler>

//       {positions.map((pos, idx) => (
//         <Entity key={idx} position={pos}>
//           <PointGraphics color={Color.YELLOW} pixelSize={10} />
//         </Entity>
//       ))}

//       {positions.length >= 2 && (
//         <Entity>
//           <PolylineGraphics
//             positions={positions}
//             width={2}
//             material={Color.CYAN}
//           />
//         </Entity>
//       )}

//       {positions.length >= 3 && (
//         <Entity>
//           <PolygonGraphics
//             hierarchy={positions}
//             material={Color.CYAN.withAlpha(0.4)}
//             outline={true}
//             outlineColor={Color.WHITE}
//           />
//         </Entity>
//       )}
//     </Viewer>
//   );
// }

// export default PolygonDrawer;



// PolygonDrawer.jsx
// import React, { useRef, useState } from "react";
// import {
//   Viewer,
//   Entity,
//   PointGraphics,
//   PolylineGraphics,
//   PolygonGraphics,
//   ScreenSpaceEventHandler,
//   ScreenSpaceEvent,
// } from "resium";
// import {
//   Color,
//   Cartesian3,
//   ScreenSpaceEventType,
// } from "cesium";

// function PolygonDrawer() {
//   const viewerRef = useRef();
//   const [positions, setPositions] = useState([]);

//   const handleLeftClick = (click) => {
//     const viewer = viewerRef.current?.cesiumElement;
//     if (!viewer) return;

//     const cartesian = viewer.scene.pickPosition(click.position);
//     if (cartesian) {
//       setPositions([...positions, cartesian]);
//     }
//   };

//   return (
//     <Viewer full ref={viewerRef}>
//       <ScreenSpaceEventHandler>
//         <ScreenSpaceEvent
//           action={handleLeftClick}
//           type={ScreenSpaceEventType.LEFT_CLICK}
//         />
//       </ScreenSpaceEventHandler>

//       {/* Points */}
//       {positions.map((pos, idx) => (
//         <Entity key={idx} position={pos}>
//           <PointGraphics color={Color.YELLOW} pixelSize={10} />
//         </Entity>
//       ))}

//       {/* Polyline (edges) */}
//       {positions.length >= 2 && (
//         <Entity>
//           <PolylineGraphics
//             positions={positions}
//             width={3}
//             material={Color.CYAN}
//             clampToGround={false}
//           />
//         </Entity>
//       )}

//       {/* Polygon (shaded area) */}
//       {positions.length >= 3 && (
//         <Entity>
//           <PolygonGraphics
//             hierarchy={positions}
//             material={Color.CYAN.withAlpha(0.4)}
//             outline={true}
//             outlineColor={Color.WHITE}
//           />
//         </Entity>
//       )}
//     </Viewer>
//   );
// }

// export default PolygonDrawer;


import { Viewer, Entity } from "resium";
import * as Cesium from "cesium";
import { useRef, useState } from "react";

export default function PolygonDrawer() {
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

  const finishDrawing = () => {
    handler?.destroy();
    setHandler(null);
    setDrawing(false);
  };

  const resetDrawing = () => {
    setPositions([]);
    setDrawing(false);
    handler?.destroy();
    setHandler(null);
  };

  return (
    <>
      <div className="absolute top-4 left-4 z-10 space-x-2 bg-white p-2 rounded shadow">
        <button onClick={startDrawing}>Start Drawing</button>
        <button onClick={finishDrawing} disabled={!drawing}>Finish</button>
        <button onClick={resetDrawing}>Reset</button>
      </div>

      <Viewer full ref={viewerRef}>
        {/* Polygon preview */}
        {positions.length >= 3 && (
          <Entity
            polygon={{
              hierarchy: positions,
              material: Cesium.Color.BLUE.withAlpha(0.4),
            }}
          />
        )}

        {/* Polyline preview */}
        {positions.length >= 2 && (
          <Entity
            polyline={{
              positions: [...positions],
              width: 2,
              material: Cesium.Color.YELLOW,
            }}
          />
        )}

        {/* Points */}
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
