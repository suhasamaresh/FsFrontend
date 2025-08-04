"use client";
import FeaturesSection from "./components/features";
import Hero from "./components/hero";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

export default function Page() {
  return (
    <>
    <Navbar />
      <Hero />
      <FeaturesSection />
      <Footer />
    </>
  );
}
