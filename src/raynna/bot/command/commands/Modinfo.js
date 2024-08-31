class Modinfo {

    constructor() {
        this.name = 'Modinfo';
	this.moderator = true;
        this.avoidTag = true;
    }

    async execute(tags, channel, argument, client, isBotModerator) {
        try {
            return "Hej Alla Mods! Skulle det vara så att något av kommandona från denna bot inte passar in, kan ni använda er utav !toggle kommandNamn, som ett t.ex: !toggle rank, för att ta på dom igen gör ni då samma kommando igen. Ha det fint!";
        } catch (error) {
            console.log(`An error has occurred while executing command ${this.name}`, error);
        }
    }
}

module.exports = Modinfo ;