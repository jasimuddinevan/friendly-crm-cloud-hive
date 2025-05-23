
import { useState } from 'react';
import { Search, Users, Target, CheckSquare, Building, Database, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Navigation = ({ activeView, setActiveView, searchTerm, setSearchTerm }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Building },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'companies', label: 'Companies', icon: Building },
    { id: 'data', label: 'Data Manager', icon: Database },
  ];

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">CRM Pro</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? "default" : "ghost"}
                  onClick={() => setActiveView(item.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeView === item.id ? "default" : "ghost"}
                  onClick={() => {
                    setActiveView(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start flex items-center space-x-2"
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
};
