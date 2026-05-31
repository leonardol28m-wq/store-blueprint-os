import type { Platform } from '@/types';

interface PlatformResult { platform: Platform; label: string; confidence: number; signals: string[]; }

export function detectPlatform(): PlatformResult {
  const signals: string[] = [];
  const scores: Partial<Record<Platform, number>> = {};
  const add = (p: Platform, s: number, r: string) => { scores[p] = (scores[p]??0)+s; signals.push(`[${p}] ${r}`); };

  if ('Shopify' in window) add('shopify', 50, 'window.Shopify');
  const ls = (window as any).ls;
  if (ls?.store_id || ls?.domain) add('tiendanube', 50, 'window.ls (Tiendanube)');
  if ('wc_add_to_cart_params' in window || 'woocommerce_params' in window) add('woocommerce', 50, 'WooCommerce global');

  const gen = document.querySelector<HTMLMetaElement>('meta[name="generator"]')?.content??'';
  if (/shopify/i.test(gen)) add('shopify', 30, `meta: ${gen}`);
  if (/woocommerce|wordpress/i.test(gen)) add('woocommerce', 25, `meta: ${gen}`);
  if (/prestashop/i.test(gen)) add('prestashop', 40, `meta: ${gen}`);
  if (/magento/i.test(gen)) add('magento', 40, `meta: ${gen}`);

  const srcs = Array.from(document.querySelectorAll('script[src]')).map(s=>(s as HTMLScriptElement).src);
  for (const src of srcs) {
    if (/cdn\.shopify\.com|shopify\.com\/s\/files/i.test(src)) { add('shopify',30,'Shopify CDN'); break; }
    if (/tiendanube\.com|nuvemshop\.com\.br/i.test(src)) { add('tiendanube',40,'Tiendanube CDN'); break; }
    if (/vtexassets\.com|vtex\.com/i.test(src)) { add('vtex',40,'VTEX CDN'); break; }
    if (/bigcommerce\.com/i.test(src)) { add('bigcommerce',40,'BigCommerce'); break; }
    if (/wp-content|wp-includes/i.test(src)) add('woocommerce',15,'WordPress paths');
  }

  const hrefs = Array.from(document.querySelectorAll('link[href]')).map(l=>(l as HTMLLinkElement).href);
  for (const h of hrefs) {
    if (/cdn\.shopify\.com/i.test(h)) { add('shopify',20,'Shopify CSS CDN'); break; }
    if (/tiendanube|nuvemshop/i.test(h)) { add('tiendanube',20,'Tiendanube CSS'); break; }
    if (/static\.squarespace\.com/i.test(h)) { add('squarespace',40,'Squarespace CDN'); break; }
    if (/wix\.com|wixstatic\.com/i.test(h)) { add('wix',40,'Wix CDN'); break; }
  }

  const bc = document.body.className+' '+document.documentElement.className;
  if (/shopify-section|shopify/i.test(bc)) add('shopify',20,'Shopify body class');
  if (/woocommerce|wc-/i.test(bc)) add('woocommerce',20,'WooCommerce body class');
  if (/prestashop/i.test(bc)) add('prestashop',25,'PrestaShop body class');
  if (/tiendanube/i.test(bc)) add('tiendanube',25,'Tiendanube body class');

  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href??'';
  if (/myshopify\.com/i.test(canonical)) add('shopify',20,'myshopify.com canonical');

  const entries = (Object.entries(scores) as [Platform,number][]).sort((a,b)=>b[1]-a[1]);
  if (!entries.length) return { platform:'unknown', label:'Unknown', confidence:0, signals };

  const [top, topScore] = entries[0];
  if (topScore < 25) return { platform:'custom', label:'Custom', confidence:30, signals };

  const LABELS: Record<Platform,string> = { shopify:'Shopify',tiendanube:'Tiendanube',woocommerce:'WooCommerce',magento:'Magento',prestashop:'PrestaShop',vtex:'VTEX',bigcommerce:'BigCommerce',squarespace:'Squarespace',wix:'Wix',custom:'Custom',unknown:'Unknown' };
  return { platform:top, label:LABELS[top], confidence:Math.min(95,Math.round(topScore*1.2)), signals };
}
