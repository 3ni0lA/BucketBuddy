import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { BucketListItem } from "@/components/BucketListItem";
import { AddBucketItemModal } from "@/components/AddBucketItemModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search } from "lucide-react";
import type { BucketListItem as BucketListItemType } from "@shared/schema";

export function BucketList() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<BucketListItemType | null>(null);
  const [filter, setFilter] = useState<string>("All Items");
  const [search, setSearch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Query bucket list items
  const { data: bucketListItems = [], isLoading, isError } = useQuery<BucketListItemType[]>({
    queryKey: ['/api/bucket-list', filter, search],
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
  
  // Pagination
  const totalPages = Math.ceil((bucketListItems?.length || 0) / itemsPerPage);
  const currentItems = bucketListItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Handle modal open/close
  const handleAddItem = () => {
    setEditItem(null);
    setIsModalOpen(true);
  };
  
  const handleEditItem = (item: BucketListItemType) => {
    setEditItem(item);
    setIsModalOpen(true);
  };
  
  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on search
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
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
          
          {/* Filters */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center sm:w-48">
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Items">All Items</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
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
          </div>
        </div>
        
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
        {!isLoading && bucketListItems.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
              No bucket list items found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {search || filter !== "All Items"
                ? "No items match your current filters. Try changing your search or filters."
                : "Get started by adding your first bucket list item."}
            </p>
            <Button
              onClick={handleAddItem}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Goal
            </Button>
          </div>
        )}
        
        {/* Bucket list grid */}
        {!isLoading && bucketListItems.length > 0 && (
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
