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

test('legacy bookmarks without a provider remain readable and removable',async ({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hnq_bookmarks',JSON.stringify([
    {_id:'fixture-1',slug:'iframe-only',name:'Legacy Movie',poster_url:'/images/placeholder.svg',thumb_url:'/images/placeholder.svg'}
  ])));
  await page.goto('/phim/iframe-only?source=kkphim');
  await page.getByRole('button',{name:'Đã Lưu Tủ Phim',exact:true}).click();
  await expect(page.getByRole('button',{name:'Thêm Tủ Phim',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('hnq_bookmarks')||'[]'))).toEqual([]);
});

test('a failed bookmark write is reported on the hero too',async ({page})=>{
  await page.addInitScript(()=>{
    Storage.prototype.setItem=function(){throw new DOMException('Audit quota failure','QuotaExceededError');};
  });
  await page.goto('/');
  const hero=page.getByRole('region',{name:'Phim tiêu điểm',exact:true});
  await hero.getByRole('button',{name:'Lưu phim',exact:true}).click();
  await expect(hero.getByRole('alert')).toContainText('Không thể cập nhật tủ phim');
});

test('watching a same-slug movie from a different provider keeps both history entries',async ({page})=>{
  await page.addInitScript(()=>{
    // The same-origin mock player also runs init scripts when changing episode.
    // Seed the page once rather than overwrite its saved history from an iframe.
    if (window.top !== window) return;
    localStorage.setItem('hnq_watch_history',JSON.stringify([
      {_id:'other-film',source:'nguonc',slug:'watch-series',name:'Other Film',poster_url:'/images/placeholder.svg',thumb_url:'/images/placeholder.svg',watched_at:'2026-10-18T06:00:00.000Z'}
    ]));
  });
  await page.goto('/xem-phim/watch-series?source=kkphim');
  await page.getByRole('button',{name:'Tập tiếp',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hnq_watch_history')||'[]').length)).toBe(2);
  const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('hnq_watch_history')||'[]'));
  expect(history.map((item:{source:string})=>item.source)).toEqual(['kkphim','nguonc']);
});
