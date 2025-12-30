import { BasePage } from './base.page';

/**
 * Agent chat page (/agents/:agentId/chat)
 */
export class ChatPage extends BasePage {
  constructor(
    page: ConstructorParameters<typeof BasePage>[0],
    private readonly agentId: string,
  ) {
    super(page);
  }

  private static pathFor(agentId: string): string {
    return `/agents/${agentId}/chat`;
  }

  get path(): string {
    return ChatPage.pathFor(this.agentId);
  }

  static url(agentId: string): string {
    return BasePage.urlFor(ChatPage.pathFor(agentId));
  }

  get pageTitle() {
    return this.mainContent.getByRole('heading', { level: 3 });
  }

  get messageInput() {
    return this.mainContent.getByPlaceholder('Type your message...');
  }

  get sendButton() {
    return this.mainContent
      .locator('button')
      .filter({ has: this.page.locator('.tabler-icon-send') })
      .first();
  }

  get backButton() {
    return this.mainContent
      .locator('a')
      .filter({ has: this.page.locator('.tabler-icon-arrow-left') })
      .first();
  }

  get emptyState() {
    return this.mainContent.getByText('Start a conversation by typing a message below.');
  }
}
