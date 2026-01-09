import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useReviewStore } from './store/useReviewStore';

export const Layout: React.FC = () => {
    const { preferences, setPreference } = useReviewStore();
    const location = useLocation();

    // Determine current hour from URL (mock)
    const currentHour = location.pathname.includes('hour') ? 'Hour 01' : 'Overview';

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        SIGMA Review
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">QC Studio v2.0</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-xl">dataset</span>
                        <span className="text-sm font-medium">Overview</span>
                    </NavLink>

                    <div className="pt-4 pb-2">
                        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Content
                        </p>
                    </div>

                    <NavLink
                        to="/hour/1"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`
                        }
                    >
                        <span className="material-symbols-outlined text-xl">schedule</span>
                        <span className="text-sm font-medium">Hour 01</span>
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setPreference('darkMode', !preferences.darkMode)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                        <span className="material-symbols-outlined text-lg">
                            {preferences.darkMode ? 'light_mode' : 'dark_mode'}
                        </span>
                        {preferences.darkMode ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <NavLink to="/settings" className="flex items-center gap-2 mt-3 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-200">
                        <span className="material-symbols-outlined text-lg">settings</span>
                        Settings
                    </NavLink>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-8 shrink-0">
                    <h2 className="text-lg font-medium">{currentHour}</h2>
                    <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            JD
                        </span>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
