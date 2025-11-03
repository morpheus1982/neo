import { PrismaClient } from '@prisma/client';
import { generateApiDocWithRetry } from '../ai/openai-client';

const prisma = new PrismaClient();

/**
 * 分析单个 API 文档并生成 Markdown
 */
export async function analyzeApiDoc(apiDocId: string): Promise<void> {
  const apiDoc = await prisma.apiDoc.findUnique({
    where: { id: apiDocId },
  });
  
  if (!apiDoc) {
    throw new Error(`API doc not found: ${apiDocId}`);
  }
  
  // 如果已经有文档，跳过
  if (apiDoc.docMarkdown) {
    console.log(`API doc ${apiDocId} already has documentation, skipping`);
    return;
  }
  
  try {
    // 生成文档
    const docMarkdown = await generateApiDocWithRetry({
      url: apiDoc.url,
      method: apiDoc.method,
      requestHeaders: apiDoc.requestHeaders as Record<string, string>,
      requestBody: apiDoc.requestBody as any,
      responseHeaders: apiDoc.responseHeaders as Record<string, string>,
      responseBody: apiDoc.responseBody as any,
      statusCode: apiDoc.statusCode || undefined,
    });
    
    // 更新数据库
    await prisma.apiDoc.update({
      where: { id: apiDocId },
      data: {
        docMarkdown,
        updatedAt: new Date(),
      },
    });
    
    console.log(`Successfully generated doc for API: ${apiDoc.url}`);
  } catch (error) {
    console.error(`Error analyzing API doc ${apiDocId}:`, error);
    throw error;
  }
}

/**
 * 批量分析未生成文档的 API
 */
export async function analyzePendingApiDocs(limit = 10): Promise<void> {
  const pendingDocs = await prisma.apiDoc.findMany({
    where: {
      OR: [
        { docMarkdown: null },
        { docMarkdown: '' },
      ],
    },
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  console.log(`Found ${pendingDocs.length} pending API docs to analyze`);
  
  for (const doc of pendingDocs) {
    try {
      await analyzeApiDoc(doc.id);
    } catch (error) {
      console.error(`Failed to analyze doc ${doc.id}:`, error);
      // 继续处理下一个
    }
  }
  
  console.log(`Completed analyzing ${pendingDocs.length} API docs`);
}
