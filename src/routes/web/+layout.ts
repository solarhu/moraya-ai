import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';
import { platform } from '$lib/platform';

export const load: LayoutLoad = async () => {
  // Web端路由只在web平台加载
  // Tauri端会使用默认路由
  if (platform === 'tauri') {
    throw redirect(302, '/');
  }
  
  return {
    platform: 'web',
  };
};