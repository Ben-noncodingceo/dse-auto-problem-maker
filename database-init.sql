-- DSE Auto Problem Maker 数据库初始化脚本
-- 直接在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 第一部分：创建枚举类型
-- ============================================

-- 数据源类型
CREATE TYPE "SourceType" AS ENUM ('URL', 'PDF');

-- 解析状态
CREATE TYPE "ParseStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AI 供应商
CREATE TYPE "AIProvider" AS ENUM ('DEEPSEEK', 'DOUBAO', 'TONGYI', 'CHATGPT', 'CUSTOM');

-- 题目类型
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'SHORT');

-- 语言
CREATE TYPE "Language" AS ENUM ('ZH_CN', 'ZH_TW', 'EN');

-- ============================================
-- 第二部分：创建表结构
-- ============================================

-- 大纲来源表
CREATE TABLE "syllabus_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "SourceType" NOT NULL,
    "url" TEXT,
    "file_path" TEXT,
    "status" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "parsed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 一级知识目录表
CREATE TABLE "knowledge_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 二级知识点标签表
CREATE TABLE "knowledge_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "external_refs" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "knowledge_tags_category_id_fkey" FOREIGN KEY ("category_id")
        REFERENCES "knowledge_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 能力标签表
CREATE TABLE "ability_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 真题来源表
CREATE TABLE "past_paper_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "paper_no" TEXT NOT NULL,
    "file_path_pdf" TEXT NOT NULL,
    "file_path_latex" TEXT,
    "status" "ParseStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AI 供应商配置表
CREATE TABLE "ai_provider_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider_name" "AIProvider" NOT NULL,
    "base_url" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "timeout_ms" INTEGER NOT NULL DEFAULT 30000,
    "extra_params" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 题目表
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" "QuestionType" NOT NULL,
    "language_base" "Language" NOT NULL,
    "stem_base" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB NOT NULL,
    "solution" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "created_by_ai_provider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "questions_created_by_ai_provider_id_fkey" FOREIGN KEY ("created_by_ai_provider_id")
        REFERENCES "ai_provider_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 题目-知识点标签关联表
CREATE TABLE "question_knowledge_tags" (
    "question_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    PRIMARY KEY ("question_id", "tag_id"),
    CONSTRAINT "question_knowledge_tags_question_id_fkey" FOREIGN KEY ("question_id")
        REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_knowledge_tags_tag_id_fkey" FOREIGN KEY ("tag_id")
        REFERENCES "knowledge_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 题目-能力标签关联表
CREATE TABLE "question_ability_tags" (
    "question_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    PRIMARY KEY ("question_id", "tag_id"),
    CONSTRAINT "question_ability_tags_question_id_fkey" FOREIGN KEY ("question_id")
        REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_ability_tags_tag_id_fkey" FOREIGN KEY ("tag_id")
        REFERENCES "ability_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 题目翻译表
CREATE TABLE "question_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "language" "Language" NOT NULL,
    "stem" TEXT NOT NULL,
    "options" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "question_translations_question_id_fkey" FOREIGN KEY ("question_id")
        REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE ("question_id", "language")
);

-- 用户答案表
CREATE TABLE "user_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "question_id" TEXT NOT NULL,
    "user_id" TEXT,
    "language" "Language" NOT NULL,
    "answer_raw" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_answers_question_id_fkey" FOREIGN KEY ("question_id")
        REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 批改结果表
CREATE TABLE "grading_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_answer_id" TEXT NOT NULL UNIQUE,
    "score" DOUBLE PRECISION NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "feedback_text" TEXT NOT NULL,
    "ability_assessment" JSONB NOT NULL,
    "suggestions" TEXT NOT NULL,
    "graded_by_ai_provider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grading_results_user_answer_id_fkey" FOREIGN KEY ("user_answer_id")
        REFERENCES "user_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "grading_results_graded_by_ai_provider_id_fkey" FOREIGN KEY ("graded_by_ai_provider_id")
        REFERENCES "ai_provider_configs"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- ============================================
-- 第三部分：创建索引（提升性能）
-- ============================================

CREATE INDEX "knowledge_tags_category_id_idx" ON "knowledge_tags"("category_id");
CREATE INDEX "questions_created_by_ai_provider_id_idx" ON "questions"("created_by_ai_provider_id");
CREATE INDEX "question_translations_question_id_idx" ON "question_translations"("question_id");
CREATE INDEX "user_answers_question_id_idx" ON "user_answers"("question_id");
CREATE INDEX "grading_results_user_answer_id_idx" ON "grading_results"("user_answer_id");

-- ============================================
-- 第四部分：插入初始数据
-- ============================================

-- 插入知识点分类
INSERT INTO "knowledge_categories" ("id", "name", "order", "created_at", "updated_at") VALUES
('cat_mechanics', '力学', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_waves', '波动', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_electricity', '电与磁', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_modern', '现代物理', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_thermal', '热学', 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入知识点标签 - 力学
INSERT INTO "knowledge_tags" ("id", "name", "category_id", "created_at", "updated_at") VALUES
('tag_mech_1', '直线运动', 'cat_mechanics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_mech_2', '匀加速运动', 'cat_mechanics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_mech_3', '牛顿运动定律', 'cat_mechanics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_mech_4', '功与能', 'cat_mechanics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_mech_5', '动量与冲量', 'cat_mechanics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_mech_6', '圆周运动', 'cat_mechanics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_mech_7', '万有引力', 'cat_mechanics', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入知识点标签 - 波动
INSERT INTO "knowledge_tags" ("id", "name", "category_id", "created_at", "updated_at") VALUES
('tag_wave_1', '简谐运动', 'cat_waves', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_wave_2', '波的性质', 'cat_waves', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_wave_3', '声波', 'cat_waves', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_wave_4', '光的反射与折射', 'cat_waves', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_wave_5', '光的干涉与衍射', 'cat_waves', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入知识点标签 - 电与磁
INSERT INTO "knowledge_tags" ("id", "name", "category_id", "created_at", "updated_at") VALUES
('tag_elec_1', '电场与电势', 'cat_electricity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_elec_2', '电流与电阻', 'cat_electricity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_elec_3', '电路分析', 'cat_electricity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_elec_4', '电磁感应', 'cat_electricity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_elec_5', '磁场', 'cat_electricity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_elec_6', '交流电', 'cat_electricity', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入知识点标签 - 现代物理
INSERT INTO "knowledge_tags" ("id", "name", "category_id", "created_at", "updated_at") VALUES
('tag_modern_1', '原子结构', 'cat_modern', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_modern_2', '放射性', 'cat_modern', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_modern_3', '核能', 'cat_modern', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_modern_4', '光电效应', 'cat_modern', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_modern_5', '波粒二象性', 'cat_modern', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入知识点标签 - 热学
INSERT INTO "knowledge_tags" ("id", "name", "category_id", "created_at", "updated_at") VALUES
('tag_thermal_1', '温度与热量', 'cat_thermal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_thermal_2', '理想气体定律', 'cat_thermal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_thermal_3', '热力学第一定律', 'cat_thermal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('tag_thermal_4', '热传递', 'cat_thermal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 插入能力标签
INSERT INTO "ability_tags" ("id", "name", "description", "created_at", "updated_at") VALUES
('ability_1', '概念理解', '理解基本物理概念和定义', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ability_2', '数学建模', '将物理问题转化为数学模型', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ability_3', '计算能力', '准确进行数值计算', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ability_4', '图像分析', '读取和分析图表、图像', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ability_5', '实验设计', '理解实验原理和操作', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ability_6', '逻辑推理', '基于已知信息进行推理', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ability_7', '综合应用', '综合运用多个知识点解决问题', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- 完成！
-- ============================================
-- 数据库初始化成功！
-- 现在你可以开始使用 DSE Auto Problem Maker 了。
