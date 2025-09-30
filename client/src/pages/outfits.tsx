import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Palette, Plus, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Outfit, ClothingItem, OutfitComposition } from "@shared/schema";
import { FEATURE_FLAGS } from "@/config/features";

export default function Outfits() {
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [selectedComposition, setSelectedComposition] = useState<OutfitComposition | null>(null);
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [showCompositionModal, setShowCompositionModal] = useState(false);
  const { toast } = useToast();

  const { data: outfits = [], isLoading } = useQuery<Outfit[]>({
    queryKey: ['/api/outfits'],
  });

  const { data: compositions = [], isLoading: isLoadingCompositions } = useQuery<OutfitComposition[]>({
    queryKey: ['/api/outfit-compositions'],
    enabled: FEATURE_FLAGS.OUTFIT_COMPOSITIONS_ENABLED,
  });

  const { data: items = [] } = useQuery<ClothingItem[]>({
    queryKey: ['/api/clothing-items'],
  });

  const deleteOutfitMutation = useMutation({
    mutationFn: async (outfitId: number) => {
      return apiRequest("DELETE", `/api/outfits/${outfitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/outfits'] });
      toast({
        title: "Success!",
        description: "Outfit deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete outfit.",
        variant: "destructive",
      });
    },
  });

  const deleteCompositionMutation = useMutation({
    mutationFn: async (compositionId: number) => {
      return apiRequest("DELETE", `/api/outfit-compositions/${compositionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/outfit-compositions'] });
      toast({
        title: "Success!",
        description: "Outfit composition deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete outfit composition.",
        variant: "destructive",
      });
    },
  });

  const handleViewOutfit = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
    setShowOutfitModal(true);
  };

  const handleViewComposition = (composition: OutfitComposition) => {
    setSelectedComposition(composition);
    setShowCompositionModal(true);
  };

  const handleDeleteOutfit = (outfitId: number) => {
    if (confirm("Are you sure you want to delete this outfit?")) {
      deleteOutfitMutation.mutate(outfitId);
    }
  };

  const handleDeleteComposition = (compositionId: number) => {
    if (confirm("Are you sure you want to delete this outfit composition?")) {
      deleteCompositionMutation.mutate(compositionId);
    }
  };

  const getOutfitItems = (itemIds: number[]) => {
    return itemIds.map(id => items.find(item => item.id === id)).filter(Boolean) as ClothingItem[];
  };

  const parseCompositionItems = (itemsJson: string) => {
    try {
      const parsed = JSON.parse(itemsJson);
      return parsed.items || [];
    } catch {
      return [];
    }
  };

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
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Outfit Compositions Section */}
        {FEATURE_FLAGS.OUTFIT_COMPOSITIONS_ENABLED && compositions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Dress-Up Outfits</h2>
            <div className="grid grid-cols-2 gap-4">
              {compositions.map((composition) => {
                const compositionItems = parseCompositionItems(composition.items);
                return (
                  <Card 
                    key={composition.id}
                    className="aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden hover-lift cursor-pointer relative"
                    onClick={() => handleViewComposition(composition)}
                    data-testid={`card-composition-${composition.id}`}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col items-center justify-center p-4">
                      {compositionItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          {compositionItems.slice(0, 4).map((item: any) => (
                            <div key={item.id} className="w-8 h-8 bg-white rounded border overflow-hidden">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-neutral-200" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Palette size={32} className="text-purple-400 mb-2" />
                      )}
                      <h3 className="font-medium text-neutral-800 text-center text-sm">
                        {composition.name}
                      </h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 bg-white/80 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteComposition(composition.id);
                      }}
                      data-testid={`button-delete-composition-${composition.id}`}
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Regular Outfits Section */}
        <div>
          {outfits.length > 0 && <h2 className="text-lg font-semibold mb-4">Suggested Outfits</h2>}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square bg-neutral-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : outfits.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {outfits.map((outfit) => {
                const outfitItems = getOutfitItems(outfit.itemIds || []);
                return (
                  <Card 
                    key={outfit.id}
                    className="aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden hover-lift cursor-pointer relative"
                    onClick={() => handleViewOutfit(outfit)}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex flex-col items-center justify-center p-4">
                      {outfitItems.length > 0 ? (
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          {outfitItems.slice(0, 4).map((item) => (
                            <div key={item.id} className="w-8 h-8 bg-white rounded border overflow-hidden">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-neutral-200" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Palette size={32} className="text-neutral-400 mb-2" />
                      )}
                      <h3 className="font-medium text-neutral-800 text-center text-sm">
                        {outfit.name}
                      </h3>
                      {outfit.occasion && (
                        <p className="text-xs text-neutral-500 mt-1">
                          {outfit.occasion}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 bg-white/80 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteOutfit(outfit.id);
                      }}
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          ) : !FEATURE_FLAGS.OUTFIT_COMPOSITIONS_ENABLED && (
            <div className="text-center py-8 text-neutral-500">
              <Palette size={48} className="mx-auto mb-4 text-neutral-300" />
              <p>No outfits created yet.</p>
              <p className="text-sm mt-2">Go to Home and create outfit suggestions!</p>
            </div>
          )}
        </div>
      </div>

      {/* Outfit Detail Modal */}
      <Dialog open={showOutfitModal} onOpenChange={setShowOutfitModal}>
        <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOutfit?.name}</DialogTitle>
          </DialogHeader>

          {selectedOutfit && (
            <div className="space-y-4">
              {/* Outfit Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedOutfit.occasion && (
                  <div>
                    <span className="text-neutral-600">Occasion:</span>
                    <p className="font-medium capitalize">{selectedOutfit.occasion}</p>
                  </div>
                )}
                {selectedOutfit.weather && (
                  <div>
                    <span className="text-neutral-600">Weather:</span>
                    <p className="font-medium capitalize">{selectedOutfit.weather}</p>
                  </div>
                )}
              </div>

              {/* Outfit Items */}
              <div>
                <h4 className="font-medium text-neutral-800 mb-3">Items in this outfit:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {getOutfitItems(selectedOutfit.itemIds || []).map((item) => (
                    <div key={item.id} className="bg-neutral-50 rounded-lg p-3">
                      {item.imageUrl && (
                        <div className="aspect-square bg-white rounded-lg overflow-hidden mb-2">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h5 className="font-medium text-sm text-neutral-800">{item.name}</h5>
                      <p className="text-xs text-neutral-600 capitalize">{item.category}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowOutfitModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (selectedOutfit) {
                      handleDeleteOutfit(selectedOutfit.id);
                      setShowOutfitModal(false);
                    }
                  }}
                >
                  Delete Outfit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Composition Detail Modal */}
      <Dialog open={showCompositionModal} onOpenChange={setShowCompositionModal}>
        <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedComposition?.name}</DialogTitle>
          </DialogHeader>

          {selectedComposition && (
            <div className="space-y-4">
              {/* Composition Items */}
              <div>
                <h4 className="font-medium text-neutral-800 mb-3">Items in this outfit:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {parseCompositionItems(selectedComposition.items).map((item: any) => (
                    <div key={item.id} className="bg-neutral-50 rounded-lg p-3">
                      {item.imageUrl && (
                        <div className="aspect-square bg-white rounded-lg overflow-hidden mb-2">
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <h5 className="font-medium text-sm text-neutral-800">{item.name}</h5>
                      <p className="text-xs text-neutral-600 capitalize">{item.category}</p>
                      <div className="text-xs text-neutral-500 mt-1">
                        <div>Position: {item.x?.toFixed(0)}%, {item.y?.toFixed(0)}%</div>
                        <div>Scale: {item.scale?.toFixed(2)}x</div>
                        <div>Rotation: {item.rotation?.toFixed(0)}°</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCompositionModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    if (selectedComposition) {
                      handleDeleteComposition(selectedComposition.id);
                      setShowCompositionModal(false);
                    }
                  }}
                  data-testid="button-confirm-delete-composition"
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
