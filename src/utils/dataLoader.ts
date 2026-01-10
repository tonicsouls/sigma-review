import type { Block } from '../types';
import { Stitcher } from '../services/stitcher';
import type { ScorpionBlock, VisualAtom, AudioAtom, ScriptAtom } from '../services/stitcher';
import { useReviewStore } from '../store/useReviewStore';

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

    // 1️⃣ Fetch manifest index (local or backend)
    let hourPaths: string[] = [];
    try {
        // Try local static index first to support GitHub Pages / Static Workflow
        const indexRes = await fetch(`${import.meta.env.BASE_URL}assets/manifests/index.json`);
        if (indexRes.ok) {
            const indexData = await indexRes.json();
            const hourKey = `hour_${hourId.replace(/[^0-9]/g, '')}`;
            const ids = indexData[hourKey] || [];
            hourPaths = ids.map((id: string) => `h${hourId.replace(/[^0-9]/g, '')}_block_${id}.json`);
        } else {
            // Fallback to backend if index.json is missing
            const rawPaths = await stitcher.fetchManifest(preferences.backendUrl);
            const hourNum = hourId.replace(/[^0-9]/g, '');
            hourPaths = (rawPaths || []).filter((path: string) => {
                const lower = path.toLowerCase();
                return (
                    lower.includes(`hour ${hourNum}`) ||
                    lower.includes(`hour_${hourNum}`) ||
                    lower.includes(`h${hourNum}`)
                );
            });
        }
    } catch (e) {
        console.warn("dataLoader: Local index failed, trying backend...", e);
        const rawPaths = await stitcher.fetchManifest(preferences.backendUrl);
        const hourNum = hourId.replace(/[^0-9]/g, '');
        hourPaths = (rawPaths || []).filter((path: string) => {
            const lower = path.toLowerCase();
            return lower.includes(`hour ${hourNum}`) || lower.includes(`hour_${hourNum}`) || lower.includes(`h${hourNum}`);
        });
    }

    const blocks: Block[] = [];

    // 3️⃣ Fetch each block and construct the Block shape expected by the UI
    for (const path of hourPaths) {
        let scorpBlock: ScorpionBlock | null = null;
        try {
            // Try local manifest first
            const localRes = await fetch(`${import.meta.env.BASE_URL}assets/manifests/${path}`);
            if (localRes.ok) {
                const json = await localRes.json();
                scorpBlock = stitcher.parseBlock(json);
            } else {
                scorpBlock = await stitcher.fetchBlock(preferences.backendUrl, path);
            }
        } catch (e) {
            scorpBlock = await stitcher.fetchBlock(preferences.backendUrl, path);
        }

        if (!scorpBlock) continue;

        // Build asset URLs (Images/Audio)
        const images: string[] = [];
        let audioUrl: string | undefined = undefined;
        let scriptText: string | undefined = undefined;

        if (Array.isArray(scorpBlock.atoms)) {
            for (const atom of scorpBlock.atoms) {
                if (atom.atom_type === 'visual') {
                    const vis = atom as VisualAtom;
                    let fullUrl = "";
                    if (!vis.asset_id.includes('/') && !vis.asset_id.startsWith('http')) {
                        fullUrl = `${import.meta.env.BASE_URL}assets/images/block_${scorpBlock.block_id}/${vis.asset_id}`;
                    } else if (vis.asset_id.startsWith('http')) {
                        fullUrl = vis.asset_id;
                    } else {
                        fullUrl = `${import.meta.env.BASE_URL}assets/images/${vis.asset_id}`;
                    }
                    images.push(fullUrl);
                    (atom as any).url = fullUrl;
                }
                if (atom.atom_type === 'audio') {
                    const aud = atom as AudioAtom;
                    let fullUrl = "";
                    if (!aud.asset_id.includes('/') && !aud.asset_id.startsWith('http')) {
                        fullUrl = `${import.meta.env.BASE_URL}assets/audio/block_${scorpBlock.block_id}/${aud.asset_id}`;
                    } else if (aud.asset_id.startsWith('http')) {
                        fullUrl = aud.asset_id;
                    } else {
                        fullUrl = `${import.meta.env.BASE_URL}assets/audio/${aud.asset_id}`;
                    }
                    audioUrl = fullUrl;
                    (atom as any).url = fullUrl;
                }
                if (atom.atom_type === 'script') {
                    const sc = atom as ScriptAtom;
                    if (sc.metadata?.full_script) {
                        scriptText = sc.metadata.full_script;
                    }
                }
            }
        }

        const reviewBlock: Block = {
            blockId: scorpBlock.block_id,
            hourId,
            title: scorpBlock.block_title || `Block ${scorpBlock.block_id}`,
            atomType: scorpBlock.atoms[0]?.atom_type || 'visual',
            durationMinutes: scorpBlock.duration_minutes || 0,
            images,
            audio: audioUrl,
            audioScript: scriptText,
            status: 'pending',
            rawAtoms: scorpBlock.atoms
        };
        blocks.push(reviewBlock);
    }

    return blocks;
}

/**
 * Load a single block – used by the BlockDetail view.
 */
export async function loadBlock(blockId: string, hourId: string): Promise<Block | null> {
    try {
        const hourNum = hourId.replace(/[^0-9]/g, '');
        const manifestPath = `${import.meta.env.BASE_URL}assets/manifests/h${hourNum}_block_${blockId}.json`;
        const res = await fetch(manifestPath);
        if (!res.ok) return null;

        const json = await res.json();
        const stitcher = Stitcher.getInstance();
        const scorpBlock = stitcher.parseBlock(json);

        const images: string[] = [];
        let audioUrl: string | undefined = undefined;
        let scriptText: string | undefined = undefined;

        for (const atom of scorpBlock.atoms) {
            if (atom.atom_type === 'visual') {
                const vis = atom as VisualAtom;
                let fullUrl = "";
                if (vis.asset_id.startsWith('http')) fullUrl = vis.asset_id;
                else fullUrl = `${import.meta.env.BASE_URL}assets/images/${vis.asset_id}`;
                images.push(fullUrl);
                (atom as any).url = fullUrl;
            }
            if (atom.atom_type === 'audio') {
                const aud = atom as AudioAtom;
                let fullUrl = "";
                if (aud.asset_id.startsWith('http')) fullUrl = aud.asset_id;
                else fullUrl = `${import.meta.env.BASE_URL}assets/audio/${aud.asset_id}`;
                audioUrl = fullUrl;
                (atom as any).url = fullUrl;
            }
            if (atom.atom_type === 'script') {
                const sc = atom as ScriptAtom;
                if (sc.metadata?.full_script) {
                    scriptText = sc.metadata.full_script;
                }
            }
        }

        return {
            blockId: scorpBlock.block_id,
            hourId,
            title: scorpBlock.block_title,
            atomType: scorpBlock.atoms[0]?.atom_type || 'visual',
            durationMinutes: scorpBlock.duration_minutes,
            images,
            audio: audioUrl,
            audioScript: scriptText,
            status: 'pending',
            rawAtoms: scorpBlock.atoms
        };
    } catch (e) {
        console.error(`Error loading block ${blockId}:`, e);
        return null;
    }
}

/**
 * Fetch the central index of available manifests.
 */
export async function getManifestIndex(): Promise<Record<string, string[]>> {
    try {
        const res = await fetch(`${import.meta.env.BASE_URL}assets/manifests/index.json`);
        if (!res.ok) throw new Error('Failed to load indices');
        return await res.json();
    } catch (e) {
        console.error("dataLoader: Failed to fetch manifest index", e);
        return {};
    }
}

/**
 * Helper to get a public URL – currently a passthrough.
 */
export function getPublicUrl(path: string): string {
    return path;
}
