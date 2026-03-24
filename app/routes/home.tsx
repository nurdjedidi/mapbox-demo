import { Link } from "react-router";
import { Map, Bike, ArrowRight, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";

const DEMOS = [
  {
    to: "/urban-navigator",
    title: "Urban Navigator 3D",
    description: "Navigation immersive avec routes alternatives, animation de trajet et instructions turn-by-turn",
    icon: Map,
    gradient: "from-electric-blue/20 to-blue-600/20",
    borderColor: "border-electric-blue/30",
    iconColor: "text-electric-blue",
    city: "Dubai & Casablanca",
  },
  {
    to: "/micro-mobility",
    title: "Micro-Mobility",
    description: "Dashboard temps reel avec vehicules, heatmap de disponibilite et stations de recharge",
    icon: Bike,
    gradient: "from-success/20 to-emerald-600/20",
    borderColor: "border-success/30",
    iconColor: "text-success",
    city: "Dubai",
  },
  {
    to: "/geo-sales",
    title: "Geo-Sales Intelligence",
    description: "Portefeuille clients sur carte, heatmap CA, zones commerciales et alertes de relance",
    icon: BarChart2,
    gradient: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
    city: "Casablanca",
  },
];

export function meta() {
  return [
    { title: "Mapbox 3D Demos" },
    { name: "description", content: "Immersive 3D map demos with Mapbox GL" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-electric-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-warning/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 relative z-10"
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
          Mapbox <span className="text-electric-blue text-glow">3D</span> Demos
        </h1>
        <p className="text-lg text-white/50 max-w-xl mx-auto">
          Explorez des visualisations cartographiques immersives — Dubai & Casablanca
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full relative z-10">
        {DEMOS.map((demo, idx) => (
          <motion.div
            key={demo.to}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + idx * 0.15 }}
          >
            <Link
              to={demo.to}
              className={`group block glass-panel p-6 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br ${demo.gradient} border ${demo.borderColor}`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-lg bg-white/5 ${demo.iconColor}`}>
                  <demo.icon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{demo.title}</h2>
                  <span className="text-xs text-white/40 font-mono">{demo.city}</span>
                </div>
              </div>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">{demo.description}</p>
              <div className="flex items-center gap-2 text-sm text-white/40 group-hover:text-white/70 transition-colors">
                <span>Explorer</span>
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
        React 19 + React Router 7 + Tailwind 4 + Mapbox GL JS
      </motion.p>
    </div>
  );
}
