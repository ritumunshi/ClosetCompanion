import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Sparkles, Plus, Eye, Palette } from "lucide-react";
import AddItemModal from "@/components/add-item-modal";
import OutfitSuggestionModal from "@/components/outfit-suggestion-modal";
import type { ClothingItem, Outfit } from "@shared/schema";

export default function Home() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);

  const { data: items = [] } = useQuery<ClothingItem[]>({
    queryKey: ['/api/clothing-items'],
  });

  const { data: outfits = [] } = useQuery<Outfit[]>({
    queryKey: ['/api/outfits'],
  });

  const recentOutfits = outfits.slice(-3);

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">Good Morning!</h1>
              <p className="text-neutral-600 text-sm">Ready to look amazing?</p>
            </div>
            <Button variant="ghost" size="icon" className="text-neutral-600">
              <Bell size={20} />
            </Button>
          </div>
        </div>
      </header>

      {/* Today's Weather Card */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Card className="weather-card rounded-2xl p-6 text-white mb-6 border-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Today's Weather</h3>
              <p className="text-blue-100 text-sm">Perfect for outfit planning</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">72°F</div>
              <div className="text-blue-100 text-sm">Partly Cloudy</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="max-w-md mx-auto px-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Outfit Suggestion Card */}
          <Card 
            className="suggestion-card rounded-2xl p-6 text-white hover-lift cursor-pointer border-0"
            onClick={() => setShowSuggestionModal(true)}
          >
            <div className="flex flex-col items-center text-center">
              <Sparkles size={32} className="mb-3" />
              <h3 className="font-semibold text-lg">Get Outfit</h3>
              <p className="text-sm opacity-90">AI Suggestion</p>
            </div>
          </Card>

          {/* Add Clothing Card */}
          <Card 
            className="teal-accent rounded-2xl p-6 border-0 text-white hover-lift cursor-pointer"
            onClick={() => setShowAddModal(true)}
          >
            <div className="flex flex-col items-center text-center">
              <Plus size={32} className="mb-3" />
              <h3 className="font-semibold text-lg">Add Item</h3>
              <p className="text-sm opacity-90">To Wardrobe</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Outfits */}
      <div className="max-w-md mx-auto px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Recent Outfits</h2>
          <Button variant="ghost" className="text-primary font-medium text-sm p-0">
            <Eye size={16} className="mr-1" />
            View All
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2">
          {recentOutfits.length > 0 ? (
            recentOutfits.map((outfit) => (
              <Card 
                key={outfit.id}
                className="flex-shrink-0 w-24 h-32 bg-white rounded-xl border border-neutral-200 overflow-hidden hover-lift cursor-pointer"
              >
                <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                  <Palette size={20} className="text-neutral-400" />
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <p>No outfits yet. Create your first outfit!</p>
            </div>
          )}
        </div>
      </div>

      {/* Wardrobe Stats */}
      <div className="max-w-md mx-auto px-4 mb-6">
        <Card className="bg-white rounded-2xl p-6 border border-neutral-200">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Wardrobe Stats</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{items.length}</div>
              <div className="text-sm text-neutral-600">Items</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{outfits.length}</div>
              <div className="text-sm text-neutral-600">Outfits</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">7</div>
              <div className="text-sm text-neutral-600">Days Active</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <AddItemModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <OutfitSuggestionModal 
        isOpen={showSuggestionModal} 
        onClose={() => setShowSuggestionModal(false)} 
      />
    </div>
  );
}
