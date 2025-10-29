import React, { useState, useEffect } from 'react';
import type { Question } from './types';
import QuestionForm from './QuestionForm';
import TreeView from './TreeView';

interface QuestionEditorProps {
  initialQuestions: Question[];
  onSave: (questions: Question[]) => void;
  onCancel: () => void;
  onReset: () => void;
}

const renumberQuestions = (questions: Question[]): Question[] => {
    if (questions.length === 0) return [];
    
    // Use a map for efficient lookups and modifications
    const questionMap = new Map<number, Question>(questions.map(q => [q.id, { ...q }]));
    const nodes = new Map<number, { question: Question, children: any[] }>();

    questions.forEach(q => {
        nodes.set(q.id, { question: q, children: [] });
    });

    const childIds = new Set<number>();
    questions.forEach(q => {
        if (q.followUp) {
            Object.values(q.followUp).forEach(id => {
                if (typeof id === 'number') {
                    const parentNode = nodes.get(q.id);
                    const childNode = nodes.get(id);
                    if (parentNode && childNode) {
                        if (!parentNode.children.some(c => c.question.id === childNode.question.id)) {
                            parentNode.children.push(childNode);
                        }
                        childIds.add(id);
                    }
                }
            });
        }
    });

    const rootNodes = questions
        .filter(q => !childIds.has(q.id))
        .map(q => nodes.get(q.id)!);
    
    const assignNumbers = (nodesToNumber: { question: Question, children: any[] }[], prefix: string) => {
        const sortedNodes = [...nodesToNumber].sort((a, b) => {
            const indexA = questions.findIndex(q => q.id === a.question.id);
            const indexB = questions.findIndex(q => q.id === b.question.id);
            return indexA - indexB;
        });

        sortedNodes.forEach((node, index) => {
            const newNumber = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
            
            const questionToUpdate = questionMap.get(node.question.id);
            if (questionToUpdate) {
                questionToUpdate.number = newNumber;
            }

            if (node.children.length > 0) {
                assignNumbers(node.children, newNumber);
            }
        });
    };

    assignNumbers(rootNodes, '');

    return questions.map(q => questionMap.get(q.id)!);
};


const QuestionEditor: React.FC<QuestionEditorProps> = ({ initialQuestions, onSave, onCancel, onReset }) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    setQuestions(renumberQuestions(initialQuestions));
  }, [initialQuestions]);

  const handleQuestionChange = (updatedQuestion: Question) => {
    const oldQuestion = questions.find(q => q.id === updatedQuestion.id);
    const followUpChanged = JSON.stringify(oldQuestion?.followUp) !== JSON.stringify(updatedQuestion.followUp);

    const newQuestions = questions.map(q => q.id === updatedQuestion.id ? updatedQuestion : q);
    
    if (followUpChanged) {
        setQuestions(renumberQuestions(newQuestions));
    } else {
        setQuestions(newQuestions);
    }
  };
  
  const handleAddQuestion = () => {
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQuestion: Question = {
      id: newId,
      number: '', // Will be assigned by renumberQuestions
      text: 'New question text...',
      riskPoints: { Yes: 0, No: 0, 'N/A': 0 },
    };
    const newQuestions = [...questions, newQuestion];
    setQuestions(renumberQuestions(newQuestions));
    setSelectedQuestionId(newId);
  };

  const handleDeleteQuestion = (id: number) => {
    if (window.confirm('Are you sure you want to delete this question? This will also remove any follow-up links pointing to it.')) {
      if (selectedQuestionId === id) {
          setSelectedQuestionId(null);
      }
      
      const updatedQuestionsWithoutTarget = questions
        .filter(q => q.id !== id)
        .map(q => {
          const newFollowUp = { ...q.followUp };
          let changed = false;
          Object.keys(newFollowUp).forEach(key => {
            const answer = key as 'Yes' | 'No' | 'N/A';
            if (newFollowUp[answer] === id) {
              delete newFollowUp[answer];
              changed = true;
            }
          });
          return changed ? { ...q, followUp: newFollowUp } : q;
        });
      setQuestions(renumberQuestions(updatedQuestionsWithoutTarget));
    }
  };
  
  const handleReset = () => {
      if (window.confirm('Are you sure you want to reset all questions to their default state? All your changes will be lost.')) {
        onReset();
      }
  }
  
  const handleReorder = (draggedId: number, targetId: number) => {
    setQuestions(prevQuestions => {
      const draggedItem = prevQuestions.find(q => q.id === draggedId);
      if (!draggedItem) return prevQuestions;

      const remainingItems = prevQuestions.filter(q => q.id !== draggedId);
      const targetIndex = remainingItems.findIndex(q => q.id === targetId);
      
      if (targetIndex === -1) {
        return prevQuestions; // Should not happen if targetId is valid
      }

      remainingItems.splice(targetIndex, 0, draggedItem);
      return renumberQuestions(remainingItems);
    });
  };

  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="w-full max-w-6xl p-4 sm:p-6 bg-slate-50 rounded-lg shadow-lg animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Question Editor</h2>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button onClick={() => onSave(questions)} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-all">Save and Return to Quiz</button>
          <button onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-all">Cancel</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <TreeView
            questions={questions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={setSelectedQuestionId}
            draggingId={draggingId}
            onSetDraggingId={setDraggingId}
            onReorder={handleReorder}
          />
        </div>
        <div className="md:col-span-2">
            {selectedQuestion ? (
                <QuestionForm
                    key={selectedQuestion.id}
                    question={selectedQuestion}
                    allQuestions={questions}
                    onChange={handleQuestionChange}
                    onDelete={handleDeleteQuestion}
                />
            ) : (
                <div className="flex items-center justify-center h-full p-6 bg-white border-2 border-dashed border-slate-300 rounded-lg">
                    <p className="text-slate-500 text-center">Select a question from the tree on the left to begin editing.</p>
                </div>
            )}
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button onClick={handleAddQuestion} className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all">
          Add New Question
        </button>
        <button onClick={handleReset} className="w-full sm:w-auto px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-all">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default QuestionEditor;