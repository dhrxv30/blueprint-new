import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import PipelineAnimation from "@/components/landing/PipelineAnimation";
import ProblemSection from "@/components/landing/ProblemSection";
import FeatureGrid from "@/components/landing/FeatureGrid";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  useEffect(() => {
    // Handle scrolling to hash on mount
    const hash = window.location.hash;
    if (hash) {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // Delay slightly to ensure layout is ready
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas font-satoshi scroll-smooth">
      <Navbar />
      
      <main>
        <Hero />
        
        {/* Added ID for the "Solutions" navbar link to scroll to */}
        <section id="solutions">
          <PipelineAnimation />
          <ProblemSection />
        </section>

        <section id="features">
          <FeatureGrid />
        </section>

        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;