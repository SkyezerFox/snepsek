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
	/**
	 * How many times the task has run.
	 */
	get loop() {
		return this._loop;
	}

	private _loop = 0;

	private timer?: NodeJS.Timeout;

	constructor(
		readonly module: Module,
		readonly taskName: string,
		readonly handler: () => void | Promise<void>,
		readonly options: Partial<ModuleTaskOptions> = DEFAULT_TASK_OPTIONS
	) {
		this.options = { ...DEFAULT_TASK_OPTIONS, ...options };
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
				() => this.trigger(),
				this.options.runEvery
			);
		}

		// Run the trigger for the first time.
		return await this.trigger();
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
			this.module.logger.error('Error in task', this.taskName);
			this.module.logger.error(err);
		}

		this._loop++;

		if (this._loop === this.options.runFor && this.timer) {
			clearInterval(this.timer);
		}
	}

	/**
	 * Sets the maximum loop count for the task.
	 * @param count
	 */
	setMaxLoopCount(count: number) {
		this.options.runFor = count;
	}

	/**
	 * Set the current loop number.
	 * @param i
	 */
	setLoop(i: number) {
		this._loop = i;
		return this;
	}

	/**
	 * Set the interval of the loop.
	 * @param interval
	 */
	setLoopInterval(interval: number) {
		this.options.runEvery = interval;
		return this;
	}
}
