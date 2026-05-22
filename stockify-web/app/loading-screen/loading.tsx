export default function LoadingScreen({ fullScreen = true }: { fullScreen?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 bg-[#FFFCEB] ${fullScreen ? "min-h-screen" : "h-[calc(100vh-180px)]"}`}>
      <img src="/loading1.gif" alt="Loading..." className="w-70 h-70 object-contain" />
      <p className="text-sm font-semibold text-primary tracking-widest uppercase animate-pulse -translate-y-13">Loading</p>
    </div>
  );
}