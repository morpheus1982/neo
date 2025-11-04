import type { ApiCall, SkillDefinition } from '../models/skill-types';

/**
 * ApiDoc 信息映射类型
 */
export interface ApiDocInfo {
  url: string;
  method: string;
}

/**
 * 根据技能定义生成 JavaScript 代码
 * @param skillName 技能名称
 * @param skillDescription 技能描述
 * @param apiSequence API 调用序列
 * @param apiDocMap ApiDoc ID 到 { url, method } 的映射
 */
export function generateSkillCode(
  skillName: string,
  skillDescription: string,
  apiSequence: ApiCall[],
  apiDocMap: Map<string, ApiDocInfo>
): string {
  // 生成 API 调用代码
  const apiCalls = apiSequence
    .sort((a, b) => a.order - b.order)
    .map((apiCall, index) => {
      const isFirst = index === 0;
      const isLast = index === apiSequence.length - 1;
      
      // 从 ApiDoc 映射中获取 URL 和方法
      const apiDocInfo = apiDocMap.get(apiCall.apiDocId);
      if (!apiDocInfo) {
        throw new Error(`ApiDoc not found for id: ${apiCall.apiDocId}`);
      }
      
      const url = apiDocInfo.url;
      const method = apiDocInfo.method;
      
      // 生成参数映射代码
      const inputMappingCode = apiCall.inputMapping
        ? Object.entries(apiCall.inputMapping)
            .map(([key, value]) => `      ${key}: ${value.startsWith('$') ? value : `'${value}'`}`)
            .join(',\n')
        : '';
      
      // 生成输出映射代码
      const outputMappingCode = apiCall.outputMapping
        ? Object.entries(apiCall.outputMapping)
            .map(([key, value]) => `state.set('${key}', result.${value});`)
            .join('\n    ')
        : '';
      
      return `
  // 步骤 ${apiCall.order}: ${apiCall.apiDocId}
  ${apiCall.condition ? `if (${apiCall.condition}) {` : ''}
  const result${index} = await api.call({
    url: '${url}',
    method: '${method}',
    ${inputMappingCode ? `body: {\n${inputMappingCode}\n    },` : ''}
  });
  ${outputMappingCode ? `\n    ${outputMappingCode}` : ''}
  ${apiCall.condition ? '  }' : ''}`;
    })
    .join('');

  // 生成完整的技能代码
  const code = `// 技能：${skillName}
// ${skillDescription}

async function execute(context) {
  const { api, state } = context;
  ${apiCalls}
  
  return {
    success: true,
    message: '技能执行完成'
  };
}

// 导出技能元数据
export const skillMeta = {
  name: '${skillName}',
  description: '${skillDescription}',
  version: '1.0.0'
};

export default execute;
`;

  return code;
}

/**
 * 创建技能定义对象
 */
export function createSkillDefinition(
  apiSequence: ApiCall[],
  code: string
): SkillDefinition {
  return {
    format: 'javascript',
    content: code,
    apiSequence: apiSequence.sort((a, b) => a.order - b.order),
  };
}
