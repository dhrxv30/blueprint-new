// src/components/landing/Navbar.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // <-- ADDED TOAST IMPORT

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast(); // <-- INITIALIZED TOAST

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // We add an 'action' property to know whether to scroll down or pop a toast
  const navLinks = [
    { name: "Features", href: "/#features", action: "scroll" },
    { name: "Solutions", href: "/#solutions", action: "scroll" },
    { name: "Documentation", href: "/docs", action: "link" },
    { name: "Pricing", href: "/pricing", action: "link" },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, link: any) => {
    if (link.action === "toast") {
      e.preventDefault();
      toast({
        title: link.name,
        description: `The ${link.name} page will be available in the next release.`
      });
    } else if (link.action === "scroll") {
      // If we are already on the home page, we can scroll smoothly
      if (window.location.pathname === "/") {
        e.preventDefault();
        const id = link.href.replace("/#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
      // If NOT on home page, let the default <a> behavior navigate to "/#features"
    } else if (link.action === "link") {
      e.preventDefault();
      window.location.href = link.href;
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-canvas/80 backdrop-blur-md border-b border-border-subtle py-4" : "bg-transparent py-6"
    }`}>
      <div className="max-w-[1280px] mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-primary">
            <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.9" />
            <rect x="16" y="2" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="2" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.5" />
            <rect x="16" y="16" width="10" height="10" rx="2" fill="currentColor" opacity="0.3" />
          </svg>
          <span className="font-satoshi text-lg font-bold text-foreground tracking-tight">
            Blueprint<span className="text-primary">.dev</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              onClick={(e) => handleLinkClick(e, link)}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/auth">
            <Button variant="ghost" className="text-text-secondary hover:text-text-primary rounded-full px-6 font-medium">
              Log in
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="bg-primary hover:brightness-110 text-white rounded-full px-8 py-3 font-medium group transition-all glow-orange">
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-text-primary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-border-subtle p-6 space-y-4 animate-in fade-in slide-in-from-top-4 shadow-xl">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              onClick={(e) => handleLinkClick(e, link)}
              className="block text-lg font-medium text-text-secondary hover:text-white"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 flex flex-col space-y-4 border-t border-border-subtle">
            <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full justify-center border-border-emphasis rounded-full text-white h-11">
                Log in
              </Button>
            </Link>
            <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
              <Button className="w-full bg-primary text-white rounded-full justify-center h-11 glow-orange">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}