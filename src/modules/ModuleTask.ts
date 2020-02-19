import { waitFor } from '../utils';
import { Module } from './Module';

export interface ModuleTaskOptions {
	runEvery: number;
	runFor: number;
	offset: number;
}

const DEFAULT_TASK_OPTIONS: ModuleTaskOptions = {
	runEvery: 0,
	runFor: 0,
	offset: 0,
};

/**
 * Represents a task runnable by a module.
 */
export class ModuleTask {
	public runCount = 0;

	private timer?: NodeJS.Timeout;

	constructor(
		readonly module: Module,
		readonly taskName: string,
		readonly handler: () => void | Promise<void>,
		readonly options: Partial<ModuleTaskOptions> = DEFAULT_TASK_OPTIONS
	) {
		this.options = { ...DEFAULT_TASK_OPTIONS, ...options };
		this.handler = this.handler.bind(module);
	}

	/**
	 * Start a task. If the task is asyncrhonous, this will resolve after the first run-through.
	 */
	async start() {
		if (this.options.offset) {
			await waitFor(this.options.offset);
		}

		if (this.options.runEvery) {
			this.timer = setInterval(
				() => this.trigger.apply(this.module),
				this.options.runEvery
			);
		}

		// Run the trigger for the first time.
		return await this.trigger.apply(this.module);
	}

	/**
	 * Stop the task from running. If the task is set to loop, the next trigger will be cancelled.
	 */
	stop() {
		if (this.options.runEvery && this.timer) {
			clearInterval(this.timer);
			return true;
		}
		return false;
	}

	/**
	 * Trigger the task's handler.
	 */
	async trigger() {
		try {
			await this.handler.apply(this.module);
		} catch (err) {
			console.error('Error in task', this.taskName);
			console.error(err);
		}

		this.runCount++;

		if (this.runCount === this.options.runFor && this.timer) {
			clearInterval(this.timer);
		}
	}
}
