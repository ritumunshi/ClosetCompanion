import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import AddItemModal from "@/components/add-item-modal";
import type { ClothingItem } from "@shared/schema";

export default function Wardrobe() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: items = [], isLoading } = useQuery<ClothingItem[]>({
    queryKey: ['/api/clothing-items'],
  });

  const filters = [
    { key: "all", label: "All" },
    { key: "tops", label: "Tops" },
    { key: "bottoms", label: "Bottoms" },
    { key: "shoes", label: "Shoes" },
    { key: "accessories", label: "Accessories" },
  ];

  const filteredItems = items.filter(item => 
    activeFilter === "all" || item.category === activeFilter
  );

  return (
    <div className="pb-20 min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-neutral-800">My Wardrobe</h1>
            <Button variant="ghost" size="icon" className="text-neutral-600">
              <Search size={20} />
            </Button>
          </div>
          
          {/* Filter Tags */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
            {filters.map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "secondary"}
                size="sm"
                className={`flex-shrink-0 rounded-full ${
                  activeFilter === filter.key
                    ? "bg-primary text-white"
                    : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                }`}
                onClick={() => setActiveFilter(filter.key)}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Wardrobe Grid */}
      <div className="max-w-md mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-neutral-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card 
                key={item.id}
                className="aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden hover-lift cursor-pointer"
              >
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-400 text-xs text-center p-2">
                      {item.name}
                    </span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <p>No items found in this category.</p>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="mt-4"
            >
              Add Your First Item
            </Button>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Button
        className="fixed bottom-24 right-6 bg-primary text-white w-14 h-14 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
        onClick={() => setShowAddModal(true)}
      >
        <Plus size={20} />
      </Button>

      {/* Add Item Modal */}
      <AddItemModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    </div>
  );
}
