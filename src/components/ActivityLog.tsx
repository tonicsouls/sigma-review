import { create } from 'zustand';

interface LogEntry {
    id: string;
    timestamp: Date;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
}

interface ActivityLogStore {
    logs: LogEntry[];
    addLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    clearLogs: () => void;
}

export const useActivityLogStore = create<ActivityLogStore>((set) => ({
    logs: [],
    addLog: (message, type = 'info') => set((state) => ({
        logs: [
            {
                id: Math.random().toString(36).substring(7),
                timestamp: new Date(),
                type,
                message,
            },
            ...state.logs
        ].slice(0, 50) // Keep last 50 logs
    })),
    clearLogs: () => set({ logs: [] }),
}));

export function ActivityLog() {
    const { logs, clearLogs } = useActivityLogStore();

    if (logs.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 max-h-60 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-40">
            <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Activity</span>
                <button onClick={clearLogs} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {logs.map((log) => (
                    <div key={log.id} className={`text-xs p-2 rounded border-l-2 ${log.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                            log.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                                log.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                                    'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        }`}>
                        <div className="flex justify-between text-gray-400 mb-1" style={{ fontSize: '10px' }}>
                            <span>{log.timestamp.toLocaleTimeString()}</span>
                            <span className="uppercase">{log.type}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{log.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
