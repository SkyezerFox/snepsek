import { Emoji, Message, PossiblyUncachedMessage } from 'eris';
import { EventEmitter } from 'events';

import { Context } from '../../commands/Context';
import { EmbedPage } from './EmbedPage';

export interface PagedEmbedOptions {
  expireAfter: number;
  expiryMessage: string;
}

export declare interface PagedEmbed extends EventEmitter {
  on(eventName: 'reactionAdd', listener: (reaction: Emoji) => any): this;
  on(eventName: 'reaction', listener: (reaction: Emoji) => any): this;

  on<T extends string>(
    eventName: T,
    listener: (reaction: Emoji & { name: T }, removed: boolean) => any
  ): this;
}

/**
 * Represents a pageable embed.
 */
export class PagedEmbed extends EventEmitter {
  public readonly pages: EmbedPage[] = [];

  public currentPageIndex = 0;
  public currentPage = new EmbedPage()
    .setTitle('Paged Embed')
    .setDescription('Add pages to make this work!');

  public message?: Message;
  public destroyed = false;

  public expireTimeout?: NodeJS.Timeout;

  constructor(
    public readonly context: Context,
    public readonly options: PagedEmbedOptions
  ) {
    super();
    this._registerEventListeners();

    if (this.options.expireAfter > 0) {
      this.expireTimeout = setTimeout(
        () => this.destroy(this.options.expiryMessage || 'Timed out.'),
        this.options.expireAfter
      );
    }
  }

  /**
   * A boolean determining whether the PagedEmbed has been initialized.
   */
  get initialized() {
    return this.message ? true : false;
  }

  /**
   * Initialize the PagedEmbed.
   */
  async init() {
    this.currentPage = this.pages[0] || this.currentPage;

    this.message = await this.context.channel.createMessage({
      embed: this.currentPage._apiTransform(),
    });

    return this;
  }

  /**
   * Destroy the PagedEmbed and unregister all event listeners.
   */
  async destroy(content?: string) {
    if (this.message) {
      if (content) {
        await this.message.removeReactions();
        this.message.edit({ embed: {}, content });
      } else {
        await this.message.delete();
      }
    }

    this._unregisterEventListeners();
    this.removeAllListeners();
    this.destroyed = true;
  }

  /**
   * Add the default reaction controls to the embed.
   */
  async addDefaultControls() {
    if (!this.message || this.destroyed) {
      return this;
    }

    await this.message.addReaction('⬅️');
    await this.message.addReaction('➡️');
    await this.message.addReaction('❌');

    this.on('⬅️', () => this.previousPage())
      .on('➡️', () => this.nextPage())
      .on('❌', () => this.destroy('✅ Menu closed.'));

    return this;
  }

  /**
   * Add pages to the embed.
   * @param pages
   */
  addPages(...pages: EmbedPage[]): this {
    this.pages.push(...pages);
    if (!this.currentPage) {
      this.currentPage = this.pages[0];
    }
    return this;
  }

  /**
   * Move the pageable embed to the next page.
   *
   * This does not wait for the message's embed to be updated.
   */
  nextPage(): this {
    console.log(this.currentPageIndex);
    this.currentPageIndex = (this.currentPageIndex + 1) % this.pages.length;
    this.refresh();
    return this;
  }

  /**
   * Move the pageable embed to the previous page.
   */
  previousPage() {
    this.currentPageIndex =
      this.currentPageIndex - 1 === -1
        ? this.pages.length - 1
        : this.currentPageIndex - 1;
    this.refresh();
    return this;
  }

  /**
   * Change the pageable embed to show the target page.
   */
  changePage(pageNumber: number) {
    this.currentPageIndex = pageNumber;
  }

  /**
   * Refresh the paged embed, editing the message to be the current page.
   */
  public async refresh(): Promise<this> {
    if (!this.message || this.destroyed) {
      return this;
    }
    this.currentPage = this.pages[this.currentPageIndex];

    try {
      await this.message.edit({
        embed: this.currentPage._apiTransform(),
      });
    } catch (err) {
      this.context.logger.error(
        `Error in PagedEmbed created by context '${this.context.command.name}:${this.context.message.id}'`
      );
    } finally {
      return this;
    }
  }

  /**
   * Client listeners.
   */
  private _listeners: [string, (...args: any[]) => any][] = [
    [
      'messageDelete',
      (msg: PossiblyUncachedMessage) => this._handleMessageDelete(msg),
    ],
    [
      'messageReactionAdd',
      (m: PossiblyUncachedMessage, r: Emoji, u: string) =>
        this._handleReaction(m, r, u),
    ],
    [
      'messageReactionRemove',
      (m: PossiblyUncachedMessage, r: Emoji, u: string) =>
        this._handleReaction(m, r, u, true),
    ],
  ];

  /**
   * Register the event listeners needed for the PagedEmbed to function correctly.
   */
  private _registerEventListeners() {
    for (const listener of this._listeners) {
      this.context.client.on(listener[0], listener[1]);
    }
  }

  /**
   * Unregister client event listeners.
   */
  private _unregisterEventListeners() {
    for (const listener of this._listeners) {
      this.context.client.off(listener[0], listener[1]);
    }
  }

  /**
   * Handle a message reaction - only accepts from the context dispatcher.
   * @param msg
   * @param reaction
   * @param userId
   * @param removed
   */
  private _handleReaction(
    msg: PossiblyUncachedMessage,
    reaction: Emoji,
    userId: string,
    removed = false
  ) {
    if (
      !this.message ||
      msg.id != this.message.id ||
      this.context.dispatcher.id != userId
    ) {
      return;
    }

    this.emit(removed ? 'reactionAdd' : 'reactionRemove', reaction);
    this.emit(reaction.name, removed);
  }

  /**
   * Handle the deletion of the PagedEmbed message.
   * @param msg
   */
  private _handleMessageDelete(msg: PossiblyUncachedMessage) {
    if (this.message && msg.id === this.message.id) {
      this.message = undefined;
      return this.destroy();
    }
  }
}
