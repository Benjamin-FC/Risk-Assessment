export type Answer = 'Yes' | 'No' | 'N/A';

export interface Question {
  id: number;
  text: string;
  number: string;
  isInitial?: boolean;
  controlType?: 'buttons' | 'text' | 'yes_no' | 'multi_state_select' | 'work_comp_code' | 'numeric' | 'business_info';
  riskPoints: {
    Yes: number;
    No: number;
    'N/A': number;
  };
  followUp?: Partial<Record<Answer, number | ''>>;
}