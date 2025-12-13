import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Loader2, Plus, X } from 'lucide-react';
import {
  getKnowledgeCategories,
  getAIProviders,
  generateQuestion,
  type GenerateQuestionRequest,
} from '@/lib/api';
import { difficultyNames, languageNames } from '@/lib/utils';

export default function GeneratePage() {
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [questionType, setQuestionType] = useState<'mcq' | 'short'>('mcq');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [language, setLanguage] = useState<'zh-cn' | 'zh-tw' | 'en'>('zh-cn');
  const [selectedAIProvider, setSelectedAIProvider] = useState<string>('');

  // 获取知识点分类
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['knowledgeCategories'],
    queryFn: getKnowledgeCategories,
  });

  // 获取 AI 供应商列表
  const { data: aiProvidersData, isLoading: aiProvidersLoading } = useQuery({
    queryKey: ['aiProviders'],
    queryFn: getAIProviders,
  });

  // 生成题目
  const generateMutation = useMutation({
    mutationFn: generateQuestion,
    onSuccess: (response) => {
      navigate(`/question/${response.data.id}`);
    },
  });

  const categories = categoriesData?.data || [];
  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);
  const availableTags = selectedCategoryData?.tags || [];

  // 筛选已启用的 AI 供应商
  const aiProviders = (aiProvidersData?.data || []).filter(p => p.enabled && p.hasApiKey);
  const defaultProvider = aiProviders.find(p => p.isDefault);

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !customTags.includes(customTagInput.trim())) {
      setCustomTags([...customTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleGenerate = () => {
    if (!selectedCategory || selectedTags.length === 0) {
      alert('请选择知识点分类和至少一个知识点标签');
      return;
    }

    const request: GenerateQuestionRequest = {
      categoryId: selectedCategory,
      knowledgeTagIds: selectedTags,
      customTags: customTags.length > 0 ? customTags : undefined,
      questionType,
      difficulty,
      language,
      aiProviderId: selectedAIProvider || undefined,
    };

    generateMutation.mutate(request);
  };

  if (categoriesLoading || aiProvidersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">生成题目</h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* 一级知识目录 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            选择知识目录 <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setSelectedTags([]);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- 请选择 --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* 二级知识点标签 */}
        {selectedCategory && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择知识点标签 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tag.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 自定义标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            自定义标签（可选）
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
              placeholder="输入自定义标签，按 Enter 添加"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleAddCustomTag}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => handleRemoveCustomTag(tag)}
                  className="ml-1.5 text-purple-500 hover:text-purple-700"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 题型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题型 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="mcq"
                checked={questionType === 'mcq'}
                onChange={(e) => setQuestionType(e.target.value as 'mcq')}
                className="mr-2"
              />
              选择题
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="short"
                checked={questionType === 'short'}
                onChange={(e) => setQuestionType(e.target.value as 'short')}
                className="mr-2"
              />
              简答/计算题
            </label>
          </div>
        </div>

        {/* AI 模型选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI 模型
          </label>
          {aiProviders.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
              <p className="text-sm">
                暂无可用的 AI 供应商。请前往 <a href="/admin" className="underline font-medium">管理后台</a> 配置 AI 供应商。
              </p>
            </div>
          ) : (
            <>
              <select
                value={selectedAIProvider}
                onChange={(e) => setSelectedAIProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- 使用默认 AI 模型 --</option>
                {aiProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.displayName || provider.providerName}
                    {provider.isDefault && ' (默认)'}
                    {' - '}
                    {provider.modelName}
                  </option>
                ))}
              </select>
              {defaultProvider && !selectedAIProvider && (
                <p className="text-xs text-gray-500 mt-1">
                  当前默认模型：{defaultProvider.displayName || defaultProvider.providerName} - {defaultProvider.modelName}
                </p>
              )}
            </>
          )}
        </div>

        {/* 难度选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            难度：{difficultyNames[difficulty as keyof typeof difficultyNames]}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={difficulty}
            onChange={(e) => setDifficulty(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>非常简单</span>
            <span>简单</span>
            <span>中等</span>
            <span>困难</span>
            <span>非常困难</span>
          </div>
        </div>

        {/* 语言选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            题目语言
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'zh-cn' | 'zh-tw' | 'en')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Object.entries(languageNames).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* 生成按钮 */}
        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !selectedCategory || selectedTags.length === 0}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              '生成题目'
            )}
          </button>
        </div>

        {generateMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {generateMutation.error.message}
          </div>
        )}
      </div>
    </div>
  );
}
