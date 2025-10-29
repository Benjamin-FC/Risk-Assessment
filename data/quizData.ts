import type { Question } from '../types';

export const ALL_QUESTIONS: Question[] = [
  // --- INITIAL QUESTIONS ---
  // These are presented to the user first to determine the quiz path.
  { id: 7, number: '1', isInitial: true, text: 'Number of years in business', controlType: 'text', riskPoints: { 'Yes': 0, 'No': 0, 'N/A': 0 } },
  { id: 8, number: '2', isInitial: true, text: 'Number of employees', controlType: 'text', riskPoints: { 'Yes': 0, 'No': 0, 'N/A': 0 } },
  { id: 9, number: '3', isInitial: true, text: 'What states do you operate in? (Select all that apply)', controlType: 'multi_state_select', riskPoints: { 'Yes': 0, 'No': 0, 'N/A': 0 } },
  { id: 1, number: '4', isInitial: true, text: 'Is your business primarily in the Construction industry?', riskPoints: { 'Yes': 5, 'No': 0, 'N/A': 0 } },
  { id: 2, number: '5', isInitial: true, text: 'Is your business primarily in the Roofing industry?', riskPoints: { 'Yes': 10, 'No': 0, 'N/A': 0 } },
  { id: 3, number: '6', isInitial: true, text: 'Is your business primarily in the Manufacturing industry?', riskPoints: { 'Yes': 5, 'No': 0, 'N/A': 0 } },
  { id: 4, number: '7', isInitial: true, text: 'Is your business primarily in the Transportation industry?', riskPoints: { 'Yes': 8, 'No': 0, 'N/A': 0 } },
  { id: 5, number: '8', isInitial: true, text: 'Is your business primarily in the Healthcare industry?', riskPoints: { 'Yes': 5, 'No': 0, 'N/A': 0 } },
  { id: 6, number: '9', isInitial: true, text: 'My business is primarily office-based or in a lower-risk industry not listed above.', riskPoints: { 'Yes': 0, 'No': 0, 'N/A': 0 } },

  // --- QUESTION POOLS ---
  // These questions are injected into the quiz based on answers to the initial questions.
  
  // General Safety & Compliance (Used in most paths)
  { id: 100, number: '', text: 'Does your business have a documented safety program that is regularly reviewed and updated?', riskPoints: { 'Yes': 0, 'No': 10, 'N/A': 0 } },
  { id: 101, number: '', text: 'Have you had any workers\' compensation claims in the past three years?', riskPoints: { 'Yes': 5, 'No': 0, 'N/A': 0 }, followUp: { 'Yes': 102 } },
  { id: 102, number: '', text: 'Were there more than two claims in the past three years?', riskPoints: { 'Yes': 10, 'No': 0, 'N/A': 0 }, followUp: { 'Yes': 103 } },
  { id: 103, number: '', text: 'Have you implemented corrective actions to prevent similar incidents?', riskPoints: { 'Yes': 0, 'No': 10, 'N/A': 0 } },
  { id: 104, number: '', text: 'Do you have a formal process for investigating accidents and near-misses?', riskPoints: { 'Yes': 0, 'No': 5, 'N/A': 0 } },
  { id: 105, number: '', text: 'Are you confident you are compliant with all OSHA regulations relevant to your industry?', riskPoints: { 'Yes': 0, 'No': 15, 'N/A': 0 } },
  { id: 106, number: '', text: 'Do you conduct regular safety audits or inspections of your workplace?', riskPoints: { 'Yes': 0, 'No': 5, 'N/A': 0 } },
  { id: 107, number: '', text: 'Do you have employees working alone or in remote locations?', riskPoints: { 'Yes': 5, 'No': 0, 'N/A': 0 } },
  
  // Driving & Fleet
  { id: 200, number: '', text: 'Do your employees operate company vehicles as part of their job?', riskPoints: { 'Yes': 2, 'No': 0, 'N/A': 0 }, followUp: { 'Yes': 201 } },
  { id: 201, number: '', text: 'Do you have a formal fleet safety program and check MVRs for all drivers?', riskPoints: { 'Yes': 0, 'No': 10, 'N/A': 0 } },

  // Roofing / Heights
  { id: 300, number: '', text: 'Does your work involve heights over 15 feet?', riskPoints: { 'Yes': 10, 'No': 0, 'N/A': 0 }, followUp: { 'Yes': 301 } },
  { id: 301, number: '', text: 'Do you have a documented fall protection plan and provide personal fall arrest systems (harnesses)?', riskPoints: { 'Yes': 0, 'No': 15, 'N/A': 0 } },
  
  // Manufacturing / Machinery / Lifting
  { id: 400, number: '', text: 'Do employees regularly lift objects weighing more than 50 pounds?', riskPoints: { 'Yes': 5, 'No': 0, 'N/A': 0 } },
  { id: 401, number: '', text: 'Does your work involve operating heavy machinery or specialized equipment?', riskPoints: { 'Yes': 2, 'No': 0, 'N/A': 0 }, followUp: { 'Yes': 402 } },
  { id: 402, number: '', text: 'Is regular safety training and certification provided for all operators?', riskPoints: { 'Yes': 0, 'No': 10, 'N/A': 0 } },

  // Hazardous Materials
  { id: 500, number: '', text: 'Do you handle hazardous materials or chemicals?', riskPoints: { 'Yes': 2, 'No': 0, 'N/A': 0 }, followUp: { 'Yes': 501 } },
  { id: 501, number: '', text: 'Do you have a Hazard Communication Program and provide employees with access to Safety Data Sheets (SDS)?', riskPoints: { 'Yes': 0, 'No': 10, 'N/A': 0 } },

  // --- California Specific ---
  { id: 600, number: '', text: 'Since you operate in California, additional regulations apply (e.g., Cal/OSHA). Do you have specific programs in place to address these?', controlType: 'yes_no', riskPoints: { 'Yes': 0, 'No': 15, 'N/A': 0 } },

  // --- Work Comp Code ---
  { id: 700, number: '', text: 'Please enter your workers\' compensation class codes. Add each code one at a time.', controlType: 'work_comp_code', riskPoints: { 'Yes': 0, 'No': 0, 'N/A': 0 } }
];