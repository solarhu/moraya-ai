import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async () => {
  // Web端路由只在web平台加载
  // 不做跳转，允许访问
  return {
    platform: 'web',
  };
};