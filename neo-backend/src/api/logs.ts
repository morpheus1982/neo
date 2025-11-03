import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { ExecutionLog } from '../models/skill-types';

const prisma = new PrismaClient();

/**
 * 接收执行日志
 * POST /api/logs
 */
export async function receiveLogs(req: Request, res: Response): Promise<void> {
  try {
    const { logs } = req.body as { logs: ExecutionLog[] };
    
    if (!logs || !Array.isArray(logs)) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }
    
    const results = [];
    
    for (const log of logs) {
      try {
        const executionLog = await prisma.executionLog.create({
          data: {
            skillId: log.skillId,
            skillVersion: log.skillVersion,
            domain: log.domain,
            timestamp: new Date(log.timestamp),
            status: log.status,
            steps: log.steps as any,
            error: log.error,
          },
        });
        
        results.push({ id: executionLog.id, success: true });
      } catch (error) {
        console.error('Error saving log:', error);
        results.push({ error: 'Failed to save log' });
      }
    }
    
    res.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in receiveLogs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

