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
        asset_id: 'block_001/slide_a.png',
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
        asset_id: 'block_001/slide_b.png',
        metadata: {
          prompt: 'Show a clean workspace with sanitation supplies',
          description: 'Clean workspace setup',
          duration: 30,
          notes: 'Bright, well-lit environment',
        },
      },
      {
        atom_id: 'vis-001-c',
        atom_type: 'visual',
        asset_id: 'block_001/slide_c.png',
        metadata: {
          prompt: 'Show disinfectant applied to shears',
          description: 'Disinfection step',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-001-d',
        atom_type: 'visual',
        asset_id: 'block_001/slide_d.png',
        metadata: {
          prompt: 'Rinsing tools after disinfectant',
          description: 'Rinse step',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-001-e',
        atom_type: 'visual',
        asset_id: 'block_001/slide_e.png',
        metadata: {
          prompt: 'Drying sanitized tools',
          description: 'Dry step',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-001-f',
        atom_type: 'visual',
        asset_id: 'block_001/slide_f.png',
        metadata: {
          prompt: 'Proper storage of clean tools',
          description: 'Storage step',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-001-g',
        atom_type: 'visual',
        asset_id: 'block_001/slide_g.png',
        metadata: {
          prompt: 'Final sanitized workstation overview',
          description: 'Ready for client',
          duration: 30,
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
        asset_id: 'block_001/audio.wav',
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
        asset_id: 'block_002/slide_a.png',
        metadata: {
          prompt: 'Display various cosmetology tools being sanitized',
          description: 'Tool sanitization process',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-002-b',
        atom_type: 'visual',
        asset_id: 'block_002/slide_b.png',
        metadata: {
          prompt: 'Show combs submerged in disinfectant',
          description: 'Comb disinfectant bath',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-002-c',
        atom_type: 'visual',
        asset_id: 'block_002/slide_c.png',
        metadata: {
          prompt: 'Illustrate contact time for disinfectant',
          description: 'Dwell time',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-002-d',
        atom_type: 'visual',
        asset_id: 'block_002/slide_d.png',
        metadata: {
          prompt: 'Rinsing tools after disinfectant',
          description: 'Rinse step',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-002-e',
        atom_type: 'visual',
        asset_id: 'block_002/slide_e.png',
        metadata: {
          prompt: 'Drying tools on clean towel',
          description: 'Dry step',
          duration: 30,
        },
      },
      {
        atom_id: 'vis-002-f',
        atom_type: 'visual',
        asset_id: 'block_002/slide_f.png',
        metadata: {
          prompt: 'Storing sanitized tools in closed container',
          description: 'Storage step',
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
        atom_id: 'aud-002',
        atom_type: 'audio',
        asset_id: 'block_002/audio.wav',
        metadata: {
          linked_script_atom: 'script-002',
          duration: 120,
          speaker: 'Instructor voice',
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
  '004': {
    block_id: '004',
    block_title: 'Block 004 - Disinfection Deep Dive',
    lesson_title: 'Lesson 4',
    hour_name: 'Hour 1',
    duration_minutes: 5,
    tdlr_citation: 'Advanced disinfection steps',
    atoms: [
      { atom_id: 'vis-004-a', atom_type: 'visual', asset_id: 'block_004/slide_a.png', metadata: { description: 'Setup', duration: 30 } },
      { atom_id: 'vis-004-b', atom_type: 'visual', asset_id: 'block_004/slide_b.png', metadata: { description: 'Step 1', duration: 30 } },
      { atom_id: 'vis-004-c', atom_type: 'visual', asset_id: 'block_004/slide_c.png', metadata: { description: 'Step 2', duration: 30 } },
      { atom_id: 'vis-004-d', atom_type: 'visual', asset_id: 'block_004/slide_d.png', metadata: { description: 'Step 3', duration: 30 } },
      { atom_id: 'vis-004-e', atom_type: 'visual', asset_id: 'block_004/slide_e.png', metadata: { description: 'Step 4', duration: 30 } },
      { atom_id: 'vis-004-f', atom_type: 'visual', asset_id: 'block_004/slide_f.png', metadata: { description: 'Step 5', duration: 30 } },
      { atom_id: 'vis-004-g', atom_type: 'visual', asset_id: 'block_004/slide_g.png', metadata: { description: 'Step 6', duration: 30 } },
      {
        atom_id: 'script-004',
        atom_type: 'script',
        metadata: { speaker: 'Instructor' },
        content: {
          SCENARIO: 'Demonstrating thorough disinfection workflow end-to-end.',
          COSMETOLOGY_CONNECTION: 'Ensures compliance and client safety.',
          THE_LAW: 'Follow state-mandated disinfection standards for implements and surfaces.',
        },
      },
      {
        atom_id: 'aud-004',
        atom_type: 'audio',
        asset_id: 'block_004/audio.wav',
        metadata: { linked_script_atom: 'script-004', duration: 120, speaker: 'Instructor voice' },
      },
      {
        atom_id: 'quiz-004',
        atom_type: 'quiz',
        quiz_type: 'multiple-choice',
        metadata: { difficulty: 'intermediate', points: 10 },
        content: {
          question: 'What is the correct order of disinfection steps?',
          options: [
            { text: 'Clean, Disinfect, Rinse, Dry, Store', isCorrect: true },
            { text: 'Disinfect, Clean, Store', isCorrect: false },
            { text: 'Store, Clean, Disinfect', isCorrect: false },
          ],
          feedback: 'Follow the full sequence to ensure effectiveness and safety.',
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
