# 👑 Royal Love – static site (no backend)
**Login** (js/config.js): Name `ابتسام` + `080530` → princess view · Name `جليل` + admin passcode (default `jalil-2026`, change it!) → admin dashboard.
**Content**: `js/content.js`. Edit in the admin panel → ⬇️ Export → replace the file → push. Photos/audio: `media/` folder (paths like `media/a.jpg`).
**Progress** (love points, baby, scores, mood): saved in the browser (localStorage).
**Optional Supabase**: only for uploading media. Fill SUPABASE_URL/KEY in config.js and run `supabase-storage.sql`. Not needed for anything else.
**Render**: New → Static Site → connect repo → Build command: empty → Publish directory: `.` (or use render.yaml).
