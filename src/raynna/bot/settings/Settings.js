const fs = require("fs");

class Settings {
    constructor() {
        this.savedSettings = this.loadSettings();
    }

    static getInstance() {
        return this;
    }

    async loadSettings() {
        const filePath = './src/raynna/bot/settings/settings.json';

        try {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, '{}', 'utf8');
            }

            const data = fs.readFileSync(filePath, 'utf8');
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error("Error loading settings:", error);
            return {};
        }
    }

    async saveSettings() {
        const filePath = './src/raynna/bot/settings/settings.json';

        try {
            fs.writeFileSync(filePath, JSON.stringify(this.savedSettings, null, 2), 'utf8');
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    }

    async save(twitchId, channel, username) {
        await this.check(twitchId);
        this.savedSettings[twitchId].twitch.channel = channel;
        this.savedSettings[twitchId].twitch.username = username;
        await this.saveSettings();
    }

    async getEsportalName(twitchId) {
        await this.check(twitchId);
        if (!this.savedSettings[twitchId]) {
            return "";
        }
        return this.savedSettings[twitchId].esportal.name;
    }

    async check(twitchId) {
        if (twitchId === -1 || twitchId === undefined) {
            console.log("tried to save a undefined twitchId");
            return;
        }
        this.savedSettings = await this.loadSettings();
        let hasChanges = false;
        if (!this.savedSettings[twitchId]) {
            this.savedSettings[twitchId] = {};
            console.log(`Created new settings for ${twitchId}: ${JSON.stringify(this.savedSettings[twitchId])}`);
            hasChanges = true;
        }
        if (this.savedSettings[twitchId]) {
            if (!this.savedSettings[twitchId].twitch) {
                this.savedSettings[twitchId].twitch = {channel: "", username: ""};
                console.log(`Added twitch settings for ${twitchId}: ${JSON.stringify(this.savedSettings[twitchId].twitch)}`);
                hasChanges = true;
            }
            if (!this.savedSettings[twitchId].esportal) {
                this.savedSettings[twitchId].esportal = {name: "", id: -1};
                console.log(`Added esportal settings for: ${twitchId}: ${JSON.stringify(this.savedSettings[twitchId].esportal)}`);
                hasChanges = true;
            }
            if (!this.savedSettings[twitchId].toggled || !Array.isArray(this.savedSettings[twitchId].toggled)) {
                this.savedSettings[twitchId].toggled = [];
                console.log(`Added toggle settings for: ${twitchId}: ${JSON.stringify(this.savedSettings[twitchId].toggled)}`);
                hasChanges = true;
            }
            if (!this.savedSettings[twitchId].font) {
                this.savedSettings[twitchId].font = "bold";
                console.log(`Added font settings for: ${twitchId}: ${JSON.stringify(this.savedSettings[twitchId].font)}`);
                hasChanges = true;
            }
            if (this.savedSettings[twitchId].toggled && !Array.isArray(this.savedSettings[twitchId].toggled)) {
                this.savedSettings[twitchId].toggled = [];
                console.log(`Tranformed toggle settings for: ${twitchId} to array: ${JSON.stringify(this.savedSettings[twitchId].toggled)}`);
                hasChanges = true;
            }
            if (hasChanges) {
                await this.saveSettings();
                this.savedSettings = await this.loadSettings();
                console.log(`Settings after save for twitch user ${twitchId}: ${JSON.stringify(this.savedSettings[twitchId])}`);
            }
        }
    }

    async saveEsportal(twitchId, esportalName, esportalId) {
        await this.check(twitchId);
        this.savedSettings[twitchId].esportal = {id: esportalId, name: esportalName};
        await this.saveSettings();
    }

    async toggle(twitchId, command, triggers) {
        await this.check(twitchId);
        const index = this.savedSettings[twitchId].toggled.indexOf(command);
        const disable = (index === -1);
        const triggerList = `${triggers.length > 1 ? 's' : ''} [${triggers.map(trigger => `!${trigger}`).join(', ')}] has been ${disable ? `DISABLED` : `ENABLED`} from ${this.savedSettings[twitchId].twitch.channel} chat.`;
        if (disable) {
            this.savedSettings[twitchId].toggled.push(command);
        } else {
            this.savedSettings[twitchId].toggled.splice(index, 1);
        }
        const result = `Command${triggerList}`;
        await this.saveSettings();
        return result;
    }
}

module.exports = Settings;