import { v4 as uuidv4 } from 'uuid';
import type { MCPSlackIntegration, SlackMessageRequest, SlackMessageResult, SlackIncomingMessage } from '../types';
import { MCPServerManager } from './manager';

/**
 * Event emitted by the Slack manager
 */
export type SlackManagerEvent = 
  | { type: 'incoming_message'; message: SlackIncomingMessage }
  | { type: 'error'; error: any; source: string };

/**
 * Manages Slack integrations through MCP servers
 */
export class SlackManager {
  private serverManager: MCPServerManager;
  private eventHandlers: ((event: SlackManagerEvent) => void)[] = [];

  constructor(serverManager: MCPServerManager) {
    this.serverManager = serverManager;

    // Set up listener for incoming Slack messages
    this.serverManager.addEventListener((event) => {
      if (event.type === 'slack_incoming_message') {
        this.notifyEventHandlers({
          type: 'incoming_message',
          message: event.message,
        });
      }
    });
  }

  /**
   * Add an event handler
   */
  addEventHandler(handler: (event: SlackManagerEvent) => void): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Notify all event handlers
   */
  private notifyEventHandlers(event: SlackManagerEvent) {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in Slack event handler:', error);
      }
    });
  }

  /**
   * Get all Slack integrations
   */
  getSlackIntegrations(): MCPSlackIntegration[] {
    return Array.from(this.serverManager.getAllCapabilities())
      .filter((capability): capability is MCPSlackIntegration => capability.type === 'slack');
  }

  /**
   * Get a specific Slack integration
   */
  getSlackIntegration(integrationId: string): MCPSlackIntegration | undefined {
    return this.getSlackIntegrations().find(integration => integration.id === integrationId);
  }

  /**
   * Send a message to Slack
   */
  async sendMessage(request: SlackMessageRequest): Promise<SlackMessageResult> {
    const integration = this.getSlackIntegration(request.integrationId);
    if (!integration) {
      return {
        success: false,
        error: {
          code: 'integration_not_found',
          message: `Slack integration with ID ${request.integrationId} not found`,
        },
      };
    }

    const server = this.serverManager.getServer(integration.serverId);
    if (!server) {
      return {
        success: false,
        error: {
          code: 'server_not_found',
          message: `Server with ID ${integration.serverId} not found`,
        },
      };
    }

    const requestId = uuidv4();

    try {
      const result = await this.serverManager.executeTool<SlackMessageResult>(
        'slack_send_message',
        {
          integrationId: request.integrationId,
          request,
        }
      );

      return result || {
        success: false,
        error: {
          code: 'send_failed',
          message: 'Failed to send Slack message',
        },
      };
    } catch (error) {
      console.error('Error sending Slack message:', error);
      this.notifyEventHandlers({
        type: 'error',
        error,
        source: 'send_message',
      });

      return {
        success: false,
        error: {
          code: 'send_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
      };
    }
  }

  /**
   * Get channels for a Slack integration
   */
  getChannels(integrationId: string): Array<{ id: string; name: string; isPrivate: boolean }> {
    const integration = this.getSlackIntegration(integrationId);
    return integration?.channels || [];
  }
}