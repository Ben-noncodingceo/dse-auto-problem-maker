import type {
  QuestionGenerationInput,
  QuestionGenerationOutput,
  TranslationInput,
  GradingInput,
  GradingOutput,
} from './types';

export class PromptBuilder {
  /**
   * 构建出题 Prompt
   */
  static buildQuestionGenerationPrompt(input: QuestionGenerationInput): string {
    const { exam, syllabusSections, knowledgeTags, customTags, questionType, difficulty, fewShotExamples } = input;

    const difficultyText = difficulty
      ? ['非常简单', '简单', '中等', '困难', '非常困难'][difficulty - 1]
      : '中等';

    let prompt = `你是一位专业的物理教师，需要为 ${exam} 考试出题。

## 要求

1. **考试范围**: ${syllabusSections.join('、')}
2. **知识点**: ${knowledgeTags.join('、')}
${customTags && customTags.length > 0 ? `3. **额外要求**: ${customTags.join('、')}` : ''}
3. **题型**: ${questionType === 'mcq' ? '选择题（单选）' : '简答/计算题'}
4. **难度**: ${difficultyText}

## 出题规范

- 题目应符合 HKDSE Physics 考试的风格和难度
- 题目应清晰、准确、无歧义
- 涉及公式时使用 LaTeX 格式（用 $ 包裹）
- 单位符号规范（如 m/s²、N、J 等）
${questionType === 'mcq' ? '- 选择题应有 4 个选项（A、B、C、D），只有一个正确答案\n- 干扰项应具有迷惑性，但明确错误' : ''}
${questionType === 'short' ? '- 简答题应有明确的得分点\n- 计算题应列出完整的解题步骤' : ''}

## 知识点与能力标签

请为题目标注：
- **3个知识点标签**（如：牛顿第二定律、功与能转换、简谐运动）
- **3个能力标签**（从以下选择）：
  - 概念理解：理解基本物理概念和定义
  - 数学建模：将物理问题转化为数学模型
  - 计算能力：准确进行数值计算
  - 图像分析：读取和分析图表、图像
  - 实验设计：理解实验原理和操作
  - 逻辑推理：基于已知信息进行推理
  - 综合应用：综合运用多个知识点解决问题

${fewShotExamples && fewShotExamples.length > 0 ? `## 参考样例\n\n${fewShotExamples.join('\n\n---\n\n')}\n` : ''}

## 输出格式

请以 JSON 格式输出，包含以下字段：

\`\`\`json
{
  "stem": "题干内容",
  ${questionType === 'mcq' ? '"options": {\n    "A": "选项A",\n    "B": "选项B",\n    "C": "选项C",\n    "D": "选项D"\n  },' : ''}
  "correctAnswer": "${questionType === 'mcq' ? 'A' : '完整的标准答案'}",
  "solution": "详细解析，包含解题思路和步骤",
  "knowledgeTags": ["标签1", "标签2", "标签3"],
  "abilityTags": ["能力1", "能力2", "能力3"]
}
\`\`\`

现在请开始出题：`;

    return prompt;
  }

  /**
   * 构建翻译 Prompt
   */
  static buildTranslationPrompt(input: TranslationInput): string {
    const languageMap = {
      'zh-cn': '简体中文',
      'zh-tw': '繁体中文',
      'en': '英文',
    };

    const source = languageMap[input.sourceLanguage];
    const target = languageMap[input.targetLanguage];

    return `请将以下${source}物理题目翻译为${target}。

## 翻译要求

1. **专业术语准确**：使用标准的物理学术语
2. **保留格式**：保留 LaTeX 公式（$...$）、单位符号、数字等格式
3. **语言地道**：翻译应符合目标语言的表达习惯
4. **简繁转换**：如果是中文简繁转换，注意术语差异（如"能量"vs"能量"）

${input.context ? `## 上下文\n\n${input.context}\n` : ''}

## 原文

${input.text}

## 输出格式

只需输出翻译后的文本，不要包含任何解释或额外内容。`;
  }

  /**
   * 构建批改 Prompt
   */
  static buildGradingPrompt(input: GradingInput): string {
    const { questionStem, questionType, standardAnswer, studentAnswer, maxScore, syllabusContext } = input;

    return `你是一位经验丰富的物理教师，需要批改学生的答案。

## 题目

${questionStem}

## 标准答案

${typeof standardAnswer === 'string' ? standardAnswer : JSON.stringify(standardAnswer, null, 2)}

## 学生答案

${typeof studentAnswer === 'string' ? studentAnswer : JSON.stringify(studentAnswer, null, 2)}

## 评分标准

- 满分：${maxScore} 分
- 题型：${questionType === 'mcq' ? '选择题' : '简答/计算题'}
${syllabusContext ? `- 大纲要求：${syllabusContext}` : ''}

## 批改要求

${questionType === 'mcq'
  ? '1. 选择题：答案完全正确得满分，否则得 0 分'
  : `1. 简答/计算题：
   - 按步骤给分
   - 关键概念理解：30%
   - 公式应用正确：30%
   - 计算过程准确：25%
   - 最终答案正确：15%
   - 允许合理的替代解法`
}

2. **能力评估**：根据学生答案评估以下能力（excellent/good/fair/poor）：
   - 概念理解
   - 数学建模/计算能力
   - 逻辑推理

3. **反馈建议**：
   - 指出答案的优点和不足
   - 给出具体的改进建议
   - 语气要鼓励和建设性

## 输出格式

请以 JSON 格式输出：

\`\`\`json
{
  "score": 8.5,
  "isCorrect": true,
  "feedback": "详细的批改反馈",
  "abilityAssessment": {
    "概念理解": "good",
    "计算能力": "excellent",
    "逻辑推理": "fair"
  },
  "suggestions": [
    "建议1",
    "建议2",
    "建议3"
  ]
}
\`\`\`

现在请开始批改：`;
  }
}
