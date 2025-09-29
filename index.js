require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ]
});

let twitchToken = null;
let statsChannels = {};

// Obtenir le token Twitch
async function getTwitchToken() {
    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', {
            client_id: process.env.TWITCH_CLIENT_ID,
            client_secret: process.env.TWITCH_CLIENT_SECRET,
            grant_type: 'client_credentials'
        });
        twitchToken = response.data.access_token;
    } catch (error) {
        console.error('Erreur token Twitch:', error.message);
    }
}

// Obtenir les followers Twitch
async function getTwitchFollowers() {
    if (!twitchToken) await getTwitchToken();
    
    try {
        const userResponse = await axios.get(`https://api.twitch.tv/helix/users?login=${process.env.TWITCH_USERNAME}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${twitchToken}`
            }
        });
        
        const userId = userResponse.data.data[0].id;
        
        const followersResponse = await axios.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`, {
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${twitchToken}`
            }
        });
        
        return followersResponse.data.total;
    } catch (error) {
        console.error('Erreur followers Twitch:', error.message);
        return 0;
    }
}

// Obtenir les abonnés YouTube
async function getYouTubeSubscribers() {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${process.env.YOUTUBE_CHANNEL_ID}&key=${process.env.YOUTUBE_API_KEY}`);
        return parseInt(response.data.items[0].statistics.subscriberCount);
    } catch (error) {
        console.error('Erreur YouTube:', error.message);
        return 0;
    }
}

// Obtenir les followers Twitter
async function getTwitterFollowers() {
    try {
        const response = await axios.get(`https://api.twitter.com/2/users/by/username/${process.env.TWITTER_USERNAME}?user.fields=public_metrics`, {
            headers: {
                'Authorization': `Bearer ${process.env.TWITTER_BEARER_TOKEN}`
            }
        });
        return response.data.data.public_metrics.followers_count;
    } catch (error) {
        console.error('Erreur Twitter:', error.message);
        return 0;
    }
}



// Obtenir les followers TikTok (scraping basique)
async function getTikTokFollowers() {
    try {
        const response = await axios.get(`https://www.tiktok.com/@${process.env.TIKTOK_USERNAME}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const match = response.data.match(/"followerCount":(\d+)/);
        return match ? parseInt(match[1]) : 0;
    } catch (error) {
        console.error('Erreur TikTok:', error.message);
        return 0;
    }
}

// Créer ou mettre à jour les salons vocaux avec les stats
async function updateStatsChannels() {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const onlineMembers = guild.members.cache.filter(member => 
        member.presence?.status === 'online' || 
        member.presence?.status === 'idle' || 
        member.presence?.status === 'dnd'
    ).size;
    const totalMembers = guild.memberCount;
    
    // Récupérer toutes les stats en parallèle
    const [twitch, youtube, twitter, tiktok] = await Promise.all([
        getTwitchFollowers(),
        getYouTubeSubscribers(),
        getTwitterFollowers(),
        getTikTokFollowers()
    ]);

    console.log('📊 Stats récupérées:', { twitch, youtube, twitter, tiktok });

    // Noms des salons avec les stats
    const channelNames = {
        category: `🔊 ${onlineMembers} online 🟢 sur ${totalMembers}`,
        instagram: `📷 Instagram : 148`,
        twitch: `🟣 Twitch : ${twitch > 1000 ? (twitch/1000).toFixed(2) + 'K' : twitch}`,
        twitter: `🐦 Twitter : ${twitter}`,
        youtube: `🎥 YouTube : ${youtube}`
    };

    // Chercher les salons existants d'abord
    if (!statsChannels.category) {
        statsChannels.category = guild.channels.cache.find(ch => ch.name.includes('online') && ch.type === 4);
    }
    if (!statsChannels.instagram) {
        statsChannels.instagram = guild.channels.cache.find(ch => ch.name.includes('Instagram') && ch.type === 2);
    }
    if (!statsChannels.twitch) {
        statsChannels.twitch = guild.channels.cache.find(ch => ch.name.includes('Twitch') && ch.type === 2);
    }
    if (!statsChannels.twitter) {
        statsChannels.twitter = guild.channels.cache.find(ch => ch.name.includes('Twitter') && ch.type === 2);
    }
    if (!statsChannels.youtube) {
        statsChannels.youtube = guild.channels.cache.find(ch => ch.name.includes('YouTube') && ch.type === 2);
    }

    // Créer seulement si n'existe pas
    if (!statsChannels.category) {
        try {
            statsChannels.category = await guild.channels.create({
                name: channelNames.category,
                type: 4 // Category
            });
            console.log('✅ Catégorie créée');
        } catch (error) {
            console.log('❌ Pas de permission pour créer la catégorie');
            return;
        }
    } else {
        try {
            await statsChannels.category.setName(channelNames.category);
        } catch (error) {
            console.log('⚠️ Pas de permission pour modifier la catégorie');
        }
    }

    // Créer ou mettre à jour les salons vocaux
    const platforms = ['instagram', 'twitch', 'twitter', 'youtube'];
    
    for (const platform of platforms) {
        if (!statsChannels[platform]) {
            try {
                statsChannels[platform] = await guild.channels.create({
                    name: channelNames[platform],
                    type: 2, // Voice channel
                    parent: statsChannels.category?.id
                });
                console.log(`✅ Salon ${platform} créé`);
            } catch (error) {
                console.log(`❌ Pas de permission pour créer ${platform}`);
            }
        } else {
            try {
                await statsChannels[platform].setName(channelNames[platform]);
            } catch (error) {
                console.log(`⚠️ Pas de permission pour modifier ${platform}`);
            }
        }
    }
}

// Mettre à jour les stats
async function updateStats() {
    try {
        await updateStatsChannels();
        console.log('✅ Salons vocaux mis à jour:', new Date().toLocaleString());
    } catch (error) {
        console.error('❌ Erreur mise à jour salons:', error.message);
    }
}

// Initialiser les salons de stats
async function setupStatsChannels() {
    console.log('🛠️ Initialisation des salons de stats...');
    await updateStatsChannels();
    console.log('✅ Salons de stats initialisés');
}

client.once('ready', async () => {
    console.log(`Bot connecté: ${client.user.tag}`);
    
    // Initialiser les salons de stats
    await setupStatsChannels();
    
    // Mise à jour toutes les 10 minutes
    setInterval(updateStats, 10 * 60 * 1000);
});

// Debug des variables d'environnement
console.log('🔍 Variables d\'environnement:');
console.log('DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? 'Défini (' + process.env.DISCORD_TOKEN.length + ' caractères)' : 'NON DÉFINI');
console.log('GUILD_ID:', process.env.GUILD_ID || 'NON DÉFINI');
console.log('TWITCH_CLIENT_ID:', process.env.TWITCH_CLIENT_ID || 'NON DÉFINI');

if (!process.env.DISCORD_TOKEN) {
    console.error('❌ ERREUR: DISCORD_TOKEN n\'est pas défini dans les variables d\'environnement!');
    console.error('Vérifiez l\'onglet Variables sur Railway.');
    process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);