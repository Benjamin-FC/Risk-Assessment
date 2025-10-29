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
  businessName: string;
}

const ScoreView: React.FC<ScoreViewProps> = ({ score, answeredQuestions, businessName }) => {
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
    doc.text(businessName ? `${businessName} - ABC Report` : "ABC Report", 105, 20, { align: "center" });

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

    doc.save(businessName ? `${businessName.replace(/\s+/g, '_')}-ABC-Report.pdf` : "ABC-Report.pdf");
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
  
  const [businessNameValue, setBusinessNameValue] = useState('');
  const [yearsValue, setYearsValue] = useState('');
  const [employeesValue, setEmployeesValue] = useState('');
  const [revenueValue, setRevenueValue] = useState('');
  const [businessName, setBusinessName] = useState('');


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
    setBusinessNameValue('');
    setYearsValue('');
    setEmployeesValue('');
    setRevenueValue('');
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

      return <ScoreView score={score} answeredQuestions={answeredQuestionsData} businessName={businessName} />;
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
              const isBusinessInfoType = q.controlType === 'business_info';

              return (
                <div key={q.id} id={`question-${q.id}`} className="p-6 md:p-8 bg-white rounded-xl shadow-xl border border-gray-200/50 transition-all duration-500 animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-sm font-bold bg-indigo-600 text-white px-4 py-1 rounded-full shadow-md">Question {index + 1}</p>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 leading-relaxed mb-8 min-h-[4rem] flex items-center">{q.text}</h2>
                  
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

                  {isBusinessInfoType && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="w-full max-w-xs">
                            <label htmlFor="business-name-input" className="block text-sm font-medium text-gray-700 mb-1">Name of business</label>
                            <input
                                id="business-name-input"
                                type="text"
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                value={businessNameValue}
                                onChange={(e) => setBusinessNameValue(e.target.value)}
                                placeholder="e.g., Acme Corp"
                                aria-label="Name of business"
                            />
                        </div>
                        <div className="w-full max-w-xs">
                            <label htmlFor="years-input" className="block text-sm font-medium text-gray-700 mb-1">Number of years in business</label>
                            <input
                                id="years-input"
                                type="number"
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                value={yearsValue}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                    setYearsValue(numericValue);
                                }}
                                placeholder="e.g., 5"
                                aria-label="Number of years in business"
                            />
                        </div>
                        <div className="w-full max-w-xs">
                            <label htmlFor="employees-input" className="block text-sm font-medium text-gray-700 mb-1">Number of employees</label>
                            <input
                                id="employees-input"
                                type="number"
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                value={employeesValue}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                    setEmployeesValue(numericValue);
                                }}
                                placeholder="e.g., 20"
                                aria-label="Number of employees"
                            />
                        </div>
                         <div className="w-full max-w-xs">
                            <label htmlFor="revenue-input" className="block text-sm font-medium text-gray-700 mb-1">Estimated Annual Revenue ($M)</label>
                            <input
                                id="revenue-input"
                                type="number"
                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                value={revenueValue}
                                onChange={(e) => {
                                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                    setRevenueValue(numericValue);
                                }}
                                placeholder="e.g., 5"
                                aria-label="Estimated Annual Revenue in Millions"
                            />
                        </div>
                        <button
                            onClick={() => {
                                setBusinessName(businessNameValue);
                                handleAnswer(`Name: ${businessNameValue}, Years: ${yearsValue}, Employees: ${employeesValue}, Revenue: $${revenueValue}M`);
                            }}
                            disabled={!businessNameValue.trim() || !yearsValue.trim() || !employeesValue.trim() || !revenueValue.trim()}
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
                              onChange={(e) => setMultiSelectInputValues(Array.from(e.target.selectedOptions, option => option.value))}
                              aria-label={`Answer for: ${q.text}`}
                          >
                              {US_STATES.map(state => (
                                  <option key={state} value={state}>{state}</option>
                              ))}
                          </select>
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
                        <div className="flex w-full max-w-xs gap-2">
                           <input
                            type="text"
                            className="flex-grow p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            value={currentWorkCompCodeInput}
                            onChange={(e) => setCurrentWorkCompCodeInput(e.target.value)}
                            placeholder="Enter code..."
                            aria-label="Enter workers' compensation code"
                          />
                          <button
                            onClick={handleAddWorkCompCode}
                            disabled={!currentWorkCompCodeInput.trim()}
                            className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-700 disabled:bg-gray-300 transition-all"
                          >
                            Add
                          </button>
                        </div>
                        
                        {workCompCodes.length > 0 && (
                          <div className="w-full max-w-xs p-3 border-2 border-gray-200 rounded-lg bg-gray-50 flex flex-wrap gap-2">
                            {workCompCodes.map(code => (
                              <div key={code} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">
                                <span>{code}</span>
                                <button
                                  onClick={() => handleRemoveWorkCompCode(code)}
                                  className="text-indigo-500 hover:text-indigo-700"
                                  aria-label={`Remove code ${code}`}
                                >
                                  &times;
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleAnswer(workCompCodes)}
                          disabled={workCompCodes.length === 0}
                          className="w-full max-w-xs px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          Continue
                        </button>
                    </div>
                  )}

                </div>
              );
            }
            
            const answerDisplay = Array.isArray(givenAnswer) ? givenAnswer.join(', ') : givenAnswer;
            
            return (
              <div key={q.id} className="p-4 bg-white rounded-xl shadow-md border-l-4 border-green-500 transition-all animate-fade-in-fast">
                <div className="flex justify-between items-center">
                    <p className="font-bold text-gray-800">{q.text}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
                <p className="mt-2 text-gray-600 font-medium">{answerDisplay}</p>
              </div>
            );
          })}
        </div>
      );
    }
    return <div className="text-center p-8 bg-white rounded-lg shadow-lg">Loading Questions...</div>;
  };
  
  return (
    <div className="p-4 md:p-6 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">ABC</h1>
          {!quizComplete && <p className="mt-2 text-lg text-gray-600">Client Risk Assessment</p>}
        </header>
        <main>
          {renderContent()}
        </main>
        {!quizComplete && (
            <footer className="text-center mt-8">
                <button 
                    onClick={() => setViewMode(prev => prev === 'quiz' ? 'editor' : 'quiz')}
                    className="text-sm text-gray-500 hover:text-indigo-600 font-medium transition"
                >
                    {viewMode === 'quiz' ? 'Edit Questions' : 'Back to Quiz'}
                </button>
            </footer>
        )}
      </div>
    </div>
  );
}