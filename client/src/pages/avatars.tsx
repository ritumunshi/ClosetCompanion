import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar } from "@shared/schema";
import { Upload, Trash2, Check, User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Avatars() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [avatarName, setAvatarName] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch avatars
  const { data: avatars = [], isLoading } = useQuery<Avatar[]>({
    queryKey: ['/api/avatars'],
  });

  // Upload avatar mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('name', avatarName || 'My Avatar');
      formData.append('isDefault', String(avatars.length === 0)); // First avatar is default

      const response = await fetch('/api/avatars', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/avatars'] });
      setSelectedFile(null);
      setAvatarName("");
      setPreviewUrl("");
      setIsUploadDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set default avatar mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (avatarId: number) => {
      return await apiRequest('PATCH', `/api/avatars/${avatarId}`, { isDefault: true });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Default avatar updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/avatars'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set default avatar",
        variant: "destructive",
      });
    },
  });

  // Delete avatar mutation
  const deleteMutation = useMutation({
    mutationFn: async (avatarId: number) => {
      return await apiRequest('DELETE', `/api/avatars/${avatarId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Avatar deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/avatars'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete avatar",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  const handleSetDefault = (avatarId: number) => {
    setDefaultMutation.mutate(avatarId);
  };

  const handleDelete = (avatarId: number) => {
    if (confirm("Are you sure you want to delete this avatar?")) {
      deleteMutation.mutate(avatarId);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl pb-24">
        <div className="flex items-center gap-2 mb-6">
          <UserIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">My Avatars</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="aspect-square bg-neutral-200 rounded-lg mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <UserIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">My Avatars</h1>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-avatar">
              <Upload className="h-4 w-4 mr-2" />
              Upload Avatar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Avatar</DialogTitle>
              <DialogDescription>
                Upload a photo of yourself to use in dress-up mode
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-image">Photo</Label>
                <Input
                  id="avatar-image"
                  data-testid="input-avatar-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>

              {previewUrl && (
                <div className="aspect-square w-full max-w-xs mx-auto">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                    data-testid="img-avatar-preview"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="avatar-name">Name (optional)</Label>
                <Input
                  id="avatar-name"
                  data-testid="input-avatar-name"
                  placeholder="e.g., Casual Look, Formal Pose"
                  value={avatarName}
                  onChange={(e) => setAvatarName(e.target.value)}
                />
              </div>

              <Button
                data-testid="button-save-avatar"
                onClick={handleUpload}
                disabled={!selectedFile || uploadMutation.isPending}
                className="w-full"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Avatar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {avatars.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Avatars Yet</CardTitle>
            <CardDescription>
              Upload a photo of yourself to get started with the virtual try-on feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button data-testid="button-upload-first-avatar" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Your First Avatar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {avatars.map((avatar) => (
            <Card key={avatar.id} className={avatar.isDefault ? "ring-2 ring-primary" : ""} data-testid={`card-avatar-${avatar.id}`}>
              <CardContent className="p-4">
                <div className="aspect-square mb-3 relative">
                  <img
                    src={avatar.imageUrl || ''}
                    alt={avatar.name || 'Avatar'}
                    className="w-full h-full object-cover rounded-lg"
                    data-testid={`img-avatar-${avatar.id}`}
                  />
                  {avatar.isDefault && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Default
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium mb-3" data-testid={`text-avatar-name-${avatar.id}`}>
                  {avatar.name || 'Unnamed Avatar'}
                </h3>

                <div className="flex gap-2">
                  {!avatar.isDefault && (
                    <Button
                      data-testid={`button-set-default-${avatar.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(avatar.id)}
                      disabled={setDefaultMutation.isPending}
                      className="flex-1"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    data-testid={`button-delete-avatar-${avatar.id}`}
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(avatar.id)}
                    disabled={deleteMutation.isPending}
                    className={avatar.isDefault ? "flex-1" : ""}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
