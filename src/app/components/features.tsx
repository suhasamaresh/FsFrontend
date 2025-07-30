"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

const features = [
  {
    icon: "👥",
    title: "Expense Group Creation",
    description: "Users (group creators) can create new expense groups. Define group name, members, currency (ETH or supported ERC-20), total amount, category (e.g., Dining, Travel), split type (Equal, Percentage, Exact Amount, Shares), and optionally recurring settings. Validates members, splits, and total amount.",
    stats: "Smart validation"
  },
  {
    icon: "💰",
    title: "Expense Settlement",
    description: "Group members can settle (repay) their share of an expense directly through the contract, using the defined currency. Handles both ETH and ERC-20 (multi-currency) payments. Transfers funds (minus a platform fee) to the group creator. Tracks which members have settled, and detects when the whole group is fully settled.",
    stats: "Multi-currency"
  },
  {
    icon: "💸",
    title: "Platform Fee Mechanism",
    description: "Automatically deducts a small platform fee (e.g., 0.25%) from each settlement payment. Allows the owner to withdraw accumulated platform or token fees.",
    stats: "0.25% fee"
  },
  {
    icon: "🔄",
    title: "Recurring Group Payments",
    description: "Supports creation of recurring expense groups (subscriptions, rent, etc.). Automatically clones a group for recurring cycles when the original group is fully settled.",
    stats: "Auto-recurring"
  },
  {
    icon: "📊",
    title: "User Profiles & Analytics",
    description: "Tracks user stats: groups created/joined, total split amount, reputation score, fast settlements, and isActive flag. Used for gamification, leaderboards, and eligibility for reward NFTs.",
    stats: "Gamification"
  },
  {
    icon: "📡",
    title: "Event Emission for Indexing",
    description: "Emits structured events (GroupCreated, ExpenseSettled, UserReputationUpdated, RecurringPaymentTriggered) for indexing by off-chain systems (Goldsky, analytics dashboards).",
    stats: "Real-time events"
  },
  {
    icon: "🪙",
    title: "Supported Currency Management",
    description: "Owner can add or remove supported (ERC-20) tokens via admin functions.",
    stats: "Token flexibility"
  },
  {
    icon: "🔮",
    title: "Oracle Integration for Price Feeds",
    description: "Uses RedStone oracles to fetch real-time token/USD prices and support multi-currency conversion.",
    stats: "Live pricing"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    scale: 0.9,
    rotateX: 25
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      stiffness: 100,
      damping: 15
    }
  }
};

type Feature = {
  icon: string;
  title: string;
  description: string;
  stats: string;
};

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

const FeatureCard = ({ feature, index }: FeatureCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);
    const isInView = useInView(cardRef, { once: true, amount: 0.3 });

    return (
        <motion.div
            ref={cardRef}
            variants={cardVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group relative"
        >
            {/* Glow effect */}
            <motion.div
                className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-xl blur opacity-0 group-hover:opacity-75 transition-all duration-500"
                animate={isHovered ? { scale: 1.05 } : { scale: 1 }}
            />
            
            {/* Main card */}
            <motion.div
                className="relative bg-emerald-900 border border-emerald-500/30 rounded-xl p-4 h-full backdrop-blur-sm"
                style={{ minHeight: "220px", maxWidth: "270px", margin: "0 auto" }}
                whileHover={{ 
                    y: -8,
                    transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
            >
                {/* Icon with floating animation */}
                <motion.div
                    className="text-2xl mb-4 relative z-10"
                    animate={{ 
                        y: isHovered ? [-2, 2, -2] : [0, -3, 0],
                        rotate: isHovered ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {feature.icon}
                </motion.div>

                {/* Stats badge */}
                <motion.div
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    whileHover={{ scale: 1.05 }}
                >
                    {feature.stats}
                </motion.div>

                {/* Title */}
                <motion.h3
                    className="text-lg font-bold text-emerald-300 mb-2 group-hover:text-emerald-200 transition-all duration-300"
                    layoutId={`title-${index}`}
                >
                    {feature.title}
                </motion.h3>

                {/* Description */}
                <motion.p
                    className="text-emerald-400/80 text-sm leading-relaxed group-hover:text-emerald-300/90 transition-colors duration-300"
                    layoutId={`desc-${index}`}
                >
                    {feature.description}
                </motion.p>

                {/* Hover overlay with gradient */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-emerald-500/5 opacity-0 rounded-xl"
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                />

                {/* Bottom accent line */}
                <motion.div
                    className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-b-xl"
                    initial={{ width: "0%" }}
                    animate={{ width: isHovered ? "100%" : "0%" }}
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
                        <span className="text-sm font-medium text-emerald-400">✨ Product Features</span>
                    </motion.div>
                    
                    <motion.h2
                        className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500 bg-clip-text text-transparent"
                        layoutId="main-title"
                    >
                        Built for Scale
                    </motion.h2>
                    
                    <motion.p
                        className="text-xl text-emerald-600/80 max-w-2xl mx-auto leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        Enterprise-grade infrastructure meets consumer-friendly design. 
                        Experience the future of group payments today.
                    </motion.p>
                </motion.div>

                {/* Features grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {features.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} index={index} />
                    ))}
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    className="mt-32 text-center"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <motion.div
                        className="inline-flex items-center gap-4"
                        whileHover={{ scale: 1.02 }}
                    >
                        <motion.button
                            className="relative group px-12 py-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 text-white font-semibold rounded-2xl overflow-hidden transition-all duration-300"
                            whileHover={{ 
                                boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)",
                                y: -2
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.href = "/dashboard"}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Open the App
                                <motion.span
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    →
                                </motion.span>
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                            />
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}