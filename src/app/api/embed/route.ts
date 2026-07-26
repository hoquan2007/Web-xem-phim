import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const embedUrl = searchParams.get('url');

  if (!embedUrl) {
    return new NextResponse('Missing embed URL', { status: 400 });
  }

  try {
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return new NextResponse('Failed to fetch embed', { status: res.status });
    }

    const html = await res.text();
    const embedDomain = new URL(embedUrl).origin;

    const customCss = `
      <base href="${embedDomain}/">
      <style>
        /* Modern Dark Cinema Theme Overrides for StreamVSMOV Embed Player */
        :root {
          --primary-color: #06b6d4 !important;
          --primary-text: #ffffff !important;
          --bc-player-ink: #f8fafc !important;
          --bc-player-paper: #0f172a !important;
          --bc-player-surface: rgba(15, 23, 42, 0.85) !important;
          --bc-player-bar: rgba(15, 23, 42, 0.95) !important;
          --bc-player-accent: #06b6d4 !important;
          --bc-player-accent-hover: #0891b2 !important;
          --bc-player-sky: #38bdf8 !important;
          --bc-player-pop: #06b6d4 !important;
          --bc-player-radius: 12px !important;
          --bc-player-radius-sm: 10px !important;
          --bc-player-border: 1px solid rgba(255, 255, 255, 0.15) !important;
          --bc-player-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
          --bc-player-shadow-sm: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
          --bg-primary: #06b6d4 !important;
        }
        
        /* OVERRIDE & REMOVE WHITE SQUARE LOADING BOX */
        .jwplayer.jw-skin-pom .jw-display-icon-container,
        #rp-player .jw-display-icon-container,
        div.jw-display-icon-container,
        .jw-display-icon-container {
          border: 1.5px solid rgba(6, 182, 212, 0.6) !important;
          border-radius: 9999px !important;
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          box-shadow: 0 0 25px rgba(6, 182, 212, 0.5) !important;
          color: #38bdf8 !important;
          width: 64px !important;
          height: 64px !important;
        }

        .jwplayer.jw-skin-pom .jw-display-icon-container .jw-svg-icon {
          fill: #38bdf8 !important;
        }

        .jwplayer.jw-skin-pom .jw-display-icon-container:hover {
          background: rgba(6, 182, 212, 0.9) !important;
          box-shadow: 0 0 35px rgba(6, 182, 212, 0.8) !important;
        }

        .jwplayer.jw-skin-pom .jw-display-icon-container:hover .jw-svg-icon {
          fill: #ffffff !important;
        }

        /* OVERRIDE WHITE RECTANGULAR BUTTONS (SKIP 10S, FULLSCREEN, PIP, QUALITY) */
        #rp-player .item-btn .line-center {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 12px !important;
          background: rgba(15, 23, 42, 0.85) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          color: #f1f5f9 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
          padding: 0.4rem 0.65rem !important;
        }

        #rp-player .item-btn.active .line-center,
        #rp-player .item-btn:hover .line-center {
          border-color: rgba(6, 182, 212, 0.6) !important;
          background: rgba(6, 182, 212, 0.3) !important;
          color: #38bdf8 !important;
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.4) !important;
        }

        /* PROGRESS SEEKBAR GRADIENT CYAN */
        .bar-line,
        .jwplayer.jw-skin-pom .jw-slider-time .jw-slider-container .jw-rail,
        .jwplayer.jw-skin-pom .b_bar .jw-slider-container .jw-rail {
          height: 5px !important;
          border: none !important;
          border-radius: 9999px !important;
          background-color: rgba(255, 255, 255, 0.2) !important;
          box-shadow: none !important;
        }

        .jwplayer.jw-skin-pom .jw-progress {
          background: linear-gradient(90deg, #06b6d4, #38bdf8) !important;
          border-radius: 9999px !important;
        }

        .jwplayer.jw-skin-pom .jw-knob {
          background: #38bdf8 !important;
          border: 2px solid #ffffff !important;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.8) !important;
        }

        /* TOOLTIP TIME POPUP DARK NEON */
        .tooltip.custom-tooltip .tooltip-inner {
          background: rgba(15, 23, 42, 0.95) !important;
          color: #38bdf8 !important;
          border: 1px solid rgba(6, 182, 212, 0.4) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
          font-weight: 600 !important;
        }
      </style>
    `;

    const injectedHtml = html.replace('<head>', `<head>${customCss}`);

    return new NextResponse(injectedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error proxying embed:', error);
    return new NextResponse('Error loading embed', { status: 500 });
  }
}
