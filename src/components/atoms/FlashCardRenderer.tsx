import { useState } from 'react';
import type { QuizData } from '../../types';

interface FlashCardRendererProps {
    data: QuizData;
    onAddNote?: (questionId: string, note: string) => void;
}

export function FlashCardRenderer({ data, onAddNote }: FlashCardRendererProps) {
    const [revealed, setRevealed] = useState<Record<string, boolean>>({});
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setSelectedOptions(prev => ({ ...prev, [questionId]: optionId }));
    };

    const toggleReveal = (questionId: string) => {
        setRevealed(prev => ({ ...prev, [questionId]: !prev[questionId] }));
    };

    return (
        <div className="space-y-8 max-w-3xl mx-auto py-6">
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

                        {/* Options */}
                        <div className="p-6 space-y-3">
                            {q.options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(q.id, opt.id)}
                                    className={`w-full text-left p-4 rounded-lg border transition-all ${selected === opt.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                        }`}
                                >
                                    <span className={`font-medium ${selected === opt.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {opt.text}
                                    </span>
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

export default FlashCardRenderer;
