import type { FunnelMap, FunnelStage, Platform } from '@/types';
import { clamp } from '@/utils/helpers';

function getCurrentStage(platform: Platform): FunnelStage['id'] {
  const path = window.location.pathname.toLowerCase();
  const bodyClass = document.body.className.toLowerCase();
  if (/\/checkout/i.test(path)||bodyClass.includes('checkout')) return 'checkout';
  if (/\/cart|\/carrito/i.test(path)||bodyClass.includes('cart')) return 'cart';
  if (/\/products?\/[^/]+/i.test(path)||/\/producto\/[^/]+/i.test(path)) return 'product';
  if (/\/order[-_]?confirm|\/thank[-_]?you|\/gracias/i.test(path)) return 'confirmation';
  if (platform==='shopify'&&/\/products\//i.test(path)) return 'product';
  if (platform==='tiendanube'&&/\/productos?\//i.test(path)) return 'product';
  if (platform==='tiendanube'&&/\/pedido|\/checkout/i.test(path)) return 'checkout';
  return 'landing';
}

function linksTo(re: RegExp): number {
  let n=0;
  for (const a of document.querySelectorAll<HTMLAnchorElement>('a[href]')) if(re.test(a.href||a.getAttribute('href')||'')) n++;
  return n;
}

function hasEl(sels: string[]): boolean { return sels.some(s=>{ try{return document.querySelector(s)!==null;}catch{return false;} }); }

export function analyzeFunnel(platform: Platform): FunnelMap {
  const currentStage = getCurrentStage(platform);
  const frictionPoints: string[] = [];
  const productPatterns: Record<Platform,RegExp> = { shopify:/\/products\//i, tiendanube:/\/productos?\//i, woocommerce:/\/product\//i, magento:/\.html|\/catalog\/product/i, prestashop:/\/[a-z-]+-[0-9]+\.html/i, vtex:/\/p$/i, bigcommerce:/\/[a-z-]+\/$/i, squarespace:/\/shop\//i, wix:/\/product-page\//i, custom:/\/product|\/item|\/p\//i, unknown:/\/product|\/item/i };
  const productLinks = linksTo(productPatterns[platform]??productPatterns.unknown);
  const cartLinks = linksTo(/\/cart|\/carrito|add-to-cart/i);
  const checkoutLinks = linksTo(/\/checkout|\/pago/i);
  const hasAtcButton = hasEl(['button[name="add"]','.add-to-cart','[data-action="add-to-cart"]','.btn-cart','#add-to-cart-btn','[class*="add-to-cart"]','button[class*="atc"]','form[action*="/cart/add"]']);
  const hasCartWidget = hasEl(['.cart-icon','.cart-count','.mini-cart','.cart-bubble','[data-cart-count]','[aria-label*="cart"]','[aria-label*="carrito"]']);
  const hasCheckoutBtn = hasEl(['[name="checkout"]','.checkout-btn','[class*="checkout-button"]','a[href*="/checkout"]','button[class*="checkout"]']);
  const hasPayment = hasEl(['.payment-icons','.payment-methods','.accepted-cards','[class*="payment"]','.visa','.mastercard','[class*="secure"]']);
  if (!hasAtcButton&&currentStage!=='cart'&&currentStage!=='checkout') frictionPoints.push('No Add-to-Cart button found');
  if (!hasCartWidget) frictionPoints.push('No cart widget in header');
  if (checkoutLinks===0&&currentStage!=='checkout') frictionPoints.push('No direct checkout links detected');
  if (!hasPayment) frictionPoints.push('No payment icons visible');
  const stages: FunnelStage[] = [
    { id:'landing', label:'Landing / Home', detected:true, isCurrentPage:currentStage==='landing', url:currentStage==='landing'?window.location.href:undefined, linkCount:productLinks, friction:[] },
    { id:'product', label:'Product Page', detected:productLinks>0||currentStage==='product', isCurrentPage:currentStage==='product', url:currentStage==='product'?window.location.href:undefined, linkCount:productLinks, friction:!hasAtcButton&&currentStage==='product'?['No ATC button']:[] },
    { id:'cart', label:'Cart', detected:cartLinks>0||currentStage==='cart'||hasCartWidget, isCurrentPage:currentStage==='cart', url:currentStage==='cart'?window.location.href:undefined, linkCount:cartLinks, friction:[] },
    { id:'checkout', label:'Checkout', detected:checkoutLinks>0||currentStage==='checkout'||hasCheckoutBtn, isCurrentPage:currentStage==='checkout', url:currentStage==='checkout'?window.location.href:undefined, linkCount:checkoutLinks, friction:!hasPayment?['Payment badges not visible']:[] },
    { id:'confirmation', label:'Order Confirmation', detected:currentStage==='confirmation', isCurrentPage:currentStage==='confirmation', url:currentStage==='confirmation'?window.location.href:undefined, linkCount:0, friction:[] },
  ];
  return { stages, currentStage, completeness:clamp(Math.round(stages.filter(s=>s.detected).length/stages.length*100)), detectedLinks:productLinks+cartLinks+checkoutLinks, frictionPoints, platform };
}
