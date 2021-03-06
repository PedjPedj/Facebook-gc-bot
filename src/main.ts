var inquirer = require('inquirer');
var puppeteer = require('puppeteer');
var utils = require('./utils');
var fse = require('fs-extra');
var path = require('path');

if (!fse.existsSync(utils.config_file)) {
	fse.outputJsonSync(utils.config_file, utils.default_config, { spaces: 4 });
}
if (!fse.existsSync(utils.log_file)) {
	fse.outputJsonSync(utils.log_file, {}, { spaces: 4 });
}
if (!fse.existsSync(utils.pins)) {
	fse.outputJsonSync(utils.pins, {}, { spaces: 4 });
}
if (!fse.existsSync(utils.gInfo)) {
	fse.outputJsonSync(utils.gInfo, {}, { spaces: 4 });
}
if (!fse.existsSync(utils.uInfo)) {
	fse.outputJsonSync(utils.uInfo, {}, { spaces: 4 });
}

fse.ensureDirSync(path.join(__dirname, '..', 'dist', 'data', 'img'));
var config = require('./data/config.json');

async function start() {
	inquirer
		.prompt([
			{
				type: 'list',
				name: 'action',
				message: 'What do you want to do?',
				choices: ['Start', 'Setup FB account', 'Setup Imgflip account', 'Change config', 'exit'],
			},
		])
		.then(async (answers: { action: any }) => {
			switch (answers.action) {
				case 'Start':
					if (!config.thread_id) {
						console.log('Please setup your bot configuration first!');
						return start();
					}
					if (!fse.existsSync(utils.app_State)) {
						console.log('Please setup your Facebook cookies first!');
						return start();
					}
					require('./bot');
					break;

				case 'Setup FB account':
					fbCreds();
					break;

				case 'Setup Imgflip account':
					imgflipCreds();
					break;

				case 'Change config':
					console.log('Hit [Enter] to keep the current value.');
					// require('./inquirer/setupConfig')();
					setupConfig();
					break;

				case 'exit':
					console.log('Bye!');
					process.exit();
					break;

				default:
					console.log('Bye!');
					process.exit();
					break;
			}
		});
}

async function fbCreds() {
	const creds = await inquirer.prompt([
		{
			type: 'input',
			name: 'email',
			message: 'What is your email?',
			validate: function (email: any) {
				var re =
					/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				return re.test(String(email).toLowerCase());
			},
		},
		{
			type: 'password',
			name: 'password',
			message: 'What is your password?',
			mask: '*',
			validate: function (password: any) {
				return password.length > 0;
			},
		},
	]);

	var email = creds.email;
	var password = creds.password;

	console.log('Please wait...');
	try {
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		await page.setDefaultNavigationTimeout(60000);
		await page.goto('https://www.facebook.com/');
		await page.waitForSelector('#email');
		await page.type('#email', email);
		await page.type('#pass', password);
		await page.click('[type="submit"]');
		await page.waitForNavigation();
		let cookies = await page.cookies();
		cookies = cookies.map(({ name: key, ...rest }: { name: any; [x: string]: any }) => ({ key, ...rest }));
		// fse.outputJson(path.join(__dirname, 'data', 'appState.json'), cookies, { spaces: 4 });
		fse.writeFileSync(path.join(__dirname, 'data', 'appState.json'), JSON.stringify(cookies, null, 4));
		browser.close();
		console.log('done');
	} catch (error) {
		console.error(error);
	}
	start();
}

async function imgflipCreds() {
	inquirer
		.prompt([
			{
				type: 'input',
				name: 'username',
				message: 'What is your username?',
				validate: function (value: string | any[]) {
					if (value.length) {
						return true;
					} else {
						return 'Please enter your username';
					}
				},
			},
			{
				type: 'password',
				name: 'password',
				message: 'What is your password?',
				mask: '*',
				validate: function (value: string | any[]) {
					if (value.length) {
						return true;
					} else {
						return 'Please enter your password';
					}
				},
			},
		])
		.then(function (imgFlipCreds: { username: any; password: any }) {
			config.imgflip.username = imgFlipCreds.username;
			config.imgflip.password = imgFlipCreds.password;
			fse.writeFileSync(path.join(__dirname, 'data', 'config.json'), JSON.stringify(config, null, 2));
			console.log('Imgflip credentials updated!');
			start();
		});
}

async function setupConfig() {
	inquirer
		.prompt([
			{
				type: 'input',
				name: 'prefix',
				message: 'What is your prefix?',
				default: config.prefix,
			},
			{
				type: 'input',
				name: 'thread_id',
				message: 'What is your thread id?',
				validate: function (input: any) {
					if (isNaN(input) || input.length < 16) {
						return 'Please enter a valid thread id';
					}
					return true;
				},
				default: config.thread_id,
			},
			{
				type: 'input',
				name: 'bot_name',
				message: 'What is your bot name?',
				validate: function (input: any) {
					if (input.length < 2) {
						return 'Please enter a valid bot name';
					}
					return true;
				},
				default: config.bot_name,
			},
			{
				type: 'input',
				name: 'wolframAlphaAppID',
				message: 'Wolfram Alpha App ID?',
				default: config.wolframAlphaAppID,
			},
			{
				type: 'input',
				name: 'response',
				message: 'What is your bot response?',
				default: config.response,
			},
			{
				type: 'confirm',
				name: 'gc_lock',
				message: 'Do you want to lock the group chat?',
				default: config.gc_lock,
			},
			{
				type: 'input',
				name: 'cooldown',
				message: 'Cooldown multiplier. (x * 1000 ms)',
				validate: function (input: any) {
					if (input.length === 0 || isNaN(input)) {
						return 'Please enter a valid cooldown';
					}
					return true;
				},
				default: config.cooldown,
			},
		])
		.then(
			(answers: {
				prefix: any;
				thread_id: number;
				bot_name: string;
				wolframAlphaAppID: string;
				response: string;
				gc_lock: boolean;
				cooldown: number;
			}) => {
				config.prefix = answers.prefix;
				config.thread_id = answers.thread_id;
				config.bot_name = answers.bot_name;
				config.wolframAlphaAppID = answers.wolframAlphaAppID;
				config.response = answers.response;
				config.gc_lock = answers.gc_lock;
				config.cooldown = answers.cooldown;
				fse.writeFileSync(path.join(__dirname, 'data', 'config.json'), JSON.stringify(config, null, 2));
				console.log('Config updated!');
			}
		)
		.then(() => {
			if (!fse.existsSync(utils.app_State)) {
				inquirer
					.prompt([
						{
							type: 'confirm',
							name: 'askFbCreds',
							message: 'Do you want to setup facebook credentials?',
							default: true,
						},
					])
					.then((answers: { askFbCreds: boolean }) => {
						if (answers.askFbCreds) fbCreds();
						else console.log('Setup complete!');
					});
			}
			start();
		})
		.catch((err: any) => {
			console.log(err);
		});
}

start();
