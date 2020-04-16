import { Message, MessageContent, MessageFile } from 'eris';

import { Client } from '../Client';
import { PagedEmbed, PagedEmbedOptions } from '../structures/PagedEmbed';
import { EmbedPage } from '../structures/PagedEmbed/EmbedPage';
import { ChannelTypes } from '../types/Discord';
import { createLogger, Logger } from '../utils';
import { Command } from './Command';

/**
 * Wrapper class for the context in which a command is executed.
 */
export class Context {
  /**
   * The user who ran the command.
   */
  readonly dispatcher = this.message.author;

  /**
   * The dispatcher's member object if the command was run in a guild.
   */
  readonly member = this.message.member;

  /**
   * The channel in which the command was run.
   */
  readonly channel = this.message.channel;

  /**
   * Short-cut access to the client's logger.
   */
  readonly logger: Logger;

  /**
   * The paged embed attached to this context, if there is one.
   */
  public pagedEmbed?: PagedEmbed;

  constructor(
    readonly client: Client,
    readonly message: Message,
    readonly command: Command
  ) {
    this.logger = createLogger('Command-' + command.name);
  }

  /**
   * The guild in which the command was executed.
   */
  get guild() {
    return this.message.member ? this.message.member.guild : undefined;
  }

  /**
   * Whether or not the command was executed in a DM channel.
   */
  get isDM() {
    return (
      this.message.channel.type === ChannelTypes.DM ||
      this.message.channel.type === ChannelTypes.Group
    );
  }

  /**
   * Reply to the message
   * @param content
   * @param file
   */
  reply(content: MessageContent, file?: MessageFile) {
    if (typeof content === 'string') {
      content = {
        content: `<@${this.message.author.id}>, ${content}`,
      };
    }
    return this.message.channel.createMessage(
      { content: `<@${this.message.author.id}>`, ...content },
      file
    );
  }

  /**
   * Create a paged embed from an array of pages, and attach it to this context.
   * @param pages
   */
  createPagedEmbed(...pages: EmbedPage[]) {
    this.pagedEmbed = new PagedEmbed(this, {
      expireAfter: 0,
      expiryMessage: 'Timed out.',
    }).addPages(...pages);
    return this.pagedEmbed.init();
  }
}
