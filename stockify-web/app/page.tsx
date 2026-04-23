"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";
import NavbarLandingPage from "@/components/navbars/navbar-landing-page";
import LoginModal from "@/components/modals/login-modal";
import StockifyButton from "@/components/buttons/button-get-started";
import LandingPageInfoCard from "@/components/cards/landing-page-info-card";
import LandingPageObjectiveCard from "@/components/cards/landing-page-objective-card";

// ================= Animation Presets =================

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
      delay,
    },
  }),
};

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 48 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.35 },
  },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// ================= Component =================

export default function Home() {
  const router = useRouter();
  const [loginOpen, setLoginOpen] = useState(false);

  const INFO_CARDS = [
    {
      num: "01",
      title: "Smart Restock Alerts",
      desc: `Never tell a customer "we're out" ever again. Set your own minimum stock thresholds, and our engine will trigger a digital "hey, look at this" notification before you hit zero.`,
    },
    {
      num: "02",
      title: "Sales Forecasting",
      desc: `Stop guessing what will sell next month. After six months of data, Stockify synthesizes your transaction history into annual sales projections to help you make data-driven restocking decisions.`,
    },
    {
      num: "03",
      title: "Multi-Tenant Privacy",
      desc: `Even though you're on a shared SaaS platform, your data is yours alone. Our architecture ensures a high degree of isolation, giving you a unique shop directory and individual settings tailored for you.`,
    },
    {
      num: "04",
      title: "Team Control",
      desc: `Managing a crew? Use Role-Based Access Control (RBAC) to grant your staff access to inventory records or order fulfillment without giving away the keys to the entire castle.`,
    },
    {
      num: "05",
      title: "Your Brand, Your Rules",
      desc: `It's your storefront, not ours. Customize your colors, upload your logo, and choose exactly how you want to get paid—whether it's through QR codes or Cash-on-Delivery.`,
    },
    {
      num: "06",
      title: "Total Inventory CRUD",
      desc: `From adding seasonal pastries to updating tech gear prices, our single interface gives you full Create, Read, Update, and Delete power over your entire product catalog.`,
    },
  ];

  const OBJECTIVE_CARDS = [
    {
      img: "/icon-stocks.png",
      title: "Eliminate Loss in Sales and Revenue",
      desc: "We aim to prevent revenue loss caused by inventory stock-outs, a common issue that disrupts small business growth.",
    },
    {
      img: "/icon-automation.png",
      title: "Automate Stock Monitoring",
      desc: "The system is designed to automate stock monitoring and to alert generation, ensuring you are always aware of your inventory levels without manual tracking.",
    },
    {
      img: "/icon-decision.png",
      title: "Drive Data-Based Decisions",
      desc: "We provide business insights and analytics to assist owners in making restocking decisions and optimizing their overall inventory strategy.",
    },
  ];

  // Workflow Timeline Data based on SRS
  const WORKFLOW_STEPS = [
    {
      num: "1",
      title: "Tenant Onboarding",
      desc: "Submit a registration application for Superadmin approval. Configure your business type and customize your unique storefront.",
    },
    {
      num: "2",
      title: "Inventory Cataloging",
      desc: "Build your product catalog and configure your custom quantity-based or date-based stock alert logic.",
    },
    {
      num: "3",
      title: "Customer Browsing",
      desc: "Customers explore your storefront and checkout using your internally generated QR Code or Cash-on-Delivery.",
    },
    {
      num: "4",
      title: "Automated Deduction",
      desc: "Orders automatically deduct stock. Low inventory instantly triggers real-time dashboard alerts to your staff.",
    },
    {
      num: "5",
      title: "Order Fulfillment",
      desc: "Update transaction statuses while the system simultaneously calculates suggested reorder quantities for you.",
    },
    {
      num: "6",
      title: "Data Analytics",
      desc: "Track top-selling products and access annual sales forecasts synthesized from your historical transaction data.",
    },
  ];

  // Tech Stack Data
  const TECH_STACK = [
    {
      name: "Next.js",
      role: "FRAMEWORK",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 20L14 4M14 16L18 12L14 8M6 16L2 12L6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: "React",
      role: "UI LIBRARY",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9H21M9 21V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: "TypeScript",
      role: "TYPE SAFETY",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: "Tailwind CSS",
      role: "STYLING",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: "Supabase",
      role: "DATABASE & AUTH",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="5" rx="9" ry="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 5V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      name: "Node.js",
      role: "BACKEND LOGIC",
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="2" y="14" width="20" height="6" rx="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="7" r="1" fill="currentColor"/>
          <circle cx="6" cy="17" r="1" fill="currentColor"/>
        </svg>
      )
    },
  ];

  return (
    // FIX: Changed `overflow-x-hidden` to `overflow-clip` to prevent the double scrollbar bug
    <div className="w-full min-h-screen flex flex-col relative overflow-clip font-sans">

      {/* HERO SECTION */}
      <div className="w-full min-h-screen bg-[#385E31] flex flex-col items-center pt-8">
        <div className="w-full max-w-[1268px] flex flex-col h-full px-4 md:px-8 flex-1">

          {/* Navbar */}
          <motion.div
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex justify-center shrink-0"
          >
            <NavbarLandingPage />
          </motion.div>

          {/* Hero Content */}
          <div className="w-full flex-1 flex flex-col lg:flex-row justify-center items-center gap-10 lg:gap-0 pb-10 lg:pb-0 mt-10 lg:mt-0">

            {/* Left */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-[550px] flex flex-col gap-10 shrink-0 text-center lg:text-left items-center lg:items-start"
            >
              <motion.div
                className="flex flex-col gap-4 lg:pl-3 pt-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.h1
                  variants={staggerChild}
                  className="text-[#F7B71D] text-4xl md:text-[51px] font-semibold font-fredoka leading-[1.2] lg:leading-[1.1]"
                >
                  Your inventory should work even when you're not.
                </motion.h1>
                <motion.p
                  variants={staggerChild}
                  className="text-[#FDEF96] text-xl md:text-[23px] font-regular font-raleway leading-relaxed md:leading-10"
                >
                  Put your supply chain on autopilot with Stockify's multi-tenant management engine.
                </motion.p>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row items-center gap-4 sm:gap-9 lg:pl-3 w-full sm:w-auto"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.55 } },
                }}
              >
                {[
                  { label: "Get Started", variant: "primary" as const, action: () => router.push("/auth/sign-up") },
                  { label: "Sign In", variant: "secondary" as const, action: () => setLoginOpen(true) },
                ].map((btn) => (
                  <motion.div
                    key={btn.label}
                    variants={staggerChild}
                    whileHover={{ y: -3, transition: { duration: 0.2, ease: "easeOut" } }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <StockifyButton label={btn.label} variant={btn.variant} onClick={btn.action} />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right */}
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="visible"
              className="w-full lg:w-[700px] flex justify-center items-center"
            >
              <motion.img
                src="/landing-page.png"
                alt="Stockify Dashboard Preview"
                whileHover={{
                  scale: 1.04,
                  transition: { duration: 0.4, ease: "easeOut" },
                }}
                className="w-full h-auto max-h-[74vh] lg:max-h-[76vh] object-contain drop-shadow-2xl"
              />
            </motion.div>

          </div>
        </div>
      </div>

      {/* FEATURES SECTION */}
      <div id="features" className="w-full bg-[#FFFCEB] flex flex-col items-center relative">

        <div className="w-full max-w-[1268px] flex flex-col px-4 md:px-8 pt-12 pb-16">

          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={fadeUp}
            custom={0}
            className="flex flex-col items-center justify-center text-center w-full mx-auto max-w-5xl mb-12"
          >
            <div className="flex flex-row items-center justify-center gap-2 mb-6">
              <h2 className="text-[#3B5418] text-3xl md:text-[43px] font-semibold font-['Fredoka']">What is</h2>
              <motion.img
                whileHover={{ rotate: 8, scale: 1.08, transition: { duration: 0.25, ease: "easeOut" } }}
                className="w-16 md:w-15 h-auto"
                src="/stockify-logo-1.svg"
                alt="Stockify Box Icon"
              />
              <h2 className="text-[#3B5418] text-3xl md:text-[40px] font-bold font-['Fredoka'] tracking-wide">STOCKIFY?</h2>
            </div>
            <div className="w-full max-w-[900px] h-2 bg-amber-400 rounded-full mb-8" />
            <p className="max-w-4xl text-xl md:text-[20px] font-regular font-['Inter'] leading-relaxed">
              <span className="text-[#3B5418]">The heavy lifting, handled</span>
              <span className="text-amber-400">. </span>
              <span className="text-[#3B5418]">It's everything you need to run your shop without the spreadsheet-induced migraines.</span>
            </p>
          </motion.div>

          <div className="w-full flex flex-col gap-8">
            {INFO_CARDS.map((card, index) => (
              <motion.div
                key={card.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                variants={{
                  hidden: { opacity: 0, y: 36 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                      delay: Math.min(index * 0.07, 0.28),
                    },
                  },
                }}
                whileHover={{
                  y: -6,
                  transition: { duration: 0.25, ease: "easeOut" },
                }}
                className="w-full flex justify-center"
              >
                <LandingPageInfoCard
                  number={card.num}
                  title={card.title}
                  description={card.desc}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Objectives Section */}
        <div className="w-full bg-[#F7B71D] pt-16 md:pt-12 md:pl-10 flex justify-center items-center shadow-[0_10px_30px_rgba(0,0,0,0.05)] z-10 relative">
          <div className="w-full max-w-[1268px] flex flex-col justify-center items-center">

            <motion.h2
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={fadeUp}
              custom={0}
              className="w-full text-center md:text-left text-[#3B5418] text-4xl md:text-5xl font-semibold font-['Fredoka'] mb-10 "
            >
              The Objectives
            </motion.h2>

            <div className="flex flex-col lg:flex-row items-stretch justify-center gap-12 w-full px-4 md:px-8">

              {/* Objective Cards */}
              <motion.div
                className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-stretch justify-center gap-6 w-full lg:w-2/3"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={staggerContainer}
              >
                {OBJECTIVE_CARDS.map((obj) => (
                  <motion.div
                    key={obj.title}
                    variants={staggerChild}
                    className="flex-1 min-w-[280px] rounded-xl flex flex-col"
                  >
                    <div className="w-full h-full flex-1">
                      <LandingPageObjectiveCard
                        image_path={obj.img}
                        title={obj.title}
                        description={obj.desc}
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Floating character */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:flex w-full lg:w-1/3 justify-center items-center -translate-y-0 translate-x-1"
              >
                <motion.img
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  src="/stockify-kid.png"
                  alt="Stockify User Character"
                  className="w-full max-w-[350px] h-auto object-contain drop-shadow-xl"
                />
              </motion.div>

            </div>
          </div>
        </div>

        {/* ================= HORIZONTAL STRAIGHT TIMELINE SECTION ================= */}
        <div className="w-full bg-[#FFFCEB] pt-13 pb-18 border-b border-black/5 overflow-hidden">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="flex flex-col items-center justify-center text-center w-full mx-auto max-w-5xl px-4"
          >
            <h2 className="text-[#3B5418] text-4xl md:text-5xl font-semibold font-['Fredoka'] mb-4">
              How Stockify Works
            </h2>
            <p className="max-w-2xl text-lg font-regular font-['Inter'] text-[#3B5418]/80 leading-relaxed mb-12">
              From onboarding to predictive analytics, here is the seamless step-by-step journey of automating your entire supply chain.
            </p>
          </motion.div>

          {/* Desktop Interactive Horizontal Timeline - Refactored to straight line */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
            className="hidden lg:flex relative w-full max-w-[1268px] mx-auto mt-36 mb-36 px-12 items-center justify-between"
          >
            {/* The Solid Amber Connecting Line */}
            <div className="absolute top-1/2 left-[4%] right-[4%] h-[4px] bg-amber-400 -translate-y-1/2 z-0" />

            {WORKFLOW_STEPS.map((step, index) => (
              <motion.div 
                key={step.num} 
                variants={staggerChild}
                className="relative flex justify-center z-10 w-16"
              >
                {/* Interactive Number Circle */}
                <div className="w-[73px] h-[65px] rounded-full bg-[#FFFCEB] border-[4px] border-amber-400 flex items-center justify-center text-[#3B5418] text-2xl font-bold shadow-md hover:bg-[#3B5418] hover:text-amber-400 hover:scale-110 transition-all duration-300 cursor-pointer">
                  {step.num}
                </div>
                
                {/* Step Content - Alternating Top and Bottom positioned absolutely */}
                <div className={`absolute w-[200px] text-center flex flex-col items-center ${
                  index % 2 === 0 ? "top-[90px]" : "bottom-[90px]"
                }`}>
                  <h3 className="text-[#3B5418] text-[19px] font-fredoka font-semibold mb-2">{step.title}</h3>
                  <p className="text-[#3B5418]/80 text-[13px] font-medium leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile/Tablet Vertical Timeline */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
            className="lg:hidden relative flex flex-col gap-8 py-10 px-6 max-w-xl mx-auto mt-6"
          >
            {/* Vertical Connecting Line */}
            <div className="absolute top-[50px] bottom-[50px] left-[54px] w-[4px] bg-amber-400 rounded-full z-0" />
            
            {WORKFLOW_STEPS.map((step) => (
              <motion.div 
                key={step.num} 
                variants={staggerChild} 
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-start gap-6 z-10 group cursor-pointer"
              >
                {/* Interactive Number Circle Mobile */}
                <div className="w-16 h-16 shrink-0 rounded-full bg-[#FFFCEB] border-4 border-amber-400 flex items-center justify-center text-[#3B5418] text-2xl font-bold shadow-md mt-1 transition-colors duration-300 group-hover:bg-[#3B5418] group-hover:border-[#3B5418] group-hover:text-amber-400">
                  {step.num}
                </div>
                {/* Content Card Mobile */}
                <div className="pt-2 bg-white/60 p-4 rounded-xl border border-black/5 group-hover:bg-white group-hover:shadow-lg transition-all duration-300 w-full">
                  <h3 className="text-[#3B5418] text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-[#3B5418]/80 text-sm font-medium">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
        {/* ================= END HORIZONTAL STRAIGHT TIMELINE SECTION ================= */}


        {/* ================= TECH STACK SECTION ================= */}
        <div className="w-full bg-[#385E31] py-16 md:py-24 flex justify-center items-center border-t-4 border-[#2b4926] z-20">
          <div className="w-full max-w-[1268px] px-6 md:px-8 flex flex-col lg:flex-row gap-10 lg:gap-8 items-center lg:items-start">
            
            <motion.div 
              className="w-full lg:w-[35%] flex flex-col text-center lg:text-left shrink-0"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.4 }}
              variants={fadeLeft}
            >
              <h2 className="text-[#F7B71D] text-4xl md:text-[56px] font-semibold font-['Fredoka'] leading-[1.1] tracking-wide mb-6">
                Built With <br className="hidden lg:block"/> Modern Tech
              </h2>
              <p className="text-[#FDEF96] text-[15px] md:text-[19px] font-regular font-['Inter'] leading-relaxed opacity-90 max-w-xl mx-auto lg:mx-0 pr-0 lg:pr-4">
                We utilized the latest industry-standard technologies to ensure Stockify is fast, secure, and scalable for your entire business.
              </p>
            </motion.div>

            <motion.div 
              className="w-full lg:w-[65%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={staggerContainer}
            >
              {TECH_STACK.map((tech) => (
                <motion.div
                  key={tech.name}
                  variants={staggerChild}
                  whileHover={{ scale: 1.04, backgroundColor: "rgba(0,0,0,0.25)" }}
                  className="bg-black/15 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-sm transition-colors duration-300 cursor-default"
                >
                  <div className="text-[#F7B71D]">
                    {tech.icon}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-white text-lg font-bold font-['Inter'] tracking-wide">
                      {tech.name}
                    </h3>
                    <span className="text-[#A2D093] text-[11px] font-semibold tracking-[0.1em] sm:tracking-[0.15em] uppercase">
                      {tech.role}
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
        {/* ================= END TECH STACK SECTION ================= */}

        {/* Bottom CTA */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={fadeUp}
          custom={0}
          className="w-full flex justify-center py-24 bg-[#FFFCEB]"
        >
          <div className="flex flex-col items-center justify-center text-center w-full max-w-5xl px-4">

            <motion.div
              className="flex flex-row flex-wrap items-center justify-center gap-3 md:gap-4 mb-10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.5 }}
              variants={staggerContainer}
            >
              {["Get started with", null, "STOCKIFY", "now!"].map((word, i) =>
                word === null ? (
                  <motion.img
                    key="logo"
                    variants={staggerChild}
                    whileHover={{ rotate: -8, scale: 1.08, transition: { duration: 0.25, ease: "easeOut" } }}
                    className="w-14 md:w-18 h-auto"
                    src="/stockify-logo-1.svg"
                    alt="Stockify Box Icon"
                  />
                ) : (
                  <motion.h2
                    key={word}
                    variants={staggerChild}
                    className={`text-[#3B5418] text-4xl md:text-[55px] font-['Fredoka'] ${
                      word === "STOCKIFY" ? "font-bold tracking-wide" : "font-semibold"
                    }`}
                  >
                    {word}
                  </motion.h2>
                )
              )}
            </motion.div>

            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2, ease: "easeOut" } }}
              whileTap={{ scale: 0.97 }}
            >
              <StockifyButton
                label="Get Started"
                variant="primary"
                onClick={() => router.push("/auth/sign-up")}
              />
            </motion.div>

          </div>
        </motion.div>

      </div>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}