import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Avatar, ClothingItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Save, ArrowLeft, X, RotateCw, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MannequinTemplate from "@/components/MannequinTemplates";

type BodyType = 'male' | 'female' | 'slim' | 'tall';

interface ClothingPosition {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export default function DressUp() {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [bodyType, setBodyType] = useState<BodyType>('male');
  const [clothingPositions, setClothingPositions] = useState<Map<number, ClothingPosition>>(new Map());
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [outfitName, setOutfitName] = useState("");

  // Fetch avatars
  const { data: avatars = [] } = useQuery<Avatar[]>({
    queryKey: ['/api/avatars'],
  });

  // Fetch clothing items
  const { data: clothingItems = [] } = useQuery<ClothingItem[]>({
    queryKey: ['/api/clothing-items'],
  });

  // Group clothing items by category
  const itemsByCategory = {
    tops: clothingItems.filter(item => item.category === 'tops'),
    bottoms: clothingItems.filter(item => item.category === 'bottoms'),
    shoes: clothingItems.filter(item => item.category === 'shoes'),
    accessories: clothingItems.filter(item => item.category === 'accessories'),
  };

  // Set default avatar on mount
  useEffect(() => {
    const defaultAvatar = avatars.find(a => a.isDefault) || avatars[0];
    if (defaultAvatar && !selectedAvatar) {
      setSelectedAvatar(defaultAvatar);
    }
  }, [avatars, selectedAvatar]);

  const getDefaultPosition = (item: ClothingItem): ClothingPosition => {
    // Default positions based on category
    let x = 50, y = 30; // center position in percentages
    
    if (item.category === 'tops') {
      y = 30;
    } else if (item.category === 'bottoms') {
      y = 55;
    } else if (item.category === 'shoes') {
      y = 85;
    } else if (item.category === 'accessories') {
      x = 70;
      y = 40;
    }
    
    return {
      id: item.id,
      x,
      y,
      scale: 1.0,
      rotation: 0,
    };
  };

  const handleAddItem = (item: ClothingItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      toast({
        title: "Already Added",
        description: `${item.name} is already in your outfit`,
      });
      return;
    }
    setSelectedItems([...selectedItems, item]);
    
    // Initialize position for new item
    const newPos = new Map(clothingPositions);
    newPos.set(item.id, getDefaultPosition(item));
    setClothingPositions(newPos);
    
    toast({
      title: "Item Added",
      description: `${item.name} added to outfit`,
    });
  };

  const handleRemoveItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId));
    const newPos = new Map(clothingPositions);
    newPos.delete(itemId);
    setClothingPositions(newPos);
  };

  const handleDragStart = (itemId: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setDraggedItem(itemId);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedItem) return;
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    
    const currentPos = clothingPositions.get(draggedItem);
    if (currentPos) {
      const newPos = new Map(clothingPositions);
      newPos.set(draggedItem, { ...currentPos, x, y });
      setClothingPositions(newPos);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleScale = (itemId: number, delta: number) => {
    const currentPos = clothingPositions.get(itemId);
    if (currentPos) {
      const newPos = new Map(clothingPositions);
      const newScale = Math.max(0.5, Math.min(2.0, currentPos.scale + delta));
      newPos.set(itemId, { ...currentPos, scale: newScale });
      setClothingPositions(newPos);
    }
  };

  const handleRotate = (itemId: number, delta: number) => {
    const currentPos = clothingPositions.get(itemId);
    if (currentPos) {
      const newPos = new Map(clothingPositions);
      const newRotation = (currentPos.rotation + delta) % 360;
      newPos.set(itemId, { ...currentPos, rotation: newRotation });
      setClothingPositions(newPos);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAvatar) throw new Error("No avatar selected");
      if (!outfitName.trim()) throw new Error("Please enter outfit name");
      if (selectedItems.length === 0) throw new Error("Please add at least one clothing item");

      const itemsWithPositions = selectedItems.map(item => {
        const position = clothingPositions.get(item.id) || getDefaultPosition(item);
        return {
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
          category: item.category,
          x: position.x,
          y: position.y,
          scale: position.scale,
          rotation: position.rotation,
        };
      });

      const response = await fetch('/api/outfit-compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: outfitName,
          avatarId: selectedAvatar.id,
          userId: 1,
          items: JSON.stringify({
            bodyType: bodyType,
            items: itemsWithPositions,
          }),
        }),
      });

      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Outfit saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/outfit-compositions'] });
      setIsSaveDialogOpen(false);
      setOutfitName("");
      setSelectedItems([]);
      navigate('/outfits');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (avatars.length === 0) {
    return (
      <div className="container mx-auto p-4 max-w-6xl pb-24">
        <div className="flex items-center gap-2 mb-6">
          <Shirt className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Dress-Up Mode</h1>
        </div>
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-2">No Avatar Found</h2>
          <p className="text-muted-foreground mb-4">
            You need to upload an avatar before using dress-up mode.
          </p>
          <Link href="/avatars">
            <Button data-testid="button-go-to-avatars">Go to Avatars</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/wardrobe">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Shirt className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Dress-Up Mode</h1>
        </div>
        
        <Button 
          onClick={() => setIsSaveDialogOpen(true)} 
          disabled={selectedItems.length === 0}
          data-testid="button-save-outfit"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Outfit
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview Area */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Select Avatar</Label>
                <Select
                  value={selectedAvatar?.id.toString() || ''}
                  onValueChange={(value) => {
                    const avatar = avatars.find(a => a.id === parseInt(value));
                    if (avatar) setSelectedAvatar(avatar);
                  }}
                >
                  <SelectTrigger data-testid="select-avatar">
                    <SelectValue placeholder="Choose an avatar" />
                  </SelectTrigger>
                  <SelectContent>
                    {avatars.map((avatar) => (
                      <SelectItem key={avatar.id} value={avatar.id.toString()}>
                        {avatar.name || `Avatar ${avatar.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Body Type</Label>
                <Select
                  value={bodyType}
                  onValueChange={(value: BodyType) => setBodyType(value)}
                >
                  <SelectTrigger data-testid="select-body-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="slim">Slim</SelectItem>
                    <SelectItem value="tall">Tall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Mannequin with Draggable Clothing */}
            {selectedAvatar && (
              <div className="mb-4">
                <div 
                  className="relative max-w-md mx-auto bg-gradient-to-b from-sky-100 to-green-100 rounded-lg p-6 select-none"
                  onMouseMove={handleDragMove}
                  onMouseUp={handleDragEnd}
                  onMouseLeave={handleDragEnd}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                >
                  {/* Mannequin Body with Face */}
                  <div className="relative pointer-events-none">
                    <MannequinTemplate 
                      faceImageUrl={selectedAvatar.imageUrl || ''} 
                      bodyType={bodyType}
                      className="w-full h-auto"
                    />
                  </div>
                  
                  {/* Draggable Clothing Overlays */}
                  <div className="absolute inset-0 pointer-events-none">
                    {selectedItems.map((item) => {
                      const pos = clothingPositions.get(item.id) || getDefaultPosition(item);
                      
                      return (
                        <div
                          key={item.id}
                          className="absolute pointer-events-auto group cursor-move"
                          style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: `translate(-50%, -50%) scale(${pos.scale}) rotate(${pos.rotation}deg)`,
                            width: '40%',
                            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
                          }}
                          onMouseDown={(e) => handleDragStart(item.id, e)}
                          onTouchStart={(e) => handleDragStart(item.id, e)}
                          data-testid={`overlay-item-${item.id}`}
                        >
                          <img
                            src={item.imageUrl || ''}
                            alt={item.name}
                            className="w-full h-auto object-contain pointer-events-none"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            onClick={() => handleRemoveItem(item.id)}
                            data-testid={`button-remove-overlay-${item.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Selected Items with Controls */}
                {selectedItems.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-semibold">Wearing ({selectedItems.length} items)</h3>
                    {selectedItems.map((item) => (
                      <Card key={item.id} className="p-3 bg-primary/5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRemoveItem(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Clothing Controls */}
                        <div className="flex gap-2">
                          <div className="flex-1 flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleScale(item.id, -0.1)}
                              data-testid={`button-zoom-out-${item.id}`}
                            >
                              <ZoomOut className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleScale(item.id, 0.1)}
                              data-testid={`button-zoom-in-${item.id}`}
                            >
                              <ZoomIn className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="flex-1 flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRotate(item.id, -15)}
                              data-testid={`button-rotate-left-${item.id}`}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleRotate(item.id, 15)}
                              data-testid={`button-rotate-right-${item.id}`}
                            >
                              <RotateCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Clothing Items Panel */}
        <div>
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Wardrobe</h2>
            {clothingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clothing items yet. Add some to your wardrobe first.
              </p>
            ) : (
              <Tabs defaultValue="tops">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="tops">Tops</TabsTrigger>
                  <TabsTrigger value="bottoms">Bottoms</TabsTrigger>
                  <TabsTrigger value="shoes">Shoes</TabsTrigger>
                  <TabsTrigger value="accessories">Acc.</TabsTrigger>
                </TabsList>
                
                {Object.entries(itemsByCategory).map(([category, items]) => (
                  <TabsContent key={category} value={category} className="space-y-2 max-h-[500px] overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No {category} yet</p>
                    ) : (
                      items.map((item) => (
                        <Card
                          key={item.id}
                          className="p-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                          onClick={() => handleAddItem(item)}
                          data-testid={`card-clothing-item-${item.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </Card>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Outfit</DialogTitle>
            <DialogDescription>
              Give your outfit composition a name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outfit-name">Outfit Name</Label>
              <Input
                id="outfit-name"
                data-testid="input-outfit-name"
                placeholder="e.g., Summer Casual, Work Meeting"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
              />
            </div>
            <Button
              data-testid="button-confirm-save"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full"
            >
              {saveMutation.isPending ? "Saving..." : "Save Outfit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
