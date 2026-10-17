# PTQ Film — RoPhim reference implementation

Reference: https://rophim1.vip/phimhay, inspected 2026-10-15. User requested this direction in place of the earlier cinematic redesign. This document supersedes the prior visual direction.

- System UI font, #191b24 canvas, #0f111a footer, white primary text, #aaadb8 muted text, yellow #ffdf83 actions, green country headings.
- Fixed compact40px header through1599px; desktop60px fullnavigation at1600px.
- Fullbleed hero:16:9 desktop capped92vh,50vh tablet,43vh mobile with300px minimum. Manual accessible pagination with all15reference videos and backdrops. Each selected clip autoplays muted initially, respects reduced motion, and releases the previous clip. Wide-screen circle play and grouped heart/info actions.
- Country rows in the same order as reference: Korea, China, US-UK, Thailand. Poster rails sixcolumns at1440,seven at1920; mobile touch scrolling.
- Homepage continues with two numbered editorial rails, cinema/new series/PTQ picks, animation feature/recent animation/horror, and a TV Shows feature. Ranked rails use alternating slanted poster tops, large golden numbers and real provider metadata.
- Collection features use actual landscape images with a left gradient and a poster picker on desktop; mobile stacks image/copy with dot controls and swipe. Selection stays manual, updates all actions together, and scrolls only the picker. Editorial order is not labelled daily view rankings.
- Detail: fullbackdrop, overlapping panel,400px sidebar withposter/meta/synopsis, mainactions/tabs/servercards. Separate fullwidthwatch route.
- Catalog: compacttitle, collapsedgreenfilter, sixcolumn desktop/twocolumn mobile grid. Real filters, search, savedfilms andhistory preserved.
- PTQ vectorlogo: play aperture, sweeping golden reel, Q-tail. No copied sourcebrand.
- No adcontainers, banners, popupad scripts, trackers or fake auth/community data.
