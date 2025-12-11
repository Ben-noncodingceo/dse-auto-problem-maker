import { prisma, AIProvider } from './index';

async function main() {
  console.log('开始初始化数据库...');

  // 清理现有数据（开发环境）
  if (process.env.NODE_ENV === 'development') {
    await prisma.questionAbilityTag.deleteMany();
    await prisma.questionKnowledgeTag.deleteMany();
    await prisma.gradingResult.deleteMany();
    await prisma.userAnswer.deleteMany();
    await prisma.questionTranslation.deleteMany();
    await prisma.question.deleteMany();
    await prisma.abilityTag.deleteMany();
    await prisma.knowledgeTag.deleteMany();
    await prisma.knowledgeCategory.deleteMany();
    await prisma.aIProviderConfig.deleteMany();
    await prisma.pastPaperSource.deleteMany();
    await prisma.syllabusSource.deleteMany();
    console.log('已清理现有数据');
  }

  // 创建知识点分类
  console.log('创建知识点分类...');

  const categories = [
    {
      name: '力学',
      order: 1,
      tags: [
        '直线运动',
        '匀加速运动',
        '牛顿运动定律',
        '功与能',
        '动量与冲量',
        '圆周运动',
        '万有引力',
      ],
    },
    {
      name: '波动',
      order: 2,
      tags: [
        '简谐运动',
        '波的性质',
        '声波',
        '光的反射与折射',
        '光的干涉与衍射',
      ],
    },
    {
      name: '电与磁',
      order: 3,
      tags: [
        '电场与电势',
        '电流与电阻',
        '电路分析',
        '电磁感应',
        '磁场',
        '交流电',
      ],
    },
    {
      name: '现代物理',
      order: 4,
      tags: [
        '原子结构',
        '放射性',
        '核能',
        '光电效应',
        '波粒二象性',
      ],
    },
    {
      name: '热学',
      order: 5,
      tags: [
        '温度与热量',
        '理想气体定律',
        '热力学第一定律',
        '热传递',
      ],
    },
  ];

  for (const categoryData of categories) {
    const { tags, ...categoryInfo } = categoryData;
    const category = await prisma.knowledgeCategory.create({
      data: categoryInfo,
    });

    for (const tagName of tags) {
      await prisma.knowledgeTag.create({
        data: {
          name: tagName,
          categoryId: category.id,
        },
      });
    }
  }

  console.log('知识点分类创建完成');

  // 创建能力标签
  console.log('创建能力标签...');

  const abilityTags = [
    { name: '概念理解', description: '理解基本物理概念和定义' },
    { name: '数学建模', description: '将物理问题转化为数学模型' },
    { name: '计算能力', description: '准确进行数值计算' },
    { name: '图像分析', description: '读取和分析图表、图像' },
    { name: '实验设计', description: '理解实验原理和操作' },
    { name: '逻辑推理', description: '基于已知信息进行推理' },
    { name: '综合应用', description: '综合运用多个知识点解决问题' },
  ];

  for (const tag of abilityTags) {
    await prisma.abilityTag.create({
      data: tag,
    });
  }

  console.log('能力标签创建完成');

  // 创建示例 AI 供应商配置
  console.log('创建示例 AI 供应商配置...');

  // 注意：这里的 API Key 需要替换为实际的
  if (process.env.DEEPSEEK_API_KEY) {
    await prisma.aIProviderConfig.create({
      data: {
        providerName: AIProvider.DEEPSEEK,
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        modelName: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        apiKey: process.env.DEEPSEEK_API_KEY,
        isDefault: true,
        timeoutMs: 30000,
      },
    });
    console.log('DeepSeek 配置已创建');
  }

  if (process.env.OPENAI_API_KEY) {
    await prisma.aIProviderConfig.create({
      data: {
        providerName: AIProvider.CHATGPT,
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        modelName: process.env.OPENAI_MODEL || 'gpt-4',
        apiKey: process.env.OPENAI_API_KEY,
        isDefault: !process.env.DEEPSEEK_API_KEY, // 如果没有 DeepSeek，设为默认
        timeoutMs: 30000,
      },
    });
    console.log('ChatGPT 配置已创建');
  }

  console.log('数据库初始化完成！');
}

main()
  .catch((e) => {
    console.error('初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
