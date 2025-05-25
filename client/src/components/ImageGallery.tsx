import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, Check, Calendar, CameraIcon, XCircle } from "lucide-react";
import { format } from "date-fns";
import type { BucketListItem } from "@shared/schema";

interface ImageGalleryProps {
  bucketListItems: BucketListItem[];
}

export function ImageGallery({ bucketListItems }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BucketListItem | null>(null);
  const [activeTab, setActiveTab] = useState<string>("completed");
  
  // Filter items with images
  const itemsWithImages = bucketListItems.filter(item => !!item.imageUrl);
  
  // Group items by status
  const completedItems = itemsWithImages.filter(item => item.status === "Completed");
  const inProgressItems = itemsWithImages.filter(item => item.status === "In Progress");
  const notStartedItems = itemsWithImages.filter(item => item.status === "Not Started");
  
  // Get placeholder image based on category
  const getPlaceholderImage = (category: string | null | undefined) => {
    switch (category) {
      case "Travel":
        return "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Adventure":
        return "https://images.unsplash.com/photo-1521673252667-e05da380b252?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Personal Growth":
        return "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Health":
        return "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Finance":
        return "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Creativity":
        return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Skill":
        return "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Relationships":
        return "https://images.unsplash.com/photo-1541943181603-d8fe267a5dcf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      default:
        return "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
    }
  };
  
  // Handle image click
  const handleImageClick = (item: BucketListItem) => {
    setSelectedImage(item.imageUrl || getPlaceholderImage(item.category));
    setSelectedItem(item);
  };
  
  // Close image modal
  const handleCloseImage = () => {
    setSelectedImage(null);
    setSelectedItem(null);
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "completed";
      case "In Progress": return "inProgress";
      case "Not Started": return "notStarted";
      default: return "secondary";
    }
  };
  
  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No date set";
    return format(new Date(dateString), "MMMM d, yyyy");
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Image Gallery</h2>
        <div className="flex items-center text-sm text-muted-foreground">
          <CameraIcon className="mr-2 h-4 w-4" />
          <span>{itemsWithImages.length} images</span>
        </div>
      </div>
      
      <Tabs defaultValue="completed" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex mb-6">
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            <span>Completed</span>
            <Badge variant="secondary" className="ml-1">{completedItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>In Progress</span>
            <Badge variant="secondary" className="ml-1">{inProgressItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="not-started" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            <span>Not Started</span>
            <Badge variant="secondary" className="ml-1">{notStartedItems.length}</Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="completed" className="space-y-4">
          {completedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {completedItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleImageClick(item)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={item.imageUrl || getPlaceholderImage(item.category)} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <ZoomIn className="text-white h-8 w-8" />
                    </div>
                    <Badge 
                      className="absolute top-2 right-2"
                      variant={getStatusColor(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.completionDate && `Completed: ${formatDate(item.completionDate)}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CameraIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No completed items with images yet.</p>
              <p className="text-sm mt-2">Mark your goals as complete to see them here.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress" className="space-y-4">
          {inProgressItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {inProgressItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleImageClick(item)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={item.imageUrl || getPlaceholderImage(item.category)} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <ZoomIn className="text-white h-8 w-8" />
                    </div>
                    <Badge 
                      className="absolute top-2 right-2"
                      variant={getStatusColor(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.targetDate && `Target: ${formatDate(item.targetDate)}`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CameraIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No in-progress items with images yet.</p>
              <p className="text-sm mt-2">Add images to your in-progress goals.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="not-started" className="space-y-4">
          {notStartedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {notStartedItems.map(item => (
                <Card 
                  key={item.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleImageClick(item)}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img 
                      src={item.imageUrl || getPlaceholderImage(item.category)} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                      <ZoomIn className="text-white h-8 w-8" />
                    </div>
                    <Badge 
                      className="absolute top-2 right-2"
                      variant={getStatusColor(item.status)}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.targetDate ? `Target: ${formatDate(item.targetDate)}` : "No target date"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <CameraIcon className="mx-auto h-12 w-12 mb-4 opacity-20" />
              <p>No not-started items with images yet.</p>
              <p className="text-sm mt-2">Add images to your upcoming goals.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => handleCloseImage()}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-transparent border-0 shadow-2xl">
          <div className="bg-white dark:bg-gray-900 rounded-t-lg p-4">
            <DialogHeader>
              <DialogTitle>{selectedItem?.title}</DialogTitle>
              <DialogDescription>
                {selectedItem?.description || 'No description available'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Badge variant={getStatusColor(selectedItem?.status || "")}>
                  {selectedItem?.status}
                </Badge>
                {selectedItem?.category && (
                  <Badge variant="outline" className="ml-2">
                    {selectedItem.category}
                  </Badge>
                )}
              </div>
              <div>
                {selectedItem?.status === "Completed" && selectedItem?.completionDate ? (
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    <span>Completed: {formatDate(selectedItem.completionDate)}</span>
                  </div>
                ) : selectedItem?.targetDate ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Target: {formatDate(selectedItem.targetDate)}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          
          <div className="relative aspect-video bg-black flex items-center justify-center">
            <img 
              src={selectedImage || ''} 
              alt={selectedItem?.title || 'Selected Image'} 
              className="max-h-[70vh] max-w-full object-contain"
            />
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-b-lg p-4 flex justify-end">
            <Button onClick={handleCloseImage}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}