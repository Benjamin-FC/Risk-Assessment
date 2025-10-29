import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Answer, Question } from './types';
import QuestionEditor from './QuestionEditor';
import DatabaseService from './database';

declare const jspdf: any;

const ResultIcon: React.FC<{ score: number }> = ({ score }) => {
  let iconData;
  if (score >= 40) { // High Risk
    iconData = {
      color: 'text-red-500',
      path: <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />,
    };
  } else if (score >= 15) { // Moderate Risk
    iconData = {
      color: 'text-amber-500',
      path: <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 13a1 1 0 112 0v-5a1 1 0 11-2 0v5zm1-7a1 1 0 100-2 1 1 0 000 2z"/>,
    };
  } else { // Low Risk
    iconData = {
      color: 'text-green-500',
      path: <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />,
    };
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 ${iconData.color}`} viewBox="0 0 20 20" fill="currentColor">
      {iconData.path}
    </svg>
  );
};

type AnsweredQuestion = {
  text: string;
  answer: string | Answer | string[];
};

interface ScoreViewProps {
  score: number;
  answeredQuestions: AnsweredQuestion[];
}

const ScoreView: React.FC<ScoreViewProps> = ({ score, answeredQuestions }) => {
  const getRiskProfile = (score: number) => {
    if (score >= 40) {
      return {
        level: "High Risk",
        color: "text-red-600",
        message: "Your business shows several significant risk factors. It is highly recommended to partner with a PEO to implement comprehensive safety and compliance solutions.",
      };
    }
    if (score >= 15) {
      return {
        level: "Moderate Risk",
        color: "text-amber-600",
        message: "There are some areas for improvement. A PEO can provide expert guidance and resources to help you mitigate these risks.",
      };
    }
    return {
      level: "Low Risk",
      color: "text-green-600",
      message: "You have strong safety practices in place. A PEO can help you maintain and document your excellent record.",
    };
  };

  const profile = getRiskProfile(score);

  const handleDownloadPdf = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text("PEO Client Risk Assessment Report", 105, 20, { align: "center" });

    // Score and Profile
    doc.setFontSize(16);
    doc.text(`Final Risk Score: ${score}`, 20, 40);
    doc.text(`Risk Profile: ${profile.level}`, 20, 50);

    doc.setFontSize(12);
    doc.text(profile.message, 20, 60, { maxWidth: 170 });

    // Table of answers
    const tableColumn = ["Question", "Your Answer"];
    const tableRows: (string | Answer | string[])[][] = [];

    answeredQuestions.forEach(item => {
      const answerDisplay = Array.isArray(item.answer) ? item.answer.join(', ') : String(item.answer);
      const rowData = [
        item.text,
        answerDisplay
      ];
      tableRows.push(rowData);
    });

    (doc as any).autoTable({
      startY: 80,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [74, 85, 104] }, // slate-700
      didDrawPage: function(data: any) {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text("This assessment is for informational purposes only.", 20, doc.internal.pageSize.height - 15);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.width - 35, doc.internal.pageSize.height - 15);
      }
    });

    doc.save("Risk-Assessment-Report.pdf");
  };

  return (
    <div className="flex flex-col items-center p-6 md:p-8 bg-white rounded-xl shadow-lg animate-fade-in">
      <ResultIcon score={score} />
      <h2 className="text-3xl font-bold text-gray-800 mt-4">Assessment Complete!</h2>
      <p className="text-gray-600 mt-2">Here is your business risk profile.</p>
      <div className="my-8 text-center">
        <p className={`text-6xl font-bold ${profile.color}`}>{score}</p>
        <p className="text-gray-500">Risk Score</p>
        <p className={`mt-2 font-semibold ${profile.color}`}>{profile.level} Profile</p>
      </div>
      <p className="text-center text-gray-700 max-w-md">{profile.message}</p>
      <div className="mt-8 w-full">
        <button
          onClick={handleDownloadPdf}
          className="w-full px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-all duration-300"
        >
          Download PDF Report
        </button>
      </div>
    </div>
  );
};

const US_STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

export default function App() {
  type ViewMode = 'quiz' | 'editor';

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<number, Question>>({});
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Answer | string | string[]>>({});
  const [textInputValue, setTextInputValue] = useState('');
  const [multiSelectInputValues, setMultiSelectInputValues] = useState<string[]>([]);
  
  const [currentWorkCompCodeInput, setCurrentWorkCompCodeInput] = useState('');
  const [workCompCodes, setWorkCompCodes] = useState<string[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [dbService, setDbService] = useState<DatabaseService | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initDb = async () => {
      try {
        const service = await DatabaseService.getInstance();
        setDbService(service);
        setIsDbReady(true);
      } catch (err) {
        console.error("Failed to initialize database:", err);
        setDbError("Could not initialize the database. Please try refreshing the page.");
      }
    };
    initDb();
  }, []);

  const loadQuestions = useCallback(async () => {
    if (!dbService) return;
    try {
      const questionsFromDb = await dbService.getQuestions();
      setAllQuestions(questionsFromDb);
    } catch (error) {
      console.error("Failed to load questions from DB:", error);
      setDbError("Could not load questions from the database.");
    }
  }, [dbService]);

  useEffect(() => {
    if (isDbReady) {
      loadQuestions();
    }
  }, [isDbReady, loadQuestions]);

  const initializeQuiz = useCallback(() => {
    if (allQuestions.length === 0) return;

    const qMap: Record<number, Question> = allQuestions.reduce((acc, q) => {
      acc[q.id] = q;
      return acc;
    }, {} as Record<number, Question>);

    const initialQueue = allQuestions.filter(q => q.isInitial);

    if (initialQueue.length === 0 && allQuestions.length > 0) {
      // Fallback if no question is marked as initial
      initialQueue.push(allQuestions[0]);
    }

    setQuestionsMap(qMap);
    setQuestionQueue(initialQueue);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setAnswers({});
  }, [allQuestions]);
  
  useEffect(() => {
    initializeQuiz();
  }, [allQuestions, initializeQuiz]);
  
  const handleAnswer = (answer: Answer | string | string[]) => {
    const currentQuestion = questionQueue[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    let newScore = score;
    let nextQueue = [...questionQueue];
    
    const isButtonAnswer = !currentQuestion.controlType || currentQuestion.controlType === 'buttons' || currentQuestion.controlType === 'yes_no';

    // Logic for button-based questions (calculates score and checks for follow-ups)
    if (isButtonAnswer && (answer === 'Yes' || answer === 'No' || answer === 'N/A')) {
        newScore += currentQuestion.riskPoints[answer as Answer];
        
        // --- Jump Logic for Initial Questions ---
        if (currentQuestion.isInitial && answer === 'Yes') {
            const GENERAL_SAFETY_IDS = [100, 101, 104, 105, 106, 107];
            const INDUSTRY_QUESTION_SETS: Record<number, number[]> = {
              1: [200, ...GENERAL_SAFETY_IDS], // Construction: Driving + General
              2: [300, 200, ...GENERAL_SAFETY_IDS], // Roofing: Heights + Driving + General
              3: [400, 401, ...GENERAL_SAFETY_IDS], // Manufacturing: Lifting + Machinery + General
              4: [200, ...GENERAL_SAFETY_IDS], // Transportation: Driving + General
              5: [400, 500, ...GENERAL_SAFETY_IDS], // Healthcare: Lifting + Hazmat + General
              6: GENERAL_SAFETY_IDS, // "None of the above" -> General path
            };

            const questionIdsToInject = INDUSTRY_QUESTION_SETS[currentQuestion.id] || [];
            
            if (questionIdsToInject.length > 0) {
                const newDynamicQueue = questionIdsToInject
                    .map(id => questionsMap[id])
                    .filter((q): q is Question => !!q);

                // Preserve the answered questions and append the new path
                const answeredQuestions = questionQueue.slice(0, currentQuestionIndex + 1);
                const combinedQueue = [...answeredQuestions, ...newDynamicQueue];
                
                setQuestionQueue(combinedQueue);
                // Move to the next question
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                setQuizComplete(true);
            }
            setScore(newScore);
            return; // Exit function after jump
        }
        
        // --- Standard follow-up logic ---
        const followUpId = currentQuestion.followUp?.[answer as Answer];
        if (followUpId && questionsMap[followUpId]) {
          const followUpQuestion = questionsMap[followUpId];
          if (!nextQueue.find(q => q.id === followUpQuestion.id)) {
            nextQueue.splice(currentQuestionIndex + 1, 0, followUpQuestion);
          }
        }
    }
    
    // --- Special logic for questions that inject other questions ---
    if (currentQuestion.id === 9) { // State selection
      const questionsToInject: Question[] = [];
      
      // Conditional: California question
      if (Array.isArray(answer) && answer.includes('California')) {
        const californiaQuestion = questionsMap[600];
        if (californiaQuestion && !nextQueue.find(q => q.id === californiaQuestion.id)) {
          questionsToInject.push(californiaQuestion);
        }
      }

      // Unconditional: Work comp code question
      const workCompQuestion = questionsMap[700];
      if (workCompQuestion && !nextQueue.find(q => q.id === workCompQuestion.id)) {
        questionsToInject.push(workCompQuestion);
      }

      if (questionsToInject.length > 0) {
        nextQueue.splice(currentQuestionIndex + 1, 0, ...questionsToInject);
      }
    }


    setScore(newScore);
    setQuestionQueue(nextQueue);

    if (currentQuestionIndex + 1 < nextQueue.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };
  
  const handleSaveQuestions = async (updatedQuestions: Question[]) => {
    if (!dbService) return;
    await dbService.saveQuestions(updatedQuestions);
    await loadQuestions();
    setViewMode('quiz');
  };

  const handleResetQuestions = async () => {
    if (!dbService) return;
    await dbService.resetQuestions();
    await loadQuestions();
    setViewMode('quiz');
  };

  const currentQuestion = questionQueue[currentQuestionIndex];

  const handleAddWorkCompCode = () => {
    if (currentWorkCompCodeInput.trim() && !workCompCodes.includes(currentWorkCompCodeInput.trim())) {
      setWorkCompCodes(prev => [...prev, currentWorkCompCodeInput.trim()]);
      setCurrentWorkCompCodeInput('');
    }
  };

  const handleRemoveWorkCompCode = (codeToRemove: string) => {
    setWorkCompCodes(prev => prev.filter(code => code !== codeToRemove));
  };
  
  useEffect(() => {
    setTextInputValue(''); // Clear text input when question changes
    setMultiSelectInputValues([]); // Clear multi-select dropdown value when question changes
    setCurrentWorkCompCodeInput('');
    setWorkCompCodes([]);
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (quizComplete || !currentQuestion) return;
    const element = document.getElementById(`question-${currentQuestion.id}`);
    if (element && currentQuestionIndex > 0) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [currentQuestionIndex, currentQuestion, quizComplete]);

  const renderContent = () => {
    if (dbError) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-lg text-red-600">{dbError}</div>;
    }
    if (!isDbReady) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-lg">Initializing Database...</div>;
    }

    if (viewMode === 'editor') {
        return (
            <QuestionEditor 
                initialQuestions={allQuestions}
                onSave={handleSaveQuestions}
                onCancel={() => setViewMode('quiz')}
                onReset={handleResetQuestions}
            />
        );
    }

    if (quizComplete) {
      const answeredQuestionsData = questionQueue
        .filter(q => answers[q.id] !== undefined)
        .map(q => ({
          text: q.text,
          answer: answers[q.id],
        }));

      return <ScoreView score={score} answeredQuestions={answeredQuestionsData} />;
    }

    if (currentQuestion) {
      return (
        <div className="space-y-4">
          {questionQueue.slice(0, currentQuestionIndex + 1).map((q, index) => {
            const isCurrentQuestion = index === currentQuestionIndex;
            const givenAnswer = answers[q.id];
            
            if (isCurrentQuestion) {
              const isButtonType = !q.controlType || q.controlType === 'buttons' || q.controlType === 'yes_no';
              const isTextType = q.controlType === 'text';
              const isNumericType = q.controlType === 'numeric';
              const isMultiStateSelectType = q.controlType === 'multi_state_select';
              const isWorkCompCodeType = q.controlType === 'work_comp_code';

              return (
                <div key={q.id} id={`question-${q.id}`} className="p-6 md:p-8 bg-white rounded-xl shadow-lg transition-all duration-500 animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-semibold text-indigo-600">Question {index + 1}</p>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-8 min-h-[4rem] flex items-center">{q.text}</h2>
                  
                  {isButtonType && (
                    <div className={`grid grid-cols-1 ${q.controlType === 'yes_no' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                      {(q.controlType === 'yes_no' ? ['Yes', 'No'] : ['Yes', 'No', 'N/A'] as Answer[]).map((ans) => (
                        <button
                          key={ans}
                          onClick={() => handleAnswer(ans)}
                          className="w-full px-4 py-3 border-2 font-semibold rounded-lg transition-all duration-200 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  )}

                  {isNumericType && (
                    <div className="mt-4 flex flex-col items-center">
                      <input
                        type="number"
                        className="w-full max-w-xs p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        value={textInputValue}
                        onChange={(e) => {
                           const numericValue = e.target.value.replace(/[^0-9]/g, '');
                           setTextInputValue(numericValue);
                        }}
                        placeholder="Enter a number..."
                        aria-label={`Answer for: ${q.text}`}
                      />
                      <button
                        onClick={() => handleAnswer(textInputValue)}
                        disabled={!textInputValue.trim()}
                        className="mt-4 w-full max-w-xs px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        Continue
                      </button>
                    </div>
                  )}
                  
                  {isTextType && (
                    <div className="mt-4 flex flex-col items-center">
                      <input
                        type="text"
                        className="w-full max-w-xs p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                        value={textInputValue}
                        onChange={(e) => setTextInputValue(e.target.value)}
                        placeholder="Enter your answer..."
                        aria-label={`Answer for: ${q.text}`}
                      />
                      <button
                        onClick={() => handleAnswer(textInputValue)}
                        disabled={!textInputValue.trim()}
                        className="mt-4 w-full max-w-xs px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {isMultiStateSelectType && (
                    <div className="mt-4 flex flex-col items-center">
                        <select
                            multiple
                            className="w-full max-w-xs p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition h-48"
                            value={multiSelectInputValues}
                            onChange={(e) => {
                                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                setMultiSelectInputValues(selectedOptions);
                            }}
                            aria-label={`Answer for: ${q.text}`}
                        >
                            {US_STATES.map(state => <option key={state} value={state}>{state}</option>)}
                        </select>
                         <p className="text-sm text-gray-500 mt-2">Hold Ctrl (or Cmd on Mac) to select multiple states.</p>
                        <button
                            onClick={() => handleAnswer(multiSelectInputValues)}
                            disabled={multiSelectInputValues.length === 0}
                            className="mt-4 w-full max-w-xs px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            Continue
                        </button>
                    </div>
                  )}

                  {isWorkCompCodeType && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="flex w-full max-w-md gap-2">
                            <input
                                type="text"
                                className="flex-grow p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                value={currentWorkCompCodeInput}
                                onChange={(e) => setCurrentWorkCompCodeInput(e.target.value)}
                                placeholder="Enter a code..."
                                aria-label="Enter a workers' compensation code"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddWorkCompCode(); }}
                            />
                            <button
                                onClick={handleAddWorkCompCode}
                                disabled={!currentWorkCompCodeInput.trim()}
                                className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-600 disabled:bg-gray-400 transition-all"
                            >
                                Add
                            </button>
                        </div>

                        {workCompCodes.length > 0 && (
                            <div className="w-full max-w-md p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
                                <ul className="flex flex-wrap gap-2">
                                    {workCompCodes.map((code, index) => (
                                        <li key={`${code}-${index}`} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">
                                            <span>{code}</span>
                                            <button
                                                onClick={() => handleRemoveWorkCompCode(code)}
                                                className="text-indigo-600 hover:text-indigo-800 font-bold"
                                                aria-label={`Remove code ${code}`}
                                            >
                                                &times;
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => handleAnswer(workCompCodes)}
                            disabled={workCompCodes.length === 0}
                            className="mt-2 w-full max-w-md px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            Continue
                        </button>
                    </div>
                  )}

                </div>
              );
            } else {
              // --- Render previously answered questions ---
              const answerDisplay = Array.isArray(givenAnswer) ? givenAnswer.join(', ') : String(givenAnswer);
              return (
                <div key={q.id} className="p-4 bg-gray-200 rounded-lg transition-all duration-500 animate-fade-in-fast">
                   <p className="text-sm font-semibold text-gray-500">Question {index + 1}</p>
                   <p className="font-semibold text-gray-700 mt-1">{q.text}</p>
                   <p className="text-indigo-700 font-medium mt-2">{answerDisplay}</p>
                </div>
              );
            }
          })}
        </div>
      );
    }
    return <div className="text-center p-8 bg-white rounded-lg shadow-lg">Loading Questions...</div>;
  };
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start p-4 pt-8 md:pt-12 transition-colors duration-500">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <svg className="w-10 h-10 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008h-.008v-.008Z" />
                </svg>
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">PEO Client Risk Assessment</h1>
            </div>
            <button
                onClick={() => setViewMode(prev => prev === 'quiz' ? 'editor' : 'quiz')}
                className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                aria-label={viewMode === 'quiz' ? 'Open Question Editor' : 'Return to Quiz'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                </svg>
            </button>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}