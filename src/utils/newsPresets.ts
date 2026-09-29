import { NewsToolConfig } from '../types/editor';

export interface NewsPresetDef {
  id: string;
  name: string;
  type: NewsToolConfig['type'];
  defaultConfig: NewsToolConfig;
}

export const NEWS_PRESETS: NewsPresetDef[] = [
  {
    id: 'news_breaking',
    name: 'Breaking News Banner',
    type: 'breaking_news',
    defaultConfig: {
      type: 'breaking_news',
      headline: 'BREAKING NEWS: MAJOR ANNOUNCEMENT',
      subtext: 'Live updates from New Delhi · Special coverage on EditPro',
      bannerColor: '#dc2626',
      accentColor: '#facc15',
    },
  },
  {
    id: 'news_lower_third',
    name: 'Executive Lower Third',
    type: 'lower_third',
    defaultConfig: {
      type: 'lower_third',
      headline: 'Rohan Sharma',
      subtext: 'Senior Technology Correspondent',
      location: 'Mumbai, India',
      bannerColor: '#0f172a',
      accentColor: '#3b82f6',
    },
  },
  {
    id: 'news_headline_bar',
    name: 'Top Headline Bar',
    type: 'headline_bar',
    defaultConfig: {
      type: 'headline_bar',
      headline: 'INDIA CREATOR ECONOMY SURGES IN 2026',
      subtext: 'Mobile video editing adoption hits all-time record',
      bannerColor: '#7c2d12',
      accentColor: '#fdba74',
    },
  },
  {
    id: 'news_ticker',
    name: 'Continuous News Ticker',
    type: 'ticker',
    defaultConfig: {
      type: 'ticker',
      headline: 'EDITPRO UPDATES: Real-time 4K mobile video rendering • New effects & filters added • 100% offline workflow without VPN •',
      bannerColor: '#1e1b4b',
      accentColor: '#a855f7',
      scrollSpeed: 1.5,
    },
  },
  {
    id: 'news_reporter',
    name: 'Live Reporter Tag',
    type: 'reporter_tag',
    defaultConfig: {
      type: 'reporter_tag',
      headline: 'LIVE REPORT',
      reporterName: 'Pooja Verma',
      location: 'Bengaluru Ground Zero',
      timeString: 'LIVE 18:30 IST',
      bannerColor: '#15803d',
      accentColor: '#86efac',
    },
  },
];
