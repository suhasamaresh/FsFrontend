"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const techStack = [
  {
    name: "Etherlink Testnet",
    description: "Lightning-fast, low-cost blockchain infrastructure",
    icon: "⚡",
    gradient: "from-emerald-400 via-emerald-300 to-emerald-500",
    details: "Tezos-powered L2 solution for seamless transactions",
    stats: "< 2s finality",
    additionalFeatures: [
      "99.9% uptime guarantee",
      "Cross-chain compatibility",
      "Energy efficient consensus"
    ]
  },
  {
    name: "Goldsky Subgraphs",
    description: "Real-time blockchain data indexing and querying",
    icon: "📊",
    gradient: "from-emerald-500 via-emerald-400 to-emerald-600",
    details: "Instant access to transaction history and group data",
    stats: "Real-time sync",
    additionalFeatures: [
      "GraphQL API access",
      "Historical data analytics",
      "Custom query optimization"
    ]
  },
  {
    name: "Sequence Wallets",
    description: "Embedded, gasless wallet experience",
    icon: "🔐",
    gradient: "from-emerald-300 via-emerald-400 to-emerald-500",
    details: "Social login with email, no seed phrases required",
    stats: "0 gas fees",
    additionalFeatures: [
      "Multi-factor authentication",
      "Hardware wallet support",
      "Recovery mechanisms"
    ]
  },
  {
    name: "Redstone Oracle",
    description: "Real-time price feeds and currency conversion",
    icon: "💎",
    gradient: "from-emerald-600 via-emerald-500 to-emerald-400",
    details: "Accurate multi-currency support for global groups",
    stats: "Live pricing",
    additionalFeatures: [
      "150+ currency pairs",
      "Heartbeat monitoring",
      "Deviation threshold alerts"
    ]
  }
];

const workflowSteps = [
  {
    step: "01",
    title: "Connect & Create",
    description: "Sign in with your email using Sequence embedded wallets. Access all Flash apps with one account - no complex setup, no seed phrases to remember.",
    icon: "👋",
    features: ["Social login", "Instant wallet creation", "Gasless transactions"],
    additionalFeatures: [
      "Single sign-on across all Flash apps",
      "Biometric authentication",
      "Cross-device synchronization"
    ]
  },
  {
    step: "02", 
    title: "Choose & Join",
    description: "Select your Flash app and join groups: split expenses, claim bounties, pool learning resources, track tasks, focus together, or create memories. Invite others with simple links or QR codes.",
    icon: "🎯",
    features: ["App selection", "Group discovery", "Social invitations"],
    additionalFeatures: [
      "Cross-app group integration",
      "Role-based permissions",
      "Community discovery"
    ]
  },
  {
    step: "03",
    title: "Engage & Commit",
    description: "Take action based on your app: split bills and settle debts, stake on bounty tasks, contribute to learning funds, commit to personal goals, join focus sessions, or add to time capsules.",
    icon: "⚡",
    features: ["Staking mechanisms", "Smart contracts", "Real-time interactions"],
    additionalFeatures: [
      "Automated settlements",
      "Progress tracking",
      "Reward distributions"
    ]
  },
  {
    step: "04",
    title: "Monitor & Earn",
    description: "Track your activities across all Flash apps through Goldsky subgraphs. Monitor settlements, bounty earnings, learning progress, task streaks, focus rewards, and upcoming reveals.",
    icon: "📊",
    features: ["Unified dashboard", "Cross-app analytics", "Achievement tracking"],
    additionalFeatures: [
      "Reputation scoring",
      "Earnings summaries",
      "Community leaderboards"
    ]
  }
];

const apps = [
  {
    name: "FlashSplit",
    description: "Splitwise for Web3 - manage group expenses with crypto",
    icon: "💳",
    features: [
      "Multi-currency expense tracking",
      "Equal or custom split ratios", 
      "Transparent blockchain settlements",
      "Real-time balance calculations"
    ],
    techHighlights: ["Smart contract automation", "Redstone price feeds", "Gasless transactions"],
    additionalFeatures: [
      "Recurring expense automation",
      "Group spending analytics",
      "Tax report generation",
      "Integration with banking APIs",
      "Mobile-first responsive design"
    ]
  },
  {
    name: "FlashBounty",
    description: "Micro-task marketplace with staking and rewards",
    icon: "🛠️",
    features: [
      "USDC reward pools",
      "Stake-to-claim mechanism",
      "Proof of completion system",
      "Reputation tracking"
    ],
    techHighlights: ["Staking contracts", "Automated payouts"],
    additionalFeatures: [
      "Skill-based task matching",
      "Escrow protection",
      "Community governance",
      "Performance analytics",
      "Multi-language support"
    ]
  }
];

const TechCard = ({ tech, index }: { tech: typeof techStack[0], index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <motion.div
        className="relative bg-emerald-950/90 border border-emerald-400/30 rounded-2xl p-6 backdrop-blur-sm h-full shadow-xl"
        whileHover={{
          y: -5,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
      >
        {/* Status indicator */}
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-400 shadow-emerald-400/50 shadow-sm" />
        
        {/* Stats badge */}
        <div className="absolute top-4 left-4 bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg text-xs font-medium border border-emerald-400/30">
          {tech.stats}
        </div>
        
        <div className="text-3xl mb-4 mt-6">
          {tech.icon}
        </div>
        
        <h3 className={`text-xl font-bold mb-3 bg-gradient-to-r ${tech.gradient} bg-clip-text text-transparent`}>
          {tech.name}
        </h3>
        
        <p className="text-emerald-200/90 text-sm mb-3 leading-relaxed">
          {tech.description}
        </p>
        
        <p className="text-emerald-300/70 text-xs mb-4">
          {tech.details}
        </p>

        {/* Additional Features */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-emerald-200 mb-2 flex items-center">
            <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
            Key Features:
          </h4>
          {tech.additionalFeatures.map((feature, i) => (
            <div key={i} className="flex items-center text-xs text-emerald-300/80">
              <span className="w-1 h-1 bg-emerald-400/60 rounded-full mr-2 flex-shrink-0"></span>
              {feature}
            </div>
          ))}
        </div>
        
        {/* Bottom accent */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500"
          initial={{ width: "20%" }}
          animate={{ width: isHovered ? "100%" : "20%" }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
};

const WorkflowStep = ({ step, index }: { step: typeof workflowSteps[0], index: number }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group relative h-full"
        >
            <motion.div
                className="relative bg-emerald-950/90 border border-emerald-400/30 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col h-full"
                whileHover={{
                    y: -5,
                    transition: { type: "spring", stiffness: 300, damping: 20 },
                }}
            >
                {/* Step number */}
                <div className="absolute -top-3 left-6 bg-gradient-to-r from-emerald-400 to-emerald-500 text-black px-3 py-1 rounded-lg text-sm font-bold shadow-lg">
                    {step.step}
                </div>

                <div className="text-3xl mb-4 mt-4">
                    {step.icon}
                </div>

                <h3 className="text-xl font-bold text-emerald-200 mb-3">
                    {step.title}
                </h3>

                <p className="text-emerald-200/90 mb-4 leading-relaxed text-sm">
                    {step.description}
                </p>

                <div className="space-y-2 mb-4">
                    {step.features.map((feature, i) => (
                        <div key={i} className="flex items-center text-sm text-emerald-300">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 flex-shrink-0"></span>
                            {feature}
                        </div>
                    ))}
                </div>

                <div className="flex-grow" /> {/* Spacer to push accent to bottom */}

                {/* Bottom accent */}
                <motion.div
                    className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500"
                    initial={{ width: "25%" }}
                    animate={{ width: isHovered ? "100%" : "25%" }}
                    transition={{ duration: 0.3 }}
                />
            </motion.div>
        </motion.div>
    );
};

const AppCard = ({ app, index }: { app: typeof apps[0], index: number }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <motion.div
        className="relative bg-emerald-950/90 border border-emerald-400/30 rounded-2xl p-6 backdrop-blur-sm h-full shadow-xl"
        whileHover={{
          y: -5,
          transition: { type: "spring", stiffness: 300, damping: 20 },
        }}
      >
        {/* Status badge */}
        <div className="absolute top-4 right-4 bg-emerald-500/30 text-emerald-300 px-2 py-1 rounded-lg text-xs font-bold border border-emerald-400/40">
          Ready
        </div>
        
        <div className="text-3xl mb-4">
          {app.icon}
        </div>
        
        <h3 className="text-xl font-bold mb-3 text-emerald-200">
          {app.name}
        </h3>
        
        <p className="text-emerald-200/90 mb-4 leading-relaxed text-sm">
          {app.description}
        </p>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-emerald-200 mb-2 flex items-center">
              <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
              Core Features:
            </h4>
            <div className="space-y-1">
              {app.features.map((feature, i) => (
                <div key={i} className="flex items-center text-sm text-emerald-300/90">
                  <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2 flex-shrink-0"></span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold text-emerald-200 mb-2 flex items-center">
              <span className="w-1 h-1 bg-emerald-400 rounded-full mr-2"></span>
              Tech Stack:
            </h4>
            <div className="flex flex-wrap gap-1">
              {app.techHighlights.map((tech, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom accent */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 rounded-b-2xl bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-500"
          initial={{ width: "30%" }}
          animate={{ width: isHovered ? "100%" : "30%" }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
};

export default function HowItWorks() {
  const sectionRef = useRef(null);
  const techRef = useRef(null);
  const workflowRef = useRef(null);
  const appsRef = useRef(null);
  
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });
  const techInView = useInView(techRef, { once: true, amount: 0.1 });
  const workflowInView = useInView(workflowRef, { once: true, amount: 0.1 });
  const appsInView = useInView(appsRef, { once: true, amount: 0.1 });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 px-4 md:px-8 bg-gradient-to-br from-black via-gray-950 to-black overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-emerald-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-6">
            <span className="text-emerald-300 font-semibold flex items-center gap-2">
              🔧 How It Works
            </span>
          </div>
        </motion.div>
        {/* User Workflow */}
        <motion.div
          ref={workflowRef}
          className="mb-20"
          initial={{ opacity: 0 }}
          animate={workflowInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black mb-4 bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
              Simple User Journey
            </h3>
            <p className="text-emerald-200/70 max-w-2xl mx-auto">
              From signup to settlement in four seamless steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflowSteps.map((step, index) => (
              <WorkflowStep key={index} step={step} index={index} />
            ))}
          </div>
        </motion.div>

        {/* Available Apps */}
        <motion.div
          ref={appsRef}
          initial={{ opacity: 0 }}
          animate={appsInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-black mb-4 bg-gradient-to-r from-emerald-300 to-emerald-400 bg-clip-text text-transparent">
              Available Applications
            </h3>
            <p className="text-emerald-200/70 max-w-2xl mx-auto">
              Production-ready Web3 applications built for real-world use
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {apps.map((app, index) => (
              <AppCard key={index} app={app} index={index} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}