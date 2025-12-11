export type AIProvider = 'deepseek' | 'doubao' | 'tongyi' | 'chatgpt' | 'custom';

export interface LLMConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  modelName: string;
  timeoutMs?: number;
  extraParams?: Record<string, any>;
}

export interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LLMResponse {
  content: string;
  usageTokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  rawResponse?: any;
}

export interface QuestionGenerationInput {
  exam: string; // 考试名称，如 "HKDSE Physics"
  syllabusSections: string[]; // 大纲章节
  knowledgeTags: string[]; // 知识点标签
  customTags?: string[]; // 自定义标签
  questionType: 'mcq' | 'short'; // 题型
  difficulty?: number; // 难度 1-5
  language?: 'zh-cn' | 'zh-tw' | 'en';
  fewShotExamples?: string[]; // few-shot 样例
}

export interface QuestionGenerationOutput {
  stem: string; // 题干
  options?: {
    A: string;
    B: string;
    C: string;
    D: string;
  }; // 选项（选择题）
  correctAnswer: string | string[]; // 正确答案
  solution: string; // 详细解析
  knowledgeTags: string[]; // 3个知识点标签
  abilityTags: string[]; // 3个能力标签
  latex?: string; // LaTeX 格式
}

export interface TranslationInput {
  text: string;
  sourceLanguage: 'zh-cn' | 'zh-tw' | 'en';
  targetLanguage: 'zh-cn' | 'zh-tw' | 'en';
  context?: string; // 上下文，如题目类型、学科
}

export interface GradingInput {
  questionStem: string;
  questionType: 'mcq' | 'short';
  standardAnswer: string | string[];
  studentAnswer: string | string[];
  maxScore: number;
  syllabusContext?: string; // 大纲相关能力描述
}

export interface GradingOutput {
  score: number;
  isCorrect: boolean;
  feedback: string; // 详细反馈
  abilityAssessment: {
    [abilityTag: string]: 'excellent' | 'good' | 'fair' | 'poor';
  };
  suggestions: string[]; // 改进建议
}
