// Layout exports
export * from './types';
export * from './PremiumDecorations';

// Stats layouts
export { StatsLayoutA, StatsLayoutB, StatsLayoutC } from './StatsLayouts';

// Bullets layouts
export { BulletsLayoutA, BulletsLayoutB, BulletsLayoutC } from './BulletsLayouts';

// Team layouts
export { TeamLayoutA, TeamLayoutB, TeamLayoutC } from './TeamLayouts';

// Comparison layouts
export { ComparisonLayoutA, ComparisonLayoutB, ComparisonLayoutC } from './ComparisonLayouts';

// Timeline layouts
export { TimelineLayoutA, TimelineLayoutB, TimelineLayoutC } from './TimelineLayouts';

// Financials layouts
export { FinancialsLayoutA, FinancialsLayoutB, FinancialsLayoutC } from './FinancialsLayouts';

// Overview layouts
export { OverviewLayoutA, OverviewLayoutB, OverviewLayoutC } from './OverviewLayouts';

// Special layouts
export { 
  HeroStatLayout, 
  QuoteLayout, 
  ProcessLayout, 
  DisclaimerLayout,
  ClosingLayout,
  MarketLayout,
} from './SpecialLayouts';

// Layout variant selector helper
import { LayoutVariant, ColorScheme, SlideContentData } from './types';
import * as Stats from './StatsLayouts';
import * as Bullets from './BulletsLayouts';
import * as Team from './TeamLayouts';
import * as Comparison from './ComparisonLayouts';
import * as Timeline from './TimelineLayouts';
import * as Financials from './FinancialsLayouts';
import * as Overview from './OverviewLayouts';
import * as Special from './SpecialLayouts';

type LayoutType = 
  | 'stats' | 'bullets' | 'team' | 'comparison' 
  | 'timeline' | 'financials' | 'overview' | 'market'
  | 'closing' | 'disclaimer' | 'hero' | 'title' | 'custom';

export function getLayoutComponent(
  layout: LayoutType,
  variant: LayoutVariant = 'A'
): React.ComponentType<{ content: SlideContentData; scheme: ColorScheme }> | null {
  const layouts: Record<LayoutType, Record<LayoutVariant, React.ComponentType<any> | null>> = {
    stats: { A: Stats.StatsLayoutA, B: Stats.StatsLayoutB, C: Stats.StatsLayoutC },
    bullets: { A: Bullets.BulletsLayoutA, B: Bullets.BulletsLayoutB, C: Bullets.BulletsLayoutC },
    team: { A: Team.TeamLayoutA, B: Team.TeamLayoutB, C: Team.TeamLayoutC },
    comparison: { A: Comparison.ComparisonLayoutA, B: Comparison.ComparisonLayoutB, C: Comparison.ComparisonLayoutC },
    timeline: { A: Timeline.TimelineLayoutA, B: Timeline.TimelineLayoutB, C: Timeline.TimelineLayoutC },
    financials: { A: Financials.FinancialsLayoutA, B: Financials.FinancialsLayoutB, C: Financials.FinancialsLayoutC },
    overview: { A: Overview.OverviewLayoutA, B: Overview.OverviewLayoutB, C: Overview.OverviewLayoutC },
    market: { A: Special.MarketLayout, B: Special.MarketLayout, C: Special.MarketLayout },
    closing: { A: Special.ClosingLayout, B: Special.ClosingLayout, C: Special.ClosingLayout },
    disclaimer: { A: Special.DisclaimerLayout, B: Special.DisclaimerLayout, C: Special.DisclaimerLayout },
    hero: { A: Special.HeroStatLayout, B: Special.HeroStatLayout, C: Special.HeroStatLayout },
    title: { A: null, B: null, C: null },
    custom: { A: null, B: null, C: null },
  };

  return layouts[layout]?.[variant] || null;
}
