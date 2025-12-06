# Memento Mori

> Memento mori (Latin): Remember Death

It is important to remember death, the only inevitability in one's life. 

# Project Statement
The objective is to create a digital, customizable, and exportable cross-platform interface that will allow users to visualize their life, or more specifically, their time in this universe. 

The interface will contain a grid of squares representing the weeks in one's life. The squares will be colored based on one criteria - whether one has already lived that week, or whether they are yet to live it.

Ideally, it should also have an "active" week which will represent the current week. A year or a month is too large of a time slot to allocate to each square, while a day is too small. A week provides an optimal length of time to visualize and act upon. 

The philosophical merit will be the constant reminder of one's mortality and the limited time. 

The commercial merit is that many people are beginning to engage in philosophical discussions lately. Philosophy has always been an active subject of discussion and will continue to do so. In addition, although abstract philosophical thought experiments are fun and engaging, most people tend to latch onto a physical artifact or symbol as a constant reminder of their philosophical convictions.

## Static site structure
- `index.html`: Single-page UI with form inputs and grid placeholder for the weeks visualization.
- `style.css`: Base theme, layout, and legend styling.
- `script.js`: Client-side logic (runs fully in-browser; renders the grid live as you edit inputs).
- `CNAME`: Custom domain binding (`suhastamvada.com`) for GitHub Pages.

## Local development (plain static)
- Open `index.html` directly, or serve locally: `python -m http.server 8000` then visit `http://localhost:8000`.
- For auto-refresh while designing, you can use `npx live-server .` (optional; no build step required).
- Calculations run entirely client-side; visitors never trigger redeploys.

## Deploying to GitHub Pages
1. Push this repo to GitHub.
2. Settings → Pages: Source `main`, folder `/ (root)`.
3. Keep the `CNAME` file so Pages serves `suhastamvada.com`.
4. DNS: add A records for `suhastamvada.com` to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. Optional: `www` CNAME to `<username>.github.io`.
5. Enforce HTTPS in Pages settings after DNS propagates.

## Next steps
- Tune the visual design (colors, spacing, typography) now that the grid renders live.
- Add export/sharing options (PNG download) and refine copy.
- Add lightweight tests for date math if desired (still fully client-side).
