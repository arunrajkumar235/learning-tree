import { makeAutoObservable } from 'mobx';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  question: string;
  answer: number;
  options: number[];
  type: 'addition' | 'subtraction' | 'multiplication' | 'division';
  emoji: string;
}

class AppStore {
  selectedGrade: number | null = null;
  selectedSubject: string | null = null;
  difficulty: Difficulty = 'easy';
  currentQuestion: Question | null = null;
  wrongAnswers: number[] = [];
  score: number = 0;
  questionCount: number = 0;
  showSuccess: boolean = false;
  streak: number = 0;
  isDarkMode: boolean = localStorage.getItem('darkMode') === 'true';

  constructor() {
    makeAutoObservable(this);
    if (this.isDarkMode) document.documentElement.classList.add('dark');
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', String(this.isDarkMode));
    document.documentElement.classList.toggle('dark', this.isDarkMode);
  }

  setGrade(grade: number) {
    this.selectedGrade = grade;
    this.selectedSubject = null;
    this.currentQuestion = null;
    this.wrongAnswers = [];
    this.showSuccess = false;
    this.score = 0;
    this.questionCount = 0;
    this.streak = 0;
  }

  setSubject(subject: string) {
    this.selectedSubject = subject;
    this.currentQuestion = null;
    this.wrongAnswers = [];
    this.showSuccess = false;
    this.score = 0;
    this.questionCount = 0;
    this.streak = 0;
  }

  setDifficulty(difficulty: Difficulty) {
    this.difficulty = difficulty;
  }

  setQuestion(question: Question) {
    this.currentQuestion = question;
    this.wrongAnswers = [];
    this.showSuccess = false;
  }

  markWrongAnswer(answer: number) {
    if (!this.wrongAnswers.includes(answer)) {
      this.wrongAnswers.push(answer);
    }
    this.streak = 0;
  }

  markCorrect() {
    this.score += 1;
    this.questionCount += 1;
    this.showSuccess = true;
    this.streak += 1;
  }

  nextQuestion(question: Question) {
    this.currentQuestion = question;
    this.wrongAnswers = [];
    this.showSuccess = false;
  }

  skipQuestion(question: Question) {
    this.questionCount += 1;
    this.currentQuestion = question;
    this.wrongAnswers = [];
    this.showSuccess = false;
    this.streak = 0;
  }

  resetSubject() {
    this.selectedSubject = null;
    this.currentQuestion = null;
    this.wrongAnswers = [];
    this.showSuccess = false;
    this.score = 0;
    this.questionCount = 0;
    this.streak = 0;
  }

  resetGrade() {
    this.selectedGrade = null;
    this.selectedSubject = null;
    this.currentQuestion = null;
    this.wrongAnswers = [];
    this.showSuccess = false;
    this.score = 0;
    this.questionCount = 0;
    this.streak = 0;
  }
}

export const appStore = new AppStore();
