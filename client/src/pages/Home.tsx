import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { BucketList } from "@/components/BucketList";
import { ReminderSystem } from "@/components/ReminderSystem";
import { ProgressTracker } from "@/components/ProgressTracker";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BucketListItem } from "@shared/schema";

export default function Home() {
  const [activeTab, setActiveTab] = useState("goals");
  
  // Fetch bucket list items for both tabs
  const { data: bucketListItems = [] } = useQuery<BucketListItem[]>({
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
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 theme-transition">
        <div className="pt-16 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Reminders Section */}
            {bucketListItems.length > 0 && (
              <div className="pt-8">
                <ReminderSystem bucketListItems={bucketListItems} />
              </div>
            )}
            
            {/* Main Content Tabs */}
            <Tabs 
              defaultValue="goals" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex mb-6">
                <TabsTrigger value="goals">My Goals</TabsTrigger>
                <TabsTrigger value="progress">Progress Dashboard</TabsTrigger>
              </TabsList>
              
              <TabsContent value="goals" className="mt-0">
                <BucketList />
              </TabsContent>
              
              <TabsContent value="progress" className="mt-0">
                <ProgressTracker bucketListItems={bucketListItems} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
