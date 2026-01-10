import React, { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useReviewStore } from './store/useReviewStore';
import { getManifestIndex } from './utils/dataLoader';

export const ScorpionLayout: React.FC = () => {
    const { preferences, setPreference } = useReviewStore();
    const [counts, setCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        const fetchIndex = async () => {
            const index = await getManifestIndex();
            const newCounts: Record<string, number> = {};
            Object.entries(index).forEach(([key, blocks]) => {
                const hourId = key.replace('hour_', '');
                newCounts[hourId] = blocks.length;
            });
            setCounts(newCounts);
        };
        fetchIndex();
    }, []);

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">

            {/* Sidebar Navigation */}
            <aside className="w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-[#111318] h-screen shrink-0">
                <div className="p-6 flex flex-col gap-4">
                    <div className="flex gap-3 items-center">
                        <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-2xl">rocket_launch</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-sm font-bold leading-none">Scorpion Studio</h1>
                            <p className="text-slate-500 dark:text-[#9da6b9] text-xs font-normal">Internal QC Tool</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-2 space-y-1">
                    <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 tracking-wider">Navigation</div>

                    <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-slate-100 dark:hover:bg-[#1c1f27] text-slate-500'}`}>
                        <span className="material-symbols-outlined text-xl">dashboard</span>
                        <p className="text-sm font-medium">Overview</p>
                    </NavLink>

                    <div className="mt-4 px-3 py-2 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-600 tracking-wider">
                        <span>Hours</span>
                    </div>

                    {[1, 2, 3, 4].map((hour) => {
                        const count = counts[String(hour)] || 0;
                        return (
                            <NavLink key={hour} to={`/hour/${hour}`} className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'hover:bg-slate-100 dark:hover:bg-[#1c1f27] text-slate-700 dark:text-slate-300'}`}>
                                {({ isActive }) => (
                                    <>
                                        <div className="flex items-center gap-3">
                                            <span className={`material-symbols-outlined text-xl ${count > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {count > 0 ? 'check_circle' : 'schedule'}
                                            </span>
                                            <div className="flex flex-col">
                                                <p className="text-sm font-semibold">Hour {String(hour).padStart(2, '0')}</p>
                                                <p className="text-[10px] text-slate-500">{count} Blocks</p>
                                            </div>
                                        </div>
                                        {isActive && <span className={`text-[10px] px-1.5 py-0.5 rounded bg-primary text-white`}>Active</span>}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>


                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                        onClick={() => setPreference('darkMode', !preferences.darkMode)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 dark:bg-[#1c1f27] text-slate-600 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-[#282e39] transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">{preferences.darkMode ? 'light_mode' : 'dark_mode'}</span>
                        {preferences.darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <NavLink to="/settings" className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-primary transition-colors justify-center">
                        <span className="material-symbols-outlined text-xl">settings</span>
                        <span className="text-sm font-medium">Settings</span>
                    </NavLink>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
};
