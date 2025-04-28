import { FastAgentToolsDemo } from "@/components/chat/fast-agent-tools-demo";
import { Container } from "@/components/layout/container";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export default function FastAgentToolsDemoPage() {
  return (
    <Container>
      <div className="py-8">
        <h1 className="mb-6 text-center text-3xl font-bold">Fast-Agent Tools Demo</h1>
        <div className="mx-auto mb-8 max-w-3xl space-y-4">
          <Alert>
            <InfoIcon className="h-5 w-5" />
            <AlertTitle>Server Connection Required</AlertTitle>
            <AlertDescription>
              Make sure your Python Fast-Agent server is running before testing this demo. 
              Run <code className="rounded bg-muted p-1">cd fast_agent && python server.py</code> in your terminal.
            </AlertDescription>
          </Alert>
          
          <p className="text-center text-muted-foreground">
            This demo showcases the Fast-Agent Bridge with tool integration capabilities.
            Try asking the assistant to use the weather tool or calculator.
          </p>

          <div className="flex justify-center gap-4">
            <Link href="/fast-agent-demo">
              <Button variant="outline">Basic Demo</Button>
            </Link>
            <Link href="/docs/fast_agent_setup" className="text-primary hover:underline">
              <Button variant="outline">Setup Instructions</Button>
            </Link>
          </div>
        </div>
        
        <FastAgentToolsDemo autoConnect={false} />
      </div>
    </Container>
  );
}