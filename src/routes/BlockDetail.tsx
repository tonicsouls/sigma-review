import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReviewStore } from '../store/useReviewStore';
import { Stitcher } from '../services/stitcher';
import type { ScorpionBlock, VisualAtom } from '../services/stitcher';
import { api } from '../services/api';
import { AtomEditorModal } from '../components/AtomEditorModal';

interface AtomFeedback {
  atomId: string;
  status: 'keep' | 'delete' | 'regen' | 'note';
  notes: string;
}

export const BlockDetail: React.FC = () => {
    const { blockId, hourId } = useParams();
    const navigate = useNavigate();
    const { preferences, corrections, addCorrection } = useReviewStore();
    const [block, setBlock] = useState<ScorpionBlock | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [genResult, setGenResult] = useState<{ status: string, message?: string } | null>(null);
    const [selectedAtom, setSelectedAtom] = useState<VisualAtom | null>(null);
    const [showAtomEditor, setShowAtomEditor] = useState(false);
    const [atomFeedback, setAtomFeedback] = useState<Map<string, AtomFeedback>>(new Map());

    const fetchDeepBlock = async () => {
        if (!blockId) return;
        setLoading(true);
        const stitcher = Stitcher.getInstance();
        const manifest = await stitcher.fetchManifest(preferences.backendUrl);
        const blockPath = manifest.find(p => p.includes(blockId));

        if (blockPath) {
            const deepBlock = await stitcher.fetchBlock(preferences.backendUrl, blockPath);
            setBlock(deepBlock);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDeepBlock();
    }, [blockId, preferences.backendUrl]);

    const handleRegenerate = async (slide?: VisualAtom) => {
        if (!blockId) return;

        const target = slide ? `slide_${String.fromCharCode(96 + Number(slide.id))}` : 'all';
        const targets = slide ? [target] : [];

        setGenerating(target);
        setGenResult(null);

        try {
            const res = await api.generate(blockId, targets, true);
            if (res.status === 'success') {
                setGenResult({ status: 'success', message: 'Generation Complete' });
                await fetchDeepBlock();
            } else {
                setGenResult({ status: 'error', message: res.details || 'Failed' });
            }
        } catch (e) {
            setGenResult({ status: 'error', message: 'Network Error' });
        } finally {
            setGenerating(null);
        }
    };

    const handleAtomAction = (atomId: string, action: 'keep' | 'delete' | 'regen' | 'note', notes?: string) => {
        const feedback: AtomFeedback = {
            atomId,
            status: action,
            notes: notes || '',
        };
        setAtomFeedback(new Map(atomFeedback).set(atomId, feedback));

        // Add to corrections store
        if (blockId && hourId) {
          addCorrection({
            blockId,
            hourId,
            assetType: 'image',
            assetName: atomId,
            issue: action === 'delete' ? 'Marked for deletion' : action === 'regen' ? 'Marked for regeneration' : notes || 'Reviewed',
            priority: action === 'delete' ? 'high' : 'medium',
            status: 'pending',
          });
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-slate-500">Loading Asset...</div>;
    if (!block) return <div className="h-screen flex items-center justify-center text-red-500">Asset Not Found</div>;

    const visuals = block.atoms.filter(a => a.atom_type === 'visual') as VisualAtom[];
    const scripts = block.atoms.filter(a => a.atom_type === 'script');
    const audio = block.atoms.filter(a => a.atom_type === 'audio');
    const quiz = block.atoms.filter(a => a.atom_type === 'quiz');

    return (
        <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-background-dark/50 border-b border-slate-200 dark:border-border-dark shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/hour/${hourId}`)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="h-4 w-[1px] bg-border-dark"></div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                        Block Review: {block.block_title} <span className="text-slate-500 font-normal">({block.block_id})</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {generating && <div className="text-xs font-mono text-primary animate-pulse">GENERATING ASSETS...</div>}
                    {genResult && <div className={`text-xs font-bold ${genResult.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>{genResult.message}</div>}

                    <button
                        onClick={() => handleRegenerate()}
                        disabled={!!generating}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        <span>Regen All</span>
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Submit Review</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Visual Atoms Section */}
                    {visuals.length > 0 && (
                        <section className="bg-white dark:bg-[#1c1f27] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-lg">image</span>
                                Visual Atoms ({visuals.length})
                            </h2>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {visuals.map((vis, idx) => {
                                  const feedback = atomFeedback.get(vis.id);
                                  return (
                                    <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
                                        {/* Thumbnail */}
                                        <div
                                          className="relative bg-black aspect-video flex items-center justify-center cursor-pointer group"
                                          onClick={() => {
                                            setSelectedAtom(vis);
                                            setShowAtomEditor(true);
                                          }}
                                        >
                                            <img
                                                src={`http://localhost:5173${vis.url}?t=${Date.now()}`}
                                                className="max-h-full max-w-full object-contain"
                                                alt={`Slide ${vis.id}`}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://placeholder.pics/svg/600x400/333333/AAAAAA/Missing';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-white text-3xl">expand</span>
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Slide {vis.id.toUpperCase()}</span>
                                                {feedback && (
                                                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                                                    feedback.status === 'keep' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
                                                    feedback.status === 'delete' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300' :
                                                    feedback.status === 'regen' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                                  }`}>
                                                    {feedback.status === 'keep' ? '✅ Keep' : feedback.status === 'delete' ? '🔴 Delete' : feedback.status === 'regen' ? '🔄 Regen' : '📝 Note'}
                                                  </span>
                                                )}
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                  onClick={() => handleAtomAction(vis.id, 'keep')}
                                                  className="flex-1 py-1.5 px-2 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-950/50 transition-colors"
                                                >
                                                  ✅ Keep
                                                </button>
                                                <button
                                                  onClick={() => handleRegenerate(vis)}
                                                  disabled={!!generating}
                                                  className="flex-1 py-1.5 px-2 text-[10px] font-bold rounded bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50"
                                                >
                                                  🔄 Regen
                                                </button>
                                                <button
                                                  onClick={() => handleAtomAction(vis.id, 'delete')}
                                                  className="flex-1 py-1.5 px-2 text-[10px] font-bold rounded bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors"
                                                >
                                                  🔴 Delete
                                                </button>
                                            </div>

                                            {/* Prompt Preview */}
                                            <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 p-2 bg-slate-50 dark:bg-[#111318] rounded">
                                                {vis.metadata?.prompt || "No prompt"}
                                            </div>
                                        </div>
                                    </div>
                                  );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Script Section */}
                    {scripts.length > 0 && (
                        <section className="bg-white dark:bg-[#1c1f27] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-lg">description</span>
                                Script Content ({scripts.length})
                            </h2>
                            <div className="space-y-6">
                                {scripts.map((script: any, idx) => (
                                    <div key={idx} className="space-y-4 p-4 bg-slate-50 dark:bg-[#111318] rounded-lg border border-slate-200 dark:border-slate-800">
                                        <section>
                                            <h4 className="text-xs font-bold text-primary mb-2 uppercase">Scenario</h4>
                                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{script.content.SCENARIO}</p>
                                        </section>
                                        <section>
                                            <h4 className="text-xs font-bold text-primary mb-2 uppercase">Connection</h4>
                                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{script.content.COSMETOLOGY_CONNECTION}</p>
                                        </section>
                                        <section className="p-3 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-500">
                                            <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-2 uppercase flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">gavel</span> Law
                                            </h4>
                                            <p className="text-sm italic text-slate-700 dark:text-slate-200">{script.content.THE_LAW}</p>
                                        </section>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Audio Section */}
                    {audio.length > 0 && (
                        <section className="bg-white dark:bg-[#1c1f27] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-lg">headphones</span>
                                Audio Content ({audio.length})
                            </h2>
                            <div className="space-y-4">
                                {audio.map((aud: any, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-[#111318] rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                                        <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
                                            <span className="material-symbols-outlined">play_arrow</span>
                                        </button>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">Audio Narration</p>
                                            <p className="text-xs text-slate-500">{aud.metadata?.duration || 'Duration unknown'}</p>
                                        </div>
                                        <button
                                          onClick={() => handleRegenerate()}
                                          className="px-3 py-1.5 text-xs font-bold rounded bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 transition-colors"
                                        >
                                            🔄 Regen
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Quiz Section */}
                    {quiz.length > 0 && (
                        <section className="bg-white dark:bg-[#1c1f27] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-lg">quiz</span>
                                Quiz/Callout ({quiz.length})
                            </h2>
                            <div className="space-y-4">
                                {quiz.map((q: any, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-[#111318] rounded-lg border border-slate-200 dark:border-slate-800">
                                        <p className="text-sm text-slate-700 dark:text-slate-200">{q.content || q.metadata?.text || 'Quiz content'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Atom Editor Modal */}
            {showAtomEditor && selectedAtom && (
              <AtomEditorModal
                atom={selectedAtom}
                blockId={blockId || ''}
                onClose={() => {
                  setShowAtomEditor(false);
                  setSelectedAtom(null);
                }}
                onSave={(feedback) => {
                  handleAtomAction(selectedAtom.id, feedback.status, feedback.notes);
                  setShowAtomEditor(false);
                }}
              />
            )}
        </div>
    );
};
                    {genResult && <div className={`text-xs font-bold ${genResult.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>{genResult.message}</div>}

                    <button
                        onClick={() => handleRegenerate()}
                        disabled={!!generating}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-all disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span>
                        <span>Regen All</span>
                    </button>

                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        <span>Submit Final Review</span>
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <main className="flex-1 flex overflow-hidden p-6 gap-6">

                {/* Section 1: Media Preview Area */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1c1f27] rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col h-full overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">image</span>
                                Visual Output
                            </h3>
                            {/* Simple single view for MVP - could be carousel */}
                            <div className="text-xs text-slate-500">Showing First Atom for Demo</div>
                        </div>

                        {/* THE IMAGE - Just showing first one for simplicity or we map them? Let's map the first one */}
                        {visuals.length > 0 && visuals.map((vis, idx) => (
                            <div key={idx} className="mb-8 p-4 border border-slate-700 rounded-lg relative">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-bold text-slate-300">Slide {vis.id}</span>
                                    <button
                                        onClick={() => handleRegenerate(vis)}
                                        disabled={!!generating}
                                        className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[10px]">{generating?.includes(vis.id) ? 'sync' : 'refresh'}</span>
                                        Regen Slide
                                    </button>
                                </div>
                                <div className="relative flex-1 bg-black rounded-lg overflow-hidden group flex items-center justify-center min-h-[300px]">
                                    <img
                                        src={`http://localhost:5173${vis.url}?t=${Date.now()}`} // Anti-cache hack
                                        className="max-h-full max-w-full object-contain"
                                        alt="Visual Asset"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://placeholder.pics/svg/800x600/333333/AAAAAA/Image%20Not%20Found';
                                        }}
                                    />
                                </div>
                                <div className="mt-2 p-2 bg-slate-900 rounded text-xs font-mono text-slate-400">
                                    {vis.metadata?.prompt || "No prompt data"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 2: Script Panel */}
                <div className="w-1/4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1c1f27] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">description</span>
                                ScriptAtom Data
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
                            {scripts.map((script: any, idx) => (
                                <div key={idx} className="space-y-6">
                                    <section>
                                        <h4 className="text-xs font-bold text-primary mb-2 uppercase">Scenario</h4>
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{script.content.SCENARIO}</p>
                                    </section>
                                    <section>
                                        <h4 className="text-xs font-bold text-primary mb-2 uppercase">Connection</h4>
                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{script.content.COSMETOLOGY_CONNECTION}</p>
                                    </section>
                                    <section className="p-4 bg-slate-50 dark:bg-[#111318] rounded-lg border-l-4 border-red-500">
                                        <h4 className="text-xs font-bold text-red-500 mb-2 uppercase flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">gavel</span> Law
                                        </h4>
                                        <p className="text-sm font-medium italic text-slate-700 dark:text-slate-200">{script.content.THE_LAW}</p>
                                    </section>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section 3: Feedback Panel (Placeholder/Existing) */}
                <div className="w-1/4 flex flex-col gap-4">
                    {/* Keeping existing layout for Feedback... */}
                    <div className="bg-white dark:bg-[#1c1f27] rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">fact_check</span>
                                QC Feedback
                            </h3>
                        </div>
                        <div className="p-6 text-sm text-slate-500">
                            Feedback tools are active.
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

