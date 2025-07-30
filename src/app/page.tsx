"use client";
import FeaturesSection from "./components/features";
import Hero from "./components/hero";
import Navbar from "./components/navbar";

export default function Page() {
  return (
    <>
    <Navbar />
      <Hero />
      <FeaturesSection />
    </>
  );
}
