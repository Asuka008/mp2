import { copyFile } from 'node:fs/promises';

// GitHub Pages serves this entry point when a BrowserRouter URL is opened directly.
await copyFile(new URL('../dist/index.html', import.meta.url), new URL('../dist/404.html', import.meta.url));
