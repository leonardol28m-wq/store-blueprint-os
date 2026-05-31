// ─── Store Blueprint OS — Core Type Definitions ────────────────────────────
export type Platform = 'shopify'|'tiendanube'|'woocommerce'|'magento'|'prestashop'|'vtex'|'bigcommerce'|'squarespace'|'wix'|'custom'|'unknown';
export type PageType = 'home'|'product'|'collection'|'cart'|'checkout'|'blog'|'about'|'contact'|'unknown';
export type SectionType = 'header'|'hero'|'benefits'|'featured-products'|'reviews'|'faq'|'footer'|'newsletter'|'about'|'gallery'|'banner'|'blog-posts'|'social-proof'|'guarantee'|'contact';
export type ConversionElementType = 'popup'|'bundle'|'upsell'|'cross-sell'|'coupon'|'countdown-timer'|'stock-urgency'|'social-proof-live'|'sticky-atc'|'exit-intent';
export type TrustElementType = 'ssl'|'payment-icons'|'guarantee'|'star-rating'|'review-count'|'social-followers'|'trust-badge'|'press-mentions'|'certifications';
export type Grade = 'A'|'B'|'C'|'D'|'F';

export interface Section { type: SectionType; detected: boolean; confidence: number; label: string; details: string[]; elements?: number; position?: 'top'|'upper-middle'|'middle'|'lower-middle'|'bottom'; selector?: string; }
export interface StructureMap { sections: Section[]; detectedCount: number; totalChecked: number; score: number; pageType: PageType; hasAboveFold: boolean; hasSocialProof: boolean; }
export interface FunnelStage { id: 'landing'|'product'|'cart'|'checkout'|'confirmation'; label: string; detected: boolean; isCurrentPage: boolean; url?: string; linkCount: number; friction: string[]; }
export interface FunnelMap { stages: FunnelStage[]; currentStage: FunnelStage['id']; completeness: number; detectedLinks: number; frictionPoints: string[]; platform: Platform; }
export interface CTAButton { text: string; type: 'primary'|'secondary'|'ghost'; position: 'above-fold'|'below-fold'|'sticky'; hasContrast: boolean; }
export interface TrustElement { type: TrustElementType; detected: boolean; count?: number; text?: string; }
export interface VisualHierarchy { score: number; hasH1: boolean; headingDepth: number; headingCount: number; issues: string[]; positives: string[]; }
export interface SpacingAnalysis { score: number; density: 'sparse'|'balanced'|'dense'; sectionCount: number; issues: string[]; }
export interface UXAnalysis { visualHierarchy: VisualHierarchy; cta: { score: number; count: number; buttons: CTAButton[]; hasPrimary: boolean; hasAboveFold: boolean; issues: string[]; }; spacing: SpacingAnalysis; trustElements: TrustElement[]; trustScore: number; mobileReady: boolean; overallScore: number; }
export interface ConversionElement { type: ConversionElementType; detected: boolean; count: number; details: string[]; impact: 'high'|'medium'|'low'; }
export interface ConversionAnalysis { elements: ConversionElement[]; score: number; totalDetected: number; recommendations: string[]; }
export interface Blueprint { executiveSummary: string; strengths: string[]; weaknesses: string[]; quickWins: string[]; recommendations: string[]; overallScore: number; grade: Grade; scoreBreakdown: { structure: number; funnel: number; ux: number; conversion: number; }; }
export interface StoreAnalysis { id: string; url: string; domain: string; title: string; timestamp: number; platform: Platform; platformLabel: string; favicon?: string; structure: StructureMap; funnel: FunnelMap; ux: UXAnalysis; conversion: ConversionAnalysis; blueprint: Blueprint; overallScore: number; grade: Grade; }
export type MessageType = 'ANALYZE_PAGE'|'ANALYSIS_RESULT'|'ANALYSIS_ERROR'|'ANALYSIS_PROGRESS'|'GET_TAB_ANALYSIS'|'TAB_CHANGED';
export interface ExtensionMessage { type: MessageType; tabId?: number; data?: StoreAnalysis; error?: string; progress?: { step: string; percent: number }; }
export interface LibraryFilters { search?: string; platform?: Platform; minScore?: number; sortBy?: 'timestamp'|'score'|'domain'; sortDir?: 'asc'|'desc'; }
