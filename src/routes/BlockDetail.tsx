import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useReviewStore } from '../store/useReviewStore';
import { loadBlock } from '../utils/dataLoader';
import ImagePreviewModal from '../components/ImagePreviewModal';
import FlashCardRenderer from '../components/atoms/FlashCardRenderer';
import ImageSelectRenderer from '../components/atoms/ImageSelectRenderer';

type ImageReviewStatus = 'neutral' | 'keep' | 'delete' | 'regen';

interface BlockData {
    blockId: string;
    hourId: string;
    title: string;
    atomType: 'Video' | 'FlashCard' | 'ImageSelect';
    durationMinutes: number;
    images: string[];
    audio?: string;
    imagePrompts?: string;
    audioScript?: string;
}

function BlockDetail() {
    const { hourId, blockId } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState('');
    const [blockData, setBlockData] = useState<BlockData | null>(null);
    const [imageStatuses, setImageStatuses] = useState<Map<string, ImageReviewStatus>>(new Map());
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);
    const { corrections, addCorrection, exportCorrections } = useReviewStore();

    useEffect(() => {
        async function loadData() {
            if (blockId && hourId) {
                const data = await loadBlock(blockId, hourId);
                if (data) {
                    setBlockData(data as BlockData);
                    // Initialize all images as neutral
                    const statuses = new Map<string, ImageReviewStatus>();
                    data.images.forEach((img) => {
                        const imageName = img.split('/').pop() || img;
                        statuses.set(imageName, 'neutral');
                    });
                    setImageStatuses(statuses);
                }
            }
        }
        loadData();
    }, [blockId, hourId]);

    const handleAddNote = () => {
        if (!note.trim() || !blockId || !hourId) return;

        addCorrection({
            blockId,
            hourId,
            assetType: 'image',
            assetName: 'manual_entry',
            issue: note,
            status: 'pending',
        });
        setNote('');
    };

    const handleExport = () => {
        const json = exportCorrections();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `corrections_${blockId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImageClick = (imageUrl: string) => {
        const imageName = imageUrl.split('/').pop() || imageUrl;
        setSelectedImage({ url: imageUrl, name: imageName });
    };

    const handleStatusChange = (status: ImageReviewStatus) => {
        if (selectedImage) {
            const newStatuses = new Map(imageStatuses);
            newStatuses.set(selectedImage.name, status);
            setImageStatuses(newStatuses);
        }
    };

    const handleImageNote = (noteText: string) => {
        if (selectedImage && blockId && hourId) {
            addCorrection({
                blockId,
                hourId,
                assetType: 'image',
                assetName: selectedImage.name,
                issue: noteText,
                status: 'pending',
            });
        }
    };

    const blockCorrections = corrections.filter((c) => c.blockId === blockId);

    if (!blockData) {
        return (
            <div className="container">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="mb-6">
                <a href={`/hour/${hourId}`} className="back-link">
                    ← Back to Blocks
                </a>
                <h2 className="page-title">
                    <span className="text-gray-400 font-normal text-xl mr-2">Hour {hourId} / Block {blockId}:</span>
                    {blockData.title}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                    Type: {blockData.atomType} | Duration: {blockData.durationMinutes} min
                </p>
            </div>

            {/* Audio Player */}
            {blockData.audio && (
                <div className="detail-section">
                    <h3 className="section-title">Audio</h3>
                    <audio controls>
                        <source src={blockData.audio} type="audio/wav" />
                        Your browser does not support the audio element.
                    </audio>
                </div>
            )}

            {/* Audio Script */}
            {blockData.audioScript && (
                <div className="detail-section">
                    <details>
                        <summary className="section-title cursor-pointer">Audio Script (click to expand)</summary>
                        <pre className="prompt-text mt-2">{blockData.audioScript}</pre>
                    </details>
                </div>
            )}

// Imports moved to top

            {/* Content Area: Quiz or Images */}
            {blockData.quiz ? (
                <div className="detail-section">
                    <h3 className="section-title">Interactive Quiz ({blockData.quiz.quiz_type})</h3>
                    {blockData.quiz.quiz_type === 'ImageSelect' ? (
                        <ImageSelectRenderer
                            data={blockData.quiz}
                            onAddNote={(questionId, note) => {
                                addCorrection({
                                    blockId: blockId!,
                                    hourId: hourId!,
                                    assetType: 'prompt',
                                    assetName: `Question ${questionId}`,
                                    issue: note,
                                    status: 'pending',
                                });
                            }}
                        />
                    ) : (
                        <FlashCardRenderer
                            data={blockData.quiz}
                            onAddNote={(questionId, note) => {
                                addCorrection({
                                    blockId: blockId!,
                                    hourId: hourId!,
                                    assetType: 'prompt',
                                    assetName: `Question ${questionId}`,
                                    issue: note,
                                    status: 'pending',
                                });
                            }}
                        />
                    )}
                </div>
            ) : (
                /* Standard Image Gallery */
                <div className="detail-section">
                    <h3 className="section-title">Images ({blockData.images.length})</h3>
                    <div className="compact-image-grid">
                        {blockData.images.map((imageUrl) => {
                            const imageName = imageUrl.split('/').pop() || imageUrl;
                            const status = imageStatuses.get(imageName) || 'neutral';
                            return (
                                <div
                                    key={imageUrl}
                                    onClick={() => handleImageClick(imageUrl)}
                                    className="compact-image-item"
                                >
                                    <img src={imageUrl} alt={imageName} className="compact-image-thumb" />
                                    <div className="compact-image-meta">
                                        <span title={imageName} className="compact-image-name">{imageName}</span>
                                        <span className={`status-badge text-[10px] ${status}`}>
                                            {status === 'keep' && '🟢'}
                                            {status === 'delete' && '🔴'}
                                            {status === 'regen' && '🟡'}
                                            {status === 'neutral' && '⚪'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Image Prompts (Only show if images exist or if needed) */}
            {blockData.imagePrompts && !blockData.quiz && (
                <div className="detail-section">
                    <details>
                        <summary className="section-title cursor-pointer">Image Prompts (click to expand)</summary>
                        <pre className="prompt-text mt-2">{blockData.imagePrompts}</pre>
                    </details>
                </div>
            )}

            {/* Correction Notes */}
            <div className="detail-section">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="section-title">Correction Notes</h3>
                    <button onClick={handleExport} className="primary">
                        Export JSON
                    </button>
                </div>

                <div className="mb-4">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Enter general correction note..."
                        rows={3}
                    />
                    <button onClick={handleAddNote} className="primary mt-2">
                        Add Note
                    </button>
                </div>

                <div className="space-y-2">
                    {blockCorrections.map((correction) => (
                        <div key={correction.id} className="note-item">
                            <p className="note-text">{correction.issue}</p>
                            <p className="note-time">
                                {correction.assetName !== 'manual_entry' && `Image: ${correction.assetName} | `}
                                {new Date(correction.createdAt).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Image Preview Modal */}
            {selectedImage && (
                <ImagePreviewModal
                    imageUrl={selectedImage.url}
                    imageName={selectedImage.name}
                    imagePrompt={blockData.imagePrompts}
                    currentStatus={imageStatuses.get(selectedImage.name) || 'neutral'}
                    onStatusChange={handleStatusChange}
                    onClose={() => setSelectedImage(null)}
                    onAddNote={handleImageNote}
                />
            )}
        </div>
    );
}

export default BlockDetail;
