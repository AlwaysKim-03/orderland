import React, { createContext, useContext, useState, forwardRef } from 'react';
import { cn } from "@/lib/utils";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const [state, setState] = useState("expanded");

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, state, setState }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

// Sidebar Component
export const Sidebar = forwardRef(({ className, children, collapsible, ...props }, ref) => {
  const { state } = useSidebar();
  
  return (
    <aside
      ref={ref}
      className={cn(
        "flex flex-col transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
});
Sidebar.displayName = "Sidebar";

// SidebarContent Component
export const SidebarContent = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col flex-1", className)}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarContent.displayName = "SidebarContent";

// SidebarGroup Component
export const SidebarGroup = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarGroup.displayName = "SidebarGroup";

// SidebarGroupLabel Component
export const SidebarGroupLabel = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("px-3 py-2 text-xs font-medium", className)}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

// SidebarGroupContent Component
export const SidebarGroupContent = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarGroupContent.displayName = "SidebarGroupContent";

// SidebarMenu Component
export const SidebarMenu = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <nav
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </nav>
  );
});
SidebarMenu.displayName = "SidebarMenu";

// SidebarMenuItem Component
export const SidebarMenuItem = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    >
      {children}
    </div>
  );
});
SidebarMenuItem.displayName = "SidebarMenuItem";

// SidebarMenuButton Component
export const SidebarMenuButton = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton"; 