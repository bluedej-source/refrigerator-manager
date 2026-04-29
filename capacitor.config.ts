import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fridge.manager',
  appName: '냉장고안심매니저',
  webDir: 'public',
  server: {
    // 개발 시 로컬 Next.js 서버에 연결 (npm run dev 실행 중이어야 함)
    url: 'http://192.168.123.107:3000',
    cleartext: true,
  },
};

export default config;
