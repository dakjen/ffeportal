'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, ClipboardList, Users, Plus, DollarSign, Settings, FileText } from 'lucide-react'; // Added Settings icon

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false); // New state for dropdown

  const isAdmin = pathname?.startsWith('/admin');
  const isContractor = pathname?.startsWith('/contractor');
  const isClient = pathname?.startsWith('/client');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--brand-white)]">
      {/* Top Navbar */}
      <nav className="bg-[var(--brand-black)] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={isAdmin ? "/admin/dashboard" : isContractor ? "/contractor/dashboard" : "/client/dashboard"} className="text-xl font-bold tracking-tight">
            {isAdmin ? (
              <>Design<span className="text-[var(--brand-beige)]">Domain Admin</span></>
            ) : isContractor ? (
              <>Design<span className="text-[var(--brand-beige)]">Domain Contractor</span></>
            ) : (
              <>Design<span className="text-[var(--brand-beige)]">Domain FF&E</span></>
            )}
          </Link>
          
          <div className="flex items-center gap-6">
            {isAdmin && (
              <>
                <Link href="/admin/dashboard" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/admin/dashboard' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/admin/requests" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname?.startsWith('/admin/requests') ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <ClipboardList className="h-4 w-4" /> Requests
                </Link>
                <Link href="/admin/quotes" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname?.startsWith('/admin/quotes') ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <FileText className="h-4 w-4" /> Quotes
                </Link>
                <Link href="/admin/invoices" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname?.startsWith('/admin/invoices') ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <DollarSign className="h-4 w-4" /> Invoices
                </Link>

                {/* New Tools Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsToolsDropdownOpen(!isToolsDropdownOpen)}
                    className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-[var(--brand-beige)] focus:outline-none"
                  >
                    <Settings className="h-4 w-4" /> Tools
                  </button>
                  {isToolsDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[var(--brand-black)] rounded-md shadow-lg z-10 py-1">
                      <Link href="/admin/services" onClick={() => setIsToolsDropdownOpen(false)} className={`block px-4 py-2 text-sm text-white hover:bg-gray-800 ${pathname?.startsWith('/admin/services') ? 'text-[var(--brand-beige)]' : ''}`}>
                        Services
                      </Link>
                      <Link href="/admin/pricing" onClick={() => setIsToolsDropdownOpen(false)} className={`block px-4 py-2 text-sm text-white hover:bg-gray-800 ${pathname?.startsWith('/admin/pricing') ? 'text-[var(--brand-beige)]' : ''}`}>
                        Pricing
                      </Link>
                      <Link href="/admin/users" onClick={() => setIsToolsDropdownOpen(false)} className={`block px-4 py-2 text-sm text-white hover:bg-gray-800 ${pathname?.startsWith('/admin/users') ? 'text-[var(--brand-beige)]' : ''}`}>
                        Users
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {isClient && (
              <>
                <Link href="/client/dashboard" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/client/dashboard' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/client/current-projects" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/client/current-projects' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <ClipboardList className="h-4 w-4" /> Current Projects
                </Link>
                <Link href="/client/new-request" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/client/new-request' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <Plus className="h-4 w-4" /> New Request
                </Link>
                <Link href="/client/team" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/client/team' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <Users className="h-4 w-4" /> Team
                </Link>
                <Link href="/client/settings" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/client/settings' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <Users className="h-4 w-4" /> Settings
                </Link>
              </>
            )}

            {isContractor && (
              <>
                <Link href="/contractor/dashboard" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/contractor/dashboard' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/contractor/invoices/new" className={`flex items-center gap-1 text-sm font-medium transition-colors ${pathname === '/contractor/invoices/new' ? 'text-[var(--brand-beige)]' : 'hover:text-[var(--brand-beige)]'}`}>
                  <Plus className="h-4 w-4" /> New Invoice
                </Link>
              </>
            )}

            <div className="h-4 w-px bg-gray-600 mx-2"></div>

            <button onClick={handleLogout} className="flex items-center gap-1 text-sm font-medium hover:text-[var(--brand-red)] transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}