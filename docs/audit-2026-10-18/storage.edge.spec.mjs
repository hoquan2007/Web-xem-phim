import { test, expect } from '@playwright/test';

// Two distinct movies can share a native slug across independent providers.
const movies = [
  {_id:'audit-a',slug:'shared-native-slug',source:'kkphim',name:'Audit Movie A',poster_url:'/images/placeholder.svg',thumb_url:'/images/placeholder.svg',tmdb:{id:'101',type:'movie'}},
  {_id:'audit-b',slug:'shared-native-slug',source:'nguonc',name:'Audit Movie B',poster_url:'/images/placeholder.svg',thumb_url:'/images/placeholder.svg',tmdb:{id:'202',type:'movie'}},
];

test('a different movie does not inherit a bookmark just because its slug matches',async ({page})=>{
  await page.addInitScript(item=>localStorage.setItem('hnq_bookmarks',JSON.stringify([item])),movies[1]);
  await page.goto('/phim/shared-native-slug?source=kkphim');
  await expect(page.getByRole('heading',{name:'Mock Movie (shared-native-slug)',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Thêm Tủ Phim',exact:true})).toBeVisible();
});

test('removing one bookmark preserves the different movie from another provider', async ({page})=>{
  await page.addInitScript(items=>localStorage.setItem('hnq_bookmarks',JSON.stringify(items)),movies);
  await page.goto('/tu-phim');
  await expect(page.locator('.movie-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Xóa Audit Movie A khỏi tủ phim',exact:true}).click();
  await expect(page.locator('.movie-card')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Audit Movie B',exact:true})).toBeVisible();
});

test('removing one history item preserves the different movie from another provider',async ({page})=>{
  const history=movies.map(movie=>({...movie,watched_at:'2026-10-18T06:00:00.000Z',episode_name:'1'}));
  await page.addInitScript(items=>localStorage.setItem('hnq_watch_history',JSON.stringify(items)),history);
  await page.goto('/tu-phim');
  await page.getByRole('tab',{name:/Lịch sử/}).click();
  await expect(page.locator('.movie-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Xóa Audit Movie A khỏi lịch sử',exact:true}).click();
  await expect(page.locator('.movie-card')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Audit Movie B',exact:true})).toBeVisible();
});

test('a failed bookmark write is reported to the viewer on the movie detail page',async ({page})=>{
  await page.addInitScript(()=>{
    Storage.prototype.setItem=function(){throw new DOMException('Audit quota failure','QuotaExceededError');};
  });
  await page.goto('/phim/iframe-only?source=kkphim');
  const button=page.getByRole('button',{name:'Thêm Tủ Phim',exact:true});
  await expect(button).toBeVisible();
  await button.click();
  // Ignore Next.js's generic route-announcement alert; require an actual error.
  await expect(page.getByRole('alert').filter({hasText:/không|chưa|lỗi|dung lượng/i})).toBeVisible();
});
