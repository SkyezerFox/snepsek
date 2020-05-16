import {
    Command,
    CommandOptions,
    ModuleCommandHandler,
} from "../commands/Command";
import { Module } from "./Module";
import { ModuleTask, ModuleTaskOptions } from "./ModuleTask";

/**
 * Mark a module method as a command.
 * @param commandOpts
 */
export const command = (opts?: CommandOptions) => {
    return (
        module: Module,
        name: string,
        descriptor: TypedPropertyDescriptor<ModuleCommandHandler>
    ) => {
        if (!descriptor.value) {
            return;
        }

        Reflect.defineMetadata(
            "command",
            new Command(name, descriptor.value, {
                module,
                ...opts,
            }),
            module,
            name
        );
    };
};

/**
 * Mark a command as disabled.
 */
export const disabled = (
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
export const task = (opts?: Partial<ModuleTaskOptions>) => {
    return (
        target: Module,
        name: string,
        descriptor: TypedPropertyDescriptor<() => Promise<void>>
    ) => {
        if (!descriptor.value) {
            return;
        }

        Reflect.defineMetadata(
            "task",
            new ModuleTask(target, name, descriptor.value, opts),
            target,
            name
        );
    };
};
