import { Link } from "react-router";
import { Sprout, Leaf, Wind, Milk, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const DEMOS = [
  {
    to: "/agritech",
    title: "AgriTech Precision",
    description: "Parcelles 3D, heatmaps stress hydrique, stations météo et simulation tracteur. ROI : −30% eau, +18% rendement.",
    icon: Sprout,
    gradient: "from-eco-green/15 to-agri-amber/15",
    borderColor: "border-eco-green/30",
    iconColor: "text-eco-green",
    city: "Souss-Massa · Agadir",
    badge: "Agriculture",
  },
  {
    to: "/green-fleet",
    title: "Green Fleet",
    description: "Flotte mixte diesel/électrique animée, zones ZFE, bornes de recharge et bilan carbone comparatif.",
    icon: Leaf,
    gradient: "from-eco-green/15 to-climate-blue/10",
    borderColor: "border-eco-green/25",
    iconColor: "text-eco-green",
    city: "Casablanca",
    badge: "Transport",
  },
  {
    to: "/climate-monitor",
    title: "Climate Monitor",
    description: "30 capteurs environnementaux, heatmap pollution multi-couches, zones à risque et export rapport ESG.",
    icon: Wind,
    gradient: "from-climate-blue/15 to-eco-green/10",
    borderColor: "border-climate-blue/30",
    iconColor: "text-climate-blue",
    city: "Casablanca",
    badge: "ClimaTech",
  },
  {
    to: "/dairy-logistics",
    title: "Dairy Logistics 3D",
    description: "Collecte laitière montagnarde en 3D. 15 centres de collecte, 8 citernes animées, terrain RGB et cold chain en temps réel.",
    icon: Milk,
    gradient: "from-climate-blue/15 to-agri-amber/10",
    borderColor: "border-climate-blue/25",
    iconColor: "text-climate-blue",
    city: "Région Montagneuse",
    badge: "Agro-Industrie",
  },
];

export function meta() {
  return [
    { title: "ImpactMap — AgriTech · Green Fleet · Climate Monitor · Dairy Logistics" },
    { name: "description", content: "Démos cartographiques orientées impact environnemental" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-eco-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-climate-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-2/3 left-1/2 w-72 h-72 bg-agri-amber/4 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-eco-green/30 bg-eco-green/10 text-eco-green text-xs font-medium mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-eco-green animate-pulse" />
          AgriTech · Transport Vert · Climate Tech
        </div>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          Impact<span className="text-eco-green">Map</span>
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Visualisations cartographiques 3D orientées impact environnemental et ROI mesurable
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full relative z-10">
        {DEMOS.map((demo, idx) => (
          <motion.div
            key={demo.to}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + idx * 0.15 }}
            className="h-full"
          >
            <Link
              to={demo.to}
              className={`group flex flex-col h-full glass-panel p-6 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br ${demo.gradient} border ${demo.borderColor}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg bg-white/5 ${demo.iconColor}`}>
                    <demo.icon size={22} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">{demo.title}</h2>
                    <span className="text-[10px] text-white/40 font-mono">{demo.city}</span>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${demo.iconColor} border-current opacity-60`}>
                  {demo.badge}
                </span>
              </div>
              <p className="text-sm text-white/50 mb-6 leading-relaxed flex-1">{demo.description}</p>
              <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/70 transition-colors mt-auto">
                <span>Explorer la démo</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="mt-12 text-xs text-white/20 font-mono relative z-10"
      >
        React 19 · React Router 7 · Tailwind 4 · Mapbox GL JS
      </motion.p>
    </div>
  );
}
