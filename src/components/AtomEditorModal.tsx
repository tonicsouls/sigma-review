import React, { useState } from 'react';
import type { VisualAtom } from '../services/stitcher';

interface AtomFeedback {
  status: 'keep' | 'delete' | 'regen' | 'note';
  notes: string;
}

interface AtomEditorModalProps {
  atom: VisualAtom;
  onClose: () => void;
  onSave: (feedback: AtomFeedback) => void;
}

export const AtomEditorModal: React.FC<AtomEditorModalProps> = ({
  atom,
  onClose,
  onSave,
}) => {
  const [status, setStatus] = useState<'keep' | 'delete' | 'regen' | 'note'>('note');
  const [notes, setNotes] = useState('');
  const [promptEdit, setPromptEdit] = useState(atom.metadata?.prompt || '');
  const [showPromptEdit, setShowPromptEdit] = useState(false);

  const handleSave = () => {
    onSave({
      status,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111318] rounded-xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] shrink-0">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Review Slide {atom.atom_id.toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-[#1c1f27] rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 grid grid-cols-2 gap-6 p-6">
          {/* Left: Full Image */}
          <div className="flex flex-col gap-4">
            <div className="bg-black rounded-lg overflow-hidden flex items-center justify-center aspect-video">
              <img
                src={`http://localhost:5173${atom.url}?t=${Date.now()}`}
                className="max-h-full max-w-full object-contain"
                alt={`Slide ${atom.atom_id}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placeholder.pics/svg/800x600/333333/AAAAAA/Missing';
                }}
              />
            </div>

            {/* Prompt Section */}
            <div className="bg-slate-50 dark:bg-[#1c1f27] rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400">Generation Prompt</h4>
                <button
                  onClick={() => setShowPromptEdit(!showPromptEdit)}
                  className="text-xs text-primary hover:underline"
                >
                  {showPromptEdit ? 'Done' : 'Edit'}
                </button>
              </div>
              {showPromptEdit ? (
                <textarea
                  value={promptEdit}
                  onChange={(e) => setPromptEdit(e.target.value)}
                  className="w-full h-32 p-2 bg-white dark:bg-[#111318] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm font-mono resize-none"
                />
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                  {atom.metadata?.prompt || 'No prompt data'}
                </p>
              )}
            </div>
          </div>

          {/* Right: QC Feedback */}
          <div className="flex flex-col gap-4">
            {/* Status Radio Buttons */}
            <div className="bg-slate-50 dark:bg-[#1c1f27] rounded-lg border border-slate-200 dark:border-slate-800 p-4">
              <h4 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-4">QC Status</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white dark:hover:bg-[#1c1f27] rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="keep"
                    checked={status === 'keep'}
                    onChange={(e) => setStatus(e.target.value as 'keep')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">✅ Keep</p>
                    <p className="text-xs text-slate-500">Asset is good, no changes needed</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white dark:hover:bg-[#1c1f27] rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="regen"
                    checked={status === 'regen'}
                    onChange={(e) => setStatus(e.target.value as 'regen')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">🔄 Regenerate</p>
                    <p className="text-xs text-slate-500">Needs new generation with edits</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white dark:hover:bg-[#1c1f27] rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="delete"
                    checked={status === 'delete'}
                    onChange={(e) => setStatus(e.target.value as 'delete')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">🔴 Delete</p>
                    <p className="text-xs text-slate-500">Remove this asset from block</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 hover:bg-white dark:hover:bg-[#1c1f27] rounded-lg transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="note"
                    checked={status === 'note'}
                    onChange={(e) => setStatus(e.target.value as 'note')}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">📝 Add Note</p>
                    <p className="text-xs text-slate-500">Feedback or observation only</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Notes Field */}
            <div className="bg-slate-50 dark:bg-[#1c1f27] rounded-lg border border-slate-200 dark:border-slate-800 p-4 flex-1 flex flex-col">
              <h4 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-3">QC Notes</h4>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add feedback, issues, or suggestions..."
                className="flex-1 p-3 bg-white dark:bg-[#111318] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer: Save & Cancel */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111318] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-white font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">check</span>
            Save Feedback
          </button>
        </div>
      </div>
    </div>
  );
};
