import { Container } from "@/components/layout/container";
import { Metadata } from "next";
import fs from "fs";
import path from "path";
import { Card } from "@/components/ui/card";

// Simplified MDX-style component to render markdown (fallback if react-markdown isn't working)
function SimpleMarkdown({ children }: { children: string }) {
  // Split the markdown content into lines
  const lines = children.split("\n");
  
  return (
    <div className="prose prose-stone dark:prose-invert max-w-none">
      {lines.map((line, i) => {
        // Headings
        if (line.startsWith("# ")) {
          return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
        }
        if (line.startsWith("## ")) {
          return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.substring(3)}</h2>;
        }
        if (line.startsWith("### ")) {
          return <h3 key={i} className="text-xl font-bold mt-5 mb-2">{line.substring(4)}</h3>;
        }
        
        // Code blocks
        if (line.startsWith("```")) {
          return null; // Skip the opening/closing code fence lines
        }
        
        // Lists
        if (line.trim().startsWith("- ")) {
          return <li key={i} className="ml-6">{line.trim().substring(2)}</li>;
        }
        if (line.trim().startsWith("* ")) {
          return <li key={i} className="ml-6">{line.trim().substring(2)}</li>;
        }
        
        // Regular paragraphs
        if (line.trim() !== "") {
          return <p key={i} className="my-3">{line}</p>;
        }
        
        return null;
      })}
    </div>
  );
}

export const metadata: Metadata = {
  title: "Fast-Agent Setup | Nexus",
  description: "Setup instructions for the Fast-Agent Bridge in Nexus",
};

export default function FastAgentSetupPage() {
  // Read the markdown file
  const markdownPath = path.join(process.cwd(), "docs", "fast_agent_setup.md");
  const markdownContent = fs.readFileSync(markdownPath, "utf8");

  return (
    <Container>
      <div className="py-8">
        <Card className="mx-auto max-w-4xl overflow-hidden p-6 md:p-8">
          <SimpleMarkdown>{markdownContent}</SimpleMarkdown>
        </Card>
      </div>
    </Container>
  );
}