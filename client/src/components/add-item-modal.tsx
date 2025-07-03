import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Shirt, User, Footprints, Gem, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddItemModal({ isOpen, onClose }: AddItemModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categories = [
    { value: "tops", label: "Tops", icon: Shirt },
    { value: "bottoms", label: "Bottoms", icon: User },
    { value: "shoes", label: "Shoes", icon: Footprints },
    { value: "accessories", label: "Accessories", icon: Gem },
  ];

  const colors = ["red", "blue", "green", "black", "white", "yellow", "purple", "pink", "brown", "gray"];
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
    setSelectedColors([]);
    setSelectedSeasons([]);
    setSelectedOccasions([]);
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
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
                <p className="text-neutral-600">
                  {selectedImage ? selectedImage.name : "Tap to take photo"}
                </p>
                <p className="text-sm text-neutral-500 mt-2">or choose from gallery</p>
              </label>
            </div>
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
            <Label>Colors</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {colors.map((color) => (
                <Badge
                  key={color}
                  variant={selectedColors.includes(color) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleTag(color, "color")}
                >
                  {color}
                </Badge>
              ))}
            </div>
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
            <Label>Occasions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {occasions.map((occasion) => (
                <Badge
                  key={occasion}
                  variant={selectedOccasions.includes(occasion) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleTag(occasion, "occasion")}
                >
                  {occasion}
                </Badge>
              ))}
            </div>
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
