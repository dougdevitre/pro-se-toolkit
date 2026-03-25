/**
 * @module types
 *
 * Core type definitions for the Pro Se Assistant Toolkit.
 * Includes interfaces for case types, checklists, deadlines,
 * court preparation scenarios, and jurisdiction configurations.
 */

export interface CaseType {
  id: string;
  name: string;
  category: 'custody' | 'divorce' | 'protection-order' | 'child-support' | 'adoption' | 'other';
  jurisdiction: string;
  description: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  completed: boolean;
  dueDate?: Date;
  helpText?: string;
  jurisdictionNotes?: string;
}

export interface Deadline {
  id: string;
  caseId: string;
  title: string;
  dueDate: Date;
  type: 'filing' | 'hearing' | 'response' | 'discovery' | 'other';
  reminderDays: number[];
  completed: boolean;
}

export interface CourtPrepScenario {
  id: string;
  caseType: string;
  questions: PracticeQuestion[];
  tips: string[];
}

export interface PracticeQuestion {
  question: string;
  sampleAnswer: string;
  category: 'judge-question' | 'opening' | 'evidence' | 'objection';
}
