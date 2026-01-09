// import { v4 as uuidv4 } from 'uuid'; // Removed in favor of native crypto

// --- ATOM DEFINITIONS ---

export type AtomType = 'script' | 'visual' | 'audio' | 'quiz' | 'reinforcement' | 'download';

export interface BaseAtom {
    atom_id: string;
    atom_type: AtomType;
    metadata?: Record<string, any>;
}

export interface ScriptAtom extends BaseAtom {
    atom_type: 'script';
    content: {
        SCENARIO: string;
        COSMETOLOGY_CONNECTION: string;
        THE_LAW: string;
    };
}

export interface VisualAtom extends BaseAtom {
    atom_type: 'visual';
    asset_id: string; // e.g., "asset-img-001a.webp"
    metadata: {
        prompt: string;
        description: string;
    };
}

export interface AudioAtom extends BaseAtom {
    atom_type: 'audio';
    asset_id: string; // e.g., "asset-aud-001.mp3"
    metadata: {
        linked_script_atom: string; // ID of the script atom
    };
}

export interface QuizAtom extends BaseAtom {
    atom_type: 'quiz';
    quiz_type: string;
    content: {
        question: string;
        options?: { text: string; isCorrect: boolean }[];
        feedback?: string;
    };
}

export type AnyAtom = ScriptAtom | VisualAtom | AudioAtom | QuizAtom | BaseAtom;

// --- BLOCK DEFINITION ---

export interface ScorpionBlock {
    block_id: string;
    block_title: string;
    lesson_title: string;
    hour_name: string;
    duration_minutes: number;
    tdlr_citation: string;
    atoms: AnyAtom[];
}

// --- STITCHER SERVICE ---

export class Stitcher {
    private static instance: Stitcher;

    private constructor() { }

    public static getInstance(): Stitcher {
        if (!Stitcher.instance) {
            Stitcher.instance = new Stitcher();
        }
        return Stitcher.instance;
    }

    /**
     * Parses a raw JSON object into a typed ScorpionBlock.
     * Useful for validation and default value injection.
     */
    public parseBlock(json: any): ScorpionBlock {
        // Basic validation could go here
        return {
            block_id: json.block_id || crypto.randomUUID(),
            block_title: json.block_title || "Untitled Block",
            lesson_title: json.lesson_title || "Unknown Lesson",
            hour_name: json.hour_name || "Unknown Hour",
            duration_minutes: json.duration_minutes || 0,
            tdlr_citation: json.tdlr_citation || "",
            atoms: Array.isArray(json.atoms) ? json.atoms : []
        };
    }

    /**
     * Fetch the list of all available blocks from the backend
     */
    public async fetchManifest(backendUrl: string): Promise<string[]> {
        try {
            const cleanUrl = backendUrl.replace(/\/$/, '');
            const res = await fetch(`${cleanUrl}/api/scorpion/manifest`);
            if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
            const data = await res.json();
            return data.blocks || [];
        } catch (e) {
            console.error("Stitcher: Failed to load manifest", e);
            return [];
        }
    }

    /**
     * Fetch and parse a specific block by its relative path
     */
    public async fetchBlock(backendUrl: string, relativePath: string): Promise<ScorpionBlock | null> {
        try {
            const cleanUrl = backendUrl.replace(/\/$/, '');
            // relativePath e.g. "Hour 1/Lesson.../001.json"
            // We need to encode it properly
            const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');

            const res = await fetch(`${cleanUrl}/api/scorpion/${encodedPath}`);
            if (!res.ok) throw new Error(`Block fetch failed: ${res.status}`);

            const json = await res.json();
            return this.parseBlock(json);
        } catch (e) {
            console.error(`Stitcher: Failed to load block ${relativePath}`, e);
            return null;
        }
    }

    /**
     * "Stitches" a block into the Review Studio's internal format.
     * @param block The raw ScorpionBlock
     * @param assetUrlPrefix The base URL for assets, e.g. "http://localhost:5000/api/scorpion/Hour 1/Lesson 1"
     */
    public stitchBlockToReviewState(block: ScorpionBlock, assetUrlPrefix: string): any {
        // Extract what the Review Studio needs
        const visuals = block.atoms.filter(a => a.atom_type === 'visual') as VisualAtom[];
        const scripts = block.atoms.filter(a => a.atom_type === 'script') as ScriptAtom[];
        // const audios = block.atoms.filter(a => a.atom_type === 'audio') as AudioAtom[]; // Unused

        // flattened "slide" list for the grid view
        const slides = visuals.map(v => ({
            id: v.asset_id,
            prompt: v.metadata.prompt,
            description: v.metadata.description,
            // Construct full URL for the image
            imageUrl: `${assetUrlPrefix}/${v.asset_id}`
        }));

        const scriptContent = scripts.map(s =>
            `[SCENARIO]: ${s.content.SCENARIO}\n[CONN]: ${s.content.COSMETOLOGY_CONNECTION}\n[LAW]: ${s.content.THE_LAW}`
        ).join("\n\n");

        return {
            blockId: block.block_id, // Map to blockId
            hourId: block.hour_name, // Map to hourId
            title: block.block_title,
            atomType: block.atoms[0]?.atom_type || 'Mixed', // Infers type
            durationMinutes: block.duration_minutes,
            citation: block.tdlr_citation,
            images: [], // Images are now in 'rawAtoms' or used via 'slides' in the enhanced UI
            // But for compatibility with existing store, we might want to populate images if possible?
            // Existing 'images' is string[]. Let's map slides to it.
            // But wait, existing images is mostly slide paths.
            // Let's populate it for backward compatibility if the UI uses it.
            // The UI uses block.images in BlockGrid.tsx.
            // So YES, we should push the URLs there.
            // Actually, the UI might need array of strings.
            // Let's map slides.imageUrl

            // ... wait, I can just return it.
            // The type definition in useReviewStore has 'images: string[]'.

            status: 'pending',
            imagePrompts: slides.map(s => s.prompt).join('\n\n'),
            audioScript: scriptContent,
            rawAtoms: block.atoms,

            // We'll hydrate the legacy 'images' array so old components work
            // (though we plan to refactor them).
            // Use type assertion cast if needed in caller, or here imply it matches the shape
        };
    }
}
