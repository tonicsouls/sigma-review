// Basic Atom Wrappers
export interface QuestionOption {
    id: string;
    text: string;
}

export interface Question {
    id: string;
    stimulus: string;
    options: QuestionOption[];
    correct_option_id: string;
    feedback: string;
}

export interface QuizData {
    quiz_type: 'FlashCard' | 'ImageSelect';
    questions: Question[];
}

// Block Definition (Matches Stitcher output)
export interface Block {
    blockId: string;
    hourId: string;
    title: string;
    atomType: string;
    durationMinutes: number;
    images: string[];
    audio?: string;
    imagePrompts?: string;
    audioScript?: string;
    citation?: string;
    quiz?: QuizData;
    status?: 'pending' | 'reviewed' | 'has_notes';
    rawAtoms?: any[]; // Full fidelity from Stitcher
}

export interface Correction {
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
}

export interface Hour {
    id: string;
    title: string;
    blockCount: number;
    completedCount: number;
}

