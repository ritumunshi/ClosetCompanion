import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Avatar, ClothingItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shirt, Save, ArrowLeft, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DressUp() {
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
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

  const handleAddItem = (item: ClothingItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      toast({
        title: "Already Added",
        description: `${item.name} is already in your outfit`,
      });
      return;
    }
    setSelectedItems([...selectedItems, item]);
    toast({
      title: "Item Added",
      description: `${item.name} added to outfit`,
    });
  };

  const handleRemoveItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(i => i.id !== itemId));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAvatar) throw new Error("No avatar selected");
      if (!outfitName.trim()) throw new Error("Please enter outfit name");
      if (selectedItems.length === 0) throw new Error("Please add at least one clothing item");

      const response = await fetch('/api/outfit-compositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: outfitName,
          avatarId: selectedAvatar.id,
          items: JSON.stringify(selectedItems.map(item => ({ id: item.id, name: item.name, imageUrl: item.imageUrl }))),
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
            <div className="mb-4">
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

            {/* Avatar Preview with Clothing Overlays */}
            {selectedAvatar && (
              <div className="mb-4">
                <div className="relative aspect-[2/3] max-w-md mx-auto bg-neutral-100 rounded-lg overflow-hidden">
                  {/* Base Avatar Image */}
                  <img
                    src={selectedAvatar.imageUrl || ''}
                    alt={selectedAvatar.name || 'Avatar'}
                    className="w-full h-full object-cover"
                    data-testid="img-avatar-preview"
                  />
                  
                  {/* Clothing Item Overlays */}
                  {selectedItems.map((item) => {
                    // Position items based on category
                    let positionClass = '';
                    let sizeClass = 'w-2/3';
                    
                    if (item.category === 'tops') {
                      positionClass = 'top-[20%] left-1/2 -translate-x-1/2';
                      sizeClass = 'w-3/5';
                    } else if (item.category === 'bottoms') {
                      positionClass = 'top-[45%] left-1/2 -translate-x-1/2';
                      sizeClass = 'w-3/5';
                    } else if (item.category === 'shoes') {
                      positionClass = 'bottom-[5%] left-1/2 -translate-x-1/2';
                      sizeClass = 'w-2/5';
                    } else if (item.category === 'accessories') {
                      positionClass = 'top-[15%] right-[10%]';
                      sizeClass = 'w-1/4';
                    }
                    
                    return (
                      <div
                        key={item.id}
                        className={`absolute ${positionClass} ${sizeClass} group`}
                        data-testid={`overlay-item-${item.id}`}
                      >
                        <img
                          src={item.imageUrl || ''}
                          alt={item.name}
                          className="w-full h-auto object-contain drop-shadow-lg"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveItem(item.id)}
                          data-testid={`button-remove-overlay-${item.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Selected Items List */}
                {selectedItems.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">On Avatar ({selectedItems.length} items)</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map((item) => (
                        <div key={item.id} className="inline-flex items-center gap-1 bg-neutral-100 rounded-full px-3 py-1">
                          <span className="text-xs">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 hover:bg-neutral-200 rounded-full"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
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
