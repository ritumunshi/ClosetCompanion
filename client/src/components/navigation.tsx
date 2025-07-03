import { useLocation } from "wouter";
import { Home, Shirt, Palette, User } from "lucide-react";

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/wardrobe", label: "Wardrobe", icon: Shirt },
    { path: "/outfits", label: "Outfits", icon: Palette },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center py-2 px-4 transition-colors ${
                isActive 
                  ? "text-primary" 
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
