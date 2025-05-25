import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ImageGallery } from "@/components/ImageGallery";
import type { BucketListItem } from "@shared/schema";

export default function Gallery() {
  // Fetch bucket list items for gallery
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
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50 dark:bg-gray-900 theme-transition">
        <div className="pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Achievement Gallery</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Visualize your journey through photos of your achievements
              </p>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-pulse text-gray-500 dark:text-gray-400">
                  Loading gallery...
                </div>
              </div>
            ) : (
              <ImageGallery bucketListItems={bucketListItems} />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}