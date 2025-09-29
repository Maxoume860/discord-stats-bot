# 🤖 Discord Stats Bot

Bot Discord qui affiche les statistiques des réseaux sociaux en temps réel dans des salons vocaux.

## 📊 Fonctionnalités

- **Discord** : Membres en ligne/total
- **Twitch** : Nombre de followers
- **YouTube** : Nombre d'abonnés  
- **Twitter/X** : Nombre de followers
- **TikTok** : Nombre de followers
- **Instagram** : Nombre de followers (fixe)

## 🎯 Affichage

Le bot crée automatiquement :
- 📂 Une catégorie avec le nombre de membres Discord
- 🔇 Des salons vocaux avec les stats de chaque plateforme

## 🚀 Installation

1. Cloner le repository
2. Installer les dépendances : `npm install`
3. Configurer le fichier `.env` (voir `.env.example`)
4. Lancer le bot : `npm start`

## 🔧 Configuration

Copier `.env.example` vers `.env` et remplir :
- Token Discord du bot
- ID du serveur Discord
- Clés API des différentes plateformes

## 📱 APIs Supportées

- **Discord.js** v14
- **Twitch API** (Helix)
- **YouTube Data API** v3
- **Twitter API** v2
- **TikTok** (scraping)

## ⚡ Hébergement

Compatible avec :
- Railway
- Render
- Heroku
- VPS

## 📝 Licence

MIT License"# discord-stats-bot" 
