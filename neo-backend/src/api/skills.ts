import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { orchestrateSkill } from '../ai/skill-orchestration';
import { generateSkillCode, createSkillDefinition } from '../services/skill-code-generator';

const prisma = new PrismaClient();

/**
 * 创建技能
 * POST /api/skills
 */
export async function createSkill(req: Request, res: Response): Promise<void> {
  try {
    const { domain, apiDocIds, name, description } = req.body;

    if (!domain || !apiDocIds || !Array.isArray(apiDocIds) || apiDocIds.length === 0) {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    // 使用 AI 编排技能
    const orchestration = await orchestrateSkill(domain, apiDocIds);

    // 使用提供的名称和描述，或使用 AI 生成的
    const finalName = name || orchestration.name;
    const finalDescription = description || orchestration.description;

    // 生成 JavaScript 代码
    const code = generateSkillCode(finalName, finalDescription, orchestration.apiSequence);

    // 创建技能定义
    const definition = createSkillDefinition(orchestration.apiSequence, code);

    // 保存到数据库
    const skill = await prisma.skill.create({
      data: {
        name: finalName,
        description: finalDescription,
        domain,
        version: 1,
        definition: definition as any,
      },
    });

    res.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    console.error('Error creating skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 查询技能列表
 * GET /api/skills
 */
export async function getSkills(req: Request, res: Response): Promise<void> {
  try {
    const { domain, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (domain) {
      where.domain = domain as string;
    }

    const [skills, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.skill.count({ where }),
    ]);

    res.json({
      success: true,
      data: skills,
      total,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 获取单个技能详情
 * GET /api/skills/:id
 */
export async function getSkillById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    res.json({
      success: true,
      data: skill,
    });
  } catch (error) {
    console.error('Error fetching skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * 下载技能定义（JavaScript 格式）
 * GET /api/skills/:id/download
 */
export async function downloadSkill(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    const definition = skill.definition as any;
    const code = definition.content || '';

    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Content-Disposition', `attachment; filename="${skill.name}-v${skill.version}.js"`);
    res.send(code);
  } catch (error) {
    console.error('Error downloading skill:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

