import { defineConfig } from 'wxt';

import { DEVELOPER } from './src/developer';

/** Extension homepage — developer portfolio */
const STORE_HOMEPAGE_URL = DEVELOPER.website;

export default defineConfig({
  srcDir: 'src',
  outDir: 'output',
  zip: {
    artifactTemplate: 'webpage-showcase-{{version}}-{{browser}}.zip',
    exclude: ['**/*.map'],
  },
  manifest: () => ({
    name: 'Webpage Showcase',
    short_name: 'Webpage Showcase',
    description:
      'Stop wrestling with your mouse. Cinematic auto-scroll for polished screen-recording demos on any webpage.',
    homepage_url: STORE_HOMEPAGE_URL,
    minimum_chrome_version: '109',
    permissions: ['storage', 'activeTab', 'scripting'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      96: 'icon/96.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'Webpage Showcase',
      default_popup: 'popup.html',
      default_icon: {
        16: 'icon/16.png',
        32: 'icon/32.png',
        48: 'icon/48.png',
      },
    },
    options_ui: {
      page: 'options.html',
      open_in_tab: true,
    },
  }),
});
