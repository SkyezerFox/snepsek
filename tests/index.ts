import { Client, Command, Module } from '../src';

class TestModule extends Module {
	public runResult = Date.now();

	moduleWillInit() {
		this.logger.info('Initializing');

		this.addCommand(
			new Command('uwu', async (ctx) => {
				ctx.reply('uwu');
			})
		);
	}

	moduleDidInit() {
		this.logger.info('done');
	}
}

const client = new Client();
client.addModule(TestModule);
client.connect('');
