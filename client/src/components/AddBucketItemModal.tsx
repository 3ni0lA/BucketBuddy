import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X, Plus, Tag } from "lucide-react";
import { insertBucketListItemSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BucketListItem } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define constants for selectable categories
const CATEGORIES = [
  "Travel",
  "Adventure",
  "Personal Growth",
  "Career",
  "Education",
  "Relationships",
  "Health",
  "Finance",
  "Creativity",
  "Skill",
  "Other"
];

const PRIORITIES = [
  "Low",
  "Medium",
  "High"
];

// Extend the insert schema with validation
const formSchema = insertBucketListItemSchema.extend({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  tags: z.array(z.string()).optional(),
  priority: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddBucketItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: BucketListItem | null;
}

export function AddBucketItemModal({ open, onOpenChange, editItem }: AddBucketItemModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!editItem;
  const [tagInput, setTagInput] = useState('');
  
  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "Not Started",
      category: "Travel",
      priority: "Medium",
      tags: [],
      targetDate: undefined,
    },
  });
  
  // Update form values when editing an item
  useEffect(() => {
    if (editItem) {
      form.reset({
        title: editItem.title,
        description: editItem.description || "",
        status: editItem.status,
        category: editItem.category || "Travel",
        priority: editItem.priority || "Medium",
        tags: editItem.tags || [],
        targetDate: editItem.targetDate ? new Date(editItem.targetDate) : undefined,
        imageUrl: editItem.imageUrl,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "Not Started",
        category: "Travel",
        priority: "Medium",
        tags: [],
        targetDate: undefined,
        imageUrl: "",
      });
    }
  }, [editItem, form]);
  
  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || [];
      const newTag = tagInput.trim();
      
      // Avoid duplicate tags
      if (!currentTags.includes(newTag)) {
        form.setValue("tags", [...currentTags, newTag]);
      }
      
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      currentTags.filter(tag => tag !== tagToRemove)
    );
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest("POST", "/api/bucket-list", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bucket-list'] });
      toast({
        title: "Success!",
        description: "Your bucket list item has been created.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create item: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!editItem) return;
      return await apiRequest("PATCH", `/api/bucket-list/${editItem.id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bucket-list'] });
      toast({
        title: "Success!",
        description: "Your bucket list item has been updated.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (values: FormValues) => {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };
  
  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };
  
  // Calculate if the form is submitting/pending
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bucket List Item" : "Add New Bucket List Item"}</DialogTitle>
          <Button 
            className="absolute top-2 right-2"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="What do you want to achieve?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your goal" 
                      className="resize-none" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map(priority => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Target Completion Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(field.value || []).map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                        className="flex items-center gap-1 py-1 px-3"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive ml-1" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                    />
                    <Button 
                      type="button" 
                      size="icon" 
                      onClick={handleAddTag}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Press Enter or click the + button to add a tag
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter image URL" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
