import { Suspense } from 'react';
import { connection } from 'next/server';
import { getCategories, getCountries } from '@/lib/api';
import Navbar from './Navbar';

/**
 * Server Component wrapper để fetch categories/countries cho Navbar.
 * FIX-9.3.2: tách fetch ra khỏi `app/layout.tsx` và wrap trong `<Suspense>`
 * để streaming — page children không phải đợi Navbar dropdown data.
 *
 * Layout cũ block toàn bộ first paint trong khi `await Promise.all`
 * (khi upstream phimapi.com chậm vài giây, mọi route đều chậm theo).
 *
 * Sau fix:
 * - Navbar render ngay với data rỗng (SSR snapshot).
 * - Khi `NavbarData` resolve → thay fallback bằng Navbar có dữ liệu.
 * - `cache()` trong `api.ts` dedupe các route cùng request.
 * - Fallback chưa cho nhập tìm kiếm: state của nó sẽ mất khi bị thay thế.
 */
async function NavbarData() {
  await connection();
  // React `cache()` ở `api.ts` đảm bảo dedupe nếu NavbarData được gọi
  // nhiều lần trong cùng render pass.
  const [categories, countries] = await Promise.all([
    getCategories(),
    getCountries(),
  ]);
  return <Navbar categories={categories} countries={countries} />;
}

export const NavbarWithData: React.FC = () => {
  return (
    <Suspense fallback={<Navbar searchEnabled={false} />}>
      <NavbarData />
    </Suspense>
  );
};

export default NavbarWithData;
