// src/components/landing/Footer.tsx
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast"; // <-- ADDED IMPORT

const footerLinks = {
  Product: ["Features", "Pricing", "Demo", "Changelog"],
  Developers: ["Documentation", "API Reference", "SDKs", "Status"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Legal: ["Privacy Policy", "Terms of Service", "Security"],
};

export default function Footer() {
  const { toast } = useToast(); // <-- INITIALIZED TOAST

  const handleFooterClick = (e: React.MouseEvent, link: string) => {
    // If it's the demo link, let it navigate normally
    if (link === "Demo") return;
    
    e.preventDefault();
    toast({
      title: link,
      description: `The ${link} page will be available in the next release.`,
    });
  };

  return (
    <footer className="bg-surface border-t border-border-subtle">
      <div className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm text-foreground font-bold uppercase tracking-wider">
                {category}
              </h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      to={link === "Demo" ? "/demo" : "#"}
                      onClick={(e) => handleFooterClick(e, link)}
                      className="text-base text-text-secondary hover:text-accent-orange font-medium transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-border-subtle flex items-center justify-between">
          <span className="text-sm text-text-muted font-medium">
            &copy; {new Date().getFullYear()} Blueprint.dev. All rights reserved.
          </span>
          <span className="font-satoshi text-sm font-bold text-foreground tracking-tight">
            Blueprint<span className="text-accent-orange">.dev</span>
          </span>
        </div>
      </div>
    </footer>
  );
}