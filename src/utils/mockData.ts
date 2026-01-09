import type { ScorpionBlock } from '../services/stitcher';

/**
 * Mock data for development/testing
 * Simulates what would come from the backend API
 */

export const mockBlocks: Record<string, ScorpionBlock> = {
  '001': {
    block_id: '001',
    block_title: 'Block 001 - Introduction',
    lesson_title: 'Lesson 1',
    hour_name: 'Hour 1',
    duration_minutes: 5,
    tdlr_citation: 'Sanitation basics overview',
    atoms: [
      // Visual atoms
      {
        atom_id: 'vis-001-a',
        atom_type: 'visual',
        asset_id: 'https://picsum.photos/seed/vis001a/900/500',
        metadata: {
          prompt: 'Create an image showing proper hand washing technique',
          description: 'Hand washing demonstration',
          duration: 30,
          notes: 'High quality, professional appearance',
        },
      },
      {
        atom_id: 'vis-001-b',
        atom_type: 'visual',
        asset_id: 'https://picsum.photos/seed/vis001b/900/500',
        metadata: {
          prompt: 'Show a clean workspace with sanitation supplies',
          description: 'Clean workspace setup',
          duration: 30,
          notes: 'Bright, well-lit environment',
        },
      },
      // Script atom
      {
        atom_id: 'script-001',
        atom_type: 'script',
        metadata: {
          speaker: 'Instructor',
        },
        content: {
          SCENARIO:
            'A cosmetologist begins their day by properly sanitizing their workspace and hands before working with clients.',
          COSMETOLOGY_CONNECTION:
            'Proper sanitation prevents disease transmission and maintains professional standards in cosmetology.',
          THE_LAW:
            'State regulations require sanitization of all tools and workspace before client contact.',
        },
      },
      // Audio atom
      {
        atom_id: 'aud-001',
        atom_type: 'audio',
        asset_id: 'asset-aud-001.mp3',
        metadata: {
          linked_script_atom: 'script-001',
          duration: 120,
          speaker: 'Professional voice',
        },
      },
      // Quiz atom
      {
        atom_id: 'quiz-001',
        atom_type: 'quiz',
        quiz_type: 'multiple-choice',
        metadata: {
          difficulty: 'beginner',
          points: 10,
        },
        content: {
          question: 'What is the first step in proper sanitation?',
          options: [
            { text: 'Wash hands with soap and water', isCorrect: true },
            { text: 'Put on gloves', isCorrect: false },
            { text: 'Apply sanitizer', isCorrect: false },
          ],
          feedback: 'Hand washing with soap and water is the foundation of sanitation.',
        },
      },
    ],
  },
  '002': {
    block_id: '002',
    block_title: 'Block 002 - Tool Sanitization',
    lesson_title: 'Lesson 2',
    hour_name: 'Hour 1',
    duration_minutes: 5,
    tdlr_citation: 'Tool sanitization procedures',
    atoms: [
      {
        atom_id: 'vis-002-a',
        atom_type: 'visual',
        asset_id: 'https://picsum.photos/seed/vis002a/900/500',
        metadata: {
          prompt: 'Display various cosmetology tools being sanitized',
          description: 'Tool sanitization process',
          duration: 30,
        },
      },
      {
        atom_id: 'script-002',
        atom_type: 'script',
        metadata: {
          speaker: 'Instructor',
        },
        content: {
          SCENARIO:
            'A cosmetologist demonstrates the proper sanitization of scissors, combs, and other tools.',
          COSMETOLOGY_CONNECTION:
            'Tools must be sanitized between clients to prevent cross-contamination.',
          THE_LAW:
            'All tools must be sanitized using approved methods as defined by state regulations.',
        },
      },
      {
        atom_id: 'quiz-002',
        atom_type: 'quiz',
        quiz_type: 'multiple-choice',
        metadata: {
          difficulty: 'beginner',
          points: 10,
        },
        content: {
          question: 'How often should tools be sanitized?',
          options: [
            { text: 'Between every client', isCorrect: true },
            { text: 'At the end of the day', isCorrect: false },
            { text: 'Once a week', isCorrect: false },
          ],
          feedback: 'Tools must be sanitized between every client interaction.',
        },
      },
    ],
  },
};

/**
 * Get a mock block by ID
 */
export function getMockBlock(blockId: string): ScorpionBlock | null {
  return mockBlocks[blockId] || null;
}

/**
 * Get all mock block IDs for an hour
 */
export function getMockBlockIdsForHour(hourId: string): string[] {
  const hourNum = hourId.replace(/[^0-9]/g, '');
  return Object.keys(mockBlocks)
    .filter((id) => {
      const block = mockBlocks[id];
      return block.hour_name.toLowerCase().includes(`hour ${hourNum}`);
    })
    .sort();
}
