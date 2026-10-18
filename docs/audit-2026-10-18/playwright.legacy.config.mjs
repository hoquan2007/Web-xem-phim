// Audit-only configuration: exercises legacy files excluded from normal CI.
// The application and primary Playwright configuration are unchanged.
import { defineConfig, devices } from '@playwright/test';
import base from '../../playwright.config.ts';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const origin='http://localhost:3111';
export default defineConfig({
  ...base,
  testDir:path.join(root,'tests/e2e'),
  testIgnore:[],
  outputDir:path.join(root,'test-results/legacy-audit'),
  timeout:30000,
  expect:{timeout:5000},
  retries:0,
  workers:2,
  reporter:[['list'],['json',{outputFile:path.join(root,'docs/audit-2026-10-18/legacy-results.json')}]],
  use:{...base.use,baseURL:origin,video:'off'},
  projects:[{name:'legacy-audit',testMatch:['**/homepage.spec.ts','**/routes.spec.ts','**/search.spec.ts','**/security.spec.ts','**/watch.spec.ts','**/xss.spec.ts'],use:{...devices['Desktop Chrome']}}],
  webServer:{
    ...base.webServer,
    cwd:root,
    command:'node node_modules/next/dist/bin/next start -p 3111',
    url:origin,
    reuseExistingServer:false,
    env:{API_MOCK:'1',API_MOCK_ORIGIN:origin,API_BASE_KKPHIM:origin+'/api/mock/kkphim',API_BASE_OPHIM:origin+'/api/mock/ophim',API_BASE_NGUONC:origin+'/api/mock/nguonc'},
  },
});
