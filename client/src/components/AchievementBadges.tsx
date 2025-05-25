import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, Star, Target, Clock, Map, CheckCircle, Heart, Zap, BookOpen } from "lucide-react";
import type { BucketListItem } from "@shared/schema";

interface AchievementBadgesProps {
  bucketListItems: BucketListItem[];
}

type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (items: BucketListItem[]) => boolean;
  level: "bronze" | "silver" | "gold";
  category?: string;
};

export function AchievementBadges({ bucketListItems }: AchievementBadgesProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Define achievements
  const achievements: Achievement[] = [
    {
      id: "first-complete",
      title: "First Steps",
      description: "Complete your first bucket list item",
      icon: <CheckCircle className="h-5 w-5" />,
      condition: (items) => items.some(item => item.status === "Completed"),
      level: "bronze"
    },
    {
      id: "five-complete",
      title: "Getting Started",
      description: "Complete 5 bucket list items",
      icon: <Star className="h-5 w-5" />,
      condition: (items) => items.filter(item => item.status === "Completed").length >= 5,
      level: "silver"
    },
    {
      id: "ten-complete",
      title: "Achievement Hunter",
      description: "Complete 10 bucket list items",
      icon: <Award className="h-5 w-5" />,
      condition: (items) => items.filter(item => item.status === "Completed").length >= 10,
      level: "gold"
    },
    {
      id: "all-categories",
      title: "Explorer",
      description: "Complete at least one item from each category",
      icon: <Map className="h-5 w-5" />,
      condition: (items) => {
        const categories = [...new Set(items.map(item => item.category).filter(Boolean))];
        const completedCategories = [...new Set(items
          .filter(item => item.status === "Completed")
          .map(item => item.category)
          .filter(Boolean))];
        return categories.length > 0 && completedCategories.length === categories.length;
      },
      level: "gold",
      category: "Variety"
    },
    {
      id: "high-priority",
      title: "Dream Chaser",
      description: "Complete 3 high priority items",
      icon: <Zap className="h-5 w-5" />,
      condition: (items) => 
        items.filter(item => 
          item.status === "Completed" && 
          item.priority === "High"
        ).length >= 3,
      level: "silver",
      category: "Priorities"
    },
    {
      id: "health-focus",
      title: "Wellness Warrior",
      description: "Complete 3 items in the Health category",
      icon: <Heart className="h-5 w-5" />,
      condition: (items) => 
        items.filter(item => 
          item.status === "Completed" && 
          item.category === "Health"
        ).length >= 3,
      level: "silver",
      category: "Health"
    },
    {
      id: "learning",
      title: "Lifelong Learner",
      description: "Complete 3 items in the Personal Growth or Skill categories",
      icon: <BookOpen className="h-5 w-5" />,
      condition: (items) => 
        items.filter(item => 
          item.status === "Completed" && 
          (item.category === "Personal Growth" || item.category === "Skill")
        ).length >= 3,
      level: "silver",
      category: "Learning"
    },
    {
      id: "deadline-master",
      title: "On Time, Every Time",
      description: "Complete 5 items before their target dates",
      icon: <Clock className="h-5 w-5" />,
      condition: (items) => {
        const onTimeItems = items.filter(item => {
          if (item.status !== "Completed" || !item.targetDate || !item.completionDate) return false;
          const targetDate = new Date(item.targetDate);
          const completionDate = new Date(item.completionDate);
          return completionDate <= targetDate;
        });
        return onTimeItems.length >= 5;
      },
      level: "gold",
      category: "Time Management"
    },
    {
      id: "consistency",
      title: "Consistent Achiever",
      description: "Complete at least one item every month for 3 consecutive months",
      icon: <Target className="h-5 w-5" />,
      condition: (items) => {
        // This is a placeholder condition since we can't track monthly completions without date analysis
        // In a real app, this would check completion dates across 3 consecutive months
        return items.filter(item => item.status === "Completed").length >= 10;
      },
      level: "gold",
      category: "Consistency"
    }
  ];
  
  // Filter earned achievements
  const earnedAchievements = achievements.filter(achievement => 
    achievement.condition(bucketListItems)
  );
  
  // Calculate progress for unearned achievements
  const unearned = achievements
    .filter(achievement => !achievement.condition(bucketListItems))
    .map(achievement => {
      let progress = 0;
      
      if (achievement.id === "first-complete") {
        progress = bucketListItems.some(item => item.status === "In Progress") ? 50 : 0;
      } else if (achievement.id === "five-complete") {
        const completed = bucketListItems.filter(item => item.status === "Completed").length;
        progress = Math.min(Math.floor((completed / 5) * 100), 99);
      } else if (achievement.id === "ten-complete") {
        const completed = bucketListItems.filter(item => item.status === "Completed").length;
        progress = Math.min(Math.floor((completed / 10) * 100), 99);
      } else if (achievement.id === "high-priority") {
        const completed = bucketListItems.filter(item => 
          item.status === "Completed" && 
          item.priority === "High"
        ).length;
        progress = Math.min(Math.floor((completed / 3) * 100), 99);
      } else if (achievement.id === "health-focus") {
        const completed = bucketListItems.filter(item => 
          item.status === "Completed" && 
          item.category === "Health"
        ).length;
        progress = Math.min(Math.floor((completed / 3) * 100), 99);
      } else if (achievement.id === "learning") {
        const completed = bucketListItems.filter(item => 
          item.status === "Completed" && 
          (item.category === "Personal Growth" || item.category === "Skill")
        ).length;
        progress = Math.min(Math.floor((completed / 3) * 100), 99);
      } else if (achievement.id === "deadline-master") {
        const onTimeItems = bucketListItems.filter(item => {
          if (item.status !== "Completed" || !item.targetDate || !item.completionDate) return false;
          const targetDate = new Date(item.targetDate);
          const completionDate = new Date(item.completionDate);
          return completionDate <= targetDate;
        });
        progress = Math.min(Math.floor((onTimeItems.length / 5) * 100), 99);
      } else {
        progress = 0;
      }
      
      return { ...achievement, progress };
    });
  
  // Get badge style based on level
  const getBadgeStyle = (level: string) => {
    switch (level) {
      case "bronze":
        return "bg-amber-700 hover:bg-amber-600 text-white";
      case "silver":
        return "bg-slate-400 hover:bg-slate-300 text-white";
      case "gold":
        return "bg-yellow-500 hover:bg-yellow-400 text-white";
      default:
        return "bg-slate-200 hover:bg-slate-100 text-slate-800";
    }
  };
  
  // Handle clicking on an achievement
  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowModal(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Achievements</h2>
        <div className="flex items-center text-sm text-muted-foreground">
          <Award className="mr-2 h-4 w-4" />
          <span>{earnedAchievements.length} earned</span>
        </div>
      </div>
      
      {earnedAchievements.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {earnedAchievements.map((achievement) => (
            <Card 
              key={achievement.id}
              className="cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleAchievementClick(achievement)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <Badge className={`mr-2 ${getBadgeStyle(achievement.level)}`}>
                    {achievement.level.charAt(0).toUpperCase() + achievement.level.slice(1)}
                  </Badge>
                  {achievement.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {achievement.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-2 text-primary">
                  {achievement.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-muted/50">
          <CardContent className="py-6 text-center">
            <Award className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p>Complete bucket list items to earn achievements</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your first achievement is waiting for you!
            </p>
          </CardContent>
        </Card>
      )}
      
      {unearned.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-8">
            <h3 className="text-xl font-medium tracking-tight">Locked Achievements</h3>
            <div className="text-sm text-muted-foreground">
              {unearned.length} remaining
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unearned.map((achievement) => (
              <Card 
                key={achievement.id}
                className="cursor-pointer hover:shadow-md transition-all opacity-70 hover:opacity-100"
                onClick={() => handleAchievementClick(achievement)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {achievement.level.charAt(0).toUpperCase() + achievement.level.slice(1)}
                    </Badge>
                    {achievement.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {achievement.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-2 text-muted-foreground">
                    {achievement.icon}
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-primary h-1.5 rounded-full" 
                      style={{ width: `${achievement.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    {achievement.progress}% complete
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
      
      {/* Achievement Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedAchievement && (
                <Badge className={`mr-2 ${getBadgeStyle(selectedAchievement.level)}`}>
                  {selectedAchievement.level.charAt(0).toUpperCase() + selectedAchievement.level.slice(1)}
                </Badge>
              )}
              {selectedAchievement?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedAchievement?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-6 text-primary">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {selectedAchievement?.icon}
            </div>
          </div>
          
          {selectedAchievement && !earnedAchievements.includes(selectedAchievement) && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Progress</h4>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${selectedAchievement.progress}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedAchievement.progress}% complete
              </p>
            </div>
          )}
          
          {selectedAchievement?.category && (
            <div className="text-sm">
              <span className="font-medium">Category:</span> {selectedAchievement.category}
            </div>
          )}
          
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}