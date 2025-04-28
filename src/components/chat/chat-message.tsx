"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export interface ChatMessageProps {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
  avatar?: string;
  username?: string;
  attachments?: Array<{
    id: string;
    type: "image" | "audio" | "video" | "file";
    url: string;
    name?: string;
    size?: number;
    preview?: string;
  }>;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, content, timestamp, isLoading, avatar, username, attachments }, ref) => {
    const isUserMessage = role === "user";
    const displayName = username || (isUserMessage ? "You" : "Nexus");
    const avatarUrl = avatar || (isUserMessage ? "/user-avatar.png" : "/logo.png");
    const messageTime = timestamp
      ? new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "numeric",
        }).format(timestamp)
      : "";

    return (
      <div
        ref={ref}
        className={cn("flex items-start gap-3 py-4", isUserMessage ? "flex-row" : "flex-row")}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{displayName}</span>
            {messageTime && <span className="text-xs text-muted-foreground">{messageTime}</span>}
          </div>

          <div className="mt-1">
            {/* Display attachments if present */}
            {attachments && attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <AttachmentPreview key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}

            {/* Display message content */}
            <div className={cn("prose prose-sm dark:prose-invert", isLoading && "opacity-70")}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  code(props) {
                    const { className, children, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    // Check if it's a code block with language
                    return match ? (
                      <div className="relative rounded-md">
                        <div className="absolute right-2 top-2 flex items-center space-x-1">
                          <button
                            className="rounded bg-muted p-1 text-xs text-muted-foreground hover:bg-primary/20"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
                            }}
                          >
                            Copy
                          </button>
                        </div>
                        <pre className={className}>
                          <code className={className} {...rest}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className={cn("rounded bg-muted px-1 py-0.5", className)} {...rest}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="my-4 w-full overflow-x-auto">
                        <table className="w-full border-collapse">{children}</table>
                      </div>
                    );
                  },
                  img({ src, alt }) {
                    return (
                      <div className="my-4 flex justify-center">
                        <img
                          src={src || ""}
                          alt={alt || ""}
                          className="max-h-96 max-w-full rounded-lg"
                        />
                      </div>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

interface AttachmentPreviewProps {
  attachment: {
    id: string;
    type: "image" | "audio" | "video" | "file";
    url: string;
    name?: string;
    size?: number;
    preview?: string;
  };
}

function AttachmentPreview({ attachment }: AttachmentPreviewProps) {
  switch (attachment.type) {
    case "image":
      return (
        <div className="relative h-32 w-32 overflow-hidden rounded-md border">
          <Image
            src={attachment.url}
            alt={attachment.name || "Image"}
            fill
            className="object-cover"
          />
        </div>
      );
    case "audio":
      return (
        <div className="rounded-md border p-2">
          <audio controls className="h-10 w-full">
            <source src={attachment.url} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    case "video":
      return (
        <div className="relative max-h-64 max-w-xs overflow-hidden rounded-md border">
          <video controls className="h-full w-full">
            <source src={attachment.url} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    case "file":
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M4 12h8V7h-3V4H4v8z" fill="currentColor" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1 1.5A1.5 1.5 0 012.5 0h8.207L15 4.293V14.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 14.5v-13z"
                stroke="currentColor"
              />
            </svg>
          </div>
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{attachment.name || "File"}</p>
            {attachment.size && (
              <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
            )}
          </div>
        </a>
      );
    default:
      return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
  else return (bytes / 1073741824).toFixed(1) + " GB";
}
