# Today Rate — Majestic Jewellers Studio

A responsive, mobile-first & desktop-ready daily gold rate poster and animated video studio built for **Majestic Jewellers (Since 1970), Tirur**, powered by **React (Vite + Tailwind CSS)**, **Supabase (Database & Storage)**, and **Google Gemini AI (`@google/genai`)**.

## Features

- **AI Association Poster Extraction (`gemini-2.5-flash`):** Upload or snap a photo of the daily KGSMA board rate poster to extract `date`, `22K (1g & 8g)`, `18K`, `9K`, `1g change`, and `UP / DOWN / UNCHANGED` trend in structured JSON.
- **Auto Malayalam Pavan Status:** Computes `pavan_change = change_1g * 8` and renders exact Noto Sans Malayalam copy (`കൂടി`, `കുറഞ്ഞു`, or `മാറ്റമില്ല`).
- **Supabase Ornament Folder:** Bulk-upload real jewelry photos, filter by category, toggle **Auto-Pick Daily Random Ornament**, apply client-side Smart Background Cleanup / Velvet Blend, or use **Gemini AI Velvet Studio Staging**.
- **6 Luxury Velvet Color Themes:** Emerald Green (`#0A3622`), Royal Maroon (`#4A0E17`), Midnight Sapphire (`#0D1B3E`), Deep Plum (`#2E0F29`), Charcoal Gold (`#1A1A1A`), and Ruby Velvet (`#5C0A1E`).
- **4 Instant Outputs from One Click:**
  1. Static High-Res Poster (`1080×1920`, PNG/JPG)
  2. Instagram Reel / Story Video (`9:16`, `1080×1920`, 8s animated)
  3. Portrait Feed Post Video (`4:5`, `1080×1350`, 8s animated)
  4. Landscape TV Wall / YouTube Video (`16:9`, `1920×1080`, 8s animated)
- **Background MP3 Jingle Muxing:** Upload an MP3 jingle to Supabase Storage and it automatically mixes with fade-in/fade-out into all 3 exported videos.

---

## Quick Start

### 1. Install & Run Locally
```bash
npm install
cp .env.example .env
npm run dev
```

### 2. Configure Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase dashboard, paste the entire contents of [`supabase_setup.sql`](./supabase_setup.sql), and click **Run**.
3. Copy your **Project URL** and **Anon Public Key** into `.env` (or directly into the in-app **Settings** drawer).

### 3. Configure Gemini API Key
1. Generate an API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Add it as `VITE_GEMINI_API_KEY` in `.env` or inside the in-app **Settings** drawer.

### 4. Deploy to Vercel
1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new) (Framework Preset: **Vite**).
3. Add the 3 environment variables (`VITE_GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel Project Settings.
4. Click **Deploy** (`vercel.json` is pre-configured for SPA routing).
