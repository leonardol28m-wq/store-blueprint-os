import type { Blueprint, Grade, StoreAnalysis } from '@/types';
import { clamp, scoreToGrade } from './helpers';

export function computeBlueprint(
  structure: StoreAnalysis['structure'],
  funnel: StoreAnalysis['funnel'],
  ux: StoreAnalysis['ux'],
  conversion: StoreAnalysis['conversion'],
): Blueprint {
  const s=clamp(structure.score), f=clamp(funnel.completeness), u=clamp(ux.overallScore), c=clamp(conversion.score);
  const overall = Math.round((s+f+u+c)/4);
  const grade = scoreToGrade(overall) as Grade;
  const strengths:string[]=[], weaknesses:string[]=[], quickWins:string[]=[], recommendations:string[]=[];

  if(s>=75) strengths.push('Well-structured page with most key sections present');
  else weaknesses.push('Missing critical sections that reduce credibility');

  if (!structure.sections.find(s=>s.type==='reviews'&&s.detected)) { quickWins.push('Add customer reviews/testimonials — highest ROI trust builder'); recommendations.push('Social proof is the #1 conversion lever. Add a reviews section with real photos and star ratings.'); }
  if (!structure.sections.find(s=>s.type==='benefits'&&s.detected)) { quickWins.push('Create a benefits/USP section above the fold'); recommendations.push('Visitors need to immediately understand your unique value proposition. Add 3–4 benefit pillars with icons.'); }
  if (!structure.sections.find(s=>s.type==='faq'&&s.detected)) recommendations.push('Add a FAQ section to handle objections and reduce support volume.');

  if(f>=75) strengths.push('Clear conversion funnel with visible pathways to purchase');
  else weaknesses.push('Funnel gaps detected — users may not find path to purchase');
  if(funnel.frictionPoints.length>0) weaknesses.push(...funnel.frictionPoints.slice(0,2));

  if(u>=75) strengths.push('Good visual hierarchy and UX foundation');
  else weaknesses.push('UX issues may be causing early drop-offs');
  if(!ux.cta.hasAboveFold) quickWins.push('Add a prominent CTA button above the fold');
  if(!ux.cta.hasPrimary) quickWins.push('Establish a single dominant CTA (avoid button confusion)');
  if(ux.trustScore<50) { quickWins.push('Add trust badges: SSL, payment icons, guarantees'); recommendations.push('Trust is the #2 conversion killer. Add payment badges, guarantee seals, and security icons near the CTA.'); }

  if(c>=75) strengths.push('Strong conversion optimization stack detected');
  else if(c<40) { weaknesses.push('Low conversion optimization — significant revenue being left on the table'); recommendations.push('Implement urgency mechanics (stock countdowns, limited-time offers) to increase conversion rate by 10–20%.'); }
  if(!conversion.elements.find(e=>e.type==='upsell'&&e.detected)) recommendations.push('Add post-purchase upsell flow. Average order value can increase 15–35% with relevant offers.');
  if(!conversion.elements.find(e=>e.type==='bundle'&&e.detected)) recommendations.push('Bundle frequently bought together items. Bundles increase AOV and simplify the buying decision.');
  if(!conversion.elements.find(e=>e.type==='coupon'&&e.detected)) quickWins.push('Add a first-time visitor discount popup (email capture)');

  const platform = funnel.platform!=='unknown'?`on ${funnel.platform.toUpperCase()}`:'';
  const rating = overall>=80?'a well-optimized store':overall>=60?'a store with solid foundations but room to grow':overall>=40?'a store with significant conversion opportunities':'a store that needs major CRO attention';
  const executiveSummary = `This is ${rating} ${platform}. ${structure.detectedCount} of ${structure.totalChecked} key sections detected (Score: ${overall}/100, Grade: ${grade}). ${quickWins.length>0?`${quickWins.length} quick-win opportunities identified.`:'The store has a strong foundational structure.'}`;

  return { executiveSummary, strengths:strengths.slice(0,5), weaknesses:weaknesses.slice(0,5), quickWins:quickWins.slice(0,5), recommendations:recommendations.slice(0,6), overallScore:overall, grade, scoreBreakdown:{structure:s,funnel:f,ux:u,conversion:c} };
}
