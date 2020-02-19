import { Member, Message } from 'eris';

/**
 * Fetch a guild ID from a message.
 * @param member
 */
export const fetchGuildId = (message: Message) =>
	message.member ? message.member.guild.id : undefined;
