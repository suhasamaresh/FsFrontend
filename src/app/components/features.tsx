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
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 80,
    scale: 0.8,
    rotateX: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 20,
      duration: 0.8,
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
  const isInView = useInView(cardRef, { once: true, amount: 0.2 });

  const handleNavigation = () => {
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
      className="group relative perspective-1000"
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-700"
        style={{
          background: feature.available 
            ? 'linear-gradient(45deg, #10b981, #059669, #047857, #065f46)'
            : 'linear-gradient(45deg, #374151, #4b5563, #6b7280, #9ca3af)',
          backgroundSize: '400% 400%',
        }}
        animate={isHovered ? {
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-2 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500 ${
          feature.available ? 'bg-emerald-400' : 'bg-gray-500'
        }`}
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
      />

      {/* Main card */}
      <motion.div
        className={`relative border rounded-2xl p-8 h-full backdrop-blur-xl ${
          feature.available
            ? "bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-emerald-950/90 border-emerald-400/30 shadow-emerald-500/20"
            : "bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 border-gray-600/30 opacity-70"
        } shadow-2xl transition-all duration-500`}
        style={{ minHeight: "320px" }}
        whileHover={
          feature.available
            ? {
                y: -12,
                rotateY: 5,
                transition: { type: "spring", stiffness: 300, damping: 25 },
              }
            : {}
        }
      >
        {/* Status indicator */}
        <motion.div
          className={`absolute top-4 right-4 w-3 h-3 rounded-full ${
            feature.available ? 'bg-emerald-400 shadow-emerald-400/50' : 'bg-gray-500'
          } shadow-lg`}
          animate={feature.available ? {
            boxShadow: ['0 0 5px rgba(16, 185, 129, 0.5)', '0 0 20px rgba(16, 185, 129, 0.8)', '0 0 5px rgba(16, 185, 129, 0.5)']
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Icon with enhanced animation */}
        <motion.div
          className="text-4xl mb-6 relative z-10"
          animate={{
            y: isHovered ? [-3, 3, -3] : [0, -4, 0],
            rotate: isHovered ? [0, 8, -8, 0] : [0, 3, -3, 0],
            scale: isHovered ? [1, 1.1, 1] : [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span className="drop-shadow-lg">{feature.icon}</span>
        </motion.div>

        {/* Stats badge with improved styling */}
        <motion.div
          className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm ${
            feature.available
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-emerald-500/20"
              : "bg-gray-700/50 text-gray-400 border border-gray-600/50"
          } shadow-lg`}
          whileHover={feature.available ? { scale: 1.05, y: -2 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <motion.span
            className={`w-2 h-2 rounded-full mr-2 ${
              feature.available ? 'bg-emerald-400' : 'bg-gray-500'
            }`}
            animate={feature.available ? {
              opacity: [1, 0.5, 1]
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {feature.stats}
        </motion.div>

        {/* Title with gradient text */}
        <motion.h3
          className={`text-xl font-bold mb-4 transition-all duration-300 ${
            feature.available
              ? "bg-gradient-to-r from-emerald-200 via-emerald-100 to-emerald-300 bg-clip-text text-transparent group-hover:from-emerald-100 group-hover:to-emerald-200"
              : "text-gray-400"
          }`}
          layoutId={`title-${index}`}
        >
          {feature.title}
        </motion.h3>

        {/* Description with better typography */}
        <motion.p
          className={`leading-relaxed text-sm mb-6 transition-colors duration-300 ${
            feature.available
              ? "text-emerald-200/90 group-hover:text-emerald-100/95"
              : "text-gray-500"
          }`}
          layoutId={`desc-${index}`}
        >
          {feature.description}
          {!feature.available && (
            <span className="block mt-2 text-amber-400/80 text-xs font-medium mb-2">
              🚧 Frontend under development
            </span>
          )}
        </motion.p>

        {/* Navigation buttons */}
        <div className="absolute bottom-6 left-8 right-8 flex gap-3">
          {feature.available ? (
            <>
              <motion.button
                onClick={handleNavigation}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-4 py-2.5 rounded-lg font-medium text-sm shadow-lg shadow-emerald-500/25 border border-emerald-400/20"
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
                  background: "linear-gradient(to right, #059669, #10b981)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                Launch App
              </motion.button>
              <motion.button
                className="px-4 py-2.5 rounded-lg font-medium text-sm bg-emerald-900/50 text-emerald-300 border border-emerald-600/30 backdrop-blur-sm"
                whileHover={{ 
                  scale: 1.02,
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                  borderColor: "rgba(16, 185, 129, 0.5)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                Learn More
              </motion.button>
            </>
          ) : (
            <motion.div
              className="flex-1 bg-gray-700/50 text-gray-400 px-4 mt-8 py-2.5 rounded-lg font-medium text-sm text-center border border-gray-600/50"
              whileHover={{ backgroundColor: "rgba(75, 85, 99, 0.6)" }}
            >
              Coming Soon
            </motion.div>
          )}
        </div>

        {/* Decorative corner elements */}
        <motion.div
          className={`absolute top-0 right-0 w-20 h-20 ${
            feature.available ? 'bg-emerald-400/5' : 'bg-gray-600/5'
          } rounded-bl-full`}
          animate={isHovered ? { scale: 1.2, opacity: 0.8 } : { scale: 1, opacity: 0.3 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className={`absolute bottom-0 left-0 w-16 h-16 ${
            feature.available ? 'bg-emerald-400/5' : 'bg-gray-600/5'
          } rounded-tr-full`}
          animate={isHovered ? { scale: 1.3, opacity: 0.6 } : { scale: 1, opacity: 0.2 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        />

        {/* Bottom accent line with animation */}
        <motion.div
          className={`absolute bottom-0 left-0 h-1 rounded-b-2xl ${
            feature.available
              ? "bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500"
              : "bg-gray-600"
          }`}
          initial={{ width: "0%" }}
          animate={{ width: isHovered && feature.available ? "100%" : "15%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
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
      className="relative min-h-screen py-32 px-6 md:px-12 bg-gradient-to-br from-black via-gray-950 to-black overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <motion.div
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 via-emerald-400/10 to-emerald-600/10 border border-emerald-500/30 mb-8 backdrop-blur-sm shadow-emerald-500/10 shadow-xl"
            whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(16, 185, 129, 0.15)" }}
            animate={{
              borderColor: ["rgba(16, 185, 129, 0.3)", "rgba(16, 185, 129, 0.6)", "rgba(16, 185, 129, 0.3)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <motion.span 
              className="text-sm font-semibold text-emerald-300 flex items-center gap-2"
              animate={{ textShadow: ["0 0 5px rgba(16, 185, 129, 0.5)", "0 0 20px rgba(16, 185, 129, 0.8)", "0 0 5px rgba(16, 185, 129, 0.5)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ✨ FlashSuite Features
            </motion.span>
          </motion.div>

          <motion.h2
            className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-emerald-300 via-emerald-200 to-emerald-400 bg-clip-text text-transparent leading-tight"
            layoutId="main-title"
            style={{
              textShadow: "0 0 40px rgba(16, 185, 129, 0.3)",
            }}
          >
            Built to empower your groups
          </motion.h2>

          <motion.p
            className="text-xl md:text-2xl text-emerald-100/80 max-w-3xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            From effortless bill splitting to rewarding tasks and focused
            sprints, FlashSuite combines the power of Web3 with social
            simplicity.
          </motion.p>
        </motion.div>

        {/* Enhanced Features grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10"
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