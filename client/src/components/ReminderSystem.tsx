import { useState, useEffect } from "react";
import { format, isBefore, addDays, differenceInDays } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Calendar, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BucketListItem } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReminderType = {
  id: number;
  itemId: number;
  title: string;
  dueDate: string;
  daysLeft: number;
  priority: string;
  status: string;
  dismissed: boolean;
};

interface ReminderSystemProps {
  bucketListItems: BucketListItem[];
}

export function ReminderSystem({ bucketListItems }: ReminderSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reminders, setReminders] = useState<ReminderType[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BucketListItem | null>(null);
  const [dismissedReminders, setDismissedReminders] = useState<number[]>([]);

  // Load dismissed reminders from localStorage
  useEffect(() => {
    const savedDismissed = localStorage.getItem("dismissedReminders");
    if (savedDismissed) {
      setDismissedReminders(JSON.parse(savedDismissed));
    }
  }, []);

  // Save dismissed reminders to localStorage
  useEffect(() => {
    if (dismissedReminders.length > 0) {
      localStorage.setItem("dismissedReminders", JSON.stringify(dismissedReminders));
    }
  }, [dismissedReminders]);

  // Generate reminders based on due dates
  useEffect(() => {
    if (!bucketListItems.length) return;

    const today = new Date();
    const upcomingReminders: ReminderType[] = [];
    let reminderId = 1;

    bucketListItems.forEach(item => {
      if (item.status === "Completed" || !item.targetDate) return;
      
      const dueDate = new Date(item.targetDate);
      const daysLeft = differenceInDays(dueDate, today);
      
      // Generate reminders for items due within 30 days or overdue
      if (daysLeft <= 30) {
        upcomingReminders.push({
          id: reminderId++,
          itemId: item.id,
          title: item.title,
          dueDate: item.targetDate,
          daysLeft,
          priority: item.priority || "Medium",
          status: item.status,
          dismissed: dismissedReminders.includes(item.id)
        });
      }
    });

    // Sort reminders by days left (ascending)
    upcomingReminders.sort((a, b) => a.daysLeft - b.daysLeft);
    setReminders(upcomingReminders);
  }, [bucketListItems, dismissedReminders]);

  // Update item status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (params: { itemId: number; status: string }) => {
      const { itemId, status } = params;
      const completionDate = status === "Completed" ? new Date().toISOString().split('T')[0] : null;
      
      return await apiRequest("PATCH", `/api/bucket-list/${itemId}`, {
        status,
        completionDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bucket-list'] });
      toast({
        title: "Status updated",
        description: "The item status has been updated successfully.",
      });
      setReminderDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  });

  const handleDismissReminder = (reminderId: number, itemId: number) => {
    // Add item to dismissed list
    setDismissedReminders(prev => [...prev, itemId]);
    
    toast({
      title: "Reminder dismissed",
      description: "This reminder won't appear again unless you reset it.",
    });
  };

  const handleResetDismissed = () => {
    setDismissedReminders([]);
    localStorage.removeItem("dismissedReminders");
    toast({
      title: "Reminders reset",
      description: "All dismissed reminders have been restored.",
    });
  };

  const handleOpenReminderDetails = (itemId: number) => {
    const item = bucketListItems.find(item => item.id === itemId);
    if (item) {
      setSelectedItem(item);
      setReminderDialogOpen(true);
    }
  };

  const handleStatusChange = (status: string) => {
    if (!selectedItem) return;
    
    updateStatusMutation.mutate({
      itemId: selectedItem.id,
      status
    });
  };

  // Get active (non-dismissed) reminders
  const activeReminders = reminders.filter(r => !r.dismissed);
  
  // Display 3 most urgent reminders unless showAll is true
  const displayedReminders = showAll 
    ? activeReminders 
    : activeReminders.slice(0, 3);

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  // Function to get status description based on days left
  const getStatusText = (daysLeft: number) => {
    if (daysLeft < 0) return "Overdue";
    if (daysLeft === 0) return "Due today";
    if (daysLeft === 1) return "Due tomorrow";
    return `Due in ${daysLeft} days`;
  };

  if (activeReminders.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="text-primary h-5 w-5 mr-2" />
              <CardTitle>Upcoming Deadlines</CardTitle>
            </div>
            {dismissedReminders.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleResetDismissed}
              >
                Reset dismissed
              </Button>
            )}
          </div>
          <CardDescription>
            Stay on track with your upcoming goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayedReminders.map((reminder) => (
            <div 
              key={reminder.id} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium text-sm flex-1">{reminder.title}</h3>
                  <Badge variant={getPriorityColor(reminder.priority)}>
                    {reminder.priority}
                  </Badge>
                </div>
                <div className="flex items-center mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span className="mr-2">
                    {format(new Date(reminder.dueDate), "MMM d, yyyy")}
                  </span>
                  <Clock className="h-3 w-3 mr-1" />
                  <span className={reminder.daysLeft < 0 ? "text-destructive" : ""}>
                    {getStatusText(reminder.daysLeft)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleOpenReminderDetails(reminder.itemId)}
                >
                  View
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDismissReminder(reminder.id, reminder.itemId)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
        {activeReminders.length > 3 && (
          <CardFooter>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? "Show less" : `Show ${activeReminders.length - 3} more reminders`}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Reminder details dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedItem?.title}</DialogTitle>
            <DialogDescription>
              Update the status of this goal
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {selectedItem?.targetDate && format(new Date(selectedItem.targetDate), "MMMM d, yyyy")}
                </span>
              </div>
              <Badge variant={selectedItem?.status === "Completed" ? "completed" : "inProgress"}>
                {selectedItem?.status}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground">
                {selectedItem?.description || "No description provided"}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Update Status</h4>
              <Select 
                defaultValue={selectedItem?.status} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>
              Close
            </Button>
            {selectedItem?.status !== "Completed" && (
              <Button 
                onClick={() => handleStatusChange("Completed")}
                className="flex items-center"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}