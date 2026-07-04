import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import Collection from "@/components/home/Collection";
import Statement from "@/components/home/Statement";
import HowItWorks from "@/components/home/HowItWorks";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Services />
      <Collection />
      <Statement />
      <HowItWorks />
      <Footer />
    </main>
  );
}
