import 'reflect-metadata';

import { Client } from 'eris';
import { EventEmitter } from 'events';

import { Command, CommandOptions, ModuleCommandHandler } from './commands/Command';
import { createLogger } from './utils';

type ModuleTask = () => void;
type ModuleGroup = {};

export abstract class Module extends EventEmitter {
	readonly commands = new Map<string, Command>();
	readonly groups = new Map<string, ModuleGroup>();
	readonly tasks = new Map<string, ModuleTask>();
	readonly logger = createLogger(this.constructor.name);

	constructor(readonly client: Client) {
		super();
		this.commands = new Map();
	}

	/**
	 * Called before module initialization. Can be an async function which will be awaited by the client
	 * before it initializes the next module.
	 *
	 * Guaranteed to run before `moduleDidInit`.
	 */
	moduleWillInit(): Promise<void> | void {
		return;
	}

	/**
	 * Called after module initialization. Can be an async function which will be awaited by the client
	 * before it calls the `moduleDidInit` of the next module.
	 */
	moduleDidInit(): Promise<void> | void {
		return;
	}

	/**
	 * Called before the client disconnects from Discord.
	 */
	moduleWillUnload(): Promise<void> | void {
		return;
	}

	/**
	 * Called after the client disconnects from Discord, and before the process terminates.
	 */
	moduleDidUnload(): Promise<void> | void {
		return;
	}

	/**
	 * Return the name of the module - identical to the name of t he module's constructor function.
	 */
	get name() {
		return this.constructor.name;
	}

	/**
	 * Fetch the commands defined on the module using decorators. Calling this method will add
	 * commands defined using the `@command` decorator to the modules `commands` map.
	 *
	 * **It is not necessary to call this function at runtime!** The Client object the module is
	 * attatched to calls this during module initialization.
	 */
	getCommands() {
		for (const method of Object.getOwnPropertyNames(
			this.constructor.prototype
		)) {
			const command = Reflect.getMetadata('command', this, method);
			if (command && !this.commands.get(command.name)) {
				this.commands.set(command.name, command);
			}
		}
		return this.commands;
	}

	/**
	 * Mark a module method as a command.
	 * @param commandOpts
	 */
	static command = (opts?: CommandOptions) => {
		return (
			target: Module,
			name: string,
			descriptor: TypedPropertyDescriptor<ModuleCommandHandler>
		) => {
			if (!descriptor.value) {
				return;
			}

			Reflect.defineMetadata(
				'command',
				new Command(name, descriptor.value, opts),
				target,
				name
			);
		};
	};

	/**
	 * Mark a command as disabled.
	 */
	static disabled = (
		module: new () => Module,
		name: string,
		descriptor: TypedPropertyDescriptor<ModuleCommandHandler>
	) => {
		if (descriptor.value instanceof Command) {
			descriptor.value.disable();
		}
	};
}

// Static module exports for ease of access.
export const command = Module.command;
export const disabled = Module.disabled;

/**
 * Mark a module method as a task.
 * @param commandOpts
 */
export const group = (groupOpts?: {}) => {
	return (
		module: Module,
		name: string,
		descriptor: TypedPropertyDescriptor<ModuleGroup>
	) => {
		module.groups.set(name, {});
	};
};

/**
 * Mark a module method as a task.
 */
export const task = () => {
	return (
		module: Module,
		name: string,
		descriptor: TypedPropertyDescriptor<ModuleTask>
	) => {
		module.tasks.set(name, () => {});
	};
};

/**
 * Mark a module method as a client event.
 */
export const event = (name: string) => {
	return (
		module: Module,
		key: string,
		descriptor: TypedPropertyDescriptor<(...args: any[]) => any>
	) => {
		if (descriptor.value) {
			module.client.on(name, descriptor.value);
		}
	};
};
