
import type { Question, Answer } from './types';
import { ALL_QUESTIONS as DEFAULT_QUESTIONS } from './data/quizData';

// This is now loaded from a <script> tag in index.html, making it a global.
declare const initSqlJs: any;

// Singleton promise to prevent multiple initializations
let dbPromise: Promise<DatabaseService> | null = null;

// Persist the entire DB to localStorage to keep data across page reloads.
const DB_STORAGE_KEY = 'peoRiskAssessmentDB';

class DatabaseService {
  private db: any; // Type as any because sql.js types might not be globally available

  private constructor(db: any) {
    this.db = db;
  }

  // Static factory to handle async initialization of the database
  public static async getInstance(): Promise<DatabaseService> {
    if (dbPromise) {
      return dbPromise;
    }
    dbPromise = (async () => {
      // Initialize sql.js
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${file}`
      });
      
      const storedDb = localStorage.getItem(DB_STORAGE_KEY);
      let db;

      // Load existing DB from localStorage or create a new one
      if (storedDb) {
        try {
            const dbArray = JSON.parse(storedDb);
            db = new SQL.Database(new Uint8Array(dbArray));
        } catch (e) {
            console.error("Failed to parse stored DB, creating new one.", e);
            db = new SQL.Database();
        }
      } else {
        db = new SQL.Database();
      }
      
      const instance = new DatabaseService(db);
      
      // Check if DB is new and needs schema/seeding
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='Questions';");
      if (tables.length === 0) {
        await instance.createSchemaAndSeed();
      } else {
        // Migration for existing databases
        const columns = db.exec("PRAGMA table_info(Questions);");
        const hasControlType = columns[0].values.some((row: any) => row[1] === 'ControlType');
        if (!hasControlType) {
            db.run("ALTER TABLE Questions ADD COLUMN ControlType TEXT DEFAULT 'buttons' NOT NULL;");
            instance.persistDb();
        }
      }

      return instance;
    })();
    return dbPromise;
  }

  private persistDb() {
      const dbArray = this.db.export();
      localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(Array.from(dbArray)));
  }

  private async createSchemaAndSeed() {
    this.db.run(`
      CREATE TABLE Questionnaires (
        QuestionnaireID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Version INTEGER DEFAULT 1
      );
    `);
    this.db.run(`
      CREATE TABLE Questions (
        QuestionID INTEGER PRIMARY KEY,
        QuestionnaireID INTEGER NOT NULL,
        Text TEXT NOT NULL,
        Number TEXT,
        IsInitial BOOLEAN DEFAULT FALSE,
        DisplayOrder INTEGER DEFAULT 0,
        RiskPointsYes INTEGER NOT NULL DEFAULT 0,
        RiskPointsNo INTEGER NOT NULL DEFAULT 0,
        RiskPointsNA INTEGER NOT NULL DEFAULT 0,
        ControlType TEXT DEFAULT 'buttons' NOT NULL
      );
    `);
    this.db.run(`
      CREATE TABLE FollowUpRules (
        RuleID INTEGER PRIMARY KEY AUTOINCREMENT,
        ParentQuestionID INTEGER NOT NULL,
        ChildQuestionID INTEGER NOT NULL,
        TriggerAnswer TEXT NOT NULL,
        FOREIGN KEY (ParentQuestionID) REFERENCES Questions(QuestionID) ON DELETE CASCADE,
        FOREIGN KEY (ChildQuestionID) REFERENCES Questions(QuestionID) ON DELETE CASCADE,
        UNIQUE (ParentQuestionID, TriggerAnswer)
      );
    `);
    await this.seedDatabase();
    // FIX: Persist the database after seeding it for the first time.
    this.persistDb();
  }
  
  private async seedDatabase() {
    this.db.run("INSERT INTO Questionnaires (Name) VALUES (?)", ["Default PEO Risk Assessment"]);
    const questionnaireId = 1;
    this.saveQuestions(DEFAULT_QUESTIONS, questionnaireId, false);
  }

  public async getQuestions(): Promise<Question[]> {
    const questionnaireId = 1;

    const questionsStmt = this.db.prepare(`
        SELECT QuestionID, Text, Number, IsInitial, RiskPointsYes, RiskPointsNo, RiskPointsNA, ControlType
        FROM Questions 
        WHERE QuestionnaireID = ? 
        ORDER BY DisplayOrder
    `);
    questionsStmt.bind([questionnaireId]);
    
    const questions: Question[] = [];
    while (questionsStmt.step()) {
        const row = questionsStmt.get();
        questions.push({
            id: row[0] as number,
            text: row[1] as string,
            number: row[2] as string,
            isInitial: !!row[3],
            riskPoints: {
                Yes: row[4] as number,
                No: row[5] as number,
                'N/A': row[6] as number,
            },
            controlType: (row[7] || 'buttons') as 'buttons' | 'text' | 'yes_no',
            followUp: {}
        });
    }
    questionsStmt.free();

    const rulesStmt = this.db.prepare(`
        SELECT r.ParentQuestionID, r.ChildQuestionID, r.TriggerAnswer 
        FROM FollowUpRules r
        JOIN Questions q ON r.ParentQuestionID = q.QuestionID
        WHERE q.QuestionnaireID = ?
    `);
    rulesStmt.bind([questionnaireId]);
    
    const questionMap = new Map(questions.map(q => [q.id, q]));
    
    while(rulesStmt.step()) {
        const row = rulesStmt.get();
        const parentId = row[0] as number;
        const childId = row[1] as number;
        const trigger = row[2] as Answer;
        const parentQuestion = questionMap.get(parentId);
        if (parentQuestion) {
            parentQuestion.followUp![trigger] = childId;
        }
    }
    rulesStmt.free();

    return questions;
  }
  
  public async saveQuestions(questions: Question[], questionnaireId = 1, shouldPersist = true) {
    this.db.run('DELETE FROM FollowUpRules WHERE RuleID IN (SELECT r.RuleID FROM FollowUpRules r JOIN Questions q ON r.ParentQuestionID = q.QuestionID WHERE q.QuestionnaireID = ?)', [questionnaireId]);
    this.db.run('DELETE FROM Questions WHERE QuestionnaireID = ?', [questionnaireId]);
    
    const questionStmt = this.db.prepare(`
        INSERT INTO Questions (QuestionID, QuestionnaireID, Text, Number, IsInitial, DisplayOrder, RiskPointsYes, RiskPointsNo, RiskPointsNA, ControlType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const ruleStmt = this.db.prepare(`
        INSERT INTO FollowUpRules (ParentQuestionID, ChildQuestionID, TriggerAnswer)
        VALUES (?, ?, ?)
    `);

    try {
        questions.forEach((q, index) => {
            questionStmt.run([
                q.id,
                questionnaireId,
                q.text,
                q.number,
                q.isInitial ? 1 : 0,
                index, // Use array index for display order
                q.riskPoints.Yes,
                q.riskPoints.No,
                q.riskPoints['N/A'],
                q.controlType || 'buttons'
            ]);
            if(q.followUp) {
                for (const [answer, childId] of Object.entries(q.followUp)) {
                    if (childId !== '' && childId !== undefined && childId !== null) {
                        ruleStmt.run([q.id, childId, answer]);
                    }
                }
            }
        });
    } finally {
        questionStmt.free();
        ruleStmt.free();
    }
    
    if (shouldPersist) {
        this.persistDb();
    }
  }

  public async resetQuestions(): Promise<void> {
    this.db.run('DELETE FROM FollowUpRules');
    this.db.run('DELETE FROM Questions');
    this.db.run('DELETE FROM Questionnaires');
    await this.createSchemaAndSeed();
  }
}

export default DatabaseService;
