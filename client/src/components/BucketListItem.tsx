import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MoreVertical, 
  CheckCircle, 
  Pencil, 
  Trash2,
  Flag,
  Tag,
  Clock
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BucketListItem as BucketListItemType } from "@shared/schema";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BucketListItemProps {
  item: BucketListItemType;
  onEdit: (item: BucketListItemType) => void;
}

export function BucketListItem({ item, onEdit }: BucketListItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Status badge variant mapper
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Not Started": return "notStarted";
      case "In Progress": return "inProgress";
      case "Completed": return "completed";
      default: return "default";
    }
  };

  // Priority badge variant mapper
  const getPriorityVariant = (priority: string | null | undefined) => {
    switch (priority) {
      case "Low": return "outline";
      case "Medium": return "secondary";
      case "High": return "destructive";
      default: return "secondary";
    }
  };

  // Priority icon
  const getPriorityIcon = (priority: string | null | undefined) => {
    switch (priority) {
      case "High": return <Flag className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };
  
  // Placeholder image based on category
  const getCategoryImage = (category: string | null) => {
    switch (category) {
      case "Travel":
        return "https://images.unsplash.com/photo-1501426026826-31c667bdf23d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Adventure":
        return "https://images.unsplash.com/photo-1521673252667-e05da380b252?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Personal Growth":
        return "https://images.unsplash.com/photo-1525201548942-d8732f6617a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
      case "Education":
        return "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=450";
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
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/bucket-list/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bucket-list'] });
      toast({
        title: "Item deleted",
        description: "The bucket list item has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });

  // Toggle complete mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async () => {
      const newStatus = item.status === "Completed" ? "In Progress" : "Completed";
      const completionDate = newStatus === "Completed" ? new Date().toISOString().split('T')[0] : null;
      
      await apiRequest("PATCH", `/api/bucket-list/${item.id}`, {
        status: newStatus,
        completionDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bucket-list'] });
      toast({
        title: item.status === "Completed" ? "Marked as in progress" : "Marked as completed",
        description: item.status === "Completed" 
          ? "The item has been moved back to in progress." 
          : "Congratulations on completing this goal!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update status: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });

  // Toggle description expansion
  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  // Handle long descriptions
  const shortenDescription = (desc: string) => {
    if (!desc) return "";
    return desc.length > 100 ? desc.substring(0, 100) + "..." : desc;
  };

  return (
    <Card className="theme-transition card-hover overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Image */}
      <div className="w-full h-48 overflow-hidden">
        <img 
          src={item.imageUrl || getCategoryImage(item.category)} 
          alt={item.title} 
          className="w-full h-full object-cover" 
        />
      </div>
      
      <CardContent className="p-6 flex-grow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Badge variant={getStatusVariant(item.status)}>
              {item.status}
            </Badge>
            
            {item.priority && (
              <Badge variant={getPriorityVariant(item.priority)} className="flex items-center">
                {getPriorityIcon(item.priority)}
                {item.priority} priority
              </Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toggleCompleteMutation.mutate()}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {item.status === "Completed" ? "Mark as In Progress" : "Mark as Completed"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
        
        {item.description && (
          <div className="mb-4">
            <p 
              className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer"
              onClick={toggleDescription}
            >
              {showFullDescription ? item.description : shortenDescription(item.description)}
              {item.description.length > 100 && !showFullDescription && (
                <span className="text-primary font-medium ml-1">Read more</span>
              )}
              {showFullDescription && (
                <span className="text-primary font-medium ml-1">Show less</span>
              )}
            </p>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
          {item.status === "Completed" && item.completionDate ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Completed: {format(new Date(item.completionDate), "MMMM d, yyyy")}</span>
            </>
          ) : (
            <>
              <Clock className="mr-2 h-4 w-4" />
              <span>Target: {item.targetDate ? format(new Date(item.targetDate), "MMMM yyyy") : "Ongoing"}</span>
            </>
          )}
        </div>

        {item.category && (
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          </div>
        )}
      </CardContent>

      {/* Tags section */}
      {item.tags && item.tags.length > 0 && (
        <CardFooter className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <TooltipProvider>
              {item.tags.slice(0, 3).map((tag, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger>
                    <Badge variant="secondary" className="bg-opacity-70 flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tag}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {item.tags.length > 3 && (
                <Tooltip>
                  <TooltipTrigger>
                    <Badge variant="outline" className="cursor-pointer">
                      +{item.tags.length - 3}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {item.tags.slice(3).map((tag, index) => (
                        <p key={index}>{tag}</p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
