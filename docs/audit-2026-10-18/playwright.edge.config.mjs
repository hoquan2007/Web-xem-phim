import {defineConfig} from '@playwright/test';
import base from './playwright.legacy.config.mjs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const folder=fileURLToPath(new URL('./',import.meta.url));
const root=fileURLToPath(new URL('../../',import.meta.url));
export default defineConfig({
  ...base,
  testDir:folder,
  outputDir:path.join(root,'test-results/storage-audit'),
  projects:[{name:'storage-audit',testMatch:'storage.edge.spec.mjs'}],
  reporter:[['list'],['json',{outputFile:path.join(folder,'storage-results.json')}]],
});
