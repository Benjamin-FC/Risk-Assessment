import React from 'react';
import type { Question, Answer } from './types';

interface QuestionFormProps {
  question: Question;
  allQuestions: Question[];
  onChange: (updatedQuestion: Question) => void;
  onDelete: (id: number) => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ question, allQuestions, onChange, onDelete }) => {

  const handleInputChange = (field: keyof Question, value: any) => {
    if (field === 'controlType') {
      const newType = value as 'buttons' | 'text' | 'yes_no' | 'multi_state_select' | 'work_comp_code' | 'numeric' | 'business_info';
      const updatedQuestion: Question = { ...question, controlType: newType };

      if (newType === 'text' || newType === 'numeric' || newType === 'multi_state_select' || newType === 'work_comp_code' || newType === 'business_info') {
        // When switching to text, zero out risk points and clear follow-ups
        updatedQuestion.riskPoints = { Yes: 0, No: 0, 'N/A': 0 };
        updatedQuestion.followUp = {};
      } else if (newType === 'yes_no') {
        // When switching to yes/no, clear N/A fields
        updatedQuestion.riskPoints['N/A'] = 0;
        if (updatedQuestion.followUp) {
          delete updatedQuestion.followUp['N/A'];
        }
      }
      onChange(updatedQuestion);
    } else {
      onChange({ ...question, [field]: value });
    }
  };

  const handleRiskPointChange = (answer: Answer, value: string) => {
    const points = parseInt(value, 10);
    if (!isNaN(points)) {
      onChange({ ...question, riskPoints: { ...question.riskPoints, [answer]: points } });
    }
  };
  
  const handleFollowUpChange = (answer: Answer, value: string) => {
    const followUpId = value ? parseInt(value, 10) : '';
    const updatedFollowUp = { ...question.followUp, [answer]: followUpId };
     if (value === '') {
      delete updatedFollowUp[answer];
    }
    onChange({ ...question, followUp: updatedFollowUp });
  };


  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg mb-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow">
          <label className="block text-sm font-medium text-slate-600">Question Number</label>
          <input
            type="text"
            value={question.number}
            onChange={(e) => handleInputChange('number', e.target.value)}
            className="mt-1 block w-full md:w-1/4 px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center h-5">
            <input
              id={`isInitial-${question.id}`}
              type="checkbox"
              checked={!!question.isInitial}
              onChange={(e) => handleInputChange('isInitial', e.target.checked)}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor={`isInitial-${question.id}`} className="ml-2 text-sm font-medium text-slate-700">Is Start Question?</label>
          </div>
          <button onClick={() => onDelete(question.id)} className="text-red-500 hover:text-red-700 font-semibold transition-colors">
            Delete
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600">Question Text</label>
        <textarea
          value={question.text}
          onChange={(e) => handleInputChange('text', e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-600">Answer Control Type</label>
        <select
          value={question.controlType || 'buttons'}
          onChange={(e) => handleInputChange('controlType', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="buttons">Buttons (Yes/No/NA)</option>
          <option value="yes_no">Buttons (Yes/No)</option>
          <option value="text">Text Input (Free-form)</option>
          <option value="numeric">Numeric Input</option>
          <option value="business_info">Business Info (Name/Yrs/Emp/Rev $M)</option>
          <option value="multi_state_select">Multi-State Select</option>
          <option value="work_comp_code">Work Comp Code Lookup</option>
        </select>
      </div>
      
      {(!question.controlType || question.controlType === 'buttons' || question.controlType === 'yes_no') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-600">Risk Points (Yes)</label>
              <input type="number" value={question.riskPoints.Yes} onChange={(e) => handleRiskPointChange('Yes', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600">Risk Points (No)</label>
              <input type="number" value={question.riskPoints.No} onChange={(e) => handleRiskPointChange('No', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
            </div>
            {question.controlType !== 'yes_no' && (
              <div>
                <label className="block text-sm font-medium text-slate-600">Risk Points (N/A)</label>
                <input type="number" value={question.riskPoints['N/A']} onChange={(e) => handleRiskPointChange('N/A', e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-md font-semibold text-slate-700 mb-2">Follow-up Questions</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* FIX: The original ternary expression for the array was leading to incorrect type inference (`string[]` instead of `Answer[]`). This was causing a type error when `answer` was passed to functions expecting the `Answer` type. This version ensures type safety by starting with a correctly typed `Answer[]` and then filtering it based on the control type. */}
                {(['Yes', 'No', 'N/A'] as Answer[]).filter(ans => question.controlType !== 'yes_no' || ans !== 'N/A').map(answer => (
                    <div key={answer}>
                        <label className="block text-sm font-medium text-slate-600">If answer is "{answer}"</label>
                        <select
                            value={question.followUp?.[answer] || ''}
                            onChange={(e) => handleFollowUpChange(answer, e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            <option value="">None</option>
                            {allQuestions.filter(q => q.id !== question.id).map(q => (
                                <option key={q.id} value={q.id}>
                                    Q{q.number}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuestionForm;