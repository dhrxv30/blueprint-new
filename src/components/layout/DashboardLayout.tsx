// src/components/layout/DashboardLayout.tsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Layout, 
  FolderGit2, 
  FileText, 
  ListTodo, 
  CalendarDays, 
  Network, 
  GitMerge, 
  Code2, 
  TestTube, 
  LogOut,
  Menu,
  Bell,
  User,
  Settings,
  HelpCircle,
  Search,
  ChevronDown,
  Zap,
  LayoutDashboard,
  MessageSquareMore
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageTransition } from "../ui/PageTransition";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { name: "Projects", path: "/dashboard", icon: FolderGit2 },
  { name: "Overview", path: "/dashboard/overview", icon: LayoutDashboard },
  { name: "PRD Analysis", path: "/dashboard/analysis", icon: FileText },
  { name: "Chat & Clarify", path: "/dashboard/chat", icon: MessageSquareMore },
  { name: "Tasks", path: "/dashboard/tasks", icon: ListTodo },
  { name: "Sprint Planner", path: "/dashboard/sprints", icon: CalendarDays },
  { name: "Architecture", path: "/dashboard/architecture", icon: Network },
  { name: "Traceability", path: "/dashboard/traceability", icon: GitMerge },
  { name: "Code Generator", path: "/dashboard/code", icon: Code2 },
  { name: "Testing", path: "/dashboard/testing", icon: TestTube },
  { name: "Automation", path: "/dashboard/automation", icon: Zap },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const projectId = searchParams.get("projectId");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const { toast } = useToast();

  const getPageName = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : "Overview";
  };

  const handleLogout = () => {
    toast({ title: "Logging out...", description: "Redirecting to landing page." });
    setTimeout(() => navigate("/"), 1000);
  };

  const handleHelp = () => {
    toast({ title: "Help & Support", description: "Opening support documentation..." });
  };

  return (
    // Set font-satoshi here so the entire dashboard inherits the premium typography
    <div className="flex h-screen bg-canvas overflow-hidden font-satoshi">
      
      {/* Mobile Header (Only visible on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border-subtle bg-bg-surface text-foreground absolute top-0 left-0 right-0 z-30">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <svg width="24" height="24" viewBox="0 0 28 28" fill="none" className="text-primary">
            <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
            <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
          <span className="font-bold">Blueprint.dev</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border-subtle flex flex-col transition-transform duration-300
        pt-16 md:pt-0 /* Account for mobile header height */
      `}>
        {/* Desktop Logo */}
        <Link to="/" className="hidden md:flex items-center gap-2 p-6 border-b border-border-subtle text-foreground hover:bg-overlay transition-colors">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-primary">
            <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
            <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
          <span className="text-xl font-bold tracking-tight">Blueprint.dev</span>
        </Link>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const targetPath = (projectId && item.name !== "Projects") 
              ? `${item.path}?projectId=${projectId}` 
              : item.path;
            return (
              <Link key={item.name} to={targetPath} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium
                  ${isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-text-secondary hover:bg-overlay hover:text-foreground"}
                `}>
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-text-muted"}`} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Navigation (Settings & Help) */}
        <div className="p-4 border-t border-border-subtle space-y-1">
          <Link to="/dashboard/settings" onClick={() => setIsMobileMenuOpen(false)}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${location.pathname === "/dashboard/settings" ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-overlay hover:text-foreground"}`}>
              <Settings className={`w-5 h-5 ${location.pathname === "/dashboard/settings" ? "text-primary" : "text-text-muted"}`} />
              Settings
            </div>
          </Link>
          <Link to="/dashboard/help" onClick={() => setIsMobileMenuOpen(false)}>
            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${location.pathname === "/dashboard/help" ? "bg-primary/10 text-primary" : "text-text-secondary hover:bg-overlay hover:text-foreground"}`}>
              <HelpCircle className={`w-5 h-5 ${location.pathname === "/dashboard/help" ? "text-primary" : "text-text-muted"}`} />
              Help & Support
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative pt-16 md:pt-0">
        
        {/* Top Header */}
        <header className="hidden md:flex h-16 border-b border-border-subtle bg-canvas/50 backdrop-blur-md items-center justify-between px-8 z-20">
          
          {/* Breadcrumb & Global Search */}
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-2 text-text-muted text-sm font-medium">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-foreground">{getPageName()}</span>
            </div>
            
            <div className="flex-1 max-w-md relative group hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Global search (coming soon)" 
                className="w-full bg-overlay border border-border-subtle rounded-lg py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-text-muted"
                readOnly
                disabled
              />
            </div>
          </div>
          
          {/* Actions & Profile */}
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-text-secondary hover:text-foreground hover:bg-overlay"
              onClick={() => {
                setHasNotifications(false);
              }}
            >
              <Bell className="w-5 h-5" />
              {/* Notification dot indicator */}
              {hasNotifications && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-canvas" />
              )}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pl-2 pr-1 gap-2 hover:bg-overlay rounded-full group h-10">
                  <Avatar className="w-7 h-7 border border-border-subtle group-hover:border-primary/50 transition-all">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>EN</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-foreground transition-colors" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-surface border-border-subtle text-foreground">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Engineering Team</p>
                    <p className="text-xs leading-none text-text-muted">Pro Plan</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border-subtle" />
                <DropdownMenuItem 
                  className="cursor-pointer hover:bg-overlay focus:bg-overlay focus:text-foreground"
                  onClick={() => navigate("/dashboard/settings")}
                >
                  <User className="mr-2 h-4 w-4 text-text-muted" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border-subtle" />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-canvas custom-scrollbar">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      
      {/* Mobile Menu Overlay Background */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
