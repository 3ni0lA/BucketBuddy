import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BucketListItem } from "@/components/BucketListItem";
import { AddBucketItemModal } from "@/components/AddBucketItemModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search, Filter, Tag, ArrowDownAZ, ArrowUpAZ, Calendar } from "lucide-react";
import type { BucketListItem as BucketListItemType } from "@shared/schema";

// Define constants for categories (same as in AddBucketItemModal)
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

// Sort options for the bucket list
type SortOption = "name_asc" | "name_desc" | "date_asc" | "date_desc" | "priority";

export function BucketList() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<BucketListItemType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("All Items");
  const [categoryFilter, setCategoryFilter] = useState<string>("All Categories");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>("All Priorities");
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [viewMode, setViewMode] = useState<string>("all");
  
  const itemsPerPage = 6;
  
  // Query bucket list items
  const { data: bucketListItems = [], isLoading, isError } = useQuery<BucketListItemType[]>({
    queryKey: ['/api/bucket-list', statusFilter, search],
    queryFn: async ({ queryKey }) => {
      const [_, filterParam, searchParam] = queryKey;
      const params = new URLSearchParams();
      
      if (filterParam !== "All Items") {
        params.append("filter", filterParam as string);
      }
      
      if (searchParam) {
        params.append("search", searchParam as string);
      }
      
      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(`/api/bucket-list${queryString}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bucket list items');
      }
      
      return response.json();
    }
  });
  
  // Extract all unique tags from bucket list items
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    bucketListItems.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [bucketListItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    // Start with all items
    let filtered = [...bucketListItems];
    
    // Filter by view mode (tabs)
    if (viewMode === "upcoming") {
      filtered = filtered.filter(item => 
        item.status !== "Completed" && 
        item.targetDate && 
        new Date(item.targetDate) > new Date()
      );
    } else if (viewMode === "completed") {
      filtered = filtered.filter(item => item.status === "Completed");
    }
    
    // Filter by status
    if (statusFilter !== "All Items") {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    // Filter by category
    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }
    
    // Filter by priority
    if (priorityFilter !== "All Priorities") {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    // Filter by selected tags (item must have ALL selected tags)
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.tags || !Array.isArray(item.tags)) return false;
        return selectedTags.every(tag => item.tags!.includes(tag));
      });
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const descMatch = item.description?.toLowerCase().includes(searchLower);
        const categoryMatch = item.category?.toLowerCase().includes(searchLower);
        const tagMatch = item.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        return titleMatch || descMatch || categoryMatch || tagMatch;
      });
    }
    
    // Sort items
    switch (sortBy) {
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "date_asc":
        filtered.sort((a, b) => {
          // Sort by target date if available, otherwise sort by created date
          const dateA = a.targetDate ? new Date(a.targetDate) : new Date(a.createdAt);
          const dateB = b.targetDate ? new Date(b.targetDate) : new Date(b.createdAt);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case "date_desc":
        filtered.sort((a, b) => {
          const dateA = a.targetDate ? new Date(a.targetDate) : new Date(a.createdAt);
          const dateB = b.targetDate ? new Date(b.targetDate) : new Date(b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case "priority":
        // Sort by priority (High > Medium > Low)
        const priorityOrder = { "High": 1, "Medium": 2, "Low": 3 };
        filtered.sort((a, b) => {
          const priorityA = a.priority || "Medium";
          const priorityB = b.priority || "Medium";
          return (priorityOrder[priorityA as keyof typeof priorityOrder] || 99) - 
                 (priorityOrder[priorityB as keyof typeof priorityOrder] || 99);
        });
        break;
    }
    
    return filtered;
  }, [
    bucketListItems, 
    viewMode, 
    statusFilter, 
    categoryFilter, 
    priorityFilter, 
    selectedTags, 
    search, 
    sortBy
  ]);
  
  // Pagination
  const totalPages = Math.ceil((filteredItems?.length || 0) / itemsPerPage);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, priorityFilter, selectedTags, search, sortBy, viewMode]);
  
  // Handle modal open/close
  const handleAddItem = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };
  
  const handleEditItem = (item: BucketListItemType) => {
    setEditItem(item);
    setIsModalOpen(true);
  };
  
  // Handle filter changes
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  
  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
  };
  
  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
  };
  
  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  const handleClearFilters = () => {
    setStatusFilter("All Items");
    setCategoryFilter("All Categories");
    setPriorityFilter("All Priorities");
    setSelectedTags([]);
    setSearch("");
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  
  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };
  
  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    
    // Always show first page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink
          isActive={currentPage === 1}
          onClick={() => setCurrentPage(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Show ellipsis if not showing page 2
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show current page and surrounding pages
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last pages as they're always shown
      
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink
            isActive={currentPage === i}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if not showing second-to-last page
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink
            isActive={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="theme-transition pt-16 pb-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Bucket List</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track and achieve your life goals</p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button onClick={handleAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Goal
              </Button>
            </div>
          </div>
          
          {/* View Tabs */}
          <div className="mt-6">
            <Tabs defaultValue="all" value={viewMode} onValueChange={setViewMode}>
              <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex mb-6">
                <TabsTrigger value="all">All Goals</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="mt-0">
                {/* Content will be filtered based on tab selection */}
              </TabsContent>
              <TabsContent value="upcoming" className="mt-0">
                {/* Content will be filtered based on tab selection */}
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                {/* Content will be filtered based on tab selection */}
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Filters & Search */}
          <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 space-y-4">
            {/* Search & Sort Row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <form onSubmit={handleSearch} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search your bucket list"
                    className="w-full pl-8"
                    value={search}
                    onChange={handleSearchChange}
                  />
                </div>
              </form>
              
              <div className="flex items-center space-x-2">
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[200px]">
                    <div className="flex items-center">
                      {sortBy.includes('name') ? (
                        sortBy === 'name_asc' ? <ArrowDownAZ className="mr-2 h-4 w-4" /> : <ArrowUpAZ className="mr-2 h-4 w-4" />
                      ) : (
                        <Calendar className="mr-2 h-4 w-4" />
                      )}
                      <span>Sort by</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                    <SelectItem value="date_asc">Date (Oldest first)</SelectItem>
                    <SelectItem value="date_desc">Date (Newest first)</SelectItem>
                    <SelectItem value="priority">Priority (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Filters:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="h-8 text-xs px-3 py-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Items">All Statuses</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                  <SelectTrigger className="h-8 text-xs px-3 py-1">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Categories">All Categories</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Priority Filter */}
                <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
                  <SelectTrigger className="h-8 text-xs px-3 py-1">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Priorities">All Priorities</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Reset Filters Button */}
                {(statusFilter !== "All Items" || categoryFilter !== "All Categories" || 
                  priorityFilter !== "All Priorities" || selectedTags.length > 0 || search) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearFilters}
                    className="h-8 text-xs"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>
            
            {/* Tags Row */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Tags:</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge 
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Filter Summary */}
        {(statusFilter !== "All Items" || categoryFilter !== "All Categories" || 
          priorityFilter !== "All Priorities" || selectedTags.length > 0 || search) && (
          <div className="flex items-center flex-wrap gap-2 mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
            
            {statusFilter !== "All Items" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {statusFilter}
              </Badge>
            )}
            
            {categoryFilter !== "All Categories" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {categoryFilter}
              </Badge>
            )}
            
            {priorityFilter !== "All Priorities" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Priority: {priorityFilter}
              </Badge>
            )}
            
            {selectedTags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                Tag: {tag}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => handleTagSelect(tag)}
                >
                  ×
                </button>
              </Badge>
            ))}
            
            {search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {search}
                <button 
                  className="ml-1 hover:text-destructive"
                  onClick={() => setSearch("")}
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
        
        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              Failed to load bucket list items
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There was an error loading your items. Please try again.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        )}
        
        {/* Loading state */}
        {isLoading && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="w-full h-48 bg-gray-300 dark:bg-gray-700"></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="h-6 w-6 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                  </div>
                  <div className="h-6 w-3/4 bg-gray-300 dark:bg-gray-700 mb-2"></div>
                  <div className="h-16 w-full bg-gray-300 dark:bg-gray-700 mb-4"></div>
                  <div className="h-4 w-1/2 bg-gray-300 dark:bg-gray-700"></div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Empty state */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              No bucket list items found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {search || statusFilter !== "All Items" || categoryFilter !== "All Categories" || 
               priorityFilter !== "All Priorities" || selectedTags.length > 0
                ? "No items match your current filters. Try changing your search or filters."
                : "Get started by adding your first bucket list item."}
            </p>
            {search || statusFilter !== "All Items" || categoryFilter !== "All Categories" || 
             priorityFilter !== "All Priorities" || selectedTags.length > 0 ? (
              <Button
                variant="outline"
                className="mt-4"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={handleAddItem}
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Goal
              </Button>
            )}
          </div>
        )}
        
        {/* Bucket list grid */}
        {!isLoading && filteredItems.length > 0 && (
          <>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentItems.map((item) => (
                <BucketListItem 
                  key={item.id}
                  item={item}
                  onEdit={handleEditItem}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {getPaginationItems()}
                    
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Add/Edit Modal */}
      <AddBucketItemModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        editItem={editItem}
      />
    </div>
  );
}
