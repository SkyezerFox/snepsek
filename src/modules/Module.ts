import { Client } from "eris";
import { EventEmitter } from "events";

import {
    Command,
    CommandOptions,
    ModuleCommandHandler,
} from "../commands/Command";
import { createLogger } from "../utils";
import { ModuleTask, ModuleTaskOptions } from "./ModuleTask";

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
     * **It is not necessary to call this function at runtime!** The module itself calls this
     * during when it is constructed.
     */
    getCommands() {
        for (const method of Object.getOwnPropertyNames(
            this.constructor.prototype
        )) {
            const command = Reflect.getMetadata("command", this, method);
            if (command && !this.commands.get(command.name)) {
                command.options.module = this;
                this.commands.set(command.name, command);
            }
        }
        return this.commands;
    }

    /**
     * Dynamically add commands to the module.
     * @param commands
     */
    addCommand(...commands: Command[]) {
        for (const command of commands) {
            this.commands.set(command.name, command);
            command.options.module = this;

            this.client.emit("commandAdd", command);
        }
    }

    /**
     * Fetch the tasks defined on the module using decorators. Calling this method will add
     * tasks defined using the `@task` decorator to the modules `tasks` map.
     *
     * **It is not necessary to call this function at runtime!** The module itself calls this
     * during when it is constructed.
     */
    getTasks() {
        // Prevent parsing meta-data when you don't need to.
        if (this.tasks.size > 0) {
            return this.tasks;
        }

        for (const method of Object.getOwnPropertyNames(
            this.constructor.prototype
        )) {
            const task = Reflect.getMetadata("task", this, method);
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
     * Stop the module's tasks.
     */
    public async stopTasks() {
        this.getTasks().forEach((v) => v.stop());
    }

    /**
     * Stop a specified task.
     * @param name
     */
    public startTask(name: string) {
        const task = this.tasks.get(name);
        if (!task) {
            return false;
        }

        return task.start();
    }

    /**
     * Stop a specified task.
     * @param name
     */
    public stopTask(name: string) {
        const task = this.tasks.get(name);
        if (!task) {
            return false;
        }

        return task.stop();
    }
}
