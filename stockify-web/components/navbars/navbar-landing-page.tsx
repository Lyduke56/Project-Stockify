"use client";
import { useRouter, usePathname } from "next/navigation";

export default function NavbarLandingPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Check if the current route is the sign-up page.
  // Note: Adjust "/sign-up" if your actual route path is different (e.g., "/register")
  const isSignUpPage = pathname === "/auth/sign-up";

  const scrollToFeatures = () => {
    // Looks for the element with id="features" on the current page
    const featuresSection = document.getElementById("features");
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push("/#features");
    }
  };

  return (
    <div className="w-full h-13 px-12 bg-[#F7B71D] rounded-[50px] shadow-[2px_4px_4px_0px_rgba(43,88,12,0.70)] flex items-center justify-between">
      
      {/* LEFT SIDE: Logo and Brand Name */}
      <div 
        className="flex items-center gap-2 cursor-pointer select-none" 
        onClick={() => router.push("/")}
      >
        <div className="w-12 h-12 flex items-center justify-center">
          <img
            src="/stockify-logo-1.svg"
            alt="Stockify Icon"
            className="h-10 w-auto"
          />
        </div>
        <div className="text-[#385E31] text-3xl font-bold font-fredoka">
          STOCKIFY
        </div>
      </div>

      {/* RIGHT SIDE: Dynamic Navigation Links */}
      <div className="flex items-center gap-16">
        {isSignUpPage ? (
          /* Render Back Button if on the Sign-Up page */
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-[#385E31] text-2xl font-medium font-fredoka hover:opacity-75 transition-opacity cursor-pointer"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5} 
              stroke="currentColor" 
              className="w-7 h-7"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
        ) : (
          /* Render Standard Links if anywhere else */
          <>
            <button
              onClick={scrollToFeatures}
              className="text-[#385E31] text-2xl font-medium font-fredoka hover:opacity-75 transition-opacity cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => router.push("/landing-page/about_us")}
              className="text-[#385E31] text-2xl font-medium font-fredoka hover:opacity-75 transition-opacity cursor-pointer"
            >
              About Us
            </button>
          </>
        )}
      </div>
    </div>
  );
}