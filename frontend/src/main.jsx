// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import CesiumMap from './CesiumMap'
// import 'cesium/Widgets/widgets.css'

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <CesiumMap />
//   </React.StrictMode>
// )

// src/main.jsx
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import CesiumViewer from './CesiumViewer';
// import 'cesium/Widgets/widgets.css';

// ReactDOM.createRoot(document.getElementById('root')).render(
//   <React.StrictMode>
//     <CesiumViewer />
//   </React.StrictMode>
// );

// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CesiumViewer from './CesiumViewer';
import CesiumViewerWithPolygon from './CesiumViewerWithPolygon';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CesiumViewer />} />
        <Route path="/with-polygon" element={<CesiumViewerWithPolygon />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

