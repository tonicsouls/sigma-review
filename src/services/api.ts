export const API_BASE_URL = 'http://localhost:5000';

export interface GenerationResponse {
    status?: string;
    log?: string;
    error?: string;
    details?: string;
}

export const api = {
    /**
     * Updates the content of a script or image prompt file.
     */
    updatePrompt: async (blockId: string, assetType: 'script' | 'image_prompts', content: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/update_prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockId, assetType, content }),
            });
            return await response.json();
        } catch (error) {
            console.error("API Error (updatePrompt):", error);
            throw error;
        }
    },

    /**
     * Triggers generation for a block or specific slides.
     */
    generate: async (blockId: string, targets: string[] = [], force: boolean = false): Promise<GenerationResponse> => {
        try {
            const response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockId, targets, force }),
            });
            return await response.json();
        } catch (error) {
            console.error("API Error (generate):", error);
            return { error: "Network Error", details: String(error) };
        }
    },

    /**
     * Checks if the backend is running.
     */
    health: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            return await response.json();
        } catch (e) {
            return { status: 'offline' };
        }
    }
};
