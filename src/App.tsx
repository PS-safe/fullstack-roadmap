import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Layer1 from './pages/Layer1';
import Layer2 from './pages/Layer2';
import Layer3 from './pages/Layer3';
import Layer4 from './pages/Layer4';
import Layer5 from './pages/Layer5';
import Layer6 from './pages/Layer6';
import Layer7 from './pages/Layer7';
import Layer8 from './pages/Layer8';
import Layer9 from './pages/Layer9';
import Layer10 from './pages/Layer10';
import Layer11 from './pages/Layer11';
import Layer12 from './pages/Layer12';
import Layer13 from './pages/Layer13';
import Layer14 from './pages/Layer14';
import Layer15 from './pages/Layer15';
import Layer16 from './pages/Layer16';
import Layer17 from './pages/Layer17';
import Layer18 from './pages/Layer18';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="layer/foundations" element={<Layer1 />} />
        <Route path="layer/os-linux" element={<Layer2 />} />
        <Route path="layer/networking" element={<Layer3 />} />
        <Route path="layer/frontend" element={<Layer4 />} />
        <Route path="layer/backend" element={<Layer5 />} />
        <Route path="layer/devops" element={<Layer6 />} />
        <Route path="layer/advanced" element={<Layer7 />} />
        <Route path="layer/web-platform" element={<Layer8 />} />
        <Route path="layer/architecture" element={<Layer9 />} />
        <Route path="layer/rendering-seo" element={<Layer10 />} />
        <Route path="layer/testing-reliability" element={<Layer11 />} />
        <Route path="layer/productionisation" element={<Layer12 />} />
        <Route path="layer/product-ops" element={<Layer13 />} />
        <Route path="layer/unit-testing" element={<Layer14 />} />
        <Route path="layer/data-engineering" element={<Layer15 />} />
        <Route path="layer/nodejs" element={<Layer16 />} />
        <Route path="layer/react-patterns" element={<Layer17 />} />
        <Route path="layer/golang" element={<Layer18 />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
