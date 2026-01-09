import { useState, useEffect } from 'react';

interface PromptEditorProps {
    title?: string; // Optional title override
    initialPrompt: string;
    onSave: (newPrompt: string) => void;
    onRegen: (newPrompt: string) => void;
    isSaving?: boolean;
}

export function PromptEditor({ title = "Image Prompts", initialPrompt, onSave, onRegen, isSaving = false }: PromptEditorProps) {
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setPrompt(initialPrompt);
        setIsDirty(false);
    }, [initialPrompt]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setPrompt(e.target.value);
        setIsDirty(true);
    };

    const handleSave = async () => {
        try {
            await onSave(prompt);
            setIsDirty(false);
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save prompt");
        }
    };

    const handleRegen = async () => {
        try {
            await onRegen(prompt);
            setIsDirty(false);
        } catch (e) {
            console.error("Regen failed", e);
            // Error handled by parent or alert
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
                <div className="flex gap-2">
                    {isDirty && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">Unsaved Changes</span>
                    )}
                </div>
            </div>

            <textarea
                value={prompt}
                onChange={handleTextChange}
                className="w-full p-4 min-h-[150px] bg-transparent border-0 focus:ring-0 text-sm font-mono text-gray-800 dark:text-gray-200 resize-y"
                placeholder="Enter image generation prompts here..."
            />

            <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <button
                    onClick={() => setPrompt(initialPrompt)}
                    disabled={!isDirty || isSaving}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 shadow-sm"
                >
                    Save Draft
                </button>
                <button
                    onClick={handleRegen}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                >
                    {isSaving ? (
                        <span>Processing...</span>
                    ) : (
                        <>
                            <span>✨ Regenerate</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default PromptEditor;
