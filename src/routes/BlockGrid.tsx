import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReviewStore } from '../store/useReviewStore';
import { loadHourBlocks } from '../utils/dataLoader';

export const BlockGrid: React.FC = () => {
    const { hourId = '1' } = useParams();
    const navigate = useNavigate();
    const { blocks, setBlocks, preferences, corrections, exportCorrections } = useReviewStore();
    const [loading, setLoading] = useState(true);

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
            const loadedBlocks = await loadHourBlocks(`h${hourId}`);
            setBlocks(loadedBlocks);
            setLoading(false);
        };
        fetchBlocks();
    }, [hourId, preferences.backendUrl]);

    if (loading) {
        return <div className="p-8 text-center text-slate-500">Loading Content Atoms from Stitcher...</div>;
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {blocks.map(block => (
                        <a href={`#/hour/${hourId}/block/${block.blockId}`} key={block.blockId} className="group scorp-card flex flex-col">
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
                        </a>
                    ))}

                    {/* Placeholder for 'New Block' */}
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
        </div>
    );
};
