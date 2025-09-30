import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Shuffle, Save, Shirt } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { ClothingItem } from "@shared/schema";

interface OutfitSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OutfitSuggestion {
  suggestion: {
    top?: ClothingItem;
    bottom?: ClothingItem;
    shoes?: ClothingItem;
    accessory?: ClothingItem;
  };
  confidenceScore: number;
  occasion: string;
  weather: string;
}

export default function OutfitSuggestionModal({ isOpen, onClose }: OutfitSuggestionModalProps) {
  const [occasion, setOccasion] = useState("");
  const [weather, setWeather] = useState("");
  const [suggestion, setSuggestion] = useState<OutfitSuggestion | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateOutfitMutation = useMutation({
    mutationFn: async (data: { occasion: string; weather: string }) => {
      const response = await apiRequest("POST", "/api/suggest-outfit", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestion(data);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate outfit suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveOutfitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/outfits", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/outfits'] });
      toast({
        title: "Success!",
        description: "Outfit saved successfully.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save outfit. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setOccasion("");
    setWeather("");
    setSuggestion(null);
    onClose();
  };

  const handleGenerate = () => {
    if (!occasion || !weather) {
      toast({
        title: "Error",
        description: "Please select both occasion and weather.",
        variant: "destructive",
      });
      return;
    }

    generateOutfitMutation.mutate({ occasion, weather });
  };

  const handleShuffle = () => {
    if (occasion && weather) {
      generateOutfitMutation.mutate({ occasion, weather });
    }
  };

  const handleSave = () => {
    if (!suggestion) return;

    const itemIds = Object.values(suggestion.suggestion)
      .filter(Boolean)
      .map(item => item!.id);

    saveOutfitMutation.mutate({
      name: `${suggestion.occasion} Outfit`,
      itemIds,
      occasion: suggestion.occasion,
      weather: suggestion.weather,
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Fair Match";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Outfit Suggestion</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Occasion & Weather Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Occasion
              </label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select occasion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="party">Party</SelectItem>
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Weather
              </label>
              <Select value={weather} onValueChange={setWeather}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                  <SelectItem value="rainy">Rainy</SelectItem>
                  <SelectItem value="windy">Windy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={generateOutfitMutation.isPending}
          >
            <Sparkles className="mr-2" size={16} />
            {generateOutfitMutation.isPending ? "Generating..." : "Generate Outfit"}
          </Button>

          {/* Suggested Outfit */}
          {suggestion && suggestion.suggestion && (
            <div className="fade-in">
              <h3 className="text-lg font-semibold text-neutral-800 mb-4">Perfect Match!</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                {Object.entries(suggestion.suggestion).map(([type, item]) => {
                  if (!item) return null;
                  
                  return (
                    <div key={type} className="text-center">
                      <Card className="aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden mb-2">
                        {item.imageUrl ? (
                          <img 
                            src={item.imageUrl} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                            <Shirt size={24} className="text-neutral-400" />
                          </div>
                        )}
                      </Card>
                      <p className="text-sm text-neutral-600 capitalize">{item.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {type}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <Card className="bg-neutral-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-800">Confidence Score</p>
                    <p className="text-sm text-neutral-600">Based on your preferences</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${getConfidenceColor(suggestion.confidenceScore)}`}>
                      {suggestion.confidenceScore}%
                    </div>
                    <div className={`text-sm ${getConfidenceColor(suggestion.confidenceScore)}`}>
                      {getConfidenceLabel(suggestion.confidenceScore)}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleShuffle}
                  className="flex-1"
                  disabled={generateOutfitMutation.isPending}
                >
                  <Shuffle className="mr-2" size={16} />
                  Shuffle
                </Button>
                <Button 
                  onClick={handleSave}
                  className="flex-1"
                  disabled={saveOutfitMutation.isPending}
                >
                  <Save className="mr-2" size={16} />
                  Save Outfit
                </Button>
              </div>
            </div>
          )}
          
          {/* No Outfit Available */}
          {suggestion && !suggestion.suggestion && (
            <Card className="bg-neutral-50 rounded-xl p-6 text-center fade-in">
              <Shirt size={48} className="text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">No Outfit Available</h3>
              <p className="text-sm text-neutral-600 mb-4">
                {suggestion.confidenceScore === 0 
                  ? "You don't have enough clothing items yet. Add some items to your wardrobe first!" 
                  : "We couldn't find a suitable outfit combination. Try adding more items or adjusting your preferences."}
              </p>
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="w-full"
              >
                Close
              </Button>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
