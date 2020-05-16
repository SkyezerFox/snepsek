import "reflect-metadata";

export { Client } from "./Client";

export {
    Command,
    createInhibitingDecorator,
    dmOnly,
    guildOnly,
} from "./commands/Command";
export { Context } from "./commands/Context";

export { Module, command, disabled, task } from "./modules";

export { MemoryProvider } from "./providers/MemoryProvider";
export { GuildSettings } from "./providers/SettingsProvider";
