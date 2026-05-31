import type { Grade, Platform } from '@/types';

export function generateId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2,9)}`; }
export function getDomain(url: string): string { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } }
export function formatTimestamp(ts: number): string { return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ts)); }
export function formatTimeAgo(ts: number): string { const d=Date.now()-ts,m=Math.floor(d/60_000),h=Math.floor(m/60),days=Math.floor(h/24); if(m<1)return'just now'; if(m<60)return`${m}m ago`; if(h<24)return`${h}h ago`; if(days<7)return`${days}d ago`; return formatTimestamp(ts); }
export function scoreToGrade(score: number): Grade { if(score>=90)return'A'; if(score>=75)return'B'; if(score>=60)return'C'; if(score>=45)return'D'; return'F'; }
export function gradeColor(grade: Grade): string { return{A:'#10b981',B:'#6366f1',C:'#f59e0b',D:'#ef4444',F:'#71717a'}[grade]; }
export function scoreColor(score: number): string { if(score>=80)return'#10b981'; if(score>=60)return'#6366f1'; if(score>=40)return'#f59e0b'; return'#ef4444'; }
export function platformLabel(p: Platform): string { return{shopify:'Shopify',tiendanube:'Tiendanube',woocommerce:'WooCommerce',magento:'Magento',prestashop:'PrestaShop',vtex:'VTEX',bigcommerce:'BigCommerce',squarespace:'Squarespace',wix:'Wix',custom:'Custom',unknown:'Unknown'}[p]??'Unknown'; }
export function platformColor(p: Platform): string { return{shopify:'#96bf48',tiendanube:'#00a0fb',woocommerce:'#7f54b3',magento:'#ee672f',prestashop:'#df0067',vtex:'#f71963',bigcommerce:'#34313f',squarespace:'#111111',wix:'#faad00',custom:'#6366f1',unknown:'#52525b'}[p]??'#52525b'; }
export function clamp(v: number, min=0, max=100): number { return Math.min(max,Math.max(min,v)); }
export function truncate(s: string, max: number): string { return s.length>max?s.slice(0,max)+'…':s; }
export function downloadBlob(blob: Blob, filename: string): void { const u=URL.createObjectURL(blob),a=document.createElement('a'); a.href=u; a.download=filename; a.click(); URL.revokeObjectURL(u); }
