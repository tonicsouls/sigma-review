import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewStore } from '../store/useReviewStore';
import { loadHourBlocks } from '../utils/dataLoader';

interface HourStats {
  hourId: number;
  title: string;
  totalBlocks: number;
  reviewed: number;
  pending: number;
  corrections: number;
}

export const Overview: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, corrections, exportCorrections } = useReviewStore();
  const [hours, setHours] = useState<HourStats[]>([]);
  const [loading, setLoading] = useState(true);

  const handleExportAll = () => {
    const json = exportCorrections();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corrections-all-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchHourStats = async () => {
      setLoading(true);
      const stats: HourStats[] = [];

      for (let i = 1; i <= 4; i++) {
        const blocks = await loadHourBlocks(`h${i}`);
        const reviewed = blocks.filter((b: any) => b.status === 'Reviewed').length;
        const pending = blocks.filter((b: any) => b.status === 'Pending').length;
        const corrections = blocks.filter((b: any) => b.status === 'Corrections').length;

        stats.push({
          hourId: i,
          title: i === 1 ? 'Sanitation' : i === 2 ? 'Trafficking' : i === 3 ? 'Protocols' : 'Safety',
          totalBlocks: blocks.length,
          reviewed,
          pending,
          corrections,
        });
      }

      setHours(stats);
      setLoading(false);
    };

    fetchHourStats();
  }, [preferences.backendUrl]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-slate-500">Loading Hours...</div>;
  }

  const totalBlocks = hours.reduce((sum, h) => sum + h.totalBlocks, 0);
  const totalReviewed = hours.reduce((sum, h) => sum + h.reviewed, 0);
  const totalPending = hours.reduce((sum, h) => sum + h.pending, 0);

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-8">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">CE Content Review Dashboard</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Export All Button */}
          <button onClick={handleExportAll} className="flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
            <span className="material-symbols-outlined text-lg">download</span>
            Export All ({corrections.length})
          </button>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="px-8 py-6 bg-white dark:bg-[#111318] border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-[#1c1f27] rounded-lg p-4">
            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Blocks</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalBlocks}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-4">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">✅ Reviewed</p>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalReviewed}</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 uppercase font-bold mb-1">⏳ Pending</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{totalPending}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Hours</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">4</p>
          </div>
        </div>
      </div>

      {/* Hour Cards Grid */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
          {hours.map((hour) => (
            <div
              key={hour.hourId}
              onClick={() => navigate(`/hour/${hour.hourId}`)}
              className="group bg-white dark:bg-[#111318] rounded-xl border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col"
            >
              {/* Hour Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Hour {String(hour.hourId).padStart(2, '0')}</h3>
                  <p className="text-sm text-slate-500 mt-1">{hour.title}</p>
                </div>
                <div className="text-3xl group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-slate-400 dark:text-slate-600">schedule</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#1c1f27] rounded-lg">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Blocks</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">{hour.totalBlocks}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">✅ Reviewed</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{hour.reviewed}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">⏳ Pending QC</span>
                  <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{hour.pending}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">🔴 Corrections</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">{hour.corrections}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="text-slate-700 dark:text-slate-300 font-bold">
                    {hour.totalBlocks > 0 ? Math.round((hour.reviewed / hour.totalBlocks) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-[#1c1f27] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-blue-600 transition-all duration-300"
                    style={{ width: `${hour.totalBlocks > 0 ? (hour.reviewed / hour.totalBlocks) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-4">
                <button className="w-full py-2 px-4 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <span>Review Blocks</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Status */}
      <footer className="h-8 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] flex items-center justify-between px-6 shrink-0 text-[10px] text-slate-400 dark:text-slate-600 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Stitcher Connected</span>
          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">dns</span> {preferences.backendUrl}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>SCORPION_STUDIO_V2</span>
        </div>
      </footer>
    </div>
  );
};
