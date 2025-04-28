"use client";

// This layout uses use client to avoid being wrapped by the MCPProvider
// which would prevent accessing this page when database tables don't exist
export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b h-14 px-4 flex items-center">
        <div className="flex items-center">
          <img src="/logo.svg" alt="Nexus" className="h-8 mr-2" />
          <h1 className="text-lg font-medium">Database Setup</h1>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
    </div>
  );
}