import { useState } from 'react';

interface FlashCardData {
    id: string;
    type: 'FlashCard';
    front: { content: string };
    back: { content: string };
}

interface FlashCardRendererProps {
    data: FlashCardData;
}

export function FlashCardRenderer({ data }: FlashCardRendererProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="w-full max-w-2xl mx-auto my-8">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <span className="font-semibold text-gray-700">⚡ FlashCard</span>
                    <button
                        onClick={() => setIsFlipped(!isFlipped)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                        {isFlipped ? 'Show Question' : 'Show Answer'}
                    </button>
                </div>

                <div
                    className="relative min-h-[200px] cursor-pointer perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <div className={`relative w-full h-full p-8 flex items-center justify-center text-center transition-all duration-300 ${isFlipped ? 'bg-indigo-50' : 'bg-white'}`}>
                        {isFlipped ? (
                            <div>
                                <h4 className="text-sm uppercase tracking-wider text-indigo-500 mb-2">Answer</h4>
                                <p className="text-xl font-medium text-gray-800">{data.back.content}</p>
                            </div>
                        ) : (
                            <div>
                                <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-2">Question</h4>
                                <p className="text-xl font-medium text-gray-800">{data.front.content}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
