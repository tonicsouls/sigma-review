import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReviewStore } from '../store/useReviewStore';

// Inline type definition
interface BlockCard {
    id: string;
    title: string;
    type: string;
    thumbnail: string;
    hasAudio: boolean;
    duration: number;
}

function BlockGrid() {
    const { hourId } = useParams();
    const navigate = useNavigate();
    const [blocks, setBlocks] = useState<BlockCard[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    const { preferences, setPreference, corrections } = useReviewStore();

    const getItemsPerPage = (size: string) => {
        switch (size) {
            case 'compact': return 24;
            case 'comfortable': return 8;
            case 'normal': default: return 12;
        }
    };
    const itemsPerPage = getItemsPerPage(preferences.gridSize);

    useEffect(() => {
        if (!hourId) return;

        // Dynamic import to avoid top-level await issues if any
        import('../utils/dataLoader').then(async ({ loadHourBlocks }) => {
            const realBlocks = await loadHourBlocks(hourId);
            const mappedBlocks = realBlocks.map(b => ({
                id: b.blockId,
                title: b.title,
                type: b.atomType,
                thumbnail: b.images[0] || '', // Use first image as thumbnail
                hasAudio: !!b.audio,
                duration: b.durationMinutes
            }));
            setBlocks(mappedBlocks);
        });
    }, [hourId]);

    // Pagination Logic
    const totalPages = Math.ceil(blocks.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const visibleBlocks = blocks.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <button
                        onClick={() => navigate('/hours')}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
                    >
                        ← Back to Hours
                    </button>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                        Hour {hourId} <span className="text-gray-400 text-xl font-normal">({blocks.length} blocks)</span>
                    </h2>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-500">View:</span>
                    <select
                        value={preferences.gridSize}
                        onChange={(e) => {
                            setPreference('gridSize', e.target.value as any);
                            setCurrentPage(1); // Reset to page 1 on resize
                        }}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="comfortable">Comfortable (8)</option>
                        <option value="normal">Normal (12)</option>
                        <option value="compact">Compact (24)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {visibleBlocks.map((block) => {
                    const blockCorrectionCount = corrections.filter(c => c.blockId === block.id).length;

                    return (
                        <div
                            key={block.id}
                            onClick={() => navigate(`/hour/${hourId}/block/${block.id}`)}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-400 transition-all border border-gray-200 dark:border-gray-700 group relative"
                        >
                            <div className="h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                {block.thumbnail ? (
                                    <img src={block.thumbnail} alt={block.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                                        No Thumb
                                    </span>
                                )}
                                {block.hasAudio && (
                                    <span className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {block.duration}m
                                    </span>
                                )}
                            </div>
                            <div className="p-3">
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate" title={block.title}>
                                    {block.title}
                                </h3>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded border border-blue-100 dark:border-blue-800">
                                        {block.type}
                                    </span>

                                    {blockCorrectionCount > 0 && (
                                        <span className="text-xs flex items-center gap-1 text-orange-600 font-medium">
                                            📝 {blockCorrectionCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

export default BlockGrid;
