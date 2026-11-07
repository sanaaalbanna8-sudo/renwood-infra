import type { SaveData } from './types';

export const SIMILARITY_FLAG = 0.85;

export function isSimilar(score: number): boolean {
  return score > SIMILARITY_FLAG;
}

export function choicePairs(data: Pick<SaveData, 'answers' | 'priorities'>): Set<string> {
  const pairs = new Set<string>();
  for (const [id, options] of Object.entries(data.answers)) {
    if (id === 'ص2') continue;
    for (const option of options) pairs.add(`${id}::${option}`);
  }
  for (const [tech, priority] of Object.entries(data.priorities)) {
    if (priority) pairs.add(`م2::${tech}::${priority}`);
  }
  return pairs;
}

export function jaccard(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 && right.size === 0) return 0;
  let shared = 0;
  for (const item of left) {
    if (right.has(item)) shared += 1;
  }
  const union = left.size + right.size - shared;
  if (union === 0) return 0;
  return shared / union;
}

export type SimilarityPair = {
  left: string;
  right: string;
  score: number;
};

export function similarityPairs(
  students: { name: string; answers: SaveData['answers']; priorities: SaveData['priorities'] }[],
): SimilarityPair[] {
  const sets = students.map((student) => ({
    name: student.name,
    pairs: choicePairs(student),
  }));
  const result: SimilarityPair[] = [];
  for (let i = 0; i < sets.length; i += 1) {
    for (let j = i + 1; j < sets.length; j += 1) {
      result.push({
        left: sets[i].name,
        right: sets[j].name,
        score: jaccard(sets[i].pairs, sets[j].pairs),
      });
    }
  }
  return result.sort((a, b) => b.score - a.score);
}
