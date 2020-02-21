import { Embed } from 'eris';

type EmbedType = 'image' | 'video' | 'gifv' | 'link' | 'rich';
type EmbedWithType = Embed & { type: EmbedType };

/**
 * @typedef {Object} EmbedField
 * @property {string} name The name of this field
 * @property {string} value The value of this field
 * @property {boolean} inline If this field will be displayed inline
 */
interface EmbedField {
	name: string;
	value: string;
	inline: boolean;
}

interface EmbedImageItem {
	url: string;
	proxyURL: string;
	height: number;
	width: number;
}

interface EmbedFooter {
	text: string;
	iconURL?: string;
	proxyIconURL?: string;
}

/**
 * Represents an embed in a message (image/video preview, rich embed, etc.)
 *
 * This class is a direct copy of the Discord.JS `MessageEmbed` class.
 */
export class MessageEmbed {
	/**
	 * The type of this embed, either:
	 * * `image` - an image embed
	 * * `video` - a video embed
	 * * `gifv` - a gifv embed
	 * * `link` - a link embed
	 * * `rich` - a rich embed
	 * @type {string}
	 */
	public type: EmbedType;

	/**
	 * The title of this embed
	 * @type {?string}
	 */
	public title?: string;

	/**
	 * The description of this embed
	 * @type {?string}
	 */
	public description?: string;

	/**
	 * The URL of this embed
	 * @type {?string}
	 */
	public url?: string;

	/**
	 * The color of this embed
	 * @type {?number}
	 */
	public color?: number;

	/**
	 * The timestamp of this embed
	 * @type {?number}
	 */
	public timestamp?: number;

	/**
	 * The fields of this embed
	 * @type {EmbedField[]}
	 */
	public fields: EmbedField[] = [];

	/**
	 * The thumbnail of this embed (if there is one)
	 * @type {?Object}
	 * @property {string} url URL for this thumbnail
	 * @property {string} proxyURL ProxyURL for this thumbnail
	 * @property {number} height Height of this thumbnail
	 * @property {number} width Width of this thumbnail
	 */
	public thumbnail?: Partial<EmbedImageItem>;

	/**
	 * The image of this embed, if there is one
	 * @type {?Object}
	 * @property {string} url URL for this image
	 * @property {string} proxyURL ProxyURL for this image
	 * @property {number} height Height of this image
	 * @property {number} width Width of this image
	 */
	public image?: Partial<EmbedImageItem>;

	/**
	 * The video of this embed (if there is one)
	 * @type {?Object}
	 * @property {string} url URL of this video
	 * @property {string} proxyURL ProxyURL for this video
	 * @property {number} height Height of this video
	 * @property {number} width Width of this video
	 * @readonly
	 */
	public video?: Partial<EmbedImageItem>;

	/**
	 * The author of this embed (if there is one)
	 * @type {?Object}
	 * @property {string} name The name of this author
	 * @property {string} url URL of this author
	 * @property {string} iconURL URL of the icon for this author
	 * @property {string} proxyIconURL Proxied URL of the icon for this author
	 */
	public author?: Partial<{
		name: string;
		url: string;
		iconURL: string;
		proxyIconURL: string;
	}>;

	/**
	 * The provider of this embed (if there is one)
	 * @type {?Object}
	 * @property {string} name The name of this provider
	 * @property {string} url URL of this provider
	 */
	public provider?: {
		name: string;
		url?: string;
	};

	/**
	 * The footer of this embed
	 * @type {?Object}
	 * @property {string} text The text of this footer
	 * @property {string} iconURL URL of the icon for this footer
	 * @property {string} proxyIconURL Proxied URL of the icon for this footer
	 */
	public footer?: EmbedFooter;

	constructor(data: EmbedWithType = { type: 'rich' }) {
		this.type = data.type;
		this.title = data.title;
		this.description = data.description;
		this.url = data.url;
		this.color = data.color;

		this.timestamp = data.timestamp
			? new Date(data.timestamp).getTime()
			: undefined;

		this.fields = data.fields ? data.fields.map(Object.create) : [];

		this.thumbnail = data.thumbnail
			? {
					url: data.thumbnail.url,
					proxyURL: data.thumbnail.proxy_url,
					height: data.thumbnail.height,
					width: data.thumbnail.width,
			  }
			: undefined;

		this.image = data.image
			? {
					url: data.image.url,
					proxyURL: data.image.proxy_url,
					height: data.image.height,
					width: data.image.width,
			  }
			: undefined;

		this.video = data.video
			? {
					url: data.video.url,
					height: data.video.height,
					width: data.video.width,
			  }
			: undefined;

		this.author = data.author
			? {
					name: data.author.name,
					url: data.author.url,
					iconURL: data.author.icon_url || data.author.icon_url,
					proxyIconURL:
						data.author.proxy_icon_url ||
						data.author.proxy_icon_url,
			  }
			: undefined;

		this.provider = data.provider;

		this.footer = data.footer
			? {
					text: data.footer.text,
					iconURL: data.footer.icon_url,
					proxyIconURL: data.footer.proxy_icon_url,
			  }
			: undefined;
	}

	/**
	 * The date this embed was created at
	 * @type {?Date}
	 * @readonly
	 */
	get createdAt() {
		return this.timestamp ? new Date(this.timestamp) : null;
	}

	/**
	 * The hexadecimal version of the embed color, with a leading hash
	 * @type {?string}
	 * @readonly
	 */
	get hexColor() {
		return this.color
			? `#${this.color.toString(16).padStart(6, '0')}`
			: null;
	}

	/**
	 * The accumulated length for the embed title, description, fields and footer text
	 * @type {number}
	 * @readonly
	 */
	get length() {
		return (
			(this.title ? this.title.length : 0) +
			(this.description ? this.description.length : 0) +
			(this.fields.length >= 1
				? this.fields.reduce(
						(prev, curr) =>
							prev + curr.name.length + curr.value.length,
						0
				  )
				: 0) +
			(this.footer ? this.footer.text.length : 0)
		);
	}

	/**
	 * Adds a field to the embed (max 25).
	 * @param {StringResolvable} name The name of the field
	 * @param {StringResolvable} value The value of the field
	 * @param {boolean} [inline=false] Set the field to display inline
	 * @returns {MessageEmbed}
	 */
	addField(name: string, value: string, inline = false): this {
		this.fields.push({ name, value, inline });
		return this;
	}

	/**
	 * Convenience function for `<MessageEmbed>.addField('\u200B', '\u200B', inline)`.
	 * @param {boolean} [inline=false] Set the field to display inline
	 * @returns {MessageEmbed}
	 */
	addBlankField(inline?: true): this {
		return this.addField('\u200B', '\u200B', inline);
	}

	/**
	 * Removes, replaces, and inserts fields in the embed (max 25).
	 * @param {number} index The index to start at
	 * @param {number} deleteCount The number of fields to remove
	 * @param {StringResolvable} [name] The name of the field
	 * @param {StringResolvable} [value] The value of the field
	 * @param {boolean} [inline=false] Set the field to display inline
	 * @returns {MessageEmbed}
	 */
	spliceField(
		index: number,
		deleteCount: number,
		name?: string,
		value?: string,
		inline = false
	): this {
		if (name && value) {
			this.fields.splice(index, deleteCount, { name, value, inline });
		} else {
			this.fields.splice(index, deleteCount);
		}
		return this;
	}

	/**
	 * Sets the author of this embed.
	 * @param {StringResolvable} name The name of the author
	 * @param {string} [iconURL] The icon URL of the author
	 * @param {string} [url] The URL of the author
	 * @returns {MessageEmbed}
	 */
	setAuthor(name: string, iconURL?: string, url?: string): this {
		this.author = { name, iconURL, url };
		return this;
	}

	/**
	 * Sets the color of this embed.
	 * @param {ColorResolvable} color The color of the embed
	 * @returns {MessageEmbed}
	 */
	setColor(color: number | string): this {
		this.color =
			typeof color === 'string'
				? parseInt(color.toString().replace(/[#]/g, ''), 16)
				: color;
		return this;
	}

	/**
	 * Sets the description of this embed.
	 * @param {StringResolvable} description The description
	 * @returns {MessageEmbed}
	 */
	setDescription(description: string): this {
		this.description = description;
		return this;
	}

	/**
	 * Sets the footer of this embed.
	 * @param {StringResolvable} text The text of the footer
	 * @param {string} [iconURL] The icon URL of the footer
	 * @returns {MessageEmbed}
	 */
	setFooter(text: string, iconURL?: string) {
		this.footer = { text, iconURL };
		return this;
	}

	/**
	 * Sets the image of this embed.
	 * @param {string} url The URL of the image
	 * @returns {MessageEmbed}
	 */
	setImage(url: string): this {
		this.image = { url };
		return this;
	}

	/**
	 * Sets the thumbnail of this embed.
	 * @param {string} url The URL of the thumbnail
	 * @returns {MessageEmbed}
	 */
	setThumbnail(url: string): this {
		this.thumbnail = { url };
		return this;
	}

	/**
	 * Sets the timestamp of this embed.
	 * @param {Date|number} [timestamp=Date.now()] The timestamp or date
	 * @returns {MessageEmbed}
	 */
	setTimestamp(timestamp: Date | number = Date.now()): this {
		this.timestamp =
			timestamp instanceof Date ? timestamp.getTime() : timestamp;
		return this;
	}

	/**
	 * Sets the title of this embed.
	 * @param {StringResolvable} title The title
	 * @returns {MessageEmbed}
	 */
	setTitle(title: string): this {
		this.title = title;
		return this;
	}

	/**
	 * Sets the URL of this embed.
	 * @param {string} url The URL
	 * @returns {MessageEmbed}
	 */
	setURL(url: string): this {
		this.url = url;
		return this;
	}

	/**
	 * Transforms the embed object to be processed.
	 * @returns {Object} The raw data of this embed
	 * @private
	 */
	_apiTransform(): Embed {
		return {
			title: this.title,
			type: 'rich',
			description: this.description,
			url: this.url,
			timestamp: this.timestamp ? new Date(this.timestamp) : undefined,
			color: this.color,
			fields: this.fields,
			thumbnail: this.thumbnail,
			image: this.image,
			author: this.author
				? {
						name: this.author.name || '',
						url: this.author.url,
						icon_url: this.author.iconURL,
				  }
				: undefined,
			footer: this.footer
				? {
						text: this.footer.text,
						icon_url: this.footer.iconURL,
				  }
				: undefined,
		};
	}
}
