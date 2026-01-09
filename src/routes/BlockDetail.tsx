import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReviewStore } from '../store/useReviewStore';
import { Stitcher } from '../services/stitcher';
import type { ScorpionBlock, VisualAtom } from '../services/stitcher';
import { api } from '../services/api';
import { AtomEditorModal } from '../components/AtomEditorModal';
import { AudioPlayer } from '../components/AudioPlayer';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { assetLogger } from '../utils/assetLogger';
import { getMockBlock } from '../utils/mockData';

const ATOMS_PER_PAGE = 10;

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
    const [error, setError] = useState<string | null>(null);
    const [generating, setGenerating] = useState<string | null>(null);
    const [genResult, setGenResult] = useState<{ status: string, message?: string } | null>(null);
    const [selectedAtom, setSelectedAtom] = useState<VisualAtom | null>(null);
    const [showAtomEditor, setShowAtomEditor] = useState(false);
    const [atomFeedback, setAtomFeedback] = useState<Map<string, AtomFeedback>>(new Map());
    const [currentAtomPage, setCurrentAtomPage] = useState(1);

    const fetchDeepBlock = async () => {
        if (!blockId) {
            setError('No block ID provided');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const stitcher = Stitcher.getInstance();
            const manifest = await stitcher.fetchManifest(preferences.backendUrl);
            
            let deepBlock: ScorpionBlock | null = null;
            
            // Try API first, fall back to mock data
            if (manifest && manifest.length > 0) {
                const blockPath = manifest.find(p => p.includes(blockId));
                if (blockPath) {
                    deepBlock = await stitcher.fetchBlock(preferences.backendUrl, blockPath);
                }
            }
            
            // Fall back to mock data if API failed
            if (!deepBlock) {
                console.warn('API failed, loading mock data for block:', blockId);
                deepBlock = getMockBlock(blockId);
            }
            
            if (!deepBlock) {
                throw new Error(`Block ${blockId} not found in manifest or mock data`);
            }
            setBlock(deepBlock);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error loading block';
            setError(errorMsg);
            assetLogger.logManifestError(errorMsg, `block/${blockId}`);
            console.error('BlockDetail fetch error:', err);
        } finally {
            setLoading(false);
        }
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
                const errMsg = res.details || 'Generation failed';
                setGenResult({ status: 'error', message: errMsg });
                assetLogger.logNetworkError(errMsg, { blockId, targets });
            }
        } catch (e) {
            const errMsg = e instanceof Error ? e.message : 'Network error during generation';
            setGenResult({ status: 'error', message: errMsg });
            assetLogger.logNetworkError(errMsg, { blockId, endpoint: '/generate' });
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
    
    if (error) {
        return (
            <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden p-6">
                <div className="max-w-2xl mx-auto w-full">
                    <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg">
                        <div className="flex items-start gap-4">
                            <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400 shrink-0">error</span>
                            <div className="flex-1">
                                <h2 className="text-lg font-bold text-red-900 dark:text-red-300 mb-2">Failed to Load Block</h2>
                                <p className="text-sm text-red-800 dark:text-red-400 font-mono mb-4">{error}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchDeepBlock()}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={() => navigate(`/hour/${hourId}`)}
                                        className="px-4 py-2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-bold rounded transition-colors"
                                    >
                                        Back to Hour
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!block) return <div className="h-screen flex items-center justify-center text-red-500">Asset Not Found</div>;

    const visuals = block.atoms.filter(a => a.atom_type === 'visual') as VisualAtom[];
    const scripts = block.atoms.filter(a => a.atom_type === 'script');
    const audio = block.atoms.filter(a => a.atom_type === 'audio');
    const quiz = block.atoms.filter(a => a.atom_type === 'quiz');

    return (
        <ErrorBoundary>
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
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">image</span>
                                    Visual Atoms ({visuals.length})
                                </h2>
                                {visuals.length > ATOMS_PER_PAGE && (
                                    <div className="text-xs font-medium text-slate-500">
                                        Page {currentAtomPage} of {Math.ceil(visuals.length / ATOMS_PER_PAGE)}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                {visuals
                                    .slice((currentAtomPage - 1) * ATOMS_PER_PAGE, currentAtomPage * ATOMS_PER_PAGE)
                                    .map((vis, idx) => {
                                  const feedback = atomFeedback.get(vis.atom_id);
                                  const imageSrc = vis.asset_id && vis.asset_id.startsWith('http')
                                    ? vis.asset_id
                                    : `/assets/images/${vis.asset_id || 'placeholder.svg'}`;
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
                                                src={`${imageSrc}?t=${Date.now()}`}
                                                className="max-h-full max-w-full object-contain"
                                                alt={`Slide ${vis.atom_id}`}
                                                onError={(e) => {
                                                    const imgPath = imageSrc;
                                                    assetLogger.logMissingAsset(vis.atom_id, imgPath, 'image');
                                                    (e.target as HTMLImageElement).src = '/assets/images/placeholder.svg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-white text-3xl">expand</span>
                                            </div>
                                        </div>

                                        {/* Meta */}
                                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Slide {vis.atom_id?.toUpperCase() || 'N/A'}</span>
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
                                                  onClick={() => handleAtomAction(vis.atom_id, 'keep')}
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
                                                  onClick={() => handleAtomAction(vis.atom_id, 'delete')}
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
                            {/* Pagination Controls */}
                            {visuals.length > ATOMS_PER_PAGE && (
                                <div className="mt-6 flex items-center justify-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                                    <button
                                        onClick={() => setCurrentAtomPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentAtomPage === 1}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentAtomPage(prev => Math.min(prev + 1, Math.ceil(visuals.length / ATOMS_PER_PAGE)))}
                                        disabled={currentAtomPage >= Math.ceil(visuals.length / ATOMS_PER_PAGE)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Next
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            )}
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
                            <div className="space-y-6">
                                {audio.map((aud: any, idx) => (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-[#111318] rounded-lg border border-slate-200 dark:border-slate-800">
                                        <div className="mb-4">
                                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Audio Track {idx + 1}</h4>
                                            {aud.metadata?.description && (
                                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{aud.metadata.description}</p>
                                            )}
                                        </div>
                                        
                                        {/* Audio Player */}
                                        {aud.url ? (
                                          <div className="mb-4">
                                            <AudioPlayer
                                              src={`http://localhost:5173${aud.url}`}
                                              duration={aud.metadata?.duration}
                                              onError={(err) => {
                                                assetLogger.logMissingAsset(aud.id, aud.url, 'audio');
                                                console.error('Audio playback error:', err);
                                              }}
                                            />
                                          </div>
                                        ) : (
                                          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded text-xs text-amber-700 dark:text-amber-400 mb-4">
                                            No audio file available
                                          </div>
                                        )}

                                        {/* Regen Button */}
                                        <div className="flex gap-2">
                                            <button
                                              onClick={() => handleRegenerate()}
                                              disabled={!!generating}
                                              className="flex-1 px-3 py-2 text-xs font-bold rounded bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                              <span className="material-symbols-outlined text-sm">🔄</span>
                                              Regenerate Audio
                                            </button>
                                        </div>

                                        {/* Metadata */}
                                        {aud.metadata && Object.keys(aud.metadata).length > 0 && (
                                          <div className="mt-4 p-3 bg-white dark:bg-[#111318] rounded text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                            {aud.metadata.duration && <p>Duration: {aud.metadata.duration}</p>}
                                            {aud.metadata.bitrate && <p>Bitrate: {aud.metadata.bitrate}</p>}
                                            {aud.metadata.format && <p>Format: {aud.metadata.format}</p>}
                                          </div>
                                        )}
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
                                {quiz.map((q: any, idx) => {
                                  // Safely serialize quiz content
                                  const getQuizContent = (quizAtom: any): string => {
                                    try {
                                      if (typeof quizAtom.content === 'string') return quizAtom.content;
                                      if (quizAtom.content?.question) return quizAtom.content.question;
                                      if (quizAtom.content?.text) return quizAtom.content.text;
                                      if (quizAtom.metadata?.question) return quizAtom.metadata.question;
                                      if (quizAtom.metadata?.text) return quizAtom.metadata.text;
                                      if (typeof quizAtom.content === 'object') {
                                        return Object.entries(quizAtom.content)
                                          .map(([key, val]) => `${key}: ${val}`)
                                          .join('\n');
                                      }
                                      return 'Quiz content available';
                                    } catch (e) {
                                      console.warn(`Failed to parse quiz content at index ${idx}:`, e);
                                      return 'Unable to display quiz content';
                                    }
                                  };

                                  const quizContent = getQuizContent(q);
                                  const quizMeta = typeof q.metadata === 'object' ? q.metadata : {};

                                  return (
                                    <div key={idx} className="p-4 bg-slate-50 dark:bg-[#111318] rounded-lg border border-slate-200 dark:border-slate-800">
                                      <div className="flex items-start justify-between mb-3">
                                        <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">Question {idx + 1}</h4>
                                        {quizMeta.type && (
                                          <span className="text-[10px] px-2 py-1 rounded bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold">
                                            {quizMeta.type}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap mb-3">
                                        {quizContent}
                                      </p>
                                      {quizMeta.options && Array.isArray(quizMeta.options) && (
                                        <div className="mt-3 space-y-2 pl-4 border-l-2 border-slate-300 dark:border-slate-600">
                                          <p className="text-[10px] font-bold text-slate-500 uppercase">Options:</p>
                                          {quizMeta.options.map((opt: any, optIdx: number) => (
                                            <p key={optIdx} className="text-xs text-slate-600 dark:text-slate-400">
                                              • {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                                            </p>
                                          ))}
                                        </div>
                                      )}
                                      {quizMeta.correctAnswer && (
                                        <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded">
                                          <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">✓ Correct Answer: {quizMeta.correctAnswer}</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
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
        </ErrorBoundary>
    );
};

