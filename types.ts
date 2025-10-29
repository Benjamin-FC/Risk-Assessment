export type Answer = 'Yes' | 'No' | 'N/A';

export interface Question {
  id: number;
  text: string;
  number: string;
  isInitial?: boolean;
  riskPoints: {
    Yes: number;
    No: number;
    'N/A': number;
  };
  followUp?: Partial<Record<Answer, number | ''>>;
}
