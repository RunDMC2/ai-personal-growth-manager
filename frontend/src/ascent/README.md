# Ascent — React/TypeScript components

This is a straight port of the HTML/CSS/JS mockup into React + TypeScript
components, structured for a Next.js app (App Router or Pages Router both
work — a couple of notes below).

## Files

```
ascent-react/
  AscentApp.tsx              <- root component, import this
  types.ts                   <- shared TypeScript types
  data.ts                    <- mock data — replace with your real Sheets data
  styles/ascent.css          <- all styles, scoped under .ascent-app
  components/
    RingProgress.tsx         <- animated gradient progress ring
    FocusOrbit.tsx           <- radial "focus mix" diagram
    TrendChart.tsx            <- Radar tab's multicolor line chart
    FloatingBackground.tsx    <- parallax line-art shapes
    Sidebar.tsx                <- nav + radar-sweep art + footer
    ChatAssistant.tsx          <- Assistant tab's chat UI
    views/
      DeckView.tsx
      FlightLogView.tsx
      AltitudeView.tsx
      TurbulenceView.tsx
      RadarView.tsx
      DebriefView.tsx
      AssistantView.tsx
```

## 1. Copy the folder in

Drop the whole `ascent-react/` folder into your project, e.g. `src/ascent/`.

## 2. Install fonts

The design uses Space Grotesk, Inter, and JetBrains Mono from Google Fonts.
Easiest path in Next.js is `next/font/google`:

```tsx
// app/layout.tsx
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-space-grotesk" });
const inter = Inter({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400","500"], variable: "--font-jetbrains-mono" });
```

Then either add `font-family: var(--font-inter), sans-serif;` etc. to
`ascent.css`, or simpler — just keep the plain `<link>` tag approach:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```
in your root `<head>` (e.g. `app/layout.tsx`'s `<head>` or `pages/_document.tsx`).

## 3. Use the component

```tsx
// app/dashboard/page.tsx
import AscentApp from "@/ascent/AscentApp";

export default function DashboardPage() {
  return <AscentApp />;
}
```

`AscentApp.tsx` already imports `./styles/ascent.css` itself, so no separate
CSS import is needed — Next.js supports importing CSS directly from a
component file.

Everything in the stylesheet is scoped under a `.ascent-app` wrapper class,
so it won't bleed into the rest of your app's styles.

## 4. Client components

Every interactive file is marked `"use client"` at the top (Sidebar, the
charts, the floating background, the chat). If you're on the Pages Router
those directives are simply ignored — no changes needed there.

## 5. Wiring up real data

Right now `data.ts` holds hand-written mock data matching the mockup
exactly. To connect it to your actual Google Sheet:

1. Replace the contents of `data.ts` with a fetch from your Sheets API
   (or a route handler that reads the sheet server-side and passes props
   down into `AscentApp`).
2. `AscentApp` currently owns all the data as static imports — the
   simplest first step is to turn it into `AscentApp({ initialData })`
   and pass server-fetched data in as a prop from your page component.
3. For the Debrief recommendations and Assistant replies, swap the
   hard-coded `recommendations` array and the `cannedAnswers` lookup in
   `ChatAssistant.tsx` for real calls to your AI backend (the comment in
   `ChatAssistant.tsx`'s `send()` function marks exactly where).

## 6. Dependencies

Just `react`, `react-dom`, and their types — nothing else. No charting
library, no animation library; the ring, chart, and orbit are all hand-built
SVG, and the parallax background is a small `requestAnimationFrame` loop.
