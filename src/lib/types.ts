export type QuestionType = 'single' | 'multi' | 'text';

export type Question = {
  id: string;
  stage: number;
  type: QuestionType;
  short: string;
  text: string;
  options: string[];
  hint?: string;
  why?: Record<string, string>;
  /** شرح قصير لمعنى خيار، يظهر تحت نصه. المفتاح هو نص الخيار حرفياً. */
  gloss?: Record<string, string>;
};

export type QuantityValue = {
  count: number | null;
  location: string;
};

export type StepMark = {
  done: boolean;
  at: string;
};

export type GuidePosition = {
  activity: string;
  stage: string;
};

export type SaveData = {
  version: 1;
  name: string;
  group: string;
  createdAt: string;
  updatedAt: string;
  lastPath: string;
  readingDone: boolean;
  introsSeen: number[];
  answers: Record<string, string[]>;
  other: Record<string, string>;
  priorities: Record<string, string>;
  quantities: Record<string, QuantityValue>;
  understanding: string;
  progress: Record<string, StepMark>;
  skipped: Record<string, string>;
  position: GuidePosition;
};

export type StudentFile = {
  version: 1;
  name: string;
  group: string;
  createdAt: string;
  answers: Record<string, string[]>;
  other: Record<string, string>;
  priorities: Record<string, string>;
  quantities: Record<string, { count: number; location: string }>;
  understanding: string;
};

export type Warning = {
  ruleId: string;
  message: string;
  detail?: string;
  questionIds: string[];
};
