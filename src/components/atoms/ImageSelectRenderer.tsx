import { useState } from 'react';
import type { QuizData } from '../../types';

interface ImageSelectRendererProps {
    data: QuizData;
    onAddNote?: (questionId: string, note: string) => void;
}

export function ImageSelectRenderer({ data, onAddNote }: ImageSelectRendererProps) {
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setSelectedOptions(prev => ({ ...prev, [questionId]: optionId }));
    };

    const toggleReveal = (questionId: string) => {
        setRevealed(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    // Helper to determine if an option text is actually an image URL
    const isImageUrl = (text: string) => {
        return text.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || text.includes('/content/');
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-6">
            {data.questions.map((q, index) => {
                const isRevealed = revealed[q.id];
                const selected = selectedOptions[q.id];
                const isCorrect = selected === q.correct_option_id;

                return (
                    <div key={q.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* Header / Stimulus */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Question {index + 1}</span>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-2">{q.stimulus}</h3>
                        </div>

                        {/* Image Options Grid */}
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {q.options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(q.id, opt.id)}
                                    className={`relative group text-left rounded-lg border-2 transition-all overflow-hidden ${selected === opt.id
                                            ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                        }`}
                                >
                                    {/* Image Container */}
                                    <div className="aspect-video bg-gray-100 dark:bg-gray-900 w-full overflow-hidden relative">
                                        {isImageUrl(opt.text) ? (
                                            <img
                                                src={opt.text}
                                                alt={`Option ${opt.id}`}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full p-4 text-center text-gray-500 text-sm">
                                                Image not found: {opt.text}
                                            </div>
                                        )}

                                        {/* Selection Checkmark */}
                                        {selected === opt.id && (
                                            <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full shadow-md">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    {/* Label (Optional, if we want to show A/B/C etc) */}
                                    <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                                        <span className={`text-sm font-medium ${selected === opt.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                            Option {opt.id}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Feedback / Reveal Area */}
                        <div className="px-6 pb-6">
                            {selected && !isRevealed && (
                                <button
                                    onClick={() => toggleReveal(q.id)}
                                    className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Check Answer
                                </button>
                            )}

                            {isRevealed && (
                                <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'}`}>
                                    <p className="font-bold mb-1">
                                        {isCorrect ? '✅ Correct!' : '❌ Incorrect'}
                                    </p>
                                    <p className="text-sm">{q.feedback}</p>
                                </div>
                            )}

                            {/* Reviewer Actions */}
                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                                <button
                                    onClick={() => onAddNote?.(q.id, `Issue with Q${index + 1} (${q.id})`)}
                                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                                >
                                    🏳️ Flag Issue
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default ImageSelectRenderer;
