import { useState } from 'react';

interface ImagePreviewModalProps {
    imageUrl: string;
    imageName: string;
    imagePrompt?: string;
    currentStatus: 'neutral' | 'keep' | 'delete' | 'regen';
    onStatusChange: (status: 'neutral' | 'keep' | 'delete' | 'regen') => void;
    onClose: () => void;
    onAddNote: (note: string) => void;
}

function ImagePreviewModal({
    imageUrl,
    imageName,
    imagePrompt,
    currentStatus,
    onStatusChange,
    onClose,
    onAddNote,
}: ImagePreviewModalProps) {
    const [note, setNote] = useState('');

    const handleAddNote = () => {
        if (note.trim()) {
            onAddNote(note);
            setNote('');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{imageName}</h3>
                    <button onClick={onClose} className="close-button">✕</button>
                </div>

                <div className="status-selector mb-4">
                    <label className="status-radio">
                        <input
                            type="radio"
                            name="status"
                            value="keep"
                            checked={currentStatus === 'keep'}
                            onChange={() => onStatusChange('keep')}
                        />
                        <span className="status-label status-keep">🟢 Keep</span>
                    </label>

                    <label className="status-radio">
                        <input
                            type="radio"
                            name="status"
                            value="delete"
                            checked={currentStatus === 'delete'}
                            onChange={() => onStatusChange('delete')}
                        />
                        <span className="status-label status-delete">🔴 Delete</span>
                    </label>

                    <label className="status-radio">
                        <input
                            type="radio"
                            name="status"
                            value="regen"
                            checked={currentStatus === 'regen'}
                            onChange={() => onStatusChange('regen')}
                        />
                        <span className="status-label status-regen">🟡 Regen</span>
                    </label>

                    <label className="status-radio">
                        <input
                            type="radio"
                            name="status"
                            value="neutral"
                            checked={currentStatus === 'neutral'}
                            onChange={() => onStatusChange('neutral')}
                        />
                        <span className="status-label status-neutral">⚪ Neutral</span>
                    </label>
                </div>

                <div className="image-container">
                    <img src={imageUrl} alt={imageName} className="preview-image" />
                </div>

                {imagePrompt && (
                    <div className="detail-section mt-4">
                        <h4>Image Prompt:</h4>
                        <pre className="prompt-text">{imagePrompt}</pre>
                    </div>
                )}

                <div className="detail-section mt-4">
                    <h4>Notes for this image:</h4>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Enter correction note for this specific image..."
                        rows={3}
                    />
                    <button onClick={handleAddNote} className="primary mt-2">
                        Add Note
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ImagePreviewModal;
