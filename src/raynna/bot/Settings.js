const fs = require("fs");

class Settings {
    constructor() {
        this.settings = this.loadSettings();
    }

    static getInstance() {
        return this;
    }

    loadSettings() {
        const filePath = './data/settings.json';

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

    saveSettings() {
        const filePath = './data/settings.json';

        try {
            fs.writeFileSync(filePath, JSON.stringify(this.settings, null, 2), 'utf8');
            console.log("Settings saved successfully.");
        } catch (error) {
            console.error("Error saving settings:", error);
        }
    }

    check(channel) {
        this.settings = this.loadSettings();
        let hasChanges = false;
        if (!this.settings[channel]) {
            this.settings[channel] = { id: -1 };
            console.log(`Created new settings for ${channel}: ${JSON.stringify(this.settings[channel])}`);
            hasChanges = true;
        }
        if (this.settings[channel]) {
            if (!this.settings[channel].esportal) {
                this.settings[channel].esportal = { name: "", id: -1};
                console.log(`Added twitch settings for: ${channel}`);
                hasChanges = true;
            }
            if (!this.settings[channel].toggled) {
                this.settings[channel].toggled = { };
                console.log(`Added toggle settings for: ${channel}`);
                hasChanges = true;
            }
            if (hasChanges) {
                this.saveSettings();
            }
            console.log(`Settings for channel ${channel}: ${JSON.stringify(this.settings[channel])}`)
        }
    }

    saveEsportalId(channel, id) {
        this.check(channel);
        this.settings[channel].esportal.id = id;
        this.saveSettings();
    }

    saveName(channel, name) {
        this.check(channel);
        this.settings[channel].esportal.name = name;
        this.saveSettings();
    }

    toggle(channel, command, triggers) {
        this.check(channel);
        const index = this.settings[channel].toggled.indexOf(command);
        const disable = (index === -1);
        const triggerList = `${triggers.length > 1 ? 's' : ''} [${triggers.map(trigger => `!${trigger}`).join(', ')}] has been ${disable ? `DISABLED` : `ENABLED`} for ${channel}.`;
        if (disable) {
            this.settings[channel].toggled.push(command);
        } else {
            this.settings[channel].toggled.splice(index, 1);
        }
        const result = `Command${triggerList}`;
        this.saveSettings();
        return result;
    }
}

module.exports = Settings;