export type Platform = 'tauri' | 'web';

export interface PlatformInfo {
  platform: Platform;
  isTauri: boolean;
  isWeb: boolean;
  isMobile: boolean;
  browser?: string;
}

export function detectPlatform(): Platform {
  // 检测是否在Tauri环境
  if (typeof window !== 'undefined' && window.__TAURI__) {
    return 'tauri';
  }
  return 'web';
}

export function getPlatformInfo(): PlatformInfo {
  const platform = detectPlatform();
  
  const info: PlatformInfo = {
    platform,
    isTauri: platform === 'tauri',
    isWeb: platform === 'web',
    isMobile: detectMobile(),
  };
  
  if (info.isWeb) {
    info.browser = detectBrowser();
  }
  
  return info;
}

export function detectMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 检测移动设备
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile'
  ];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
}

export function detectBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return 'chrome';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'safari';
  } else if (userAgent.includes('Firefox')) {
    return 'firefox';
  } else if (userAgent.includes('Edg')) {
    return 'edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    return 'opera';
  }
  
  return 'unknown';
}

export const platform = detectPlatform();
export const platformInfo = getPlatformInfo();