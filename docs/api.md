# API 文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `application/json`

## 健康检查

### GET /health

检查 API 服务器状态。

**响应**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 知识点管理

### GET /knowledge/categories

获取所有知识点分类（包含二级标签）。

**响应**
```json
{
  "data": [
    {
      "id": "clxxx",
      "name": "力学",
      "order": 1,
      "tags": [
        {
          "id": "clyyy",
          "name": "牛顿第二定律",
          "categoryId": "clxxx"
        }
      ]
    }
  ]
}
```

### POST /knowledge/categories

创建一级知识目录。

**请求体**
```json
{
  "name": "力学",
  "order": 1
}
```

### GET /knowledge/categories/:categoryId/tags

获取指定分类的二级知识点标签。

### POST /knowledge/tags

创建二级知识点标签。

**请求体**
```json
{
  "name": "牛顿第二定律",
  "categoryId": "clxxx",
  "externalRefs": {
    "section": "1.3"
  }
}
```

### GET /knowledge/ability-tags

获取所有能力标签。

**响应**
```json
{
  "data": [
    {
      "id": "clzzz",
      "name": "概念理解",
      "description": "理解基本物理概念和定义"
    }
  ]
}
```

### POST /knowledge/ability-tags

创建能力标签。

---

## 题目生成

### POST /questions/generate

生成新题目。

**请求体**
```json
{
  "categoryId": "clxxx",
  "knowledgeTagIds": ["clyyy", "clzzz"],
  "customTags": ["自由落体"],
  "questionType": "mcq",
  "difficulty": 3,
  "language": "zh-cn",
  "aiProviderId": "claaa"
}
```

**参数说明**
- `categoryId` (required): 一级知识目录 ID
- `knowledgeTagIds` (required): 二级知识点标签 ID 数组
- `customTags` (optional): 自定义标签数组
- `questionType` (required): `"mcq"` | `"short"`
- `difficulty` (optional): 1-5，默认 3
- `language` (optional): `"zh-cn"` | `"zh-tw"` | `"en"`，默认 `"zh-cn"`
- `aiProviderId` (optional): AI 供应商 ID，不提供则使用默认

**响应**
```json
{
  "data": {
    "id": "clbbb",
    "type": "MCQ",
    "languageBase": "ZH_CN",
    "stemBase": "一个质量为 $m$ 的物体...",
    "options": {
      "A": "10 N",
      "B": "20 N",
      "C": "30 N",
      "D": "40 N"
    },
    "correctAnswer": "B",
    "solution": "根据牛顿第二定律 $F=ma$...",
    "difficulty": 3,
    "knowledgeTags": [
      {
        "tag": {
          "id": "clyyy",
          "name": "牛顿第二定律"
        }
      }
    ],
    "abilityTags": [
      {
        "tag": {
          "id": "clzzz",
          "name": "概念理解"
        }
      }
    ]
  }
}
```

### GET /questions/:id

获取题目详情。

**响应**
```json
{
  "data": {
    "id": "clbbb",
    "type": "MCQ",
    "stemBase": "...",
    "options": {...},
    "correctAnswer": "B",
    "solution": "...",
    "knowledgeTags": [...],
    "abilityTags": [...],
    "translations": [...]
  }
}
```

### GET /questions/:id/translate/:language

获取题目翻译（如果不存在会自动生成）。

**路径参数**
- `language`: `zh-cn` | `zh-tw` | `en`

**响应**
```json
{
  "data": {
    "id": "clccc",
    "questionId": "clbbb",
    "language": "EN",
    "stem": "A body with mass $m$...",
    "options": {
      "A": "10 N",
      "B": "20 N",
      "C": "30 N",
      "D": "40 N"
    }
  }
}
```

---

## 答案批改

### POST /grading/submit

提交答案并获取批改结果。

**请求体**
```json
{
  "questionId": "clbbb",
  "answer": "B",
  "language": "zh-cn",
  "userId": "user123"
}
```

**参数说明**
- `questionId` (required): 题目 ID
- `answer` (required): 答案（选择题为选项字母，简答题为文本）
- `language` (optional): 当前语言
- `userId` (optional): 用户 ID，可选（匿名用户）

**响应**
```json
{
  "data": {
    "userAnswer": {
      "id": "clddd",
      "questionId": "clbbb",
      "answerRaw": "B"
    },
    "gradingResult": {
      "id": "cleee",
      "userAnswerId": "clddd",
      "score": 10,
      "isCorrect": true,
      "feedbackText": "回答正确！你准确地应用了牛顿第二定律...",
      "abilityAssessment": {
        "概念理解": "excellent",
        "计算能力": "good",
        "逻辑推理": "good"
      },
      "suggestions": "继续保持！建议多练习复杂的综合题。"
    },
    "question": {
      "id": "clbbb",
      "stem": "...",
      "correctAnswer": "B",
      "solution": "..."
    }
  }
}
```

### GET /grading/result/:userAnswerId

获取批改结果详情。

---

## AI 供应商管理

### GET /ai-providers

获取所有 AI 供应商配置。

**响应**
```json
{
  "data": [
    {
      "id": "claaa",
      "providerName": "DEEPSEEK",
      "baseUrl": "https://api.deepseek.com/v1",
      "modelName": "deepseek-chat",
      "apiKey": "sk-xxxxx****",
      "isDefault": true,
      "timeoutMs": 30000
    }
  ]
}
```

### POST /ai-providers

创建 AI 供应商配置。

**请求体**
```json
{
  "providerName": "DEEPSEEK",
  "baseUrl": "https://api.deepseek.com/v1",
  "modelName": "deepseek-chat",
  "apiKey": "sk-xxxxxxxx",
  "isDefault": true,
  "timeoutMs": 30000,
  "extraParams": {}
}
```

**参数说明**
- `providerName` (required): `"DEEPSEEK"` | `"DOUBAO"` | `"TONGYI"` | `"CHATGPT"` | `"CUSTOM"`
- `baseUrl` (required): API 基础 URL
- `modelName` (required): 模型名称
- `apiKey` (required): API Key（存储时会加密）
- `isDefault` (optional): 是否为默认供应商
- `timeoutMs` (optional): 超时时间（毫秒）
- `extraParams` (optional): 额外参数（JSON 对象）

### PATCH /ai-providers/:id

更新 AI 供应商配置。

### DELETE /ai-providers/:id

删除 AI 供应商配置。

---

## 大纲管理

### GET /syllabus

获取所有大纲来源。

### POST /syllabus/url

添加大纲来源（URL）。

**请求体**
```json
{
  "url": "https://example.com/dse-physics-syllabus.pdf"
}
```

### POST /syllabus/pdf

上传大纲 PDF（待实现）。

---

## 错误响应

所有错误响应格式统一为：

```json
{
  "error": "错误信息描述"
}
```

**常见错误码**
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误
- `501` - 功能未实现

---

## 数据模型

### QuestionType
- `MCQ` - 选择题
- `SHORT` - 简答/计算题

### Language
- `ZH_CN` - 简体中文
- `ZH_TW` - 繁体中文
- `EN` - 英文

### AIProvider
- `DEEPSEEK`
- `DOUBAO`
- `TONGYI`
- `CHATGPT`
- `CUSTOM`

### ParseStatus
- `PENDING` - 等待解析
- `PROCESSING` - 解析中
- `COMPLETED` - 已完成
- `FAILED` - 失败

---

## 使用示例

### 完整流程示例

```javascript
// 1. 获取知识点分类
const categories = await fetch('/api/knowledge/categories').then(r => r.json());

// 2. 生成题目
const question = await fetch('/api/questions/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    categoryId: categories.data[0].id,
    knowledgeTagIds: [categories.data[0].tags[0].id],
    questionType: 'mcq',
    difficulty: 3,
  })
}).then(r => r.json());

// 3. 获取题目详情
const questionDetail = await fetch(`/api/questions/${question.data.id}`)
  .then(r => r.json());

// 4. 提交答案
const result = await fetch('/api/grading/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionId: question.data.id,
    answer: 'A',
  })
}).then(r => r.json());

console.log('得分:', result.data.gradingResult.score);
console.log('反馈:', result.data.gradingResult.feedbackText);
```

---

## 速率限制

目前未实施速率限制，但建议：
- 题目生成: 每分钟不超过 10 次
- 翻译请求: 每分钟不超过 20 次
- 批改请求: 每分钟不超过 20 次

---

## Webhooks（待实现）

未来版本将支持 Webhooks，用于：
- 题目生成完成通知
- 大纲解析完成通知
- 批改完成通知
