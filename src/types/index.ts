completedCount: number;
}

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

export interface Block {
    blockId: string;
    hourId: string;
    title: string;
    atomType: 'Video' | 'FlashCard' | 'ImageSelect';
    durationMinutes: number;
    images: string[];
    audio?: string;
    imagePrompts?: string;
    audioScript?: string;
    quiz?: QuizData;
    status?: 'pending' | 'reviewed' | 'has_notes';
}
hourId: string;
assetType: 'image' | 'audio' | 'prompt';
assetName: string;
issue: string;
priority ?: 'low' | 'medium' | 'high';
status: 'pending' | 'fixed';
createdAt: string;
createdBy ?: string;
}

export interface Hour {
    id: string;
    title: string;
    blockCount: number;
    completedCount: number;
}
