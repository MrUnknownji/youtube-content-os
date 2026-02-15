import type { ThumbnailConcept } from '@/types';

export const MOCK_TITLES = [
  "I Tried This for 30 Days. The Results Shocked Me.",
  "The Productivity Method That Actually Works (Science-Backed)",
  "Why You're Still Procrastinating (And the Real Fix)",
  "This Changed How I Work Forever",
  "Stop Doing This If You Want to Be Productive",
  "The 90-Minute Secret Top Creators Use",
  "I Was Wrong About Productivity (Here's What Works)",
  "The Counterintuitive Way to 10x Your Output",
  "Why Hard Work Isn't Enough (Do This Instead)",
  "The Focus Technique That Changed Everything"
];

export const MOCK_THUMBNAIL_CONCEPTS: ThumbnailConcept[] = [
  {
    id: 'thumb-1',
    title: 'Before/After Split',
    description: 'Split-screen showing stressed vs. focused versions of the same person',
    layout: 'Left: Chaos (notifications, clutter) | Right: Focus (clean desk, calm)',
    textOverlay: '30 DAY RESULTS',
    colorScheme: 'High contrast with green accent for "after" side'
  },
  {
    id: 'thumb-2',
    title: 'The Big Number',
    description: 'Large "10x" text with person looking shocked/amazed',
    layout: 'Center: Giant "10x" | Bottom: Person with surprised expression',
    textOverlay: '10x OUTPUT',
    colorScheme: 'Bold red/yellow gradient background'
  },
  {
    id: 'thumb-3',
    title: 'The Mistake Reveal',
    description: 'Person holding sign or pointing at common mistake',
    layout: 'Person center frame, pointing down or holding sign',
    textOverlay: 'STOP DOING THIS',
    colorScheme: 'Warning orange with bold white text'
  },
  {
    id: 'thumb-4',
    title: 'The Transformation',
    description: 'Calendar or clock visual showing 30-day progression',
    layout: 'Calendar graphic with highlighted dates, upward arrow',
    textOverlay: '30 DAYS → RESULTS',
    colorScheme: 'Clean blue/white professional look'
  },
  {
    id: 'thumb-5',
    title: 'The Secret Reveal',
    description: 'Person whispering or holding hand to mouth conspiratorially',
    layout: 'Close-up of face, intimate framing',
    textOverlay: 'THE SECRET',
    colorScheme: 'Dark background with spotlight effect'
  }
];
