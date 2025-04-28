"use client";

import { useState, useCallback, useEffect } from 'react';
import { SlackManager, SlackManagerEvent } from '../server/slack-manager';
import { MCPSlackIntegration, SlackMessageRequest, SlackMessageResult, SlackIncomingMessage } from '../types';
import { getMCPServerManager } from '../server/manager';

/**
 * React hook for using the Slack manager
 */
export function useSlack() {
  const [slackManager] = useState(() => new SlackManager(getMCPServerManager()));
  const [integrations, setIntegrations] = useState<MCPSlackIntegration[]>(
    slackManager.getSlackIntegrations()
  );
  const [messages, setMessages] = useState<SlackIncomingMessage[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Listen for Slack events
  useEffect(() => {
    const handleEvent = (event: SlackManagerEvent) => {
      if (event.type === 'incoming_message') {
        setMessages(prevMessages => [event.message, ...prevMessages]);
      }
    };

    const unsubscribe = slackManager.addEventHandler(handleEvent);
    return unsubscribe;
  }, [slackManager]);

  // Update integrations when capabilities change
  useEffect(() => {
    const serverManager = getMCPServerManager();
    
    const handleEvent = (event: any) => {
      if (event.type === 'capabilities_update') {
        setIntegrations(slackManager.getSlackIntegrations());
      }
    };

    serverManager.addEventListener(handleEvent);
    return () => {
      serverManager.removeEventListener(handleEvent);
    };
  }, [slackManager]);

  /**
   * Send a message to Slack
   */
  const sendMessage = useCallback(
    async (request: SlackMessageRequest): Promise<SlackMessageResult> => {
      try {
        setIsSending(true);
        return await slackManager.sendMessage(request);
      } finally {
        setIsSending(false);
      }
    },
    [slackManager]
  );

  /**
   * Send a simple text message to a Slack channel
   */
  const sendTextMessage = useCallback(
    async (integrationId: string, channelId: string, text: string): Promise<SlackMessageResult> => {
      return sendMessage({
        integrationId,
        channelId,
        message: text,
      });
    },
    [sendMessage]
  );

  return {
    integrations,
    messages,
    isSending,
    sendMessage,
    sendTextMessage,
    getIntegration: useCallback(
      (id: string) => slackManager.getSlackIntegration(id),
      [slackManager]
    ),
    getChannels: useCallback(
      (integrationId: string) => slackManager.getChannels(integrationId),
      [slackManager]
    ),
  };
}