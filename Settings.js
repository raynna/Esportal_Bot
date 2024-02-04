const fs = require("fs");

class Settings {
    constructor() {
        this.settings = this.loadSettings();
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
        if (!this.settings[channel]) {
            this.settings[channel] = {name: "", toggled: []};
            console.log(`settings for ${channel}: ${this.settings[channel]}`)
        }
    }

     saveName(channel, name) {
        this.check(channel);
        this.settings[channel].name = name;
        this.saveSettings();
    }

    toggle(channel, command, triggers) {
        this.check(channel);
        const index = this.settings[channel].toggled.indexOf(command);
        const disable = (index === -1);
        const triggerList = `${triggers.length > 1 ? 's':''} [${triggers.map(trigger => `!${trigger}`).join(', ')}] has been ${disable ? `DISABLED` : `ENABLED`} for ${channel}.`;
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