const fs = require("fs");

class Settings {
    constructor() {
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const filePath = './data/settings.json';

        try {
            if (!fs.existsSync(filePath)) {
                // If the file doesn't exist, create an empty one
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
        if (this.settings[channel]) {
            this.settings[channel] = {name: '', toggled: []};
        }
    }

     saveName(channel, name) {
        this.check(channel);
        this.settings[channel].name = name;
        this.saveSettings();
    }

    testToggle(channel) {
        this.check(channel);
        this.settings[channel].toggled = ["test", "test2"];
        this.saveSettings();
    }
}

module.exports = Settings;