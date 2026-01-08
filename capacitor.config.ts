import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.boocozmo.app',
  appName: 'Boocozmo',
  webDir: 'dist', // This is the built folder of your Vite/React project
  // REMOVE the entire "server" section below
  // server: {
  //   url: 'https://boocozmo.vercel.app',
  //   cleartext: true
  // }
};

export default config;