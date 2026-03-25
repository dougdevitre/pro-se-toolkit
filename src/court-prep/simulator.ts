/**
 * @module court-prep/simulator
 *
 * Court preparation simulator that walks users through
 * what to expect at their hearing. Covers courtroom
 * etiquette, common judge questions, how to present
 * evidence, and what to do if things go wrong.
 */

import type { CourtPrepScenario, PracticeQuestion } from '../types';

/** A user's answer to a practice question, with scoring. */
export interface PracticeAnswer {
  questionIndex: number;
  userAnswer: string;
  score: number;
  feedback: string;
}

/** Summary of a completed court prep simulation session. */
export interface SimulationSummary {
  caseType: string;
  questionsAttempted: number;
  averageScore: number;
  strongAreas: string[];
  weakAreas: string[];
  tips: string[];
}

/** Configuration for the court prep simulator. */
export interface SimulatorConfig {
  /** Whether to randomize question order */
  randomizeQuestions?: boolean;
  /** Maximum questions per session (0 = all) */
  maxQuestions?: number;
  /** Include etiquette tips between questions */
  showEtiquetteTips?: boolean;
}

/**
 * CourtPrepSimulator walks self-represented litigants through
 * realistic court preparation scenarios, providing practice
 * questions, feedback, and a day-of companion checklist.
 */
export class CourtPrepSimulator {
  private scenario: CourtPrepScenario | null = null;
  private answers: PracticeAnswer[] = [];
  private currentIndex: number = 0;
  private config: Required<SimulatorConfig>;

  constructor(config: SimulatorConfig = {}) {
    this.config = {
      randomizeQuestions: config.randomizeQuestions ?? false,
      maxQuestions: config.maxQuestions ?? 0,
      showEtiquetteTips: config.showEtiquetteTips ?? true,
    };
  }

  /**
   * Load a court preparation scenario for a given case type.
   *
   * @param caseType - The case type (e.g. 'custody', 'divorce', 'small-claims')
   * @returns The loaded scenario
   */
  async load(caseType: string): Promise<CourtPrepScenario> {
    const scenario = await this.fetchScenario(caseType);

    if (this.config.randomizeQuestions) {
      this.shuffleArray(scenario.questions);
    }

    if (this.config.maxQuestions > 0) {
      scenario.questions = scenario.questions.slice(0, this.config.maxQuestions);
    }

    this.scenario = scenario;
    this.answers = [];
    this.currentIndex = 0;

    return scenario;
  }

  /**
   * Get the current practice question.
   *
   * @returns The current question, or null if the session is complete
   */
  getCurrentQuestion(): PracticeQuestion | null {
    if (!this.scenario) return null;
    return this.scenario.questions[this.currentIndex] ?? null;
  }

  /**
   * Get the total number of questions in the current scenario.
   */
  getTotalQuestions(): number {
    return this.scenario?.questions.length ?? 0;
  }

  /**
   * Get the current question index (0-based).
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Submit an answer to the current practice question.
   *
   * @param userAnswer - The user's practice answer
   * @returns Feedback and score for the answer
   */
  submitAnswer(userAnswer: string): PracticeAnswer {
    if (!this.scenario) {
      throw new Error('No scenario loaded. Call load() first.');
    }

    const question = this.getCurrentQuestion();
    if (!question) {
      throw new Error('No more questions in this session.');
    }

    const score = this.scoreAnswer(userAnswer, question);
    const feedback = this.generateFeedback(userAnswer, question, score);

    const answer: PracticeAnswer = {
      questionIndex: this.currentIndex,
      userAnswer,
      score,
      feedback,
    };

    this.answers.push(answer);
    this.currentIndex++;

    return answer;
  }

  /**
   * Get a summary of the completed simulation session.
   *
   * @returns Summary with scores, strong/weak areas, and tips
   */
  getSummary(): SimulationSummary {
    if (!this.scenario) {
      throw new Error('No scenario loaded.');
    }

    const scores = this.answers.map((a) => a.score);
    const averageScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    // Categorize performance by question category
    const categoryScores = new Map<string, number[]>();
    for (const answer of this.answers) {
      const question = this.scenario.questions[answer.questionIndex];
      if (!question) continue;
      const existing = categoryScores.get(question.category) ?? [];
      existing.push(answer.score);
      categoryScores.set(question.category, existing);
    }

    const strongAreas: string[] = [];
    const weakAreas: string[] = [];

    for (const [category, catScores] of categoryScores) {
      const avg = catScores.reduce((a, b) => a + b, 0) / catScores.length;
      if (avg >= 70) {
        strongAreas.push(category);
      } else {
        weakAreas.push(category);
      }
    }

    return {
      caseType: this.scenario.caseType,
      questionsAttempted: this.answers.length,
      averageScore,
      strongAreas,
      weakAreas,
      tips: this.scenario.tips,
    };
  }

  /**
   * Get the day-of-court companion checklist.
   *
   * @returns Checklist of items to bring, remember, and do on hearing day
   */
  getDayOfChecklist(): string[] {
    return [
      'Arrive at the courthouse at least 30 minutes early.',
      'Bring your photo ID and all filed documents.',
      'Bring 3 copies of any exhibits you plan to present.',
      'Dress professionally -- business casual at minimum.',
      'Turn off your phone before entering the courtroom.',
      'Stand when the judge enters or addresses you.',
      'Address the judge as "Your Honor."',
      'Speak clearly and stick to the facts.',
      'Do not interrupt the other party or the judge.',
      'Bring a notepad and pen to take notes.',
      'Have your checklist of key points ready to reference.',
      'Bring water and any medications you may need.',
    ];
  }

  /**
   * Get an etiquette tip relevant to the current question category.
   */
  getEtiquetteTip(): string | null {
    if (!this.config.showEtiquetteTips || !this.scenario) return null;

    const tips: Record<string, string> = {
      'judge-question': 'When the judge asks you a question, pause briefly before answering. Keep your response focused and factual.',
      'opening': 'Your opening statement should be brief. State who you are, what you are asking for, and why.',
      'evidence': 'When presenting evidence, hand copies to the clerk. Say "I would like to present Exhibit A" and describe what it shows.',
      'objection': 'If the other party says something untrue, wait for your turn to speak. Do not interrupt.',
    };

    const question = this.getCurrentQuestion();
    return question ? (tips[question.category] ?? null) : null;
  }

  /** Score a user answer against the sample answer (0-100). */
  private scoreAnswer(userAnswer: string, question: PracticeQuestion): number {
    const userWords = new Set(userAnswer.toLowerCase().split(/\s+/).filter(Boolean));
    const sampleWords = question.sampleAnswer.toLowerCase().split(/\s+/).filter(Boolean);

    if (sampleWords.length === 0) return 50;

    // Keyword overlap scoring
    const keyWords = sampleWords.filter((w) => w.length > 3);
    const matchCount = keyWords.filter((w) => userWords.has(w)).length;
    const keywordScore = keyWords.length > 0 ? (matchCount / keyWords.length) * 100 : 50;

    // Length penalty -- very short answers get penalized
    const lengthRatio = userAnswer.split(/\s+/).length / sampleWords.length;
    const lengthPenalty = lengthRatio < 0.3 ? 0.5 : 1;

    return Math.min(100, Math.round(keywordScore * lengthPenalty));
  }

  /** Generate human-readable feedback for an answer. */
  private generateFeedback(
    _userAnswer: string,
    question: PracticeQuestion,
    score: number,
  ): string {
    if (score >= 80) {
      return 'Excellent answer! You covered the key points well.';
    }
    if (score >= 50) {
      return `Good start. A stronger answer might also mention: "${question.sampleAnswer.slice(0, 80)}..."`;
    }
    return `Consider this approach: "${question.sampleAnswer.slice(0, 120)}..."`;
  }

  /** Fetch a scenario definition (stub for API/file integration). */
  private async fetchScenario(caseType: string): Promise<CourtPrepScenario> {
    // Built-in scenarios for common case types
    const scenarios: Record<string, CourtPrepScenario> = {
      'custody': {
        id: 'prep-custody',
        caseType: 'custody',
        questions: [
          {
            question: 'The judge asks: "Why are you requesting a change to the custody arrangement?"',
            sampleAnswer: 'Your Honor, since the original order was entered, there have been significant changes in circumstances that affect the best interests of the children.',
            category: 'judge-question',
          },
          {
            question: 'How would you introduce a text message as evidence?',
            sampleAnswer: 'Your Honor, I would like to present Exhibit A, which is a screenshot of a text message exchange showing the date and parties involved.',
            category: 'evidence',
          },
          {
            question: 'What would you say in your opening statement?',
            sampleAnswer: 'Your Honor, my name is [name], and I am the petitioner. I am requesting a modification to our custody arrangement because circumstances have changed significantly since the original order.',
            category: 'opening',
          },
          {
            question: 'The other party says something you believe is false. What do you do?',
            sampleAnswer: 'I would remain calm, take notes, and wait for my opportunity to respond. I would then address the specific claim with evidence.',
            category: 'objection',
          },
        ],
        tips: [
          'Focus on the best interests of the children, not on the other parent.',
          'Bring organized evidence in a labeled binder.',
          'Practice your opening statement out loud before the hearing.',
          'Keep your answers brief and factual.',
        ],
      },
    };

    return scenarios[caseType] ?? scenarios['custody'];
  }

  /** Fisher-Yates shuffle. */
  private shuffleArray<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
}

/** Backwards-compatible function export. */
export async function loadSimulation(caseType: string): Promise<CourtPrepScenario> {
  const sim = new CourtPrepSimulator();
  return sim.load(caseType);
}
