import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Plus } from "lucide-react";
import type { Outfit } from "@shared/schema";

export default function Outfits() {
  const { data: outfits = [], isLoading } = useQuery<Outfit[]>({
    queryKey: ['/api/outfits'],
  });

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-800">My Outfits</h1>
            <Button variant="ghost" size="icon" className="text-neutral-600">
              <Plus size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Outfits Grid */}
      <div className="max-w-md mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : outfits.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {outfits.map((outfit) => (
              <Card 
                key={outfit.id}
                className="aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden hover-lift cursor-pointer"
              >
                <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex flex-col items-center justify-center p-4">
                  <Palette size={32} className="text-neutral-400 mb-2" />
                  <h3 className="font-medium text-neutral-800 text-center text-sm">
                    {outfit.name}
                  </h3>
                  {outfit.occasion && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {outfit.occasion}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <Palette size={48} className="mx-auto mb-4 text-neutral-300" />
            <p>No outfits created yet.</p>
            <Button className="mt-4">
              Create Your First Outfit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
