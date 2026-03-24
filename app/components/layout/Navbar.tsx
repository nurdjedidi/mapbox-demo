import { Link, useLocation } from "react-router";
import { Map, Bike, Home, BarChart2 } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/urban-navigator", label: "Navigator", icon: Map },
  { to: "/micro-mobility", label: "Mobility", icon: Bike },
  { to: "/geo-sales", label: "Sales", icon: BarChart2 },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1 px-3 md:px-4 h-12 md:h-14 bg-dark-bg/60 backdrop-blur-xl border-b border-white/5">
      <Link to="/" className="mr-2 md:mr-4 text-electric-blue font-bold text-sm md:text-lg tracking-tight">
        Mapbox 3D
      </Link>
      <div className="flex gap-0.5 md:gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg text-xs md:text-sm transition-all ${
                isActive
                  ? "bg-electric-blue/15 text-electric-blue border border-electric-blue/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
