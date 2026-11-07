import { quantityItems } from '../data/quantities';
import { questionById, questions, questionsByStage } from '../data/questions';
import type { Question, SaveData } from './types';
import { isNegative } from './text';

export function answerText(data: Pick<SaveData, 'answers'>, id: string): string {
  return data.answers[id]?.[0] ?? '';
}

export function isAnswered(question: Question, data: SaveData): boolean {
  if (question.id === 'م2') {
    const chosen = data.answers['م1'] ?? [];
    if (chosen.length === 0 && !data.other['م1']?.trim()) return false;
    const techs = chosen.filter((option) => !isNegative(option));
    if (techs.length === 0) return true;
    return techs.every((tech) => Boolean(data.priorities[tech]));
  }
  if (question.type === 'text') return answerText(data, question.id).trim().length > 0;
  if ((data.answers[question.id]?.length ?? 0) > 0) return true;
  return Boolean(data.other[question.id]?.trim());
}

export function quantityFilled(data: SaveData, label: string): boolean {
  const value = data.quantities[label];
  return Boolean(value && typeof value.count === 'number' && value.count >= 0);
}

export function stageStats(stageId: number, data: SaveData): { answered: number; total: number } {
  if (stageId === 9) {
    const total = quantityItems.length;
    const answered = quantityItems.filter((item) => quantityFilled(data, item.label)).length;
    return { answered, total };
  }
  const list = questionsByStage(stageId);
  return {
    total: list.length,
    answered: list.filter((question) => isAnswered(question, data)).length,
  };
}

export function completionRatio(data: SaveData): number {
  const questionTotal = questions.length;
  const questionDone = questions.filter((question) => isAnswered(question, data)).length;
  const quantityTotal = quantityItems.length;
  const quantityDone = quantityItems.filter((item) => quantityFilled(data, item.label)).length;
  const total = questionTotal + quantityTotal;
  if (total === 0) return 0;
  return (questionDone + quantityDone) / total;
}

export function questionPath(id: string): string {
  const question = questionById(id);
  if (!question) return '/review';
  const list = questionsByStage(question.stage);
  const index = Math.max(0, list.findIndex((item) => item.id === id));
  return `/wizard/${question.stage}/${index}`;
}
