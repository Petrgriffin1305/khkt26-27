import type { AppPreset, RestrictedApp } from '@/types';

/**
 * Available apps that can be restricted during focus mode.
 * In a real app, this would come from the native module listing installed apps.
 */
export const AVAILABLE_APPS: RestrictedApp[] = [
  // Social Media
  { id: 'facebook', name: 'Facebook', icon: '📘', category: 'social', packageName: 'com.facebook.katana' },
  { id: 'instagram', name: 'Instagram', icon: '📷', category: 'social', packageName: 'com.instagram.android' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', category: 'social', packageName: 'com.zhiliaoapp.musically' },
  { id: 'twitter', name: 'X (Twitter)', icon: '🐦', category: 'social', packageName: 'com.twitter.android' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', category: 'social', packageName: 'com.snapchat.android' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', category: 'social', packageName: 'com.linkedin.android' },

  // Games
  { id: 'candycrush', name: 'Candy Crush', icon: '🍬', category: 'games', packageName: 'com.king.candycrushsaga' },
  { id: 'pubg', name: 'PUBG Mobile', icon: '🎮', category: 'games', packageName: 'com.tencent.ig' },
  { id: 'freefire', name: 'Free Fire', icon: '🔥', category: 'games', packageName: 'com.dts.freefireth' },
  { id: 'roblox', name: 'Roblox', icon: '🧱', category: 'games', packageName: 'com.roblox.client' },
  { id: 'amongus', name: 'Among Us', icon: '🚀', category: 'games', packageName: 'com.innersloth.spacemafia' },

  // Streaming
  { id: 'youtube', name: 'YouTube', icon: '▶️', category: 'streaming', packageName: 'com.google.android.youtube' },
  { id: 'netflix', name: 'Netflix', icon: '🎬', category: 'streaming', packageName: 'com.netflix.mediaclient' },
  { id: 'spotify', name: 'Spotify', icon: '🎧', category: 'streaming', packageName: 'com.spotify.music' },
  { id: 'twitch', name: 'Twitch', icon: '📺', category: 'streaming', packageName: 'tv.twitch.android.app' },
  { id: 'disney', name: 'Disney+', icon: '✨', category: 'streaming', packageName: 'com.disney.disneyplus' },
];

/**
 * Quick preset categories for one-tap selection.
 */
export const APP_PRESETS: AppPreset[] = [
  {
    id: 'social-media',
    label: 'Social Media',
    icon: '📱',
    category: 'social',
    appIds: ['facebook', 'instagram', 'tiktok', 'twitter', 'snapchat', 'linkedin'],
  },
  {
    id: 'games',
    label: 'Games',
    icon: '🎮',
    category: 'games',
    appIds: ['candycrush', 'pubg', 'freefire', 'roblox', 'amongus'],
  },
  {
    id: 'streaming',
    label: 'Streaming',
    icon: '🎬',
    category: 'streaming',
    appIds: ['youtube', 'netflix', 'spotify', 'twitch', 'disney'],
  },
];

/**
 * Get default selected apps (Facebook, Instagram, TikTok) as per spec.
 */
export const getDefaultSelectedApps = (): RestrictedApp[] => {
  return AVAILABLE_APPS.filter((app) =>
    ['facebook', 'instagram', 'tiktok'].includes(app.id)
  );
};
