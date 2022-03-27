"use strict";
module.exports = {
    name: 'set',
    alias: ['set', 'config', 'cfg'],
    args: true,
    adminOnly: true,
    GcOnly: true,
    usage: '[ prefix | botname | response | apikey | cooldown ] <value>',
    description: 'Set the value of a config option.\n' +
        'Usage: `!set [option] [value]`\n\n' +
        'Available options:\n' +
        'prefix: The prefix for the bot.\n' +
        '\tExample: `!set prefix !`\n' +
        'botname: The name of the bot.\n' +
        '\tExample: `!set botname MyBot`\n' +
        'response: The response for the bot.\n' +
        '\tExample: `!set response Hello World`\n' +
        'apikey: The api key for the weather api.\n' +
        '\tExample: `!set apikey 1234567890`\n' +
        'cooldown: The cooldown multiplier. (x * 1000 ms)\n' +
        '\tExample: `!set cooldown 2`\n' +
        'gc_lock: Whether or not the bot should lock the group chat.\n' +
        '\tExample: `!set gc_lock true`\n' +
        '\tExample: `!set gc_lock false`',
    info: "Set bot's settings.",
    cooldown: true,
    execute: function (api, message, args, config, utils) {
        let key = args[0];
        let value = args.slice(1).join(' ');
        if (key === 'prefix')
            key = 'prefix';
        if (key === 'botname')
            key = 'bot_name';
        if (key === 'response')
            key = 'response';
        if (key === 'apikey')
            key = 'w_api_key';
        if (key === 'cooldown') {
            if (isNaN(value)) {
                api.sendMessage('Cooldown must be a number.', message.threadID);
                return;
            }
            if (value < 0) {
                api.sendMessage('Cooldown must be a positive number.', message.threadID);
                return;
            }
            if (value > 3600) {
                api.sendMessage('Cooldown must be less than 3600.', message.threadID);
                return;
            }
            key = 'cooldown';
            value = parseInt(value);
        }
        if (key === 'threadid') {
            if (isNaN(value)) {
                return api.sendMessage('Thread ID must be a number.', message.threadID);
            }
            key = 'thread_id';
        }
        if (key === 'gclock') {
            if (value === 'true') {
                api.setMessageReaction('🔒', message.messageID);
                value = true;
            }
            else if (value === 'false') {
                api.setMessageReaction('🔓', message.messageID);
                value = false;
            }
            else {
                return api.sendMessage('Value must be true or false.', message.threadID);
            }
            key = 'gc_lock';
        }
        config[key] = value;
        utils.writeToConfig(config, () => {
            utils.successReact(api, message.messageID);
            api.sendMessage(`Setting ${key} to ${value}`, message.threadID);
        });
    },
};