import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../entrypoints/options/App';
import { getAllApps, replaceAll } from '@/lib/db';
import { buildDemoData } from '@/lib/demo-data';
import '@/assets/app.css';

// Standalone hosted build of the OwlScout dashboard. The dashboard is
// browser-extension-API-free (it reads IndexedDB directly), so it runs
// as a normal web app. Seed sample data on first load so visitors land
// on a populated dashboard.
async function boot() {
  const existing = await getAllApps();
  if (existing.length === 0) {
    const { apps, events } = buildDemoData();
    await replaceAll(apps, events);
  }
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void boot();
