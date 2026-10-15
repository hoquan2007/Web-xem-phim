import type { Metadata } from "next";

import "./globals.css";
import NavbarWithData from "@/components/layout/NavbarWithData";
import Footer from "@/components/layout/Footer";

// The public origin can be overridden for preview deployments.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://hnqfilm.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PTQ Film | Xem Phim Vietsub HD Miễn Phí",
    template: "%s | PTQ Film",
  },
  description:
    "Xem phim trực tuyến chất lượng cao hoàn toàn miễn phí trên PTQ. Tuyển tập phim bộ Trung Quốc, Hàn Quốc, phim lẻ chiếu rạp, anime hoạt hình vietsub thuyết minh mới nhất.",
  keywords: [
    "xem phim",
    "ptq",

    "phim vietsub",
    "phim bo",
    "phim le",
    "phim chieu rap",
    "phim hay",
    "xem phim online",
    "phim 4k",
  ],
  authors: [{ name: "PTQ Team" }],
  creator: "PTQ",
  publisher: "PTQ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "PTQ Film | Xem Phim Vietsub HD Miễn Phí",
    description:
      "Xem phim trực tuyến chất lượng cao miễn phí trên PTQ. Phim bộ, phim lẻ, phim chiếu rạp vietsub cập nhật liên tục mỗi ngày.",
    url: siteUrl,
    siteName: "PTQ Film",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/images/og-banner.png",
        width: 1200,
        height: 630,
        alt: "PTQ - Xem Phim HD Vietsub Miễn Phí",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PTQ Film | Xem Phim Vietsub HD Miễn Phí",
    description:
      "Xem phim trực tuyến chất lượng cao miễn phí trên PTQ. Phim bộ, phim lẻ, phim chiếu rạp vietsub cập nhật liên tục.",
    images: ["/images/og-banner.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // FIX-9.3.2: fetch categories/countries chuyển sang `<NavbarWithData />`
  // (Server Component riêng, wrap trong <Suspense>). Layout giờ render ngay →
  // page children (Home, Movie detail, Tủ phim) không bị block bởi upstream
  // chậm. Navbar streaming fill dropdown sau.
  return (
    <html lang="vi" className="dark antialiased">
      <body className="bg-slate-950 text-gray-100 min-h-screen flex flex-col selection:bg-red-600 selection:text-white">
        <a href="#main-content" className="skip-link">
          Đến nội dung chính
        </a>
        <NavbarWithData />
        <main id="main-content" tabIndex={-1} className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
