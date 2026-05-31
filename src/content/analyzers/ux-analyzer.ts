import type { CTAButton, SpacingAnalysis, TrustElement, TrustElementType, UXAnalysis, VisualHierarchy } from '@/types';
import { clamp } from '@/utils/helpers';

function analyzeVisualHierarchy(): VisualHierarchy {
  const h1s = document.querySelectorAll('h1');
  const h2s = document.querySelectorAll('h2');
  const h3s = document.querySelectorAll('h3');
  const h4plus = document.querySelectorAll('h4,h5,h6');
  const hasH1 = h1s.length > 0;
  const headingCount = h1s.length + h2s.length + h3s.length + h4plus.length;
  const headingDepth = h3s.length > 0 ? 3 : h2s.length > 0 ? 2 : h1s.length > 0 ? 1 : 0;
  const issues: string[] = [];
  const positives: string[] = [];
  let score = 50;
  if (!hasH1) { issues.push('Missing H1 — critical for SEO and visual hierarchy'); score -= 20; }
  else { positives.push('H1 heading present'); score += 15; }
  if (h1s.length > 1) { issues.push(`Multiple H1 tags (${h1s.length}) — reduces semantic focus`); score -= 10; }
  if (headingDepth >= 2) { positives.push('Multi-level heading structure'); score += 15; }
  if (headingCount === 0) { issues.push('No heading tags detected'); score -= 20; }
  else if (headingCount > 2) { positives.push(`${headingCount} headings provide content structure`); score += 10; }
  const hasFont = !!(document.querySelector('link[href*="fonts.google"]') || document.querySelector('link[href*="typekit"]'));
  if (hasFont) { positives.push('Custom web font loaded'); score += 5; }
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) { positives.push('Meta description present'); score += 5; }
  return { score: clamp(score), hasH1, headingDepth, headingCount, issues, positives };
}

function analyzeCTAs(): UXAnalysis['cta'] {
  const buttons: CTAButton[] = [];
  const issues: string[] = [];
  const seen = new Set<string>();
  const candidates = document.querySelectorAll<HTMLElement>(
    'button, a[class*="btn"], a[class*="button"], [role="button"], input[type="submit"], .btn, .button'
  );
  candidates.forEach(el => {
    const text = (el.textContent ?? (el as HTMLInputElement).value ?? '').trim().replace(/\s+/g, ' ');
    if (!text || text.length > 60 || seen.has(text.toLowerCase())) return;
    try {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      seen.add(text.toLowerCase());
      const cls = ((el.className as string) || '').toLowerCase() + ' ' + text.toLowerCase();
      const isPrimary = /primary|btn-main|cta|add.?to.?cart|buy|checkout|shop|get|order|comprar|agregar/i.test(cls);
      const isGhost = /ghost|outline|secondary|tertiary/i.test(cls);
      const position: CTAButton['position'] = rect.top < window.innerHeight
        ? 'above-fold'
        : el.closest('[class*="sticky"],[class*="fixed"]') ? 'sticky' : 'below-fold';
      buttons.push({ text: text.slice(0, 40), type: isPrimary ? 'primary' : isGhost ? 'ghost' : 'secondary', position, hasContrast: true });
    } catch {}
  });
  const count = buttons.length;
  const hasPrimary = buttons.some(b => b.type === 'primary');
  const hasAboveFold = buttons.some(b => b.position === 'above-fold');
  if (count === 0) issues.push('No CTA buttons detected on this page');
  if (!hasPrimary) issues.push('No clear primary CTA — visitors may not know what action to take');
  if (!hasAboveFold) issues.push('No CTA visible above the fold — high exit risk');
  if (count > 8) issues.push('Too many CTAs competing for attention — decision paralysis risk');
  const score = clamp(
    (hasAboveFold ? 30 : 0) + (hasPrimary ? 30 : 0) + (count > 0 ? 20 : 0) +
    (count <= 6 ? 10 : 0) + (issues.length === 0 ? 10 : 0)
  );
  return { score, count, buttons: buttons.slice(0, 10), hasPrimary, hasAboveFold, issues };
}

function analyzeSpacing(): SpacingAnalysis {
  const sections = document.querySelectorAll('section, article, [class*="section"], [data-section-type]');
  const sectionCount = sections.length;
  const issues: string[] = [];
  let density: SpacingAnalysis['density'] = 'balanced';
  let score = 70;
  if (sectionCount > 14) { density = 'dense'; issues.push('High section density — may overwhelm visitors'); score -= 15; }
  else if (sectionCount < 3) { density = 'sparse'; issues.push('Very few content sections detected'); score -= 15; }
  else { score += 15; }
  const hasPaddedContainers = document.querySelectorAll('[class*="container"],[class*="wrapper"],[class*="inner"]').length > 0;
  if (hasPaddedContainers) score += 10;
  return { score: clamp(score), density, sectionCount, issues };
}

function analyzeTrustElements(): TrustElement[] {
  const TRUST_CHECKS: [TrustElementType, string, RegExp][] = [
    ['ssl', '[class*="ssl"],[class*="secure-badge"],[class*="https"],[class*="lock-icon"]', /secure.*checkout|ssl.*secured|https/i],
    ['payment-icons', '[class*="payment"],[class*="visa"],[class*="mastercard"],[class*="paypal"],[class*="stripe"],.payment-icons,.payment-methods,.accepted-payments', /visa|mastercard|paypal|amex|stripe|apple.?pay|google.?pay/i],
    ['guarantee', '[class*="guarantee"],[class*="money-back"],[class*="warranty"],[class*="refund-policy"]', /guarantee|money.back|refund.?policy|devolución|garantía|warranty/i],
    ['star-rating', '[class*="star-rating"],[class*="rating-star"],.yotpo-star,.judge-me-star,[class*="stars"]', /[★⭐]|[0-9]+\s*\/\s*5|rated\s+[0-9]/i],
    ['review-count', '[class*="review-count"],[class*="reviews-count"],[class*="review-number"]', /[0-9,]+\s+(reviews|opiniones|reseñas|valoraciones)/i],
    ['trust-badge', '[class*="trust-badge"],[class*="trust-seal"],[class*="security-badge"],.norton,.mcafee,.trustpilot', /trusted\s+by|verified\s+by|certified|mcafee|norton|trustpilot/i],
    ['press-mentions', '[class*="press"],[class*="as-seen-in"],[class*="featured-in"],[class*="media-logos"]', /as\s+seen\s+in|featured\s+in|press\s+mentions|aparecimos/i],
  ];
  return TRUST_CHECKS.map(([type, selStr, textPat]) => {
    let detected = false;
    let count = 0;
    for (const sel of selStr.split(',')) {
      try { const f = document.querySelectorAll(sel.trim()); if (f.length > 0) { detected = true; count += f.length; } } catch {}
    }
    if (!detected && textPat.test(document.body.innerText || '')) { detected = true; count = 1; }
    return { type, detected, count: detected ? count : 0 };
  });
}

export function analyzeUX(): UXAnalysis {
  const visualHierarchy = analyzeVisualHierarchy();
  const cta = analyzeCTAs();
  const spacing = analyzeSpacing();
  const trustElements = analyzeTrustElements();
  const detectedTrust = trustElements.filter(e => e.detected).length;
  const trustScore = clamp(Math.round(detectedTrust / trustElements.length * 100));
  const mobileReady = !!document.querySelector('meta[name="viewport"]');
  const mobileBonus = mobileReady ? 5 : -10;
  const overallScore = clamp(Math.round((visualHierarchy.score + cta.score + spacing.score + trustScore) / 4) + mobileBonus);
  return { visualHierarchy, cta, spacing, trustElements, trustScore, mobileReady, overallScore };
}
