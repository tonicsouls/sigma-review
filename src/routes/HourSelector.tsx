import { useNavigate } from 'react-router-dom';

function HourSelector() {
    const navigate = useNavigate();

    const hours = [
        { id: '1', title: 'Hour 1 - Sanitation', blocks: 22, completed: 22, corrections: 0 },
        { id: '2', title: 'Hour 2', blocks: 0, completed: 0, corrections: 0 },
        { id: '3', title: 'Hour 3', blocks: 0, completed: 0, corrections: 0 },
        { id: '4', title: 'Hour 4', blocks: 0, completed: 0, corrections: 0 },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                Select Hour to Review
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hours.map((hour) => (
                    <div
                        key={hour.id}
                        onClick={() => navigate(`/hour/${hour.id}`)}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                    >
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            {hour.title}
                        </h3>
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>Blocks: {hour.blocks}</p>
                            <p>Completed: {hour.completed}/{hour.blocks}</p>
                            <p>Corrections: {hour.corrections}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default HourSelector;
