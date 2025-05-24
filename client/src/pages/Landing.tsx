import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { CheckSquare, LogIn, Loader2 } from "lucide-react";

export default function Landing() {
  const { isLoading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-full py-6 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <CheckSquare className="h-6 w-6 text-primary mr-2" />
            <span className="font-bold text-xl">BucketList</span>
          </div>
          <Button asChild>
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <a href="/api/login" className="flex items-center">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </a>
            )}
          </Button>
        </div>
      </header>
      
      <main className="flex-1 bg-gray-50 dark:bg-gray-900">
        <section className="py-16 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                Track Your Life's Greatest Adventures
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
                Create, manage, and accomplish your bucket list goals with our intuitive tracking platform.
              </p>
              <Button size="lg" asChild>
                <a href="/api/login">Get Started</a>
              </Button>
            </div>
            
            <div className="mt-16 md:mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Track Your Goals</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Organize your dreams and ambitions in one central place, from travel destinations to personal achievements.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Stay Organized</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Categorize and prioritize your bucket list items with status tracking and target dates.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Celebrate Achievements</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Mark items as complete and celebrate your accomplishments as you turn dreams into memories.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              Popular Bucket List Categories
            </h2>
            
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative rounded-lg overflow-hidden h-64 group">
                <img 
                  src="https://images.unsplash.com/photo-1501426026826-31c667bdf23d" 
                  alt="Travel destinations" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">Travel</h3>
                    <p className="text-white/80 text-sm">Explore dream destinations</p>
                  </div>
                </div>
              </div>
              
              <div className="relative rounded-lg overflow-hidden h-64 group">
                <img 
                  src="https://images.unsplash.com/photo-1521673252667-e05da380b252" 
                  alt="Adventure activities" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">Adventure</h3>
                    <p className="text-white/80 text-sm">Push your limits</p>
                  </div>
                </div>
              </div>
              
              <div className="relative rounded-lg overflow-hidden h-64 group">
                <img 
                  src="https://images.unsplash.com/photo-1525201548942-d8732f6617a0" 
                  alt="Learning new skills" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">Skills</h3>
                    <p className="text-white/80 text-sm">Master new abilities</p>
                  </div>
                </div>
              </div>
              
              <div className="relative rounded-lg overflow-hidden h-64 group">
                <img 
                  src="https://images.unsplash.com/photo-1483347756197-71ef80e95f73" 
                  alt="Life experiences" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">Experiences</h3>
                    <p className="text-white/80 text-sm">Create lasting memories</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Ready to Start Your Bucket List Journey?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of dreamers and achievers who are turning their aspirations into reality.
              </p>
              <Button size="lg" asChild>
                <a href="/api/login">Sign In to Begin</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
