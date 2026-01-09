import type { Block } from '../types';
import { Stitcher } from '../services/stitcher';
import { useReviewStore } from '../store/useReviewStore';

/**
 * Simple in‑memory cache for the manifest list.
 * It lives for the duration of the page session.
 */
let manifestCache: string[] | null = null;
let cachedHourId: string | null = null;

/**
 * Load all blocks for a given hour.
 * - Reads the manifest (cached per session).
 * - Filters for the requested hour.
 * - Fetches each block via Stitcher and builds a `Block` object.
 *   The `images` array contains full URLs for visual atoms.
 */
export async function loadHourBlocks(hourId: string): Promise<Block[]> {
    const { preferences } = useReviewStore.getState();
    const stitcher = Stitcher.getInstance();

    // 1️⃣ Fetch manifest (cached)
    if (!manifestCache || cachedHourId !== hourId) {
        const rawPaths = await stitcher.fetchManifest(preferences.backendUrl);
        manifestCache = rawPaths;
        cachedHourId = hourId;
    }

    // 2️⃣ Filter for the requested hour (handles "1", "h1", "Hour 1")
    const hourNum = hourId.replace(/[^0-9]/g, '');
    const hourPaths = (manifestCache || []).filter((path) => {
        const lower = path.toLowerCase();
        return (
            lower.includes(`hour ${hourNum}`) ||
            lower.includes(`hour_${hourNum}`) ||
            lower.includes(`h${hourNum}`) ||
            lower.includes(`hour ${hourNum}`)
        );
    });

    const blocks: Block[] = [];

    // 3️⃣ Fetch each block and construct the Block shape expected by the UI
    for (const path of hourPaths) {
        const scorpionBlock = await stitcher.fetchBlock(preferences.backendUrl, path);
        if (!scorpionBlock) continue;

        // Build image URLs from visual atoms (asset_id field)
        const images: string[] = [];
        if (Array.isArray(scorpionBlock.atoms)) {
            for (const atom of scorpionBlock.atoms) {
                if (atom.atom_type === 'visual' && atom.asset_id) {
                    // asset URL prefix points to the OMEGA folder for this block
                    const directoryPath = path.substring(0, path.lastIndexOf('/'));
                    const assetUrlPrefix = `${preferences.backendUrl.replace(/\/$/, '')}/api/scorpion/${directoryPath}`;
                    images.push(`${assetUrlPrefix}/${atom.asset_id}`);
                }
            }
        }

        const reviewBlock: Block = {
            blockId: scorpionBlock.block_id,
            hourId,
            title: scorpionBlock.block_title || `Block ${scorpionBlock.block_id}`,
            atomType: scorpionBlock.atom_type || 'visual',
            durationMinutes: scorpionBlock.duration_minutes || 0,
            images,
            audio: scorpionBlock.audio || undefined,
            imagePrompts: scorpionBlock.image_prompts || undefined,
            audioScript: scorpionBlock.script || undefined,
            quiz: scorpionBlock.quiz || undefined,
            status: scorpionBlock.status || 'pending',
        };
        blocks.push(reviewBlock);
    }

    return blocks;
}

/**
 * Load a single block – used by the BlockDetail view.
 * This implementation still uses the older DRAFT_CONTENT path for fallback.
 */
export async function loadBlock(blockId: string, hourId: string): Promise<Block | null> {
    try {
        const manifestPath = `${process.env.VITE_DRAFT_CONTENT_PATH}/${blockId}/manifest.json`;
        const manifestResponse = await fetch(manifestPath);
        if (!manifestResponse.ok) return null;
        const manifest = await manifestResponse.json();
        // For brevity we return a minimal Block; the UI will request assets via the API when needed.
        return {
            blockId,
            hourId,
            title: manifest.title || `Block ${blockId}`,
            atomType: manifest.atom_type || 'visual',
            durationMinutes: manifest.duration_minutes || 0,
            images: [],
            status: 'pending',
        } as any;
    } catch (e) {
        console.error(`Error loading block ${blockId}:`, e);
        return null;
    }
}

/**
 * Helper to get a public URL – currently a passthrough.
 */
export function getPublicUrl(path: string): string {
    return path;
}
