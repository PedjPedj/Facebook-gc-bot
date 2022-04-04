var inquirer = require('inquirer');
var fse = require('fs-extra');

(async () => {
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
		.then(function (answers: { username: any; password: any }) {
			var username = answers.username;
			var password = answers.password;
			console.log(username, password);
			require(path.join(__dirname, '../index'));
		});
})();