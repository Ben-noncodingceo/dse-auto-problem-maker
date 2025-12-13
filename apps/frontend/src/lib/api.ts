import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export default api;

// API 函数

export interface KnowledgeCategory {
  id: string;
  name: string;
  order: number;
  tags: KnowledgeTag[];
}

export interface KnowledgeTag {
  id: string;
  name: string;
  categoryId: string;
}

export interface AbilityTag {
  id: string;
  name: string;
  description?: string;
}

export interface Question {
  id: string;
  type: 'MCQ' | 'SHORT';
  languageBase: string;
  stemBase: string;
  options?: Record<string, string>;
  correctAnswer: any;
  solution: string;
  difficulty: number;
  knowledgeTags: Array<{ tag: KnowledgeTag }>;
  abilityTags: Array<{ tag: AbilityTag }>;
  translations?: QuestionTranslation[];
}

export interface QuestionTranslation {
  id: string;
  language: string;
  stem: string;
  options?: Record<string, string>;
}

export interface GenerateQuestionRequest {
  categoryId: string;
  knowledgeTagIds: string[];
  customTags?: string[];
  questionType: 'mcq' | 'short';
  difficulty?: number;
  language?: 'zh-cn' | 'zh-tw' | 'en';
  aiProviderId?: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  answer: string | string[];
  language?: 'zh-cn' | 'zh-tw' | 'en';
  userId?: string;
}

export interface GradingResult {
  userAnswerId: string;
  score: number;
  isCorrect: boolean;
  feedbackText: string;
  abilityAssessment: Record<string, string>;
  suggestions: string;
}

// Knowledge APIs
export const getKnowledgeCategories = (): Promise<{ data: KnowledgeCategory[] }> => {
  return api.get('/knowledge/categories');
};

export const getAbilityTags = (): Promise<{ data: AbilityTag[] }> => {
  return api.get('/knowledge/ability-tags');
};

// Question APIs
export const generateQuestion = (data: GenerateQuestionRequest): Promise<{ data: Question }> => {
  return api.post('/questions/generate', data);
};

export const getQuestion = (id: string): Promise<{ data: Question }> => {
  return api.get(`/questions/${id}`);
};

export const getQuestionTranslation = (
  id: string,
  language: string
): Promise<{ data: QuestionTranslation }> => {
  return api.get(`/questions/${id}/translate/${language}`);
};

// Grading APIs
export const submitAnswer = (data: SubmitAnswerRequest): Promise<{ data: any }> => {
  return api.post('/grading/submit', data);
};

export const getGradingResult = (userAnswerId: string): Promise<{ data: any }> => {
  return api.get(`/grading/result/${userAnswerId}`);
};

// AI Provider APIs
export interface AIProvider {
  id: string;
  providerName: string;
  modelName: string;
  isDefault: boolean;
}

export const getAIProviders = (): Promise<{ data: AIProvider[] }> => {
  return api.get('/ai-providers');
};

export const createAIProvider = (data: any): Promise<{ data: AIProvider }> => {
  return api.post('/ai-providers', data);
};

export const updateAIProvider = (id: string, data: any): Promise<{ data: AIProvider }> => {
  return api.patch(`/ai-providers/${id}`, data);
};

export const deleteAIProvider = (id: string): Promise<void> => {
  return api.delete(`/ai-providers/${id}`);
};

// Syllabus APIs
export interface SyllabusSource {
  id: string;
  type: 'URL' | 'PDF';
  url?: string;
  fileName?: string;
  fileSize?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  parsedData?: any;
  errorMessage?: string;
  parsedAt?: string;
  createdAt: string;
}

export const getSyllabusSources = (): Promise<{ data: SyllabusSource[] }> => {
  return api.get('/syllabus');
};

export const getSyllabusSource = (id: string): Promise<{ data: SyllabusSource }> => {
  return api.get(`/syllabus/${id}`);
};

export const uploadSyllabusPDF = (file: File): Promise<{ data: SyllabusSource }> => {
  const formData = new FormData();
  formData.append('file', file);

  return axios.post('/api/syllabus/pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }).then(res => res.data);
};

export const parseSyllabusSource = (id: string): Promise<{ message: string }> => {
  return api.post(`/syllabus/${id}/parse`);
};

export const addSyllabusUrl = (url: string): Promise<{ data: SyllabusSource }> => {
  return api.post('/syllabus/url', { url });
};
