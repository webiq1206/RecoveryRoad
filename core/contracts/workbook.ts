import type { WorkbookAnswer } from '../../types';

export interface WorkbookDomainCommands {
  saveWorkbookAnswer: (answer: WorkbookAnswer) => void;
  getWorkbookAnswer: (sectionId: string, questionId: string) => WorkbookAnswer | null;
  getSectionProgress: (sectionId: string, totalQuestions: number) => number;
}

export type WorkbookDomain = WorkbookDomainCommands;

