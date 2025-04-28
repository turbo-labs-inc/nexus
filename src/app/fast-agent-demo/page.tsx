import { FastAgentChat } from "@/components/chat/fast-agent-chat";
import { Container } from "@/components/layout/container";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export default function FastAgentDemoPage() {
  return (
    <Container>
      <div className="py-8">
        <h1 className="mb-6 text-center text-3xl font-bold">Fast-Agent Demo</h1>
        <div className="mx-auto mb-8 max-w-3xl space-y-4">
          <Alert>
            <InfoIcon className="h-5 w-5" />
            <AlertTitle>Server Connection Required</AlertTitle>
            <AlertDescription>
              Make sure your Python Fast-Agent server is running before testing this demo. 
              Run <code className="bg-muted p-1 rounded">cd fast_agent && python server.py</code> in your terminal.
            </AlertDescription>
          </Alert>
          
          <p className="text-center text-muted-foreground">
            This demo showcases the Fast-Agent Bridge integration. The bridge enables bidirectional 
            communication between the Next.js frontend and Python backend via WebSockets.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/fast-agent-tools-demo">
              <Button variant="outline">Tools Demo</Button>
            </Link>
            <Link href="/docs/fast_agent_setup">
              <Button variant="outline">Setup Instructions</Button>
            </Link>
          </div>
        </div>
        
        <FastAgentChat autoConnect={false} />
      </div>
    </Container>
  );
}
