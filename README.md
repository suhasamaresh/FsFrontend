# FlashSuite 🌐

**FlashSuite** is the next-generation social+finance platform for groups—friends, DAOs, teams, or classrooms—built from the ground up on Etherlink. Our vision is simple: let groups coordinate, create, reward, and preserve memories in powerful new ways, all on-chain, all under one unified user experience.

---

## What Is FlashSuite?

FlashSuite is an all-in-one Web3 "operating system" for group life. It enables communities to:

- **Split costs & pool funds (FlashSplit)**
- **Assign, claim, and reward microtasks (FlashBounty, FlashTasks)**
- **Run collaborative study funds (FlashStudy)**
- **Organize Pomodoro sprints (FlashSprint)**
- **Preserve group memories with time-locked capsules (FlashTimeCapsule)**
- ...and more!

Each service is standalone and composable, deployed as a modular smart contract on Etherlink, making FlashSuite both highly flexible and future-proof.

---

## Smart Contracts

- **FlashSplit:**  
        Group bill splitting and shared vaults—a true Web3 version of Splitwise, letting groups keep all IOUs on-chain.  
        **Currently, FlashSplit only works with XTZ (Tezos), and support for more currencies will be added soon.**  
        - 📦 [FlashSplit Contract Repository](https://github.com/suhasamaresh/FlashSplit)

- **Other Modules:**  
        Micro-task bounty board, study/resource pooling, Pomodoro sprints, time capsules, and more.  
        **All other modules currently work with USDC.**  
        - 📦 [FlashSuite Contracts Repository](https://github.com/suhasamaresh/FlashSuite)

All contracts are deployed and tested on Etherlink.

---

## What We've Done So Far

- **Smart Contracts:**  
                - **FlashSplit:** Group expense management (see repo above).
                - **FlashBounty:** Micro-task bounty board with USDC staking, task claims, and on-chain settlements.
                - **Other Modules (Deployed):**
                                - **FlashStudy:** Resource pooling for shared educational or productivity costs.
                                - **FlashTasks:** On-chain task and accountability assignments.
                                - **FlashSprint:** Staked Pomodoro sprints for team focus, forfeitures feed a group "focus fund."
                                - **FlashTimeCapsule:** Community memory capsules, hidden until a future reveal date.

- **Frontend:**  
                The **frontend for FlashSplit and FlashBounty is fully ready and live**, providing a seamless, user-friendly interface trusted by early users.  
                We are actively building the frontends for the other FlashSuite modules—FlashStudy, FlashTasks, FlashSprint, and FlashTimeCapsule—to bring the full social finance experience under one roof.

- **Event structure and analytics:**  
                Smart contracts emit rich events designed for indexing with GoldSky subgraphs, powering real-time dashboards and user activity tracking.

---

## Current State and Next Steps

- **Completed:** Core smart contracts deployed on Etherlink testnet; FlashSplit and FlashBounty frontends fully operational.  
- **In Progress:** Frontend development for remaining modules continues, focusing on smooth integrations, social features, and multi-module user experience.  
- **Next:** Deep integration of GoldSky subgraphs for live group dashboards, workflows, and cross-module histories across all FlashSuite services.

---

## Sponsor Tools: How We Use Them

### 🔵 Sequence Embedded Wallet (by Horizon)

- Provides universal one-click onboarding and embedded wallet UX, enabling users to connect with email, Google, Discord accounts—no seed phrase hassle.  
- Seamlessly integrated into all frontend apps for FlashSuite modules, ensuring easy adoption.

### 🔴 RedStone Oracle

- Used primarily in FlashSplit for on-demand price feeds to guarantee precise and stable XTZ value calculations.  
- Chosen for gas efficiency and robustness, with plans to extend oracle data to other modules for accurate valuations.

### 🟠 GoldSky Subgraphs

- All FlashSuite contracts emit detailed events captured and indexed by GoldSky subgraphs.  
- Powers frontend group activity feeds, leaderboards, historical analytics, and real-time collaborative views.  
- Enables transparency, trust, and social visibility across the entire suite.

---

## Our Vision for the Future

We envision FlashSuite evolving into a full-fledged event-driven **group operating system** on Etherlink covering:

- Holistic on-chain event and task coordination for communities of all sizes.  
- Privacy and selective sharing controls for managing group information securely.  
- Turnkey DAO onboarding for any social circle ready to self-govern.  
- NFT-powered group badges, memorabilia, and participation recognition.  
- Mobile and cross-platform apps ensuring FlashSuite is everywhere your groups are.  
- Open plugin architecture allowing rapid innovation from the community.

---

## Directory Structure (frontend)

```
app/
├── components         # Reusable UI blocks
├── FlashBounty        # Bounty task board UI (Complete)
├── Flashsplit         # Group expense management UI (Complete)
├── FlashStudy         # Study/resource crowdfunding UI (In development)
├── FlashSprint        # Pomodoro sprints UI (In development)
├── FlashTasks         # Task commitments UI (In development)
├── FlashTimeCapsule   # Time capsule UI (In development)
├── utils              # Shared helpers and wallet integration
└── views              # Screen routing and layouts
```

---

## Getting Started

1. Clone the repo and install dependencies.  
2. Set environment variables (`PRIVATE_KEY`, `RPC_URL`, etc.).  
3. Use deployed testnet contracts or deploy your own with the provided scripts.  
4. Start the frontend with:  
                 ```bash
                 npm run dev
                 ```
5. Connect your Sequence wallet and begin coordinating with your groups!

---

**FlashSuite: The Web3 social toolkit for groups that want to build, create, and grow together.**

