"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Mic, MicOff, Send, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  isDisabled?: boolean;
  initialPrompt?: string;
  placeholder?: string;
  className?: string;
  onRecordAudio?: (audio: Blob) => void;
}

export function ChatInput({
  onSendMessage,
  isDisabled = false,
  initialPrompt = "",
  placeholder = "Type a message...",
  className,
  onRecordAudio,
}: ChatInputProps) {
  const [message, setMessage] = useState(initialPrompt);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasInitialPromptBeenCleared, setHasInitialPromptBeenCleared] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Focus textarea on mount and adjust height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      adjustTextareaHeight();
    }
  }, []);

  // Adjust textarea height when message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Clean up recording timer
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      stopRecording();
    };
  }, []);

  // Helper function to adjust textarea height
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  // Handle textarea input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Clear initial prompt state if this is the first edit
    if (initialPrompt && !hasInitialPromptBeenCleared) {
      setHasInitialPromptBeenCleared(true);
    }
  };

  // Handle enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send message handler
  const handleSendMessage = () => {
    if (isDisabled) return;
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    
    onSendMessage(trimmedMessage, attachments.length > 0 ? attachments : undefined);
    setMessage("");
    setAttachments([]);
    
    // Refocus textarea after sending
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
      
      // Clear input value so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle recording toggle
  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Start audio recording
  const startRecording = async () => {
    if (!onRecordAudio) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        
        if (onRecordAudio && audioBlob.size > 0) {
          onRecordAudio(audioBlob);
        }
        
        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Reset recording state
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className={cn("flex flex-col p-4", className)}>
      {/* Attachments preview - improved mobile layout */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative rounded-md border bg-background px-2 py-1 pr-8 text-xs sm:text-sm"
            >
              <span className="truncate max-w-[100px] sm:max-w-[150px] inline-block">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full hover:bg-muted/80 p-0.5"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sr-only">Remove</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="mb-2 flex items-center gap-2 rounded-md border bg-destructive/10 p-2 text-destructive">
          <div className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-destructive"></span>
          </div>
          <span className="text-sm font-medium">Recording: {formatRecordingTime(recordingTime)}</span>
          <Progress value={Math.min(recordingTime / 90 * 100, 100)} className="flex-1" />
        </div>
      )}

      {/* Input area - improved for mobile */}
      <div className="relative flex items-end gap-1.5">
        <div className="relative flex flex-1 overflow-hidden rounded-md border focus-within:ring-1 focus-within:ring-ring">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isDisabled}
            className={cn(
              "min-h-[40px] w-full resize-none border-0 bg-transparent p-2 sm:p-3 pr-14 outline-none focus-visible:ring-0",
              "max-h-[120px] sm:max-h-[200px] text-sm sm:text-base overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            )}
            rows={1}
          />

          {/* Action buttons inside textarea */}
          <div className="absolute bottom-2 right-3 flex items-center gap-2">
            {/* File upload button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDisabled}
                    className="h-8 w-8 rounded-full bg-transparent hover:bg-muted"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="sr-only">Attach file</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach files</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
            />

            {/* Audio recording button - only show if onRecordAudio is provided */}
            {onRecordAudio && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleRecording}
                      disabled={isDisabled}
                      className={cn(
                        "h-8 w-8 rounded-full bg-transparent hover:bg-muted",
                        isRecording && "text-destructive hover:text-destructive"
                      )}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      <span className="sr-only">
                        {isRecording ? "Stop recording" : "Start recording"}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? "Stop recording" : "Record audio"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Send button */}
        <Button
          type="button"
          onClick={handleSendMessage}
          disabled={isDisabled || (message.trim() === "" && attachments.length === 0)}
          className={cn("h-10 w-10 rounded-full", isDisabled && "opacity-50")}
        >
          {isDisabled ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}