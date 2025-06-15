// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import CesiumViewer from './CesiumViewer';
// import CesiumViewerWithPolygon from './CesiumViewerWithPolygon';
import CesiumWithSidebar from './CesiumWithSidebar';
// import PolygonDrawer from './PolygonDrawer'
import DrawPolygon from './DrawPolygon'
import DrawEnvData from './DrawEnvData'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<CesiumViewer />} /> */}
        {/* <Route path="/with-polygon" element={<CesiumViewerWithPolygon />} /> */}
        <Route path="/" element={<CesiumWithSidebar />} />
        {/* <Route path="/PolygonDrawer" element={<PolygonDrawer />} /> */}
        <Route path="/Draw" element={<DrawPolygon />} />
        <Route path="/EnvData" element={<DrawEnvData />} /> 
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

