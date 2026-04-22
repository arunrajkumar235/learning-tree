import { createStore, action } from 'satcheljs';
import type { ActionCreator } from 'satcheljs';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  question: string;
  answer: number;
  options: number[];
  type: 'addition' | 'subtraction' | 'multiplication' | 'division';
  emoji: string;
}

export interface AppState {
  selectedGrade: number | null;
  selectedSubject: string | null;
  difficulty: Difficulty;
  currentQuestion: Question | null;
  wrongAnswers: number[];
  score: number;
  questionCount: number;
  showSuccess: boolean;
  streak: number;
}

const initialState: AppState = {
  selectedGrade: null,
  selectedSubject: null,
  difficulty: 'easy',
  currentQuestion: null,
  wrongAnswers: [],
  score: 0,
  questionCount: 0,
  showSuccess: false,
  streak: 0,
};

export const getStore = createStore<AppState>('appStore', initialState);

export const setGrade: ActionCreator<{ grade: number }> = action('setGrade');
export const setSubject: ActionCreator<{ subject: string }> = action('setSubject');
export const setDifficulty: ActionCreator<{ difficulty: Difficulty }> = action('setDifficulty');
export const setQuestion: ActionCreator<{ question: Question }> = action('setQuestion');
export const markWrongAnswer: ActionCreator<{ answer: number }> = action('markWrongAnswer');
export const markCorrect: ActionCreator<Record<string, never>> = action('markCorrect');
export const nextQuestion: ActionCreator<{ question: Question }> = action('nextQuestion');
export const skipQuestion: ActionCreator<{ question: Question }> = action('skipQuestion');
export const resetSubject: ActionCreator<Record<string, never>> = action('resetSubject');
export const resetGrade: ActionCreator<Record<string, never>> = action('resetGrade');
