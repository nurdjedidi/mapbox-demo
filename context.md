markdown# 🌍 MAPBOX 3D DEMOS — REFONTE COMPLETE IMPACT/CLIMAT

**Objectif :** Refaire les 3 démos Mapbox pour cibler les industries à impact : AgriTech, Transport Vert, Climate Tech.

**Timeline :** 5-7 jours pour remplacer les démos existantes

**Stack :** React 19, TypeScript, Vite, React Router 7, Tailwind v4, Mapbox GL JS, Framer Motion

**Contrainte :** Réutiliser au maximum la codebase existante (MapContainer, Layout, hooks, design system)

---

## 🎯 NOUVELLE CIBLE CLIENTS

**Industries prioritaires :**
1. AgriTech (agriculture de précision, monitoring cultures)
2. Transport & Logistics (décarbonation, fleet électrique)
3. Climate Tech (monitoring environnemental, pollution, risques)

**Clients types :**
- Startups impact (Climate FieldView, Ynsect, Too Good To Go, Plume Labs)
- Coopératives agricoles digitales
- Transporteurs qui verdissent
- Municipalités smart city
- ONGs environnement
- Industriels ESG compliance

**Valeurs alignées :**
- Impact environnemental positif
- Durabilité
- Aide à la transition écologique
- Data au service du climat

---

## 📁 STRUCTURE PROJET (conserver)
```
app/
├── components/
│   ├── layout/          # DemoLayout, Navbar, SidePanel — GARDER
│   ├── map/             # MapContainer, Map3DView — GARDER
│   └── shared/          # StatCard, AnimatedNumber — GARDER
├── demos/
│   ├── agritech/        # NOUVELLE DÉMO 1 (remplace urban-navigator)
│   ├── green-fleet/     # NOUVELLE DÉMO 2 (remplace micro-mobility)
│   └── climate-monitor/ # NOUVELLE DÉMO 3 (remplace geo-sales)
├── data/
│   ├── mock-farms.json           # NOUVEAU
│   ├── mock-fleet-eco.json       # NOUVEAU
│   └── mock-sensors.json         # NOUVEAU
├── lib/
│   ├── mapbox/          # config, routing, geocoding — GARDER
│   └── hooks/           # useMap — GARDER
└── routes/              # home, agritech, green-fleet, climate-monitor
```

---

## 🌾 DÉMO 1 : AGRITECH — Precision Farming Dashboard

**URL :** `/agritech`

**Concept :** Dashboard exploitation agricole avec monitoring parcelles en temps réel

### Features Principales

**Carte parcelles agricoles 3D**
- 10-15 parcelles polygonales (GeoJSON)
- Couleur selon santé culture : Vert (sain) → Jaune (stress) → Rouge (maladie)
- Extrusion 3D hauteur = rendement prévu (ton/hectare)
- Clic parcelle → Détail culture, surface, état, dernière intervention

**Heatmap multi-layers**
- Couche 1 : Stress hydrique (manque eau)
- Couche 2 : Zones traitées (pesticides/engrais)
- Couche 3 : Rendement prévu
- Toggle ON/OFF par layer

**Routing tracteur optimisé**
- Trajet optimisé pour traiter 5 parcelles
- Éviter zones déjà traitées (affichées en gris)
- Calcul : distance, temps, fuel, surface couverte
- Animation tracteur qui se déplace (comme véhicule Urban Navigator mais tracteur icon)

**Stations météo**
- 3-4 markers stations météo sur la carte
- Popup : Température, humidité, pluie dernières 24h, prévision

**Timeline évolution cultures**
- Slider temporel : Semis (mars) → Croissance (avril-juin) → Récolte (juillet)
- Parcelles changent de couleur selon stade
- Graph rendement qui évolue

**Alertes & Stats**
- Panel alertes : "Parcelle C3 stress hydrique" / "Maladie détectée parcelle B2"
- Stats dashboard :
  - Hectares total
  - Rendement moyen prévu
  - Consommation eau (m³)
  - % parcelles saines vs stress
  - CO2 séquestré (bonus climat)

### Structure Code
```typescript
// app/demos/agritech/AgriTech.tsx

import { MapContainer } from '@/components/map/MapContainer';
import { DemoLayout } from '@/components/layout/DemoLayout';
import { SidePanel } from '@/components/layout/SidePanel';
import { FarmParcelsLayer } from './FarmParcelsLayer';
import { HeatmapLayer } from './HeatmapLayer';
import { TractorRoute } from './TractorRoute';
import { WeatherStations } from './WeatherStations';
import { TimelineSlider } from './TimelineSlider';
import { AlertsPanel } from './AlertsPanel';
import { StatsPanel } from './StatsPanel';
import { Tabs } from '@/components/ui/tabs';
import mockFarms from '@/data/mock-farms.json';

type HeatmapType = 'hydric' | 'treatment' | 'yield';

export default function AgriTech() {
  const [selectedHeatmap, setSelectedHeatmap] = useState('hydric');
  const [cropStage, setCropStage] = useState('growth'); // semis, growth, harvest
  const [showTractorRoute, setShowTractorRoute] = useState(false);

  return (
    
       {/* Maroc agricole */}
        
        
        {showTractorRoute && }
        
      

      
        
          
            Stress Hydrique
            Traitements
            Rendement
          
        

        <TimelineSlider
          stage={cropStage}
          onChange={setCropStage}
          stages={['semis', 'growth', 'harvest']}
        />

        <button onClick={() => setShowTractorRoute(!showTractorRoute)}>
          {showTractorRoute ? 'Masquer' : 'Afficher'} Route Tracteur
        

        
        
      
    
  );
}
```

### Data Mock
```json
// app/data/mock-farms.json
{
  "parcels": [
    {
      "id": "A1",
      "name": "Parcelle Blé A1",
      "coordinates": [[7.09, 33.89], [7.10, 33.89], [7.10, 33.88], [7.09, 33.88]],
      "crop": "Blé",
      "area_hectares": 12.5,
      "health": "healthy",
      "yield_predicted": 6.2,
      "last_treatment": "2026-03-15",
      "irrigation_m3": 340
    },
    {
      "id": "B2",
      "name": "Parcelle Maïs B2",
      "coordinates": [[7.11, 33.89], [7.12, 33.89], [7.12, 33.88], [7.11, 33.88]],
      "crop": "Maïs",
      "area_hectares": 8.3,
      "health": "stress",
      "yield_predicted": 4.1,
      "last_treatment": "2026-03-10",
      "irrigation_m3": 520
    }
    // ... 10-15 parcelles total
  ],
  "weatherStations": [
    {
      "id": 1,
      "position": [7.095, 33.885],
      "temp": 24,
      "humidity": 62,
      "rain_24h": 0,
      "forecast": "Ensoleillé"
    }
  ],
  "alerts": [
    {
      "id": 1,
      "type": "hydric_stress",
      "parcel": "B2",
      "message": "Stress hydrique détecté parcelle B2",
      "severity": "warning"
    },
    {
      "id": 2,
      "type": "disease",
      "parcel": "C3",
      "message": "Maladie fongique suspectée parcelle C3",
      "severity": "critical"
    }
  ],
  "stats": {
    "total_hectares": 145,
    "avg_yield": 5.4,
    "water_consumption_m3": 12400,
    "parcels_healthy": 12,
    "parcels_stress": 3,
    "co2_sequestered_tons": 280
  }
}
```

### Composants Clés

**FarmParcelsLayer.tsx** — Polygones parcelles 3D
- addLayer type 'fill-extrusion'
- Couleur selon health (vert/jaune/rouge)
- Hauteur selon yield_predicted
- Popup au clic avec détails culture

**HeatmapLayer.tsx** — Heatmap stress/traitement/rendement
- Layer 'heatmap' Mapbox
- Data points générés en grille sur zone agricole
- Intensité selon type sélectionné

**TractorRoute.tsx** — Animation tracteur
- Route calculée entre 5 parcelles (Directions API ou TSP simple)
- Icon tracteur custom SVG
- Animation position comme Urban Navigator
- Trail vert derrière

**WeatherStations.tsx** — Markers stations météo
- Icon nuage/soleil selon météo
- Popup avec données temp/humidité/pluie

---

## 🚛 DÉMO 2 : GREEN FLEET — Transport Décarbonné

**URL :** `/green-fleet`

**Concept :** Optimisation tournées avec focus empreinte carbone

### Features Principales

**Fleet routing multi-véhicules**
- 10 véhicules : 5 diesel + 5 électriques
- Routing optimisé (réutiliser code Fleet Router actuel)
- **NOUVEAU :** 2 modes calcul route
  - Mode "Rapide" (standard)
  - Mode "Eco" (moins CO2, évite côtes, vitesse modérée)

**Calcul empreinte carbone**
- CO2 émis par trajet (kg)
- Comparaison diesel vs électrique même tournée
- Graph barres : CO2 route rapide vs route eco
- Stats cumulées : Total CO2 jour, semaine, mois
- Économies CO2 si passage full électrique

**Véhicules électriques — Bornes recharge**
- Markers bornes de recharge sur carte
- Autonomie véhicule électrique affichée
- Calcul : peut-il finir tournée sans recharge ?
- Si non, route passe par borne (détour auto)
- Temps recharge estimé

**Zones Low-Emission**
- Polygones zones LEZ (Low Emission Zone) urbaines
- Alertes si véhicule diesel entre en LEZ
- Suggestion reroutage ou switch véhicule électrique

**Stats Impact**
- Panel stats :
  - CO2 total émis (kg)
  - CO2 économisé vs route standard
  - % flotte électrique
  - Litres fuel diesel consommés
  - Coût carbone (€ si taxe carbone)
- Graph évolution CO2 mensuel (timeline)

### Structure Code
```typescript
// app/demos/green-fleet/GreenFleet.tsx

import { MapContainer } from '@/components/map/MapContainer';
import { DemoLayout } from '@/components/layout/DemoLayout';
import { SidePanel } from '@/components/layout/SidePanel';
import { VehicleLayer } from './VehicleLayer';
import { ChargingStations } from './ChargingStations';
import { LEZones } from './LEZones';
import { CarbonStats } from './CarbonStats';
import { RouteComparison } from './RouteComparison';
import mockFleet from '@/data/mock-fleet-eco.json';

type RouteMode = 'fast' | 'eco';

export default function GreenFleet() {
  const [routeMode, setRouteMode] = useState('fast');
  const [showLEZ, setShowLEZ] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  return (
    
      
        
        
        {showLEZ && }
      

      
        
          <button
            onClick={() => setRouteMode('fast')}
            className={routeMode === 'fast' ? 'active' : ''}
          >
            ⚡ Mode Rapide
          
          <button
            onClick={() => setRouteMode('eco')}
            className={routeMode === 'eco' ? 'active' : ''}
          >
            🌱 Mode Eco (-25% CO2)
          
        

        

        

        
          <input
            type="checkbox"
            checked={showLEZ}
            onChange={(e) => setShowLEZ(e.target.checked)}
          />
          Afficher zones Low-Emission
        
      
    
  );
}
```

### Data Mock
```json
// app/data/mock-fleet-eco.json
{
  "vehicles": [
    {
      "id": 1,
      "type": "diesel",
      "position": [2.35, 48.86],
      "route": [[2.35, 48.86], [2.36, 48.87], ...],
      "co2_kg": 45,
      "fuel_liters": 18
    },
    {
      "id": 2,
      "type": "electric",
      "position": [2.34, 48.85],
      "route": [[2.34, 48.85], [2.35, 48.86], ...],
      "battery_percent": 78,
      "autonomy_km": 120,
      "co2_kg": 0
    }
    // ... 10 véhicules total
  ],
  "chargingStations": [
    {
      "id": 1,
      "position": [2.355, 48.865],
      "available_slots": 3,
      "power_kw": 50,
      "charge_time_min": 30
    }
  ],
  "lezZones": [
    {
      "id": 1,
      "name": "Paris Centre LEZ",
      "coordinates": [[2.33, 48.86], [2.37, 48.86], [2.37, 48.84], [2.33, 48.84]],
      "restriction": "Diesel Euro 4 interdit"
    }
  ],
  "stats": {
    "total_co2_kg": 425,
    "saved_co2_kg": 120,
    "co2_fast_kg": 425,
    "co2_eco_kg": 305,
    "fuel_liters_total": 180,
    "carbon_cost_eur": 85
  }
}
```

### Composants Clés

**VehicleLayer.tsx** — Véhicules diesel vs électrique
- Icons différents : 🚛 diesel / ⚡ électrique
- Couleur trail : noir (diesel) / vert (électrique)
- Badge CO2 au-dessus du véhicule

**ChargingStations.tsx** — Bornes recharge
- Icon ⚡ custom
- Popup : slots dispo, puissance, temps charge
- Highlight si véhicule électrique proche avec batterie <30%

**LEZones.tsx** — Zones Low-Emission
- Polygones rouges semi-transparents
- Label "LEZ — Diesel interdit"
- Alert si véhicule diesel entre

**CarbonStats.tsx** — Panel stats carbone
- Graph barres CO2 rapide vs eco
- Compteur CO2 économisé animé
- Badge "🌱 -120kg CO2 économisés"

---

## 🌍 DÉMO 3 : CLIMATE MONITOR — Surveillance Environnementale

**URL :** `/climate-monitor`

**Concept :** Carte monitoring environnemental temps réel (pollution, risques climatiques)

### Features Principales

**Capteurs environnementaux**
- 30-50 capteurs sur carte (ville ou région)
- Types :
  - Qualité air (PM2.5, NO2, O3)
  - Qualité eau (pH, nitrates, métaux lourds)
  - Bruit (dB)
  - Température
- Couleur marker selon niveau : Vert (bon) → Orange (moyen) → Rouge (mauvais)
- Clic capteur → Graph évolution 7 derniers jours

**Heatmap pollution multi-layers**
- Couche 1 : Pollution air (PM2.5)
- Couche 2 : Pollution eau
- Couche 3 : Pollution sonore
- Toggle ON/OFF par layer
- Intensité couleur selon concentration

**Timeline évolution pollution**
- Slider temporel : 2020 → 2026
- Heatmap change selon année
- Graph global pollution qui baisse/monte
- Marqueurs événements : "2022 : Mise en place ZFE" / "2024 : Fermeture usine X"

**Zones à risque climatique**
- Polygones zones inondables (bleu)
- Polygones zones sécheresse (orange)
- Polygones zones incendie (rouge)
- Popup : Niveau risque, population exposée, mesures préventives

**Alertes dépassement seuils**
- Panel alertes temps réel :
  - "Capteur C12 : PM2.5 dépasse seuil OMS"
  - "Zone Nord : Qualité air dangereuse"
  - "Rivière X : Nitrates >50mg/L (limite UE)"
- Sévérité : Info / Warning / Critical

**Comparaison avant/après actions**
- Toggle "Avant/Après fermeture usine Y"
- Heatmap pollution change
- Stats : -35% PM2.5 dans rayon 2km

**Stats & Export**
- Panel stats :
  - % capteurs conformes réglementation
  - Zones en dépassement
  - Population exposée pollution
  - Évolution annuelle pollution
- Bouton "Export rapport ESG" (download CSV/PDF)

### Structure Code
```typescript
// app/demos/climate-monitor/ClimateMonitor.tsx

import { MapContainer } from '@/components/map/MapContainer';
import { DemoLayout } from '@/components/layout/DemoLayout';
import { SidePanel } from '@/components/layout/SidePanel';
import { SensorsLayer } from './SensorsLayer';
import { PollutionHeatmap } from './PollutionHeatmap';
import { RiskZones } from './RiskZones';
import { TimelineSlider } from './TimelineSlider';
import { AlertsPanel } from './AlertsPanel';
import { StatsPanel } from './StatsPanel';
import mockSensors from '@/data/mock-sensors.json';

type PollutionType = 'air' | 'water' | 'noise';

export default function ClimateMonitor() {
  const [selectedPollution, setSelectedPollution] = useState('air');
  const [year, setYear] = useState(2026);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [beforeAfter, setBeforeAfter] = useState('after');

  return (
    
       {/* Casablanca */}
        
        
        {showRiskZones && }
      

      
        
          
            Pollution Air
            Pollution Eau
            Pollution Sonore
          
        

        

        
          <button
            onClick={() => setBeforeAfter('before')}
            className={beforeAfter === 'before' ? 'active' : ''}
          >
            Avant fermeture usine
          
          <button
            onClick={() => setBeforeAfter('after')}
            className={beforeAfter === 'after' ? 'active' : ''}
          >
            Après fermeture usine (-35% PM2.5)
          
        

        
          <input
            type="checkbox"
            checked={showRiskZones}
            onChange={(e) => setShowRiskZones(e.target.checked)}
          />
          Afficher zones à risque
        

        
        

        📊 Export Rapport ESG
      
    
  );
}
```

### Data Mock
```json
// app/data/mock-sensors.json
{
  "sensors": [
    {
      "id": 1,
      "type": "air",
      "position": [-7.59, 33.57],
      "pm25": 42,
      "no2": 38,
      "o3": 55,
      "status": "warning",
      "history_7d": [35, 38, 42, 45, 40, 38, 42]
    },
    {
      "id": 2,
      "type": "water",
      "position": [-7.60, 33.58],
      "ph": 7.2,
      "nitrates": 48,
      "heavy_metals": 0.02,
      "status": "good",
      "history_7d": [45, 46, 48, 47, 48, 49, 48]
    },
    {
      "id": 3,
      "type": "noise",
      "position": [-7.58, 33.56],
      "decibels": 72,
      "status": "critical",
      "history_7d": [68, 70, 72, 75, 73, 71, 72]
    }
    // ... 30-50 capteurs
  ],
  "riskZones": [
    {
      "id": 1,
      "type": "flood",
      "name": "Zone inondable Oued Bouskoura",
      "coordinates": [[-7.62, 33.55], [-7.60, 33.55], [-7.60, 33.53], [-7.62, 33.53]],
      "risk_level": "high",
      "population_exposed": 12000
    },
    {
      "id": 2,
      "type": "drought",
      "name": "Zone stress hydrique Sud",
      "coordinates": [[-7.65, 33.50], [-7.63, 33.50], [-7.63, 33.48], [-7.65, 33.48]],
      "risk_level": "medium",
      "population_exposed": 8500
    }
  ],
  "alerts": [
    {
      "id": 1,
      "sensor_id": 1,
      "type": "threshold_exceeded",
      "message": "PM2.5 dépasse seuil OMS (>25 µg/m³)",
      "severity": "critical",
      "timestamp": "2026-03-23T14:30:00Z"
    },
    {
      "id": 2,
      "sensor_id": 3,
      "type": "noise_pollution",
      "message": "Pollution sonore >70dB zone résidentielle",
      "severity": "warning",
      "timestamp": "2026-03-23T15:00:00Z"
    }
  ],
  "stats": {
    "sensors_compliant_percent": 68,
    "zones_exceeding": 8,
    "population_exposed_pollution": 45000,
    "avg_pm25_reduction_yearly": -12,
    "water_quality_index": 72
  }
}
```

### Composants Clés

**SensorsLayer.tsx** — Capteurs environnementaux
- Icons différents selon type (🌬️ air, 💧 eau, 🔊 bruit)
- Couleur selon status (vert/orange/rouge)
- Popup avec valeurs + mini-graph 7 jours

**PollutionHeatmap.tsx** — Heatmap pollution
- Layer 'heatmap' Mapbox
- Data selon type sélectionné (air/water/noise)
- Change selon year timeline
- Intensité réduite si scenario='after'

**RiskZones.tsx** — Zones à risque climatique
- Polygones colorés selon type risque
- Label + icône (🌊 inondation, 🌵 sécheresse, 🔥 incendie)
- Popup : niveau risque, population, mesures

**AlertsPanel.tsx** — Panel alertes temps réel
- Liste scrollable alertes
- Badge sévérité (info/warning/critical)
- Clic alerte → zoom sur capteur concerné

---

## 🎨 DESIGN SYSTEM (conserver actuel)

**Couleurs (déjà définies dans app.css) :**
- `electric-blue` #00D9FF → Accent
- `success` #00FF88 → Positif/sain
- `warning` #FFB800 → Alerte/stress
- `danger` #FF3366 → Critique/pollution
- `dark-bg` #0A0E1A → Fond

**Nouvelles couleurs thématiques :**
```css
@theme {
  --color-eco-green: #22C55E;
  --color-climate-blue: #3B82F6;
  --color-agri-brown: #92400E;
}
```

**Classes utilitaires (garder) :**
- `.glass-panel`
- `.glass-button`
- `.text-glow`

---

## 🚀 MIGRATION ÉTAPE PAR ÉTAPE

### Jour 1 — Démo AgriTech

**Matin (3h) :**
- Créer `app/demos/agritech/` folder
- Créer `mock-farms.json`
- Component `AgriTech.tsx` structure de base
- `FarmParcelsLayer.tsx` polygones 3D

**Après-midi (3h) :**
- `HeatmapLayer.tsx` 3 layers
- `TractorRoute.tsx` routing + animation
- `WeatherStations.tsx` markers
- `AlertsPanel.tsx` + `StatsPanel.tsx`

**Soir (1h) :**
- Timeline slider
- Polish UI
- Test responsive

---

### Jour 2 — Démo Green Fleet

**Matin (3h) :**
- Créer `app/demos/green-fleet/` folder
- Créer `mock-fleet-eco.json`
- Component `GreenFleet.tsx` structure
- Réutiliser code VehicleLayer (adapter diesel/électrique)

**Après-midi (3h) :**
- `ChargingStations.tsx` bornes recharge
- `LEZones.tsx` zones low-emission
- Mode eco vs fast routing
- Calcul CO2 par trajet

**Soir (1h) :**
- `CarbonStats.tsx` panel stats
- `RouteComparison.tsx` graph
- Polish + test

---

### Jour 3 — Démo Climate Monitor

**Matin (3h) :**
- Créer `app/demos/climate-monitor/` folder
- Créer `mock-sensors.json`
- Component `ClimateMonitor.tsx` structure
- `SensorsLayer.tsx` capteurs multiples

**Après-midi (3h) :**
- `PollutionHeatmap.tsx` 3 layers pollution
- `RiskZones.tsx` zones risque climatique
- Timeline 2020-2026
- Before/After scenario

**Soir (1h) :**
- `AlertsPanel.tsx` alertes
- `StatsPanel.tsx` + export button
- Polish + test

---

### Jour 4 — Homepage & Navigation

**Matin (2h) :**
- Update `app/routes/home.tsx`
- 3 cards preview nouvelles démos
- Screenshots temporaires (avant screencasts)
- Texte pitch par démo

**Après-midi (2h) :**
- Update Navbar links
- Breadcrumbs
- Meta tags SEO
- README update

---

### Jour 5 — Polish & Deploy

**Matin (2h) :**
- Tests toutes démos
- Fix bugs
- Responsive mobile
- Animations smooth

**Après-midi (2h) :**
- Deploy Vercel
- Screencasts 3×30s
- Update portfolio links

---

## 📊 CHECKLIST FINALE

### Code
- [ ] 3 démos fonctionnelles
- [ ] Responsive mobile
- [ ] Pas d'erreurs console
- [ ] SSR compatible
- [ ] Data mock réalistes

### Contenu
- [ ] Textes pitch par démo (focus ROI impact)
- [ ] Stats crédibles (sources si possible)
- [ ] Alertes pertinentes secteur

### Déploiement
- [ ] Build sans warnings
- [ ] Deploy Vercel production
- [ ] URLs custom domain configurées
- [ ] 3 screencasts 30s
- [ ] Screenshots haute qualité

### Portfolio
- [ ] Homepage actualisée
- [ ] Meta description SEO
- [ ] LinkedIn/Malt links updated

---

## 🎯 NOUVEAUX POSITIONNEMENTS

### LinkedIn Headline
```
Je transforme vos données environnementales en cartes 3D actionnables | React Mapbox | AgriTech · Transport Vert · Climate Tech | demo.nurdjedidi.com
```

### Malt Description (début)
```
DÉVELOPPEUR MAPBOX — DASHBOARDS IMPACT ENVIRONNEMENTAL

Je crée des interfaces cartographiques 3D pour la transition écologique :

🌾 AgriTech — Monitoring parcelles, optimisation irrigation
🚛 Transport Vert — Fleet routing décarbonné, empreinte CO2
🌍 Climate Tech — Surveillance pollution, zones à risque climatique

Stack : React, Mapbox GL JS, TypeScript, Tailwind
```

### À Propos (framework PAS adapté)
```
PROBLÈME — Les données environnementales existent mais personne ne les visualise efficacement.

Vous collectez des données capteurs, GPS flotte, parcelles agricoles — 
mais aucun moyen de transformer ça en décisions actionnables pour la transition écologique.

Résultat : opportunités d'impact manquées, inefficacités invisibles, reporting ESG complexe.

SOLUTION — Je transforme vos données environnementales en interfaces cartographiques 3D.

Pas des tableaux Excel ou dashboards génériques.
Des expériences immersives : monitoring temps réel, routing optimisé carbone, alertes pollution.

[...suite identique structure précédente mais focus impact/climat...]
```

---

## 💡 CLIENTS CIBLES CONCRETS

### AgriTech
- **Startups FR :** Ekylibre, Javelot, Weenat, Smag, Naïo Technologies
- **Coopératives :** InVivo, Terrena, Axéréal (digitalisent)
- **Maghreb :** OCP (engrais), coopératives olive/agrumes Maroc

### Transport Vert
- **Startups Logistics :** Frichti, Cajoo, Stuart, Yper (verdissent flottes)
- **Transporteurs :** Geodis, FM Logistic, CTM Maroc (transition électrique)
- **Municipalités :** Flottes publiques Paris, Lyon, Casablanca

### Climate Tech
- **Startups :** Plume Labs (qualité air), Energiency (industrie verte), Sami (carbone)
- **Collectivités :** Smart city Casablanca, Paris, Nantes
- **ONGs :** Greenpeace, WWF, associations locales environnement

---

**FIN DU BRIEFING TECHNIQUE**

Ce document contient tout pour refaire les 3 démos orientées impact environnemental.
Timeline réaliste : 5 jours développement.
Codebase réutilisée au maximum, focus sur data mock et logique métier impact.

🌍 Let's build for climate. 🚀