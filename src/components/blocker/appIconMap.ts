import type { AppCategory } from '@/types';

/**
 * High-quality brand icon mapping for common distracting apps.
 * Used by AppIcon to render a proper vector icon with brand color
 * instead of an emoji/text fallback.
 */
export interface AppIconSpec {
  family: 'MaterialCommunityIcons' | 'Ionicons';
  name: string;
  /** Official brand color (hex). */
  color: string;
}

const BRAND_ICONS: Record<string, AppIconSpec> = {
  facebook: { family: 'Ionicons', name: 'logo-facebook', color: '#1877F2' },
  instagram: { family: 'Ionicons', name: 'logo-instagram', color: '#E1306C' },
  tiktok: { family: 'Ionicons', name: 'logo-tiktok', color: '#010101' },
  twitter: { family: 'Ionicons', name: 'logo-twitter', color: '#1DA1F2' },
  snapchat: { family: 'Ionicons', name: 'logo-snapchat', color: '#FFFC00' },
  linkedin: { family: 'Ionicons', name: 'logo-linkedin', color: '#0A66C2' },
  candycrush: { family: 'MaterialCommunityIcons', name: 'candy', color: '#EC407A' },
  pubg: { family: 'MaterialCommunityIcons', name: 'crosshairs-gps', color: '#F2A900' },
  freefire: { family: 'MaterialCommunityIcons', name: 'fire', color: '#FF5722' },
  roblox: { family: 'MaterialCommunityIcons', name: 'cube-outline', color: '#00A2FF' },
  amongus: { family: 'MaterialCommunityIcons', name: 'rocket-launch', color: '#E74C3C' },
  youtube: { family: 'Ionicons', name: 'logo-youtube', color: '#FF0000' },
  netflix: { family: 'MaterialCommunityIcons', name: 'movie', color: '#E50914' },
  spotify: { family: 'Ionicons', name: 'logo-spotify', color: '#1DB954' },
  twitch: { family: 'Ionicons', name: 'logo-twitch', color: '#9146FF' },
  disney: { family: 'MaterialCommunityIcons', name: 'castle', color: '#113CCF' },
};

/** Keyword aliases matched against app name / packageName. */
const KEYWORD_MAP: { match: RegExp; id: string }[] = [
  { match: /facebook/i, id: 'facebook' },
  { match: /instagram/i, id: 'instagram' },
  { match: /tiktok|bytedance|musically/i, id: 'tiktok' },
  { match: /twitter|x\s?\(/i, id: 'twitter' },
  { match: /snapchat/i, id: 'snapchat' },
  { match: /linkedin/i, id: 'linkedin' },
  { match: /candycrush|king/i, id: 'candycrush' },
  { match: /pubg|tencent/i, id: 'pubg' },
  { match: /freefire|free\s?fire/i, id: 'freefire' },
  { match: /roblox/i, id: 'roblox' },
  { match: /amongus|innersloth/i, id: 'amongus' },
  { match: /youtube|google\.android\.youtube/i, id: 'youtube' },
  { match: /netflix/i, id: 'netflix' },
  { match: /spotify/i, id: 'spotify' },
  { match: /twitch/i, id: 'twitch' },
  { match: /disney/i, id: 'disney' },
  { match: /chrome/i, id: 'chrome' },
  { match: /browser|safari|firefox/i, id: 'browser' },
];

BRAND_ICONS.chrome = { family: 'Ionicons', name: 'logo-chrome', color: '#4285F4' };

/** Generic category fallbacks. */
const CATEGORY_FALLBACK: Record<AppCategory, AppIconSpec> = {
  social: { family: 'MaterialCommunityIcons', name: 'account-group', color: '#5C6BC0' },
  games: { family: 'MaterialCommunityIcons', name: 'gamepad-variant', color: '#8E44AD' },
  streaming: { family: 'MaterialCommunityIcons', name: 'play-box-multiple', color: '#D81B60' },
  other: { family: 'MaterialCommunityIcons', name: 'cellphone', color: '#607D8B' },
};

BRAND_ICONS.browser = { family: 'MaterialCommunityIcons', name: 'web', color: '#4285F4' };

/**
 * Resolve the best icon spec for an app given its id, name and packageName.
 */
export function resolveAppIcon(input: {
  id?: string;
  name?: string;
  packageName?: string;
  category?: AppCategory;
}): AppIconSpec {
  if (input.id && BRAND_ICONS[input.id]) return BRAND_ICONS[input.id];

  const haystack = `${input.name ?? ''} ${input.packageName ?? ''}`;
  for (const { match, id } of KEYWORD_MAP) {
    if (match.test(haystack) && BRAND_ICONS[id]) return BRAND_ICONS[id];
  }

  return CATEGORY_FALLBACK[input.category ?? 'other'];
}
