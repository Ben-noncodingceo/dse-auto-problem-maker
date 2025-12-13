import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Edit, Trash2, X, Check, AlertCircle } from 'lucide-react';
import {
  getAIProviders,
  enablePresetProvider,
  createCustomProvider,
  updateAIProvider,
  deleteAIProvider,
  type AIProvider,
} from '../../lib/api';

// AI 供应商预设配置（仅用于前端显示）
const PROVIDER_PRESETS = {
  DEEPSEEK: {
    name: 'DeepSeek',
    description: 'DeepSeek 深度求索 - 性价比极高的 AI 模型',
    envKey: 'DEEPSEEK_API_KEY',
  },
  GEMINI: {
    name: 'Google Gemini',
    description: 'Google Gemini - 强大的多模态 AI 模型',
    envKey: 'GEMINI_API_KEY',
  },
  CHATGPT: {
    name: 'OpenAI ChatGPT',
    description: 'OpenAI ChatGPT - 业界领先的 AI 模型',
    envKey: 'OPENAI_API_KEY',
  },
  TONGYI: {
    name: '通义千问',
    description: '阿里云通义千问 - 中文优化的 AI 模型',
    envKey: 'TONGYI_API_KEY',
  },
  DOUBAO: {
    name: '豆包',
    description: '字节跳动豆包 - 高性能中文 AI 模型',
    envKey: 'DOUBAO_API_KEY',
  },
};

export default function AIProviderManagement() {
  const queryClient = useQueryClient();
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [customFormData, setCustomFormData] = useState({
    baseUrl: '',
    modelName: '',
    apiKey: '',
    isDefault: false,
    timeoutMs: 30000,
  });

  const { data: providersData, isLoading } = useQuery({
    queryKey: ['aiProviders'],
    queryFn: getAIProviders,
  });

  const enablePresetMutation = useMutation({
    mutationFn: ({ providerName, isDefault }: { providerName: string; isDefault: boolean }) =>
      enablePresetProvider(providerName, { isDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
    },
  });

  const createCustomMutation = useMutation({
    mutationFn: createCustomProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
      setShowCustomModal(false);
      resetCustomForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAIProvider(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
      setShowCustomModal(false);
      setEditingProvider(null);
      resetCustomForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAIProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
    },
  });

  const providers = providersData?.data || [];
  const presetProviders = providers.filter((p) => p.isPreset);
  const customProviders = providers.filter((p) => !p.isPreset);

  const resetCustomForm = () => {
    setCustomFormData({
      baseUrl: '',
      modelName: '',
      apiKey: '',
      isDefault: false,
      timeoutMs: 30000,
    });
  };

  const handleEnablePreset = (providerName: string, isDefault: boolean = false) => {
    enablePresetMutation.mutate({ providerName, isDefault });
  };

  const handleSetDefault = (id: string, providerName: string, isPreset: boolean) => {
    if (isPreset) {
      enablePresetMutation.mutate({ providerName, isDefault: true });
    } else {
      updateMutation.mutate({ id, data: { isDefault: true } });
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id, data: customFormData });
    } else {
      createCustomMutation.mutate(customFormData);
    }
  };

  const handleEditCustom = (provider: AIProvider) => {
    setEditingProvider(provider);
    setCustomFormData({
      baseUrl: provider.baseUrl,
      modelName: provider.modelName,
      apiKey: '', // 不回显 API Key
      isDefault: provider.isDefault,
      timeoutMs: 30000,
    });
    setShowCustomModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个 AI 供应商配置吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenCustomModal = () => {
    resetCustomForm();
    setEditingProvider(null);
    setShowCustomModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">AI 供应商配置</h2>
        <p className="text-sm text-gray-600 mt-1">
          配置用于题目生成和批改的 AI 模型
        </p>
      </div>

      {/* 预设 AI 供应商 */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">预设 AI 供应商</h3>
        <p className="text-sm text-gray-600 mb-4">
          这些供应商的 API Key 需要在 Cloudflare Worker 环境变量中配置。配置后点击"启用"即可使用。
        </p>

        <div className="space-y-3">
          {presetProviders.map((provider) => {
            const preset = PROVIDER_PRESETS[provider.providerName as keyof typeof PROVIDER_PRESETS];
            return (
              <div
                key={provider.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">
                        {provider.displayName || preset?.name}
                      </h4>
                      {provider.isDefault && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          默认
                        </span>
                      )}
                      {provider.enabled && !provider.hasApiKey && (
                        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                          API Key 缺失
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{preset?.description}</p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>模型: {provider.modelName}</p>
                      <p>环境变量: {preset?.envKey}</p>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {provider.hasApiKey ? (
                      <>
                        {provider.enabled ? (
                          <>
                            <button
                              onClick={() => handleDelete(provider.id)}
                              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50"
                            >
                              禁用
                            </button>
                            {!provider.isDefault && (
                              <button
                                onClick={() => handleSetDefault(provider.id, provider.providerName, true)}
                                className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 border border-primary-300 rounded hover:bg-primary-50"
                              >
                                设为默认
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => handleEnablePreset(provider.providerName)}
                            disabled={enablePresetMutation.isPending}
                            className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:bg-gray-400 flex items-center"
                          >
                            {enablePresetMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                启用中...
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                启用
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm text-yellow-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>请在 Worker 中配置 {preset?.envKey}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 自定义 AI 供应商 */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">自定义 AI 供应商</h3>
            <p className="text-sm text-gray-600 mt-1">
              添加不在预设列表中的 AI 供应商，需要提供完整的 API 信息
            </p>
          </div>
          <button
            onClick={handleOpenCustomModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加自定义供应商
          </button>
        </div>

        {customProviders.length === 0 ? (
          <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="mb-2">暂无自定义供应商</p>
            <p className="text-sm">点击上方按钮添加自定义 AI 供应商</p>
          </div>
        ) : (
          <div className="space-y-3">
            {customProviders.map((provider) => (
              <div
                key={provider.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">自定义供应商</h4>
                      {provider.isDefault && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          默认
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Base URL: {provider.baseUrl}</p>
                      <p>模型: {provider.modelName}</p>
                      {provider.apiKey && <p>API Key: {provider.apiKey}</p>}
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-2">
                    {!provider.isDefault && (
                      <button
                        onClick={() => handleSetDefault(provider.id, provider.providerName, false)}
                        className="px-3 py-1 text-sm text-primary-600 hover:text-primary-800 border border-primary-300 rounded hover:bg-primary-50"
                      >
                        设为默认
                      </button>
                    )}
                    <button
                      onClick={() => handleEditCustom(provider)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加/编辑自定义供应商模态框 */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingProvider ? '编辑自定义供应商' : '添加自定义供应商'}
              </h3>
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setEditingProvider(null);
                  resetCustomForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCustomSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL *
                </label>
                <input
                  type="url"
                  value={customFormData.baseUrl}
                  onChange={(e) => setCustomFormData({ ...customFormData, baseUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://api.example.com/v1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  AI 服务的基础 URL
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型名称 *
                </label>
                <input
                  type="text"
                  value={customFormData.modelName}
                  onChange={(e) => setCustomFormData({ ...customFormData, modelName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="gpt-4-turbo-preview"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key *
                </label>
                <input
                  type="password"
                  value={customFormData.apiKey}
                  onChange={(e) => setCustomFormData({ ...customFormData, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="sk-..."
                  required={!editingProvider}
                />
                {editingProvider && (
                  <p className="text-xs text-gray-500 mt-1">
                    留空则不更新 API Key
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  超时时间（毫秒）
                </label>
                <input
                  type="number"
                  value={customFormData.timeoutMs}
                  onChange={(e) => setCustomFormData({ ...customFormData, timeoutMs: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  min="1000"
                  max="120000"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="customIsDefault"
                  checked={customFormData.isDefault}
                  onChange={(e) => setCustomFormData({ ...customFormData, isDefault: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="customIsDefault" className="ml-2 block text-sm text-gray-900">
                  设为默认供应商
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomModal(false);
                    setEditingProvider(null);
                    resetCustomForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createCustomMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {createCustomMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </span>
                  ) : (
                    editingProvider ? '更新' : '添加'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
