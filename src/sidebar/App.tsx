import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Blueprint, ConversionElement, Grade, StoreAnalysis, TrustElement } from '@/types';
import { saveAnalysis, getAllAnalyses, deleteAnalysis } from '@/db/database';
import { formatTimeAgo, gradeColor, scoreColor, truncate, platformColor } from '@/utils/helpers';

// ─── Types ─────────────────────────────────────────────
type AppState = 'idle' | 'analyzing' | 'result' | 'error';
type ResultTab = 'summary' | 'structure' | 'funnel' | 'ux' | 'conversion';
type MainView = 'analyze' | 'history';

// ─── Helpers ───────────────────────────────────────────
function GradeBadge({ grade, size = 'md' }: { grade: Grade; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-xs w-6 h-6', md: 'text-sm w-8 h-8', lg: 'text-xl w-12 h-12 font-bold' };
  return (
    <div
      className={`${sizes[size]} rounded-lg flex items-center justify-center font-semibold shrink-0`}
      style={{ background: `${gradeColor(grade)}22`, color: gradeColor(grade), border: `1px solid ${gradeColor(grade)}44` }}
    >
      {grade}
    </div>
  );
}

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={size / 2} y={size / 2 + 5}
        textAnchor="middle" fill={color}
        fontSize={size > 60 ? 16 : 12} fontWeight="700"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {score}
      </text>
    </svg>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: `${color}22`, color, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 px-4">{title}</div>
      {children}
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-4 mb-2 rounded-xl bg-card border border-border p-3 ${className}`}>{children}</div>;
}

function ListItem({ icon, text, color = '#a1a1aa' }: { icon: string; text: string; color?: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <span style={{ color }} className="text-xs mt-0.5 shrink-0">{icon}</span>
      <span className="text-xs text-text-secondary leading-relaxed">{text}</span>
    </div>
  );
}

// ─── Views ────────────────────────────────────────────
function IdleView({ onAnalyze, tabUrl }: { onAnalyze: () => void; tabUrl: string }) {
  const domain = tabUrl ? (() => { try { return new URL(tabUrl).hostname.replace(/^www\./, ''); } catch { return tabUrl; } })() : '';
  const isValidUrl = tabUrl.startsWith('http');
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center" style={{ minHeight: 320 }}>
      <div className="w-16 h-16 rounded-2xl mb-5 flex items-center justify-center text-3xl"
        style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
        🔍
      </div>
      <h2 className="text-base font-semibold text-text-primary mb-1">Store Blueprint OS</h2>
      {domain && (
        <p className="text-xs text-text-muted mb-1 font-mono bg-card px-2 py-1 rounded-lg border border-border truncate max-w-full">
          {domain}
        </p>
      )}
      <p className="text-xs text-text-secondary mb-6 leading-relaxed">
        {isValidUrl
          ? 'Analyze this store to get a complete CRO + UX + Funnel blueprint'
          : 'Navigate to an online store to begin analysis'}
      </p>
      <button
        onClick={onAnalyze}
        disabled={!isValidUrl}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: isValidUrl ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#2a2a35' }}
      >
        ⚡ Analyze Store
      </button>
    </div>
  );
}

function LoadingView() {
  const [step, setStep] = useState(0);
  const steps = ['Detecting platform…', 'Scanning structure…', 'Mapping funnel…', 'Analyzing UX…', 'Computing blueprint…'];
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center" style={{ minHeight: 320 }}>
      <div className="w-12 h-12 rounded-2xl mb-5 flex items-center justify-center text-2xl animate-pulse"
        style={{ background: 'rgba(99,102,241,0.15)' }}>
        ⚡
      </div>
      <p className="text-sm font-medium text-text-primary mb-2">Analyzing…</p>
      <p className="text-xs text-text-muted mb-6">{steps[step]}</p>
      <div className="w-full bg-card rounded-full h-1 overflow-hidden border border-border">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${((step + 1) / steps.length) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
      </div>
    </div>
  );
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center" style={{ minHeight: 320 }}>
      <div className="text-3xl mb-4">⚠️</div>
      <p className="text-sm font-medium text-danger mb-2">Analysis failed</p>
      <p className="text-xs text-text-secondary mb-6 leading-relaxed max-w-[240px]">{error}</p>
      <button onClick={onRetry}
        className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white"
        style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
        Try Again
      </button>
    </div>
  );
}

function SummaryTab({ blueprint, analysis }: { blueprint: Blueprint; analysis: StoreAnalysis }) {
  return (
    <div className="animate-fade-in pb-4">
      <Card>
        <div className="flex items-center gap-3">
          <ScoreRing score={blueprint.overallScore} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GradeBadge grade={blueprint.grade} />
              <span className="text-xs text-text-secondary">{blueprint.grade === 'A' ? 'Excellent' : blueprint.grade === 'B' ? 'Good' : blueprint.grade === 'C' ? 'Average' : blueprint.grade === 'D' ? 'Needs Work' : 'Critical'}</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              <Pill label={analysis.platformLabel} color={platformColor(analysis.platform)} />
              <Pill label={`${analysis.structure.pageType}`} color="#6366f1" />
            </div>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-3 leading-relaxed border-t border-border pt-3">
          {blueprint.executiveSummary}
        </p>
      </Card>
      <Section title="Score Breakdown">
        <Card>
          {(Object.entries(blueprint.scoreBreakdown) as [string, number][]).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 mb-2 last:mb-0">
              <span className="text-xs text-text-secondary capitalize w-20 shrink-0">{key}</span>
              <div className="flex-1 bg-surface rounded-full h-1.5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${val}%`, background: scoreColor(val), transition: 'width 0.4s ease' }} />
              </div>
              <span className="text-xs font-mono w-7 text-right" style={{ color: scoreColor(val) }}>{val}</span>
            </div>
          ))}
        </Card>
      </Section>
      {blueprint.quickWins.length > 0 && (
        <Section title="⚡ Quick Wins">
          <Card>{blueprint.quickWins.map((qw, i) => <ListItem key={i} icon="→" text={qw} color="#6366f1" />)}</Card>
        </Section>
      )}
      {blueprint.strengths.length > 0 && (
        <Section title="✅ Strengths">
          <Card>{blueprint.strengths.map((s, i) => <ListItem key={i} icon="✓" text={s} color="#10b981" />)}</Card>
        </Section>
      )}
      {blueprint.weaknesses.length > 0 && (
        <Section title="⚠️ Weaknesses">
          <Card>{blueprint.weaknesses.map((w, i) => <ListItem key={i} icon="!" text={w} color="#f59e0b" />)}</Card>
        </Section>
      )}
      {blueprint.recommendations.length > 0 && (
        <Section title="📋 Recommendations">
          <Card>{blueprint.recommendations.map((r, i) => <ListItem key={i} icon={`${i + 1}.`} text={r} color="#a1a1aa" />)}</Card>
        </Section>
      )}
    </div>
  );
}

function StructureTab({ analysis }: { analysis: StoreAnalysis }) {
  const { structure } = analysis;
  return (
    <div className="animate-fade-in pb-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">Sections detected</span>
          <span className="text-sm font-semibold text-text-primary">{structure.detectedCount} / {structure.totalChecked}</span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">Page type</span>
          <Pill label={structure.pageType} color="#6366f1" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Structure score</span>
          <span className="text-xs font-semibold" style={{ color: scoreColor(structure.score) }}>{structure.score}/100</span>
        </div>
      </Card>
      <Section title="Sections">
        {structure.sections.map(sec => (
          <div key={sec.type} className="mx-4 mb-1.5 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: sec.detected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${sec.detected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
            <span className="text-xs">{sec.detected ? '✅' : '⬜'}</span>
            <span className={`text-xs flex-1 ${sec.detected ? 'text-text-primary' : 'text-text-muted'}`}>{sec.label}</span>
            {sec.detected && <span className="text-xs font-mono" style={{ color: scoreColor(sec.confidence) }}>{sec.confidence}%</span>}
          </div>
        ))}
      </Section>
    </div>
  );
}

function FunnelTab({ analysis }: { analysis: StoreAnalysis }) {
  const { funnel } = analysis;
  const icons: Record<string, string> = { landing: '🏠', product: '📦', cart: '🛒', checkout: '💳', confirmation: '✅' };
  return (
    <div className="animate-fade-in pb-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">Funnel completeness</span>
          <span className="text-sm font-semibold" style={{ color: scoreColor(funnel.completeness) }}>{funnel.completeness}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Links detected</span>
          <span className="text-xs font-semibold text-text-primary">{funnel.detectedLinks}</span>
        </div>
      </Card>
      <Section title="Funnel Stages">
        {funnel.stages.map((stage, i) => (
          <div key={stage.id} className="mx-4 mb-1.5">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: stage.detected ? (stage.isCurrentPage ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.06)') : 'rgba(255,255,255,0.02)', border: `1px solid ${stage.detected ? (stage.isCurrentPage ? 'rgba(99,102,241,0.3)' : 'rgba(16,185,129,0.2)') : 'rgba(255,255,255,0.05)'}` }}>
              <span className="text-sm">{icons[stage.id] ?? '⬜'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium ${stage.detected ? 'text-text-primary' : 'text-text-muted'}`}>{stage.label}</span>
                  {stage.isCurrentPage && <Pill label="current" color="#6366f1" />}
                </div>
                {stage.friction.length > 0 && <p className="text-xs text-warning mt-0.5">{stage.friction[0]}</p>}
              </div>
              {i < funnel.stages.length - 1 && stage.detected && <span className="text-xs text-text-muted">→</span>}
            </div>
          </div>
        ))}
      </Section>
      {funnel.frictionPoints.length > 0 && (
        <Section title="⚠️ Friction Points">
          <Card>{funnel.frictionPoints.map((fp, i) => <ListItem key={i} icon="!" text={fp} color="#f59e0b" />)}</Card>
        </Section>
      )}
    </div>
  );
}

function UXTab({ analysis }: { analysis: StoreAnalysis }) {
  const { ux } = analysis;
  return (
    <div className="animate-fade-in pb-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-secondary">UX score</span>
          <span className="text-sm font-semibold" style={{ color: scoreColor(ux.overallScore) }}>{ux.overallScore}/100</span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-secondary">Mobile ready</span>
          <span className={`text-xs ${ux.mobileReady ? 'text-success' : 'text-danger'}`}>{ux.mobileReady ? '✓ Yes' : '✗ No'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-secondary">Trust score</span>
          <span className="text-xs font-semibold" style={{ color: scoreColor(ux.trustScore) }}>{ux.trustScore}%</span>
        </div>
      </Card>
      <Section title="CTAs">
        <Card>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-text-secondary">Buttons found</span><span className="text-xs font-semibold text-text-primary">{ux.cta.count}</span></div>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-text-secondary">Primary CTA</span><span className={`text-xs ${ux.cta.hasPrimary ? 'text-success' : 'text-danger'}`}>{ux.cta.hasPrimary ? '✓' : '✗'}</span></div>
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-text-secondary">Above fold</span><span className={`text-xs ${ux.cta.hasAboveFold ? 'text-success' : 'text-danger'}`}>{ux.cta.hasAboveFold ? '✓' : '✗'}</span></div>
          {ux.cta.issues.map((issue, i) => <ListItem key={i} icon="!" text={issue} color="#f59e0b" />)}
        </Card>
      </Section>
      <Section title="Trust Elements">
        <Card>
          {ux.trustElements.map(el => (
            <div key={el.type} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <span className="text-xs">{el.detected ? '✅' : '⬜'}</span>
              <span className={`text-xs capitalize flex-1 ${el.detected ? 'text-text-primary' : 'text-text-muted'}`}>{el.type.replace(/-/g, ' ')}</span>
              {el.detected && el.count > 0 && <span className="text-xs text-text-muted">×{el.count}</span>}
            </div>
          ))}
        </Card>
      </Section>
      <Section title="Visual Hierarchy">
        <Card>
          <div className="flex items-center justify-between mb-1"><span className="text-xs text-text-secondary">Score</span><span className="text-xs" style={{ color: scoreColor(ux.visualHierarchy.score) }}>{ux.visualHierarchy.score}/100</span></div>
          <div className="flex items-center justify-between mb-1"><span className="text-xs text-text-secondary">Headings</span><span className="text-xs text-text-primary">{ux.visualHierarchy.headingCount} (depth {ux.visualHierarchy.headingDepth})</span></div>
          {ux.visualHierarchy.issues.map((iss, i) => <ListItem key={i} icon="!" text={iss} color="#f59e0b" />)}
          {ux.visualHierarchy.positives.map((pos, i) => <ListItem key={i} icon="✓" text={pos} color="#10b981" />)}
        </Card>
      </Section>
    </div>
  );
}

const CLABELS: Record<string, string> = { popup:'Email Popup', bundle:'Product Bundle', upsell:'Upsell', 'cross-sell':'Cross-sell', coupon:'Coupon / Promo', 'countdown-timer':'Countdown Timer', 'stock-urgency':'Stock Urgency', 'social-proof-live':'Live Social Proof', 'sticky-atc':'Sticky Add-to-Cart', 'exit-intent':'Exit Intent' };
const ICOLOR: Record<string, string> = { high:'#10b981', medium:'#f59e0b', low:'#6366f1' };

function ConversionTab({ analysis }: { analysis: StoreAnalysis }) {
  const { conversion } = analysis;
  return (
    <div className="animate-fade-in pb-4">
      <Card>
        <div className="flex items-center justify-between mb-2"><span className="text-xs text-text-secondary">CRO score</span><span className="text-sm font-semibold" style={{ color: scoreColor(conversion.score) }}>{conversion.score}/100</span></div>
        <div className="flex items-center justify-between"><span className="text-xs text-text-secondary">Elements detected</span><span className="text-xs font-semibold text-text-primary">{conversion.totalDetected} / {conversion.elements.length}</span></div>
      </Card>
      <Section title="Conversion Elements">
        {conversion.elements.map(el => (
          <div key={el.type} className="mx-4 mb-1.5 flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: el.detected ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${el.detected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}` }}>
            <span className="text-xs">{el.detected ? '✅' : '⬜'}</span>
            <span className={`text-xs flex-1 ${el.detected ? 'text-text-primary' : 'text-text-muted'}`}>{CLABELS[el.type] ?? el.type}</span>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: `${ICOLOR[el.impact]}22`, color: ICOLOR[el.impact] }}>{el.impact}</span>
          </div>
        ))}
      </Section>
      {conversion.recommendations.length > 0 && (
        <Section title="Recommendations">
          <Card>{conversion.recommendations.map((r, i) => <ListItem key={i} icon={`${i + 1}.`} text={r} color="#a1a1aa" />)}</Card>
        </Section>
      )}
    </div>
  );
}

function ResultView({ analysis, activeTab, onTabChange, onReanalyze }: { analysis: StoreAnalysis; activeTab: ResultTab; onTabChange: (t: ResultTab) => void; onReanalyze: () => void }) {
  const tabs = [{ id: 'summary' as ResultTab, label: 'Summary' }, { id: 'structure' as ResultTab, label: 'Structure' }, { id: 'funnel' as ResultTab, label: 'Funnel' }, { id: 'ux' as ResultTab, label: 'UX' }, { id: 'conversion' as ResultTab, label: 'CRO' }];
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface">
        <img src={analysis.favicon || `https://www.google.com/s2/favicons?domain=${analysis.domain}`} className="w-4 h-4 rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <span className="text-xs text-text-secondary flex-1 truncate">{analysis.domain}</span>
        <span className="text-xs text-text-muted">{formatTimeAgo(analysis.timestamp)}</span>
        <button onClick={onReanalyze} className="text-xs text-accent hover:text-white transition-colors ml-1">↺</button>
      </div>
      <div className="flex border-b border-border bg-surface overflow-x-auto shrink-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => onTabChange(t.id)}
            className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === t.id ? 'text-accent border-accent' : 'text-text-muted border-transparent hover:text-text-secondary'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto pt-3">
        {activeTab === 'summary' && <SummaryTab blueprint={analysis.blueprint} analysis={analysis} />}
        {activeTab === 'structure' && <StructureTab analysis={analysis} />}
        {activeTab === 'funnel' && <FunnelTab analysis={analysis} />}
        {activeTab === 'ux' && <UXTab analysis={analysis} />}
        {activeTab === 'conversion' && <ConversionTab analysis={analysis} />}
      </div>
    </div>
  );
}

function HistoryView({ history, onSelect }: { history: StoreAnalysis[]; onSelect: (a: StoreAnalysis) => void }) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const handleDelete = async (e: React.MouseEvent, id: string) => { e.stopPropagation(); setDeleting(id); try { await deleteAnalysis(id); } catch {} setDeleting(null); };
  if (history.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center" style={{ minHeight: 280 }}>
      <div className="text-3xl mb-3">📂</div>
      <p className="text-sm font-medium text-text-secondary mb-1">No analyses yet</p>
      <p className="text-xs text-text-muted">Analyze a store to build your library</p>
    </div>
  );
  return (
    <div className="flex-1 overflow-y-auto pb-4 pt-3 animate-fade-in">
      <div className="px-4 mb-3"><span className="text-xs text-text-muted">{history.length} store{history.length !== 1 ? 's' : ''} analyzed</span></div>
      {history.map(item => (
        <div key={item.id} onClick={() => onSelect(item)}
          className="mx-4 mb-2 rounded-xl p-3 cursor-pointer transition-all hover:border-border-active active:scale-[0.98]"
          style={{ background: '#17171f', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2">
            <img src={item.favicon || `https://www.google.com/s2/favicons?domain=${item.domain}`} className="w-4 h-4 rounded shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <span className="text-xs font-medium text-text-primary flex-1 truncate">{item.domain}</span>
            <GradeBadge grade={item.grade} size="sm" />
            <button onClick={(e) => handleDelete(e, item.id)} disabled={deleting === item.id} className="text-text-muted hover:text-danger transition-colors text-xs ml-1 w-4 text-center">×</button>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Pill label={item.platformLabel} color={platformColor(item.platform)} />
            <span className="text-xs font-mono" style={{ color: scoreColor(item.overallScore) }}>{item.overallScore}/100</span>
            <span className="text-xs text-text-muted ml-auto">{formatTimeAgo(item.timestamp)}</span>
          </div>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed line-clamp-2">{truncate(item.blueprint.executiveSummary, 100)}</p>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [analysis, setAnalysis] = useState<StoreAnalysis | null>(null);
  const [history, setHistory] = useState<StoreAnalysis[]>([]);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<ResultTab>('summary');
  const [view, setView] = useState<MainView>('analyze');
  const [tabUrl, setTabUrl] = useState('');
  const refreshHistory = useCallback(() => { getAllAnalyses().then(setHistory).catch(console.error); }, []);
  useEffect(() => { try { chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => { setTabUrl(tabs[0]?.url ?? ''); }); } catch {} }, []);
  useEffect(() => { refreshHistory(); }, [refreshHistory]);
  useEffect(() => {
    const handler = (msg: { type: string }) => {
      if (msg.type === 'TAB_CHANGED') {
        try { chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          setTabUrl(tabs[0]?.url ?? ''); setAppState('idle'); setAnalysis(null); setError('');
          chrome.runtime.sendMessage({ type: 'GET_TAB_ANALYSIS' }, (res) => { if (res && !chrome.runtime.lastError) { setAnalysis(res); setAppState('result'); } });
        }); } catch {}
      }
    };
    try { chrome.runtime.onMessage.addListener(handler); } catch {}
    try { chrome.runtime.sendMessage({ type: 'GET_TAB_ANALYSIS' }, (res) => { if (res && !chrome.runtime.lastError) { setAnalysis(res); setAppState('result'); } }); } catch {}
    return () => { try { chrome.runtime.onMessage.removeListener(handler); } catch {} };
  }, []);
  const handleAnalyze = useCallback(() => {
    setAppState('analyzing'); setError('');
    try {
      chrome.runtime.sendMessage({ type: 'ANALYZE_PAGE' }, async (response) => {
        if (chrome.runtime.lastError) { setAppState('error'); setError(chrome.runtime.lastError.message ?? 'Extension error'); return; }
        if (!response) { setAppState('error'); setError('No response from page. Try reloading the tab.'); return; }
        if (response.type === 'ANALYSIS_ERROR') { setAppState('error'); setError(response.error ?? 'Unknown error'); return; }
        if (response.type === 'ANALYSIS_RESULT' && response.data) {
          try { await saveAnalysis(response.data); } catch {}
          setAnalysis(response.data); setAppState('result'); setActiveTab('summary'); refreshHistory();
        }
      });
    } catch (e) { setAppState('error'); setError(e instanceof Error ? e.message : 'Unexpected error'); }
  }, [refreshHistory]);
  const handleSelectHistory = useCallback((a: StoreAnalysis) => { setAnalysis(a); setAppState('result'); setView('analyze'); setActiveTab('summary'); }, []);
  return (
    <div className="flex flex-col h-full bg-base text-text-primary font-sans overflow-hidden select-none">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0 bg-surface">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>B</div>
        <span className="font-semibold text-text-primary text-sm tracking-tight">Store Blueprint OS</span>
        <div className="ml-auto flex gap-1">
          {(['analyze', 'history'] as MainView[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${view === v ? 'bg-accent text-white' : 'text-text-muted hover:text-text-secondary'}`}>
              {v === 'analyze' ? '⚡ Scan' : '📚 History'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === 'history' ? (
          <HistoryView history={history} onSelect={handleSelectHistory} />
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {appState === 'idle' && <IdleView onAnalyze={handleAnalyze} tabUrl={tabUrl} />}
            {appState === 'analyzing' && <LoadingView />}
            {appState === 'error' && <ErrorView error={error} onRetry={handleAnalyze} />}
            {appState === 'result' && analysis && <ResultView analysis={analysis} activeTab={activeTab} onTabChange={setActiveTab} onReanalyze={handleAnalyze} />}
          </div>
        )}
      </div>
    </div>
  );
}
