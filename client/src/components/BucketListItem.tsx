import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MoreVertical, CheckCircle, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BucketListItem as BucketListItemType } from "@shared/schema";

interface BucketListItemProps {
  item: BucketListItemType;
  onEdit: (item: BucketListItemType) => void;
}

export function BucketListItem({ item, onEdit }: BucketListItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Status badge variant mapper
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Not Started": return "notStarted";
      case "In Progress": return "inProgress";
      case "Completed": return "completed";
      default: return "default";
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

  return (
    <Card className="theme-transition card-hover overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Image */}
      <div className="w-full h-48 overflow-hidden">
        <img 
          src={item.imageUrl || getCategoryImage(item.category)} 
          alt={item.title} 
          className="w-full h-full object-cover" 
        />
      </div>
      
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Badge variant={getStatusVariant(item.status)}>
            {item.status}
          </Badge>
          
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
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{item.description}</p>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          {item.status === "Completed" && item.completionDate ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Completed: {format(new Date(item.completionDate), "MMMM d, yyyy")}</span>
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Target: {item.targetDate ? format(new Date(item.targetDate), "MMMM yyyy") : "Ongoing"}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
