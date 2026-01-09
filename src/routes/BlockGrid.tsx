import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReviewStore } from '../store/useReviewStore';
import { loadHourBlocks } from '../utils/dataLoader';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { assetLogger } from '../utils/assetLogger';

const BLOCKS_PER_PAGE = 10;

export const BlockGrid: React.FC = () => {
    const { hourId = '1' } = useParams();
    const navigate = useNavigate();
    const { blocks, setBlocks, preferences, corrections, exportCorrections } = useReviewStore();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const handleExportHour = () => {
        const hourCorrections = corrections.filter(c => c.hourId === hourId);
        const json = JSON.stringify({ hourId, totalCorrections: hourCorrections.length, corrections: hourCorrections }, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `corrections-hour-${hourId}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const fetchBlocks = async () => {
            setLoading(true);
            setError(null);
            try {
                const loadedBlocks = await loadHourBlocks(`h${hourId}`);
                if (!loadedBlocks || loadedBlocks.length === 0) {
                    assetLogger.logManifestError(`No blocks found for hour ${hourId}`, `hour-${hourId}`);
                }
                setBlocks(loadedBlocks);
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : 'Failed to load blocks';
                setError(errMsg);
                assetLogger.logNetworkError(errMsg, { hour: hourId, endpoint: '/loadHourBlocks' });
            } finally {
                setLoading(false);
            }
        };
        fetchBlocks();
    }, [hourId, preferences.backendUrl]);

    if (error) {
        return (
            <ErrorBoundary>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                        <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400 shrink-0">error</span>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2">Failed to Load Hour</h2>
                                <p className="text-sm text-red-800 dark:text-red-400 font-mono mb-4">{error}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded transition-colors"
                                >
                                    Reload Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        );
    }

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Content Atoms from Stitcher...</div>;
    }

    // Empty state
    if (!blocks || blocks.length === 0) {
        return (
            <ErrorBoundary>
                <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
                    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] flex items-center justify-between px-8 shrink-0">
                        <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Hour {hourId.padStart(2, '0')} Blocks</h2>
                    </header>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 mb-4 block">inbox</span>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">No Blocks Found</h3>
                            <p className="text-sm text-slate-500 mb-4">Hour {hourId} has no content blocks available.</p>
                            <a href="/#/" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors inline-block">
                                Back to Overview
                            </a>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary>
            {/* Header */}
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] flex items-center justify-between px-8 shrink-0">
                <div className="flex items-center gap-8">
                    <h2 className="text-slate-900 dark:text-white text-lg font-bold tracking-tight">Hour {hourId.padStart(2, '0')} Blocks</h2>
                    <div className="hidden md:flex items-center gap-4">
                        <label className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3 text-slate-400 text-lg">search</span>
                            <input className="h-9 w-64 pl-10 pr-4 bg-slate-100 dark:bg-[#282e39] border-none rounded-lg text-sm focus:ring-1 focus:ring-primary dark:text-white placeholder:text-slate-500" placeholder="Search blocks..." type="text" />
                        </label>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Export Hour Button */}
                    <button onClick={handleExportHour} className="flex items-center gap-2 h-9 px-4 bg-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export Hour ({corrections.filter(c => c.hourId === hourId).length})
                    </button>
                </div>
            </header>

            {/* Breadcrumbs & Toolbar */}
            <div className="px-8 py-3 bg-white/50 dark:bg-[#111318]/50 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Hours</span>
                    <span className="text-slate-300 dark:text-slate-700">/</span>
                    <span className="text-slate-900 dark:text-white font-medium">Hour {hourId.padStart(2, '0')}</span>
                </div>
                {/* View toggles could go here */}
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {blocks
                        .slice((currentPage - 1) * BLOCKS_PER_PAGE, currentPage * BLOCKS_PER_PAGE)
                        .map(block => (
                        <div 
                            key={block.blockId} 
                            onClick={() => navigate(`/hour/${hourId}/block/${block.blockId}`)}
                            className="group scorp-card flex flex-col cursor-pointer">
                            <div className="aspect-video w-full bg-slate-100 dark:bg-[#282e39] relative">
                                {/* Thumbnail (Gradient for now) */}
                                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-4xl text-slate-400 dark:text-slate-500">
                                        {block.atomType === 'visual' ? 'image' :
                                            block.atomType === 'script' ? 'description' :
                                                block.atomType === 'audio' ? 'headphones' : 'grid_view'}
                                    </span>
                                </div>
                                <div className="absolute top-3 left-3 px-2 py-1 bg-slate-400 dark:bg-slate-600 text-white text-[10px] font-bold uppercase rounded shadow-lg">
                                    {block.status || 'Pending'}
                                </div>
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 gap-2">
                                    <span className="bg-primary p-1.5 rounded-lg text-white material-symbols-outlined text-lg">edit</span>
                                </div>
                            </div>
                            <div className="p-4 flex flex-col gap-1">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1" title={block.title}>
                                    {block.title}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {block.durationMinutes} min • {block.blockId}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination Controls */}
                {blocks.length > BLOCKS_PER_PAGE && (
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                            Previous
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Page {currentPage} of {Math.ceil(blocks.length / BLOCKS_PER_PAGE)}
                            </span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(blocks.length / BLOCKS_PER_PAGE)))}
                            disabled={currentPage >= Math.ceil(blocks.length / BLOCKS_PER_PAGE)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                        >
                            Next
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Placeholder for 'New Block' - Removed from grid */}
            {/* 
                    <div className="group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:bg-slate-50 dark:hover:bg-[#1c1f27]/50 transition-all duration-200 flex items-center justify-center h-[210px] cursor-pointer opacity-60">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <span className="material-symbols-outlined text-3xl">add_circle</span>
                            <p className="text-xs font-bold uppercase tracking-widest">New Block</p>
                        </div>
                    </div>

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
        </ErrorBoundary>
    );
};
