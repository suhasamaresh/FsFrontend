"use client";
import FeaturesSection from "./components/features";
import Hero from "./components/hero";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import HowItWorks from "./components/howitworks";

export default function Page() {
  return (
    <>
    <Navbar />
      <Hero />
      <HowItWorks />
      <FeaturesSection />
      
      <Footer />
    </>
  );
}
