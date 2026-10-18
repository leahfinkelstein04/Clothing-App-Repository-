# Occasion Scout

> *"Find the right store for the moment."*

An original fashion-editorial store finder inspired by high-fashion minimalism. Occasion Scout helps shoppers find authentic nearby clothing stores and boutiques tailored to specific events (e.g. weddings, job interviews, galas, birthday dinners, graduations) using real browser GPS, Google Places discovery, and server-side Gemini AI.

---

## The Concept

Someone has an event coming up—an outdoor wedding in November, a corporate finance job interview, an evening rooftop party—but does not know where to shop. Rather than searching for single items that may be out of stock, Occasion Scout interprets the event in natural language, searches verified physical clothing retailers within a strict geographical radius, and ranks them by suitability for the moment with concrete editorial styling advice.

---

## Key Features

1. **Natural-Language Occasion Interpretation**
   - Understands event context, formality levels (e.g., Cocktail / Semi-Formal, Black Tie, Smart Casual), seasonal/weather cues, and shopper preferences (clothing focus, style vibe, budget, retail categories) without gender assumptions.
   - Robust to typos and informal phrasing (e.g., `"semi formel weddng"`, `"intervew"`).

2. **Real Device GPS & Exact Haversine Distances**
   - Real browser GPS requested explicitly via `navigator.geolocation` when clicking **"Use My Location"**.
   - Manual address, city, or ZIP lookup via Google Geocoding REST API with instant fallback.
   - Strict straight-line Haversine distance calculations ($1\text{ statute mile} = 1609.344\text{ meters}$).
   - Independent radius filtering: **1, 3, 5, 10, or 25 miles**. Stores outside the radius are never shown, and radius is never silently broadened.
   - Honest empty states with one-click radius expansion suggestions.

3. **Authentic Physical Store Discovery (No Fake Businesses)**
   - Connects to Google Places API (New) to retrieve real brick-and-mortar clothing stores, boutiques, and department stores.
   - Real addresses, phone numbers, ratings, review counts, price tiers, and website links.
   - Strict deduplication by Google Place ID and normalized address.

4. **Server-Side Gemini AI Ranking & Anti-Hallucination Guardrail**
   - Uses `@google/genai` with `gemini-3.8-flash` on the server.
   - Gemini only scores and annotates stores verified in Google Places discovery.
   - **Anti-Hallucination Guarantee:** The server rejects any recommendation not tied to one of the verified Place IDs.
   - Explains in one concrete sentence why each store fits the event and specifies what garment types to shop for.

5. **Original Fashion-Editorial Visual System**
   - Understated, luxury minimalist palette: crisp white `#FFFFFF`, soft ivory `#F7F6F3`, near-black `#161616`, charcoal `#333333`, stone gray `#DCDAD5`, and warm taupe `#A79A8C`.
   - Typography: *Cormorant Garamond* editorial serif headings paired with clean *Plus Jakarta Sans*.
   - Original typographic wordmark and custom hanger + location pin monogram SVG (no protected brand assets).
   - Zero-pill metadata discipline, single-elevation cards, and clean tactile interactions.

6. **Direct Navigation & Local Bookmarking**
   - External turn-by-turn directions linking directly to Google Maps or Apple Maps.
   - Local browser storage bookmarking without requiring accounts, sign-ups, or personal data collection.

---

## Architecture & Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express, `@google/genai` SDK
- **APIs:**
  - **Gemini API:** Model `gemini-3.8-flash` for event interpretation and store ranking.
  - **Google Places API (New):** Endpoint `places:searchText` for authentic retail discovery.
  - **Google Geocoding API:** REST geocoding and reverse geocoding for device GPS and manual address lookups.
- **Quota Defense:** Tier 1 and Tier 2 listeners for Google Maps Platform quota limits with non-blocking alert banner.

---

## Local Setup & Development

### 1. Prerequisites
- Node.js 20+
- An API key with access to:
  - Gemini API (`GEMINI_API_KEY`)
  - Google Maps Platform with Places API (New) and Geocoding API enabled (`VITE_GOOGLE_MAPS_API_KEY`)

### 2. Installation
```bash
git clone <your-repository-url>
cd occasion-scout
npm install
```

### 3. Environment Configuration
Create a `.env` file based on `.env.example`:
```env
GEMINI_API_KEY="your_gemini_api_key"
VITE_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
```

> **Security Notice:** API keys must remain strictly on the server or in secure environment variables. Never commit `.env` or secret keys to source control.

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running the Automated Reliability Test Suite
```bash
npm test
```
The test suite validates:
- Statute mile-to-meter conversion ($1\text{ mi} = 1609.344\text{ m}$)
- Coordinate validation and boundary conditions
- Haversine great-circle distance accuracy
- Strict 1, 3, 5, 10, and 25-mile boundary filtering
- Place ID and normalized address deduplication
- Anti-hallucination rejection of fabricated store IDs
- Editorial distance formatting

### 6. Building for Production
```bash
npm run build
npm start
```

---

## Important Inventory & Data Limitations

- **Occasion Scout recommends WHERE to shop, not guaranteed live inventory.** Real-time in-store stock, individual sizes, garment colors, and price tags are not tracked because retailers do not expose live POS inventory data without closed enterprise agreements.
- All store records, ratings, and operating hours originate directly from the live Google Maps Platform Places API (New).

---

## License

Google-sourced code snippets are provided 'as-is' under the Apache 2.0 License. Use of Google Maps Platform is subject to the [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms).
