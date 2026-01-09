import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ScorpionLayout } from './ScorpionLayout';
import { Overview } from './routes/Overview';
import { BlockGrid } from './routes/BlockGrid';
import { BlockDetail } from './routes/BlockDetail';
import Settings from './routes/Settings';
import { useReviewStore } from './store/useReviewStore';
import { useEffect } from 'react';

function App() {
  const { preferences } = useReviewStore();

  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<ScorpionLayout />}>
          <Route index element={<Overview />} />
          <Route path="hour/:hourId" element={<BlockGrid />} />
          <Route path="hour/:hourId/block/:blockId" element={<BlockDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
