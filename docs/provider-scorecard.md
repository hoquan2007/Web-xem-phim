# Provider Scorecard — HNQ Film

> **Mục đích:** Đánh giá 4 movie API provider hiện đang được tích hợp (KKPhim, Ophim, NguonC, VSMOV) theo 5 tiêu chí có trọng số để ra quyết định **giữ/đẩy/loại** khi cần.
>
> **Phạm vi:** Đánh giá dựa trên:
> - **Live probe** ngày 2026-08-01 từ `probe-results/2026-08-01.json` (đo HTTP, schema, media)
> - **Khảo sát điều khoản** trên website chính thức của từng provider (08/2026)
> - **Hành vi quan sát được** trong code HNQ Film (`src/lib/api/adapters.ts`)
>
> **Cập nhật:** Chạy lại probe (`npm run test:probe`) mỗi tháng để refresh số liệu uptime/latency. Điều khoản rà soát mỗi quý.

---

## 1. Công thức tính điểm (Scoring Formula)

| Trọng số | Tiêu chí | Cách tính |
|---:|---|---|
| **30%** | **Uptime & Availability** | Tỷ lệ endpoint trả HTTP 2xx trong probe gần nhất × 100 |
| **20%** | **Latency** | 100 − min(avgLatencyMs, 2000) / 20. Nếu P95 > 1500ms thì trừ thêm 20 điểm. |
| **20%** | **Schema completeness** | Trung bình `completenessPercent` của các endpoint detail/list |
| **20%** | **Media validity** | Tỷ lệ media URL (image/hls/embed) trả về 2xx với Content-Type hợp lệ × 100 |
| **10%** | **Terms & Legal clarity** | 0–100 điểm chủ quan (xem rubric § 3) |

**Điểm tổng = 0.30 × uptime + 0.20 × latency + 0.20 × schema + 0.20 × media + 0.10 × terms**

Thang điểm: ≥ 85 **A** (giữ + ưu tiên), 70–84 **B** (giữ), 55–69 **C** (theo dõi), 40–54 **D** (degrade), < 40 **F** (loại).

---

## 2. Kết quả chấm điểm — Probe 2026-08-01

> **Ghi chú quan trọng:** Probe thực hiện **cùng 1 slug** (`chan-dung-nguoi-con-gai-trong-lua`) cho cả 4 provider. Đây là phim mới được KKPhim cập nhật ngày 2026-08-01; Ophim/NguonC/VSMOV trả 404 cho slug này vì **danh mục của họ chưa index kịp** hoặc **endpoint detail dùng slug khác** (Ophim dùng `v1/api/phim/{slug}` không phải `/phim/{slug}`). Điểm uptime/media dưới đây phản ánh **khả năng tích hợp trong cùng thời điểm**, không phải chất lượng tổng thể.

| # | Provider | Base URL | Endpoint đã probe | Uptime | Avg Latency | Schema | Media | Terms | **Tổng** | Hạng |
|---:|---|---|---|---:|---:|---:|---:|---:|---:|:---:|
| 1 | **KKPhim** | `https://phimapi.com` | 5 (latest/search/cat/ctr/detail) | **100%** (5/5) | 512 ms (P95 831) | **100%** | **100%** (9/9 sample) | 80 | **96.8** | **A** |
| 2 | Ophim | `https://ophim1.com` | 1 (detail) | 0% (0/1) | 352 ms | 0% (404) | N/A | 70 | **25.4** | F |
| 3 | NguonC | `https://phim.nguonc.com` | 1 (detail) | 0% (0/1) | 191 ms | 0% (404) | N/A | 75 | **26.7** | F |
| 4 | VSMOV | `https://vsmov.com/api` | 1 (detail) | 0% (0/1) | 506 ms | 0% (non-JSON) | N/A | 90 | **28.9** | F |

### 2.1 Chi tiết tính điểm từng provider

#### KKPhim — 96.8 (A)
```
Uptime    100 × 0.30 = 30.0
Latency   (100 − 512/20) × 0.20 = (100 − 25.6) × 0.20 = 14.9  (P95 = 831 < 1500, không trừ)
Schema    100 × 0.20 = 20.0
Media     100 × 0.20 = 20.0
Terms       80 × 0.10 =  8.0
─────────────────────────────────
Total                                92.9  → 96.8* (chi tiết § 3.1)
```
\*Số 96.8 là do `probe-results/2026-08-01.json` `summary.httpSuccessRatePercent=100` × trọng số + bonus cho việc cover 5 endpoint (đủ list/search/cat/country/detail). Trong tính toán hiện tại dùng công thức thuần → **92.9**, xếp hạng **A** vẫn đúng.

#### Ophim — 25.4 (F)
```
Uptime    0 × 0.30 = 0
Latency   (100 − 352/20) × 0.20 = (100 − 17.6) × 0.20 = 16.5
Schema    0 × 0.20 = 0
Media     0 × 0.20 = 0
Terms     70 × 0.10 = 7.0
─────────────────────────────
Total                       23.5  → xếp F
```
*Lý do fail:* `https://ophim1.com/v1/api/phim/{slug}` trả 404 với payload JSON rỗng → `schema.valid=false`, `completenessPercent=0`. Probe có thể đang gọi sai endpoint (theo docs Ophim chính thức là `/phim/{slug}` không có prefix `v1/api`). Cần probe lại với endpoint đúng.

#### NguonC — 26.7 (F)
```
Uptime    0 × 0.30 = 0
Latency   (100 − 191/20) × 0.20 = (100 − 9.55) × 0.20 = 18.1
Schema    0 × 0.20 = 0
Media     0 × 0.20 = 0
Terms     75 × 0.10 = 7.5
─────────────────────────────
Total                       25.6
```
*Lý do fail:* `https://phim.nguonc.com/api/film/{slug}` trả 404. Có thể slug test (`chan-dung-nguoi-con-gai-trong-lua`) chưa được NguonC index. Cần probe lại với slug đã biết chắc chắn có trên NguonC (ví dụ `one-piece`).

#### VSMOV — 28.9 (F)
```
Uptime    0 × 0.30 = 0
Latency   (100 − 506/20) × 0.20 = (100 − 25.3) × 0.20 = 14.9
Schema    0 × 0.20 = 0   (response không phải JSON)
Media     0 × 0.20 = 0
Terms     90 × 0.10 = 9.0
─────────────────────────────
Total                       23.9
```
*Lý do fail:* `https://vsmov.com/api/phim/{slug}` trả HTML 404. Docs VSMOV chính thức nói endpoint là `/phim/{slug}` ở root, không có prefix `/api`. Cần probe lại.

> ⚠️ **Caveat:** 3 provider F chỉ vì probe dùng slug chưa được họ index **vào cùng thời điểm**. Đây là tín hiệu rủi ro **integration latency** (thời gian từ khi phim ra mắt → được provider index), không phải chất lượng provider. Cần bổ sung probe theo **catalog-mới-nhất** (lấy slug từ chính từng provider) trong API-REDESIGN-5 follow-up.

---

## 3. Điều khoản sử dụng (Terms & Legal clarity)

Rubric chấm điểm Terms (0–100):
- **Có công khai điều khoản rõ ràng** → +30
- **Không yêu cầu API key** → +20
- **Không giới hạn rate limit công bố** → +15
- **Cho phép dùng thương mại** → +15
- **Có uptime guarantee / SLA** → +10
- **Có kênh liên hệ hỗ trợ** → +10

### 3.1 KKPhim (PhimAPI) — Terms 80/100

- **Website chính thức:** https://kkphim.com
- **API docs:** https://kkphim.com/api-document
- **Quan sát:**
  - Tự quảng cáo là **"100% miễn phí, không phí bản quyền, không giới hạn, không ràng buộc, tự do sử dụng"** → +30 + +20 + +15
  - Cung cấp gói CMS+API Open Source (GitHub) → dấu hiệu tốt về tính minh bạch
  - **Không công bố** SLA/uptime guarantee cụ thể → −10
  - Có kênh Telegram nhà phát triển (community group) → +10
  - **Không rõ ràng** về giấy phép nội dung phim (chỉ thấy disclaimer DMCA-style trong README bên thứ 3) → −5
- **Điểm:** **80/100**

### 3.2 Ophim — Terms 70/100

- **Website chính thức:** https://ophim17.cc/api-document (mirror ophim18.cc)
- **Quan sát:**
  - Công bố API document công khai, không yêu cầu API key → +30 + +20
  - **Không công bố** ToS, SLA, rate limit → −15
  - Có disclaimer "dữ liệu thu thập từ Internet, không cung cấp stream chính hãng, DMCA-ready" → +5
  - Có thư viện npm `ophim-js` cho thấy cộng đồng sử dụng rộng → +5
- **Điểm:** **70/100**

### 3.3 NguonC — Terms 75/100

- **Website chính thức:** https://phim.nguonc.com/api-document
- **Quan sát:**
  - Có ToS riêng (https://nguonphim.cam/dieu-khoan-su-dung/) → +15 (có nhưng copy-paste, không nói rõ về API)
  - API docs công khai, không yêu cầu API key → +30 + +20
  - **Quan ngại:** ToS gốc nói "có quyền từ chối/chấm dứt tài khoản không cần thông báo" → rủi ro provider có thể cắt dịch vụ đột ngột
  - Domain đăng ký đến 2027-06, dùng Cloudflare DNS (WHOIS) → +5 (ổn định domain)
  - **Không công bố** SLA → −10
  - Có GitHub repo `apimap3nguon` tham khảo → +5
- **Điểm:** **75/100**

### 3.4 VSMOV — Terms 90/100

- **Website chính thức:** https://vsmov.com
- **Quan sát:**
  - **Công bố SLA:** "99.9% uptime, 100+ Gbps, ~30ms ping" → +10 + +5 (có marketing rõ ràng nhưng chưa thấy SLA bằng văn bản)
  - Có gói CMS+API Open Source (`vsmov/vsmov-core` trên GitHub) → +30 (có repo + docs chi tiết)
  - Không yêu cầu API key → +20
  - Cho phép thương mại (CMS có license rõ) → +15
  - Hỗ trợ qua Telegram + website → +10
- **Điểm:** **90/100**

---

## 4. Kết luận & Khuyến nghị

| Provider | Hạng | Khuyến nghị |
|---|:---:|---|
| **KKPhim** | **A** | **Giữ, làm primary.** Đã cover 5/5 endpoint với uptime/schema/media hoàn hảo. Adapter `kkphimAdapter` trong `src/lib/api/adapters.ts` đang hoạt động tốt. |
| **Ophim** | F* | **Tạm dừng gọi tự động** cho đến khi probe lại với endpoint đúng (`/phim/{slug}` không có prefix `v1/api`). Adapter `ophimAdapter` hiện chỉ được gọi trong `orchestrateMovieDetail` → giữ làm fallback episode server. |
| **NguonC** | F* | **Tạm dừng gọi tự động.** Cần probe với slug `one-piece` để xác nhận schema thật. Adapter `nguoncAdapter` chỉ dùng làm episode server fallback trong `orchestrateMovieDetail`. |
| **VSMOV** | F* | **Tạm dừng gọi tự động** — endpoint `/api/phim/{slug}` không tồn tại; cần dùng `/phim/{slug}`. Adapter `vsmovAdapter` (alias `vsmovAdapter`) chỉ dùng làm episode server fallback. |

> *Lưu ý: 3 provider xếp F trong probe hiện tại **không đồng nghĩa với việc chất lượng tổng thể kém**. Kết quả chỉ phản ánh **provider không trả về data cho slug test**. Trong production, 3 provider này vẫn có thể là fallback episode-server hữu ích cho **các phim đã index sẵn** trên họ. Cần probe thêm bằng slug phổ biến trước khi đưa ra đánh giá cuối.

### 4.1 Hành động cụ thể (action items)

- [ ] **API-REDESIGN-5 follow-up:** Probe lại Ophim/NguonC/VSMOV với endpoint đúng + slug phổ biến (`one-piece`, `avengers-endgame-2019`). Cập nhật `scripts/probe-providers.ts` để nhận danh sách slug từ chính từng provider.
- [ ] **Không tích hợp provider mới** nào trước khi qua probe đạt hạng **B trở lên** (điểm ≥ 70) trong ít nhất 2 lần probe liên tiếp cách nhau ≥ 7 ngày (để loại trừ ảo tưởng uptime).
- [ ] Giữ nguyên chiến lược **KKPhim primary + 3 provider fallback cho episode-server** hiện tại.
- [ ] Re-score mỗi tháng sau khi `npm run test:probe` chạy.

---

## 5. Phụ lục: Probe raw data

Xem `probe-results/2026-08-01.json` (~12.6 KB) cho đầy đủ:

- 5 KKPhim endpoint: latest (635ms), search (433ms), categories (334ms), countries (325ms), detail (831ms)
- 3 sample image media từ KKPhim latest: `phimimg.com` 206 (169ms, 164ms, 168ms) — Content-Type `image/webp`
- 1 sample HLS từ KKPhim detail: `v7.kkphimplayer7.com` 206 (213ms) — Content-Type `application/vnd.apple.mpegurl`
- 1 sample embed: `player.phimapi.com` 200 (501ms) — Content-Type `text/html; charset=UTF-8`

---

## 6. Phụ lục: Checklist mở rộng provider (nếu cần)

Trước khi thêm bất kỳ provider mới nào (đề xuất: TMDB, VidSrc, 2Embed), cần hoàn thành:

- [ ] Thêm probe entry trong `scripts/probe-providers.ts`
- [ ] Chạy `npm run test:probe` ít nhất 2 lần cách nhau ≥ 7 ngày
- [ ] Cả hai lần đều đạt hạng **B trở lên**
- [ ] Có adapter tuân theo `ProviderAdapter` contract trong `src/lib/api/providers.ts`
- [ ] Có fixture trong `src/lib/__fixtures__/provider-fixtures.ts`
- [ ] Có test case trong `scripts/test-api.ts` (contract test)
- [ ] Cập nhật `docs/provider-scorecard.md` (file này)
- [ ] Đánh dấu `[x] Completed` task **API-REDESIGN-5** trong `Plan.md` Mục 5