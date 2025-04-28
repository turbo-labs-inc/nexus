"use client";

import { SlackChannelView } from "@/components/slack";
import { useSearchParams } from 'next/navigation';

interface SlackChannelPageProps {
  params: {
    id: string;
  };
}

export default function SlackChannelPage({ params }: SlackChannelPageProps) {
  const searchParams = useSearchParams();
  const channelId = searchParams.get('channel');
  
  return (
    <div className="container py-8">
      <SlackChannelView 
        integrationId={params.id}
        channelId={channelId || undefined}
      />
    </div>
  );
}
