import { Message } from "eris";

import { Client } from "../Client";
import { fetchGuildId } from "../utils/eris";
import { Command } from "./Command";
import { Context } from "./Context";

/**
 * Represents the command registry
 */
export class CommandRegistry {
    private commands = new Map<number, Command>();
    private aliases = new Map<string, Command>();

    private nextCommandId = 0;

    constructor(readonly client: Client) {
        this._registerEventListeners();
    }

    /**
     * Register a command.
     * @param commands
     */
    registerCommand(...commands: Command[]) {
        for (const command of commands) {
            this.commands.set(this.nextCommandId, command);
            this.aliases.set(command.name, command);

            command.options.aliases.forEach((v) =>
                this.registerCommandAlias(command, v)
            );

            this.nextCommandId++;
        }
    }

    /**
     * Dynamically register a command alias.
     * @param command
     * @param alias
     */
    registerCommandAlias(command: Command, alias: string) {
        if (this.aliases.get(alias)) {
            this.client.logger.warn(
                `Attempting to register the duped alias '${alias}' - prepare for side effects!`
            );
        }
        this.aliases.set(alias, command);
    }

    /**
     * Dynamically unregister a command alias.
     * @param alias
     */
    unregisterCommandAlias(alias: string) {
        return this.aliases.delete(alias);
    }

    /**
     * Attempts to extract a command from an Eris message.
     */
    async findCommandFromMessage(
        message: Message
    ): Promise<undefined | Command> {
        const guildId = message.member ? message.member.guild.id : undefined;

        if (!guildId) {
            return;
        }

        const prefix = await this.client.provider.getPrefix(guildId);

        const args = message.content.slice(prefix.length).trim().split(" ");

        const cmd = this.aliases.get(args[0]);

        if (cmd) {
            return cmd;
        }
    }

    /**
     * Register the registry's listeners.
     */
    private _registerEventListeners() {
        this.client
            .on("moduleAdd", (m) => {
                this.registerCommand(...Array.from(m.getCommands().values()));
            })
            .on("commandAdd", (c) => this.registerCommand(c))
            .on("messageCreate", (message) => this._handleMessage(message));
    }

    /**
     * Handle a message that might contain a command.
     * @param message
     */
    private async _handleMessage(message: Message) {
        if (!fetchGuildId(message)) {
            return;
        }

        const cmd = await this.findCommandFromMessage(message);

        if (!cmd) {
            return;
        }

        await cmd.execute(new Context(this.client, message, cmd));
    }
}
