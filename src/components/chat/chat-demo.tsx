"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { getSupabaseClient } from "@/lib/supabase/client";
import { ChatContainer } from "./chat-container";
import { ChatMessageProps } from "./chat-message";

interface ChatDemoProps {
  userId: string;
}

type FileUploadStatus = "pending" | "uploading" | "completed" | "error";

interface FileUpload {
  id: string;
  file: File;
  progress: number;
  status: FileUploadStatus;
  url?: string;
}

export function ChatDemo({ userId }: ChatDemoProps) {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const supabase = getSupabaseClient();

  // Function to simulate a response from the AI
  const generateResponse = async (messageText: string) => {
    // In a real app, this would call your MCP/Fast-Agent API
    return new Promise<string>((resolve) => {
      const responses = [
        "I'm just a demo response. In a real application, I would be powered by your MCP and Fast-Agent integration.",
        "This is a placeholder response. When the MCP integration is completed, I'll provide more helpful answers.",
        "In the full version, I would be able to process your input and generate a meaningful response.",
        "Thanks for your message! When fully implemented, I'll be able to understand and respond to your queries.",
      ];

      // Add a delay to simulate processing time
      setTimeout(() => {
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        resolve(`${randomResponse}\n\nYou said: "${messageText}"`);
      }, 1500);
    });
  };

  // Load messages from Supabase
  const loadMessages = useCallback(async () => {
    try {
      // Create a new chat session if none exists
      if (!sessionId) {
        const { data: session, error: sessionError } = await supabase
          .from("chat_sessions")
          .insert({
            title: "New Chat " + new Date().toLocaleString(),
            user_id: userId,
          })
          .select()
          .single();

        if (sessionError) throw sessionError;
        setSessionId(session.id);

        // No need to load messages for a new session
        setIsInitialLoading(false);
        return;
      }

      // Load messages for existing session
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (messagesError) throw messagesError;

      // Convert to ChatMessageProps format
      const formattedMessages = messagesData.map((msg) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        // In a real app, you would parse attachments from metadata
        attachments:
          msg.metadata && typeof msg.metadata === "object" && "attachments" in msg.metadata
            ? (msg.metadata.attachments as any[])
            : undefined,
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setIsInitialLoading(false);
    }
  }, [userId, sessionId, supabase]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Function to save a message to Supabase
  const saveMessage = async (
    content: string,
    role: "user" | "assistant" | "system",
    attachments?: Array<{ id: string; type: string; url: string; name?: string; size?: number }>
  ) => {
    if (!sessionId) return;

    try {
      const metadata = attachments ? { attachments } : null;

      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        content,
        role,
        metadata,
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // Function to upload a file to Supabase Storage
  const uploadFile = async (file: File): Promise<string> => {
    const fileId = uuidv4();
    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${sessionId}/${fileId}.${fileExt}`;

    // Add file to uploads tracking state
    setFileUploads((prev) => [
      ...prev,
      {
        id: fileId,
        file,
        progress: 0,
        status: "uploading",
      },
    ]);

    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(data.path);

      // Update uploads state
      setFileUploads((prev) =>
        prev.map((upload) =>
          upload.id === fileId
            ? { ...upload, progress: 100, status: "completed", url: publicUrl }
            : upload
        )
      );

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);

      // Update uploads state with error
      setFileUploads((prev) =>
        prev.map((upload) => (upload.id === fileId ? { ...upload, status: "error" } : upload))
      );

      throw error;
    }
  };

  // Function to handle sending a message
  const handleSendMessage = async (message: string, files?: File[]) => {
    // Don't do anything if there's no message and no files
    if (!message.trim() && (!files || files.length === 0)) return;

    // Add user message to state
    const userMessage: ChatMessageProps = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Start loading state for assistant response
    setIsLoading(true);

    try {
      // Save user message to database
      await saveMessage(message, "user");

      // Upload files if any
      const attachments = [];

      if (files && files.length > 0) {
        for (const file of files) {
          // Determine file type
          const fileType = file.type.startsWith("image/")
            ? "image"
            : file.type.startsWith("audio/")
              ? "audio"
              : file.type.startsWith("video/")
                ? "video"
                : "file";

          try {
            // Upload file and get URL
            const fileUrl = await uploadFile(file);

            // Add to attachments array
            attachments.push({
              id: uuidv4(),
              type: fileType,
              url: fileUrl,
              name: file.name,
              size: file.size,
            });
          } catch (error) {
            toast.error(`Failed to upload file: ${file.name}`);
          }
        }
      }

      // Generate AI response (in a real app, this would call your MCP/Fast-Agent)
      const responseText = await generateResponse(message);

      // Add assistant response to state
      const assistantMessage: ChatMessageProps = {
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to database
      await saveMessage(responseText, "assistant");
    } catch (error) {
      console.error("Error in sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle audio recording
  const handleRecordAudio = async (audioBlob: Blob) => {
    try {
      // Create a File from the audio Blob
      const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      // Process the recording as if it was an attachment
      await handleSendMessage("🎤 Audio message", [audioFile]);
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error("Failed to process audio recording");
    }
  };

  return (
    <ChatContainer
      messages={messages}
      isLoading={isLoading}
      onSendMessage={handleSendMessage}
      onRecordAudio={handleRecordAudio}
      welcomeMessage="Welcome! This is a demo of the Nexus multimodal chat interface. Try sending a message, uploading a file, or recording audio."
      isLoadingInitial={isInitialLoading}
      className="h-full"
    />
  );
}
