# Context: Dairy Supply Chain 3D (Soummam Edition)
## Vision
A specialized 3D logistics dashboard for raw milk collection in mountainous regions (East Algeria/Bejaia). The goal is to optimize the "Cold Chain" and collection routes using 3D terrain analysis.

## Route: `/dairy-logistics`
Focus: Real-time collection monitoring from mountain farms to the processing plant (Akbou Hub).

## Technical Requirements (Aligned with ImpactMap Stack)
- **Framework:** React 19 + dynamic Mapbox import.
- **Map Style:** `mapbox://styles/mapbox/satellite-v11` with **Terrain RGB** enabled for 3D mountains.
- **UI:** Glassmorphism dark panel (consistent with current design system).

## Core Features
1. **The "Akbou Hub" (3D Model/Icon):**
   - Central point representing the main factory.
   - Pulse animation (eco-green) indicating operational status.

2. **Collection Points (The "Centres de Collecte"):**
   - 15-20 points distributed in the mountainous East region.
   - **3D Extrusion:** Height represents current milk volume stored (Liters).
   - **Color Logic:** Blue (Cold OK) -> Orange (Temp Warning) -> Red (Critical Delay).

3. **Active Fleet (Milk Tankers):**
   - 8 tankers animated along routes.
   - **Terrain Awareness:** Show altitude/slope impact on speed.
   - Hover tanker: Shows "Temperature: 3.8°C" and "Filling: 85%".

4. **Stats Panel (ROI & Ops):**
   - **Total Daily Collection:** Animated number (Liters).
   - **Cold Chain Compliance:** Percentage.
   - **Fuel Optimization:** Calculated gain via 3D route planning vs 2D standard.

## Data Structure (Mock)
- `mock-dairy.json`: Contains coordinates for farms, current volumes, and tanker positions centered around Bejaia/Akbou (36.45, 4.54).

## Styling (Tailwind v4)
- Primary: `var(--eco-green)` for healthy collection.
- Warning: `var(--agri-amber)` for temperature deviations.
- Info: `var(--climate-blue)` for the milk flow.