import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateRequestHash } from '../utils/hash';
import type { ApiCaptureRequest } from '../models/types';

const prisma = new PrismaClient();

/**
 * 接收插件上报的 API 调用数据
 * POST /api/capture
 */
export async function captureApi(req: Request, res: Response): Promise<void> {
  try {
    const { captures } = req.body as ApiCaptureRequest;
    
    if (!captures || !Array.isArray(captures)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    
    const results = [];
    
    for (const capture of captures) {
      try {
        // 生成请求哈希用于去重
        const requestHash = generateRequestHash(
          capture.url,
          capture.method,
          capture.requestBody
        );
        
        // 检查是否已存在相同的 API 调用
        const existing = await prisma.apiDoc.findFirst({
          where: {
            url: capture.url,
            method: capture.method,
            requestHash,
          },
        });
        
        if (existing) {
          // 更新现有记录
          await prisma.apiDoc.update({
            where: { id: existing.id },
            data: {
              requestHeaders: capture.requestHeaders,
              requestBody: capture.requestBody,
              responseHeaders: capture.responseHeaders,
              responseBody: capture.responseBody,
              statusCode: capture.statusCode,
              updatedAt: new Date(),
            },
          });
          results.push({ id: existing.id, action: 'updated' });
        } else {
          // 创建新记录
          const apiDoc = await prisma.apiDoc.create({
            data: {
              url: capture.url,
              method: capture.method,
              domain: capture.domain,
              requestHeaders: capture.requestHeaders,
              requestBody: capture.requestBody,
              responseHeaders: capture.responseHeaders,
              responseBody: capture.responseBody,
              statusCode: capture.statusCode,
              requestHash,
            },
          });
          results.push({ id: apiDoc.id, action: 'created' });
        }
      } catch (error) {
        console.error('Error processing capture:', error);
        results.push({ error: 'Failed to process capture' });
      }
    }
    
    res.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in captureApi:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

