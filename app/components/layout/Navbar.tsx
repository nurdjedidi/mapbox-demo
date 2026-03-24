import { Link, useLocation } from "react-router";
import { Home, Sprout, Leaf, Wind } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/agritech", label: "AgriTech", icon: Sprout },
  { to: "/green-fleet", label: "Fleet", icon: Leaf },
  { to: "/climate-monitor", label: "Climat", icon: Wind },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1 px-3 md:px-4 h-12 md:h-14 bg-dark-bg/60 backdrop-blur-xl border-b border-white/5">
      <Link to="/" className="mr-2 md:mr-4 text-eco-green font-bold text-sm md:text-lg tracking-tight">
        Impact<span className="text-white/60">Map</span>
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
                  ? "bg-eco-green/15 text-eco-green border border-eco-green/30"
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
