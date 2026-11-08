import guideJson from '../../data/guide.generated.json';
import { completionRatio } from '../progress';
import type { SaveData } from '../types';
import type { GuideActivity, GuideDoc, GuideStage, GuideStep } from './parseGuide';

export const guide = guideJson as GuideDoc;

function criteriaIn(title: string): string[] {
  return title.match(/[A-Z]{1,2}\.[A-Z]\d+/g) ?? [];
}

export function stageSteps(stage: GuideStage): GuideStep[] {
  return stage.flow.flatMap((item) => (item.type === 'step' ? [item.step] : []));
}

export function countedSteps(stage: GuideStage): GuideStep[] {
  return stageSteps(stage).filter((step) => !step.optional);
}

export function stageRatio(stage: GuideStage, progress: SaveData['progress']): number {
  const steps = countedSteps(stage);
  if (steps.length === 0) return 0;
  const done = steps.filter((step) => progress[step.id]?.done).length;
  return done / steps.length;
}

export function activityRatio(activity: GuideActivity, progress: SaveData['progress']): number {
  const steps = activity.stages.flatMap((stage) => countedSteps(stage));
  if (steps.length === 0) return 0;
  const done = steps.filter((step) => progress[step.id]?.done).length;
  return done / steps.length;
}

export function guideRatio(progress: SaveData['progress']): number {
  const steps = guide.activities.flatMap((activity) => activity.stages.flatMap((stage) => countedSteps(stage)));
  if (steps.length === 0) return 0;
  const done = steps.filter((step) => progress[step.id]?.done).length;
  return done / steps.length;
}

export function partOneReady(data: SaveData): boolean {
  return completionRatio(data) >= 1;
}

export type StageRef = { activity: GuideActivity; stage: GuideStage; activityIndex: number; stageIndex: number };

export function allStages(): StageRef[] {
  const list: StageRef[] = [];
  guide.activities.forEach((activity, activityIndex) => {
    activity.stages.forEach((stage, stageIndex) => {
      list.push({ activity, stage, activityIndex, stageIndex });
    });
  });
  return list;
}

export function findStage(activityId: string, stageId: string): StageRef | undefined {
  return allStages().find((item) => item.activity.id === activityId && item.stage.id === stageId);
}

export function stagePath(activityId: string, stageId: string): string {
  return `/guide/${activityId}/${stageId}`;
}

export function neighbor(current: StageRef, direction: -1 | 1): StageRef | undefined {
  const list = allStages();
  const index = list.findIndex((item) => item.activity.id === current.activity.id && item.stage.id === current.stage.id);
  return list[index + direction];
}

export function activityEntry(activity: GuideActivity, data: SaveData): string {
  if (data.position.activity === activity.id && findStage(activity.id, data.position.stage)) {
    return stagePath(activity.id, data.position.stage);
  }
  const open = activity.stages.find((stage) => stageRatio(stage, data.progress) < 1);
  const stage = open ?? activity.stages[0];
  return stage ? stagePath(activity.id, stage.id) : '/guide';
}

export function resumePath(data: SaveData): string {
  const saved = findStage(data.position.activity, data.position.stage);
  if (saved) return stagePath(saved.activity.id, saved.stage.id);
  const open = allStages().find((item) => stageRatio(item.stage, data.progress) < 1);
  const target = open ?? allStages()[0];
  return target ? stagePath(target.activity.id, target.stage.id) : '/guide';
}

export function stageCriteria(stage: GuideStage): string[] {
  const found = new Set<string>();
  const take = (title: string) => {
    for (const match of criteriaIn(title)) found.add(match);
  };
  take(stage.title);
  for (const step of stageSteps(stage)) take(step.title);
  return [...found];
}

export function activityHasProgress(activity: GuideActivity, data: SaveData): boolean {
  if (data.position.activity === activity.id) return true;
  return activity.stages.some((stage) => stageSteps(stage).some((step) => data.progress[step.id]?.done) || data.skipped[stage.id]);
}
