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
import { Sun, Moon, Menu, CheckSquare } from "lucide-react";

export function Navbar() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
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
              <Link href="/">
                <a className={`${location === "/" ? "border-primary text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/stats">
                <a className={`${location === "/stats" ? "border-primary text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Statistics
                </a>
              </Link>
              <Link href="/inspiration">
                <a className={`${location === "/inspiration" ? "border-primary text-gray-900 dark:text-white" : "border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Inspiration
                </a>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="mr-4"
            >
              {theme === "light" ? <Moon className="h-5 w-5 text-indigo-300" /> : <Sun className="h-5 w-5 text-amber-500" />}
              <span className="sr-only">Toggle theme</span>
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
                      <AvatarFallback>{(user.firstName?.[0] || "") + (user.lastName?.[0] || "U")}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Link href="/profile">
                      <a className="w-full">Your Profile</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/settings">
                      <a className="w-full">Settings</a>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a href="/api/logout" className="w-full">Sign out</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <div className="sm:hidden ml-3">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <Link href="/">
            <a className={`${location === "/" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"} block pl-3 pr-4 py-2 text-base font-medium`}>
              Dashboard
            </a>
          </Link>
          <Link href="/stats">
            <a className={`${location === "/stats" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"} block pl-3 pr-4 py-2 text-base font-medium`}>
              Statistics
            </a>
          </Link>
          <Link href="/inspiration">
            <a className={`${location === "/inspiration" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"} block pl-3 pr-4 py-2 text-base font-medium`}>
              Inspiration
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}
