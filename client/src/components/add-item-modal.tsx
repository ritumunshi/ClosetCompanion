import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Shirt, User, Footprints, Gem, X, Sparkles, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import ColorThief from "colorthief";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [detectedColors, setDetectedColors] = useState<string[]>([]);
  const [detectedOccasions, setDetectedOccasions] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categories = [
    { value: "tops", label: "Tops", icon: Shirt },
    { value: "bottoms", label: "Bottoms", icon: User },
    { value: "shoes", label: "Shoes", icon: Footprints },
    { value: "accessories", label: "Accessories", icon: Gem },
  ];

  const colors = [
    "red", "blue", "green", "black", "white", "yellow", "purple", "pink", "brown", "gray",
    "navy", "maroon", "olive", "teal", "orange", "beige", "tan", "cream", "burgundy", "khaki",
    "coral", "turquoise", "lavender", "mint", "peach", "gold", "silver", "charcoal", "ivory"
  ];
  const seasons = ["spring", "summer", "fall", "winter"];
  const occasions = ["casual", "work", "party", "gym", "formal", "date"];

  const createItemMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/clothing-items", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clothing-items'] });
      toast({
        title: "Success!",
        description: "Item added to your wardrobe.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setName("");
    setCategory("");
    setSelectedImage(null);
    setImagePreview(null);
    setSelectedColors([]);
    setSelectedSeasons([]);
    setSelectedOccasions([]);
    setDetectedColors([]);
    setDetectedOccasions([]);
    onClose();
  };

  const rgbToColorName = (rgb: number[]): string => {
    const [r, g, b] = rgb;
    
    // Calculate color properties
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const saturation = max - min;
    
    // Very light colors
    if (lightness > 240) return "white";
    if (lightness > 220) {
      if (r > 230 && g > 220 && b < 200) return "cream";
      if (r > 230 && g > 220 && b > 210) return "ivory";
      return "white";
    }
    
    // Very dark colors
    if (lightness < 40) return "black";
    if (lightness < 60) {
      if (r > g && r > b && r < 60) return "maroon";
      if (b > r && b > g) return "navy";
      return "charcoal";
    }
    
    // Low saturation (grayscale/neutral)
    if (saturation < 25) {
      if (lightness > 180) return "gray";
      if (lightness > 120) return "gray";
      return "charcoal";
    }
    
    // Mid-range saturation (muted colors)
    if (saturation < 60) {
      if (r > g && r > b) {
        if (lightness > 150) return "beige";
        return "tan";
      }
      if (g > r && g > b) {
        if (lightness > 150) return "mint";
        return "olive";
      }
      if (lightness > 140) return "beige";
      return "khaki";
    }
    
    // Determine dominant saturated colors
    if (r > g && r > b) {
      if (g > 150 && r - g < 50) return "orange";
      if (g > 100 && r - g < 80) return "coral";
      if (b > 100 && r - b < 80) {
        if (lightness > 150) return "pink";
        return "purple";
      }
      if (lightness > 180) return "pink";
      if (lightness > 150) return "peach";
      if (lightness < 100) return "maroon";
      return "red";
    }
    
    if (g > r && g > b) {
      if (r > 150 && g - r < 50) return "yellow";
      if (r > 100 && g - r < 80) return "olive";
      if (b > 150) return "teal";
      if (b > 100) return "turquoise";
      if (lightness > 180) return "mint";
      return "green";
    }
    
    if (b > r && b > g) {
      if (r > 120 && b - r < 80) {
        if (lightness > 150) return "lavender";
        return "purple";
      }
      if (g > 100 && b - g < 60) return "teal";
      if (lightness < 100) return "navy";
      return "blue";
    }
    
    // Fallback
    if (r > 150 && g > 100 && b < 100) return "orange";
    if (r > 180 && g > 150 && b > 100) return "gold";
    return "brown";
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          try {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(img, 5);
            
            // Convert RGB to color names
            const colorNames = palette
              .map((rgb: number[]) => rgbToColorName(rgb))
              .filter((color: string, index: number, self: string[]) => 
                self.indexOf(color) === index
              );
            
            setDetectedColors(colorNames);
            setSelectedColors(colorNames);
            
            // Suggest seasons based on detected colors
            const lightColors = palette.filter((rgb: number[]) => {
              const lightness = (Math.max(...rgb) + Math.min(...rgb)) / 2;
              return lightness > 150;
            }).length;
            
            if (lightColors >= 3) {
              setSelectedSeasons(prev => Array.from(new Set([...prev, "spring", "summer"])));
            } else {
              setSelectedSeasons(prev => Array.from(new Set([...prev, "fall", "winter"])));
            }
            
            // Suggest occasions based on colors (internal AI logic)
            const suggestedOccasions = [];
            
            // Neutral colors suggest work/formal
            const hasNeutral = colorNames.some(c => 
              ['black', 'white', 'gray', 'navy', 'charcoal', 'beige'].includes(c)
            );
            if (hasNeutral) {
              suggestedOccasions.push('work');
            }
            
            // Dark/formal colors suggest formal occasions
            const hasFormalColors = colorNames.some(c => 
              ['black', 'navy', 'burgundy', 'maroon', 'charcoal'].includes(c)
            );
            if (hasFormalColors) {
              suggestedOccasions.push('formal');
            }
            
            // Bright/vibrant colors suggest party/casual
            const hasBrightColors = colorNames.some(c => 
              ['pink', 'purple', 'orange', 'coral', 'turquoise', 'yellow'].includes(c)
            );
            if (hasBrightColors) {
              suggestedOccasions.push('party', 'casual');
            }
            
            // Comfortable colors suggest gym/casual
            const hasComfortColors = colorNames.some(c => 
              ['gray', 'black', 'navy', 'blue'].includes(c)
            );
            if (hasComfortColors && !hasFormalColors) {
              suggestedOccasions.push('gym', 'casual');
            }
            
            // Soft/romantic colors suggest date
            const hasSoftColors = colorNames.some(c => 
              ['pink', 'peach', 'lavender', 'cream', 'coral'].includes(c)
            );
            if (hasSoftColors) {
              suggestedOccasions.push('date');
            }
            
            // If no specific suggestions, default to casual
            if (suggestedOccasions.length === 0) {
              suggestedOccasions.push('casual');
            }
            
            // Limit to top 3 suggestions
            const uniqueOccasions = Array.from(new Set(suggestedOccasions.slice(0, 3)));
            setDetectedOccasions(uniqueOccasions);
            setSelectedOccasions(prev => 
              Array.from(new Set([...prev, ...uniqueOccasions]))
            );
            
            setIsAnalyzing(false);
          } catch (err) {
            console.error("Color extraction error:", err);
            setIsAnalyzing(false);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Image analysis error:", err);
      setIsAnalyzing(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Analyze image for colors
      analyzeImage(file);
    }
  };

  const toggleTag = (tag: string, type: "color" | "season" | "occasion") => {
    const setters = {
      color: setSelectedColors,
      season: setSelectedSeasons,
      occasion: setSelectedOccasions,
    };
    
    const getters = {
      color: selectedColors,
      season: selectedSeasons,
      occasion: selectedOccasions,
    };

    const currentTags = getters[type];
    const setter = setters[type];
    
    if (currentTags.includes(tag)) {
      setter(currentTags.filter(t => t !== tag));
    } else {
      setter([...currentTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (selectedImage) {
      formData.append('image', selectedImage);
    }
    
    formData.append('data', JSON.stringify({
      name,
      category,
      colors: selectedColors,
      seasons: selectedSeasons,
      occasions: selectedOccasions,
    }));

    createItemMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Blue Cotton T-Shirt"
              required
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label>Photo</Label>
            {imagePreview ? (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-xl"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    setDetectedColors([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">Analyzing colors...</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Camera size={32} className="mx-auto text-neutral-400 mb-4" />
                  <p className="text-neutral-600">Tap to take photo</p>
                  <p className="text-sm text-neutral-500 mt-2">or choose from gallery</p>
                </label>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div>
            <Label>Category</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.value}
                    type="button"
                    variant={category === cat.value ? "default" : "outline"}
                    className="p-3 h-auto justify-start"
                    onClick={() => setCategory(cat.value)}
                  >
                    <Icon size={16} className="mr-2" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Color Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Colors</Label>
              {detectedColors.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>AI detected</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {colors.map((color) => {
                const isDetected = detectedColors.includes(color);
                const isSelected = selectedColors.includes(color);
                return (
                  <Badge
                    key={color}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer capitalize ${
                      isDetected && !isSelected
                        ? "ring-2 ring-primary ring-offset-1"
                        : ""
                    }`}
                    onClick={() => toggleTag(color, "color")}
                  >
                    {color}
                    {isDetected && isSelected && (
                      <Sparkles className="h-3 w-3 ml-1 inline" />
                    )}
                  </Badge>
                );
              })}
            </div>
            {detectedColors.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Colors detected from your photo. Click to select/deselect.
              </p>
            )}
          </div>

          {/* Season Tags */}
          <div>
            <Label>Seasons</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {seasons.map((season) => (
                <Badge
                  key={season}
                  variant={selectedSeasons.includes(season) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleTag(season, "season")}
                >
                  {season}
                </Badge>
              ))}
            </div>
          </div>

          {/* Occasion Tags */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label>Occasions</Label>
              {detectedOccasions.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Sparkles className="h-3 w-3" />
                  <span>AI suggested</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {occasions.map((occasion) => {
                const isDetected = detectedOccasions.includes(occasion);
                const isSelected = selectedOccasions.includes(occasion);
                return (
                  <Badge
                    key={occasion}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer capitalize ${
                      isDetected && !isSelected
                        ? "ring-2 ring-primary ring-offset-1"
                        : ""
                    }`}
                    onClick={() => toggleTag(occasion, "occasion")}
                  >
                    {occasion}
                    {isDetected && isSelected && (
                      <Sparkles className="h-3 w-3 ml-1 inline" />
                    )}
                  </Badge>
                );
              })}
            </div>
            {detectedOccasions.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Occasions suggested based on photo analysis. Click to select/deselect.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={createItemMutation.isPending}
            >
              {createItemMutation.isPending ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
