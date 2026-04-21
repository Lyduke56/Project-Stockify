"use client";

interface NotificationItem {
  title: string;
  body: string;
  timestamp: string;
  isRead?: boolean;
}

const defaultNotifications: NotificationItem[] = [
  { title: "Important Notification - Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", timestamp: "03/20/2026, 5:00 PM", isRead: false },
  { title: "Important Notification - Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", timestamp: "03/20/2026, 5:00 PM", isRead: true },
  { title: "Important Notification - Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", timestamp: "03/20/2026, 5:00 PM", isRead: true },
  { title: "Important Notification - Title", body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", timestamp: "03/20/2026, 5:00 PM", isRead: true },
];

export default function NotificationModal({
  isOpen,
  onClose,
  notifications = defaultNotifications,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-[600px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#FFFCF0" }}
      >
        {/* Header */}
        <header
          className="px-8 py-5 flex justify-between items-center"
          style={{ borderBottom: "1px solid rgba(56,94,49,0.15)" }}
        >
          <h2
            className="text-2xl font-bold uppercase tracking-widest font-['Inter']"
            style={{ color: "#385E31" }}
          >
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-lg font-bold hover:scale-110 transition-transform"
            style={{ color: "#385E31" }}
          >
            ✕
          </button>
        </header>

        {/* Notification list */}
        <div className="flex flex-col max-h-[440px] overflow-y-auto">
          {notifications.map((notif, i) => (
            <div
              key={i}
              className="flex items-start justify-between px-8 py-5"
              style={{
                backgroundColor: notif.isRead ? "transparent" : "rgba(56,94,49,0.07)",
                borderBottom: "1px solid rgba(56,94,49,0.10)",
              }}
            >
              {/* Left: title + body */}
              <div className="flex flex-col gap-1 flex-1 pr-8">
                <span
                  className="text-base font-semibold font-['Inter']"
                  style={{ color: "#385E31" }}
                >
                  {notif.title}
                </span>
                <span
                  className="text-sm font-normal font-['Inter']"
                  style={{ color: "#385E31", opacity: 0.6 }}
                >
                  {notif.body}
                </span>
              </div>

              {/* Right: timestamp */}
              <span
                className="text-sm font-normal font-['Inter'] shrink-0"
                style={{ color: "#385E31", opacity: 0.6 }}
              >
                {notif.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}