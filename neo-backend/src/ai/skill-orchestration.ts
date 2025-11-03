import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import type { ApiCall } from '../models/skill-types';

// SiliconFlow API 配置
const openai = new OpenAI({
  apiKey: process.env.SILICONFLOW_API_KEY!,
  baseURL: 'https://api.siliconflow.cn/v1',
});

const prisma = new PrismaClient();

/**
 * 生成技能编排的 Prompt
 */
function generateOrchestrationPrompt(apiDocs: Array<{
  id: string;
  url: string;
  method: string;
  docMarkdown?: string;
  requestBody?: any;
  responseBody?: any;
}>): string {
  const apiInfo = apiDocs.map((doc, index) => `
API ${index + 1}:
- ID: ${doc.id}
- URL: ${doc.url}
- Method: ${doc.method}
- 文档: ${doc.docMarkdown || '暂无文档'}
- 请求示例: ${doc.requestBody ? JSON.stringify(doc.requestBody, null, 2) : '无'}
- 响应示例: ${doc.responseBody ? JSON.stringify(doc.responseBody, null, 2) : '无'}
`).join('\n');

  return `请分析以下 API 列表，识别它们之间的关联性和常见工作流模式，然后编排一个技能。

${apiInfo}

请分析：
1. 这些 API 之间的逻辑关系（例如：获取列表 -> 创建项目 -> 更新状态）
2. 常见的工作流模式
3. 参数传递关系（一个 API 的响应数据如何传递给下一个 API）

然后生成一个技能定义，包括：
- 技能名称（简洁明了）
- 技能描述（说明这个技能做什么）
- API 执行顺序（order 字段）
- 参数映射规则（inputMapping 和 outputMapping）

请以 JSON 格式返回，格式如下：
{
  "name": "技能名称",
  "description": "技能描述",
  "apiSequence": [
    {
      "apiDocId": "API ID",
      "order": 1,
      "inputMapping": {},
      "outputMapping": {}
    }
  ]
}

请直接返回 JSON，不要包含额外的说明文字。`;
}

/**
 * AI 分析 API 并编排技能
 */
export async function orchestrateSkill(
  domain: string,
  apiDocIds: string[]
): Promise<{
  name: string;
  description: string;
  apiSequence: ApiCall[];
}> {
  try {
    // 获取 API 文档
    const apiDocs = await prisma.apiDoc.findMany({
      where: {
        id: { in: apiDocIds },
        domain,
      },
    });

    if (apiDocs.length === 0) {
      throw new Error('No API docs found');
    }

    const prompt = generateOrchestrationPrompt(apiDocs);

    const completion = await openai.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3.2-Exp',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的 API 工作流编排专家，擅长分析 API 之间的关系并设计合理的执行流程。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    // 解析 JSON 响应
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from OpenAI');
    }

    const skillData = JSON.parse(jsonMatch[0]);
    
    return {
      name: skillData.name || '未命名技能',
      description: skillData.description || '',
      apiSequence: skillData.apiSequence || [],
    };
  } catch (error) {
    console.error('Error orchestrating skill:', error);
    throw error;
  }
}
