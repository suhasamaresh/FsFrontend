"use client";

import { useAccount, useDisconnect } from "wagmi";
import { useOpenConnectModal } from "@0xsequence/connect";
import { useOpenWalletModal } from "@0xsequence/wallet-widget";
import { Button } from "@0xsequence-demos/boilerplate-design-system";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { setOpenConnectModal } = useOpenConnectModal();
  const { setOpenWalletModal } = useOpenWalletModal();

  // Logo animation
  const logoVariants = {
    initial: { opacity: 0, x: -20 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 }
    },
    hover: {
      scale: 1.05,
      textShadow: "0 0 18px #34d399b7",
      transition: { duration: 0.17 }
    }
  };

  const buttonVariants = {
    initial: { opacity: 0, y: -10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35 }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 8px 26px #10b98144",
      transition: { duration: 0.19 }
    },
    tap: { scale: 0.95 }
  };

  const addressVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.45 }
    }
  };
  const chainBadgeVariants = {
    initial: { opacity: 0, x: 10 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, delay: 0.20 }
    },
    hover: {
      scale: 1.1,
      backgroundColor: "rgba(16, 185, 129, 0.28)",
      transition: { duration: 0.13 }
    }
  };

  return (
    <motion.nav
      className="flex items-center justify-between px-6 py-4 w-full
            bg-gradient-to-br from-emerald-900 via-black to-black/90
            shadow-lg border-b border-emerald-400/20 backdrop-blur-md"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.span
        className="font-black text-3xl bg-gradient-to-r from-emerald-400 via-green-300 to-lime-300 bg-clip-text text-transparent cursor-pointer tracking-tight"
        variants={logoVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
      >
        FlashSplit
      </motion.span>

      <div className="flex items-center gap-4">
        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect"
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover="hover"
              whileTap="tap"
            >
              <Button
                variant="primary"
                className="relative font-bold text-base px-8 py-3 rounded-full 
                  bg-gradient-to-r from-emerald-500 via-green-400 to-lime-300
                  text-black shadow-lg border-2 border-emerald-300/50 hover:border-emerald-200 transition-all duration-300 group overflow-hidden"
                onClick={() => setOpenConnectModal(true)}
              >
                <span className="relative z-10">Connect Wallet</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-lime-200 opacity-0 group-hover:opacity-10"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity
                  }}
                />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="connected"
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.48 }}
            >
              <motion.div
                className="flex items-center gap-3 bg-emerald-950/65 backdrop-blur-sm px-4 py-2 rounded-full border border-emerald-400/30"
                variants={addressVariants}
                initial="initial"
                animate="animate"
              >
                <motion.span
                  className="font-mono text-emerald-300 text-[0.97em] font-semibold tracking-wide"
                  whileHover={{
                    color: "#fff",
                    textShadow: "0 0 12px #6ee7b7aa",
                    transition: { duration: 0.18 }
                  }}
                >
                  {address?.slice(0, 6)}…{address?.slice(-4)}
                </motion.span>
                <motion.span
                  className="text-emerald-100 text-xs bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-400/30 backdrop-blur-sm cursor-pointer"
                  variants={chainBadgeVariants}
                  initial="initial"
                  animate="animate"
                  whileHover="hover"
                >
                  {chain?.name}
                </motion.span>
              </motion.div>
              <motion.div
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="secondary"
                  className="border-2 border-emerald-400/70 text-emerald-200 hover:text-emerald-900 hover:bg-emerald-400/70 hover:border-emerald-300 text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-300 font-medium"
                  onClick={() => setOpenWalletModal(true)}
                >
                  Details
                </Button>
              </motion.div>
              <motion.div
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                whileTap="tap"
              >
                <Button
                  variant="secondary"
                  className="border-2 border-emerald-400/35 text-emerald-500 hover:text-white hover:bg-emerald-700/25 hover:border-emerald-300 text-sm px-4 py-2 rounded-lg backdrop-blur-sm transition-all duration-300 font-medium"
                  onClick={() => disconnect()}
                >
                  Disconnect
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
