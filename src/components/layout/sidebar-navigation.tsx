"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Home, 
  LayoutDashboard, 
  Server, 
  Bot, 
  GitBranch, 
  MessageSquare, 
  Slack, 
  Settings, 
  User, 
  Menu, 
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

function NavItem({ href, label, icon, isActive, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive 
          ? "bg-primary/10 text-primary font-medium" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
}

function NavGroup({ title, children }: NavGroupProps) {
  return (
    <div className="space-y-1">
      <h3 className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

export function SidebarNavigation() {
  const pathname = usePathname();
  const { isAuthenticated, signOut } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Only show on client-side to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const closeMobileMenu = () => setIsMobileOpen(false);

  if (!isMounted) return null;
  if (!isAuthenticated) return null;
  
  return (
    <>
      {/* Mobile menu button - increased z-index for visibility */}
      <div className="fixed bottom-4 right-4 z-[100] md:hidden">
        <Button
          variant="default"
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-7 w-7" />
        </Button>
      </div>
      
      {/* Sidebar - desktop always visible, mobile as overlay */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-200 ease-in-out md:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Link href="/" className="flex items-center">
              <img src="/logo-dark-light.svg" alt="Nexus" className="h-8" />
            </Link>
            
            {/* Mobile close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-6 px-3">
              <NavGroup title="General">
                <NavItem 
                  href="/dashboard" 
                  label="Dashboard" 
                  icon={<LayoutDashboard className="h-4 w-4" />} 
                  isActive={pathname === '/dashboard'} 
                  onClick={closeMobileMenu}
                />
              </NavGroup>
              
              <NavGroup title="AI Flow">
                <NavItem 
                  href="/chat" 
                  label="AI Chat" 
                  icon={<MessageSquare className="h-4 w-4" />} 
                  isActive={pathname.startsWith('/chat')} 
                  onClick={closeMobileMenu}
                />
                <NavItem 
                  href="/workflow-demo" 
                  label="Workflow Designer" 
                  icon={<GitBranch className="h-4 w-4" />} 
                  isActive={pathname.startsWith('/workflow-demo')} 
                  onClick={closeMobileMenu}
                />
                <NavItem 
                  href="/fast-agent-demo" 
                  label="Fast-Agent" 
                  icon={<Bot className="h-4 w-4" />} 
                  isActive={pathname.startsWith('/fast-agent-demo')} 
                  onClick={closeMobileMenu}
                />
              </NavGroup>
              
              <NavGroup title="Settings">
                <NavItem 
                  href="/configuration" 
                  label="Configuration" 
                  icon={<Settings className="h-4 w-4" />} 
                  isActive={pathname.startsWith('/configuration')} 
                  onClick={closeMobileMenu}
                />
                <NavItem 
                  href="/servers" 
                  label="MCP Servers" 
                  icon={<Server className="h-4 w-4" />} 
                  isActive={pathname.startsWith('/servers')} 
                  onClick={closeMobileMenu}
                />
                <NavItem 
                  href="/slack" 
                  label="Slack Integration" 
                  icon={<Slack className="h-4 w-4" />} 
                  isActive={pathname.startsWith('/slack')} 
                  onClick={closeMobileMenu}
                />
              </NavGroup>
              
              <NavGroup title="Account">
                <NavItem 
                  href="/profile" 
                  label="Profile" 
                  icon={<User className="h-4 w-4" />} 
                  isActive={pathname.startsWith('/profile')} 
                  onClick={closeMobileMenu}
                />
                <NavItem 
                  href="#" 
                  label="Logout" 
                  icon={<LogOut className="h-4 w-4" />} 
                  isActive={false} 
                  onClick={() => {
                    closeMobileMenu();
                    signOut();
                  }}
                />
              </NavGroup>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}