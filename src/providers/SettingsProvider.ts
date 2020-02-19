import { Guild, Member, Role, User } from 'eris';

import { Client } from '../Client';

export type GuildResolvable = string | Guild;

/**
 * GuildSettings
 *
 * The object used by the SettingsProvider to represent guilds
 *
 * @typedef {Object} GuildSettings
 * @property {string} prefix - The prefix of the guild
 * @property {Object} rolePermissions - An ID object map of permission levels for roles
 * @property {Object} userPermissions - An ID object map of permission levels for users
 */
export interface GuildSettings {
	prefix: string;

	rolePermissions: { [x: string]: number };
	userPermissions: { [x: string]: number };
}

/**
 * Default guild settings
 * @constant {GuildSettings}
 */
export const DEFAULT_GUILD_SETTINGS: GuildSettings = {
	prefix: '!',

	rolePermissions: {},
	userPermissions: {},
};

/**
 * Class for managing settings
 */
export abstract class SettingsProvider<T extends GuildSettings> {
	constructor(readonly client: Client, readonly defaults: T) {
		this.defaults = { ...DEFAULT_GUILD_SETTINGS, ...defaults };
	}

	/**
	 * Called by the client when loging in
	 */
	public abstract init(): Promise<void> | void;

	/**
	 * Get settings for the given guild id
	 * @param id Guild id
	 */
	public abstract async get(id: string): Promise<T>;

	/**
	 * Get a particular prop of the given settings
	 */
	public async getProp<K extends keyof T>(id: string, key: K): Promise<T[K]> {
		return (await this.get(id))[key];
	}

	/**
	 * Get a guild's prefix
	 * @param id Guild ID
	 */
	public async getPrefix(id: string) {
		return await this.getProp(id, 'prefix');
	}

	/**
	 * Check if a guild member has the given permission level
	 */
	public async hasPermission(member: Member, permLevel: number) {
		this.client.logger.debug(
			`Performing lookup for "${member.id}" in "${member.guild.id}"...`
		);

		return await this.getPermissionWithRequired(member, permLevel);
	}

	/**
	 * Get the permission level of the member
	 * @param member
	 *
	 * @deprecated
	 */
	public async getPermission(member: Member) {
		const rolePermissions = await Promise.all(
			member.roles.map(
				async (v) => await this.getRolePermission(member.guild.id, v)
			)
		);

		return Math.max(
			...rolePermissions,
			await this.getUserPermission(member.guild.id, member.id)
		);
	}

	/**
	 * Get whether the member has permission
	 * @param member
	 * @param requiredPermission
	 */
	public async getPermissionWithRequired(
		member: Member,
		requiredPermission: number
	) {
		for (const role of member.roles) {
			if (
				(await this.getRolePermission(member.guild.id, role)) >=
				requiredPermission
			) {
				return true;
			}
		}

		// Check user
		if (
			(await this.getUserPermission(member.guild.id, member.id)) >=
			requiredPermission
		) {
			return true;
		}
		return false;
	}

	/**
	 * Fetch permission level for given user id in given guild id
	 * @param guild Guild ID
	 * @param userID User ID\
	 */
	public async getUserPermission(
		guild: string,
		userID: string
	): Promise<number> {
		const userPerms = await this.getProp(guild, 'userPermissions');

		if (userPerms[userID]) {
			return userPerms[userID];
		} else {
			return 0;
		}
	}

	/**
	 * Fetch permission level for given role id in given guild id
	 * @param guild Guild ID
	 * @param roleID Role ID
	 */
	public async getRolePermission(guild: string, roleID: string) {
		const rolePerms = await this.getProp(guild, 'rolePermissions');

		if (rolePerms[roleID]) {
			return rolePerms[roleID];
		} else {
			return 0;
		}
	}

	/**
	 * Set new guild settings
	 */
	public abstract async set(id: string, newSettings: T): Promise<void>;

	/**
	 * Set a particular property of the settings
	 * @param id Guild ID
	 * @param key Key of the prop
	 * @param value New value
	 */
	public async setProp<K extends keyof T>(id: string, key: K, value: T[K]) {
		return await this.set(
			id,
			Object.assign(await this.get('id'), { [key]: value })
		);
	}

	public async updateProp<K extends keyof T>(
		id: string,
		key: K,
		newValue: T[K]
	) {
		return await this.setProp(
			id,
			key,
			Object.assign(await this.getProp(id, key), newValue)
		);
	}

	/**
	 * Grant a user the given permission level
	 * @param {string} id The ID of the guild in which to grant permission
	 * @param {string} userID The ID of the user
	 * @param {number} level The permission level to grant
	 */
	public async grantUserPermission(
		id: string,
		userID: string,
		level: number
	) {
		return await this.updateProp(id, 'userPermissions', {
			[userID]: level,
		});
	}

	/**
	 * Grant a role the given permission level
	 * @param {string} id The ID of the guild in which to grant permission
	 * @param {userID} roleID The ID of the role
	 * @param {number} level The permission level to grant
	 */
	public async grantRolePermission(
		id: string,
		roleID: string,
		level: number
	) {
		await this.updateProp(id, 'rolePermissions', {
			[roleID]: level,
		});
	}

	/**
	 * Grant the given user/role the given permission level
	 * @param {Guild} guild The Guild object/ID
	 * @param {Member | RoleResolvable | string} resolvable A snowflake, role or Member
	 * @param {number} level The permisison level to grant
	 */
	public async grantPermission(
		guild: Guild | string,
		resolvable: Member | User | Role | string,
		level: number
	) {
		const guildID = guild instanceof Guild ? guild.id : guild;

		if (resolvable instanceof Member || resolvable instanceof User) {
			return await this.grantUserPermission(
				guildID,
				resolvable.id,
				level
			);
		}
		if (resolvable instanceof Role) {
			return await this.grantRolePermission(
				guildID,
				resolvable.id,
				level
			);
		} else {
			const resolvedGuild = this.client.guilds.get(guildID);
			if (!resolvedGuild) {
				return false;
			}

			const resolvedUser = resolvedGuild.members.get(resolvable),
				resolvedRole = resolvedGuild.roles.get(resolvable);

			if (resolvedUser) {
				return await this.grantUserPermission(
					resolvedGuild.id,
					resolvedUser.id,
					level
				);
			}

			if (resolvedRole) {
				return await this.grantRolePermission(
					resolvedGuild.id,
					resolvedRole.id,
					level
				);
			}

			return false;
		}
	}

	/**
	 * Reaolve a guild.
	 *
	 * @param guildResolvable
	 */
	resolve(guildResolvable: GuildResolvable) {
		if (guildResolvable instanceof Guild) {
			return guildResolvable;
		}
		return this.client.guilds.get(guildResolvable);
	}
}
