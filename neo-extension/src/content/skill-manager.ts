/**
 * 技能管理模块
 * 负责从服务端下载技能、缓存、版本管理
 */

const BACKEND_URL = 'http://localhost:3000';

export interface SkillInfo {
  id: string;
  name: string;
  description: string;
  domain: string;
  version: number;
}

export interface SkillDefinition {
  format: 'javascript';
  content: string;
  apiSequence: any[];
}

/**
 * 获取技能列表
 */
export async function getSkillList(domain?: string): Promise<SkillInfo[]> {
  try {
    const url = domain
      ? `${BACKEND_URL}/api/skills?domain=${encodeURIComponent(domain)}`
      : `${BACKEND_URL}/api/skills`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch skills: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[Neo] Error fetching skill list:', error);
    return [];
  }
}

/**
 * 下载技能定义
 */
export async function downloadSkill(skillId: string): Promise<string> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/skills/${skillId}/download`);
    if (!response.ok) {
      throw new Error(`Failed to download skill: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('[Neo] Error downloading skill:', error);
    throw error;
  }
}

/**
 * 缓存技能到本地存储
 */
export async function cacheSkill(skillId: string, code: string, version: number): Promise<void> {
  const key = `skill_${skillId}`;
  const data = {
    code,
    version,
    cachedAt: Date.now(),
  };
  
  await chrome.storage.local.set({ [key]: data });
}

/**
 * 从缓存获取技能
 */
export async function getCachedSkill(skillId: string): Promise<{ code: string; version: number } | null> {
  const key = `skill_${skillId}`;
  const result = await chrome.storage.local.get([key]);
  
  if (result[key]) {
    return {
      code: result[key].code,
      version: result[key].version,
    };
  }
  
  return null;
}

/**
 * 检查技能更新
 */
export async function checkSkillUpdate(skillId: string, currentVersion: number): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/skills/${skillId}`);
    if (!response.ok) {
      return false;
    }
    
    const data = await response.json();
    const latestVersion = data.data?.version || 0;
    
    return latestVersion > currentVersion;
  } catch (error) {
    console.error('[Neo] Error checking skill update:', error);
    return false;
  }
}

/**
 * 获取技能（优先使用缓存，否则下载）
 */
export async function getSkill(skillId: string): Promise<string> {
  // 先检查缓存
  const cached = await getCachedSkill(skillId);
  
  if (cached) {
    // 检查是否有更新
    const hasUpdate = await checkSkillUpdate(skillId, cached.version);
    
    if (!hasUpdate) {
      return cached.code;
    }
  }
  
  // 下载最新版本
  const code = await downloadSkill(skillId);
  
  // 获取版本信息
  const response = await fetch(`${BACKEND_URL}/api/skills/${skillId}`);
  if (response.ok) {
    const data = await response.json();
    const version = data.data?.version || 1;
    await cacheSkill(skillId, code, version);
  }
  
  return code;
}

