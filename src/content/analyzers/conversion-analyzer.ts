import type { ConversionAnalysis, ConversionElement, ConversionElementType } from '@/types';
import { clamp } from '@/utils/helpers';

interface ConversionCheck {
  type: ConversionElementType;
  selectors: string[];
  textPatterns: RegExp[];
  impact: ConversionElement['impact'];
}

const CHECKS: ConversionCheck[] = [
  {
    type: 'popup',
    selectors: ['.popup', '.modal', '[class*="popup"]', '[class*="modal"]', '[role="dialog"]', '.klaviyo-form', '.omnisend-form', '[class*="overlay"][class*="visible"]'],
    textPatterns: [/sign.?up.*get|subscribe.*(?:off|discount)|get.*off.*subscribe|join.*get.*off/i],
    impact: 'high',
  },
  {
    type: 'countdown-timer',
    selectors: ['[class*="countdown"]', '[class*="count-down"]', '[class*="timer"]', '[class*="clock"]', 'countdown-timer', '[data-countdown]'],
    textPatterns: [/\d{2}:\d{2}:\d{2}|ends?\s+in|expires?\s+in|limited.?time|oferta\s+termina|hurry|sale\s+ends/i],
    impact: 'high',
  },
  {
    type: 'stock-urgency',
    selectors: ['[class*="stock"]', '[class*="inventory"]', '[class*="availability"]', '[class*="urgency"]', '[class*="low-stock"]'],
    textPatterns: [/only\s+\d+\s+left|low\s+stock|selling\s+fast|quedan\s+\d+|últimas?\s+unidades|almost\s+gone|\d+\s+left\s+in\s+stock/i],
    impact: 'high',
  },
  {
    type: 'social-proof-live',
    selectors: ['[class*="sales-notification"]', '[class*="fomo"]', '[class*="recent-order"]', '.sales-popup', '[class*="live-sales"]', '[class*="purchase-notification"]'],
    textPatterns: [/someone\s+just\s+bought|people\s+(?:are\s+)?viewing|watching\s+now|recently\s+purchased|just\s+ordered/i],
    impact: 'medium',
  },
  {
    type: 'bundle',
    selectors: ['[class*="bundle"]', '[class*="frequently-bought"]', '[class*="bought-together"]', '[class*="product-bundle"]', '[class*="bundle-offer"]'],
    textPatterns: [/bundle|frequently\s+bought\s+together|buy\s+(?:it\s+)?with|combinar|paquete|kit\s+completo/i],
    impact: 'high',
  },
  {
    type: 'upsell',
    selectors: ['[class*="upsell"]', '[class*="up-sell"]', '[class*="upgrade"]', '[class*="recommended"]', '[class*="you-may-also"]'],
    textPatterns: [/you\s+may\s+also\s+like|customers\s+also\s+(?:bought|viewed)|you\s+might\s+like|recommended\s+for\s+you|upgrade\s+to/i],
    impact: 'high',
  },
  {
    type: 'cross-sell',
    selectors: ['[class*="cross-sell"]', '[class*="complete-the-look"]', '[class*="pair-with"]', '[class*="goes-with"]'],
    textPatterns: [/complete\s+the\s+look|pairs?\s+well\s+with|goes?\s+(?:great\s+)?with|también\s+te\s+puede/i],
    impact: 'medium',
  },
  {
    type: 'coupon',
    selectors: ['[class*="coupon"]', '[class*="promo-code"]', '[class*="discount-code"]', '[name*="coupon"]', '[name*="discount"]', '.discount-form', '[placeholder*="coupon"]', '[placeholder*="promo"]'],
    textPatterns: [/coupon|promo\s*code|discount\s*code|cupón|código\s+descuento|enter\s+code/i],
    impact: 'medium',
  },
  {
    type: 'sticky-atc',
    selectors: ['[class*="sticky"][class*="cart"]', '[class*="sticky-atc"]', '[class*="sticky-buy"]', '[class*="fixed-atc"]', '[class*="sticky-cta"]', '[class*="floating-cart"]'],
    textPatterns: [],
    impact: 'medium',
  },
  {
    type: 'exit-intent',
    selectors: ['[class*="exit-intent"]', '[class*="exit-popup"]', '[class*="abandonment"]', '[class*="leaving"]'],
    textPatterns: [/before\s+you\s+go|wait[!,]|don.?t\s+leave|leaving\s+so\s+soon/i],
    impact: 'high',
  },
];

export function analyzeConversion(): ConversionAnalysis {
  const bodyText = (document.body?.innerText ?? '').slice(0, 50_000);
  const elements: ConversionElement[] = [];
  const recommendations: string[] = [];

  for (const check of CHECKS) {
    let detected = false;
    let count = 0;
    const details: string[] = [];

    for (const sel of check.selectors) {
      try {
        const found = document.querySelectorAll(sel);
        if (found.length > 0) { detected = true; count += found.length; details.push(`${sel} (${found.length})`); }
      } catch {}
    }

    if (!detected) {
      for (const pat of check.textPatterns) {
        if (pat.test(bodyText)) { detected = true; count = 1; details.push(`Text: ${pat.source.slice(0, 30)}`); break; }
      }
    }

    elements.push({ type: check.type, detected, count, details: details.slice(0, 3), impact: check.impact });
  }

  const totalDetected = elements.filter(e => e.detected).length;
  const score = clamp(Math.round(totalDetected / elements.length * 100));

  if (!elements.find(e => e.type === 'countdown-timer' && e.detected))
    recommendations.push('Add countdown timers to limited-time offers — urgency drives 10-20% conversion lift');
  if (!elements.find(e => e.type === 'social-proof-live' && e.detected))
    recommendations.push('Add live purchase notifications (FOMO) — peer activity builds trust and urgency');
  if (!elements.find(e => e.type === 'sticky-atc' && e.detected))
    recommendations.push('Implement sticky Add-to-Cart bar — keeps purchase intent alive while scrolling');
  if (!elements.find(e => e.type === 'bundle' && e.detected))
    recommendations.push('Create product bundles — simplify buying decisions and increase AOV by 15-35%');

  return { elements, score, totalDetected, recommendations };
}
