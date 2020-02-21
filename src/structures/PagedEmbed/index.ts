import { Emoji, Message, PossiblyUncachedMessage } from 'eris';

import { Context } from '../../commands/Context';
import { EmbedPage } from './EmbedPage';

/**
 * Represents a pageable embed.
 */
export class PagedEmbed {
	public readonly pages: EmbedPage[] = [];

	public currentPageIndex = 0;
	public currentPage = new EmbedPage()
		.setTitle('Paged Embed')
		.setDescription('Add pages to make this work!');

	public message?: Message;

	constructor(public readonly context: Context) {
		this.context.client.on('messageReactionAdd', (m, r) =>
			this._handle(m, r)
		);
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
	 * Handle a message reaction.
	 * @param msg
	 * @param reaction
	 */
	private _handle(msg: PossiblyUncachedMessage, reaction: Emoji) {
		if (msg.id != this.context.message.id) {
			return;
		}
	}

	/**
	 * Refresh the paged embed, editing the message to be the current page.
	 */
	public async refresh(): Promise<this> {
		if (!this.message) {
			return this;
		}
		this.currentPage = this.pages[this.currentPageIndex];

		try {
			await this.message.edit({
				embed: this.currentPage._apiTransform(),
			});
		} catch (err) {
		} finally {
			return this;
		}
	}
}
