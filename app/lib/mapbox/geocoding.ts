import type { CityKey } from "./config";

export interface Landmark {
  name: string;
  coords: [number, number];
  icon: string;
  city: CityKey;
}

export const LANDMARKS: Landmark[] = [
  { name: "Burj Khalifa", coords: [55.2744, 25.1972], icon: "tower", city: "dubai" },
  { name: "Dubai Mall", coords: [55.2796, 25.1985], icon: "shopping", city: "dubai" },
  { name: "Dubai Marina", coords: [55.1384, 25.0805], icon: "harbor", city: "dubai" },
  { name: "Palm Jumeirah", coords: [55.1177, 25.1124], icon: "island", city: "dubai" },
  { name: "Burj Al Arab", coords: [55.1853, 25.1412], icon: "hotel", city: "dubai" },
  { name: "Dubai Frame", coords: [55.3005, 25.2354], icon: "monument", city: "dubai" },
  { name: "Gold Souk", coords: [55.2974, 25.2867], icon: "market", city: "dubai" },
  { name: "Jumeirah Beach", coords: [55.1862, 25.2048], icon: "beach", city: "dubai" },
  { name: "Dubai Creek", coords: [55.3247, 25.2644], icon: "water", city: "dubai" },
  { name: "Mall of the Emirates", coords: [55.2004, 25.1181], icon: "shopping", city: "dubai" },
  { name: "Downtown Dubai", coords: [55.2708, 25.2048], icon: "city", city: "dubai" },
  { name: "Business Bay", coords: [55.2614, 25.1850], icon: "business", city: "dubai" },

  { name: "Mosquee Hassan II", coords: [-7.6325, 33.6087], icon: "mosque", city: "casablanca" },
  { name: "Corniche Ain Diab", coords: [-7.6650, 33.5920], icon: "beach", city: "casablanca" },
  { name: "Ancienne Medina", coords: [-7.6113, 33.6005], icon: "historic", city: "casablanca" },
  { name: "Place Mohammed V", coords: [-7.6186, 33.5893], icon: "square", city: "casablanca" },
  { name: "Quartier Habous", coords: [-7.6069, 33.5790], icon: "market", city: "casablanca" },
  { name: "Morocco Mall", coords: [-7.6583, 33.5764], icon: "shopping", city: "casablanca" },
  { name: "Gare Casa Voyageurs", coords: [-7.5898, 33.5900], icon: "train", city: "casablanca" },
  { name: "Parc de la Ligue Arabe", coords: [-7.6206, 33.5863], icon: "park", city: "casablanca" },
  { name: "Twin Center", coords: [-7.6283, 33.5844], icon: "tower", city: "casablanca" },
  { name: "Cathedrale Sacre-Coeur", coords: [-7.6178, 33.5909], icon: "church", city: "casablanca" },
  { name: "Marina Casablanca", coords: [-7.6350, 33.6020], icon: "harbor", city: "casablanca" },
  { name: "Anfa Place", coords: [-7.6497, 33.5808], icon: "shopping", city: "casablanca" },
];

export function getLandmarksByCity(city: CityKey): Landmark[] {
  return LANDMARKS.filter((l) => l.city === city);
}

export function searchLandmarks(query: string, city?: CityKey): Landmark[] {
  const normalizedQuery = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return LANDMARKS.filter((l) => {
    if (city && l.city !== city) return false;
    const normalizedName = l.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return normalizedName.includes(normalizedQuery);
  });
}
