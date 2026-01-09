import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './routes/Dashboard';
import HourSelector from './routes/HourSelector';
import BlockGrid from './routes/BlockGrid';
import BlockDetail from './routes/BlockDetail';
import Settings from './routes/Settings';

function App() {
  return (
    <BrowserRouter basename="/sigma-review/">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="hours" element={<HourSelector />} />
          <Route path="hour/:hourId" element={<BlockGrid />} />
          <Route path="hour/:hourId/block/:blockId" element={<BlockDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
