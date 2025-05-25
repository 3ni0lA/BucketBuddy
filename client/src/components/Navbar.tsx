import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sun, Moon, Menu, CheckSquare, X, LogOut } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("GET", "/api/logout");
    },
    onSuccess: () => {
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      // Refresh the page to update auth state
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred during logout",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = () => {
    if (!user) return "U";
    const firstInitial = user.firstName?.[0] || "";
    const lastInitial = user.lastName?.[0] || "";
    return firstInitial + lastInitial || user.email?.[0]?.toUpperCase() || "U";
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="theme-transition border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <CheckSquare className="h-6 w-6 text-primary mr-2" />
              <span className="font-bold text-xl">BucketList</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" 
                className={`${location === "/" ? "border-primary text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Dashboard
              </Link>
              <Link href="/stats" 
                className={`${location === "/stats" ? "border-primary text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Statistics
              </Link>
              <Link href="/inspiration" 
                className={`${location === "/inspiration" ? "border-primary text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                Inspiration
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="mr-4"
              aria-label="Toggle theme"
            >
              {theme === "light" ? 
                <Moon className="h-5 w-5 text-indigo-500" /> : 
                <Sun className="h-5 w-5 text-yellow-400" />
              }
            </Button>
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.profileImageUrl || ""} 
                        alt={`${user.firstName || ""} ${user.lastName || ""}`} 
                        className="object-cover"
                      />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/profile">Your Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <span className="w-full flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="sm:hidden ml-3">
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`sm:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/"
            className={`${location === "/" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"} block pl-3 pr-4 py-2 text-base font-medium`}>
            Dashboard
          </Link>
          <Link href="/stats"
            className={`${location === "/stats" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"} block pl-3 pr-4 py-2 text-base font-medium`}>
            Statistics
          </Link>
          <Link href="/inspiration"
            className={`${location === "/inspiration" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"} block pl-3 pr-4 py-2 text-base font-medium`}>
            Inspiration
          </Link>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 pl-3 pr-4 py-2 text-base font-medium"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
