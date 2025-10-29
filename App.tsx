import React, { useState, useEffect, useCallback } from 'react';
import type { Answer, Question } from './types';
import QuestionEditor from './QuestionEditor';
import DatabaseService from './database';

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

interface ScoreViewProps {
  score: number;
  onRestart: () => void;
}

const ScoreView: React.FC<ScoreViewProps> = ({ score, onRestart }) => {
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

  return (
    <div className="flex flex-col items-center p-6 md:p-8 bg-white rounded-xl shadow-lg animate-fade-in">
      <ResultIcon score={score} />
      <h2 className="text-3xl font-bold text-slate-800 mt-4">Assessment Complete!</h2>
      <p className="text-slate-600 mt-2">Here is your business risk profile.</p>
      <div className="my-8 text-center">
        <p className={`text-6xl font-bold ${profile.color}`}>{score}</p>
        <p className="text-slate-500">Risk Score</p>
        <p className={`mt-2 font-semibold ${profile.color}`}>{profile.level} Profile</p>
      </div>
      <p className="text-center text-slate-700 max-w-md">{profile.message}</p>
      <button
        onClick={onRestart}
        className="mt-8 w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-all duration-300"
      >
        Retake Assessment
      </button>
    </div>
  );
};

export default function App() {
  type ViewMode = 'quiz' | 'editor';

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<number, Question>>({});
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
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
  
  const handleAnswer = (answer: Answer) => {
    const currentQuestion = questionQueue[currentQuestionIndex];
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    const newScore = score + currentQuestion.riskPoints[answer];
    setScore(newScore);
    
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
            const newQueue = questionIdsToInject
                .map(id => questionsMap[id])
                .filter((q): q is Question => !!q);

            setQuestionQueue(newQueue);
            setCurrentQuestionIndex(0);
        } else {
            setQuizComplete(true);
        }
        return; // Exit function after jump
    }
    
    // --- Standard Logic for other questions ---
    let nextQueue = [...questionQueue];
    
    // Standard follow-up logic for questions like "Do you have claims?"
    const followUpId = currentQuestion.followUp?.[answer];
    if (followUpId && questionsMap[followUpId]) {
      const followUpQuestion = questionsMap[followUpId];
      if (!nextQueue.find(q => q.id === followUpQuestion.id)) {
        // Splice it in right after the current question
        nextQueue.splice(currentQuestionIndex + 1, 0, followUpQuestion);
      }
    }
    
    setQuestionQueue(nextQueue);

    if (currentQuestionIndex + 1 < nextQueue.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const handleRestartQuiz = () => {
    initializeQuiz();
    setViewMode('quiz');
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

  useEffect(() => {
    if (quizComplete || !currentQuestion) return;
    const element = document.getElementById(`question-${currentQuestion.id}`);
    // Only scroll if it's not the very first question, to avoid a jarring jump on load
    if (element && currentQuestionIndex > 0) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // A small delay helps ensure the element is fully rendered
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
      return <ScoreView score={score} onRestart={handleRestartQuiz} />;
    }

    if (currentQuestion) {
      return (
        <div className="space-y-6">
          {questionQueue.slice(0, currentQuestionIndex + 1).map((q, index) => {
            const isCurrentQuestion = index === currentQuestionIndex;
            const givenAnswer = answers[q.id];

            return (
              <div key={q.id} id={`question-${q.id}`} className={`p-6 md:p-8 bg-white rounded-xl shadow-lg transition-all duration-500 ${isCurrentQuestion ? 'animate-fade-in' : 'opacity-70'}`}>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-semibold text-indigo-600">Question {q.number}</p>
                   { !isCurrentQuestion && givenAnswer &&
                      <div className="text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full shadow-sm">{givenAnswer}</div>
                  }
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-8 min-h-[4rem] flex items-center">{q.text}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['Yes', 'No', 'N/A'] as Answer[]).map((ans) => {
                    const isSelected = givenAnswer === ans;
                    return (
                      <button
                        key={ans}
                        onClick={() => isCurrentQuestion && handleAnswer(ans)}
                        disabled={!isCurrentQuestion}
                        className={`w-full px-4 py-3 border-2 font-semibold rounded-lg transition-all duration-200
                          ${isCurrentQuestion ? 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400' : 'border-transparent'}
                          ${isSelected ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100'}
                          ${!isCurrentQuestion && !isSelected ? 'bg-slate-50 text-slate-400' : ''}
                          ${!isCurrentQuestion ? 'cursor-default' : ''}
                        `}
                      >
                        {ans}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    return <div className="text-center p-8 bg-white rounded-lg shadow-lg">Loading Assessment...</div>;
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-center p-4">
      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <header className="w-full max-w-4xl text-center mb-8">
        <div className="flex justify-center items-center relative">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800">PEO Client Risk Assessment</h1>
          {viewMode === 'quiz' && (
            <button 
              onClick={() => setViewMode('editor')} 
              className="absolute right-0 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-800 transition-colors"
              title="Edit Questions"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        {viewMode === 'quiz' && (
          <p className="mt-2 text-lg text-slate-600">Answer a series of questions to help us evaluate your business's risk profile.</p>
        )}
      </header>
      <main className="w-full max-w-2xl lg:max-w-4xl">
        {renderContent()}
      </main>
      <footer className="text-center mt-8 text-slate-500 text-sm">
        <p>This assessment is for informational purposes only and does not constitute a formal risk analysis or insurance quote.</p>
      </footer>
    </div>
  );
}