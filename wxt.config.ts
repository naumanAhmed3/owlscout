import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'OwlScout — Shadow IT Discovery',
    description:
      'Discovers the SaaS apps your browser touches, maps OAuth grants against corporate identity, and scores shadow-IT risk — all locally.',
    permissions: ['storage', 'tabs', 'webNavigation'],
    host_permissions: ['<all_urls>'],
    action: { default_title: 'OwlScout' },
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
