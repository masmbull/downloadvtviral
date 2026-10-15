// Single source of truth for supported platforms and host matching.
// Keep in sync with server/main.py (PLATFORM_HOSTS).

export type Platform =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'reddit'
  | 'pinterest'
  | 'vimeo'
  | 'twitch'
  | 'rumble'
  | 'snapchat'
  | 'linkedin'
  | 'videy'
  | 'vidara'
  | 'doodstream'
  | 'streamtape'
  | 'filemoon'
  | 'mixdrop'
  | 'voe'
  | 'streamrizz';

export type MediaType = 'video' | 'images';

export interface DownloadItem {
  quality: string;
  url: string;
}

export interface MediaResult {
  platform: Platform;
  title: string;
  thumbnail: string;
  type: MediaType;
  downloads: DownloadItem[];
}

export const PLATFORM_HOSTS: Record<Platform, string[]> = {
  youtube: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  tiktok: ['tiktok.com', 'vm.tiktok.com'],
  instagram: ['instagram.com', 'instagr.am'],
  twitter: ['twitter.com', 'x.com', 't.co'],
  facebook: ['facebook.com', 'fb.watch', 'fb.com'],
  reddit: ['reddit.com', 'redd.it'],
  pinterest: ['pinterest.com', 'pin.it'],
  vimeo: ['vimeo.com'],
  twitch: ['twitch.tv'],
  rumble: ['rumble.com'],
  snapchat: ['snapchat.com'],
  linkedin: ['linkedin.com'],
  videy: ['videy.co', 'videy.com'],
  vidara: ['vidara.to', 'vidara.so', 'vidara.su'],
  doodstream: [
    'doodstream.com', 'dood.to', 'd000d.com', 'doods.pro', 'ds2play.com',
    'dood.wf', 'dood.cx', 'dood.pm', 'dood.so', 'dood.la', 'dood.li',
    'dood.yt', 'dood.re', 'dooood.com',
  ],
  streamtape: [
    'streamtape.com', 'streamtape.to', 'streamtape.net',
    'streamtape.xyz', 'streamtape.cc', 'shavetape.cash',
  ],
  filemoon: ['filemoon.sx', 'filemoon.to', 'filemoon.in', 'bysezejataos.com'],
  mixdrop: ['mixdrop.co', 'mixdrop.to', 'mixdrop.sx', 'mixdrop.bz', 'mixdrop.ch', 'm1xdrop.net'],
  voe: ['voe.sx', 'voe.to'],
  streamrizz: ['streamrizz.com', 'streamrizz.to'],
};

export const PLATFORM_NAMES: Record<Platform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  reddit: 'Reddit',
  pinterest: 'Pinterest',
  vimeo: 'Vimeo',
  twitch: 'Twitch',
  rumble: 'Rumble',
  snapchat: 'Snapchat',
  linkedin: 'LinkedIn',
  videy: 'Videy',
  vidara: 'Vidara',
  doodstream: 'Doodstream',
  streamtape: 'Streamtape',
  filemoon: 'Filemoon',
  mixdrop: 'Mixdrop',
  voe: 'Voe',
  streamrizz: 'StreamRizz',
};

export const PLATFORMS = Object.keys(PLATFORM_HOSTS) as Platform[];

/** Max links processed per batch (free tier). */
export const MAX_BATCH = 3;

function hostMatches(hostname: string, hosts: string[]): boolean {
  const host = hostname.toLowerCase();
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

export function detectPlatform(url: string): Platform | null {
  if (!url) return null;
  const normalized = url.includes('://') ? url : `https://${url}`;
  let hostname: string;
  try {
    hostname = new URL(normalized).hostname;
  } catch {
    return null;
  }
  for (const platform of PLATFORMS) {
    if (hostMatches(hostname, PLATFORM_HOSTS[platform])) return platform;
  }
  return null;
}