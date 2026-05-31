import type { PageType, Section, SectionType, StructureMap } from '@/types';
import { clamp } from '@/utils/helpers';

interface SectionPattern { type: SectionType; label: string; selectors: string[]; keywords: string[]; domSignals?: string[]; }

const SECTION_PATTERNS: SectionPattern[] = [
  { type:'header', label:'Header / Navigation', selectors:['header','[role="banner"]','.header','#header','.site-header','.masthead','.top-header','.page-header','nav.navbar','.nav-wrapper','.header-wrapper','.site-nav','.shopify-section-header'], keywords:['header','navbar','navigation','topbar','nav-menu','main-nav'] },
  { type:'hero', label:'Hero / Banner', selectors:['.hero','.hero-section','.hero-banner','.banner','.main-banner','.slideshow','.slider','.carousel','.swiper','#hero','.jumbotron','.page-hero','[data-section-type="slideshow"]','[data-section-type="image-banner"]','.hero-image','.hero-container'], keywords:['hero','banner','slideshow','slider','carousel','jumbotron'], domSignals:['large-background-image','h1-with-cta'] },
  { type:'benefits', label:'Benefits / USP', selectors:['.benefits','.features','.usp','.value-props','.why-us','.highlights','.perks','.advantages','.feature-list','.key-features','.value-proposition','[data-section-type="features"]','.icon-box','.icon-boxes','.feature-boxes','.feature-grid'], keywords:['beneficios','benefits','features','por qué','why choose','ventajas','why us','our promise','nuestra promesa'] },
  { type:'featured-products', label:'Featured Products', selectors:['.featured-products','.product-grid','.products-section','.featured-collection','[data-section-type="featured-collection"]','[data-section-type="product-grid"]','.collection-grid','.product-list','.products-wrapper','.best-sellers','.trending-products','.new-arrivals','.shop-section','.product-slider','.featured-product','.product-showcase'], keywords:['productos','products','featured','destacados','best sellers','más vendidos','new arrivals','trending','shop now','our products','nuestros productos','collection','colección'] },
  { type:'reviews', label:'Reviews / Testimonials', selectors:['.reviews','.testimonials','.testimonial-section','.customer-reviews','[data-section-type="reviews"]','.ratings','.social-proof','.review-section','.testimonial-grid','.customer-testimonials','.star-rating','.review-carousel','.judge-me-reviews','.stamped-reviews','.yotpo-widget'], keywords:['reviews','opiniones','testimonios','testimonials','customers say','lo que dicen','what our customers','verified','★','⭐','rated','stars'], domSignals:['star-rating-elements','review-count'] },
  { type:'faq', label:'FAQ', selectors:['.faq','.faqs','.faq-section','[data-section-type="faq"]','.accordion','.collapsible','.questions','.q-and-a','#faq','.frequently-asked','.help-section'], keywords:['faq','preguntas frecuentes','frequently asked','questions','preguntas','common questions','how does','cómo funciona','help center'], domSignals:['details-summary','accordion-toggle'] },
  { type:'footer', label:'Footer', selectors:['footer','[role="contentinfo"]','.footer','#footer','.site-footer','.page-footer','.footer-wrapper'], keywords:['footer','pie de página'] },
  { type:'newsletter', label:'Newsletter / Email Capture', selectors:['.newsletter','.email-signup','.subscribe','.mailing-list','[data-section-type="newsletter"]','.newsletter-section','form[action*="subscribe"]','form[action*="newsletter"]','.klaviyo-form'], keywords:['newsletter','subscribe','email','suscríbete','get updates','join our list','exclusive offers','ofertas exclusivas'] },
  { type:'social-proof', label:'Social Proof / Press', selectors:['.press','.as-seen-in','.logos','.brand-logos','.featured-in','.media-logos','.press-logos','.trust-logos','.partners'], keywords:['as seen in','featured in','press','media','as featured in','aparecimos en','trusted by'] },
  { type:'guarantee', label:'Guarantee / Promise', selectors:['.guarantee','.money-back','.promise','.warranty','.return-policy-section','.satisfaction','.risk-free'], keywords:['guarantee','garantía','money back','devolución','satisfaction guaranteed','risk free','30-day','60-day','100%','free returns'] },
];

export function detectPageType(): PageType {
  const path = window.location.pathname.toLowerCase();
  const bodyClass = document.body.className.toLowerCase();
  if (/\/cart\/?(\.\?|$)/i.test(path) || bodyClass.includes('cart')) return 'cart';
  if (/\/checkout\/?/i.test(path) || bodyClass.includes('checkout')) return 'checkout';
  if (/\/products?\/[^/]+\/?$/i.test(path) || /\/product\/[^/]+\/?$/i.test(path)) return 'product';
  if (/\/collections?\/[^/]+\/?$/i.test(path) || /\/categoria\/[^/]+\/?$/i.test(path)) return 'collection';
  if (/\/blogs?\/[^/]+\/?$/i.test(path) || bodyClass.includes('blog')) return 'blog';
  if (/\/about\b|\/sobre\b|\/nosotros\b/i.test(path)) return 'about';
  if (/\/contact\b|\/contacto\b/i.test(path)) return 'contact';
  if (path === '/' || path === '' || /^\/(en|es|pt|fr)?\/?$/.test(path)) return 'home';
  const ogType = document.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content??'';
  if (ogType === 'product') return 'product';
  if (ogType === 'article') return 'blog';
  const schema = document.querySelector('[type="application/ld+json"]');
  if (schema) { try { const d = JSON.parse(schema.textContent??'{}'); if (d['@type']==='Product') return 'product'; if (d['@type']==='WebSite'||d['@type']==='Organization') return 'home'; } catch {} }
  return 'unknown';
}

export function analyzeStructure(): StructureMap {
  const pageType = detectPageType();
  const sections: Section[] = SECTION_PATTERNS.map(detectSection);
  const detectedCount = sections.filter(s=>s.detected).length;
  const criticalTypes: SectionType[] = ['header','hero','featured-products','footer'];
  const importantTypes: SectionType[] = ['benefits','reviews','newsletter'];
  let score = 0;
  for (const s of sections) {
    if (!s.detected) continue;
    if (criticalTypes.includes(s.type)) score += 12;
    else if (importantTypes.includes(s.type)) score += 8;
    else score += 4;
  }
  return { sections, detectedCount, totalChecked:sections.length, score:clamp(Math.round(score)), pageType, hasAboveFold:sections.some(s=>(s.type==='hero'||s.type==='header')&&s.detected), hasSocialProof:sections.some(s=>(s.type==='reviews'||s.type==='social-proof')&&s.detected) };
}

function detectSection(pattern: SectionPattern): Section {
  let confidence = 0;
  const details: string[] = [];
  let matchedSelector: string|undefined;
  let elements = 0;
  for (const sel of pattern.selectors) {
    try { const f = document.querySelectorAll(sel); if (f.length>0) { confidence+=40; matchedSelector=sel; elements=f.length; details.push(`Selector: ${sel} (${f.length})`); break; } } catch {}
  }
  let checked=0;
  for (const el of document.querySelectorAll('*')) {
    if (checked++>2000) break;
    const attrs=[el.className,el.id,el.getAttribute('data-section-type')??'',el.getAttribute('aria-label')??''].join(' ').toLowerCase();
    for (const kw of pattern.keywords) { if (attrs.includes(kw.toLowerCase())) { details.push(`Attr: "${kw}"`); confidence+=25; break; } }
  }
  for (const el of document.querySelectorAll('h1,h2,h3,h4,label,.section-title')) {
    const t=el.textContent?.toLowerCase()??'';
    for (const kw of pattern.keywords) { if (t.includes(kw.toLowerCase())) { confidence+=15; details.push(`Text: "${kw}"`); break; } }
  }
  if (pattern.domSignals) {
    for (const sig of pattern.domSignals) {
      if (sig==='star-rating-elements') { const s=document.querySelectorAll('[class*="star-rating"],[class*="rating-star"],.yotpo-star,.judge-me-star'); if(s.length>0){confidence+=25;details.push(`Stars: ${s.length}`);} }
      if (sig==='details-summary') { const a=document.querySelectorAll('details,.accordion-item,[class*="accordion"]'); if(a.length>0){confidence+=30;details.push(`Accordion: ${a.length}`);} }
      if (sig==='accordion-toggle') { const t=document.querySelectorAll('[aria-expanded],.collapse-trigger'); if(t.length>0){confidence+=15;details.push('Toggle controls');} }
      if (sig==='h1-with-cta') { const h=document.querySelector('h1'); if(h&&h.parentElement?.querySelector('a[href],button')){confidence+=15;details.push('H1+CTA');} }
    }
  }
  confidence = clamp(confidence);
  let position: Section['position'];
  if (matchedSelector) { try { const el=document.querySelector(matchedSelector); if(el){const r=el.getBoundingClientRect(); const t=(r.top+window.scrollY)/document.body.scrollHeight; position=t<0.1?'top':t<0.3?'upper-middle':t<0.6?'middle':t<0.85?'lower-middle':'bottom';} } catch {} }
  return { type:pattern.type, label:pattern.label, detected:confidence>=25, confidence, details:details.slice(0,4), elements:elements||undefined, position, selector:matchedSelector };
}
