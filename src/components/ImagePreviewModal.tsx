import { useEffect, useState } from 'react';
import ImageMaskEditor from './ImageMaskEditor';

interface ImagePreviewModalProps {
    imageUrl: string;
    imageName: string;
    imagePrompt?: string;
    currentStatus: 'neutral' | 'keep' | 'delete' | 'regen';
    onStatusChange: (status: 'neutral' | 'keep' | 'delete' | 'regen') => void;
    onClose: () => void;
    onAddNote: (note: string) => void;
    onRegen?: () => void; // New prop for direct regen
}

function ImagePreviewModal({
    imageUrl,
    imageName,
    imagePrompt,
    currentStatus,
    onStatusChange,
    onClose,
    onAddNote,
    onRegen,
}: ImagePreviewModalProps) {
    const [note, setNote] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isEditing) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, isEditing]);

    const handleAddNote = () => {
        if (note.trim()) {
            onAddNote(note);
            setNote('');
        }
    };

    if (isEditing) {
        return (
            <div className="fixed inset-0 z-50 bg-black/90 p-4">
                <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl max-w-6xl mx-auto">
                    <ImageMaskEditor
                        imageUrl={imageUrl}
                        onCancel={() => setIsEditing(false)}
                        onSave={(mask, prompt) => {
                            console.log('In-Paint Request:', { mask, prompt });
                            onStatusChange('regen');
                            onAddNote(`[SMART EDIT] Prompt: "${prompt}" | Mask: ${JSON.stringify(mask)}`);
                            setIsEditing(false);
                        }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-6xl h-[90vh] flex flex-col md:flex-row bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Left: Image Canvas */}
                <div className="flex-1 bg-black flex items-center justify-center relative group">
                    <img
                        src={imageUrl}
                        alt={imageName}
                        className="max-w-full max-h-full object-contain"
                    />

                    {/* Overlay Actions */}
                    <div className="absolute bottom-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onRegen && (
                            <button
                                onClick={onRegen}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg font-medium transition-transform hover:scale-105"
                            >
                                <span>⚡ Quick Regen</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg font-medium transition-transform hover:scale-105"
                        >
                            <span>🎨 Smart Edit</span>
                        </button>
                    </div>
                </div>

                {/* Right: Controls Panel */}
                <div className="w-full md:w-96 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col">

                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Asset ID</h3>
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate" title={imageName}>{imageName}</p>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">

                        {/* Status Selector */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Review Status</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => onStatusChange('keep')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${currentStatus === 'keep'
                                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                            : 'border-gray-200 hover:border-green-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                        }`}
                                >
                                    <span className="text-xl">🟢</span>
                                    <span className="text-xs font-bold">KEEP</span>
                                </button>

                                <button
                                    onClick={() => onStatusChange('delete')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${currentStatus === 'delete'
                                            ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                            : 'border-gray-200 hover:border-red-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                        }`}
                                >
                                    <span className="text-xl">🔴</span>
                                    <span className="text-xs font-bold">DELETE</span>
                                </button>

                                <button
                                    onClick={() => onStatusChange('regen')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${currentStatus === 'regen'
                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                                            : 'border-gray-200 hover:border-yellow-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                        }`}
                                >
                                    <span className="text-xl">🟡</span>
                                    <span className="text-xs font-bold">REGEN</span>
                                </button>

                                <button
                                    onClick={() => onStatusChange('neutral')}
                                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${currentStatus === 'neutral'
                                            ? 'border-gray-400 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                            : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-400'
                                        }`}
                                >
                                    <span className="text-xl">⚪</span>
                                    <span className="text-xs font-bold">RESET</span>
                                </button>
                            </div>
                        </div>

                        {/* Prompt Display */}
                        {imagePrompt && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Generation Prompt</h4>
                                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs leading-relaxed text-gray-700 dark:text-gray-300 font-mono">
                                    {imagePrompt}
                                </div>
                            </div>
                        )}

                        {/* Notes Input */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Specific Notes</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Describe issue (e.g. 'Hand distorted')"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                />
                                <button
                                    onClick={handleAddNote}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold text-sm transition-colors dark:bg-gray-700 dark:text-gray-200"
                                >
                                    Add
                                </button>
                            </div>
                        </div>

                    </div>
                    {/* End Scrollable Content */}

                </div>
            </div>
        </div>
    );
}

export default ImagePreviewModal;
