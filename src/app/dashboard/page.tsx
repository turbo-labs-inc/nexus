import { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard | Nexus Platform",
  description: "Nexus Platform Dashboard",
};

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirect=/dashboard");
  }

  // Get user profile
  let profile = null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (!error) {
      profile = data;
    } else {
      console.error("Error fetching user profile:", error);
    }
  } catch (error) {
    console.error("Failed to query profiles table:", error);
    // Table might not exist yet, continue with default profile
  }

  // Get MCP server count
  let serverCount = 0;
  try {
    const { count, error } = await supabase
      .from("mcp_configs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);
    
    if (!error) {
      serverCount = count || 0;
    } else {
      console.error("Error fetching MCP server count:", error);
    }
  } catch (error) {
    console.error("Failed to query mcp_configs table:", error);
    // Table might not exist yet, continue with default count
  }

  // Get chat session count
  let chatCount = 0;
  try {
    const { count, error } = await supabase
      .from("chat_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);
    
    if (!error) {
      chatCount = count || 0;
    } else {
      console.error("Error fetching chat session count:", error);
    }
  } catch (error) {
    console.error("Failed to query chat_sessions table:", error);
    // Table might not exist yet, continue with default count
  }

  // Mock data for visualization
  const recentActivity = [
    { id: 1, type: 'chat', title: 'Chat Session', detail: 'Asked about project architecture', time: '2 minutes ago' },
    { id: 2, type: 'workflow', title: 'Workflow Run', detail: 'Processed data extraction workflow', time: '15 minutes ago' },
    { id: 3, type: 'server', title: 'Server Connection', detail: 'Connected to Claude API Server', time: '1 hour ago' },
    { id: 4, type: 'model', title: 'Model Updated', detail: 'Updated GPT-4 configuration', time: '3 hours ago' },
    { id: 5, type: 'chat', title: 'Chat Session', detail: 'Generated documentation for API', time: '5 hours ago' },
    { id: 6, type: 'slack', title: 'Slack Message', detail: 'Responded in #projects channel', time: '1 day ago' },
  ];

  const userProjects = [
    { id: 1, name: 'API Documentation', progress: 75, lastUpdated: '2 hours ago' },
    { id: 2, name: 'Sales Dashboard', progress: 32, lastUpdated: '1 day ago' },
    { id: 3, name: 'Content Generation', progress: 100, lastUpdated: '3 days ago' },
  ];

  // Mock usage data for charts
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const usageData = {
    apiCalls: [124, 142, 156, 132, 189, 210, 145],
    chatMessages: [35, 42, 28, 56, 47, 41, 39],
    tokensUsed: [3240, 4120, 2980, 5340, 6210, 5430, 3980],
  };

  return (
    <div className="container mx-auto py-6">
      {/* Welcome and stats section */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Welcome, {profile?.full_name || session.user.email}</CardTitle>
            <CardDescription>
              Signed in as {session.user.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your personal dashboard with access to all Nexus features and analytics.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/profile">Manage Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid flex-1 gap-4 md:grid-cols-2">
          <Card className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">API Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{usageData.apiCalls.reduce((a, b) => a + b, 0)}</span>
                <span className="rounded-full bg-primary-foreground/20 px-2 py-1 text-xs">This week</span>
              </div>
              <div className="mt-1 text-sm opacity-90">API calls across all integrations</div>
              
              {/* Simple bar chart visualization */}
              <div className="mt-4 flex h-12 items-end gap-1">
                {usageData.apiCalls.map((value, index) => (
                  <div key={index} className="flex-1">
                    <div 
                      className="bg-primary-foreground/30 hover:bg-primary-foreground/40 transition-all" 
                      style={{ height: `${(value / Math.max(...usageData.apiCalls)) * 100}%` }}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs">
                {weekDays.map(day => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card/80 to-card border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Servers</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{serverCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Chat Sessions</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{chatCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Workflows</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Models</span>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main dashboard sections */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Projects section */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Your Projects</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {userProjects.map(project => (
                <div key={project.id} className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                    project.progress === 100 ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'
                  }`}>
                    {project.progress === 100 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">{project.progress}%</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="truncate text-base font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">Last updated {project.lastUpdated}</p>
                  </div>
                  <div className="w-1/2">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div 
                        className={`h-2 rounded-full ${
                          project.progress === 100 ? 'bg-green-500' : 'bg-primary'
                        }`}
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">Open</Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t p-4">
            <Button variant="outline" size="sm" className="w-full">
              Create New Project
            </Button>
          </CardFooter>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-auto p-0">
            <div className="divide-y">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex gap-4 p-4">
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    activity.type === 'chat' ? 'bg-blue-500/10 text-blue-500' :
                    activity.type === 'workflow' ? 'bg-purple-500/10 text-purple-500' :
                    activity.type === 'server' ? 'bg-green-500/10 text-green-500' :
                    activity.type === 'model' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-primary/10 text-primary'
                  }`}>
                    {activity.type === 'chat' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                    ) : activity.type === 'workflow' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                    ) : activity.type === 'server' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                        <line x1="6" y1="6" x2="6.01" y2="6"></line>
                        <line x1="6" y1="18" x2="6.01" y2="18"></line>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <Button variant="ghost" size="sm">
              View All Activity
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Quick access shortcuts */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <Link href="/configuration" className="group rounded-lg border bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-md">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </div>
            <h3 className="text-sm font-medium">Configuration</h3>
          </Link>

          <Link href="/chat" className="group rounded-lg border bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-md">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <h3 className="text-sm font-medium">Chat</h3>
          </Link>

          <Link href="/workflow-demo" className="group rounded-lg border bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-md">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="12" y1="16" x2="12" y2="8"></line>
              </svg>
            </div>
            <h3 className="text-sm font-medium">Workflows</h3>
          </Link>

          <Link href="/models" className="group rounded-lg border bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-md">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 group-hover:bg-yellow-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v16.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h12.8c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V7.5L15.5 2z"></path>
                <polyline points="15 2 15 8 21 8"></polyline>
              </svg>
            </div>
            <h3 className="text-sm font-medium">Models</h3>
          </Link>

          <Link href="/servers" className="group rounded-lg border bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-md">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 group-hover:bg-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </div>
            <h3 className="text-sm font-medium">Servers</h3>
          </Link>

          <Link href="/docs" className="group rounded-lg border bg-card p-3 text-center transition-all hover:border-primary/50 hover:shadow-md">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h3 className="text-sm font-medium">Docs</h3>
          </Link>
        </div>
      </div>
    </div>
  );
}