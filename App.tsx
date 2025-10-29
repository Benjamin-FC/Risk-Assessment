
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Answer, Question } from './types';
import QuestionEditor from './QuestionEditor';
import DatabaseService from './database';
import { GoogleGenAI, Type } from '@google/genai';

declare const jspdf: any;

/**
 * A functional component that displays a risk-level icon based on a score.
 * The icon and color change depending on whether the risk is high, moderate, or low.
 * @param {object} props - The component props.
 * @param {number} props.score - The risk score.
 * @returns {JSX.Element} A colored SVG icon representing the risk level.
 */
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

/**
 * Displays the final score and risk profile after the quiz is completed.
 * Provides functionality to download a PDF summary of the assessment.
 * @param {ScoreViewProps} props - Component props including score and answered questions.
 * @returns {JSX.Element} The score summary view.
 */
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
      <h2 className="text-3xl font-bold text-slate-800 mt-4">Assessment Complete!</h2>
      <p className="text-slate-600 mt-2">Here is your business risk profile.</p>
      <div className="my-8 text-center">
        <p className={`text-6xl font-bold ${profile.color}`}>{score}</p>
        <p className="text-slate-500">Risk Score</p>
        <p className={`mt-2 font-semibold ${profile.color}`}>{profile.level} Profile</p>
      </div>
      <p className="text-center text-slate-700 max-w-md">{profile.message}</p>
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

/**
 * A view that is displayed when the user's answers indicate a business
 * that is too high-risk to be considered (e.g., involves explosives).
 * @param {object} props - The component props.
 * @param {string} props.message - The rejection message to display.
 * @param {() => void} props.onGoBack - Callback function to reset the quiz.
 * @returns {JSX.Element} The rejection screen.
 */
const RejectionView: React.FC<{ message: string; onGoBack: () => void; }> = ({ message, onGoBack }) => {
  return (
    <div className="flex flex-col items-center p-6 md:p-8 bg-white rounded-xl shadow-lg animate-fade-in">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-red-600" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <h2 className="text-5xl font-extrabold text-red-600 mt-6 tracking-wider">REJECTED</h2>
      <p className="text-slate-700 mt-4 text-center max-w-md">{message}</p>
      <button
        onClick={onGoBack}
        className="mt-8 px-8 py-3 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75 transition-all duration-300"
      >
        Go Back and Start Over
      </button>
    </div>
  );
};

const US_STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", " Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];

interface WorkCompCodeSuggestion {
  code: string;
  description: string;
}

/**
 * The main application component. It manages the application's state,
 * including the current view (quiz or editor), quiz progress, user answers,
 * and interactions with the database and Gemini API.
 */
export default function App() {
  type ViewMode = 'quiz' | 'editor';

  // --- State Management ---
  // This section manages the overall state of the application, divided into several categories.
  
  // Quiz data state
  // Stores the questions and a map for efficient lookups by ID.
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [questionsMap, setQuestionsMap] = useState<Record<number, Question>>({}); // For quick lookups by ID
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]); // The dynamic list of questions for the current quiz
  
  // Quiz progress state
  // Tracks the user's progress, score, and completion status.
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<Record<number, Answer | string | string[]>>({}); // Stores user's answers

  // Input state for specific question types
  // Holds temporary values for various input fields before they are submitted as answers.
  const [textInputValue, setTextInputValue] = useState('');
  
  // State for multi-state select question
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [stateSearchInput, setStateSearchInput] = useState('');
  const [stateSuggestions, setStateSuggestions] = useState<string[]>([]);
  
  // State for Work Comp Code question
  const [currentWorkCompCodeInput, setCurrentWorkCompCodeInput] = useState('');
  const [workCompCodes, setWorkCompCodes] = useState<string[]>([]);
  const [isFetchingCompCodeDesc, setIsFetchingCompCodeDesc] = useState(false); // For fetching a single description
  const [workCompSuggestions, setWorkCompSuggestions] = useState<WorkCompCodeSuggestion[]>([]); // For typeahead suggestions
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false); // Loading state for suggestions
  
  // State for Business Info question
  const [businessNameValue, setBusinessNameValue] = useState('');
  const [yearsValue, setYearsValue] = useState('');
  const [employeesValue, setEmployeesValue] = useState('');
  const [revenueValue, setRevenueValue] = useState('');
  const [businessName, setBusinessName] = useState(''); // Persists name for PDF report
  const [isLookingUpInfo, setIsLookingUpInfo] = useState(false);
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  
  // State for rejection path
  // Manages the state when a user's answers lead to an automatic rejection.
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState('');

  // App mode and database state
  // Controls whether the user is taking the quiz or editing questions, and handles DB state.
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [dbService, setDbService] = useState<DatabaseService | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Ref for debouncing API calls for work comp code suggestions
  const debounceTimeoutRef = useRef<number | null>(null);

  /**
   * Effect to initialize the database service on component mount.
   * It uses a singleton pattern from the DatabaseService to ensure the DB is initialized only once.
   */
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

  /**
   * Callback to load questions from the database once the DB service is available.
   */
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

  // Effect to trigger loading questions as soon as the database is ready.
  useEffect(() => {
    if (isDbReady) {
      loadQuestions();
    }
  }, [isDbReady, loadQuestions]);

  /**
   * Initializes or resets the quiz state.
   * It builds a map for quick question lookups and sets up the initial queue
   * with questions marked as `isInitial`.
   */
  const initializeQuiz = useCallback(() => {
    if (allQuestions.length === 0) return;

    // Create a hash map for O(1) question lookups by ID.
    const qMap: Record<number, Question> = allQuestions.reduce((acc, q) => {
      acc[q.id] = q;
      return acc;
    }, {} as Record<number, Question>);

    // The initial set of questions are those marked with `isInitial: true`.
    const initialQueue = allQuestions.filter(q => q.isInitial);

    if (initialQueue.length === 0 && allQuestions.length > 0) {
      // Fallback if no question is marked as initial to prevent a blank screen.
      initialQueue.push(allQuestions[0]);
    }

    setQuestionsMap(qMap);
    setQuestionQueue(initialQueue);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setAnswers({});
  }, [allQuestions]);
  
  // Effect to initialize the quiz whenever the set of all questions changes (e.g., after editing).
  useEffect(() => {
    initializeQuiz();
  }, [allQuestions, initializeQuiz]);
  
  /**
   * Handles the user's answer to the current question. This is the core logic
   * for quiz progression, score calculation, and dynamic pathing.
   * @param answer The answer provided by the user for the current question.
   */
  const handleAnswer = (answer: Answer | string | string[]) => {
    // Get the current question from the queue.
    const currentQuestion = questionQueue[currentQuestionIndex];
    // Store the answer for the current question.
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

    let newScore = score;
    let nextQueue = [...questionQueue];
    
    // Determine if the question uses standard Yes/No/N/A buttons.
    const isButtonAnswer = !currentQuestion.controlType || currentQuestion.controlType === 'buttons' || currentQuestion.controlType === 'yes_no';

    // Logic for button-based questions (calculates score and checks for follow-ups)
    if (isButtonAnswer && (answer === 'Yes' || answer === 'No' || answer === 'N/A')) {
        // Add risk points associated with the answer to the total score.
        newScore += currentQuestion.riskPoints[answer as Answer];
        
        // --- Jump Logic for Initial Questions ---
        // If an initial industry question is answered "Yes", inject a specific set of follow-up questions.
        // This creates dynamic quiz paths based on the business type.
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
            
            // If there are questions to inject for this industry...
            if (questionIdsToInject.length > 0) {
                // ...map the IDs to actual question objects from the questionsMap.
                const newDynamicQueue = questionIdsToInject
                    .map(id => questionsMap[id])
                    .filter((q): q is Question => !!q);

                // Preserve the answered questions and append the new path.
                const answeredQuestions = questionQueue.slice(0, currentQuestionIndex + 1);
                const combinedQueue = [...answeredQuestions, ...newDynamicQueue];
                
                // Update the question queue and advance to the next question.
                setQuestionQueue(combinedQueue);
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
                // If no specific path, the initial questions are done, so complete the quiz.
                setQuizComplete(true);
            }
            setScore(newScore);
            return; // Exit function early after a jump, as the queue has been fundamentally changed.
        }
        
        // --- Standard follow-up logic ---
        // If the question has a follow-up for the given answer, inject it into the queue.
        const followUpId = currentQuestion.followUp?.[answer as Answer];
        if (followUpId && questionsMap[followUpId]) {
          const followUpQuestion = questionsMap[followUpId];
          // Avoid adding a question that's already in the queue.
          if (!nextQueue.find(q => q.id === followUpQuestion.id)) {
            // Insert the follow-up question immediately after the current one.
            nextQueue.splice(currentQuestionIndex + 1, 0, followUpQuestion);
          }
        }
    }
    
    // --- Special logic for questions that inject other questions ---
    if (currentQuestion.id === 9) { // State selection question
      // This handles questions that dynamically add others based on complex answers (e.g., multi-select).
      const questionsToInject: Question[] = [];
      
      // If "California" is selected, inject the Cal/OSHA question.
      if (Array.isArray(answer) && answer.includes('California')) {
        const californiaQuestion = questionsMap[600];
        if (californiaQuestion && !nextQueue.find(q => q.id === californiaQuestion.id)) {
          questionsToInject.push(californiaQuestion);
        }
      }

      // After state selection, always inject the work comp code question.
      const workCompQuestion = questionsMap[700];
      if (workCompQuestion && !nextQueue.find(q => q.id === workCompQuestion.id)) {
        questionsToInject.push(workCompQuestion);
      }

      // Add the collected questions to the queue.
      if (questionsToInject.length > 0) {
        nextQueue.splice(currentQuestionIndex + 1, 0, ...questionsToInject);
      }
    }

    setScore(newScore);
    // Update the question queue with any changes made.
    setQuestionQueue(nextQueue);

    // Progress to the next question or end the quiz if there are no more questions.
    if (currentQuestionIndex + 1 < nextQueue.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };
  
  /**
   * Saves the updated list of questions to the database and reloads them.
   * Triggered from the QuestionEditor component.
   */
  const handleSaveQuestions = async (updatedQuestions: Question[]) => {
    if (!dbService) return;
    await dbService.saveQuestions(updatedQuestions);
    await loadQuestions();
    setViewMode('quiz');
  };

  /**
   * Resets all questions in the database to the default set.
   * Triggered from the QuestionEditor component.
   */
  const handleResetQuestions = async () => {
    if (!dbService) return;
    await dbService.resetQuestions();
    await loadQuestions();
    setViewMode('quiz');
  };

  /**
   * Resets the application state from the rejection screen to the start of the quiz.
   */
  const handleGoBackFromRejection = () => {
    setIsRejected(false);
    setRejectionMessage('');
    initializeQuiz();
  };
  
  const currentQuestion = questionQueue[currentQuestionIndex];

  /**
   * Handles adding a workers' compensation code.
   * It uses the Gemini API to fetch a description for the entered code
   * and checks for high-risk keywords (e.g., 'explosive'). If found,
   * it triggers the rejection view.
   */
  const handleAddWorkCompCode = async () => {
    const code = currentWorkCompCodeInput.trim();
    if (!code) return;

    setIsFetchingCompCodeDesc(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Act as a data retrieval specialist. Go to the URL https://www.insurancexdate.com/class/${code}. Find the description for this workers' compensation class code. If there are multiple descriptions for this code (e.g., for different states), return the first one you find. Return only the description text. If you cannot find a description or the page doesn't exist, return the string 'Description not found.'`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const description = response.text.trim();
        const lowerCaseDescription = description.toLowerCase();

        // High-risk check
        if (lowerCaseDescription.includes('explosive') || lowerCaseDescription.includes('ammunition')) {
            setIsRejected(true);
            setRejectionMessage("Application rejected due to high-risk operations involving explosives or ammunition.");
            setIsFetchingCompCodeDesc(false);
            return;
        }

        let newCodeEntry = code;

        // Append description to the code for display if found.
        if (description && description.toLowerCase() !== 'description not found.') {
            const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
            newCodeEntry = `${code} - ${truncatedDesc}`;
        }

        if (!workCompCodes.includes(newCodeEntry)) {
            setWorkCompCodes(prev => [...prev, newCodeEntry]);
        }
        setCurrentWorkCompCodeInput('');
        setWorkCompSuggestions([]);
    } catch (error) {
        console.error("Error fetching work comp code description:", error);
        // Fallback: just add the code if the API fails
        if (!workCompCodes.includes(code)) {
            setWorkCompCodes(prev => [...prev, code]);
        }
        setCurrentWorkCompCodeInput('');
        setWorkCompSuggestions([]);
    } finally {
        setIsFetchingCompCodeDesc(false);
    }
  };

  const handleRemoveWorkCompCode = (codeToRemove: string) => {
    setWorkCompCodes(prev => prev.filter(code => code !== codeToRemove));
  };

  /**
   * Uses the Gemini API with Google Search grounding to look up business information
   * from the Florida Division of Corporations website (Sunbiz.org). This provides
   * a quick way to verify business details.
   */
  const handleLookupBusinessInfo = async () => {
    if (!businessNameValue.trim()) return;

    setIsLookingUpInfo(true);
    setLookupResult(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Act as a business information analyst. Search the official Florida Division of Corporations website (Sunbiz.org) for the business named "${businessNameValue}". Provide a concise summary including its current status (e.g., Active), filing date, and if available, the most recent annual report revenue. If you cannot find the exact business or the information, state that clearly.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                // Ground the model's response in Google Search results for up-to-date information.
                tools: [{googleSearch: {}}],
            },
        });

        const text = response.text;
        setLookupResult(text);
        
        // Auto-capitalize business name if lookup is successful.
        if (text && !text.toLowerCase().includes('not find') && !text.toLowerCase().includes('error')) {
            setBusinessNameValue(prev => prev.trim().toUpperCase());
        }

    } catch (error) {
        console.error("Error looking up business info:", error);
        setLookupResult("Sorry, an error occurred while trying to look up the business information.");
    } finally {
        setIsLookingUpInfo(false);
    }
  };
  
  /**
   * Effect to reset all input fields when the current question changes,
   * ensuring a clean state for each new question.
   */
  useEffect(() => {
    setTextInputValue('');
    setSelectedStates([]);
    setStateSearchInput('');
    setCurrentWorkCompCodeInput('');
    setWorkCompCodes([]);
    setBusinessNameValue('');
    setYearsValue('');
    setEmployeesValue('');
    setRevenueValue('');
    setLookupResult(null);
  }, [currentQuestionIndex]);

  /**
   * Effect to smoothly scroll the next question into view as the quiz progresses.
   */
  useEffect(() => {
    if (quizComplete || !currentQuestion) return;
    const element = document.getElementById(`question-${currentQuestion.id}`);
    if (element && currentQuestionIndex > 0) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); // Small delay to allow rendering
    }
  }, [currentQuestionIndex, currentQuestion, quizComplete]);
  
  /**
   * Handles input changes for the work comp code field with debouncing.
   * After a brief pause in typing, it calls the Gemini API to get code suggestions.
   * It also specifically requests codes related to high-risk activities (explosives)
   * to ensure they can be proactively identified and rejected.
   */
  const handleWorkCompInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentWorkCompCodeInput(value);
    setWorkCompSuggestions([]);

    // Clear any existing debounce timer.
    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }

    if (value.length > 2) {
        setIsFetchingSuggestions(true);
        // Set a new timer to fetch suggestions after a delay.
        debounceTimeoutRef.current = window.setTimeout(async () => {
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `You are an expert on US workers' compensation class codes. The user is searching for codes related to "${value}". Provide a list of relevant class codes. ALWAYS include class codes related to explosives, ammunition, or pyrotechnics, regardless of the user's search term. Return a JSON object with a "codes" array. Each object should have a "code" (string) and "description" (string). Provide up to 5 suggestions in total.`;
                
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: prompt,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                codes: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            code: { type: Type.STRING, description: "The 4-digit class code." },
                                            description: { type: Type.STRING, description: "A brief description of the class code." }
                                        },
                                        required: ["code", "description"]
                                    }
                                }
                            },
                            required: ["codes"]
                        }
                    }
                });
                
                const result = JSON.parse(response.text);
                if (result && Array.isArray(result.codes)) {
                    setWorkCompSuggestions(result.codes);
                } else {
                    setWorkCompSuggestions([]);
                }
            } catch (error) {
                console.error("Error fetching work comp code suggestions:", error);
                setWorkCompSuggestions([]);
            } finally {
                setIsFetchingSuggestions(false);
            }
        }, 500); // 500ms debounce delay
    } else {
        setIsFetchingSuggestions(false);
        setWorkCompSuggestions([]);
    }
  };

  /**
   * Handles clicking a work comp code suggestion from the dropdown.
   * It performs a risk check before adding the code.
   */
  const handleSuggestionClick = (suggestion: WorkCompCodeSuggestion) => {
    const { code, description } = suggestion;

    const lowerCaseDescription = description.toLowerCase();
    // High-risk check
    if (lowerCaseDescription.includes('explosive') || lowerCaseDescription.includes('ammunition')) {
        setIsRejected(true);
        setRejectionMessage("Application rejected due to high-risk operations involving explosives or ammunition.");
        return;
    }

    const truncatedDesc = description.length > 100 ? description.substring(0, 100) + '...' : description;
    const newCodeEntry = `${code} - ${truncatedDesc}`;

    if (!workCompCodes.includes(newCodeEntry)) {
        setWorkCompCodes(prev => [...prev, newCodeEntry]);
    }
    
    // Clear input fields after selection.
    setCurrentWorkCompCodeInput('');
    setWorkCompSuggestions([]);
  };

  const handleStateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStateSearchInput(value);
    if (value) {
      const filtered = US_STATES.filter(state =>
        state.toLowerCase().includes(value.toLowerCase()) && !selectedStates.includes(state)
      );
      setStateSuggestions(filtered);
    } else {
      setStateSuggestions([]);
    }
  };

  const handleAddState = (state: string) => {
    if (!selectedStates.includes(state)) {
      setSelectedStates(prev => [...prev, state].sort());
    }
    setStateSearchInput('');
    setStateSuggestions([]);
  };

  const handleRemoveState = (stateToRemove: string) => {
    setSelectedStates(prev => prev.filter(state => state !== stateToRemove));
  };


  /**
   * Main render function that determines which view to display based on the app's state.
   * It handles: DB loading/error, rejection view, question editor, quiz completion (score view),
   * and the active quiz question.
   */
  const renderContent = () => {
    // Show error message if database fails to initialize.
    if (dbError) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-lg text-red-600">{dbError}</div>;
    }
    // Show loading indicator while database is initializing.
    if (!isDbReady) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-lg">Initializing Database...</div>;
    }

    // If the quiz has been rejected, show the rejection view.
    if (isRejected) {
      return <RejectionView message={rejectionMessage} onGoBack={handleGoBackFromRejection} />;
    }
    
    // If in editor mode, render the QuestionEditor component.
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

    // If the quiz is complete, show the ScoreView.
    if (quizComplete) {
      const answeredQuestionsData = questionQueue
        .filter(q => answers[q.id] !== undefined)
        .map(q => ({
          text: q.text,
          answer: answers[q.id],
        }));

      return <ScoreView score={score} answeredQuestions={answeredQuestionsData} businessName={businessName} />;
    }

    // If the quiz is in progress, render the current question and previous answers.
    if (currentQuestion) {
      return (
        <div className="space-y-4">
          {questionQueue.slice(0, currentQuestionIndex + 1).map((q, index) => {
            const isCurrentQuestion = index === currentQuestionIndex;
            const givenAnswer = answers[q.id];
            
            // --- Render the ACTIVE question with input controls ---
            if (isCurrentQuestion) {
              const isButtonType = !q.controlType || q.controlType === 'buttons' || q.controlType === 'yes_no';
              const isNumericType = q.controlType === 'numeric';
              const isBusinessInfoType = q.controlType === 'business_info';
              const isMultiStateSelectType = q.controlType === 'multi_state_select';
              const isWorkCompCodeType = q.controlType === 'work_comp_code';

              return (
                <div key={q.id} id={`question-${q.id}`} className="p-6 md:p-8 bg-white rounded-xl shadow-xl border border-slate-200/50 transition-all duration-500 animate-fade-in">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-sm font-bold bg-indigo-600 text-white px-4 py-1 rounded-full shadow-md">Question {index + 1}</p>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-8 min-h-[4rem] flex items-center">{q.text}</h2>
                  
                  {/* Render Yes/No/NA buttons */}
                  {isButtonType && (
                    <div className={`grid grid-cols-1 ${q.controlType === 'yes_no' ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
                      {(q.controlType === 'yes_no' ? ['Yes', 'No'] : ['Yes', 'No', 'N/A'] as Answer[]).map((ans) => (
                        <button
                          key={ans}
                          onClick={() => handleAnswer(ans)}
                          className="w-full px-4 py-3 border-2 font-semibold rounded-lg transition-all duration-200 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                        >
                          {ans}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Render numeric input field */}
                  {isNumericType && (
                    <div className="mt-4 flex flex-col items-center">
                      <input
                        type="number"
                        className="w-full max-w-xs p-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
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
                        className="mt-4 w-full max-w-xs px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
                      >
                        Continue
                      </button>
                    </div>
                  )}

                  {/* Render Business Info form */}
                  {isBusinessInfoType && (
                    <div className="mt-4 space-y-6 flex flex-col items-center">
                        <div className="w-full max-w-lg">
                            <label htmlFor="business-name-input" className="block text-sm font-medium text-slate-700 mb-1">Name of business</label>
                            <div className="flex w-full gap-2">
                                <input
                                    id="business-name-input"
                                    type="text"
                                    className="flex-grow p-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                    value={businessNameValue}
                                    onChange={(e) => setBusinessNameValue(e.target.value)}
                                    placeholder="e.g., Acme Corp"
                                    aria-label="Name of business"
                                />
                                <button
                                  onClick={handleLookupBusinessInfo}
                                  disabled={!businessNameValue.trim() || isLookingUpInfo}
                                  className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 disabled:bg-slate-400 transition-all"
                                  aria-label="Look up business information"
                                >
                                  {isLookingUpInfo ? '...' : 'Look Up'}
                                </button>
                            </div>
                        </div>
                        
                        {(isLookingUpInfo || lookupResult) && (
                            <div className="w-full max-w-lg">
                                {isLookingUpInfo && (
                                    <div className="p-3 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-sm flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Searching Florida public records...</span>
                                    </div>
                                )}
                                {lookupResult && !isLookingUpInfo && (
                                  <div className="p-3 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-sm animate-fade-in-fast">
                                      {lookupResult}
                                  </div>
                                )}
                            </div>
                        )}

                        <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="years-input" className="block text-sm font-medium text-slate-700 mb-1">Years in business</label>
                                <input
                                    id="years-input"
                                    type="number"
                                    className="w-full p-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                    value={yearsValue}
                                    onChange={(e) => {
                                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                        setYearsValue(numericValue);
                                    }}
                                    placeholder="e.g., 5"
                                    aria-label="Years in business"
                                />
                            </div>
                             <div>
                                <label htmlFor="employees-input" className="block text-sm font-medium text-slate-700 mb-1"># of Employees</label>
                                <input
                                    id="employees-input"
                                    type="number"
                                    className="w-full p-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                    value={employeesValue}
                                    onChange={(e) => {
                                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                        setEmployeesValue(numericValue);
                                    }}
                                    placeholder="e.g., 20"
                                    aria-label="Number of employees"
                                />
                            </div>
                             <div>
                                <label htmlFor="revenue-input" className="block text-sm font-medium text-slate-700 mb-1">Revenue ($M)</label>
                                <input
                                    id="revenue-input"
                                    type="number"
                                    className="w-full p-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                    value={revenueValue}
                                    onChange={(e) => {
                                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                        setRevenueValue(numericValue);
                                    }}
                                    placeholder="e.g., 5"
                                    aria-label="Estimated Annual Revenue in Millions"
                                />
                            </div>
                        </div>
                        <div className="w-full max-w-lg">
                            <button
                                onClick={() => {
                                    setBusinessName(businessNameValue);
                                    const formattedAnswer = `Business Name: ${businessNameValue}\nYears: ${yearsValue} | Employees: ${employeesValue} | Revenue: $${revenueValue}M`;
                                    handleAnswer(formattedAnswer);
                                }}
                                disabled={!businessNameValue.trim() || !yearsValue.trim() || !employeesValue.trim() || !revenueValue.trim()}
                                className="w-full px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                  )}

                  {/* Render multi-state select control */}
                  {isMultiStateSelectType && (
                      <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="relative w-full max-w-xs">
                           <input
                            type="text"
                            className="w-full p-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                            value={stateSearchInput}
                            onChange={handleStateInputChange}
                            onBlur={() => setTimeout(() => setStateSuggestions([]), 150)}
                            placeholder="Type to find a state..."
                            aria-label="Search for a state to add"
                          />
                          {stateSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                              {stateSuggestions.map(state => (
                                <li
                                  key={state}
                                  onClick={() => handleAddState(state)}
                                  className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                                >
                                  {state}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                          
                        {selectedStates.length > 0 && (
                            <div className="w-full max-w-xs p-3 border-2 border-slate-200 rounded-lg bg-slate-50 min-h-[6rem] flex flex-wrap gap-2">
                                {selectedStates.map(state => (
                                    <span key={state} className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                                        {state}
                                        <button onClick={() => handleRemoveState(state)} className="text-indigo-200 hover:text-white font-bold">
                                            &times;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        <button
                          onClick={() => handleAnswer(selectedStates)}
                          disabled={selectedStates.length === 0}
                          className="w-full max-w-xs px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                          Continue
                        </button>
                      </div>
                  )}
                  
                  {/* Render Work Comp Code input control */}
                  {isWorkCompCodeType && (
                    <div className="mt-4 flex flex-col items-center gap-4">
                        <div className="relative w-full max-w-xs">
                          <div className="flex gap-2">
                             <input
                              type="text"
                              className="flex-grow p-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                              value={currentWorkCompCodeInput}
                              onChange={handleWorkCompInputChange}
                              onBlur={() => setTimeout(() => setWorkCompSuggestions([]), 150)}
                              placeholder="Enter code or keyword..."
                              aria-label="Enter workers' compensation code"
                            />
                            <button
                              onClick={handleAddWorkCompCode}
                              disabled={!currentWorkCompCodeInput.trim() || isFetchingCompCodeDesc}
                              className="flex justify-center items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-sm hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all w-24"
                            >
                              {isFetchingCompCodeDesc ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Adding...
                                </>
                              ) : (
                                'Add'
                              )}
                            </button>
                          </div>
                          {isFetchingSuggestions && (
                            <div className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg shadow-lg mt-1 p-4 text-center">
                                <div className="flex items-center justify-center text-slate-500">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Searching for codes...</span>
                                </div>
                            </div>
                          )}
                           {!isFetchingSuggestions && workCompSuggestions.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {workCompSuggestions.map(item => (
                                    <li
                                        key={item.code}
                                        onClick={() => handleSuggestionClick(item)}
                                        className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                                    >
                                        <span className="font-bold">{item.code}</span> - <span className="text-sm text-slate-600">{item.description}</span>
                                    </li>
                                ))}
                            </ul>
                          )}
                        </div>

                        {workCompCodes.length > 0 && (
                            <div className="w-full max-w-xs p-3 border-2 border-slate-200 rounded-lg bg-slate-50 min-h-[6rem] flex flex-wrap gap-2">
                                {workCompCodes.map(code => (
                                    <span key={code} className="bg-slate-200 text-slate-700 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2">
                                        {code}
                                        <button onClick={() => handleRemoveWorkCompCode(code)} className="text-slate-500 hover:text-slate-800">
                                            &#x2715;
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => handleAnswer(workCompCodes)}
                            disabled={workCompCodes.length === 0}
                            className="w-full max-w-xs px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            Continue
                        </button>
                    </div>
                  )}
                </div>
              );
            }
            
            // --- Render previously answered questions in a read-only state ---
            return (
              <div key={q.id} id={`question-${q.id}`} className="p-4 bg-white rounded-lg shadow-md border-l-4 border-green-500 transition-all animate-fade-in-fast">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-slate-700">{q.text}</h3>
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="mt-2 text-slate-600 font-medium whitespace-pre-wrap">
                  <span className="font-normal text-slate-500">Answer: </span>
                  {Array.isArray(givenAnswer) ? givenAnswer.join(', ') : String(givenAnswer)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Fallback loading message if quiz is not ready yet.
    return <div>Loading questions...</div>;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
        <header className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500">ABC</h1>
            <p className="mt-2 text-lg text-slate-600">PEO Client Risk Assessment</p>
            <button
                onClick={() => setViewMode(prev => prev === 'quiz' ? 'editor' : 'quiz')}
                className="mt-4 px-4 py-2 text-sm bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-all absolute top-4 right-4"
            >
                {viewMode === 'quiz' ? 'Edit Questions' : 'Take Quiz'}
            </button>
        </header>
        <main>
            {renderContent()}
        </main>
    </div>
  );
}
