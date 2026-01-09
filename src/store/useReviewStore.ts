import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define types inline to avoid runtime import issues
type Block = {
    blockId: string;
    hourId: string;
    title: string;
    atomType: 'Video' | 'FlashCard' | 'ImageSelect';
    durationMinutes: number;
    images: string[];
    audio?: string;
    imagePrompts?: string;
    audioScript?: string;
    status?: 'pending' | 'reviewed' | 'has_notes';
};

type Correction = {
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
    saveCorrection: (blockId: string, correction: BlockCorrection) => void; // Added

    // Preferences
    preferences: {
        gridSize: 'normal' | 'compact' | 'comfortable'; // Changed type
        darkMode: boolean;
    };
    setPreference: <K extends keyof ReviewState['preferences']>(key: K, value: ReviewState['preferences'][K]) => void; // Added

    exportCorrections: () => string;
}

export const useReviewStore = create<ReviewState>()(
    persist(
        (set, get) => ({
            blocks: [],
            corrections: [],
            selectedHour: null,
            selectedBlock: null,
            // Preferences
            preferences: {
                gridSize: 'normal', // Initialized with new type
                darkMode: false,
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
                const timestamp = Date.now();

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
                                ...correction
                            } as Correction
                        ]
                    };
                }
            }),

            updateCorrection: (id, updates) => set((state) => ({
                corrections: state.corrections.map((c) =>
                    c.id === id ? { ...c, ...updates } : c
                ),
            })),

            deleteCorrection: (id) => set((state) => ({
                corrections: state.corrections.filter((c) => c.id !== id),
            })),

            exportCorrections: () => {
                const { corrections } = get();
                return JSON.stringify({ corrections }, null, 2);
            },

            // New setPreference method
            setPreference: (key, value) => set((state) => ({
                preferences: { ...state.preferences, [key]: value }
            })),
        }),
        {
            name: 'sigma-review-storage',
            partialize: (state) => ({
                corrections: state.corrections,
                preferences: state.preferences // Added to persistence whitelist
            }),
        }
    )
);
```
