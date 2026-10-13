export function normalizeAmount(raw: string | number | null | undefined, declaredUnit = '元'): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw * unitMultiplier(declaredUnit) : null;
  const text = raw.trim().replace(/[,，\s]/g, '');
  if (!text || ['--', '-', 'N/A', 'null', '未披露'].includes(text)) return null;
  const match = text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(亿元|万元|亿|万|元|%)?$/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value * unitMultiplier(match[2] || declaredUnit) : null;
}

function unitMultiplier(unit: string): number {
  if (unit.includes('亿')) return 1e8;
  if (unit.includes('万')) return 1e4;
  return 1;
}

export function unwrapFuyao(payload: {code?: number;message?: string;data?: {item?: unknown[];items?: unknown[]}}): Record<string, unknown>[] {
  if (payload.code !== 0) throw new Error(`扶摇业务错误 ${payload.code ?? '未知'}：${payload.message || '响应不可用'}`);
  const rows = payload.data?.item ?? payload.data?.items;
  if (!Array.isArray(rows)) throw new Error('扶摇响应缺少数据列表');
  return rows as Record<string, unknown>[];
}

export function growth(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous <= 0) return null;
  return Math.round((current / previous - 1) * 10000) / 100;
}
