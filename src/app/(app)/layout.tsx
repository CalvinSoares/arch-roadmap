import { Sidebar } from "@/shared/components/global/sidebar";
import { AppHeader } from "@/shared/components/global/app-header";
import { SidebarProvider } from "@/shared/context/sidebar-context";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <SidebarProvider>
      <div className="textura-grao flex min-h-dvh">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col bg-canvas">
          <AppHeader />
          {/* sem z-index aqui: criaria contexto de empilhamento e prenderia
              overlays `fixed` (tela cheia do construtor) abaixo do header */}
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
