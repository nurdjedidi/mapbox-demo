# 🗺️ MAPBOX 3D DEMOS — Briefing Technique Complet

**Objectif :** 3 démos React Mapbox immersives avec codebase commune, routing partagé, design system unifié.

**Timeline :** 3-5 jours (1-2 jours par démo)

**Stack :** React 18, TypeScript, Vite, React Router v6, Tailwind CSS, shadcn/ui, Mapbox GL JS, Framer Motion

---

## 📁 ARCHITECTURE PROJET
```
mapbox-demos/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── map/
│   │   │   ├── MapContainer.tsx      # Wrapper Mapbox commun
│   │   │   ├── Map3DView.tsx         # Config 3D (pitch, bearing, buildings)
│   │   │   ├── RouteLayer.tsx        # Affichage routes
│   │   │   ├── MarkerCluster.tsx     # Markers avec clustering
│   │   │   └── MapControls.tsx       # Zoom, pitch, bearing controls
│   │   ├── layout/
│   │   │   ├── DemoLayout.tsx        # Layout commun (map + sidepanel)
│   │   │   ├── SidePanel.tsx         # Panel 400px glassmorphism
│   │   │   └── BottomBar.tsx         # Controls timeline/replay
│   │   └── shared/
│   │       ├── LoadingSpinner.tsx
│   │       ├── StatCard.tsx          # Cartes métriques
│   │       └── AnimatedNumber.tsx    # Compteurs animés
│   │
│   ├── demos/
│   │   ├── urban-navigator/
│   │   │   ├── UrbanNavigator.tsx    # Page principale
│   │   │   ├── RouteSearch.tsx       # Input A→B
│   │   │   ├── RouteInstructions.tsx # Turn-by-turn
│   │   │   └── RouteAnimation.tsx    # Animation trajet
│   │   │
│   │   ├── city-analytics/
│   │   │   ├── CityAnalytics.tsx
│   │   │   ├── HeatmapLayer.tsx      # Superposition heatmaps
│   │   │   ├── TimelineSlider.tsx    # Evolution temporelle
│   │   │   └── MetricsPanel.tsx      # Stats quartiers
│   │   │
│   │   └── fleet-router/
│   │       ├── FleetRouter.tsx
│   │       ├── VehicleLayer.tsx      # 10 véhicules animés
│   │       ├── OptimizationPanel.tsx # Params optimisation
│   │       └── ReplayControls.tsx    # Play/pause/speed
│   │
│   ├── lib/
│   │   ├── mapbox/
│   │   │   ├── config.ts             # Token, styles, defaults
│   │   │   ├── routing.ts            # Directions API wrapper
│   │   │   ├── geocoding.ts          # Geocoding API
│   │   │   └── utils.ts              # Calculs géométriques (Turf.js)
│   │   └── hooks/
│   │       ├── useMap.ts             # Hook Mapbox instance
│   │       ├── useRoute.ts           # Hook routing
│   │       └── useAnimatedRoute.ts   # Hook animation trajet
│   │
│   ├── styles/
│   │   ├── globals.css               # Tailwind + customs
│   │   └── mapbox-overrides.css      # Override Mapbox UI
│   │
│   ├── data/
│   │   ├── mock-vehicles.json        # Données simulation flotte
│   │   ├── mock-heatmap.json         # Données heatmaps
│   │   └── mock-routes.json          # Routes pré-calculées
│   │
│   ├── App.tsx                       # Router + Layout global
│   └── main.tsx
│
├── public/
│   └── mapbox-styles/                # Custom Mapbox styles (optionnel)
│
└── package.json
```

---

## 🎨 DESIGN SYSTEM

### Couleurs (Tailwind config)
```typescript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      // Background
      'dark-bg': '#0A0E1A',
      'dark-surface': '#151B2D',
      'dark-elevated': '#1E2840',
      
      // Accent
      'electric-blue': '#00D9FF',
      'electric-blue-dark': '#0099CC',
      
      // Status
      'success': '#00FF88',
      'warning': '#FFB800',
      'danger': '#FF3366',
      
      // Glassmorphism
      'glass': 'rgba(21, 27, 45, 0.7)',
    },
  },
}
```

### Typographie
```css
/* globals.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

body {
  font-family: 'Inter', sans-serif;
}

.font-mono {
  font-family: 'JetBrains Mono', monospace;
}
```

### Glassmorphism UI
```css
/* Classe utilitaire Tailwind */
.glass-panel {
  @apply bg-glass backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl;
}

.glass-button {
  @apply bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/20 
         rounded-lg px-4 py-2 transition-all duration-200;
}
```

---

## 🗺️ COMPOSANT MAP COMMUN

### `MapContainer.tsx` — Wrapper réutilisable
```typescript
// src/components/map/MapContainer.tsx

import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, DEFAULT_MAP_STYLE } from '@/lib/mapbox/config';

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  style?: string;
  onLoad?: (map: mapboxgl.Map) => void;
  className?: string;
  children?: React.ReactNode;
}

export const MapContainer: React.FC = ({
  center = [2.3522, 48.8566], // Paris par défaut
  zoom = 12,
  pitch = 60,
  bearing = 0,
  style = DEFAULT_MAP_STYLE,
  onLoad,
  className = '',
  children,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style,
      center,
      zoom,
      pitch,
      bearing,
      antialias: true,
      attributionControl: false,
    });

    // Activer 3D buildings
    map.on('load', () => {
      // Layer 3D buildings
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 14,
          paint: {
            'fill-extrusion-color': '#1E2840',
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height'],
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height'],
            ],
            'fill-extrusion-opacity': 0.8,
          },
        },
        labelLayerId
      );

      if (onLoad) onLoad(map);
    });

    mapRef.current = map;

    return () => map.remove();
  }, []);

  return (
    
      
      {children}
    
  );
};
```

### `lib/mapbox/config.ts` — Configuration centrale
```typescript
// src/lib/mapbox/config.ts

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const DEFAULT_MAP_STYLE = 'mapbox://styles/mapbox/dark-v11';

export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  navigation: 'mapbox://styles/mapbox/navigation-night-v1',
};

export const DEFAULT_CENTER: [number, number] = [2.3522, 48.8566]; // Paris

export const DEFAULT_ZOOM = 12;
export const DEFAULT_PITCH = 60;
export const DEFAULT_BEARING = 0;

export const ANIMATION_DURATION = 3000; // ms
export const ROUTE_LINE_WIDTH = 4;
export const ROUTE_COLOR = '#00D9FF';
```

### `lib/mapbox/routing.ts` — Wrapper Directions API
```typescript
// src/lib/mapbox/routing.ts

import { MAPBOX_TOKEN } from './config';

export interface RouteOptions {
  profile?: 'driving' | 'walking' | 'cycling' | 'driving-traffic';
  alternatives?: boolean;
  steps?: boolean;
  geometries?: 'geojson' | 'polyline' | 'polyline6';
}

export interface Route {
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  duration: number; // seconds
  distance: number; // meters
  steps?: any[];
}

export async function getRoute(
  start: [number, number],
  end: [number, number],
  options: RouteOptions = {}
): Promise {
  const {
    profile = 'driving',
    alternatives = true,
    steps = true,
    geometries = 'geojson',
  } = options;

  const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
  const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coords}?alternatives=${alternatives}&steps=${steps}&geometries=${geometries}&access_token=${MAPBOX_TOKEN}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No route found');
  }

  return data.routes;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
```

---

## 📱 DÉMO 1 : URBAN NAVIGATOR 3D

### Features
- Input recherche A→B (autocomplete Geocoding API)
- Calcul 3 routes alternatives (rapide/balanced/scenic)
- Animation trajet qui se dessine progressivement
- Turn-by-turn instructions panel
- Stats temps réel (distance, durée, ETA)
- Mode nuit/jour toggle
- Markers 3D départ/arrivée

### `UrbanNavigator.tsx` — Structure principale
```typescript
// src/demos/urban-navigator/UrbanNavigator.tsx

import React, { useState } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { DemoLayout } from '@/components/layout/DemoLayout';
import { SidePanel } from '@/components/layout/SidePanel';
import { RouteSearch } from './RouteSearch';
import { RouteInstructions } from './RouteInstructions';
import { RouteAnimation } from './RouteAnimation';
import { StatCard } from '@/components/shared/StatCard';
import { getRoute, formatDuration, formatDistance } from '@/lib/mapbox/routing';
import type { Route } from '@/lib/mapbox/routing';

export const UrbanNavigator: React.FC = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSearch = async (start: [number, number], end: [number, number]) => {
    const fetchedRoutes = await getRoute(start, end, {
      alternatives: true,
      steps: true,
    });
    setRoutes(fetchedRoutes);
    setSelectedRoute(fetchedRoutes[0]);
  };

  const handleRouteSelect = (routeIndex: number) => {
    setSelectedRoute(routes[routeIndex]);
    setIsAnimating(false);
  };

  const handleAnimate = () => {
    setIsAnimating(true);
  };

  return (
    
      <MapContainer onLoad={(map) => console.log('Map loaded', map)}>
        {selectedRoute && (
          <RouteAnimation
            route={selectedRoute}
            isAnimating={isAnimating}
            onAnimationEnd={() => setIsAnimating(false)}
          />
        )}
      

      
        

        {routes.length > 0 && (
          
            
              {routes.map((route, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRouteSelect(idx)}
                  className={`glass-button text-sm ${
                    selectedRoute === route ? 'bg-electric-blue/20 border-electric-blue' : ''
                  }`}
                >
                  {idx === 0 ? 'Rapide' : idx === 1 ? 'Balanced' : 'Scenic'}
                
              ))}
            

            {selectedRoute && (
              <>
                
                  
                  
                

                
                  {isAnimating ? 'Animation en cours...' : '🚗 Animer le trajet'}
                

                
              </>
            )}
          
        )}
      
    
  );
};
```

### `RouteSearch.tsx` — Input autocomplete
```typescript
// src/demos/urban-navigator/RouteSearch.tsx

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RouteSearchProps {
  onSearch: (start: [number, number], end: [number, number]) => void;
}

export const RouteSearch: React.FC = ({ onSearch }) => {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');

  // TODO: Implémenter autocomplete avec Mapbox Geocoding API
  // Pour MVP : utiliser coordonnées fixes Paris landmarks

  const handleSearch = () => {
    // Exemple : Tour Eiffel → Arc de Triomphe
    const start: [number, number] = [2.2945, 48.8584]; // Tour Eiffel
    const end: [number, number] = [2.295, 48.8738]; // Arc de Triomphe
    onSearch(start, end);
  };

  return (
    
      
        Départ
        <Input
          value={startQuery}
          onChange={(e) => setStartQuery(e.target.value)}
          placeholder="Tour Eiffel, Paris"
          className="glass-panel border-white/20"
        />
      

      
        Arrivée
        <Input
          value={endQuery}
          onChange={(e) => setEndQuery(e.target.value)}
          placeholder="Arc de Triomphe, Paris"
          className="glass-panel border-white/20"
        />
      

      
        🔍 Calculer l'itinéraire
      
    
  );
};
```

### `RouteAnimation.tsx` — Animation trajet
```typescript
// src/demos/urban-navigator/RouteAnimation.tsx

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { ROUTE_COLOR, ROUTE_LINE_WIDTH, ANIMATION_DURATION } from '@/lib/mapbox/config';
import type { Route } from '@/lib/mapbox/routing';

interface RouteAnimationProps {
  route: Route;
  isAnimating: boolean;
  onAnimationEnd: () => void;
}

export const RouteAnimation: React.FC = ({
  route,
  isAnimating,
  onAnimationEnd,
}) => {
  const animationRef = useRef(null);

  useEffect(() => {
    // TODO: Implémenter animation progressive de la ligne
    // Utiliser mapbox-gl map.getSource() / map.setData()
    // Animer coordinates progressivement avec requestAnimationFrame

    if (isAnimating) {
      // Animation logic here
      setTimeout(onAnimationEnd, ANIMATION_DURATION);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [route, isAnimating]);

  return null; // Ce composant manipule directement la map, pas de render
};
```

### `RouteInstructions.tsx` — Panel turn-by-turn
```typescript
// src/demos/urban-navigator/RouteInstructions.tsx

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RouteInstructionsProps {
  steps: any[];
}

export const RouteInstructions: React.FC = ({ steps }) => {
  return (
    
      Instructions
      
        
          {steps.map((step, idx) => (
            
              {idx + 1}
              
                {step.maneuver?.instruction || 'Continuer'}
                
                  {(step.distance / 1000).toFixed(1)}km
                
              
            
          ))}
        
      
    
  );
};
```

🛴 DÉMO 2 : MICRO-MOBILITY DASHBOARD
Features

Carte 3D ville avec buildings
20-50 véhicules (vélos/trottinettes) en temps réel
Heatmap disponibilité par zone
Routing optimisé utilisateur (éviter côtes, escaliers)
Filtres : type véhicule, batterie >X%, distance max
Stations parking/recharge 3D
Stats temps réel : disponibilité, usage, revenus

MicroMobility.tsx — Structure principale
typescript// src/demos/micro-mobility/MicroMobility.tsx

import React, { useState } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { DemoLayout } from '@/components/layout/DemoLayout';
import { SidePanel } from '@/components/layout/SidePanel';
import { VehicleLayer } from './VehicleLayer';
import { StationLayer } from './StationLayer';
import { AvailabilityHeatmap } from './AvailabilityHeatmap';
import { VehicleFilters } from './VehicleFilters';
import { StatsPanel } from './StatsPanel';
import { Button } from '@/components/ui/button';
import mockVehicles from '@/data/mock-mobility-vehicles.json';
import mockStations from '@/data/mock-stations.json';

type VehicleType = 'bike' | 'scooter' | 'all';

export const MicroMobility: React.FC = () => {
  const [vehicleType, setVehicleType] = useState<VehicleType>('all');
  const [minBattery, setMinBattery] = useState(20);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);

  const filteredVehicles = mockVehicles.filter(v => {
    if (vehicleType !== 'all' && v.type !== vehicleType) return false;
    if (v.battery < minBattery) return false;
    return true;
  });

  return (
    <DemoLayout>
      <MapContainer center={[2.3522, 48.8566]} zoom={13}>
        {showHeatmap && <AvailabilityHeatmap vehicles={filteredVehicles} />}
        <VehicleLayer 
          vehicles={filteredVehicles} 
          onVehicleClick={setSelectedVehicle}
        />
        <StationLayer stations={mockStations} />
      </MapContainer>

      <SidePanel title="Micro-Mobility Dashboard">
        <VehicleFilters
          vehicleType={vehicleType}
          onVehicleTypeChange={setVehicleType}
          minBattery={minBattery}
          onMinBatteryChange={setMinBattery}
        />

        <div className="mt-4">
          <Button
            onClick={() => setShowHeatmap(!showHeatmap)}
            variant={showHeatmap ? 'default' : 'outline'}
            className="w-full"
          >
            {showHeatmap ? '✅' : '⬜'} Heatmap disponibilité
          </Button>
        </div>

        <StatsPanel 
          totalVehicles={filteredVehicles.length}
          available={filteredVehicles.filter(v => v.status === 'available').length}
          inUse={filteredVehicles.filter(v => v.status === 'in_use').length}
        />

        {selectedVehicle && (
          <div className="mt-6 glass-panel p-4">
            <h3 className="text-sm font-semibold mb-2">Véhicule #{selectedVehicle}</h3>
            {/* Vehicle details */}
          </div>
        )}
      </SidePanel>
    </DemoLayout>
  );
};
VehicleLayer.tsx — Markers véhicules temps réel
typescript// src/demos/micro-mobility/VehicleLayer.tsx

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

interface Vehicle {
  id: number;
  type: 'bike' | 'scooter';
  position: [number, number];
  battery: number;
  status: 'available' | 'in_use' | 'charging';
}

interface VehicleLayerProps {
  vehicles: Vehicle[];
  onVehicleClick: (id: number) => void;
}

export const VehicleLayer: React.FC<VehicleLayerProps> = ({ vehicles, onVehicleClick }) => {
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    // TODO: Créer markers custom avec icônes vélo/trottinette
    // Couleur selon status : vert (available), rouge (in_use), jaune (charging)
    // Animation position si véhicule bouge (in_use)
    
    // Cleanup markers
    return () => {
      markersRef.current.forEach(m => m.remove());
    };
  }, [vehicles]);

  return null;
};
AvailabilityHeatmap.tsx — Heatmap disponibilité
typescript// src/demos/micro-mobility/AvailabilityHeatmap.tsx

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface AvailabilityHeatmapProps {
  vehicles: any[];
}

export const AvailabilityHeatmap: React.FC<AvailabilityHeatmapProps> = ({ vehicles }) => {
  useEffect(() => {
    // TODO: Créer heatmap layer avec densité véhicules disponibles
    // Zones rouges = peu de véhicules
    // Zones vertes = beaucoup de véhicules
  }, [vehicles]);

  return null;
};
VehicleFilters.tsx — Filtres interactifs
typescript// src/demos/micro-mobility/VehicleFilters.tsx

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

interface VehicleFiltersProps {
  vehicleType: 'bike' | 'scooter' | 'all';
  onVehicleTypeChange: (type: 'bike' | 'scooter' | 'all') => void;
  minBattery: number;
  onMinBatteryChange: (value: number) => void;
}

export const VehicleFilters: React.FC<VehicleFiltersProps> = ({
  vehicleType,
  onVehicleTypeChange,
  minBattery,
  onMinBatteryChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-white/60 mb-2 block">Type de véhicule</label>
        <Tabs value={vehicleType} onValueChange={(v) => onVehicleTypeChange(v as any)}>
          <TabsList className="w-full glass-panel">
            <TabsTrigger value="all" className="flex-1">Tous</TabsTrigger>
            <TabsTrigger value="bike" className="flex-1">🚲 Vélos</TabsTrigger>
            <TabsTrigger value="scooter" className="flex-1">🛴 Trottinettes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="glass-panel p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-white/60">Batterie min.</span>
          <span className="text-lg font-bold text-electric-blue font-mono">{minBattery}%</span>
        </div>
        <Slider
          value={[minBattery]}
          onValueChange={(values) => onMinBatteryChange(values[0])}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
    </div>
  );
};
StatsPanel.tsx — Stats temps réel
typescript// src/demos/micro-mobility/StatsPanel.tsx

import React from 'react';
import { StatCard } from '@/components/shared/StatCard';

interface StatsPanelProps {
  totalVehicles: number;
  available: number;
  inUse: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  totalVehicles,
  available,
  inUse,
}) => {
  const availabilityRate = totalVehicles > 0 
    ? Math.round((available / totalVehicles) * 100) 
    : 0;

  return (
    <div className="mt-6 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Disponibles"
          value={available}
          icon="✅"
        />
        <StatCard
          label="En cours"
          value={inUse}
          icon="🚴"
        />
      </div>
      
      <StatCard
        label="Taux disponibilité"
        value={`${availabilityRate}%`}
        icon="📊"
        trend={availabilityRate > 70 ? 'up' : availabilityRate > 40 ? 'neutral' : 'down'}
      />

      <div className="glass-panel p-4">
        <p className="text-sm text-white/60 mb-2">Flotte totale</p>
        <p className="text-3xl font-bold text-white font-mono">{totalVehicles}</p>
      </div>
    </div>
  );
};
StationLayer.tsx — Stations parking/recharge
typescript// src/demos/micro-mobility/StationLayer.tsx

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface Station {
  id: number;
  position: [number, number];
  capacity: number;
  occupied: number;
  type: 'parking' | 'charging';
}

interface StationLayerProps {
  stations: Station[];
}

export const StationLayer: React.FC<StationLayerProps> = ({ stations }) => {
  useEffect(() => {
    // TODO: Créer markers stations avec icône custom
    // Hauteur 3D proportionnelle à capacité
    // Couleur selon % occupation
  }, [stations]);

  return null;
};

📊 DATA MOCK
mock-mobility-vehicles.json
json[
  {
    "id": 1,
    "type": "bike",
    "position": [2.3522, 48.8566],
    "battery": 85,
    "status": "available"
  },
  {
    "id": 2,
    "type": "scooter",
    "position": [2.3545, 48.8580],
    "battery": 45,
    "status": "in_use"
  },
  {
    "id": 3,
    "type": "bike",
    "position": [2.3500, 48.8550],
    "battery": 92,
    "status": "available"
  }
  // ... 20-50 véhicules au total
]
mock-stations.json
json[
  {
    "id": 1,
    "position": [2.3522, 48.8566],
    "capacity": 10,
    "occupied": 7,
    "type": "parking"
  },
  {
    "id": 2,
    "position": [2.3600, 48.8600],
    "capacity": 5,
    "occupied": 2,
    "type": "charging"
  }
]

---

## 🚚 DÉMO 3 : FLEET ROUTER 3D

### Features
- 10 véhicules animés simultanément
- Routing optimisé (TSP algorithm basique)
- Stats temps réel (distance totale, fuel, temps)
- Contraintes : fenêtres horaires, capacité
- Mode replay : voir journée en 30 secondes
- Alternative routes si blocage

### `FleetRouter.tsx` — Structure principale
```typescript
// src/demos/fleet-router/FleetRouter.tsx

import React, { useState } from 'react';
import { MapContainer } from '@/components/map/MapContainer';
import { DemoLayout } from '@/components/layout/DemoLayout';
import { SidePanel } from '@/components/layout/SidePanel';
import { VehicleLayer } from './VehicleLayer';
import { OptimizationPanel } from './OptimizationPanel';
import { ReplayControls } from './ReplayControls';
import { Button } from '@/components/ui/button';
import mockVehicles from '@/data/mock-vehicles.json';

export const FleetRouter: React.FC = () => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleOptimize = () => {
    // TODO: Implémenter algorithme TSP basique
    setIsOptimized(true);
  };

  return (
    
      
        
      

      
        

        
          {isOptimized ? '✅ Optimisé' : '🚀 Optimiser les tournées'}
        

        {isOptimized && (
          <ReplayControls
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={() => setIsPlaying(false)}
          />
        )}
      
    
  );
};
```

### `VehicleLayer.tsx` — Animation 10 véhicules
```typescript
// src/demos/fleet-router/VehicleLayer.tsx

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';

interface Vehicle {
  id: number;
  route: [number, number][];
  color: string;
}

interface VehicleLayerProps {
  vehicles: Vehicle[];
  isPlaying: boolean;
}

export const VehicleLayer: React.FC = ({ vehicles, isPlaying }) => {
  useEffect(() => {
    // TODO: Implémenter animation simultanée des véhicules
    // Utiliser requestAnimationFrame + interpolation positions
  }, [vehicles, isPlaying]);

  return null;
};
```

---

## 🎭 COMPOSANTS LAYOUT COMMUNS

### `DemoLayout.tsx` — Wrapper fullscreen
```typescript
// src/components/layout/DemoLayout.tsx

import React from 'react';

interface DemoLayoutProps {
  children: React.ReactNode;
}

export const DemoLayout: React.FC = ({ children }) => {
  return (
    
      {children}
    
  );
};
```

### `SidePanel.tsx` — Panel glassmorphism
```typescript
// src/components/layout/SidePanel.tsx

import React from 'react';
import { X } from 'lucide-react';

interface SidePanelProps {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const SidePanel: React.FC = ({ title, children, onClose }) => {
  return (
    
      
        {title}
        {onClose && (
          
            
          
        )}
      
      {children}
    
  );
};
```

### `StatCard.tsx` — Carte métrique
```typescript
// src/components/shared/StatCard.tsx

import React from 'react';
import { AnimatedNumber } from './AnimatedNumber';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC = ({ label, value, icon, trend }) => {
  return (
    
      
        {icon && {icon}}
        {label}
      
      
        {typeof value === 'number' ?  : value}
      
    
  );
};
```

---

## 🚀 SETUP & DÉPLOIEMENT

### Installation
```bash
npm create vite@latest mapbox-demos -- --template react-ts
cd mapbox-demos
npm install

# Dépendances principales
npm install mapbox-gl @mapbox/mapbox-gl-geocoder
npm install react-router-dom
npm install framer-motion
npm install @turf/turf

# Tailwind + shadcn/ui
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn-ui@latest init

# shadcn components nécessaires
npx shadcn-ui@latest add button input slider tabs scroll-area
```

### `.env`
```env
VITE_MAPBOX_TOKEN=pk.eyJ1IjoibnVyZGplZGlkaSIsImEiOiJjbHh4eHh4eHgifQ.xxxxx
```

### `package.json` scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && vercel --prod"
  }
}
```

### Déploiement Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**URL finale :** `mapbox-demos.vercel.app` (ou custom domain `demo.nurdjedidi.com`)

---

## 📋 CHECKLIST DÉVELOPPEMENT

### Jour 1-2 : Setup + Démo 1 (Urban Navigator)
- [ ] Init projet Vite + React + TypeScript
- [ ] Setup Tailwind + shadcn/ui
- [ ] Composants map communs (`MapContainer`, `Map3DView`)
- [ ] Layout commun (`DemoLayout`, `SidePanel`)
- [ ] Routing Mapbox Directions API
- [ ] Animation trajet basique
- [ ] Stats + turn-by-turn UI
- [ ] Deploy preview Vercel

### Jour 3 : Démo 2 (City Analytics)
- [ ] Heatmap layers (3 métriques)
- [ ] Timeline slider
- [ ] Metrics panel avec comparaison
- [ ] 3D buildings height = métrique
- [ ] Filtres interactifs
- [ ] Deploy update

### Jour 4 : Démo 3 (Fleet Router)
- [ ] Mock data 10 véhicules
- [ ] Animation simultanée véhicules
- [ ] Algo TSP basique (ou mock routes optimisées)
- [ ] Stats optimisation
- [ ] Replay controls
- [ ] Deploy update

### Jour 5 : Polish + Landing
- [ ] Page d'accueil avec preview 3 démos
- [ ] Video screencasts 30s par démo
- [ ] Transitions Framer Motion
- [ ] Responsive mobile (si temps)
- [ ] Meta tags SEO
- [ ] Deploy final + custom domain

---

## 🎯 LIVRABLES FINAUX

1. **3 démos live** sur `demo.nurdjedidi.com`
2. **Landing page** avec preview + CTA
3. **3 vidéos screencasts** 30s (Loom ou OBS)
4. **Codebase GitHub** publique (portfolio)
5. **README technique** avec stack + features

---

## 💡 NOTES TECHNIQUES IMPORTANTES

### Performance Mapbox
- Utiliser `map.getCanvas().toBlob()` pour screenshots
- Limiter markers à <100 simultanés (utiliser clustering)
- Lazy load layers (addLayer only when needed)

### Animations fluides
- Préférer `requestAnimationFrame` à `setInterval`
- Utiliser Framer Motion pour UI animations
- Garder pitch/bearing transitions smooth (easing curves)

### Data mock
- Générer routes réalistes avec vraies coordonnées Paris
- Heatmap data : grille 100×100 points avec valeurs aléatoires
- Véhicules : 10 routes pré-calculées avec timestamps

### Mobile responsive (optionnel jour 5)
- SidePanel → BottomSheet sur mobile
- Touch gestures Mapbox (pinch zoom, rotate)
- Reduce 3D buildings detail sur mobile

---

## 🔗 RESSOURCES EXTERNES

- **Mapbox GL JS Docs :** https://docs.mapbox.com/mapbox-gl-js/
- **Mapbox Examples :** https://docs.mapbox.com/mapbox-gl-js/example/
- **shadcn/ui Components :** https://ui.shadcn.com/
- **Turf.js (geo calculations) :** https://turfjs.org/
- **Framer Motion :** https://www.framer.com/motion/

---

**FIN DU BRIEFING TECHNIQUE**

Ce document contient tout ce dont Claude Code a besoin pour créer les 3 démos.
Structure claire, composants réutilisables, stack moderne, design system unifié.

**Timeline réaliste : 3-5 jours pour un dev expérimenté React/Mapbox.**

**Mobile first / responsive**