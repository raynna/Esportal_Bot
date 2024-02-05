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

    check(id) {
        this.settings = this.loadSettings();
        if (!this.settings[id]) {
            this.settings[id] = { name: "" };
            console.log(`Created new settings for ${id}: ${JSON.stringify(this.settings[id])}`);
        }
        if (this.settings[id]) {
            if (!this.settings[id].esportal) {
                this.settings[id].esportal = { name: "", id: -1};
                console.log(`Added twitch settings for: ${id}`);
            }
            if (!this.settings[id].toggled) {
                this.settings[id].toggled = { };
                console.log(`Added toggle settings for: ${id}`);
            }
            console.log(`Settings for channel ${id}: ${JSON.stringify(this.settings[id])}`)
        }
    }

    getChannelId(channel) {
        for (const s in this.settings) {
            if (s.name.toLowerCase() === channel.toLowerCase()) {

            }
        }
        if (!this.settings.map(c => c.name.toLowerCase().includes(channel.toLowerCase()))) {
            return this.settings[c];
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