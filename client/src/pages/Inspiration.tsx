import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, HeartHandshake, Heart, Compass, Award, Globe, BookOpen, Lightbulb } from "lucide-react";
import { AddBucketItemModal } from "@/components/AddBucketItemModal";
import { AchievementBadges } from "@/components/AchievementBadges";
import type { BucketListItem } from "@shared/schema";

// Sample inspiration ideas by category
const INSPIRATION_IDEAS = {
  travel: [
    { title: "Visit the Northern Lights in Iceland", category: "Travel", difficulty: "Medium" },
    { title: "Take a hot air balloon ride over Cappadocia", category: "Travel", difficulty: "Medium" },
    { title: "Road trip along Route 66", category: "Travel", difficulty: "Medium" },
    { title: "Hike the Inca Trail to Machu Picchu", category: "Travel", difficulty: "Hard" },
    { title: "Stay in an overwater bungalow in the Maldives", category: "Travel", difficulty: "Hard" },
    { title: "Visit all seven continents", category: "Travel", difficulty: "Hard" },
  ],
  adventure: [
    { title: "Go skydiving", category: "Adventure", difficulty: "Medium" },
    { title: "Learn to scuba dive", category: "Adventure", difficulty: "Medium" },
    { title: "Go bungee jumping", category: "Adventure", difficulty: "Medium" },
    { title: "Climb a mountain peak", category: "Adventure", difficulty: "Hard" },
    { title: "Go white water rafting", category: "Adventure", difficulty: "Medium" },
    { title: "Try paragliding", category: "Adventure", difficulty: "Medium" },
  ],
  personal: [
    { title: "Learn a new language", category: "Personal Growth", difficulty: "Hard" },
    { title: "Run a marathon", category: "Personal Growth", difficulty: "Hard" },
    { title: "Write a book", category: "Personal Growth", difficulty: "Hard" },
    { title: "Learn to play a musical instrument", category: "Personal Growth", difficulty: "Medium" },
    { title: "Start a meditation practice", category: "Personal Growth", difficulty: "Easy" },
    { title: "Take a cooking class", category: "Personal Growth", difficulty: "Easy" },
  ],
  career: [
    { title: "Start your own business", category: "Career", difficulty: "Hard" },
    { title: "Give a TED talk", category: "Career", difficulty: "Hard" },
    { title: "Get a promotion", category: "Career", difficulty: "Medium" },
    { title: "Learn a new skill that advances your career", category: "Career", difficulty: "Medium" },
    { title: "Mentor someone in your field", category: "Career", difficulty: "Easy" },
    { title: "Network with industry leaders", category: "Career", difficulty: "Medium" },
  ],
  relationships: [
    { title: "Volunteer for a cause you care about", category: "Relationships", difficulty: "Easy" },
    { title: "Host a dinner party for friends", category: "Relationships", difficulty: "Easy" },
    { title: "Reconnect with old friends", category: "Relationships", difficulty: "Easy" },
    { title: "Take a family vacation", category: "Relationships", difficulty: "Medium" },
    { title: "Write letters to loved ones", category: "Relationships", difficulty: "Easy" },
    { title: "Learn the love language of your partner", category: "Relationships", difficulty: "Easy" },
  ],
  creative: [
    { title: "Paint a picture", category: "Creativity", difficulty: "Easy" },
    { title: "Take a photography course", category: "Creativity", difficulty: "Medium" },
    { title: "Write poetry", category: "Creativity", difficulty: "Easy" },
    { title: "Learn to dance", category: "Creativity", difficulty: "Medium" },
    { title: "Create a short film", category: "Creativity", difficulty: "Hard" },
    { title: "Design and build something with your hands", category: "Creativity", difficulty: "Medium" },
  ],
};

// Sample quotes about dreams and goals
const INSPIRATIONAL_QUOTES = [
  { quote: "The biggest adventure you can take is to live the life of your dreams.", author: "Oprah Winfrey" },
  { quote: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
  { quote: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { quote: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney" },
  { quote: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { quote: "A goal is a dream with a deadline.", author: "Napoleon Hill" },
  { quote: "Dreams don't work unless you do.", author: "John C. Maxwell" },
  { quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
];

export default function Inspiration() {
  const [activeTab, setActiveTab] = useState("travel");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  
  // Fetch bucket list items for badges
  const { data: bucketListItems = [], isLoading } = useQuery<BucketListItem[]>({
    queryKey: ['/api/bucket-list'],
    queryFn: async () => {
      const response = await fetch('/api/bucket-list', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bucket list items');
      }
      
      return response.json();
    }
  });
  
  // Get a random quote
  const randomQuote = INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
  
  const handleAddToList = (idea: any) => {
    setSelectedIdea({
      title: idea.title,
      description: "",
      status: "Not Started",
      category: idea.category,
      priority: idea.difficulty === "Hard" ? "High" : idea.difficulty === "Medium" ? "Medium" : "Low",
    });
    setIsModalOpen(true);
  };
  
  // Helper function to get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "travel": return <Globe className="h-5 w-5" />;
      case "adventure": return <Compass className="h-5 w-5" />;
      case "personal": return <Heart className="h-5 w-5" />;
      case "career": return <Award className="h-5 w-5" />;
      case "relationships": return <HeartHandshake className="h-5 w-5" />;
      case "creative": return <Lightbulb className="h-5 w-5" />;
      default: return <BookOpen className="h-5 w-5" />;
    }
  };
  
  // Helper function to get color for difficulty
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "outline";
      case "Medium": return "secondary";
      case "Hard": return "destructive";
      default: return "secondary";
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 theme-transition">
        <div className="pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Get Inspired</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Discover new ideas for your bucket list
              </p>
            </div>
            
            {/* Inspirational Quote */}
            <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-0">
              <CardContent className="pt-6">
                <blockquote className="italic text-lg text-gray-700 dark:text-gray-300">
                  "{randomQuote.quote}"
                </blockquote>
                <p className="text-right mt-2 text-gray-600 dark:text-gray-400">— {randomQuote.author}</p>
              </CardContent>
            </Card>
            
            {/* Achievement Badges */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Your Achievements</h2>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-pulse text-gray-500 dark:text-gray-400">
                    Loading achievements...
                  </div>
                </div>
              ) : (
                <AchievementBadges bucketListItems={bucketListItems} />
              )}
            </div>
            
            {/* Category Tabs */}
            <Tabs defaultValue="travel" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex mb-6">
                <TabsTrigger value="travel" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">Travel</span>
                </TabsTrigger>
                <TabsTrigger value="adventure" className="flex items-center gap-2">
                  <Compass className="h-4 w-4" />
                  <span className="hidden sm:inline">Adventure</span>
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  <span className="hidden sm:inline">Personal Growth</span>
                </TabsTrigger>
                <TabsTrigger value="career" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  <span className="hidden sm:inline">Career</span>
                </TabsTrigger>
                <TabsTrigger value="relationships" className="flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4" />
                  <span className="hidden sm:inline">Relationships</span>
                </TabsTrigger>
                <TabsTrigger value="creative" className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  <span className="hidden sm:inline">Creative</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Tab Contents */}
              {Object.entries(INSPIRATION_IDEAS).map(([key, ideas]) => (
                <TabsContent key={key} value={key} className="mt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {ideas.map((idea, index) => (
                      <Card key={index} className="overflow-hidden transition-all hover:shadow-md">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{idea.title}</CardTitle>
                            <Badge variant={getDifficultyColor(idea.difficulty)}>
                              {idea.difficulty}
                            </Badge>
                          </div>
                          <CardDescription>{idea.category}</CardDescription>
                        </CardHeader>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleAddToList(idea)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Add to My Bucket List
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* Add to List Modal */}
      <AddBucketItemModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editItem={selectedIdea}
      />
    </div>
  );
}