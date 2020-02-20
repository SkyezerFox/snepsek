import 'reflect-metadata';

import { Client } from 'eris';
import { EventEmitter } from 'events';

import { Command, CommandOptions, ModuleCommandHandler } from '../commands/Command';
import { createLogger } from '../utils';
import { ModuleTask, ModuleTaskOptions } from './ModuleTask';

export abstract class Module extends EventEmitter {
	readonly commands = new Map<string, Command>();
	readonly tasks = new Map<string, ModuleTask>();
	readonly logger = createLogger(this.constructor.name);

	constructor(readonly client: Client) {
		super();

		this.getCommands();
		this.getTasks();
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
				command.options.module = this;
				this.commands.set(command.name, command);
			}
		}
		return this.commands;
	}

	/**
	 * Fetch the commands defined on the module using decorators. Calling this method will add
	 * commands defined using the `@command` decorator to the modules `commands` map.
	 *
	 * **It is not necessary to call this function at runtime!** The Client object the module is
	 * attatched to calls this during module initialization.
	 */
	getTasks() {
		// Prevent parsing meta-data when you don't need to.
		if (this.tasks.size > 0) {
			return this.tasks;
		}

		for (const method of Object.getOwnPropertyNames(
			this.constructor.prototype
		)) {
			const task = Reflect.getMetadata('task', this, method);
			if (task && !this.tasks.get(task.name)) {
				this.tasks.set(task.name, task);
				task.module = this;
			}
		}
		return this.tasks;
	}

	/**
	 * Start the module's tasks.
	 */
	public async startTasks() {
		const promises: Promise<void>[] = [];
		this.getTasks().forEach((v) => promises.push(v.start()));
		return await Promise.all(promises);
	}

	/**
	 * Mark a module method as a command.
	 * @param commandOpts
	 */
	static command = (opts?: CommandOptions) => {
		return (
			module: Module,
			name: string,
			descriptor: TypedPropertyDescriptor<ModuleCommandHandler>
		) => {
			if (!descriptor.value) {
				return;
			}

			Reflect.defineMetadata(
				'command',
				new Command(name, descriptor.value, { module, ...opts }),
				module,
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

	/**
	 * Mark a module method as a command.
	 * @param commandOpts
	 */
	static task = (opts?: Partial<ModuleTaskOptions>) => {
		return (
			target: Module,
			name: string,
			descriptor: TypedPropertyDescriptor<() => Promise<void>>
		) => {
			if (!descriptor.value) {
				return;
			}

			Reflect.defineMetadata(
				'task',
				new ModuleTask(target, name, descriptor.value, opts),
				target,
				name
			);
		};
	};
}

// Static module exports for ease of access.
export const command = Module.command;
export const disabled = Module.disabled;
export const task = Module.task;
