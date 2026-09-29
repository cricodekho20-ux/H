export interface StickerDef {
  id: string;
  name: string;
  category: 'Social' | 'News' | 'Reaction' | 'Gaming' | 'Arrows' | 'Shapes' | 'Emoji';
  svg: string;
}

export const STICKER_CATALOG: StickerDef[] = [
  // Social
  {
    id: 'stk_sub',
    name: 'Subscribe Button',
    category: 'Social',
    svg: `<svg viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="50" rx="12" fill="#EF4444"/>
      <path d="M28 17L42 25L28 33V17Z" fill="white"/>
      <text x="52" y="32" fill="white" font-family="sans-serif" font-weight="bold" font-size="18">SUBSCRIBE</text>
    </svg>`,
  },
  {
    id: 'stk_like',
    name: 'Thumbs Up',
    category: 'Social',
    svg: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#3B82F6"/>
      <path d="M28 48V34M36 34L40 20C42 20 44 22 44 26V32H54C56.2 32 58 33.8 58 36L55 52C54.5 54 53 55 51 55H36C34 55 32 53.5 32 52L28 48Z" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  {
    id: 'stk_bell',
    name: 'Notification Bell',
    category: 'Social',
    svg: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#F59E0B"/>
      <path d="M40 22C34.5 22 30 26.5 30 32V42L25 48H55L50 42V32C50 26.5 45.5 22 40 22Z" fill="white"/>
      <path d="M36 52C36 54.2 37.8 56 40 56C42.2 56 44 54.2 44 52" stroke="white" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  },
  // News
  {
    id: 'stk_live',
    name: 'LIVE Badge',
    category: 'News',
    svg: `<svg viewBox="0 0 110 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="110" height="42" rx="8" fill="#DC2626"/>
      <circle cx="24" cy="21" r="7" fill="white"/>
      <circle cx="24" cy="21" r="12" stroke="white" stroke-width="2" opacity="0.6"/>
      <text x="44" y="27" fill="white" font-family="sans-serif" font-weight="900" font-size="18">LIVE</text>
    </svg>`,
  },
  {
    id: 'stk_breaking',
    name: 'BREAKING Tag',
    category: 'News',
    svg: `<svg viewBox="0 0 150 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="150" height="42" rx="8" fill="#B91C1C"/>
      <text x="14" y="28" fill="#FEF08A" font-family="sans-serif" font-weight="900" font-size="18">BREAKING</text>
    </svg>`,
  },
  // Reaction
  {
    id: 'stk_fire',
    name: 'Fire Flame',
    category: 'Reaction',
    svg: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="38" fill="#EA580C"/>
      <path d="M40 18C44 26 54 34 54 46C54 54 48 60 40 60C32 60 26 54 26 46C26 36 34 30 36 24C38 30 40 34 44 36C44 32 42 26 40 18Z" fill="#FDE047"/>
    </svg>`,
  },
  {
    id: 'stk_100',
    name: '100 Percent',
    category: 'Reaction',
    svg: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="80" rx="16" fill="#E11D48"/>
      <text x="12" y="52" fill="white" font-family="sans-serif" font-weight="900" font-size="34">100</text>
      <path d="M16 62H64" stroke="white" stroke-width="4" stroke-linecap="round"/>
    </svg>`,
  },
  // Arrows
  {
    id: 'stk_arrow_neon',
    name: 'Neon Red Arrow',
    category: 'Arrows',
    svg: `<svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30H75M75 30L55 15M75 30L55 45" stroke="#EF4444" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },
  // Shapes
  {
    id: 'stk_star',
    name: 'Golden Star',
    category: 'Shapes',
    svg: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,10 50,30 72,32 55,48 60,70 40,58 20,70 25,48 8,32 30,30" fill="#FBBF24" stroke="#D97706" stroke-width="3"/>
    </svg>`,
  },
  // Gaming
  {
    id: 'stk_victory',
    name: 'VICTORY Badge',
    category: 'Gaming',
    svg: `<svg viewBox="0 0 160 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="48" rx="10" fill="#7C3AED"/>
      <text x="24" y="32" fill="#A7F3D0" font-family="sans-serif" font-weight="900" font-size="20">VICTORY!</text>
    </svg>`,
  },
];

// Convert SVG string to Data URL
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
