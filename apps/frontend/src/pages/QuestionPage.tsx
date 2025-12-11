import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Languages, Check, X, Download } from 'lucide-react';
import {
  getQuestion,
  getQuestionTranslation,
  submitAnswer,
  type Question,
} from '@/lib/api';
import { languageNames } from '@/lib/utils';
import MathRenderer from '@/components/MathRenderer';

export default function QuestionPage() {
  const { id } = useParams<{ id: string }>();
  const [currentLanguage, setCurrentLanguage] = useState<'zh-cn' | 'zh-tw' | 'en'>('zh-cn');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [shortAnswer, setShortAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [gradingResult, setGradingResult] = useState<any>(null);

  // 获取题目详情
  const { data: questionData, isLoading: questionLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => getQuestion(id!),
    enabled: !!id,
  });

  // 获取翻译
  const { data: translationData, isLoading: translationLoading } = useQuery({
    queryKey: ['questionTranslation', id, currentLanguage],
    queryFn: () => getQuestionTranslation(id!, currentLanguage),
    enabled: !!id && currentLanguage !== questionData?.data.languageBase.toLowerCase().replace('_', '-'),
  });

  // 提交答案
  const submitMutation = useMutation({
    mutationFn: submitAnswer,
    onSuccess: (response) => {
      setGradingResult(response.data.gradingResult);
      setShowAnswer(true);
    },
  });

  if (questionLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!questionData) {
    return <div className="text-center text-gray-600">题目不存在</div>;
  }

  const question: Question = questionData.data;
  const baseLanguage = question.languageBase.toLowerCase().replace('_', '-') as 'zh-cn' | 'zh-tw' | 'en';
  const isTranslated = currentLanguage !== baseLanguage;
  const displayStem = isTranslated ? translationData?.data.stem : question.stemBase;
  const displayOptions = isTranslated ? translationData?.data.options : question.options;

  const handleSubmit = () => {
    if (!showAnswer) {
      const answer = question.type === 'MCQ' ? selectedOption : shortAnswer;

      if (!answer) {
        alert('请先作答');
        return;
      }

      submitMutation.mutate({
        questionId: question.id,
        answer,
        language: currentLanguage,
      });
    } else {
      setShowAnswer(false);
      setGradingResult(null);
      setSelectedOption('');
      setShortAnswer('');
    }
  };

  const abilityAssessment = gradingResult?.abilityAssessment || {};
  const suggestions = gradingResult?.suggestions?.split('\n').filter(Boolean) || [];

  return (
    <div className="max-w-4xl mx-auto">
      {/* 语言切换 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Languages className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">语言：</span>
          {(['zh-cn', 'zh-tw', 'en'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => setCurrentLanguage(lang)}
              disabled={translationLoading && lang !== baseLanguage}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                currentLanguage === lang
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {languageNames[lang]}
            </button>
          ))}
        </div>
      </div>

      {/* 题目卡片 */}
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* 题目信息 */}
        <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {question.type === 'MCQ' ? '选择题' : '简答/计算题'}
          </span>
          {question.knowledgeTags.map(({ tag }) => (
            <span key={tag.id} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              {tag.name}
            </span>
          ))}
          {question.abilityTags.map(({ tag }) => (
            <span key={tag.id} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
              {tag.name}
            </span>
          ))}
        </div>

        {/* 题干 */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">题目</h2>
          {translationLoading && isTranslated ? (
            <div className="flex items-center text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              翻译中...
            </div>
          ) : (
            <MathRenderer content={displayStem || question.stemBase} />
          )}
        </div>

        {/* 选项（选择题） */}
        {question.type === 'MCQ' && displayOptions && !showAnswer && (
          <div className="space-y-2">
            {Object.entries(displayOptions).map(([key, value]) => (
              <label
                key={key}
                className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                  selectedOption === key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="option"
                  value={key}
                  checked={selectedOption === key}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <span className="font-medium mr-2">{key}.</span>
                  <MathRenderer content={value} className="inline" />
                </div>
              </label>
            ))}
          </div>
        )}

        {/* 简答题输入 */}
        {question.type === 'SHORT' && !showAnswer && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              你的答案
            </label>
            <textarea
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              rows={6}
              placeholder="请输入你的答案（支持 LaTeX 语法，如 $F=ma$）"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* 批改结果 */}
        {showAnswer && gradingResult && (
          <div className="space-y-4 border-t border-gray-200 pt-6">
            {/* 得分与判定 */}
            <div className={`p-4 rounded-lg ${gradingResult.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {gradingResult.isCorrect ? (
                    <Check className="h-6 w-6 text-green-600 mr-2" />
                  ) : (
                    <X className="h-6 w-6 text-red-600 mr-2" />
                  )}
                  <span className={`text-lg font-semibold ${
                    gradingResult.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {gradingResult.isCorrect ? '回答正确' : '回答错误'}
                  </span>
                </div>
                <span className={`text-2xl font-bold ${
                  gradingResult.isCorrect ? 'text-green-700' : 'text-red-700'
                }`}>
                  {gradingResult.score} / 10
                </span>
              </div>
            </div>

            {/* 标准答案 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">标准答案</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <MathRenderer content={typeof question.correctAnswer === 'string'
                  ? question.correctAnswer
                  : JSON.stringify(question.correctAnswer)} />
              </div>
            </div>

            {/* 详细解析 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">详细解析</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <MathRenderer content={question.solution} />
              </div>
            </div>

            {/* 反馈 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">批改反馈</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700">{gradingResult.feedbackText}</p>
              </div>
            </div>

            {/* 能力评估 */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">能力达标情况</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(abilityAssessment).map(([ability, level]) => (
                  <div key={ability} className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">{ability}</div>
                    <div className={`mt-1 text-sm font-semibold ${
                      level === 'excellent' ? 'text-green-600' :
                      level === 'good' ? 'text-blue-600' :
                      level === 'fair' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {level === 'excellent' ? '优秀' :
                       level === 'good' ? '良好' :
                       level === 'fair' ? '及格' : '不足'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 改进建议 */}
            {suggestions.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">改进建议</h3>
                <ul className="list-disc list-inside space-y-1 bg-yellow-50 p-4 rounded-lg">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-700">{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button
            disabled
            className="px-4 py-2 bg-gray-200 text-gray-500 rounded-md cursor-not-allowed flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            导出 PDF (开发中)
          </button>

          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 flex items-center"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                批改中...
              </>
            ) : showAnswer ? (
              '重新作答'
            ) : (
              '看答案'
            )}
          </button>
        </div>

        {submitMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {submitMutation.error.message}
          </div>
        )}
      </div>
    </div>
  );
}
