import type { MCPCapability } from './capability';

/**
 * Interface for Slack integration
 */
export interface MCPSlackIntegration extends MCPCapability {
  type: 'slack';
  workspaceId: string;
  workspaceName: string;
  botName: string;
  channels: Array<{
    id: string;
    name: string;
    isPrivate: boolean;
  }>;
  apiConfig: {
    botToken: string;
    signingSecret: string;
    appId: string;
    clientId?: string;
    clientSecret?: string;
    verificationToken?: string;
  };
  authConfig: {
    scopes: string[];
    redirectUri?: string;
    installationStore?: string;
  };
}

/**
 * Request for sending a message to Slack
 */
export interface SlackMessageRequest {
  integrationId: string;
  channelId: string;
  message: string;
  blocks?: any[];
  threadTs?: string;
  attachments?: any[];
}

/**
 * Response from sending a message to Slack
 */
export interface SlackMessageResult {
  success: boolean;
  ts?: string;
  channelId?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Incoming message from Slack
 */
export interface SlackIncomingMessage {
  type: 'message' | 'mention' | 'direct_message' | 'app_mention';
  user: {
    id: string;
    name: string;
    isBot: boolean;
  };
  channel: {
    id: string;
    name: string;
    isPrivate: boolean;
  };
  text: string;
  ts: string;
  threadTs?: string;
  attachments?: any[];
  blocks?: any[];
  files?: any[];
  event?: any;
}
