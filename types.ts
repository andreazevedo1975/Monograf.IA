
export enum SectionType {
  PRE_TEXTUAL,
  TEXTUAL,
  POST_TEXTUAL,
}

export interface Section {
  id: string;
  title: string;
  content: string;
  type: SectionType;
}

export interface Project {
  id: string;
  title: string;
  author: string;
  template: 'Monografia' | 'Artigo';
  sections: Section[];
}

export interface ReviewFeedback {
  abntCompliance: string;
  originality: string;
  cohesion: string;
  grammar: string;
}

export interface ImprovementSuggestions {
  clarity: string;
  depth: string;
  conclusion: string;
  resultsPresentation: string;
}

export interface FinalReview {
  feedback: ReviewFeedback;
  suggestions: ImprovementSuggestions;
}
