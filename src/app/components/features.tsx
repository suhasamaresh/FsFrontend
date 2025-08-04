"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: "💳",
    title: "Group Expense Splitting",
    description:
      "Create and manage group expense pools with multi-currency support (ETH and ERC-20), equal or customized splits, and transparent settlements.",
    stats: "Trusted Splitwise-like",
    href: "/Flashsplit",
    available: true,
  },
  {
    icon: "🛠️",
    title: "Micro-Task Bounties",
    description:
      "Post tasks with USDC rewards, claim them by staking, submit proof of completion, and receive rewards on approval. A perfect board for group chores and freelance gigs.",
    stats: "Rewarding collaboration",
    href: "/FlashBounty",
    available: true,
  },
  {
    icon: "📚",
    title: "Collaborative Study Funds",
    description:
      "Pool funds to buy educational resources like courses, books, and software, ensuring shared access and democratized group learning.",
    stats: "Crowdfund learning",
    available: false,
  },
  {
    icon: "⏳",
    title: "Pomodoro Focus Sprints",
    description:
      "Organize group Pomodoro sessions backed by stakes to encourage collective focus and productivity boosts.",
    stats: "Team discipline",
    available: false,
  },
  {
    icon: "📝",
    title: "Task Commitments",
    description:
      "Create, assign, and stake for tasks ensuring accountability and tracked completion in your group or DAO.",
    stats: "Accountability",
    available: false,
  },
  {
    icon: "🕰️",
    title: "Time-Locked Capsules",
    description:
      "Create group memory capsules with entries that are time-locked and revealed together in the future.",
    stats: "Preserve moments",
    available: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 60,
    scale: 0.9,
    rotateX: 25,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      stiffness: 100,
      damping: 15,
    },
  },
};

type Feature = {
  icon: string;
  title: string;
  description: string;
  stats: string;
  href?: string;
  available: boolean;
};

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard = ({ feature, index }: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.3 });

  const onClick = () => {
    if (feature.available && feature.href) {
      window.location.href = feature.href;
    }
  };

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative cursor-pointer"
      onClick={onClick}
      role={feature.available ? "button" : undefined}
      aria-disabled={!feature.available}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-75 transition-all duration-500"
        animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
      />

      {/* Main card */}
      <motion.div
        className={`relative border rounded-xl p-4 h-full backdrop-blur-sm ${
          feature.available
            ? "bg-emerald-900 border-emerald-500/30"
            : "bg-gray-800 border-gray-700 cursor-not-allowed opacity-60"
        }`}
        style={{ minHeight: "220px", maxWidth: "270px", margin: "0 auto" }}
        whileHover={
          feature.available
            ? {
                y: -8,
                transition: { type: "spring", stiffness: 300, damping: 20 },
              }
            : {}
        }
      >
        {/* Icon with floating animation */}
        <motion.div
          className="text-2xl mb-4 relative z-10"
          animate={{
            y: isHovered ? [-2, 2, -2] : [0, -3, 0],
            rotate: isHovered ? [0, 5, -5, 0] : 0,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {feature.icon}
        </motion.div>

        {/* Stats badge */}
        <motion.div
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
            feature.available
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-gray-700 text-gray-400 border border-gray-600"
          }`}
          whileHover={feature.available ? { scale: 1.05 } : {}}
        >
          {feature.stats}
        </motion.div>

        {/* Title */}
        <motion.h3
          className={`text-lg font-bold mb-2 transition-all duration-300 ${
            feature.available
              ? "text-emerald-300 group-hover:text-emerald-200"
              : "text-gray-400"
          }`}
          layoutId={`title-${index}`}
        >
          {feature.title}
        </motion.h3>

        {/* Description */}
        <motion.p
          className={`leading-relaxed text-sm transition-colors duration-300 ${
            feature.available
              ? "text-emerald-400/80 group-hover:text-emerald-300/90"
              : "text-gray-500"
          }`}
          layoutId={`desc-${index}`}
        >
          {feature.description}
          {!feature.available && " (Frontend under development)"}
        </motion.p>

        {/* Hover overlay with gradient */}
        {feature.available && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-emerald-500/5 opacity-0 rounded-xl"
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Bottom accent line */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 rounded-b-xl ${
            feature.available
              ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
              : "bg-gray-600"
          }`}
          initial={{ width: "0%" }}
          animate={{ width: isHovered && feature.available ? "100%" : "0%" }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
};

export default function FeaturesSection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen py-32 px-6 md:px-12 bg-black overflow-hidden"
    >
      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <span className="text-sm font-medium text-emerald-400">
              ✨ FlashSuite Features
            </span>
          </motion.div>

          <motion.h2
            className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent"
            layoutId="main-title"
          >
            Built to empower your groups
          </motion.h2>

          <motion.p
            className="text-xl text-emerald-600/80 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            From effortless bill splitting to rewarding tasks and focused
            sprints, FlashSuite combines the power of Web3 with social
            simplicity.
          </motion.p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
