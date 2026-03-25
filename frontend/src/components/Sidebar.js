import { useNavigate, useLocation } from "react-router-dom";
import { 
  Upload, Clock, BarChart3, GitCompare, Trophy, BookOpen, 
  ChevronLeft, ChevronRight, Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const menuItems = [
  { path: "/", icon: Upload, label: "อัปโหลด", color: "text-primary" },
  { path: "/history", icon: Clock, label: "ประวัติ", color: "text-purple-400" },
  { path: "/progress", icon: BarChart3, label: "พัฒนาการ", color: "text-blue-400" },
  { path: "/compare", icon: GitCompare, label: "เปรียบเทียบ", color: "text-cyan-400" },
  { path: "/game-analysis", icon: Trophy, label: "วิเคราะห์ทั้งเกม", color: "text-yellow-400" },
  { path: "/reference", icon: BookOpen, label: "ข้อมูล BWF", color: "text-emerald-400" },
];

const Sidebar = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        className="fixed top-4 left-4 z-50 md:hidden bg-[#121214] border border-white/10 rounded-xl"
        onClick={() => setMobileOpen(!mobileOpen)}
        data-testid="mobile-menu-btn"
      >
        <Menu className="w-5 h-5 text-white" />
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-[#0d0d0f] border-r border-white/5 z-40 transition-all duration-300 flex flex-col ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        data-testid="sidebar"
      >
        {/* Logo */}
        <div className={`p-4 border-b border-white/5 ${collapsed ? "px-2" : ""}`}>
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-xl">🏸</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-white text-lg">Badminton AI</h1>
                <p className="text-xs text-zinc-500">Analyzer</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                } ${collapsed ? "justify-center px-2" : ""}`}
                data-testid={`nav-${item.path.replace("/", "") || "home"}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${active ? item.color : ""}`} />
                {!collapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-white/5 hidden md:block">
          <Button
            variant="ghost"
            onClick={() => setCollapsed(!collapsed)}
            className={`w-full flex items-center gap-2 text-zinc-500 hover:text-white rounded-xl ${
              collapsed ? "justify-center" : ""
            }`}
            data-testid="collapse-btn"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">ย่อเมนู</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className={`flex-1 min-h-screen transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
};

export default Sidebar;
