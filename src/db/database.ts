import Dexie, { Table } from 'dexie';
import type { StoreAnalysis } from '@/types';

class StoreBlueprintDB extends Dexie {
  analyses!: Table<StoreAnalysis, string>;
  constructor() {
    super('StoreBlueprintOS');
    this.version(1).stores({ analyses: 'id, url, domain, timestamp, platform, overallScore, grade' });
  }
}

export const db = new StoreBlueprintDB();
export async function saveAnalysis(analysis: StoreAnalysis): Promise<void> { await db.analyses.put(analysis); }
export async function getAnalysis(id: string): Promise<StoreAnalysis | undefined> { return db.analyses.get(id); }
export async function getAnalysisByUrl(url: string): Promise<StoreAnalysis | undefined> { const r = await db.analyses.where('url').equals(url).toArray(); return r.sort((a,b)=>b.timestamp-a.timestamp)[0]; }
export async function getAllAnalyses(): Promise<StoreAnalysis[]> { return db.analyses.orderBy('timestamp').reverse().toArray(); }
export async function deleteAnalysis(id: string): Promise<void> { await db.analyses.delete(id); }
export async function clearAllAnalyses(): Promise<void> { await db.analyses.clear(); }
export async function getAnalysisCount(): Promise<number> { return db.analyses.count(); }
