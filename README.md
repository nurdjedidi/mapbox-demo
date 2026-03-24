# ImpactMap — AgriTech · Green Fleet · Climate Monitor

Démos cartographiques 3D orientées **impact environnemental** et ROI mesurable, construites sur Mapbox GL JS.

## Stack technique

| Couche | Techno |
|--------|--------|
| Framework | React 19 + React Router 7 (SSR) |
| Carte | Mapbox GL JS (chargé dynamiquement côté client) |
| Style | Tailwind CSS v4 (`@theme`) |
| UI | Glassmorphism dark — Inter + JetBrains Mono |
| Animations | Framer Motion + requestAnimationFrame |
| Icons | Lucide React |
| Build | Vite 7 |

---

## Démos

### 1. AgriTech Precision — `/agritech`
Dashboard de farming de précision sur la plaine du Souss-Massa (Agadir).

- **12 parcelles 3D** (`fill-extrusion`) colorées par santé : saine / stress / critique
- Hauteur proportionnelle au rendement prévu (t/ha)
- **Heatmap switchable** : stress hydrique · traitements · rendement
- **4 stations météo** avec température, humidité, pluie 24h
- **Simulation tracteur** animée sur route TSP entre parcelles
- Alertes : stress hydrique, maladie fongique, gelée nocturne
- Style satellite (`satellite-streets-v12`)

**ROI** : −30% consommation eau, +18% rendement grâce au monitoring parcellaire.

---

### 2. Green Fleet — `/green-fleet`
Transport décarboné — flotte mixte diesel/électrique sur Casablanca.

- **10 véhicules** animés (5 diesel gris, 5 électriques verts) avec trails colorés
- **Bornes de recharge** avec slots disponibles, puissance kW, temps de charge
- **Zones ZFE** (low emission zones) en rouge — diesel restreint
- **Bilan carbone** comparatif : mode Rapide vs Éco (−27% CO₂)
- Composition flotte : barre électrique/diesel
- Alertes ZFE : véhicules diesel en zone restreinte

**ROI** : −27% émissions CO₂, réduction coût carbone de 4.90€/trajet.

---

### 3. Climate Monitor — `/climate-monitor`
Surveillance environnementale en temps réel sur Casablanca.

- **30 capteurs** (air / eau / bruit) colorés par statut (OK / alerte / critique)
- Clic capteur → fiche détaillée + mini-graphe 7 jours
- **Heatmap pollution** multi-couches (PM2.5, nitrates, bruit)
- **Timeline 2020-2026** : slider pour voir l'évolution de la pollution
- **Scénario Avant/Après** fermeture usine (impact PM2.5)
- **Zones à risque** : inondation (bleu) et sécheresse (orange) avec population exposée
- **Export rapport ESG** en CSV

**ROI** : conformité réglementaire, alertes précoces, reporting ESG automatisé.

---

## Installation

```bash
npm install

# Configurer le token Mapbox
echo "VITE_MAPBOX_TOKEN=pk.eyJ1..." > .env

npm run dev      # développement
npm run build    # build production
npm start        # serveur production
```

### `.env`
```
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

Le token est public (côté client) — restreindre aux domaines autorisés dans le dashboard Mapbox en production.

---

## Structure du projet

```
app/
├── components/
│   ├── layout/          # DemoLayout, Navbar, SidePanel (responsive)
│   ├── map/             # MapContainer (SSR-safe, dynamic import)
│   └── shared/          # StatCard, AnimatedNumber
├── demos/
│   ├── agritech/        # FarmParcelsLayer, HeatmapLayer, WeatherStations, TractorRoute
│   ├── green-fleet/     # VehicleLayer, ChargingStations, LEZones, CarbonStats
│   └── climate-monitor/ # SensorsLayer, PollutionHeatmap, RiskZones, ClimateStatsPanel
├── data/
│   ├── mock-farms.json
│   ├── mock-fleet-eco.json
│   └── mock-sensors.json
├── lib/
│   ├── mapbox/          # config, routing, geocoding
│   └── hooks/           # useMap (Context)
└── routes/              # home, agritech, green-fleet, climate-monitor
```

---

## Design system

Couleurs définies via `@theme` dans `app/app.css` :

| Token | Valeur | Usage |
|-------|--------|-------|
| `eco-green` | `#22C55E` | Électrique / sain / positif |
| `climate-blue` | `#3B82F6` | Eau / capteurs / heatmap |
| `agri-amber` | `#D97706` | Stress / bruit / agriculture |
| `danger` | `#FF3366` | Critique / alerte |
| `dark-bg` | `#0A0E1A` | Fond général |

Classes utilitaires : `.glass-panel`, `.glass-button`, `.text-glow`

---

## Notes techniques

- **SSR compatible** : Mapbox GL JS importé dynamiquement (`import("mapbox-gl")`) dans `useEffect` uniquement
- **Cleanup guards** : tous les `useEffect` wrappent le cleanup dans `try/catch` — évite le crash au changement de route
- **0 setState par frame** : animations Fleet via `ref` + DOM direct
- **Mobile** : SidePanel = bottom sheet (45vh → 80vh), Navbar compacte (icônes seules < 640px), `100dvh`
