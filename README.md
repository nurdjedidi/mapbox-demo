# Mapbox 3D Demo App

Application de démonstration de visualisation cartographique immersive, construite pour showcaser des cas d'usage à fort ROI métier sur des données géospatiales.

## Stack technique

| Couche | Techno |
|--------|--------|
| Framework | React 19 + React Router 7 (SSR) |
| Carte | Mapbox GL JS (chargé dynamiquement côté client) |
| Style | Tailwind CSS v4 (`@theme`) |
| UI | Glassmorphism dark — Inter + JetBrains Mono |
| Animations | Framer Motion |
| Icons | Lucide React |
| Build | Vite 7 |

---

## Démos

### 1. Urban Navigator 3D — `/urban-navigator`
Navigation immersive dans une ville 3D.

- Calcul de routes via **Mapbox Directions API** (3 alternatives : Rapide / Équilibré / Scenic)
- Villes : **Dubai** et **Casablanca** (12 landmarks chacune)
- Animation style Google Maps : caméra qui suit un véhicule au ras du sol (zoom 17.5, pitch 72°)
- Bearing dynamique calculé point à point — transition douce anti-saut 360°→0°
- Trail blanc derrière le véhicule, vue panoramique des buildings 3D
- Instructions turn-by-turn affichées en temps réel

**ROI démontré** : expérience utilisateur premium pour apps de navigation / tourisme urbain.

---

### 2. Micro-Mobility Dashboard — `/micro-mobility`
Dashboard opérationnel de gestion de flotte légère.

- **30 véhicules** (vélos + trottinettes) sur Dubai avec simulation temps réel
- Markers style Pony : icône SVG + barre batterie + couleur par statut
- Statuts : Disponible (vert) / En course (rouge) / En charge (orange)
- **8 stations** de parking/recharge avec jauge de capacité
- Heatmap de densité de disponibilité
- Simulation live : transitions de statut, mouvements, revenus qui s'incrémentent toutes les 2s
- KPIs : CA journalier animé, taux de rotation, alertes rebalancing avec calcul ROI (coût vs revenu potentiel)

**ROI démontré** : réduction des zones sous-desservies → +35 AED par course non manquée.

---

### 3. Geo-Sales Intelligence — `/geo-sales`
Tableau de bord géo-commercial pour PME.

- **50 clients** répartis sur 6 zones de Casablanca
- Segments : Premium (>25k MAD) · Standard · Prospect · Inactif
- Taille des markers proportionnelle au CA mensuel
- **Heatmap CA** — densité de revenus par zone géographique
- **Zones commerciales** colorées par performance (vert = fort CA, rouge = angle mort)
- Filtres : par segment et par commercial (Karim / Leila / Omar)
- Alertes : clients sans contact depuis +45 jours, prospects non couverts
- Fiche client au clic : CA, dernier contact coloré, zone, commercial

**ROI démontré** : identifier les zones à fort potentiel non couvertes → prioriser la prospection commerciale.

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
│   ├── urban-navigator/ # RouteAnimation, RouteSearch, instructions
│   ├── micro-mobility/  # VehicleLayer, StationLayer, Heatmap, Simulation
│   └── geo-sales/       # CustomerLayer, TerritoryLayer, RevenueHeatmap, Stats
├── data/
│   ├── mock-mobility-vehicles.json
│   ├── mock-stations.json
│   └── mock-customers.json
├── lib/
│   ├── mapbox/          # config, routing, geocoding
│   └── hooks/           # useMap (Context)
└── routes/              # home, urban-navigator, micro-mobility, geo-sales
```

---

## Design system

Couleurs définies via `@theme` dans `app/app.css` :

| Token | Valeur | Usage |
|-------|--------|-------|
| `electric-blue` | `#00D9FF` | Accent principal |
| `success` | `#00FF88` | Positif / disponible |
| `warning` | `#FFB800` | Alerte / charging |
| `danger` | `#FF3366` | Critique / inactif |
| `dark-bg` | `#0A0E1A` | Fond général |

Classes utilitaires : `.glass-panel`, `.glass-button`, `.text-glow`

---

## Notes techniques

- **SSR compatible** : Mapbox GL JS importé dynamiquement (`import("mapbox-gl")`) dans `useEffect` uniquement
- **Cleanup guards** : tous les `useEffect` wrappent le cleanup dans `try/catch` — évite le crash `getOwnLayer` au changement de route
- **Pas de re-renders sur animation** : progress Fleet via `ref` + DOM direct (0 setState par frame)
- **Mobile** : SidePanel = bottom sheet (45vh → 80vh), Navbar compacte (icônes seules < 640px), `100dvh`
