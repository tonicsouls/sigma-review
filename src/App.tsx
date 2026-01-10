import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ScorpionLayout } from './ScorpionLayout';
import { Overview } from './routes/Overview';
import { BlockGrid } from './routes/BlockGrid';
import { BlockDetail } from './routes/BlockDetail';
import Settings from './routes/Settings';
import { useReviewStore } from './store/useReviewStore';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const darkMode = useReviewStore((state) => state.preferences.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
