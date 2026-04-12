import AlertsCard from "@/components/cards/employee/alerts-card";
import SalesForecastCard from "@/components/cards/employee/sales-forecast-card";
import StatCard from "@/components/cards/stat-cards";
import NavbarEmployee from "@/components/navbars/navbar-employee"
import SidebarEmployee from "@/components/navbars/sidebar-employee"

export default function EmployeeDashboard() {

  return (

    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">

      {/* LEFT SIDE: Fixed Sidebar */}
      <SidebarEmployee />

      {/* RIGHT SIDE: Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
        <NavbarEmployee />

        {/* Header */}
        <div className="w-full flex flex-col items-center mt-10 mb-10">
          <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
            Employee Dashboard
          </h1>
          <div className="w-[900px] h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
        </div>

        {/* Date Filter */}
        <div className="w-full flex justify-start mb-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            
            <span className="text-[#385E31] font-semibold">
              Data from:
            </span>

            <select className="bg-transparent border border-[#385E31] text-[#385E31] font-semibold px-4 py-1.5 rounded-lg outline-none cursor-pointer">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last year</option>
            </select>

          </div>
        </div>

        {/* stat cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard title="Total Revenue" value="₱ 32k" trendText="Total revenue as of mm/yy" className="w-full" svgName="employee-icons/piggybank" />
            <StatCard title="Total Orders" value="395" trendText="Total revenue as of today" className="w-full" svgName="employee-icons/orders" />
            <StatCard title="Top Selling Product" value="124" trendText="Total revenue as of mm/yy" className="w-full" svgName="employee-icons/topseller" />
        </div>  
          {/* divider*/}
        <div className="w-full border-t-5 border-[#24481F] my-8 rounded-full opacity-75" />

          {/* Bottom Contents */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <AlertsCard />
          <SalesForecastCard />
        </div>

        

      </div>
    </div>

  );

}
