import { mutator } from 'satcheljs';
import {
  getStore,
  setGrade,
  setSubject,
  setDifficulty,
  setQuestion,
  markWrongAnswer,
  markCorrect,
  nextQuestion,
  skipQuestion,
  resetSubject,
  resetGrade,
} from './appStore';

mutator(setGrade, ({ grade }) => {
  const store = getStore();
  store.selectedGrade = grade;
  store.selectedSubject = null;
  store.currentQuestion = null;
  store.wrongAnswers = [];
  store.showSuccess = false;
  store.score = 0;
  store.questionCount = 0;
  store.streak = 0;
});

mutator(setSubject, ({ subject }) => {
  const store = getStore();
  store.selectedSubject = subject;
  store.currentQuestion = null;
  store.wrongAnswers = [];
  store.showSuccess = false;
  store.score = 0;
  store.questionCount = 0;
  store.streak = 0;
});

mutator(setDifficulty, ({ difficulty }) => {
  getStore().difficulty = difficulty;
});

mutator(setQuestion, ({ question }) => {
  const store = getStore();
  store.currentQuestion = question;
  store.wrongAnswers = [];
  store.showSuccess = false;
});

mutator(markWrongAnswer, ({ answer }) => {
  const store = getStore();
  if (!store.wrongAnswers.includes(answer)) {
    store.wrongAnswers.push(answer);
  }
  store.streak = 0;
});

mutator(markCorrect, () => {
  const store = getStore();
  store.score += 1;
  store.questionCount += 1;
  store.showSuccess = true;
  store.streak += 1;
});

mutator(nextQuestion, ({ question }) => {
  const store = getStore();
  store.currentQuestion = question;
  store.wrongAnswers = [];
  store.showSuccess = false;
});

mutator(skipQuestion, ({ question }) => {
  const store = getStore();
  store.questionCount += 1;
  store.currentQuestion = question;
  store.wrongAnswers = [];
  store.showSuccess = false;
  store.streak = 0;
});

mutator(resetSubject, () => {
  const store = getStore();
  store.selectedSubject = null;
  store.currentQuestion = null;
  store.wrongAnswers = [];
  store.showSuccess = false;
  store.score = 0;
  store.questionCount = 0;
  store.streak = 0;
});

mutator(resetGrade, () => {
  const store = getStore();
  store.selectedGrade = null;
  store.selectedSubject = null;
  store.currentQuestion = null;
  store.wrongAnswers = [];
  store.showSuccess = false;
  store.score = 0;
  store.questionCount = 0;
  store.streak = 0;
});
