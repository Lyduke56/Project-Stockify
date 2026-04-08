import NavbarEmployee from "@/components/navbars/navbar-employee";
import SidebarEmployee from "@/components/navbars/sidebar-employee";
import InventoryTable from "@/components/tables/inventory-table";

export default function EmployeeInventory() {

  return (

    <div className="flex h-screen w-full bg-[#FFFCEB] overflow-hidden font-['Inter']">
    
          {/* LEFT SIDE: Fixed Sidebar */}
          <SidebarEmployee />
    
          {/* RIGHT SIDE: Main Content */}
          <div className="flex-1 flex flex-col h-full overflow-y-auto px-20 pt-5 pb-12">
            <NavbarEmployee />
    
            {/* Header */}
            <div className="w-full flex flex-col items-center mt-10 mb-8">
              <h1 className="text-[#385E31] text-[30px] font-extrabold tracking-wide uppercase">
                Inventory
              </h1>
              <div className="w-[900px] h-1.5 bg-[#F7B71D] mt-1 rounded-full"></div>
            </div>
            <InventoryTable />
          </div>
    </div>

  );

}

