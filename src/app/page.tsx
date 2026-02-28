import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductPreview from "@/components/ProductPreview";
import Features from "@/components/Features";
import Integrations from "@/components/Integrations";
import ExclusiveSolutions from "@/components/ExclusiveSolutions";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ProductPreview />
        <Features />
        <Integrations />
        <ExclusiveSolutions />
      </main>
      <Footer />
    </>
  );
}
