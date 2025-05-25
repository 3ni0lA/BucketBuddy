import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Award, Target, TrendingUp, Check, Calendar, CheckCircle } from "lucide-react";
import type { BucketListItem } from "@shared/schema";

interface ProgressTrackerProps {
  bucketListItems: BucketListItem[];
}

// Custom colors for charts
const COLORS = {
  completed: "#22c55e",
  inProgress: "#3b82f6",
  notStarted: "#f97316",
  background: "#f8fafc",
  text: "#1e293b",
  backgroundDark: "#1e293b",
  textDark: "#f8fafc",
};

// Chart config for status colors
const statusColors = {
  completed: COLORS.completed,
  inProgress: COLORS.inProgress,
  notStarted: COLORS.notStarted,
};

export function ProgressTracker({ bucketListItems }: ProgressTrackerProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [completionRate, setCompletionRate] = useState(0);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<BucketListItem[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<BucketListItem[]>([]);

  useEffect(() => {
    if (!bucketListItems.length) return;

    // Calculate status counts
    const statusCounts = {
      completed: 0,
      inProgress: 0,
      notStarted: 0
    };

    bucketListItems.forEach(item => {
      if (item.status === "Completed") statusCounts.completed++;
      else if (item.status === "In Progress") statusCounts.inProgress++;
      else statusCounts.notStarted++;
    });

    // Calculate completion rate
    const totalItems = bucketListItems.length;
    const completionPercentage = totalItems > 0 
      ? Math.round((statusCounts.completed / totalItems) * 100) 
      : 0;
    setCompletionRate(completionPercentage);

    // Create status data for pie chart
    const statusChartData = [
      { name: "Completed", value: statusCounts.completed },
      { name: "In Progress", value: statusCounts.inProgress },
      { name: "Not Started", value: statusCounts.notStarted },
    ].filter(item => item.value > 0);
    setStatusData(statusChartData);

    // Get category distribution
    const categoryCounts: Record<string, { total: number, completed: number }> = {};
    bucketListItems.forEach(item => {
      const category = item.category || "Uncategorized";
      if (!categoryCounts[category]) {
        categoryCounts[category] = { total: 0, completed: 0 };
      }
      categoryCounts[category].total++;
      if (item.status === "Completed") {
        categoryCounts[category].completed++;
      }
    });

    // Create category data for bar chart
    const categoryChartData = Object.entries(categoryCounts)
      .map(([name, { total, completed }]) => ({
        name,
        total,
        completed,
        inProgress: total - completed
      }))
      .sort((a, b) => b.total - a.total);
    setCategoryData(categoryChartData);

    // Get priority distribution
    const priorityCounts: Record<string, number> = {
      High: 0,
      Medium: 0,
      Low: 0
    };
    bucketListItems.forEach(item => {
      const priority = item.priority || "Medium";
      priorityCounts[priority]++;
    });

    // Create priority data for pie chart
    const priorityChartData = Object.entries(priorityCounts)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
    setPriorityData(priorityChartData);

    // Get recent completions (last 5)
    const completedItems = bucketListItems
      .filter(item => item.status === "Completed" && item.completionDate)
      .sort((a, b) => {
        const dateA = new Date(a.completionDate || 0).getTime();
        const dateB = new Date(b.completionDate || 0).getTime();
        return dateB - dateA; // Descending order
      })
      .slice(0, 5);
    setRecentCompletions(completedItems);

    // Get upcoming deadlines (next 5)
    const today = new Date();
    const upcoming = bucketListItems
      .filter(item => 
        item.status !== "Completed" && 
        item.targetDate && 
        new Date(item.targetDate) >= today
      )
      .sort((a, b) => {
        const dateA = new Date(a.targetDate || 0).getTime();
        const dateB = new Date(b.targetDate || 0).getTime();
        return dateA - dateB; // Ascending order
      })
      .slice(0, 5);
    setUpcomingDeadlines(upcoming);

    // Calculate timeline data (completions by month)
    const timelineCount: Record<string, number> = {};
    bucketListItems
      .filter(item => item.status === "Completed" && item.completionDate)
      .forEach(item => {
        if (!item.completionDate) return;
        const date = new Date(item.completionDate);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!timelineCount[monthYear]) timelineCount[monthYear] = 0;
        timelineCount[monthYear]++;
      });

    // Get last 6 months for timeline
    const last6Months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthYear = `${month.getFullYear()}-${(month.getMonth() + 1).toString().padStart(2, '0')}`;
      last6Months.push(monthYear);
    }

    // Create timeline data
    const timelineChartData = last6Months.map(monthYear => {
      const [year, month] = monthYear.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return {
        name: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        value: timelineCount[monthYear] || 0
      };
    });
    setTimelineData(timelineChartData);

  }, [bucketListItems]);

  // Helper to format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get color based on priority
  const getPriorityColor = (priority: string | null | undefined) => {
    switch (priority) {
      case "High": return "destructive";
      case "Medium": return "secondary";
      case "Low": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Progress Dashboard</h2>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completion Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <Progress value={completionRate} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {bucketListItems.filter(i => i.status === "Completed").length} of {bucketListItems.length} goals completed
                </p>
              </CardContent>
            </Card>

            {/* Total Goals */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Goals
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bucketListItems.length}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Goals tracked in your bucket list
                </p>
              </CardContent>
            </Card>
            
            {/* In Progress */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {bucketListItems.filter(i => i.status === "In Progress").length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Goals currently in progress
                </p>
              </CardContent>
            </Card>
            
            {/* Achievements */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Achievements
                </CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {recentCompletions.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Goals completed recently
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Status Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Goal Status</CardTitle>
                <CardDescription>
                  Distribution of your goals by current status
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-2">
                {statusData.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {statusData.map((entry, index) => {
                            const key = entry.name.toLowerCase().replace(/\s+/g, '');
                            const colorKey = key as keyof typeof statusColors;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={statusColors[colorKey] || "#ccc"}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
            
            {/* Recent completions */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>
                  Your most recently completed goals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentCompletions.length > 0 ? (
                  <div className="space-y-3">
                    {recentCompletions.map(item => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <div>
                            <h4 className="text-sm font-medium">{item.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.completionDate && formatDate(item.completionDate)}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{item.category || "Uncategorized"}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No completed goals yet. Start achieving!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Upcoming deadlines */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                Goals with approaching target dates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {upcomingDeadlines.map(item => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">{item.title}</h4>
                          <div className="flex space-x-2">
                            <Badge>{item.status}</Badge>
                            <Badge variant={getPriorityColor(item.priority)}>
                              {item.priority || "Medium"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{item.targetDate && formatDate(item.targetDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No upcoming deadlines. Set target dates for your goals!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* CATEGORIES TAB */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Categories Overview</CardTitle>
              <CardDescription>
                Distribution of goals across different categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill={COLORS.completed} />
                      <Bar dataKey="inProgress" name="In Progress" stackId="a" fill={COLORS.inProgress} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No category data available. Add categories to your goals!
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
              <CardDescription>
                How your goals are distributed by priority levels
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              {priorityData.length > 0 ? (
                <div className="h-[300px] w-full max-w-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {priorityData.map((entry, index) => {
                          const colors = {
                            "High": "#ef4444",
                            "Medium": "#3b82f6",
                            "Low": "#6b7280"
                          };
                          return (
                            <Cell 
                              key={`cell-${index}`}
                              fill={colors[entry.name as keyof typeof colors] || "#ccc"}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  No priority data available. Set priorities for your goals!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Timeline</CardTitle>
              <CardDescription>
                Goals completed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timelineData.some(d => d.value > 0) ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timelineData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="Completed Goals" 
                        fill={COLORS.completed}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No completion timeline data available yet. Keep achieving your goals!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}