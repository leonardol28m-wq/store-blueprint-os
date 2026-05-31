import { detectPlatform } from './analyzers/platform-detector';
import { analyzeStructure } from './analyzers/structure-analyzer';
import { analyzeFunnel } from './analyzers/funnel-analyzer';
import { analyzeUX } from './analyzers/ux-analyzer';
import { analyzeConversion } from './analyzers/conversion-analyzer';
import { computeBlueprint } from '@/utils/score';
import { generateId, getDomain, platformLabel } from '@/utils/helpers';
import type { ExtensionMessage, StoreAnalysis } from '@/types';

async function runAnalysis(): Promise<StoreAnalysis> {
  const platformResult = detectPlatform();
  const structure = analyzeStructure();
  const funnel = analyzeFunnel(platformResult.platform);
  funnel.platform = platformResult.platform;
  const ux = analyzeUX();
  const conversion = analyzeConversion();
  const blueprint = computeBlueprint(structure, funnel, ux, conversion);
  const url = window.location.href;
  const domain = getDomain(url);
  const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href || document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href || `${window.location.origin}/favicon.ico`;
  return { id: generateId(), url, domain, title: document.title||domain, timestamp: Date.now(), platform: platformResult.platform, platformLabel: platformLabel(platformResult.platform), favicon, structure, funnel, ux, conversion, blueprint, overallScore: blueprint.overallScore, grade: blueprint.grade };
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type !== 'ANALYZE_PAGE') return false;
  runAnalysis().then(data => sendResponse({ type:'ANALYSIS_RESULT', data })).catch(err => sendResponse({ type:'ANALYSIS_ERROR', error: err instanceof Error ? err.message : String(err) }));
  return true;
});
