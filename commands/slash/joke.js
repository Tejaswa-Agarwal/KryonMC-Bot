const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const jokes = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "Why did the scarecrow win an award? He was outstanding in his field!",
    "Why don't eggs tell jokes? They'd crack each other up!",
    "What do you call a fake noodle? An impasta!",
    "Why did the math book look so sad? Because it had too many problems!",
    "What did the ocean say to the beach? Nothing, it just waved!",
    "Why can't you hear a pterodactyl go to the bathroom? Because the 'P' is silent!",
    "What do you call a bear with no teeth? A gummy bear!",
    "Why did the bicycle fall over? Because it was two-tired!",
    "What do you call cheese that isn't yours? Nacho cheese!",
    "How do you organize a space party? You planet!",
    "Why don't skeletons fight each other? They don't have the guts!",
    "What did one wall say to the other? I'll meet you at the corner!",
    "Why was the computer cold? It left its Windows open!",
    "What do you call a sleeping bull? A bulldozer!",
    "How does a penguin build its house? Igloos it together!",
    "Why did the golfer bring two pairs of pants? In case he got a hole in one!",
    "What's orange and sounds like a parrot? A carrot!",
    "Why don't programmers like nature? It has too many bugs!",
    "What did the janitor say when he jumped out of the closet? Supplies!"
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joke')
        .setDescription('Get a random joke'),
    async execute(interaction) {
        const joke = jokes[Math.floor(Math.random() * jokes.length)];

        const embed = new EmbedBuilder()
            .setTitle('😂 Random Joke')
            .setDescription(joke)
            .setColor(0xF1C40F)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};