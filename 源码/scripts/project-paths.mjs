import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const workspaceRoot = path.resolve(sourceRoot, '..');
export const reportsRoot = path.join(workspaceRoot, '开发进度', '验证记录');
export const artRoot = path.join(workspaceRoot, '素材', '游戏美术');
