import { Link, useLocation } from "wouter";
import { Brain, Edit, History, BarChart3, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "ダッシュボード", icon: BarChart3 },
    { path: "/record", label: "記録", icon: Edit },
    { path: "/history", label: "履歴", icon: History },
    { path: "/analysis", label: "分析", icon: BarChart3 },
  ];

  const NavContent = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.path;
        return (
          <Link key={item.path} href={item.path}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className={`justify-start ${isActive ? "bg-primary text-primary-foreground" : "text-gray-600 hover:text-primary"}`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Desktop Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Brain className="text-primary h-8 w-8 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">
                アンガーマネジメント記録システム
              </h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <Link key={item.path} href={item.path}>
                    <span
                      className={`font-medium transition-colors ${
                        isActive ? "text-primary" : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex flex-col space-y-2 mt-6">
                  <NavContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div className={`flex flex-col items-center py-2 ${isActive ? "text-primary" : "text-gray-400"}`}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
