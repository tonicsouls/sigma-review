import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useReviewStore } from './store/useReviewStore';
import { ActivityLog } from './components/ActivityLog';

function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { exportCorrections } = useReviewStore();
    const navigate = useNavigate();

    const handleGlobalExport = () => {
        const json = exportCorrections();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sigma_reviews_full_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/hours', label: 'Review Content', icon: '📁' },
        { path: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'} 
                bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
                transition-all duration-300 flex flex-col z-20`}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 truncate">SIGMA Studio</h1>
                    ) : (
                        <span className="text-xl font-bold text-blue-600 mx-auto">Σ</span>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center px-4 py-3 rounded-lg transition-colors
                                ${isActive
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}
                            `}
                        >
                            <span className="text-xl mr-3">{item.icon}</span>
                            {sidebarOpen && <span className="font-medium">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleGlobalExport}
                        className={`
                            flex items-center justify-center w-full px-4 py-2 
                            bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                            transition-colors font-medium text-sm
                        `}
                    >
                        <span className="mr-2">📥</span>
                        {sidebarOpen && "Export Notes"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-8 justify-between sticky top-0 z-10">
                    <div className="flex items-center text-sm text-gray-500">
                        {/* Breadcrumbs placeholder */}
                        <span className="font-medium text-gray-900 dark:text-gray-100">Home</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-xs text-gray-400">v3.0.1</div>
                    </div>
                </header>

                <div className="p-8 pb-32">
                    <Outlet />
                </div>

                <ActivityLog />
            </main>
        </div>
    );
}

export default Layout;
