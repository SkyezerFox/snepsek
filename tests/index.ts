import { Client, Module } from '../src';

class TestModule extends Module {
	public runResult = Date.now();

	moduleWillInit() {
		this.logger.info('Initializing');
	}
	moduleDidInit() {
		this.logger.info('done');
	}

	@Module.task({ runEvery: 1e3, offset: 1e3, runFor: 3 })
	async testTask() {
		this.logger.debug('task test: ', Date.now() - this.runResult);
		this.runResult = Date.now();
	}
}

const client = new Client();
client.addModule(TestModule);
client.connect('');
