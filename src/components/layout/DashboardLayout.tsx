
import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { initializeAudioSystem } from '@/utils/audio-system';

export function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // ✅ Inicializar sistema de áudio APENAS no dashboard (admin)
    console.log('🎵 [ADMIN LAYOUT] Inicializando sistema de áudio para admin...');
    initializeAudioSystem();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Fixed sidebar - doesn't scroll with the content */}
      <Sidebar 
        className="hidden md:block md:fixed h-screen z-10" 
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      
      {/* Content area with dynamic left padding based on sidebar state */}
      <div className={`flex flex-col flex-1 w-full transition-all duration-300 ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'
      }`}>
        <MobileNav />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
