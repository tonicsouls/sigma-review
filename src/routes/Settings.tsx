
import { useReviewStore } from '../store/useReviewStore';

function Settings() {
    const { preferences, setPreference } = useReviewStore();

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>

            <div className="card bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900">View Preferences</h3>
                    <p className="text-sm text-gray-500 mt-1">Customize how you view the review content.</p>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default Grid Size</label>
                        <select
                            value={preferences.gridSize}
                            onChange={(e) => setPreference('gridSize', e.target.value as any)}
                            className="input block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="comfortable">Comfortable (8 items per page)</option>
                            <option value="normal">Normal (12 items per page)</option>
                            <option value="compact">Compact (24 items per page)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <span className="block text-sm font-medium text-gray-700">Dark Mode</span>
                            <span className="block text-sm text-gray-500">Toggle application theme</span>
                        </div>
                        <button
                            onClick={() => setPreference('darkMode', !preferences.darkMode)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${preferences.darkMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${preferences.darkMode ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Remote Generation</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Backend Server URL</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                                    URL
                                </span>
                                <input
                                    type="text"
                                    value={preferences.backendUrl}
                                    onChange={(e) => setPreference('backendUrl', e.target.value)}
                                    placeholder="http://localhost:5000"
                                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Set this to your PC's IP address (e.g., <code>http://192.168.1.5:5000</code>) to control generation from your mobile device.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
