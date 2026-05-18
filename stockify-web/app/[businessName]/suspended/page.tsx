import { createClient } from "@/lib/supabase/server";
import React from "react";

export default async function SuspendedPage({
  params,
}: {
  params: { businessName: string };
}) {
  const { businessName } = await params;
  const supabase = await createClient();



  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFCEB] p-4 text-[#385E31]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#385E31]/20 shadow-xl text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold font-['Fredoka'] mb-2">Business Suspended</h1>
        <p className="text-sm opacity-70 mb-6">
          The business <strong className="capitalize">{businessName.replace(/-/g, " ")}</strong> is currently suspended.
        </p>
        
        <div className="bg-[#FFFCEB] rounded-xl p-4 text-left border border-[#385E31]/10 mb-6">
          <p className="text-xs font-bold uppercase mb-2 opacity-60">For further information, please contact:</p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span className="font-bold">stockify@gmail.com</span>
            </div>
          </div>
        </div>
        
        <p className="text-xs opacity-50">
          Thank you for your understanding.
        </p>
      </div>
    </div>
  );
}
