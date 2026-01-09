import { useRef, useState, useEffect } from 'react';

interface ImageMaskEditorProps {
    imageUrl: string;
    onSave: (mask: { x: number; y: number; w: number; h: number }, prompt: string) => void;
    onCancel: () => void;
}

export function ImageMaskEditor({ imageUrl, onSave, onCancel }: ImageMaskEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [selection, setSelection] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
    const [prompt, setPrompt] = useState('');

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const image = new Image();
        image.src = imageUrl;
        image.onload = () => {
            // Fit canvas to container while maintaining aspect ratio
            const aspect = image.width / image.height;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            let drawWidth = containerWidth;
            let drawHeight = containerWidth / aspect;

            if (drawHeight > containerHeight) {
                drawHeight = containerHeight;
                drawWidth = drawHeight * aspect;
            }

            canvas.width = drawWidth;
            canvas.height = drawHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(image, 0, 0, drawWidth, drawHeight);
            }
        };
    }, [imageUrl]);

    // Redraw loop (image + selection rect)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const image = new Image();
        image.src = imageUrl;
        // We rely on the initial load to set dimensions, but for redraw we need the image source again or cached
        // For simplicity in this React effect cycle, we re-draw the image then the rect
        // Optimally we'd separate the background layer, but this is fast enough for a UI tool

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // Warning: this might flicker if image isn't cached by browser, logic implies it is

        // Draw Selection Overlay
        if (selection) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(selection.x, selection.y, selection.w, selection.h);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(selection.x, selection.y, selection.w, selection.h);
        } else if (isDrawing) {
            const w = currentPos.x - startPos.x;
            const h = currentPos.y - startPos.y;
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(startPos.x, startPos.y, w, h);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(startPos.x, startPos.y, w, h);
        }

    }, [imageUrl, selection, isDrawing, currentPos, startPos]);


    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setSelection(null); // Clear previous selection
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const w = currentPos.x - startPos.x;
        const h = currentPos.y - startPos.y;

        // Normalize rect (handle negative width/height)
        const finalX = w < 0 ? currentPos.x : startPos.x;
        const finalY = h < 0 ? currentPos.y : startPos.y;
        const finalW = Math.abs(w);
        const finalH = Math.abs(h);

        if (finalW > 5 && finalH > 5) { // Prevent accidental tiny clicks
            setSelection({ x: finalX, y: finalY, w: finalW, h: finalH });
        }
    };

    const handleSubmit = () => {
        if (selection && prompt) {
            onSave(selection, prompt);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-white p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Smart Edit (In-Painting)</h3>
                <button onClick={onCancel} className="text-gray-400 hover:text-white">Cancel</button>
            </div>

            <div className="flex-1 relative flex items-center justify-center bg-black rounded-lg overflow-hidden border border-gray-700" ref={containerRef}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="cursor-crosshair max-w-full max-h-full"
                />
                {!selection && !isDrawing && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/50 px-4 py-2 rounded text-sm text-gray-300">
                            Draw a box around the area to edit
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 flex gap-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the change (e.g. 'Remove cup', 'Add sunglasses')"
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={!selection}
                />
                <button
                    onClick={handleSubmit}
                    disabled={!selection || !prompt}
                    className="px-6 py-2 bg-blue-600 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Apply Edit
                </button>
            </div>
        </div>
    );
}

export default ImageMaskEditor;
