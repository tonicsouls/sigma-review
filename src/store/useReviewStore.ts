import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Define types inline to avoid runtime import issues
import type { AnyAtom } from '../services/stitcher';

// --- Types ---

export type Block = {
    blockId: string;
    hourId: string;
    title: string;
    atomType: 'Video' | 'FlashCard' | 'ImageSelect' | 'Mixed' | 'script' | 'visual' | 'audio';
    durationMinutes: number;
    images: string[];
    audio?: string;
    imagePrompts?: string;
    audioScript?: string;
    citation?: string;
    status?: 'pending' | 'reviewed' | 'has_notes';
    rawAtoms?: AnyAtom[];
};

export type Correction = {
    id: string;
    blockId: string;
    hourId: string;
    assetType: 'image' | 'audio' | 'prompt';
    assetName: string;
    issue: string;
    priority?: 'low' | 'medium' | 'high';
    status: 'pending' | 'fixed';
    createdAt: string;
    createdBy?: string;
};

interface ReviewState {
    blocks: Block[];
    corrections: Correction[];
    selectedHour: string | null;
    selectedBlock: string | null;

    setBlocks: (blocks: Block[]) => void;
    setSelectedHour: (hourId: string) => void;
    setSelectedBlock: (blockId: string) => void;
    addCorrection: (correction: Omit<Correction, 'id' | 'createdAt'>) => void;
    saveCorrection: (blockId: string, correction: Partial<Correction>) => void;
    updateCorrection: (id: string, updates: Partial<Correction>) => void;
    deleteCorrection: (id: string) => void;

    // Preferences
    preferences: {
        gridSize: 'normal' | 'compact' | 'comfortable';
        darkMode: boolean;
        backendUrl: string;
    };
    setPreference: <K extends keyof ReviewState['preferences']>(key: K, value: ReviewState['preferences'][K]) => void;

    exportCorrections: () => string;
}

// --- Store ---

export const useReviewStore = create<ReviewState>()(
    persist(
        (set, get) => ({
            blocks: [],
            corrections: [],
            selectedHour: null,
            selectedBlock: null,

            // Preferences Default
            preferences: {
                gridSize: 'normal',
                darkMode: false,
                backendUrl: 'http://localhost:5000',
            },

            setBlocks: (blocks) => set({ blocks }),
            setSelectedHour: (hourId) => set({ selectedHour: hourId }),
            setSelectedBlock: (blockId) => set({ selectedBlock: blockId }),

            addCorrection: (correction) => set((state) => ({
                corrections: [
                    ...state.corrections,
                    {
                        ...correction,
                        id: `correction_${Date.now()}`,
                        createdAt: new Date().toISOString(),
                    },
                ],
            })),

            saveCorrection: (blockId, correction) => set((state) => {
                const existingIndex = state.corrections.findIndex(c => c.blockId === blockId);
                // If we were strictly updating by ID, we'd use updateCorrection.
                // saveCorrection implies "add or update for this block".
                // But generally corrections are one-per-item?
                // Let's keep logic simple: If there is an existing correction *for this block*, update it.
                // (This might be logic for single-correction-per-block, which is fine for now)

                const timestamp = new Date().toISOString();

                if (existingIndex >= 0) {
                    const updatedCorrections = [...state.corrections];
                    updatedCorrections[existingIndex] = {
                        ...updatedCorrections[existingIndex],
                        ...correction
                    };
                    return { corrections: updatedCorrections };
                } else {
                    return {
                        corrections: [
                            ...state.corrections,
                            {
                                id: crypto.randomUUID(),
                                blockId,
                                createdAt: timestamp,
                                status: 'pending',
                                hourId: 'unknown', // Fallback, should include in arg
                                assetType: 'image',
                                assetName: 'general',
                                issue: 'Generic Issue',
                                ...correction
                            } as Correction
                        ]
                    };
                }
            }),

            updateCorrection: (id: string, updates: Partial<Correction>) => set((state) => ({
                corrections: state.corrections.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                ),
            })),

            deleteCorrection: (id: string) => set((state) => ({
                corrections: state.corrections.filter((c) => c.id !== id),
            })),

            exportCorrections: () => {
                const { corrections } = get();
                return JSON.stringify({ corrections }, null, 2);
            },

            setPreference: (key, value) => set((state) => ({
                preferences: { ...state.preferences, [key]: value }
            })),
        }),
        {
            name: 'sigma-review-storage',
            partialize: (state) => ({
                corrections: state.corrections,
                preferences: state.preferences
            }),
        }
    )
);
