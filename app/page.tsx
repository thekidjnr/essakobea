import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import Services from "@/components/home/Services";
import Statement from "@/components/home/Statement";
import HowItWorks from "@/components/home/HowItWorks";

export const revalidate = 60;

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Services />
      <Statement />
      <HowItWorks />
      <Footer />
    </main>
  );
}
