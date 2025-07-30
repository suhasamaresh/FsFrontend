"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { FaUsers, FaReceipt, FaCoins } from "react-icons/fa";

// --- GRID LINES ONLY with RANDOM SHOOTING STAR BEAM ---
function GridLinesWithShootingStar() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(0);
  const numLines = 7; // Number of horizontal lines (creates 6 gaps)

  // Update gridHeight on resize for responsiveness
  useEffect(() => {
    function measure() {
      if (gridRef.current) setGridHeight(gridRef.current.offsetHeight);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Beam random row logic and timing to ensure beam appears atleast once in 2.4s
  const [beamRow, setBeamRow] = useState<number>(Math.floor(Math.random() * (numLines - 1)));
  const [beamKey, setBeamKey] = useState(0); // To restart animation on each beam change

  useEffect(() => {
    let running = true;

    function scheduleNextBeam() {
      if (!running) return;
      // Randomize next beam interval between 1.2s and 2.4s
      const interval = 1200 + Math.random() * 1200;
      setTimeout(() => {
        if (!running) return;
        const nextRow = Math.floor(Math.random() * (numLines - 1));
        setBeamRow(nextRow);
        setBeamKey((k) => k + 1);
        scheduleNextBeam();
      }, interval);
    }
    scheduleNextBeam();

    return () => {
      running = false;
    };
  }, [numLines]);

  // Calculate position for beam along the randomly selected grid line
  const cellHeight = gridHeight / (numLines - 1);

  // Beam thickness ~1px (matching grid line)
  const beamHeight = 1;

  // y position aligned to grid line and adjusting for beam height
  const y = beamRow * cellHeight - beamHeight / 2;

  return (
    <div
      ref={gridRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: `
          repeating-linear-gradient(to right, rgba(16,185,129,0.14) 0 1px, transparent 1px ${cellHeight}px),
          repeating-linear-gradient(to bottom, rgba(16,185,129,0.09) 0 1.5px, transparent 1.5px ${cellHeight}px)
        `,
        backgroundSize: `100% ${cellHeight}px`,
        backgroundPosition: "0 0",
      }}
    >
      {/* Shooting star beam */}
      <motion.div
        key={beamKey} // key forces remount on beam change for fresh animation
        className="absolute"
        style={{
          top: `${y}px`,
          left: 0,
          height: `${beamHeight}px`,
          width: "100vw", // covers entire viewport width in horizontal direction
          maxWidth: "100%",
          zIndex: 2,
          pointerEvents: "none",
          overflow: "visible",
        }}
        initial={{ x: "-110%" }}
        animate={{ x: ["-110%", "105%"] }}
        transition={{
          duration: 1.12,
          ease: "linear",
          repeat: 0,
        }}
      >
        {/* Linear gradient from transparent tail to sharp, bright front */}
        <div
          style={{
            width: "32vw",
            maxWidth: "480px",
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(168,255,195,0.36) 53%, #dbfff7 70%, #fff 85%, rgba(168,255,195,0.2) 95%, rgba(52,211,153,0) 100%)",
            filter: "drop-shadow(0 0 6px #6ee7b7) blur(0.25px)",
            borderRadius: "1.5px",
            opacity: 0.93,
          }}
        />
      </motion.div>
    </div>
  );
}

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.19,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <section className="relative min-h-[85vh] border-b-gray-900 flex flex-col md:flex-row items-center justify-between px-6 md:px-16 py-16 bg-black overflow-hidden">
      {/* Soft background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/5 via-black to-emerald-800/5" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-emerald-400/3 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-emerald-500/2 rounded-full blur-2xl" />

      {/* Line grid and shooting star beam */}
      <GridLinesWithShootingStar />

      {/* Left: Main text content */}
      <motion.div
        className="w-full md:w-1/2 flex flex-col items-start text-left mb-12 md:mb-0 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1
          className="text-7xl md:text-8xl lg:text-[7rem] font-bold mb-6 leading-tight text-white"
          variants={containerVariants}
        >
          <span className="font-bold">Flash</span>
          <span className="font-bold ml-1">Split</span>
        </motion.h1>

        <motion.h2
          className="text-7xl md:text-3xl lg:text-4xl font-light mb-8 leading-relaxed text-emerald-600"
          variants={containerVariants}
        >
          Effortless Group Expenses
        </motion.h2>

        <motion.div
          className="mb-10 max-w-lg"
          variants={containerVariants}
        >
          <motion.p
            className="text-xl md:text-2xl font-light mb-4 leading-relaxed text-emerald-400"
            variants={containerVariants}
          >
            <span className="font-semibold text-white">Split bills, share payments,</span> and reward your friends or community —{" "}
            <span className="font-medium text-emerald-400">securely on-chain</span>.
          </motion.p>
          <motion.p
            className="text-lg md:text-xl text-emerald-400"
            variants={containerVariants}
          >
            <span className="font-semibold text-emerald-300">Create groups</span>, track expenses transparently, and boost your productivity.<br />
            <span className="text-emerald-400">Connect your wallet to get started.</span>
          </motion.p>
        </motion.div>

        <motion.button
          className="group px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-lg rounded-lg transition-all duration-300 shadow-lg hover:shadow-emerald-500/25"
          variants={containerVariants}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Get Started
        </motion.button>
      </motion.div>

      {/* Right: Clean Icons */}
      <motion.div
        className="w-full md:w-1/2 flex justify-center md:justify-end relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="grid grid-cols-2 gap-8 max-w-sm">
          {/* Top row - single centered icon */}
          <div className="col-span-2 flex justify-center">
            <motion.div
              className="group p-6 bg-gray-900/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl hover:border-emerald-400/40 transition-all duration-300"
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.1)",
              }}
            >
              <FaUsers
                size={40}
                className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300"
              />
            </motion.div>
          </div>

          {/* Bottom row - two icons */}
          <motion.div
            className="group p-6 bg-gray-900/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl hover:border-emerald-400/40 transition-all duration-300"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.1)",
            }}
          >
            <FaReceipt
              size={40}
              className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300"
            />
          </motion.div>

          <motion.div
            className="group p-6 bg-gray-900/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl hover:border-emerald-400/40 transition-all duration-300"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.1)",
            }}
          >
            <FaCoins
              size={40}
              className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
