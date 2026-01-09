import type { Block } from '../types';

// Use Vite's /@fs/ prefix to access absolute paths outside root
const FS_PREFIX = '/sigma-review/@fs/';
const ROOT_PATH = 'C:/Users/Darry/OneDrive/Brain Candy portal OMBU/ROOT_BODY_X/Organs_apps/VSCodeWorkingDocs/COS-CE-2026_0106/externaldata/proposal';
const SIGMA_V3_PATH = `${FS_PREFIX}${ROOT_PATH}/SIGMA/v3`;
const DRAFT_CONTENT_PATH = `${FS_PREFIX}${ROOT_PATH}/DRAFT CONTENT/h1/Hour 1 - Sanitation`;

/**
 * Load all blocks for Hour 1 from SIGMA v3
 */
export async function loadHourBlocks(hourId: string): Promise<Block[]> {
    const blocks: Block[] = [];

    // For now, manually load blocks 001-022
    for (let i = 1; i <= 22; i++) {
        const blockId = `block_${String(i).padStart(3, '0')}`;
        const block = await loadBlock(blockId, hourId);
        if (block) {
            blocks.push(block);
        }
    }

    return blocks;
}

/**
 * Load a single block's data
 */
export async function loadBlock(blockId: string, hourId: string): Promise<Block | null> {
    try {
        // Load manifest from DRAFT CONTENT
        // Note: URL encoding might be needed for spaces in path but browser fetch usually handles it or we use encodeURI if needed
        // Safest to just use the path string if it works, or encodeURI specific parts.
        // The path contains spaces "DRAFT CONTENT", "Hour 1 - Sanitation".
        const manifestPath = `${DRAFT_CONTENT_PATH}/${blockId}/manifest.json`;
        const manifestResponse = await fetch(manifestPath);

        if (!manifestResponse.ok) {
            // Silent fail or warn
            // console.warn(`Manifest not found for ${blockId}`);
            return null;
        }

        const manifest = await manifestResponse.json();

        // Load images from SIGMA v3
        const images: string[] = [];
        const sigmaBlockPath = `${SIGMA_V3_PATH}/${blockId}`;

        // Try to load slide images (a-g)
        for (const letter of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
            const imagePath = `${sigmaBlockPath}/slide_${letter}.png`;
            try {
                const response = await fetch(imagePath, { method: 'HEAD' });
                if (response.ok) {
                    images.push(imagePath);
                }
            } catch {
                // Image doesn't exist, skip
            }
        }

        // Load audio
        const audioPath = `${sigmaBlockPath}/audio.wav`;
        let audio: string | undefined;
        try {
            const response = await fetch(audioPath, { method: 'HEAD' });
            if (response.ok) {
                audio = audioPath;
            }
        } catch {
            audio = undefined;
        }

        // Load prompts
        let imagePrompts: string | undefined;
        let audioScript: string | undefined;

        try {
            const promptsResponse = await fetch(`${DRAFT_CONTENT_PATH}/${blockId}/image_prompts.txt`);
            if (promptsResponse.ok) {
                imagePrompts = await promptsResponse.text();
            }
        } catch { }

        try {
            const scriptResponse = await fetch(`${DRAFT_CONTENT_PATH}/${blockId}/script.txt`);
            if (scriptResponse.ok) {
                audioScript = await scriptResponse.text();
            }
        } catch { }

        // Load Quiz Data
        let quiz: any = undefined;
        try {
            // Try standard quiz.json first
            let quizResponse = await fetch(`${DRAFT_CONTENT_PATH}/${blockId}/quiz.json`);
            if (!quizResponse.ok) {
                // Fallback to flashcard.json if strictly named that way in some old blocks
                quizResponse = await fetch(`${DRAFT_CONTENT_PATH}/${blockId}/flashcard.json`);
            }

            if (quizResponse.ok) {
                quiz = await quizResponse.json();
            }
        } catch (e) {
            console.warn(`Failed to parse quiz for ${blockId}`, e);
        }

        return {
            blockId,
            hourId,
            title: manifest.title || `Block ${blockId}`,
            atomType: manifest.atom_type || 'Video',
            durationMinutes: manifest.duration_minutes || 2,
            images,
            audio,
            imagePrompts,
            audioScript,
            quiz, // Include quiz data
            status: 'pending',
        };
    } catch (error) {
        console.error(`Error loading block ${blockId}:`, error);
        return null;
    }
}

/**
 * Get public URL for file path
 * Not strictly needed if we just pass the fetchable URL around as the 'path'
 */
export function getPublicUrl(path: string): string {
    return path;
}
