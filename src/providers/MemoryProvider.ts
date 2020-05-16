import { Client } from "../Client";
import {
    DEFAULT_GUILD_SETTINGS,
    GuildResolvable,
    GuildSettings,
    SettingsProvider,
} from "./SettingsProvider";

/**
 * An in-memory settings store.
 */
export class MemoryProvider<T extends GuildSettings> extends SettingsProvider<
    T
> {
    constructor(readonly client: Client) {
        super(client, DEFAULT_GUILD_SETTINGS as T);
    }

    readonly store: Map<string, T> = new Map();

    init() {
        return;
    }

    async get(guild: GuildResolvable) {
        const resolved = this.resolve(guild);
        if (resolved) {
            return this.store.get(resolved.id) || this.defaults;
        }

        return this.defaults as T;
    }

    async set(guild: GuildResolvable, settings: T) {
        const resolved = this.resolve(guild);
        if (resolved) {
            this.store.set(resolved.id, settings);
        }
    }
}
