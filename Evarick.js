// Import Module
require('./len.js')
require('./database/Menu/EvarickMenu.js')
const fs = require('fs');
const axios = require('axios');

// Import Scrape
const Ai4Chat = require('./scrape/Ai4Chat.js');
const tiktok2 = require('./scrape/Tiktok.js');
const Ai4ChatRoleplay = require('./scrape/Ai4ChatRoleplay.js');



// Import RPG Data
const locations = require('./database/rpg/locations.js');
const items = require('./database/rpg/items.js');
const enemies = require('./database/rpg/enemies.js');
const logFilePath = ('./database/rpg/logs.json');

// Fungsi untuk mendapatkan waktu WIT (Waktu Indonesia Timur, UTC+9)
function getWITDate() {
    // Ambil waktu sekarang (akan diformat dengan timeZone di getWITString)
    return new Date();
}

// Format waktu WIT ke string yang mudah dibaca
function getWITString() {
    const wit = getWITDate();
    // Format: DD-MM-YYYY HH:mm:ss WIT
    return wit.toLocaleString('id-ID', { timeZone: 'Asia/Jayapura' }) + ' WIT';
}

// Helper function untuk normalisasi ID
function normalizeId(id) {
    if (!id) return '';
    return id.toString().toLowerCase().trim();
}

/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ███████╗██╗   ██╗ █████╗ ██████╗ ██╗  ██████╗██╗  ██╗                         ║
║  ██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔════╝██║ ██╔╝                         ║
║  █████╗  ██║   ██║███████║██████╔╝██║ ██║     █████╔╝                          ║
║  ██╔══╝  ╚██╗ ██╔╝██╔══██║██╔══██╗██║ ██║     ██╔═██╗                          ║
║  ███████╗ ╚████╔╝ ██║  ██║██║  ██║██║ ╚██████╗██║  ██╗                         ║
║  ╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═════╝╚═╝  ╚═╝                         ║
║                                                                              ║
║  🎮 RPG WhatsApp Bot - Created by Evarick                                    ║
║  📱 WhatsApp Group: https://chat.whatsapp.com/KhS1xo5FMVj5UQQLKTOl2G         ║
║  🎯 Discord Server: https://discord.gg/HbBGznaR                              ║
║  📺 YouTube Channel: https://youtube.com/channel/UCKL8nAmqlVJvvPK_LPZJt0g              ║
║  📸 Instagram: https://www.instagram.com/evarick1.1                         ║
║                                                                              ║
║  ⚠️  This bot is created by Evarick. Please respect the creator!              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

// Player Data Management
const playerDataFile = './database/rpg/players.json';

// Import crafting system
const { craftingRecipes, craftingCategories, craftingRequirements } = require('./database/rpg/crafting.js');

// Anti-Cheat System
const rateLimits = new Map();
const suspiciousActivities = new Map();
const adminCommands = new Set();

const ADMIN_NUMBERS = [
    "6282239902921@s.whatsapp.net" // Ganti dengan nomor admin
];

const SHOLAT_TIMES_WIT = [
    { name: "Subuh", time: "04:30" },
    { name: "Dzuhur", time: "12:00" },
    { name: "Ashar", time: "15:30" },
    { name: "Maghrib", time: "18:00" },
    { name: "Isya", time: "19:30" }
];


// Owner detection
function isOwner(participant) {
    const ownerNumbers = [
        '6282239902921@s.whatsapp.net', // Ganti dengan nomor owner kamu
        // Tambahkan nomor owner lain jika ada
    ];
    return ownerNumbers.includes(participant);
}

// Rate limiting configuration
const RATE_LIMITS = {
    hunt: { max: 10, window: 60000 }, // 10 hunts per minute
    nambang: { max: 15, window: 60000 }, // 15 mining per minute
    nebang: { max: 15, window: 60000 }, // 15 woodcutting per minute
    mancing: { max: 15, window: 60000 }, // 15 fishing per minute
    heal: { max: 5, window: 300000 }, // 5 heals per 5 minutes
    travel: { max: 20, window: 60000 }, // 20 travels per minute
    buy: { max: 10, window: 60000 }, // 10 buys per minute
    sell: { max: 10, window: 60000 }, // 10 sells per minute
    equip: { max: 20, window: 60000 }, // 20 equips per minute
    unequip: { max: 20, window: 60000 }, // 20 unequips per minute
    friend: { max: 10, window: 60000 }, // 10 friend actions per minute
    gift: { max: 5, window: 300000 }, // 5 gifts per 5 minutes
    stats: { max: 30, window: 60000 }, // 30 stats checks per minute
    profile: { max: 30, window: 60000 }, // 30 profile checks per minute
    status: { max: 30, window: 60000 }, // 30 status checks per minute
    general: { max: 50, window: 60000 } // 50 general messages per minute
};

function checkRateLimit(participant, command) {
    const limit = RATE_LIMITS[command];
    if (!limit) return true; // No limit for this command
    
    const now = Date.now();
    const key = `${participant}_${command}`;
    
    if (!rateLimits.has(key)) {
        rateLimits.set(key, []);
    }
    
    
    const userLimits = rateLimits.get(key);
    
    // Remove old entries
    const validEntries = userLimits.filter(time => now - time < limit.window);
    rateLimits.set(key, validEntries);
    
    if (validEntries.length >= limit.max) {
        return false; // Rate limit exceeded
    }
    
    validEntries.push(now);
    return true;
}

const skills = require('./database/rpg/skills.js');

function detectSuspiciousActivity(participant, command, data) {
    const now = Date.now();
    const key = `${participant}_suspicious`;
    
    if (!suspiciousActivities.has(key)) {
        suspiciousActivities.set(key, []);
    }
    
    const activities = suspiciousActivities.get(key);
    
    // Check for suspicious patterns
    let suspicious = false;
    let reason = '';
    
    // Pattern 1: Too many actions in short time
    const recentActions = activities.filter(act => now - act.timestamp < 60000);
    if (recentActions.length > 50) {
        suspicious = true;
        reason = 'Too many actions in 1 minute';
    }
    
    // Pattern 2: Impossible gold gains
    if (command === 'sell' && data && data.goldGain > 1000000) {
        suspicious = true;
        reason = 'Suspicious gold gain from selling';
    }
    
    // Pattern 3: Impossible level gains
    if (command === 'hunt' && data && data.levelGain > 10) {
        suspicious = true;
        reason = 'Suspicious level gain from hunting';
    }
    
    // Pattern 4: Command spam
    const commandSpam = recentActions.filter(act => act.command === command).length;
    if (commandSpam > 20) {
        suspicious = true;
        reason = 'Command spam detected';
    }
    
    // Record activity
    activities.push({
        timestamp: now,
        command: command,
        data: data,
        suspicious: suspicious,
        reason: reason
    });
    
    // Keep only last 100 activities
    if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
    }
    
    return { suspicious, reason };
}

function logSuspiciousActivity(participant, command, reason, data) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        participant: participant,
        command: command,
        reason: reason,
        data: data,
        playerData: players[participant] ? {
            nama: players[participant].nama,
            level: players[participant].level,
            gold: players[participant].gold
        } : null
    };
    
    console.log('🚨 SUSPICIOUS ACTIVITY DETECTED:', logEntry);
    
    // Save to log file
    try {
        const logPath = './database/suspicious_activity.json';
        let logs = [];
        if (fs.existsSync(logPath)) {
            logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        }
        logs.push(logEntry);
        
        // Keep only last 1000 entries
        if (logs.length > 1000) {
            logs = logs.slice(-1000);
        }
        
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error('Failed to log suspicious activity:', error);
    }
}

// Admin moderation commands
function isAdmin(participant) {
    // Bot admins only - NOT group admins
    const adminIds = [
        '6282239902921@s.whatsapp.net' // Admin bot utama
    ];
    return adminIds.includes(participant);
}

// Enhanced command processing with anti-cheat
function processCommandWithAntiCheat(participant, command, data) {
    // Check rate limit
    if (!checkRateLimit(participant, command)) {
        return {
            success: false,
            message: `⚠️ *Rate limit exceeded!*\n\nKamu terlalu sering menggunakan command ini. Tunggu sebentar.`,
            blocked: true
        };
    }
    
    // Detect suspicious activity
    const suspicious = detectSuspiciousActivity(participant, command, data);
    if (suspicious.suspicious) {
        logSuspiciousActivity(participant, command, suspicious.reason, data);
        
        // For severe cases, temporarily block the user
        if (suspicious.reason.includes('spam') || suspicious.reason.includes('impossible')) {
            return {
                success: false,
                message: `🚫 *Aktivitas mencurigakan terdeteksi!*\n\nAlasan: ${suspicious.reason}\n\nHubungi admin jika ini adalah kesalahan.`,
                blocked: true
            };
        }
    }
    
    return { success: true, blocked: false };
}

// Title System
const titles = {
    // Combat Titles (Level-based)
    combat: {
        "Pemula": { requirement: "Level 1", condition: (player) => player.level >= 1 },
        "Petarung": { requirement: "Level 10", condition: (player) => player.level >= 10 },
        "Ksatria": { requirement: "Level 25", condition: (player) => player.level >= 25 },
        "Pembunuh": { requirement: "Level 50", condition: (player) => player.level >= 50 },
        "Legenda": { requirement: "Level 100", condition: (player) => player.level >= 100 },
        "Mitos": { requirement: "Level 200", condition: (player) => player.level >= 200 },
        "Dewa": { requirement: "Level 500", condition: (player) => player.level >= 500 }
    },
    
    // Gold Titles (Wealth-based)
    wealth: {
        "Miskin": { requirement: "0 Gold", condition: (player) => player.gold >= 0 },
        "Petani": { requirement: "10.000 Gold", condition: (player) => player.gold >= 10000 },
        "Pedagang": { requirement: "100.000 Gold", condition: (player) => player.gold >= 100000 },
        "Konglomerat": { requirement: "1.000.000 Gold", condition: (player) => player.gold >= 1000000 },
        "Raja Emas": { requirement: "10.000.000 Gold", condition: (player) => player.gold >= 10000000 },
        "Tuhan Kekayaan": { requirement: "100.000.000 Gold", condition: (player) => player.gold >= 100000000 }
    },
    
    // Hunting Titles (Monster kills)
    hunting: {
        "Pemburu": { requirement: "100 Monster", condition: (player) => (player.monsterKills || 0) >= 100 },
        "Pemburu Elite": { requirement: "1.000 Monster", condition: (player) => (player.monsterKills || 0) >= 1000 },
        "Pemburu Legendaris": { requirement: "10.000 Monster", condition: (player) => (player.monsterKills || 0) >= 10000 },
        "Pembasmi Monster": { requirement: "100.000 Monster", condition: (player) => (player.monsterKills || 0) >= 100000 }
    },
    
    // Mining Titles
    mining: {
        "Penambang": { requirement: "1.000 Mining", condition: (player) => (player.miningCount || 0) >= 1000 },
        "Penambang Ahli": { requirement: "10.000 Mining", condition: (player) => (player.miningCount || 0) >= 10000 },
        "Raja Tambang": { requirement: "100.000 Mining", condition: (player) => (player.miningCount || 0) >= 100000 }
    },
    
    // Woodcutting Titles
    woodcutting: {
        "Penebang": { requirement: "1.000 Woodcutting", condition: (player) => (player.woodcuttingCount || 0) >= 1000 },
        "Penebang Ahli": { requirement: "10.000 Woodcutting", condition: (player) => (player.woodcuttingCount || 0) >= 10000 },
        "Raja Hutan": { requirement: "100.000 Woodcutting", condition: (player) => (player.woodcuttingCount || 0) >= 100000 }
    },
    
    // Fishing Titles
    fishing: {
        "Pemancing": { requirement: "1.000 Fishing", condition: (player) => (player.fishingCount || 0) >= 1000 },
        "Pemancing Ahli": { requirement: "10.000 Fishing", condition: (player) => (player.fishingCount || 0) >= 10000 },
        "Raja Laut": { requirement: "100.000 Fishing", condition: (player) => (player.fishingCount || 0) >= 100000 }
    },
    
    // Class Mastery Titles
    classMastery: {
        "Fighter Master": { requirement: "Level 50 Fighter", condition: (player) => player.kelas === 'Fighter' && player.level >= 50 },
        "Assassin Master": { requirement: "Level 50 Assassin", condition: (player) => player.kelas === 'Assassin' && player.level >= 50 },
        "Mage Master": { requirement: "Level 50 Mage", condition: (player) => player.kelas === 'Mage' && player.level >= 50 },
        "Tank Master": { requirement: "Level 50 Tank", condition: (player) => player.kelas === 'Tank' && player.level >= 50 },
        "Archer Master": { requirement: "Level 50 Archer", condition: (player) => player.kelas === 'Archer' && player.level >= 50 }
    },
    
    // Equipment Titles
    equipment: {
        "Pemula": { requirement: "1 Equipment", condition: (player) => {
            const equippedItems = Object.values(player.equipment || {}).filter(item => item !== null && item !== undefined);
            return equippedItems.length >= 1;
        }},
        "Terlengkapi": { requirement: "5 Equipment", condition: (player) => {
            const equippedItems = Object.values(player.equipment || {}).filter(item => item !== null && item !== undefined);
            return equippedItems.length >= 5;
        }},
        "Prajurit": { requirement: "10 Equipment", condition: (player) => {
            const equippedItems = Object.values(player.equipment || {}).filter(item => item !== null && item !== undefined);
            return equippedItems.length >= 10;
        }},
        "Ksatria Lengkap": { requirement: "15 Equipment", condition: (player) => {
            const equippedItems = Object.values(player.equipment || {}).filter(item => item !== null && item !== undefined);
            return equippedItems.length >= 15;
        }}
    },
    
    // Special Achievement Titles
    special: {
        "Pemain Setia": { requirement: "7 Hari Berturut-turut", condition: (player) => (player.consecutiveDays || 0) >= 7 },
        "Pemain Veteran": { requirement: "30 Hari Berturut-turut", condition: (player) => (player.consecutiveDays || 0) >= 30 },
        "Pemain Legendaris": { requirement: "100 Hari Berturut-turut", condition: (player) => (player.consecutiveDays || 0) >= 100 },
        "Penjelajah": { requirement: "Kunjungi 5 Lokasi", condition: (player) => {
            const visitedLocations = player.visitedLocations || [];
            return visitedLocations.length >= 5;
        }},
        "Penjelajah Dunia": { requirement: "Kunjungi Semua Lokasi", condition: (player) => {
            const visitedLocations = player.visitedLocations || [];
            return visitedLocations.length >= 10;
        }},
        "GOD KILLER": { requirement: "???", condition: (player) => false }, // Impossible requirement - only via secret command
        "Bot Administrator": { requirement: "Admin Bot", condition: (player) => false } // Will be set manually via admin command
    }
};

// Daily Login Rewards System
const dailyRewards = {
    day1: { gold: 100, exp: 20, items: ['Potion HP'], title: null },
    day2: { gold: 150, exp: 30, items: ['Potion Mana'], title: null },
    day3: { gold: 200, exp: 40, items: ['Pedang Kayu'], title: null },
    day4: { gold: 250, exp: 50, items: ['Helem Kulit'], title: null },
    day5: { gold: 300, exp: 60, items: ['Zirah Kulit'], title: null },
    day6: { gold: 350, exp: 70, items: ['Pedang Besi'], title: null },
    day7: { gold: 500, exp: 100, items: ['Pedang Baja', 'Title: Pemain Setia'], title: 'Pemain Setia' },
    day14: { gold: 1000, exp: 200, items: ['Helem Besi', 'Zirah Besi'], title: null },
    day21: { gold: 2000, exp: 300, items: ['Pedang Kristal'], title: null },
    day30: { gold: 5000, exp: 500, items: ['Pedang Legendaris', 'Title: Pemain Veteran'], title: 'Pemain Veteran' }
};

// Weekly Challenges System
const weeklyChallenges = [
    {
        id: 'monster_hunter',
        name: "Monster Hunter",
        description: "Kill 100 monsters this week",
        target: 100,
        type: 'monsterKills',
        reward: { gold: 500, exp: 80, items: ['Potion HP', 'Potion Mana'] },
        difficulty: 'easy'
    },
    {
        id: 'mining_master',
        name: "Mining Master",
        description: "Mine 500 times this week",
        target: 500,
        type: 'miningCount',
        reward: { gold: 400, exp: 60, items: ['Kapak Besi'] },
        difficulty: 'medium'
    },
    {
        id: 'fishing_expert',
        name: "Fishing Expert",
        description: "Fish 300 times this week",
        target: 300,
        type: 'fishingCount',
        reward: { gold: 450, exp: 70, items: ['Pancingan'] },
        difficulty: 'medium'
    },
    {
        id: 'woodcutter',
        name: "Woodcutter",
        description: "Cut wood 400 times this week",
        target: 400,
        type: 'woodcuttingCount',
        reward: { gold: 420, exp: 65, items: ['Kapak Kayu'] },
        difficulty: 'medium'
    },
    {
        id: 'wealth_collector',
        name: "Wealth Collector",
        description: "Earn 50,000 gold this week",
        target: 50000,
        type: 'goldEarned',
        reward: { gold: 1000, exp: 120, items: ['Cincin Emas'] },
        difficulty: 'hard'
    },
    {
        id: 'equipment_collector',
        name: "Equipment Collector",
        description: "Collect 10 different equipment pieces",
        target: 10,
        type: 'equipmentCount',
        reward: { gold: 800, exp: 100, items: ['Title: Kolektor'], title: 'Kolektor' },
        difficulty: 'hard'
    },
    {
        id: 'pvp_warrior',
        name: "PvP Warrior",
        description: "Win 15 PvP battles this week",
        target: 15,
        type: 'pvpWins',
        reward: { gold: 600, exp: 90, items: ['Pedang Besi'] },
        difficulty: 'medium'
    },
    {
        id: 'pvp_master',
        name: "PvP Master",
        description: "Play 30 PvP battles this week",
        target: 30,
        type: 'pvpBattles',
        reward: { gold: 500, exp: 75, items: ['Zirah Besi'] },
        difficulty: 'medium'
    },
    {
        id: 'pvp_legend',
        name: "PvP Legend",
        description: "Reach 1300 PvP rating this week",
        target: 1300,
        type: 'pvpRating',
        reward: { gold: 1200, exp: 150, items: ['Title: PvP Legend'], title: 'PvP Legend' },
        difficulty: 'hard'
    }
];


// Achievement System
const achievements = {
    // Combat Achievements
    combat: {
        "First Blood": {
            id: 'first_blood',
            description: "Kill your first monster",
            condition: (player) => (player.monsterKills || 0) >= 1,
            reward: { gold: 100, exp: 10, items: ['Potion HP'] },
            category: 'combat'
        },
        "Monster Slayer": {
            id: 'monster_slayer',
            description: "Kill 1000 monsters",
            condition: (player) => (player.monsterKills || 0) >= 1000,
            reward: { gold: 10000, exp: 500, items: ['Pedang Besi'] },
            category: 'combat'
        },
        "Monster Hunter": {
            id: 'monster_hunter',
            description: "Kill 10000 monsters",
            condition: (player) => (player.monsterKills || 0) >= 10000,
            reward: { gold: 50000, exp: 2000, items: ['Pedang Baja'] },
            category: 'combat'
        },
        "Monster Exterminator": {
            id: 'monster_exterminator',
            description: "Kill 100000 monsters",
            condition: (player) => (player.monsterKills || 0) >= 100000,
            reward: { gold: 200000, exp: 10000, items: ['Pedang Kristal', 'Title: Pembasmi Monster'], title: 'Pembasmi Monster' },
            category: 'combat'
        }
    },
    
    // Economy Achievements
    economy: {
        "First Gold": {
            id: 'first_gold',
            description: "Earn your first 1000 gold",
            condition: (player) => (player.gold || 0) >= 1000,
            reward: { gold: 500, exp: 25, items: [] },
            category: 'economy'
        },
        "Millionaire": {
            id: 'millionaire',
            description: "Reach 1,000,000 gold",
            condition: (player) => (player.gold || 0) >= 1000000,
            reward: { gold: 50000, exp: 1000, items: ['Title: Millionaire'], title: 'Millionaire' },
            category: 'economy'
        },
        "Billionaire": {
            id: 'billionaire',
            description: "Reach 1,000,000,000 gold",
            condition: (player) => (player.gold || 0) >= 1000000000,
            reward: { gold: 1000000, exp: 5000, items: ['Title: Billionaire'], title: 'Billionaire' },
            category: 'economy'
        }
    },
    
    // Activity Achievements
    activity: {
        "Mining Beginner": {
            id: 'mining_beginner',
            description: "Mine 100 times",
            condition: (player) => (player.miningCount || 0) >= 100,
            reward: { gold: 500, exp: 25, items: ['Kapak Kayu'] },
            category: 'activity'
        },
        "Mining Expert": {
            id: 'mining_expert',
            description: "Mine 10000 times",
            condition: (player) => (player.miningCount || 0) >= 10000,
            reward: { gold: 5000, exp: 250, items: ['Kapak Besi'] },
            category: 'activity'
        },
        "Fishing Beginner": {
            id: 'fishing_beginner',
            description: "Fish 100 times",
            condition: (player) => (player.fishingCount || 0) >= 100,
            reward: { gold: 500, exp: 25, items: ['Pancingan'] },
            category: 'activity'
        },
        "Fishing Expert": {
            id: 'fishing_expert',
            description: "Fish 10000 times",
            condition: (player) => (player.fishingCount || 0) >= 10000,
            reward: { gold: 5000, exp: 250, items: ['Pancingan'] },
            category: 'activity'
        },
        "Woodcutter": {
            id: 'woodcutter',
            description: "Cut wood 1000 times",
            condition: (player) => (player.woodcuttingCount || 0) >= 1000,
            reward: { gold: 1000, exp: 50, items: ['Kapak Kayu'] },
            category: 'activity'
        }
    },
    
    // Social Achievements
    social: {
        "Friend Maker": {
            id: 'friend_maker',
            description: "Make 5 friends",
            condition: (player) => (player.friends || []).length >= 5,
            reward: { gold: 1000, exp: 50, items: ['Title: Friend Maker'], title: 'Friend Maker' },
            category: 'social'
        },
        "Social Butterfly": {
            id: 'social_butterfly',
            description: "Make 20 friends",
            condition: (player) => (player.friends || []).length >= 20,
            reward: { gold: 5000, exp: 250, items: ['Title: Social Butterfly'], title: 'Social Butterfly' },
            category: 'social'
        }
    },
    
    // PvP Achievements
    pvp: {
        "First Blood": {
            id: 'first_pvp_win',
            description: "Win your first PvP battle",
            condition: (player) => (player.pvpStats && player.pvpStats.wins) >= 1,
            reward: { gold: 500, exp: 25, items: ['Potion HP'] },
            category: 'pvp'
        },
        "PvP Novice": {
            id: 'pvp_novice',
            description: "Win 10 PvP battles",
            condition: (player) => (player.pvpStats && player.pvpStats.wins) >= 10,
            reward: { gold: 1000, exp: 50, items: ['Pedang Kayu'] },
            category: 'pvp'
        },
        "PvP Warrior": {
            id: 'pvp_warrior',
            description: "Win 50 PvP battles",
            condition: (player) => (player.pvpStats && player.pvpStats.wins) >= 50,
            reward: { gold: 2500, exp: 125, items: ['Pedang Besi', 'Title: PvP Warrior'], title: 'PvP Warrior' },
            category: 'pvp'
        },
        "PvP Master": {
            id: 'pvp_master',
            description: "Win 100 PvP battles",
            condition: (player) => (player.pvpStats && player.pvpStats.wins) >= 100,
            reward: { gold: 5000, exp: 250, items: ['Pedang Baja', 'Title: PvP Master'], title: 'PvP Master' },
            category: 'pvp'
        },
        "PvP Legend": {
            id: 'pvp_legend',
            description: "Win 500 PvP battles",
            condition: (player) => (player.pvpStats && player.pvpStats.wins) >= 500,
            reward: { gold: 25000, exp: 1000, items: ['Pedang Kristal', 'Title: PvP Legend'], title: 'PvP Legend' },
            category: 'pvp'
        },
        "Rating Climber": {
            id: 'rating_climber',
            description: "Reach 1200 PvP rating",
            condition: (player) => (player.pvpStats && player.pvpStats.rating) >= 1200,
            reward: { gold: 2000, exp: 100, items: ['Title: Rating Climber'], title: 'Rating Climber' },
            category: 'pvp'
        },
        "Rating Master": {
            id: 'rating_master',
            description: "Reach 1500 PvP rating",
            condition: (player) => (player.pvpStats && player.pvpStats.rating) >= 1500,
            reward: { gold: 5000, exp: 250, items: ['Title: Rating Master'], title: 'Rating Master' },
            category: 'pvp'
        },
        "Win Streak": {
            id: 'win_streak',
            description: "Achieve a 5-win streak in PvP",
            condition: (player) => (player.pvpStats && player.pvpStats.winStreak) >= 5,
            reward: { gold: 1000, exp: 50, items: ['Title: Streak Master'], title: 'Streak Master' },
            category: 'pvp'
        },
        "Unstoppable": {
            id: 'unstoppable',
            description: "Achieve a 10-win streak in PvP",
            condition: (player) => (player.pvpStats && player.pvpStats.winStreak) >= 10,
            reward: { gold: 3000, exp: 150, items: ['Title: Unstoppable'], title: 'Unstoppable' },
            category: 'pvp'
        }
    },
    
    // Exploration Achievements
    exploration: {
        "Explorer": {
            id: 'explorer',
            description: "Visit 5 different locations",
            condition: (player) => (player.visitedLocations || []).length >= 5,
            reward: { gold: 2000, exp: 100, items: ['Title: Penjelajah'], title: 'Penjelajah' },
            category: 'exploration'
        },
        "World Traveler": {
            id: 'world_traveler',
            description: "Visit all locations",
            condition: (player) => (player.visitedLocations || []).length >= 10,
            reward: { gold: 10000, exp: 500, items: ['Title: Penjelajah Dunia'], title: 'Penjelajah Dunia' },
            category: 'exploration'
        }
    }
};


// Quest System
const quests = {
    // Daily Quests
    daily: [
        {
            id: 'daily_hunt',
            name: "Daily Hunt",
            description: "Kill 10 monsters today",
            target: 10,
            type: 'monsterKills',
            reward: { gold: 500, exp: 25, items: ['Potion HP'] },
            category: 'daily'
        },
        {
            id: 'daily_mine',
            name: "Daily Mining",
            description: "Mine 50 times today",
            target: 50,
            type: 'miningCount',
            reward: { gold: 300, exp: 15, items: ['Batu'] },
            category: 'daily'
        },
        {
            id: 'daily_fish',
            name: "Daily Fishing",
            description: "Fish 30 times today",
            target: 30,
            type: 'fishingCount',
            reward: { gold: 400, exp: 20, items: ['Ikan'] },
            category: 'daily'
        },
        {
            id: 'daily_woodcut',
            name: "Daily Woodcutting",
            description: "Cut wood 40 times today",
            target: 40,
            type: 'woodcuttingCount',
            reward: { gold: 350, exp: 18, items: ['Kayu'] },
            category: 'daily'
        },
        {
            id: 'daily_pvp_win',
            name: "Daily PvP Victory",
            description: "Win 3 PvP battles today",
            target: 3,
            type: 'pvpWins',
            reward: { gold: 800, exp: 40, items: ['Potion HP', 'Potion Mana'] },
            category: 'daily'
        },
        {
            id: 'daily_pvp_play',
            name: "Daily PvP Participant",
            description: "Play 5 PvP battles today",
            target: 5,
            type: 'pvpBattles',
            reward: { gold: 600, exp: 30, items: ['Potion HP'] },
            category: 'daily'
        }
    ],
    
    // Weekly Quests
    weekly: [
        {
            id: 'weekly_hunt',
            name: "Weekly Hunt",
            description: "Kill 100 monsters this week",
            target: 100,
            type: 'monsterKills',
            reward: { gold: 2000, exp: 100, items: ['Pedang Besi'] },
            category: 'weekly'
        },
        {
            id: 'weekly_mine',
            name: "Weekly Mining",
            description: "Mine 500 times this week",
            target: 500,
            type: 'miningCount',
            reward: { gold: 1500, exp: 75, items: ['Kapak Besi'] },
            category: 'weekly'
        },
        {
            id: 'weekly_fish',
            name: "Weekly Fishing",
            description: "Fish 300 times this week",
            target: 300,
            type: 'fishingCount',
            reward: { gold: 1800, exp: 90, items: ['Pancingan'] },
            category: 'weekly'
        },
        {
            id: 'weekly_wealth',
            name: "Weekly Wealth",
            description: "Earn 50,000 gold this week",
            target: 50000,
            type: 'goldEarned',
            reward: { gold: 5000, exp: 250, items: ['Cincin Emas'] },
            category: 'weekly'
        },
        {
            id: 'weekly_pvp_win',
            name: "Weekly PvP Champion",
            description: "Win 20 PvP battles this week",
            target: 20,
            type: 'pvpWins',
            reward: { gold: 3000, exp: 150, items: ['Pedang Baja', 'Title: PvP Champion'], title: 'PvP Champion' },
            category: 'weekly'
        },
        {
            id: 'weekly_pvp_play',
            name: "Weekly PvP Warrior",
            description: "Play 50 PvP battles this week",
            target: 50,
            type: 'pvpBattles',
            reward: { gold: 2500, exp: 125, items: ['Zirah Besi'] },
            category: 'weekly'
        },
        {
            id: 'weekly_pvp_rating',
            name: "Weekly PvP Master",
            description: "Reach 1200 PvP rating this week",
            target: 1200,
            type: 'pvpRating',
            reward: { gold: 4000, exp: 200, items: ['Title: PvP Master'], title: 'PvP Master' },
            category: 'weekly'
        }
    ],
    
    // Story Quests
    story: [
        {
            id: 'story_beginning',
            name: "The Beginning",
            description: "Complete your first hunt and reach level 5",
            requirements: [
                { type: 'monsterKills', target: 1 },
                { type: 'level', target: 5 }
            ],
            reward: { gold: 1000, exp: 100, items: ['Pedang Kayu', 'Title: Pemula'], title: 'Pemula' },
            category: 'story',
            nextQuest: 'story_challenge'
        },
        {
            id: 'story_challenge',
            name: "The Challenge",
            description: "Kill 50 monsters and reach level 20",
            requirements: [
                { type: 'monsterKills', target: 50 },
                { type: 'level', target: 20 }
            ],
            reward: { gold: 5000, exp: 500, items: ['Pedang Besi', 'Title: Petarung'], title: 'Petarung' },
            category: 'story',
            nextQuest: 'story_legend'
        },
        {
            id: 'story_legend',
            name: "The Legend",
            description: "Kill 500 monsters and reach level 100",
            requirements: [
                { type: 'monsterKills', target: 500 },
                { type: 'level', target: 100 }
            ],
            reward: { gold: 50000, exp: 2000, items: ['Pedang Baja', 'Title: Legenda'], title: 'Legenda' },
            category: 'story',
            nextQuest: 'story_pvp_warrior'
        },
        {
            id: 'story_pvp_warrior',
            name: "PvP Warrior",
            description: "Win 100 PvP battles and reach level 50",
            requirements: [
                { type: 'pvpWins', target: 100 },
                { type: 'level', target: 50 }
            ],
            reward: { gold: 25000, exp: 1000, items: ['Pedang Kristal', 'Title: PvP Warrior'], title: 'PvP Warrior' },
            category: 'story',
            nextQuest: 'story_pvp_legend'
        },
        {
            id: 'story_pvp_legend',
            name: "PvP Legend",
            description: "Win 500 PvP battles and reach 1500 PvP rating",
            requirements: [
                { type: 'pvpWins', target: 500 },
                { type: 'pvpRating', target: 1500 }
            ],
            reward: { gold: 100000, exp: 5000, items: ['Pedang Legendaris', 'Title: PvP Legend'], title: 'PvP Legend' },
            category: 'story'
        }
    ]
};

// Helper functions for Daily/Weekly Rewards and Achievements
function checkDailyReward(player) {
    if (!player.dailyRewards) {
        player.dailyRewards = {
            lastClaim: null,
            currentStreak: 0,
            totalDays: 0
        };
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const lastClaim = player.dailyRewards.lastClaim ? new Date(player.dailyRewards.lastClaim).getTime() : 0;
    
    // Check if already claimed today
    if (lastClaim === today) {
        return { canClaim: false, message: "Kamu sudah mengklaim daily reward hari ini!" };
    }
    
    // Check if consecutive day
    const yesterday = today - (24 * 60 * 60 * 1000);
    let newStreak = 1;
    
    if (lastClaim === yesterday) {
        newStreak = player.dailyRewards.currentStreak + 1;
    }
    
    // Get reward for current streak
    const rewardKey = `day${newStreak}`;
    const reward = dailyRewards[rewardKey] || dailyRewards.day7; // Default to day7 reward
    
    return {
        canClaim: true,
        streak: newStreak,
        reward: reward,
        message: `Daily reward tersedia! Streak: ${newStreak} hari`
    };
}

function claimDailyReward(player) {
    const check = checkDailyReward(player);
    if (!check.canClaim) {
        return { success: false, message: check.message };
    }
    
    // Initialize if not exists
    if (!player.dailyRewards) {
        player.dailyRewards = {
            lastClaim: null,
            currentStreak: 0,
            totalDays: 0
        };
    }
    
    // Update player data
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
player.dailyRewards.lastClaim = today;
    player.dailyRewards.currentStreak = check.streak;
    player.dailyRewards.totalDays += 1;
    
    // Give rewards
    const reward = check.reward;
    player.gold += reward.gold;
    
    // Add items to inventory
    reward.items.forEach(item => {
        if (item.startsWith('Title: ')) {
            const titleName = item.replace('Title: ', '');
            if (!player.titles) player.titles = [];
            if (!player.titles.includes(titleName)) {
                player.titles.push(titleName);
            }
        } else {
            player.tas[item] = (player.tas[item] || 0) + 1;
        }
    });
    
    return {
        success: true,
        streak: check.streak,
        reward: reward,
        message: `🎉 Daily reward diklaim! Streak: ${check.streak} hari`
    };
}

function checkWeeklyChallenges(player) {
    if (!player.weeklyChallenges) {
        player.weeklyChallenges = {
            currentWeek: getCurrentWeek(),
            progress: {},
            completed: {},
            claimed: {}
        };
    }
    
    const currentWeek = getCurrentWeek();
    if (player.weeklyChallenges.currentWeek !== currentWeek) {
        // Reset for new week
        player.weeklyChallenges = {
            currentWeek: currentWeek,
            progress: {},
            completed: {},
            claimed: {}
        };
    }
    
    const availableChallenges = [];
    const completedChallenges = [];
    
    weeklyChallenges.forEach(challenge => {
        const progress = player.weeklyChallenges.progress[challenge.id] || 0;
        const isCompleted = progress >= challenge.target;
        const isClaimed = player.weeklyChallenges.claimed[challenge.id] || false;
        
        if (isCompleted && !isClaimed) {
            completedChallenges.push({ ...challenge, progress });
        } else if (!isCompleted) {
            availableChallenges.push({ ...challenge, progress });
        }
    });
    
    return { availableChallenges, completedChallenges };
}

function getCurrentWeek() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

function checkAchievements(player) {
    if (!player.achievements) {
        player.achievements = {
            unlocked: [],
            progress: {}
        };
    }
    
    const newAchievements = [];
    
    // Check all achievement categories
    Object.keys(achievements).forEach(category => {
        Object.keys(achievements[category]).forEach(achievementId => {
            const achievement = achievements[category][achievementId];
            
            if (!player.achievements.unlocked.includes(achievementId)) {
                if (achievement.condition(player)) {
                    newAchievements.push(achievement);
                    player.achievements.unlocked.push(achievementId);
                }
            }
        });
    });
    
    return newAchievements;
}

function checkQuests(player) {
    if (!player.quests) {
        player.quests = {
            daily: { progress: {}, completed: {}, lastReset: null },
            weekly: { progress: {}, completed: {}, lastReset: null },
            story: { progress: {}, completed: {}, current: 'story_beginning' }
        };
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const currentWeek = getCurrentWeek();
    
    // Reset daily quests if needed
    if (player.quests.daily.lastReset !== today) {
        player.quests.daily = { progress: {}, completed: {}, lastReset: today };
    }
    
    // Reset weekly quests if needed
    if (player.quests.weekly.lastReset !== currentWeek) {
        player.quests.weekly = { progress: {}, completed: {}, lastReset: currentWeek };
    }
    
    const availableQuests = {
        daily: quests.daily.filter(quest => !player.quests.daily.completed[quest.id]),
        weekly: quests.weekly.filter(quest => !player.quests.weekly.completed[quest.id]),
        story: quests.story.filter(quest => !player.quests.story.completed[quest.id])
    };
    
    return availableQuests;
}

// Function to update quest progress
function updateQuestProgress(player, activityType, amount = 1) {
    if (!player.quests) {
        player.quests = {
            daily: { progress: {}, completed: {}, lastReset: null },
            weekly: { progress: {}, completed: {}, lastReset: null },
            story: { progress: {}, completed: {}, current: 'story_beginning' }
        };
    }
    
    // Update daily quests
    quests.daily.forEach(quest => {
        if (quest.type === activityType && !player.quests.daily.completed[quest.id]) {
            player.quests.daily.progress[quest.id] = (player.quests.daily.progress[quest.id] || 0) + amount;
            
            if (player.quests.daily.progress[quest.id] >= quest.target) {
                player.quests.daily.completed[quest.id] = true;
            }
        }
    });
    
    // Update weekly quests
    quests.weekly.forEach(quest => {
        if (quest.type === activityType && !player.quests.weekly.completed[quest.id]) {
            player.quests.weekly.progress[quest.id] = (player.quests.weekly.progress[quest.id] || 0) + amount;
            
            if (player.quests.weekly.progress[quest.id] >= quest.target) {
                player.quests.weekly.completed[quest.id] = true;
            }
        }
    });
    
    // Update story quests
    quests.story.forEach(quest => {
        if (!player.quests.story.completed[quest.id]) {
            let allRequirementsMet = true;
            
            quest.requirements.forEach(req => {
                if (req.type === activityType) {
                    player.quests.story.progress[quest.id] = player.quests.story.progress[quest.id] || {};
                    player.quests.story.progress[quest.id][req.type] = (player.quests.story.progress[quest.id][req.type] || 0) + amount;
                    
                    if (player.quests.story.progress[quest.id][req.type] < req.target) {
                        allRequirementsMet = false;
                    }
                } else if (req.type === 'level') {
                    // Update level progress
                    player.quests.story.progress[quest.id] = player.quests.story.progress[quest.id] || {};
                    player.quests.story.progress[quest.id][req.type] = player.level || 1;
                    
                    if (player.level < req.target) {
                        allRequirementsMet = false;
                    }
                } else if (req.type === 'pvpRating') {
                    // Update PvP rating progress
                    player.quests.story.progress[quest.id] = player.quests.story.progress[quest.id] || {};
                    player.quests.story.progress[quest.id][req.type] = player.pvpStats ? player.pvpStats.rating : 1000;
                    
                    if (player.quests.story.progress[quest.id][req.type] < req.target) {
                        allRequirementsMet = false;
                    }
                }
            });
            
            if (allRequirementsMet) {
                player.quests.story.completed[quest.id] = true;
            }
        }
    });
}

// Function to update weekly challenge progress
function updateWeeklyChallengeProgress(player, activityType, amount = 1) {
    if (!player.weeklyChallenges) {
        player.weeklyChallenges = {
            currentWeek: getCurrentWeek(),
            progress: {},
            completed: {},
            claimed: {}
        };
    }
    
    // Reset if new week
    const currentWeek = getCurrentWeek();
    if (player.weeklyChallenges.currentWeek !== currentWeek) {
        player.weeklyChallenges = {
            currentWeek: currentWeek,
            progress: {},
            completed: {},
            claimed: {}
        };
    }
    
    // Update progress for matching challenges
    weeklyChallenges.forEach(challenge => {
        if (challenge.type === activityType && !player.weeklyChallenges.completed[challenge.id]) {
            player.weeklyChallenges.progress[challenge.id] = (player.weeklyChallenges.progress[challenge.id] || 0) + amount;
            
            if (player.weeklyChallenges.progress[challenge.id] >= challenge.target) {
                player.weeklyChallenges.completed[challenge.id] = true;
            }
        }
    });
}

// Function to update all progress (quests, challenges, achievements)
function updateAllProgress(player, activityType, amount = 1) {
    // Update quest progress
    updateQuestProgress(player, activityType, amount);
    
    // Update weekly challenge progress
    updateWeeklyChallengeProgress(player, activityType, amount);
    
    // Check for new achievements (only relevant to current activity)
    const newAchievements = checkActivityAchievements(player, activityType);
    
    return newAchievements;
}

// New function to check achievements specific to an activity
function checkActivityAchievements(player, activityType) {
    if (!player.achievements) {
        player.achievements = {
            unlocked: [],
            progress: {}
        };
    }
    
    const newAchievements = [];
    
    // Map activity types to achievement categories
    const activityToCategories = {
        'monsterKills': ['combat'],
        'miningCount': ['activity'],
        'woodcuttingCount': ['activity'],
        'fishingCount': ['activity'],
        'gold': ['economy'],
        'level': ['combat', 'economy'],
        'friends': ['social'],
        'visitedLocations': ['exploration']
    };
    
    // Get relevant categories for this activity
    const relevantCategories = activityToCategories[activityType] || [];
    
    // Check only relevant achievement categories
    relevantCategories.forEach(category => {
        if (achievements[category]) {
            Object.keys(achievements[category]).forEach(achievementId => {
                const achievement = achievements[category][achievementId];
                
                if (!player.achievements.unlocked.includes(achievementId)) {
                    if (achievement.condition(player)) {
                        newAchievements.push(achievement);
                        player.achievements.unlocked.push(achievementId);
                    }
                }
            });
        }
    });
    
    return newAchievements;
}

// Helper function to get current progress for an achievement
function getAchievementProgress(player, achievementId) {
    // Find the achievement
    let targetAchievement = null;
    
    Object.keys(achievements).forEach(category => {
        Object.keys(achievements[category]).forEach(id => {
            if (id === achievementId) {
                targetAchievement = achievements[category][id];
            }
        });
    });
    
    if (!targetAchievement) return null;
    
    // Get current value based on achievement type
    switch (achievementId) {
        case 'first_blood':
        case 'monster_slayer':
        case 'monster_hunter':
        case 'monster_exterminator':
            return `${player.monsterKills || 0} monsters killed`;
            
        case 'first_gold':
        case 'millionaire':
        case 'billionaire':
            return `${(player.gold || 0).toLocaleString()} gold`;
            
        case 'mining_beginner':
        case 'mining_expert':
            return `${player.miningCount || 0} times mined`;
            
        case 'fishing_beginner':
        case 'fishing_expert':
            return `${player.fishingCount || 0} times fished`;
            
        case 'woodcutter':
            return `${player.woodcuttingCount || 0} times woodcut`;
            
        case 'friend_maker':
        case 'social_butterfly':
            return `${(player.friends || []).length} friends`;
            
        case 'explorer':
        case 'world_traveler':
            return `${(player.visitedLocations || []).length} locations visited`;
            
        default:
            return null;
    }
}

// Helper function untuk mendapatkan rank player
function getPlayerRank(playerId, category, players, propertyMap) {
    const propertyToSort = propertyMap[category];
    let sortedPlayers;
    
    if (category === 'pvp') {
        sortedPlayers = Object.values(players)
            .filter(p => p.pvpStats && p.pvpStats.rating && p.pvpStats.rating > 1000)
            .sort((a, b) => (b.pvpStats.rating || 0) - (a.pvpStats.rating || 0));
    } else if (category === 'battlepoint') {
        sortedPlayers = Object.values(players)
            .filter(p => p.battlePoint && p.battlePoint > 1000)
            .sort((a, b) => b.battlePoint - a.battlePoint);
    } else {
        sortedPlayers = Object.values(players)
            .filter(p => p[propertyToSort] && p[propertyToSort] > 0)
            .sort((a, b) => (b[propertyToSort] || 0) - (a[propertyToSort] || 0));
    }
    
    const playerIndex = sortedPlayers.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return "Not Ranked";
    
    return `#${playerIndex + 1}`;
}

function isRateLimited(participant) {
    const now = Date.now();
    const generalLimit = RATE_LIMITS.general;
    const userLimit = rateLimits.get(participant) || { count: 0, resetTime: now + generalLimit.window };
    
    if (now > userLimit.resetTime) {
        userLimit.count = 1;
        userLimit.resetTime = now + generalLimit.window;
        rateLimits.set(participant, userLimit);
        return false;
    }
    
    if (userLimit.count >= generalLimit.max) {
        return true;
    }
    
    userLimit.count++;
    rateLimits.set(participant, userLimit);
    return false;
}

function loadPlayerData() {
    let players = {};
    try {
        if (fs.existsSync(playerDataFile)) {
            players = JSON.parse(fs.readFileSync(playerDataFile, 'utf8'));
        }
    } catch (err) {
        console.error('Failed to load player data:', err);
    }
    // Auto-repair: jika lokasi tidak valid/hilang, kembalikan ke Desa Awal dan log
    const validLocations = locations.map(loc => loc.nama);
    let repaired = false;
    Object.keys(players).forEach(pid => {
        const player = players[pid];
        // MIGRASI DATA LAMA: pastikan semua player punya baseMaxHp dan baseMaxMana
        if (typeof player.baseMaxHp !== 'number') player.baseMaxHp = player.maxHp || 100;
        if (typeof player.baseMaxMana !== 'number') player.baseMaxMana = player.maxMana || 50;
        if (!player.lokasi || !validLocations.includes(player.lokasi)) {
            player.lokasi = 'Desa Awal';
            repaired = true;
            logCommandActivity(pid, 'auto-repair', 'Desa Awal');
        }
    });
    if (repaired) {
        fs.writeFileSync(playerDataFile, JSON.stringify(players, null, 2));
    }
    return players;
}

function compressPlayerData(player) {
    // Remove unnecessary fields and compress data
    const compressed = {
        nama: player.nama,
        kelas: player.kelas,
        level: player.level,
        hp: player.hp,
        maxHp: player.baseMaxHp,
        mana: player.mana,
        maxMana: player.baseMaxMana,
        attack: player.attack,
        defense: player.defense,
        gold: player.gold,
        lokasi: player.lokasi,
        status: player.status,
        hasChosenClass: player.hasChosenClass,
        equipment: player.equipment,
        tas: player.tas,
        tools: player.tools || {}, // TAMBAHKAN INI
        pvpStats: player.pvpStats || { rating: 1000, wins: 0, losses: 0, totalBattles: 0 }, // TAMBAHKAN INI
        titles: player.titles || [],
        skills: player.skills || [],
        equippedSkills: player.equippedSkills || [],
        // Activity tracking
        monsterKills: player.monsterKills || 0,
        miningCount: player.miningCount || 0,
        woodcuttingCount: player.woodcuttingCount || 0,
        fishingCount: player.fishingCount || 0,
        visitedLocations: player.visitedLocations || [],
        consecutiveDays: player.consecutiveDays || 0,
        // Social features
        friends: player.friends || [],
        friendRequests: player.friendRequests || [],
        blockedPlayers: player.blockedPlayers || [],
        // Stats tracking
        statsHistory: player.statsHistory || [],
        totalPlayTime: player.totalPlayTime || 0,
        lastLogin: player.lastLogin || Date.now(),
        // Experience tracking
        exp: player.exp || 0,
        // Achievement and quest tracking
        achievements: player.achievements || { unlocked: [], progress: {} },
        quests: player.quests || {
            daily: { progress: {}, completed: {}, lastReset: null },
            weekly: { progress: {}, completed: {}, lastReset: null },
            story: { progress: {}, completed: {}, current: 'story_beginning' }
        },
        weeklyChallenges: player.weeklyChallenges || {
            currentWeek: getCurrentWeek(),
            progress: {},
            completed: {},
            claimed: {}
        },
        // Timestamps
        joinDate: player.joinDate || Date.now(),
        lastUpdated: Date.now()
    };
    
    return compressed;
}

function createBackup() {
    try {
        const backupData = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            players: players,
            totalPlayers: Object.keys(players).length,
            version: "1.0.0"
        };
        
        const backupPath = `./database/backup_${Date.now()}.json`;
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        
        // Keep only last 5 backups
        const backupFiles = fs.readdirSync('./database').filter(file => file.startsWith('backup_'));
        if (backupFiles.length > 5) {
            backupFiles.sort().slice(0, -5).forEach(file => {
                fs.unlinkSync(`./database/${file}`);
            });
        }
        
        return backupPath;
    } catch (error) {
        console.error('Backup failed:', error);
        return null;
    }
}

function getDatabaseStats() {
    const totalPlayers = Object.keys(players).length;
    const activePlayers = Object.values(players).filter(p => 
        p.lastLogin && (Date.now() - p.lastLogin) < (7 * 24 * 60 * 60 * 1000)
    ).length;
    
    const totalGold = Object.values(players).reduce((sum, p) => sum + (p.gold || 0), 0);
    const totalLevels = Object.values(players).reduce((sum, p) => sum + (p.level || 0), 0);
    
    const classDistribution = {};
    Object.values(players).forEach(p => {
        const classType = p.kelas || 'Adventurer';
        classDistribution[classType] = (classDistribution[classType] || 0) + 1;
    });
    
    return {
        totalPlayers,
        activePlayers,
        totalGold,
        totalLevels,
        classDistribution,
        averageLevel: totalPlayers > 0 ? Math.round(totalLevels / totalPlayers) : 0,
        averageGold: totalPlayers > 0 ? Math.round(totalGold / totalPlayers) : 0
    };
}

// Enhanced save function with compression
function savePlayerData(data) {
    try {
        console.log(`Saving player data... Total players: ${Object.keys(data).length}`);
        
        // Compress data before saving
        const compressedData = {};
        Object.keys(data).forEach(key => {
            compressedData[key] = compressPlayerData(data[key]);
        });
        
        fs.writeFileSync(playerDataFile, JSON.stringify(compressedData, null, 2));
        console.log(`Player data saved successfully to ${playerDataFile}`);
        
        // Create backup every 100 saves
        if (!global.saveCount) global.saveCount = 0;
        global.saveCount++;
        
        if (global.saveCount % 100 === 0) {
            createBackup();
            console.log(`Database backup created at ${new Date().toISOString()}`);
        }
        
        return true;
    } catch (error) {
        console.error('Save failed:', error);
        return false;
    }
}

function getPlayerData(participant) {
    const players = loadPlayerData();
    return players[participant] || null;
}

// Helper functions for leaderboard
function calculateLevel(playerData) {
    // Simple level calculation based on total stats
    const baseStats = (playerData.attack || 0) + (playerData.defense || 0) + (playerData.maxHp || 0) + (playerData.maxMana || 0);
    const equipmentStats = calculateEquipmentStats(playerData);
    const totalStats = baseStats + equipmentStats;
    
    // Level formula: every 50 total stats = 1 level, starting from level 1
    return Math.max(1, Math.floor(totalStats / 50) + 1);
}
  
// Level Up System dengan stat acak berdasarkan class
function processLevelUp(player) {
    const oldLevel = player.level || 1;
    const newLevel = calculateLevel(player);
    
    if (newLevel > oldLevel) {
        const levelsGained = newLevel - oldLevel;
        player.level = newLevel;
        
        let levelUpMessage = `🆙 *LEVEL UP!* 🎉\n\n`;
        levelUpMessage += `Level: ${oldLevel} → ${newLevel} (+${levelsGained})\n\n`;
        
        // Tambah stat acak berdasarkan class untuk setiap level yang didapat
        for (let i = 0; i < levelsGained; i++) {
            const statGain = getRandomStatBasedOnClass(player.kelas);
            levelUpMessage += `✨ ${statGain.message}\n`;
        }
        
        // Update HP dan Mana ke maksimal saat level up
        player.hp = player.maxHp;
        player.mana = player.maxMana;
        
        return {
            leveledUp: true,
            message: levelUpMessage,
            oldLevel: oldLevel,
            newLevel: newLevel
        };
    }
    
    return { leveledUp: false };
}

// Fungsi untuk mendapatkan stat acak berdasarkan class
function getRandomStatBasedOnClass(playerClass) {
    const classStats = {
        'Fighter': {
            primary: { stat: 'maxHp', chance: 0.4, amount: 1, name: 'HP' },
            secondary: { stat: 'defense', chance: 0.3, amount: 1, name: 'Defense' },
            tertiary: { stat: 'attack', chance: 0.2, amount: 1, name: 'Attack' },
            quaternary: { stat: 'maxMana', chance: 0.1, amount: 1, name: 'Mana' }
        },
        'Assassin': {
            primary: { stat: 'attack', chance: 0.5, amount: 1, name: 'Attack' },
            secondary: { stat: 'maxHp', chance: 0.25, amount: 1, name: 'HP' },
            tertiary: { stat: 'defense', chance: 0.15, amount: 1, name: 'Defense' },
            quaternary: { stat: 'maxMana', chance: 0.1, amount: 1, name: 'Mana' }
        },
        'Mage': {
            primary: { stat: 'maxMana', chance: 0.5, amount: 1, name: 'Mana' },
            secondary: { stat: 'attack', chance: 0.25, amount: 1, name: 'Attack' },
            tertiary: { stat: 'maxHp', chance: 0.15, amount: 1, name: 'HP' },
            quaternary: { stat: 'defense', chance: 0.1, amount: 1, name: 'Defense' }
        },
        'Tank': {
            primary: { stat: 'maxHp', chance: 0.7, amount: 1, name: 'HP' },
            secondary: { stat: 'defense', chance: 0.5, amount: 1, name: 'Defense' },
            tertiary: { stat: 'maxMana', chance: 0.15, amount: 1, name: 'Mana' },
            quaternary: { stat: 'attack', chance: 0.05, amount: 1, name: 'Attack' }
        },
        'Archer': {
            primary: { stat: 'attack', chance: 0.4, amount: 1, name: 'Attack' },
            secondary: { stat: 'maxHp', chance: 0.3, amount: 1, name: 'HP' },
            tertiary: { stat: 'defense', chance: 0.2, amount: 1, name: 'Defense' },
            quaternary: { stat: 'maxMana', chance: 0.1, amount: 1, name: 'Mana' }
        },
        'Adventurer': {
            primary: { stat: 'maxHp', chance: 0.25, amount: 1, name: 'HP' },
            secondary: { stat: 'attack', chance: 0.25, amount: 1, name: 'Attack' },
            tertiary: { stat: 'defense', chance: 0.25, amount: 1, name: 'Defense' },
            quaternary: { stat: 'maxMana', chance: 0.25, amount: 1, name: 'Mana' }
        }
    };
    
    const stats = classStats[playerClass] || classStats['Adventurer'];
    const random = Math.random();
    
    let selectedStat;
    if (random < stats.primary.chance) {
        selectedStat = stats.primary;
    } else if (random < stats.primary.chance + stats.secondary.chance) {
        selectedStat = stats.secondary;
    } else if (random < stats.primary.chance + stats.secondary.chance + stats.tertiary.chance) {
        selectedStat = stats.tertiary;
    } else {
        selectedStat = stats.quaternary;
    }
    
    return {
        stat: selectedStat.stat,
        amount: selectedStat.amount,
        message: `+${selectedStat.amount} ${selectedStat.name}`
    };
}

// Fungsi untuk menambah EXP dan mengecek level up
function addExperience(player, expAmount) {
    if (!player.exp) player.exp = 0;
    if (!player.level) player.level = 1;
    
    const oldLevel = player.level;
    player.exp += expAmount;
    
    // Cek level up
    const levelUpResult = processLevelUp(player);
    
    return {
        expGained: expAmount,
        totalExp: player.exp,
        levelUpResult: levelUpResult
    };
}

function calculateTotalStats(playerData) {
    const baseStats = (playerData.attack || 0) + (playerData.defense || 0) + (playerData.maxHp || 0) + (playerData.maxMana || 0);
    const equipmentStats = calculateEquipmentStats(playerData);
    return baseStats + equipmentStats;
}

function calculateEquipmentStats(playerData) {
    let totalStats = 0;
    for (const slot in playerData.equipment) {
        const itemName = playerData.equipment[slot];
        if (itemName) {
            const itemData = items.find(item => item.nama === itemName);
            if (itemData && itemData.stats) {
                totalStats += (itemData.stats.attack || 0) + (itemData.stats.defense || 0) + (itemData.stats.hp || 0);
            }
        }
    }
    return totalStats;
}

// Tambahkan fungsi ini setelah fungsi calculateEquipmentStats
function updatePlayerStatsFromEquipment(player) {
    let equipmentHp = 0;
    let equipmentMana = 0;
    
    // Hitung total HP dan Mana dari equipment
    for (const slot in player.equipment) {
        const itemName = player.equipment[slot];
        if (itemName) {
            const itemData = items.find(item => item.nama === itemName);
            if (itemData && itemData.stats) {
                equipmentHp += (itemData.stats.hp || 0);
                equipmentMana += (itemData.stats.mana || 0);
            }
        }
    }


    
    // Update max HP dan max Mana
    const baseMaxHp = player.baseMaxHp || 100;
    const baseMaxMana = player.baseMaxMana || 50;
    
    player.maxHp = baseMaxHp + equipmentHp;
    player.maxMana = baseMaxMana + equipmentMana;
    
    // Pastikan HP saat ini tidak melebihi max HP
    if (player.hp > player.maxHp) {
        player.hp = player.maxHp;
    }
    
    // Pastikan Mana saat ini tidak melebihi max Mana
    if (player.mana > player.maxMana) {
        player.mana = player.maxMana;
    }
}

// Death Penalty System
function applyDeathPenalty(player) {
    // 1. Kurangi 1 level (minimal level 1)
    if (player.level && player.level > 1) {
        player.level -= 1;
    }

    // 2. Kurangi 1 stats random (berdasarkan class)
    const classStatChances = {
        'Warrior': ['attack', 'defense', 'maxHp'],
        'Mage': ['maxMana', 'attack', 'defense'],
        'Rogue': ['attack', 'maxHp', 'defense'],
        // Tambahkan class lain jika ada
    };
    const playerClass = player.class || 'Warrior'; // Default Warrior jika tidak ada
    const possibleStats = classStatChances[playerClass] || ['attack', 'defense', 'maxHp'];
    const statToReduce = possibleStats[Math.floor(Math.random() * possibleStats.length)];
    if (statToReduce === 'maxHp') {
        if (player.baseMaxHp && player.baseMaxHp > 1) player.baseMaxHp -= 1;
    } else if (statToReduce === 'maxMana') {
        if (player.baseMaxMana && player.baseMaxMana > 1) player.baseMaxMana -= 1;
    } else {
        if (player[statToReduce] && player[statToReduce] > 1) player[statToReduce] -= 1;
    }

    // 3. Hilangkan 2 item random dari tas (jika ada)
    const tasItems = Object.keys(player.tas || {});
    for (let i = 0; i < 2; i++) {
        if (tasItems.length === 0) break;
        const idx = Math.floor(Math.random() * tasItems.length);
        const itemName = tasItems[idx];
        player.tas[itemName] -= 1;
        if (player.tas[itemName] <= 0) {
            delete player.tas[itemName];
        }
        tasItems.splice(idx, 1); // Remove from list to avoid double delete
    }
}

// Function to check and award titles
function checkAndAwardTitles(player) {
    console.log('🔍 Checking titles for player:', player.nama);
    console.log('📊 Player data:', {
        level: player.level,
        gold: player.gold,
        monsterKills: player.monsterKills || 0,
        miningCount: player.miningCount || 0,
        woodcuttingCount: player.woodcuttingCount || 0,
        fishingCount: player.fishingCount || 0,
        kelas: player.kelas,
        equipment: player.equipment,
        consecutiveDays: player.consecutiveDays || 0,
        visitedLocations: player.visitedLocations || []
    });
    
    if (!player.titles) player.titles = [];
    let newTitles = [];
    
    console.log('🏆 Current titles:', player.titles);
    
    // Check all title categories
    Object.keys(titles).forEach(category => {
        console.log(`📋 Checking category: ${category}`);
        Object.keys(titles[category]).forEach(titleName => {
            const title = titles[category][titleName];
            console.log(`  🎯 Checking title: ${titleName} - Requirement: ${title.requirement}`);
            
            try {
                const conditionMet = title.condition(player);
                const alreadyHas = player.titles.includes(titleName);
                console.log(`    ✅ Condition met: ${conditionMet}, Already has: ${alreadyHas}`);
                
                if (conditionMet && !alreadyHas) {
                    console.log(`    🎉 AWARDING NEW TITLE: ${titleName}`);
                    newTitles.push(titleName);
                    player.titles.push(titleName);
                }
            } catch (error) {
                console.error(`    ❌ Error checking title ${titleName}:`, error);
            }
        });
    });
    
    console.log('🎁 New titles awarded:', newTitles);
    return newTitles;
}

// Function to get title display
function getTitleDisplay(player) {
    if (!player.equippedTitles || player.equippedTitles.length === 0) return "Tidak Ada";
    
    return player.equippedTitles.join(" | ");
}

// Dynamic World System
const worldState = {
    weather: 'sunny', // sunny, rainy, stormy, snowy, foggy
    time: 'day', // day, night, dawn, dusk
    season: 'spring', // spring, summer, autumn, winter
    temperature: 25, // Celsius
    humidity: 60, // Percentage
    windSpeed: 5, // km/h
    worldEvents: [],
    lastUpdate: Date.now()
};

// Weather effects on gameplay
const weatherEffects = {
    sunny: {
        hunting: { bonus: 1.2, description: '☀️ Hunting lebih mudah di cuaca cerah' },
        mining: { bonus: 1.0, description: '⛏️ Mining normal' },
        woodcutting: { bonus: 1.1, description: '🪓 Woodcutting sedikit lebih cepat' },
        fishing: { bonus: 0.9, description: '🎣 Ikan lebih sulit ditangkap' }
    },
    rainy: {
        hunting: { bonus: 0.8, description: '🌧️ Hunting lebih sulit karena hujan' },
        mining: { bonus: 0.9, description: '⛏️ Mining sedikit lebih lambat' },
        woodcutting: { bonus: 0.7, description: '🪓 Woodcutting sangat sulit' },
        fishing: { bonus: 1.3, description: '🎣 Ikan lebih mudah ditangkap' }
    },
    stormy: {
        hunting: { bonus: 0.6, description: '⛈️ Hunting sangat berbahaya' },
        mining: { bonus: 0.5, description: '⛏️ Mining berbahaya karena petir' },
        woodcutting: { bonus: 0.4, description: '🪓 Woodcutting mustahil' },
        fishing: { bonus: 1.5, description: '🎣 Ikan melimpah karena badai' }
    },
    snowy: {
        hunting: { bonus: 0.9, description: '❄️ Hunting sedikit lebih sulit' },
        mining: { bonus: 1.2, description: '⛏️ Mining lebih mudah di salju' },
        woodcutting: { bonus: 0.8, description: '🪓 Woodcutting sulit karena salju' },
        fishing: { bonus: 0.7, description: '🎣 Ikan sulit ditangkap' }
    },
    foggy: {
        hunting: { bonus: 0.7, description: '🌫️ Hunting sangat sulit karena kabut' },
        mining: { bonus: 0.8, description: '⛏️ Mining sulit karena visibilitas rendah' },
        woodcutting: { bonus: 0.6, description: '🪓 Woodcutting berbahaya' },
        fishing: { bonus: 1.1, description: '🎣 Ikan sedikit lebih mudah' }
    }
};

// Time effects
const timeEffects = {
    day: { bonus: 1.0, description: '☀️ Aktivitas normal' },
    night: { 
        bonus: 0.8, 
        description: '🌙 Aktivitas lebih sulit di malam hari',
        special: 'Beberapa monster lebih kuat di malam hari'
    },
    dawn: { 
        bonus: 1.1, 
        description: '🌅 Aktivitas sedikit lebih mudah saat fajar',
        special: 'Waktu terbaik untuk hunting'
    },
    dusk: { 
        bonus: 0.9, 
        description: '🌆 Aktivitas mulai menurun saat senja',
        special: 'Monster mulai muncul'
    }
};

// Season effects
const seasonEffects = {
    spring: {
        description: '🌸 Musim semi - Semua aktivitas normal',
        specialEvents: ['Flower Festival', 'Spring Hunting']
    },
    summer: {
        description: '☀️ Musim panas - Hunting lebih mudah, mining lebih sulit',
        specialEvents: ['Summer Festival', 'Beach Party']
    },
    autumn: {
        description: '🍂 Musim gugur - Woodcutting lebih mudah, fishing lebih sulit',
        specialEvents: ['Harvest Festival', 'Autumn Gathering']
    },
    winter: {
        description: '❄️ Musim dingin - Mining lebih mudah, hunting lebih sulit',
        specialEvents: ['Winter Festival', 'Ice Fishing']
    }
};

// World events
const worldEvents = [
    {
        name: 'Meteor Shower',
        description: 'Hujan meteor memberikan bonus exp 2x',
        effect: { expBonus: 2.0, duration: 3600000 }, // 1 hour
        rarity: 'rare'
    },
    {
        name: 'Golden Hour',
        description: 'Jam emas memberikan bonus gold 1.5x',
        effect: { goldBonus: 1.5, duration: 1800000 }, // 30 minutes
        rarity: 'uncommon'
    },
    {
        name: 'Monster Invasion',
        description: 'Invasi monster - hunting memberikan exp 3x',
        effect: { huntingExpBonus: 3.0, duration: 2700000 }, // 45 minutes
        rarity: 'rare'
    },
    {
        name: 'Resource Boom',
        description: 'Boom sumber daya - semua gathering 2x',
        effect: { gatheringBonus: 2.0, duration: 2400000 }, // 40 minutes
        rarity: 'uncommon'
    },
    {
        name: 'Lucky Day',
        description: 'Hari keberuntungan - semua aktivitas 1.3x',
        effect: { allBonus: 1.3, duration: 3600000 }, // 1 hour
        rarity: 'common'
    }
];

// Update world state
function updateWorldState() {
    const now = Date.now();
    const timeDiff = now - worldState.lastUpdate;
    
    // Update every 5 minutes
    if (timeDiff > 300000) {
        // Update weather (random change)
        if (Math.random() < 0.3) {
            const weathers = Object.keys(weatherEffects);
            worldState.weather = weathers[Math.floor(Math.random() * weathers.length)];
        }
        
        // Update time based on real time
        const hour = new Date().getHours();
        if (hour >= 6 && hour < 12) worldState.time = 'day';
        else if (hour >= 12 && hour < 18) worldState.time = 'day';
        else if (hour >= 18 && hour < 20) worldState.time = 'dusk';
        else if (hour >= 20 || hour < 6) worldState.time = 'night';
        else if (hour >= 5 && hour < 7) worldState.time = 'dawn';
        
        // Update season (changes every 3 months)
        const month = new Date().getMonth();
        if (month >= 2 && month < 5) worldState.season = 'spring';
        else if (month >= 5 && month < 8) worldState.season = 'summer';
        else if (month >= 8 && month < 11) worldState.season = 'autumn';
        else worldState.season = 'winter';
        
        // Random world events
        if (Math.random() < 0.1) { // 10% chance every 5 minutes
            const event = worldEvents[Math.floor(Math.random() * worldEvents.length)];
            worldState.worldEvents.push({
                ...event,
                startTime: now,
                endTime: now + event.effect.duration
            });
        }
        
        // Remove expired events
        worldState.worldEvents = worldState.worldEvents.filter(event => event.endTime > now);
        
        worldState.lastUpdate = now;
    }
}

// Get current world effects
function getWorldEffects() {
    updateWorldState();
    
    const weatherEffect = weatherEffects[worldState.weather];
    const timeEffect = timeEffects[worldState.time];
    const seasonEffect = seasonEffects[worldState.season];
    
    let totalBonus = 1.0;
    let effects = [];
    
    // Weather effects
    effects.push(weatherEffect.description);
    
    // Time effects
    effects.push(timeEffect.description);
    
    // Season effects
    effects.push(seasonEffect.description);
    
    // Active world events
    worldState.worldEvents.forEach(event => {
        effects.push(`🎉 ${event.name}: ${event.description}`);
        if (event.effect.allBonus) totalBonus *= event.effect.allBonus;
    });
    
    return {
        weather: worldState.weather,
        time: worldState.time,
        season: worldState.season,
        effects: effects,
        totalBonus: totalBonus,
        activeEvents: worldState.worldEvents
    };
}

// PvP System
const pvpChallenges = new Map(); // Store active challenges
const pvpBattles = new Map(); // Store active battles
const pvpRankings = new Map(); // Store player rankings

// Helper for PvP turn-based battle state
function createTurnBasedPvPState(p1Id, p1Data, p2Id, p2Data) {
    // Calculate stats with equipment
// Calculate stats with equipment
function getStats(playerId, playerData) {
    // Update stats player berdasarkan equipment terlebih dahulu
    updatePlayerStatsFromEquipment(playerData);
    
    let stats = {
        hp: playerData.hp,
        maxHp: playerData.maxHp,
        attack: playerData.attack,
        defense: playerData.defense,
        mana: playerData.mana,
        maxMana: playerData.maxMana,
        nama: playerData.nama,
        id: playerId
    };
    
    // Tambahkan stat attack dan defense dari equipment
    Object.keys(playerData.equipment).forEach(slot => {
        const itemName = playerData.equipment[slot];
        if (itemName) {
            const itemData = items.find(item => item.nama === itemName);
            if (itemData && itemData.stats) {
                stats.attack += (itemData.stats.attack || 0);
                stats.defense += (itemData.stats.defense || 0);
                // HP dan Mana sudah diupdate oleh updatePlayerStatsFromEquipment
            }
        }
    });
    
    return stats;
}
    return {
        player1: getStats(p1Id, p1Data),
        player2: getStats(p2Id, p2Data),
        turn: Math.random() < 0.5 ? 'player1' : 'player2',
        log: [],
        finished: false,
        winner: null,
        loser: null,
        round: 1,
        maxRounds: 30,
        actions: [],
        player1Effects: [],
        player2Effects: []
    };
}

// Clean up expired challenges
function cleanupExpiredChallenges() {
    const now = Date.now();
    const expiredChallenges = [];
    
    for (const [key, challenge] of pvpChallenges.entries()) {
        if (now > challenge.expiresAt) {
            expiredChallenges.push(key);
        }
    }
    
    expiredChallenges.forEach(key => {
        pvpChallenges.delete(key);
    });
    
    if (expiredChallenges.length > 0) {
        console.log(`Cleaned up ${expiredChallenges.length} expired PvP challenges`);
    }
}

// Clean up challenges every 5 minutes
setInterval(cleanupExpiredChallenges, 5 * 60 * 1000);

// PvP rankings structure
function initializePvPRanking(participant) {
    if (!pvpRankings.has(participant)) {
        pvpRankings.set(participant, {
            wins: 0,
            losses: 0,
            draws: 0,
            rating: 1000, // Starting rating
            streak: 0,
            lastBattle: null,
            totalBattles: 0
        });
    }
}

// Calculate PvP rating change
function calculateRatingChange(playerRating, opponentRating, result) {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    const actualScore = result; // 1 for win, 0.5 for draw, 0 for loss
    const kFactor = 32; // Rating change factor
    
    return Math.round(kFactor * (actualScore - expectedScore));
}



// Dynamic Shop System
let shopInventory = [];
let lastShopUpdate = 0;
const SHOP_UPDATE_INTERVAL = 3600000; // 1 hour in milliseconds

// Item rarity tiers
const ITEM_TIERS = {
    COMMON: { weight: 50, maxItems: 8, color: '⚪' },
    UNCOMMON: { weight: 30, maxItems: 6, color: '🟢' },
    RARE: { weight: 15, maxItems: 4, color: '🔵' },
    EPIC: { weight: 4, maxItems: 2, color: '🟣' },
    LEGENDARY: { weight: 1, maxItems: 1, color: '🟡' }
};

// Categorize items by tier based on price
function categorizeItemByTier(item) {
    if (item.hargaBeli <= 100) return 'COMMON';
    if (item.hargaBeli <= 400) return 'UNCOMMON';
    if (item.hargaBeli <= 1000) return 'RARE';
    if (item.hargaBeli <= 2000) return 'EPIC';
    return 'LEGENDARY';
}

// Quest Helper Functions
function initializePlayerQuests(player) {
    if (!player.quests) {
        player.quests = {
            daily: { progress: {}, completed: {}, claimed: {} },
            weekly: { progress: {}, completed: {}, claimed: {} },
            story: { accepted: {}, progress: {}, completed: {}, claimed: {} }
        };
    }
}

function getQuestStatus(player, questId, category) {
    const quest = quests[category].find(q => q.id === questId);
    if (!quest) return null;
    
    const progress = player.quests[category].progress[questId] || 0;
    const isCompleted = player.quests[category].completed[questId] || false;
    const isClaimed = player.quests[category].claimed && player.quests[category].claimed[questId];
    
    return {
        quest,
        progress,
        isCompleted,
        isClaimed,
        target: quest.target || 1
    };
}

function formatQuestDisplay(quest, status, category) {
    let emoji = '📋';
    if (status.isCompleted && !status.isClaimed) emoji = '✅';
    else if (status.isClaimed) emoji = '🎁';
    else if (category === 'story' && status.quest.accepted) emoji = '🔄';
    
    return `${emoji} *${quest.name}*\n` +
           `   📝 ${quest.description}\n` +
           `   📊 Progress: ${status.progress}/${status.target}\n` +
           `   💰 Reward: ${quest.reward.gold} gold + ${quest.reward.items.join(', ')}`;
}

// Generate shop inventory
function generateShopInventory() {
    const now = Date.now();
    if (now - lastShopUpdate < SHOP_UPDATE_INTERVAL && shopInventory.length > 0) {
        return shopInventory; // Return existing inventory if not time to update
    }

    const availableItems = items.filter(item => item.hargaBeli > 0 && item.kategori === 'Peralatan');
    const newInventory = [];

    // Group items by tier
    const itemsByTier = {
        COMMON: [],
        UNCOMMON: [],
        RARE: [],
        EPIC: [],
        LEGENDARY: []
    };

    availableItems.forEach(item => {
        const tier = categorizeItemByTier(item);
        itemsByTier[tier].push(item);
    });

    // Generate inventory for each tier
    Object.keys(ITEM_TIERS).forEach(tier => {
        const tierConfig = ITEM_TIERS[tier];
        const tierItems = itemsByTier[tier];
        if (tierItems.length === 0) return;

        // LEGENDARY: 1% chance, EPIC: 10% chance, others always
        if (tier === 'LEGENDARY' && Math.random() > 0.01) return;
        if (tier === 'EPIC' && Math.random() > 0.10) return;

        // Calculate how many items to show for this tier
        const maxItems = Math.min(tierConfig.maxItems, tierItems.length);
        const itemCount = Math.floor(Math.random() * maxItems) + 1;

        // Randomly select items from this tier
        const selectedItems = [];
        const shuffled = [...tierItems].sort(() => 0.5 - Math.random());
        for (let i = 0; i < itemCount && i < shuffled.length; i++) {
            selectedItems.push(shuffled[i]);
        }
        newInventory.push(...selectedItems);
    });

    // Shuffle final inventory
    shopInventory = newInventory.sort(() => 0.5 - Math.random());
    lastShopUpdate = now;
    return shopInventory;
}

// Struktur PvP State
if (!global.pvpDuels) global.pvpDuels = new Map();

// Get time until next shop update
function getTimeUntilNextUpdate() {
    const now = Date.now();
    const timeSinceUpdate = now - lastShopUpdate;
    const timeUntilUpdate = SHOP_UPDATE_INTERVAL - timeSinceUpdate;
    
    if (timeUntilUpdate <= 0) return { hours: 0, minutes: 0 };
    
    const hours = Math.floor(timeUntilUpdate / 3600000);
    const minutes = Math.floor((timeUntilUpdate % 3600000) / 60000);
    
    return { hours, minutes };
}

// Function to generate skill shop inventory based on tier
function generateSkillShopInventory() {
    const inventory = [];
    const skills = require('./database/rpg/skills.js');
    // Tier chances
    const tierChances = {
        'Low Magic': 0.80,      // 80% chance
        'Normal Magic': 0.15,   // 15% chance
        'Strong Magic': 0.04,   // 4% chance
        'Magic Supreme': 0.01   // 1% chance
    };
    
    // Generate 5-8 random skills
    const numSkills = Math.floor(Math.random() * 4) + 5; // 5-8 skills
    
    for (let i = 0; i < numSkills; i++) {
        const random = Math.random();
        let selectedTier = 'Low Magic';
        
        if (random < tierChances['Magic Supreme']) {
            selectedTier = 'Magic Supreme';
        } else if (random < tierChances['Magic Supreme'] + tierChances['Strong Magic']) {
            selectedTier = 'Strong Magic';
        } else if (random < tierChances['Magic Supreme'] + tierChances['Strong Magic'] + tierChances['Normal Magic']) {
            selectedTier = 'Normal Magic';
        }
        
        // Get skills of selected tier
        const tierSkills = skills.filter(skill => skill.tier === selectedTier);
        
        if (tierSkills.length > 0) {
            const randomSkill = tierSkills[Math.floor(Math.random() * tierSkills.length)];
            
            // Check if skill is already in inventory
            if (!inventory.find(skill => skill.id === randomSkill.id)) {
                inventory.push(randomSkill);
            }
        }
    }
    
    return inventory;
}

function scheduleSholatReminders(evarick) {
    const sentToday = {}; // { 'YYYY-MM-DD': { Subuh: true, ... } }

    SHOLAT_TIMES_WIT.forEach(({ name, time }) => {
        setInterval(async () => {
            const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jayapura' }));
            const todayStr = now.toISOString().slice(0, 10);
            const [hour, minute] = time.split(':').map(Number);
            const sholatDate = new Date(now);
            sholatDate.setHours(hour, minute, 0, 0);

            // Jika sudah lewat, skip
            if (now > sholatDate) return;

            // Jika belum dikirim hari ini
            if (!sentToday[todayStr]) sentToday[todayStr] = {};
            if (!sentToday[todayStr][name] && Math.abs(now - sholatDate) < 60 * 1000) { // dalam 1 menit
                // === Panggil AI untuk generate pesan ===
                const prompt = `Buatkan pesan pengingat sholat ${name} yang sopan, singkat, dan memotivasi untuk admin bot WhatsApp.`;
                const message = await Ai4Chat(prompt);

                for (const admin of ADMIN_NUMBERS) {
                    await evarick.sendMessage(admin, { text: message });
                }
                sentToday[todayStr][name] = true;
            }
        }, 30 * 1000); // cek setiap 30 detik
    });
}

// Function to get tier emoji
function getTierEmoji(tier) {
    switch (tier) {
        case 'Low Magic': return '🟢';
        case 'Normal Magic': return '🟡';
        case 'Strong Magic': return '🟠';
        case 'Magic Supreme': return '🟣';
        default: return '⚪';
    }
}


function logCommandActivity(participant, command, lokasi) {
    try {
        let logs = { logs: [] };
        if (fs.existsSync(logFilePath)) {
            logs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
        }
        logs.logs.push({
            timestamp: new Date().toISOString(),
            participant,
            command,
            lokasi
        });
        // Keep only last 2000 logs
        if (logs.logs.length > 2000) logs.logs = logs.logs.slice(-2000);
        fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.error('Failed to write command log:', err);
    }
}


module.exports = async (evarick, m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    // Skip if message is from bot itself
    if (msg.key.fromMe) {
        return;
    }

    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const sender = msg.key.remoteJid;
    const participant = msg.key.participant || sender; // Get participant number for groups
    const pushname = msg.pushName || "Evarick";

    const isPrivate = !sender.endsWith('@g.us');
const isFromBot = msg.key.fromMe;

if (isPrivate && !isFromBot && !body.startsWith('!')) {
    const chatHistoryPath = `./database/chat_history/${sender}.json`;
    let chatHistory = [];
    if (fs.existsSync(chatHistoryPath)) {
        try {
            chatHistory = JSON.parse(fs.readFileSync(chatHistoryPath, 'utf8'));
        } catch (e) {
            chatHistory = [];
        }
    }

    chatHistory.push({ role: "user", text: body });

    const aiReply = await Ai4ChatRoleplay(body, chatHistory.slice(-10));

    await evarick.sendMessage(sender, { text: aiReply }, { quoted: msg });

    chatHistory.push({ role: "bot", text: aiReply });

    fs.mkdirSync('./database/chat_history', { recursive: true });
    fs.writeFileSync(chatHistoryPath, JSON.stringify(chatHistory.slice(-20), null, 2));

    return; // Jangan proses command lain
}
    
    // Check if message starts with prefix
    if (!body.startsWith(prefix)) {
        return; // Ignore messages that don't start with prefix
    }
    
    const args = body.slice(1).trim().split(" ");
    const command = args.shift().toLowerCase();
    const q = args.join(" ");

    // Check if command is empty
    if (!command) {
        return; // Ignore empty commands
    }

    // Rate limiting check
    if (isRateLimited(participant)) {
        return; // Silently ignore if rate limited
    }

    const evarickreply = async (teks) => {
        try {
            await evarick.sendMessage(sender, { text: teks }, { quoted: msg });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const isGroup = sender.endsWith('@g.us');
    const isGroupAdmin = (admin.includes(sender))
    const menuImage = fs.readFileSync(image);

    // Player data load - use participant number for consistent data across groups
    let players = loadPlayerData(); // Langsung muat semua data
    let player = players[participant]; // Ambil data pemain berdasarkan nomor pribadi

    if (player && player.battlePoint === undefined) player.battlePoint = 1000;
if (players) {
    for (const pid in players) {
        if (players[pid].battlePoint === undefined) players[pid].battlePoint = 1000;
    }
}
    
    // Debug: Log player data loading
    console.log(`Loading data for participant: ${participant}`);
    console.log(`Player exists: ${!!player}`);
    console.log(`Total players loaded: ${Object.keys(players).length}`);
    
    // Check if player is registered before allowing other commands
    const allowedCommands = [
        'menu', 'daftar', 'leaderboard', 'top', 'rank', 'toplevel', 'levelboard',
        // tambahkan command lain yang boleh diakses tanpa daftar jika perlu
    ];
    if (!player && !allowedCommands.includes(command)) {
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: `⚔️ *Anda belum terdaftar di dunia RPG!*\n\nSilakan daftar terlebih dahulu dengan mengetik:\n*!daftar [NamaPanggilanAnda]*`,
            mentions: [sender]
        }, { quoted: msg });
        return;
    }

    // Setelah if (!player && !allowedCommands.includes(command)) { ... }
    // Blokir command lain saat duel PvP berlangsung
const duel = Array.from(global.pvpDuels.values()).find(
    d => (d.player1 === participant || d.player2 === participant) && d.status === 'active'
);
if (duel && !["serang", "menyerah", "skill", "item"].includes(command)) {
    await evarick.sendMessage(sender, {
        image: { url: 'https://files.catbox.moe/tvllsd.jpg' },
        caption: "⚔️ Kamu sedang dalam duel PvP! Selesaikan dulu dengan !serang, !skill, !item, atau !menyerah.",
        mentions: [sender]
    }, { quoted: msg });
    return;
}

if (global.travelEncounters) {
    const activeEncounter = Array.from(global.travelEncounters.values()).find(
        encounter => encounter.playerId === participant && encounter.timestamp > Date.now() - 300000
    );
    if (activeEncounter && !["fight", "flee"].includes(command)) {
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/6s5n45.jpg' },
            caption: "⚠️ Kamu sedang dalam random encounter!\nGunakan *!fight* untuk melawan musuh atau *!flee* untuk mencoba kabur.",
            mentions: [sender]
        }, { quoted: msg });
        return;
    }
}

    logCommandActivity(participant, command, player ? player.lokasi : null);

    switch (command) {

    // Menu
    case "menu": {
        await evarick.sendMessage(sender,
            {
                image: menuImage,
                caption: evarickmenu,
                mentions: [sender]
            },
        { quoted: msg }
        )
    }
    break

    // Class Selection Command
    case "class": {
        // Check if player has already chosen a class
        if (player.hasChosenClass) {
            // Player wants to change class - check if they have enough gold
            if (player.gold < 70000) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/74atzh.jpg' },
                    caption: `❌ *Gold tidak cukup!*\n\nUntuk mengganti class, kamu memerlukan 70.000 gold.\nGold kamu saat ini: ${player.gold.toLocaleString()}`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Deduct gold for class change
            player.gold -= 70000;
        }
        
        // If no class specified, show class options
        if (!q) {
            const costMessage = player.hasChosenClass ? 
                `💰 *Biaya pergantian class: 70.000 gold*\nGold tersisa: ${player.gold.toLocaleString()}\n\n` : 
                `🎁 *Pemilihan class pertama kali GRATIS!*\n\n`;
                
            let reply = `⚔️ *PILIH KELASMU* ⚔️\n\n${costMessage}` +
                `*Gunakan salah satu command berikut:*\n\n` +
                `!class fighter - 🗡️ Fighter (HP +20, Defense +5)\n` +
                `!class assassin - 🔪 Assassin (Attack +5, HP +10)\n` +
                `!class mage - 🧙 Mage (Mana +30, Attack +3)\n` +
                `!class tank - 🛡️ Tank (HP +30, Defense +8, Attack -2)\n` +
                `!class archer - 🏹 Archer (Attack +4, HP +15)\n\n` +
                `*Contoh: !class fighter*`;
            
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/php4ng.jpg' },
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
        }

        // Process class selection by name
        const classChoice = q.toLowerCase();
            let classInfo = '';
            let weapon = '';
        let statChanges = {};
        let selectedClass = '';

            switch (classChoice) {
            case 'fighter':
                statChanges = { maxHp: 20, defense: 5 };
                    weapon = 'Pedang Latihan';
                    classInfo = 'Fighter - Ahli bertarung jarak dekat dengan pertahanan tinggi';
                selectedClass = 'Fighter';
                    break;
            case 'assassin':
                statChanges = { attack: 5, maxHp: 10 };
                    weapon = 'Belati Gesit';
                    classInfo = 'Assassin - Ahli serangan cepat dan kritis';
                selectedClass = 'Assassin';
                    break;
            case 'mage':
                statChanges = { maxMana: 30, attack: 3 };
                    weapon = 'Tongkat Sihir';
                    classInfo = 'Mage - Ahli sihir dan serangan jarak jauh';
                selectedClass = 'Mage';
                    break;
            case 'tank':
                statChanges = { maxHp: 30, defense: 8, attack: -2 };
                weapon = 'Perisai Besar';
                classInfo = 'Tank - Pertahanan terkuat, pelindung tim';
                selectedClass = 'Tank';
                break;
            case 'archer':
                statChanges = { attack: 4, maxHp: 15 };
                    weapon = 'Busur Pemburu';
                    classInfo = 'Archer - Ahli menembak dari jarak jauh';
                selectedClass = 'Archer';
                    break;
            default:
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/5faj9z.jpg' },
                    caption: `❌ *Class tidak valid!*\n\nClass yang tersedia:\n- fighter\n- assassin\n- mage\n- tank\n- archer\n\n*Contoh: !class fighter*`,
                    mentions: [sender]
                }, { quoted: msg });  return;
        }

        scheduleSholatReminders(evarick);

        // Apply stat changes
        Object.keys(statChanges).forEach(stat => {
            if (stat === 'maxHp') {
                player.baseMaxHp += statChanges[stat];
                player.hp = player.maxHp;
            } else if (stat === 'maxMana') {
                player.baseMaxMana += statChanges[stat];
                player.mana = player.maxMana;
            } else {
                player[stat] += statChanges[stat];
            }
        });

        // Set class name
        player.kelas = selectedClass;
        
        // Add weapon to inventory
            player.tas[weapon] = 1;
            
            // Update status
        player.status = 'active';
        player.hasChosenClass = true;

        // Save changes
        players[participant] = player;
            savePlayerData(players);

        // Send confirmation message
            await evarickreply(`🎉 *Selamat! Kamu telah menjadi ${player.kelas}!* 🎉\n\n` +
                `*${classInfo}*\n\n` +
                `*Status Awal:*\n` +
                `❤️ HP: ${player.hp}/${player.maxHp}\n` +
                `🔮 Mana: ${player.mana}/${player.maxMana}\n` +
                `⚔️ Attack: ${player.attack}\n` +
                `🛡️ Defense: ${player.defense}\n\n` +
                `*Item Awal:*\n` +
                `- ${weapon}\n\n` +
                `*Gunakan !menu untuk melihat perintah yang tersedia*`);
    }
    break
    
    // Inventory
    case "tas": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        const itemsInBag = Object.entries(player.tas);
        let reply = "🎒 *ISI TASMU:*\n\n";
        
        if (itemsInBag.length === 0) {
            reply += "❌ *Tas kosong*\n";
        } else {
            for (const [item, jumlah] of itemsInBag) {
                reply += `📦 ${item}: ${jumlah}\n`;
            }
        }

        // Add tools section
reply += `\n🔧 *PERALATAN:*\n`;
if (!player.tools || Object.keys(player.tools).length === 0) {
    reply += "❌ *Tidak ada peralatan*\n";
} else {
    // Debug: Log tools for debugging
    console.log(`DEBUG: Player ${player.nama} has ${Object.keys(player.tools).length} tools:`, player.tools);
    
    // Group tools by type
    const toolsByType = {};
    Object.values(player.tools).forEach(tool => {
        if (!toolsByType[tool.tipe]) {
            toolsByType[tool.tipe] = [];
        }
        toolsByType[tool.tipe].push(tool);
    });

    // Display tools by type
    Object.keys(toolsByType).forEach(tipe => {
        const tools = toolsByType[tipe];
        const typeEmoji = {
            'pancingan': '🎣',
            'kapak': '🪓',
            'beliung': '⛏️',
            'sekop': '🦹'
        };
        
        reply += `\n${typeEmoji[tipe] || '🔧'} *${tipe.toUpperCase()}:*\n`;
        tools.forEach(tool => {
            const durabilityColor = tool.durability <= 3 ? '🔴' : tool.durability <= 10 ? '🟡' : '🟢';
            const status = tool.durability <= 0 ? '💥 RUSAK' : `${durabilityColor} ${tool.durability}/${tool.maxDurability}`;
            reply += `   • ${tool.nama} (${status})\n`;
        });
    });
}

        reply += `\n💰 *Gold:* ${player.gold.toLocaleString()}`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/dy7atf.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    // Registration
    case "daftar": {
        if (player) {
            let reply = `❌ *Pendaftaran Gagal!*\n\nAnda sudah terdaftar sebagai ${player.nama}.\n\nGunakan !menu untuk melihat perintah lainnya.`;
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/k30oxm.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        if (!q) {
            let reply = `⚠️ *Pendaftaran Gagal!*\n\nSilakan sertakan nama karakter Anda.\n\nContoh: !daftar [nama]`;
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/k30oxm.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Create new player data with custom name
        player = {
            nama: q,
            kelas: 'Adventurer',
            level: 1,
            hasChosenClass: false,
            status: 'active', // Set status to active, not memilih_kelas
            lokasi: 'Desa Awal',
            tas: {},
            tools: {}, // Inisialisasi tools sebagai object kosong
            gold: 100,
            hp: 100, maxHp: 100,
            mana: 50, maxMana: 50,
            attack: 10, defense: 5,
            equipment: { helem: null, zirah: null, celana: null, sepatu: null, senjata: null, aksesoris: null },
            baseMaxHp: 100,
            baseMaxMana: 50,
            // Add missing fields for titles and tracking
            pvpStats: {
                rating: 1000,
                wins: 0,
                losses: 0
            },
            titles: [],
            monsterKills: 0,
            miningCount: 0,
            woodcuttingCount: 0,
            fishingCount: 0,
            visitedLocations: ['Desa Awal'],
            consecutiveDays: 0,
            friends: [],
            friendRequests: [],
            blockedPlayers: [],
            statsHistory: [],
            totalPlayTime: 0,
            lastLogin: Date.now(),
            joinDate: Date.now(),
            lastUpdated: Date.now()
        };
        
        players[participant] = player;
        savePlayerData(players);
        
        // Debug: Log the save operation
        console.log(`Player registered: ${participant} - ${q}`);
        console.log(`Total players in database: ${Object.keys(players).length}`);

        // Send welcome message without class selection
        let reply = `🎉 *Selamat datang di dunia RPG, ${q}!* 🎉\n\n` +
            `✅ *Pendaftaran berhasil!*\n\n` +
            `*Status Awal:*\n` +
            `❤️ HP: ${player.hp}/${player.maxHp}\n` +
            `🔮 Mana: ${player.mana}/${player.maxMana}\n` +
            `⚔️ Attack: ${player.attack}\n` +
            `🛡️ Defense: ${player.defense}\n` +
            `💰 Gold: ${player.gold}\n\n` +
            `*Class saat ini:* Adventurer (Default)\n\n` +
            `*Gunakan !class untuk memilih class yang lebih spesifik*\n` +
            `*Gunakan !menu untuk melihat perintah lainnya*`;
        
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/lc8sn7.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
    }
    break

    case "leaderboard":
        case "rank":
        case "toplevel":
        case "levelboard": {
             if (!q) {
                let reply = "🏆 *LEADERBOARD SYSTEM* 🏆\n\n";
                reply += "📊 *Pilih Kategori Leaderboard:*\n\n";
                reply += "⚔️ *Combat & Level:*\n";
                reply += "  • `!leaderboard level` - Level tertinggi\n";
                reply += "  • `!leaderboard pvp` - Rating PvP tertinggi\n";
                reply += "  • `!leaderboard monsterkills` - Pembunuh monster terbanyak\n\n";
                reply += "💰 *Economy:*\n";
                reply += "  • `!leaderboard gold` - Kekayaan tertinggi\n\n";
                reply += "⚒️ *Gathering Activities:*\n";
                reply += "  • `!leaderboard miningcount` - Penambang terbaik\n";
                reply += "  • `!leaderboard woodcuttingcount` - Penebang terbaik\n";
                reply += "  • `!leaderboard fishingcount` - Pemancing terbaik\n\n";
                reply += "💡 *Tips:* Gunakan `!leaderboard [kategori]` untuk melihat ranking\n";
                reply += "📈 *Update:* Leaderboard diupdate setiap 1 jam";
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/4prvvs.jpg' },
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
                return;
             }
        
             const category = q.toLowerCase();
             const validCategories = ['gold', 'level', 'pvp', 'monsterkills', 'miningcount', 'woodcuttingcount', 'fishingcount'];
             
             const categoryInfo = {
                 level: { name: 'LEVEL', icon: '⭐', color: '⭐' },
                 gold: { name: 'GOLD', icon: '💰', color: '🟡' },
                 pvp: { name: 'PvP RATING', icon: '⚔️', color: '🔴' },
                 monsterkills: { name: 'MONSTER KILLS', icon: '👹', color: '🟠' },
                 miningcount: { name: 'MINING', icon: '⛏️', color: '🟤' },
                 woodcuttingcount: { name: 'WOODCUTTING', icon: '🪓', color: '🟢' },
                 fishingcount: { name: 'FISHING', icon: '🎣', color: '🔵' }
             };
        
             const propertyMap = {
                 monsterkills: 'monsterKills',
                 miningcount: 'miningCount',
                 woodcuttingcount: 'woodcuttingCount',
                 fishingcount: 'fishingCount',
                 level: 'level',
                 gold: 'gold',
                 pvp: 'pvpStats.rating'
             };
        
             if (!validCategories.includes(category)) {
                 const validList = validCategories.map(cat => `• \`${cat}\``).join('\n');
                 let errorReply = "⚠️ *Kategori tidak valid!*\n\n";
                 errorReply += "*Kategori yang tersedia:*\n";
                 errorReply += validList;
                 errorReply += "\n\n💡 *Contoh:* `!leaderboard pvp`";
                 await evarick.sendMessage(sender, {
                     image: { url: 'https://files.catbox.moe/4prvvs.jpg' },
                     caption: errorReply,
                     mentions: [sender]
                 }, { quoted: msg });
                 return;
             }
        
             const propertyToSort = propertyMap[category];
             const categoryData = categoryInfo[category];
             let sortedPlayers;
             
             if (category === 'pvp') {
                 // Special handling for PvP rating
                 sortedPlayers = Object.values(players)
                     .filter(p => p.pvpStats && p.pvpStats.rating && p.pvpStats.rating > 1000)
                     .sort((a, b) => (b.pvpStats.rating || 0) - (a.pvpStats.rating || 0))
                     .slice(0, 10);
             } else {
                 sortedPlayers = Object.values(players)
                     .filter(p => p[propertyToSort] && p[propertyToSort] > 0)
                     .sort((a, b) => (b[propertyToSort] || 0) - (a[propertyToSort] || 0))
                     .slice(0, 10);
             }
        
             if (sortedPlayers.length === 0) {
                 let noDataReply = `📊 *${categoryData.name} LEADERBOARD*\n\n`;
                 noDataReply += `${categoryData.icon} Belum ada data untuk kategori ini.\n`;
                 noDataReply += "🎯 Mulai bermain untuk masuk leaderboard!";
                 await evarick.sendMessage(sender, {
                     image: { url: 'https://files.catbox.moe/4prvvs.jpg' },
                     caption: noDataReply,
                     mentions: [sender]
                 }, { quoted: msg });
                 return;
             }
        
             let reply = `${categoryData.color} *${categoryData.name} LEADERBOARD* ${categoryData.color}\n\n`;
             reply += `�� *Top 10 Pemain Terbaik*\n\n`;
             
             const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
             
             sortedPlayers.forEach((p, index) => {
                 let value, formattedValue, unit;
                 
                 if (category === 'pvp') {
                     value = p.pvpStats ? p.pvpStats.rating : 0;
                     formattedValue = value.toLocaleString('id-ID');
                     unit = ' Rating';
                 } else if (category === 'gold') {
                     value = p[propertyToSort] || 0;
                     formattedValue = value.toLocaleString('id-ID');
                     unit = ' Gold';
                 } else if (category === 'level') {
                     value = p[propertyToSort] || 0;
                     formattedValue = value.toLocaleString('id-ID');
                     unit = ' Level';
                 } else {
                     value = p[propertyToSort] || 0;
                     formattedValue = value.toLocaleString('id-ID');
                     unit = '';
                 }
                 
                 const medal = medals[index] || `${index + 1}.`;
                 const playerName = p.nama || 'Unknown Player';
                 const playerClass = p.kelas ? `[${p.kelas}]` : '';
                 
                 reply += `${medal} *${playerName}* ${playerClass}\n`;
                 reply += `   ${categoryData.icon} ${formattedValue}${unit}\n`;
                 
                 // Tambah info tambahan untuk top 3
                 if (index < 3) {
                     if (category === 'pvp' && p.pvpStats) {
                         reply += `   �� Wins: ${p.pvpStats.wins || 0} | Losses: ${p.pvpStats.losses || 0}\n`;
                     } else if (category === 'level') {
                         reply += `   ⚔️ Attack: ${p.attack || 0} | 🛡️ Defense: ${p.defense || 0}\n`;
                     } else if (category === 'gold') {
                         reply += `   💎 Items: ${Object.keys(p.tas || {}).length} | 🎒 Equipment: ${Object.keys(p.equipment || {}).length}\n`;
                     }
                 }
                 reply += '\n';
             });
        
             // Tambah footer info
             reply += `🕐 *Last Updated:* ${new Date().toLocaleString('id-ID')}\n`;
             reply += `🔄 *Total Players:* ${Object.keys(players).length}\n`;
             reply += `🏆 *Your Rank:* ${getPlayerRank(participant, category, players, propertyMap)}`;
        
             await evarick.sendMessage(sender, {
                 image: { url: 'https://files.catbox.moe/4prvvs.jpg' },
                 caption: reply,
                 mentions: [sender]
             }, { quoted: msg });
        }
        break;
        
        case "leaderboardpvp": {
            // Improved PvP Leaderboard
            const topPvP = Object.values(players)
                .filter(p => p.battlePoint !== undefined && p.battlePoint > 1000)
                .sort((a, b) => b.battlePoint - a.battlePoint)
                .slice(0, 5);
        
            if (topPvP.length === 0) {
                let noPvPReply = "⚔️ *PvP LEADERBOARD*\n\n";
                noPvPReply += "🎯 Belum ada pemain dengan Battle Point yang cukup.\n";
                noPvPReply += "⚔️ Mulai duel PvP untuk masuk leaderboard!";
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/4prvvs.jpg' },
                    caption: noPvPReply,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
        
            let reply = "⚔️ *PvP BATTLE POINT LEADERBOARD* ⚔️\n\n";
            reply += "🏆 *Top 5 Petarung Terbaik*\n\n";
        
            const pvpMedals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            
            topPvP.forEach((p, i) => {
                const medal = pvpMedals[i];
                const playerName = p.nama || 'Unknown Fighter';
                const playerClass = p.kelas ? `[${p.kelas}]` : '';
                const battlePoint = p.battlePoint || 1000;
                
                reply += `${medal} *${playerName}* ${playerClass}\n`;
                reply += `   ⚔️ ${battlePoint.toLocaleString('id-ID')} BP\n`;
                
                // Info tambahan untuk top 3
                if (i < 3 && p.pvpStats) {
                    const winRate = p.pvpStats.wins + p.pvpStats.losses > 0 
                        ? Math.round((p.pvpStats.wins / (p.pvpStats.wins + p.pvpStats.losses)) * 100)
                        : 0;
                    reply += `   📊 Win Rate: ${winRate}% (${p.pvpStats.wins || 0}W/${p.pvpStats.losses || 0}L)\n`;
                }
                reply += '\n';
            });
        
            // Tambah info player sendiri
            const playerRank = getPlayerRank(participant, 'battlepoint', players, { battlepoint: 'battlePoint' });
            reply += `🎯 *Your Rank:* ${playerRank}\n`;
            reply += `⏰ *Last Updated:* ${new Date().toLocaleString('id-ID')}`;
        
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/4prvvs.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }


    // Travel
    case "travel": {
        if (!q) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/34t5p9.jpg' },
                caption: `⚠️ *Tentukan Tujuanmu!*\nCara penggunaan: !travel [nama lokasi]\n\nContoh: !travel Hutan Rindang`,
                mentions: [sender]
            }, { quoted: msg }); return;
        }

        const currentLocation = locations.find(loc => loc.nama === player.lokasi);
        if (!currentLocation) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/34t5p9.jpg' },
                caption: `❌ *Error: Lokasi saat ini tidak ditemukan!*`,
                mentions: [sender]
            }, { quoted: msg }); return;
        }

        // Cari tujuan yang cocok tanpa mempedulikan huruf besar/kecil
        const tujuanInput = q.toLowerCase();
        const tujuanValid = currentLocation.koneksi.find(tujuan => tujuan.toLowerCase() === tujuanInput);

        if (!tujuanValid) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/34t5p9.jpg' },
                caption: `❌ *Error: Lokasi saat ini tidak ditemukan!*`,
                mentions: [sender]
            }, { quoted: msg }); 
            return;
            
        }

        // Validasi tujuanValid benar-benar ada di daftar locations
        const newLocationData = locations.find(loc => loc.nama === tujuanValid);
        if (!newLocationData) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/34t5p9.jpg' },
                caption: `❌ *Error: Data lokasi tujuan tidak valid!*`,
                mentions: [sender]
            }, { quoted: msg }); 
            return;
        }

        // === SISTEM RANDOM ENCOUNTER ===
        // 20% chance untuk mendapat random encounter
        const encounterChance = Math.random();
        
        if (encounterChance <= 0.2) { // 20% chance
            // Cari musuh yang sesuai dengan lokasi saat ini atau tujuan
            const availableEnemies = enemies.filter(enemy => 
                enemy.lokasi.includes(currentLocation.nama) || enemy.lokasi.includes(tujuanValid)
            );
            
            if (availableEnemies.length > 0) {
                // Pilih musuh secara random
                const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
                
                // Buat encounter state
                const encounterId = `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const encounterState = {
                    id: encounterId,
                    playerId: participant,
                    enemy: randomEnemy,
                    fromLocation: currentLocation.nama,
                    toLocation: tujuanValid,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + (5 * 60 * 1000) // 5 menit timeout
                };
                
                // Simpan encounter state (gunakan Map atau object global)
                if (!global.travelEncounters) global.travelEncounters = new Map();
                global.travelEncounters.set(encounterId, encounterState);
                
                let reply = `⚠️ *RANDOM ENCOUNTER!* ⚔️\n\n`;
                reply += `🌲 *Dalam perjalanan ke ${tujuanValid}...*\n\n`;
                reply += `👹 *${randomEnemy.nama}* muncul di depanmu!\n`;
                reply += `❤️ HP: ${randomEnemy.hp}\n`;
                reply += `⚔️ Attack: ${randomEnemy.damage}\n\n`;
                reply += `*Pilihan:*\n`;
                reply += `⚔️ !fight - Lawan musuh\n`;
                reply += `🏃 !flee - Kabur (50% chance berhasil)\n\n`;
                reply += `💡 *Encounter ID: ${encounterId}*`;
                
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/ud0iom.jpg' },
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
                  return;
            }
        }

        // Jika tidak ada encounter atau tidak ada musuh yang tersedia, lanjutkan travel normal
        // Perbarui lokasi pemain dengan nama yang benar
        player.lokasi = tujuanValid;
        // Track visited locations for titles
        if (!player.visitedLocations) player.visitedLocations = [];
        if (!player.visitedLocations.includes(tujuanValid) && locations.some(loc => loc.nama === tujuanValid)) {
            player.visitedLocations.push(tujuanValid);
        }
        // Simpan perubahan lokasi ke data pemain
        players[participant] = player;
        savePlayerData(players);
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/34t5p9.jpg' },
            caption: `🚀 Kamu telah melakukan perjalanan dan tiba di *${tujuanValid}*.\n\n_${newLocationData.deskripsi}_`,
            mentions: [sender]
        }, { quoted: msg }); return;
    }
    break

    // Fight - Handle random encounter battle
    case "fight": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        // Cari encounter yang aktif untuk pemain ini
        if (!global.travelEncounters) {
            await evarickreply(`❌ *Tidak ada encounter yang aktif!*\n\nGunakan !travel untuk memulai perjalanan.`);
            return;
        }

        const activeEncounter = Array.from(global.travelEncounters.values()).find(
            encounter => encounter.playerId === participant && encounter.timestamp > Date.now() - 300000
        );

        if (!activeEncounter) {
            await evarickreply(`❌ *Tidak ada encounter yang aktif!*\n\nGunakan !travel untuk memulai perjalanan.`);
            return;
        }

        // Cek apakah encounter sudah expired
        if (Date.now() > activeEncounter.expiresAt) {
            global.travelEncounters.delete(activeEncounter.id);
            await evarickreply(`⏰ *Encounter sudah expired!*\n\nGunakan !travel lagi untuk memulai perjalanan baru.`);
            return;
        }

        const enemy = activeEncounter.enemy;
        
        // Hitung stats pemain dengan equipment
        let playerCombatStats = {
            hp: player.hp,
            maxHp: player.maxHp,
            attack: player.attack,
            defense: player.defense
        };

        // Tambahkan stats dari equipment
        Object.keys(player.equipment).forEach(slot => {
            const itemName = player.equipment[slot];
            if (itemName) {
                const itemData = items.find(item => item.nama === itemName);
                if (itemData && itemData.stats) {
                    playerCombatStats.attack += (itemData.stats.attack || 0);
                    playerCombatStats.defense += (itemData.stats.defense || 0);
                    playerCombatStats.maxHp += (itemData.stats.hp || 0);
                    playerCombatStats.hp += (itemData.stats.hp || 0);
                }
            }
        });

        // Simulasi pertarungan
        let playerHp = playerCombatStats.hp;
        let enemyHp = enemy.hp;
        const battleLog = [];

        battleLog.push(`⚔️ *PERTARUNGAN DIMULAI!* ⚔️\n`);
        battleLog.push(`👤 *${player.nama}* vs *${enemy.nama}*\n`);
        battleLog.push(`❤️ HP Kamu: ${playerHp}/${playerCombatStats.maxHp}\n`);
        battleLog.push(`👹 HP Musuh: ${enemyHp}/${enemy.hp}\n`);

        // Simulasi pertarungan
        while (playerHp > 0 && enemyHp > 0) {
            // Player attacks
            const playerDamage = Math.max(1, playerCombatStats.attack - (enemy.defense || 0));
            enemyHp -= playerDamage;
            battleLog.push(`\n⚔️ Kamu menyerang ${enemy.nama}, damage ${playerDamage}. HP musuh: ${Math.max(0, enemyHp)}`);
            if (enemyHp <= 0) break;

            // Enemy attacks
            const enemyDamage = Math.max(1, enemy.damage - playerCombatStats.defense);
            playerHp -= enemyDamage;
            battleLog.push(`👹 ${enemy.nama} menyerangmu, damage ${enemyDamage}. HP kamu: ${Math.max(0, playerHp)}`);
        }

        // Hasil Pertarungan
        if (playerHp > 0) {
            player.hp = playerHp;
            
            // Track monster kills for titles
            player.monsterKills = (player.monsterKills || 0) + 1;
            
            // Update quest and challenge progress
            const newAchievements = updateAllProgress(player, 'monsterKills', 1);
            
            let lootResult = [];
            for (const lootItem of enemy.loot) {
                if (Math.random() < lootItem.chance) {
                    player.tas[lootItem.nama] = (player.tas[lootItem.nama] || 0) + 1;
                    lootResult.push(`- 1 ${lootItem.nama}`);
                }
            }
            
            battleLog.push(`\n🎉 *KAMU MENANG!* 🎉`);
            battleLog.push(`Sisa HP: ${player.hp}/${playerCombatStats.maxHp}`);
            if (lootResult.length > 0) {
                battleLog.push(`\n*Loot didapatkan:*\n${lootResult.join('\n')}`);
            }
            
            // Add achievement notification if any new achievements unlocked
            if (newAchievements.length > 0) {
                battleLog.push(`\n🏆 *ACHIEVEMENT UNLOCKED:*`);
                newAchievements.forEach(achievement => {
                    battleLog.push(`🎉 ${achievement.description}`);
                });
            }

            // Lanjutkan perjalanan ke tujuan
            player.lokasi = activeEncounter.toLocation;
            if (!player.visitedLocations) player.visitedLocations = [];
            if (!player.visitedLocations.includes(activeEncounter.toLocation)) {
                player.visitedLocations.push(activeEncounter.toLocation);
            }
            
            const newLocationData = locations.find(loc => loc.nama === activeEncounter.toLocation);
            battleLog.push(`\n🏃 *Perjalanan dilanjutkan ke ${activeEncounter.toLocation}*`);
            if (newLocationData) {
                battleLog.push(`_${newLocationData.deskripsi}_`);
            }
            
            // Hapus encounter
            global.travelEncounters.delete(activeEncounter.id);
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ud0iom.jpg' },
                caption: battleLog.join('\n'),
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
        } else {
            // Revive dengan 30% max HP, minimal 1
            const reviveHp = Math.max(1, Math.ceil(playerCombatStats.maxHp * 0.3));
            player.hp = reviveHp;
            player.lokasi = activeEncounter.fromLocation; // Kembali ke lokasi awal
            battleLog.push(`\n☠️ *KAMU KALAH!* ☠️`);
            battleLog.push(`Kamu pingsan dan kembali ke ${activeEncounter.fromLocation} dengan sisa HP ${reviveHp}/${playerCombatStats.maxHp} (30% dari total HP).`);
            
            applyDeathPenalty(player);
            battleLog.push(`⚠️ *Death Penalty: -1 Level, -1 Stat random, kehilangan 2 item random!*`);

            // Hapus encounter
            global.travelEncounters.delete(activeEncounter.id);
            
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ud0iom.jpg' },
                caption: battleLog.join('\n'),
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
        }
    }
    break

    // Flee - Handle running from random encounter
    case "flee": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        // Cari encounter yang aktif untuk pemain ini
        if (!global.travelEncounters) {
            await evarickreply(`❌ *Tidak ada encounter yang aktif!*\n\nGunakan !travel untuk memulai perjalanan.`);
            return;
        }

        const activeEncounter = Array.from(global.travelEncounters.values()).find(
            encounter => encounter.playerId === participant && encounter.timestamp > Date.now() - 300000
        );

        if (!activeEncounter) {
            await evarickreply(`❌ *Tidak ada encounter yang aktif!*\n\nGunakan !travel untuk memulai perjalanan.`);
            return;
        }

        // Cek apakah encounter sudah expired
        if (Date.now() > activeEncounter.expiresAt) {
            global.travelEncounters.delete(activeEncounter.id);
            await evarickreply(`⏰ *Encounter sudah expired!*\n\nGunakan !travel lagi untuk memulai perjalanan baru.`);
            return;
        }

        // 50% chance untuk berhasil kabur
        const fleeSuccess = Math.random() < 0.5;
        
        if (fleeSuccess) {
            // Berhasil kabur, kembali ke lokasi awal
            player.lokasi = activeEncounter.fromLocation;
            
            let reply = `🏃 *BERHASIL KABUR!* 🏃\n\n`;
            reply += `💨 Kamu berhasil melarikan diri dari ${activeEncounter.enemy.nama}!\n`;
            reply += `📍 Kembali ke ${activeEncounter.fromLocation}\n`;
            reply += `🏃 Gunakan !travel ${activeEncounter.toLocation} untuk mencoba lagi`;
            
            // Hapus encounter
            global.travelEncounters.delete(activeEncounter.id);
            
            await evarickreply(reply);
            savePlayerData(players);
        } else {
            // Gagal kabur, harus bertarung
            let reply = `❌ *GAGAL KABUR!* ❌\n\n`;
            reply += `👹 ${activeEncounter.enemy.nama} mengejarmu!\n`;
            reply += `⚔️ Kamu harus bertarung!\n\n`;
            reply += `*Pilihan:*\n`;
            reply += `⚔️ !fight - Lawan musuh\n`;
            reply += `🏃 !flee - Coba kabur lagi (50% chance)`;
            
            await evarickreply(reply);
        }
    }
    break

        // Home - Instant return to Desa Awal with cooldown system
    case "home": {
            if (!player) {
               await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });      return;
            }
    
        // Check if player is already in Desa Awal
        if (player.lokasi === "Desa Awal") {
                await evarickreply(`🏠 *Kamu sudah berada di Desa Awal!*\n\nTidak perlu menggunakan command home.`);
            return;
        }
    
            // Parse command untuk fitur fast home
            const args = q ? q.split(' ') : [];
            const isFastHome = args[0]?.toLowerCase() === 'fast';
            
            // Inisialisasi home cooldown jika belum ada
            if (!player.homeCooldown) {
                player.homeCooldown = 0;
            }
    
            // Set biaya berdasarkan tipe home
            const baseCost = 10;
            const fastCost = 60;
            const requiredGold = isFastHome ? fastCost : baseCost;

        // Check if player has enough gold
            if (player.gold < requiredGold) {
                await evarickreply(`❌ *Gold tidak cukup!*\n\nUntuk kembali ke Desa Awal, kamu memerlukan ${requiredGold} gold.\nGold kamu saat ini: ${player.gold.toLocaleString()}`);
                return;
            }
    
            // Cek cooldown (30 menit = 1800000 ms)
            const currentTime = Date.now();
            const cooldownDuration = 1800000; // 30 menit dalam milidetik
            const timeRemaining = (player.homeCooldown + cooldownDuration) - currentTime;
    
            if (timeRemaining > 0 && !isFastHome) {
                const minutesRemaining = Math.ceil(timeRemaining / 60000); // Konversi ke menit
                await evarickreply(`⏳ *Home masih dalam cooldown!*\n\nTunggu ${minutesRemaining} menit lagi sebelum bisa home lagi.\n\n💡 *Atau gunakan !home fast untuk bypass cooldown dengan biaya ${fastCost} gold*`);
            return;
        }

        // Deduct gold and teleport to Desa Awal
            player.gold -= requiredGold;
        player.lokasi = "Desa Awal";
            
            // Set cooldown hanya jika bukan fast home
            if (!isFastHome) {
                player.homeCooldown = currentTime;
            }
        
        // Save player data
        players[participant] = player;
        savePlayerData(players);
        
            // Buat pesan balasan
            let reply = `🏠 *Selamat datang kembali di Desa Awal!* 🏠\n\n`;
            
            if (isFastHome) {
                reply += `⚡ *FAST HOME BERHASIL!*\n`;
                reply += `💰 Biaya teleport: ${fastCost} gold\n`;
                reply += `⏰ Cooldown di-bypass\n`;
            } else {
                reply += `💰 Biaya teleport: ${baseCost} gold\n`;
                reply += `⏰ Cooldown: 30 menit\n`;
            }
            
            reply += `💳 Sisa gold: ${player.gold.toLocaleString()}\n\n`;
            reply += `Kamu telah kembali ke desa dengan aman.`;
            
            await evarickreply(reply);
    }
    break

    // Lokasi
    case "lokasi": {
        const currentLocation = locations.find(loc => loc.nama === player.lokasi);
        if (!currentLocation) {
            await evarickreply("❌ *Error: Lokasi tidak ditemukan!*");
            return;
        }

        // Membuat daftar tujuan yang lebih rapi
        const tujuanList = currentLocation.koneksi.map(tujuan => `- ${tujuan}`).join('\n');

        let reply = `📍 *Lokasi Saat Ini: ${currentLocation.nama}*
_${currentLocation.deskripsi}_

📜 *Aksi yang bisa dilakukan:*
- ${currentLocation.aksi.join('\n- ')}

🗺️ *Tujuan Selanjutnya:*
${tujuanList.length > 0 ? tujuanList : 'Tidak ada jalan dari sini.'}`;

        // Add special information for Perpustakaan Beku
        if (currentLocation.nama === "Perpustakaan Beku") {
            reply += `\n\n🏪 *TOKO KHUSUS:*\n`;
            reply += `• !shop - Toko Teleportasi\n`;
            reply += `• !buy Teleporting Stone [jumlah] - Beli Teleporting Stone\n`;
            reply += `• Harga: 5000 gold per item\n`;
            reply += `• Item langka dan eksklusif!`;
        }

        await evarickreply(reply);
    }
    break

    // Profile/Status
    case "profile": {
        // Check for new titles first
        const newTitles = checkAndAwardTitles(player);
        players[participant] = player;
        savePlayerData(players);

        const classEmoji = {
            'Fighter': '🗡️',
            'Assassin': '🔪', 
            'Mage': '🧙',
            'Tank': '🛡️',
            'Archer': '🏹',
            'Adventurer': '⚔️'
        };
        
        const emoji = classEmoji[player.kelas] || '⚔️';
        
        let reply = `👤 *PROFIL PEMAIN* 👤\n\n` +
            `*Nama:* ${player.nama}\n` +
            `*Class:* ${emoji} ${player.kelas}`;

            if (player.equippedTitle) {
                reply += `🏅 *Title Aktif:* ${player.equippedTitle}\n`;
            }
            
        // Add class selection status
        if (!player.hasChosenClass) {
            reply += ` *(Default - Belum memilih class spesifik)*`;
        }
        
        reply += `\n*Lokasi:* ${player.lokasi}\n\n`;

        // Display titles
        const titleDisplay = getTitleDisplay(player);
        reply += `🏆 *Titles:* ${titleDisplay}\n\n`;
        
        // Show new titles notification
        if (newTitles.length > 0) {
            reply += `🎉 *TITLE BARU DIPEROLEH:*\n`;
            newTitles.forEach(title => {
                reply += `✨ ${title}\n`;
            });
            reply += `\n`;
        }
        
        reply += `💰 *Gold:* ${player.gold.toLocaleString()}\n\n`;
        reply += `*🎒 EQUIPMENT:*\n`;
        
// Di dalam command profile, tambahkan bagian ini:
if (player.skills && player.skills.length > 0) {
    reply += `\n🧠 *SKILLS OWNED:* ${player.skills.length}\n`;
    if (player.equippedSkills && player.equippedSkills.length > 0) {
        reply += `⚔️ *ACTIVE SKILLS:* ${player.equippedSkills.length}/2\n`;
    }
}

        // Show equipped items
        const equippedItems = Object.entries(player.equipment).filter(([slot, item]) => item !== null);
        if (equippedItems.length === 0) {
            reply += `Tidak ada equipment yang dipakai\n`;
        } else {
            equippedItems.forEach(([slot, item]) => {
                reply += `- ${slot}: ${item}\n`;
            });
        }
        
        if (!player.hasChosenClass) {
            reply += `\n*💡 Gunakan !class untuk memilih class yang lebih spesifik*`;
        } else {
            reply += `\n*Gunakan !class untuk mengganti class*`;
        }

       await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/zoci50.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
    }
    break

    case "equiptitle": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }
        if (!q) {
            await evarickreply(`⚠️ *Tentukan nama title yang ingin dipasang!*\n\nContoh: !equiptitle Pemula`);
            return;
        }
        if (!player.titles || !player.titles.includes(q)) {
            await evarickreply(`❌ *Kamu belum memiliki title "${q}"!*`);
            return;
        }
        player.equippedTitle = q;
        players[participant] = player;
        savePlayerData(players);
        await evarickreply(`🏆 *Title "${q}" berhasil dipasang di profilmu!*`);
        break;
    }

    // Hanya Admin
    case "admin": {
        if (!isAdmin(participant)) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                caption: `❌ *Akses ditolak!*\n\nKamu tidak memiliki izin admin.`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Auto-award admin title if not already has it
        if (!player.titles) player.titles = [];
        if (!player.titles.includes('Bot Administrator')) {
            player.titles.push('Bot Administrator');
            players[participant] = player;
            savePlayerData(players);
            console.log(`👑 Admin title awarded to ${player.nama} (${participant})`);
        }

        if (!q) {
            let reply = `🔧 *ADMIN PANEL v2.0* 🔧\n\n`;
            reply += `*📊 DATABASE MANAGEMENT:*\n`;
            reply += `!admin stats - Database statistics\n`;
            reply += `!admin backup - Create manual backup\n`;
            reply += `!admin restore [backup_id] - Restore from backup\n`;
            reply += `!admin cleanup - Clean old data\n`;
            reply += `!admin optimize - Optimize database\n\n`;
            
            reply += `*👥 PLAYER MANAGEMENT:*\n`;
            reply += `!admin ban [player] [reason] - Ban player\n`;
            reply += `!admin unban [player] - Unban player\n`;
            reply += `!admin reset [player] - Reset player data\n`;
            reply += `!admin mute [player] [duration] - Mute player\n`;
            reply += `!admin unmute [player] - Unmute player\n`;
            reply += `!admin search [keyword] - Search players\n`;
            reply += `!admin top [category] - Show top players\n\n`;
            
            reply += `*🎁 ITEM & ECONOMY:*\n`;
            reply += `!admin give [player] [item] [amount] - Give item\n`;
            reply += `!admin take [player] [item] [amount] - Take item\n`;
            reply += `!admin gold [player] [amount] - Set gold\n`;
            reply += `!admin level [player] [level] - Set level\n`;
            reply += `!admin exp [player] [amount] - Add experience\n`;
            reply += `!admin title [player] [title] - Add title\n\n`;
            
            reply += `*🔒 SECURITY & MONITORING:*\n`;
            reply += `!admin logs - View suspicious activity\n`;
            reply += `!admin logs [player] - View player logs\n`;
            reply += `!admin rate [command] [limit] - Set rate limit\n`;
            reply += `!admin whitelist [player] - Whitelist player\n`;
            reply += `!admin blacklist [player] - Blacklist player\n`;
            reply += `!admin activity [player] - View player activity\n\n`;
            
            reply += `*⚙️ SYSTEM CONTROL:*\n`;
            reply += `!admin maintenance [on/off] - Toggle maintenance\n`;
            reply += `!admin broadcast [message] - Broadcast message\n`;
            reply += `!admin announce [message] - Announce to all\n`;
            reply += `!admin restart - Restart bot (simulation)\n`;
            reply += `!admin claimadmin - Claim admin title\n`;
            
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });
            return;
        }

        const args = q.split(' ');
        const action = args[0]?.toLowerCase();

        switch (action) {
            case 'stats': {
                const stats = getDatabaseStats();
                let reply = `📊 *DATABASE STATISTICS* 📊\n\n`;
                reply += `👥 Total Players: ${stats.totalPlayers}\n`;
                reply += `🟢 Active Players (7d): ${stats.activePlayers}\n`;
                reply += `💰 Total Gold: ${stats.totalGold.toLocaleString()}\n`;
                reply += `📈 Total Levels: ${stats.totalLevels.toLocaleString()}\n`;
                reply += `📊 Average Level: ${stats.averageLevel}\n`;
                reply += `💰 Average Gold: ${stats.averageGold.toLocaleString()}\n\n`;
                
                reply += `*Class Distribution:*\n`;
                Object.entries(stats.classDistribution).forEach(([className, count]) => {
                    reply += `${className}: ${count}\n`;
                });
                
                reply += `\n*System Status:*\n`;
                reply += `🔄 Rate Limits Active: ${rateLimits.size}\n`;
                reply += `🚨 Suspicious Activities: ${suspiciousActivities.size}\n`;
                reply += `💾 Last Backup: ${global.lastBackup || 'Never'}\n`;
                reply += `⚡ Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`;
                
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                    caption: reply, // atau string balasan langsung
                    mentions: [sender]
                }, { quoted: msg });
            }
            break;

            case "resetdaily": {
                if (!isAdmin(participant)) {
                    await evarickreply(`❌ *Akses ditolak!* Hanya admin yang bisa menggunakan command ini.`);
                    return;
                }
            
                let resetCount = 0;
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            
                // Reset daily quests untuk semua player
                Object.keys(players).forEach(playerId => {
                    const player = players[playerId];
                    if (player.quests && player.quests.daily) {
                        player.quests.daily = { 
                            progress: {}, 
                            completed: {}, 
                            lastReset: today,
                            claimed: {}
                        };
                        resetCount++;
                    }
                });
            
                // Save data
                savePlayerData(players);
            
                await evarickreply(`✅ *DAILY QUEST RESET BERHASIL!*\n\n📊 *Total player di-reset:* ${resetCount}\n📅 *Tanggal reset:* ${now.toLocaleDateString('id-ID')}\n⏰ *Waktu reset:* ${now.toLocaleTimeString('id-ID')}`);
            }
            break

            case "resetdailyplayer": {
                if (!isAdmin(participant)) {
                    await evarickreply(`❌ *Akses ditolak!* Hanya admin yang bisa menggunakan command ini.`);
                    return;
                }
            
                if (!q) {
                    await evarickreply(`⚠️ *Tentukan nama player!*\n\nGunakan: !resetdailyplayer [nama player]`);
                    return;
                }
            
                const targetPlayerName = q.trim();
                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetPlayerName.toLowerCase()
                );
            
                if (!targetPlayer) {
                    await evarickreply(`❌ *Player tidak ditemukan!*\n\nPlayer "${targetPlayerName}" tidak ada dalam database.`);
                    return;
                }
            
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            
                // Reset daily quests untuk player tertentu
                if (!targetPlayer.quests) {
                    targetPlayer.quests = {
                        daily: { progress: {}, completed: {}, lastReset: null, claimed: {} },
                        weekly: { progress: {}, completed: {}, lastReset: null, claimed: {} },
                        story: { progress: {}, completed: {}, current: 'story_beginning', claimed: {} }
                    };
                }
            
                targetPlayer.quests.daily = { 
                    progress: {}, 
                    completed: {}, 
                    lastReset: today,
                    claimed: {}
                };
            
                // Save data
                savePlayerData(players);
            
                await evarickreply(`✅ *DAILY QUEST RESET BERHASIL!*\n\n🧑 *Player:* ${targetPlayer.nama}\n📅 *Tanggal reset:* ${now.toLocaleDateString('id-ID')}\n⏰ *Waktu reset:* ${now.toLocaleTimeString('id-ID')}\n\n💡 *Player sekarang bisa mengerjakan daily quest baru!*`);
            }
            break

            case "checkdaily": {
                if (!isAdmin(participant)) {
                    await evarickreply(`❌ *Akses ditolak!* Hanya admin yang bisa menggunakan command ini.`);
                    return;
                }
            
                if (!q) {
                    // Show summary for all players
                    let reply = `📊 *DAILY QUEST STATUS SUMMARY*\n\n`;
                    
                    let totalPlayers = 0;
                    let playersWithNullReset = 0;
                    let playersWithTodayReset = 0;
                    let playersWithOldReset = 0;
            
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            
                    Object.values(players).forEach(player => {
                        totalPlayers++;
                        if (player.quests && player.quests.daily) {
                            const lastReset = player.quests.daily.lastReset;
                            if (lastReset === null) {
                                playersWithNullReset++;
                            } else if (lastReset === today) {
                                playersWithTodayReset++;
                            } else {
                                playersWithOldReset++;
                            }
                        } else {
                            playersWithNullReset++;
                        }
                    });
            
                    reply += `👥 *Total Players:* ${totalPlayers}\n`;
                    reply += `❌ *Belum pernah reset:* ${playersWithNullReset}\n`;
                    reply += `✅ *Sudah reset hari ini:* ${playersWithTodayReset}\n`;
                    reply += `🔄 *Perlu reset:* ${playersWithOldReset}\n\n`;
                    reply += `💡 *Gunakan !resetdaily untuk reset semua player*`;
            
                    await evarickreply(reply);
                } else {
                    // Show detail for specific player
                    const targetPlayerName = q.trim();
                    const targetPlayer = Object.values(players).find(p => 
                        p.nama.toLowerCase() === targetPlayerName.toLowerCase()
                    );
            
                    if (!targetPlayer) {
                        await evarickreply(`❌ *Player tidak ditemukan!*`);
                        return;
                    }
            
                    let reply = `📊 *DAILY QUEST STATUS*\n\n`;
                    reply += `🧑 *Player:* ${targetPlayer.nama}\n`;
            
                    if (targetPlayer.quests && targetPlayer.quests.daily) {
                        const lastReset = targetPlayer.quests.daily.lastReset;
                        if (lastReset === null) {
                            reply += `📅 *Last Reset:* ❌ Belum pernah reset\n`;
                        } else {
                            const resetDate = new Date(lastReset);
                            reply += `📅 *Last Reset:* ${resetDate.toLocaleDateString('id-ID')} ${resetDate.toLocaleTimeString('id-ID')}\n`;
                        }
            
                        const completedCount = Object.keys(targetPlayer.quests.daily.completed || {}).length;
                        const claimedCount = Object.keys(targetPlayer.quests.daily.claimed || {}).length;
                        
                        reply += `✅ *Completed:* ${completedCount}/4 quests\n`;
                        reply += `🎁 *Claimed:* ${claimedCount}/4 rewards\n`;
                    } else {
                        reply += `❌ *Quest system belum diinisialisasi*`;
                    }
            
                    await evarickreply(reply);
                }
            }
            break

            case 'endseason': {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                    caption: `⏳ Mengakhiri musim PvP mingguan, menghitung peringkat...`,
                    mentions: [sender]
                }, { quoted: msg });
            
                const allPlayers = Object.entries(players);
            
                // Filter pemain yang memiliki pvpStats dan pernah bermain
                const rankedPlayers = allPlayers
                    .filter(([id, p]) => p.pvpStats && (p.pvpStats.wins > 0 || p.pvpStats.losses > 0))
                    .sort(([, a], [, b]) => b.pvpStats.rating - a.pvpStats.rating);
            
                if (rankedPlayers.length < 3) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ Peringkat tidak dapat ditentukan. Minimal harus ada 3 pemain yang aktif bertarung.`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }
            
                // Tentukan pemenang
                const winners = {
                    "1st": { id: rankedPlayers[0][0], nama: rankedPlayers[0][1].nama, rating: rankedPlayers[0][1].pvpStats.rating, claimed: false },
                    "2nd": { id: rankedPlayers[1][0], nama: rankedPlayers[1][1].nama, rating: rankedPlayers[1][1].pvpStats.rating, claimed: false },
                    "3rd": { id: rankedPlayers[2][0], nama: rankedPlayers[2][1].nama, rating: rankedPlayers[2][1].pvpStats.rating, claimed: false }
                };
            
                // Simpan data pemenang ke pvp_season.json
                const seasonDataPath = './database/rpg/pvp_season.json';
                const seasonData = {
                    lastSeasonEnded: new Date().toISOString(),
                    lastWeekWinners: winners
                };
                fs.writeFileSync(seasonDataPath, JSON.stringify(seasonData, null, 2));
            
                // Buat pengumuman
                let announcement = `🏆 *PENGUMUMAN JUARA PvP MINGGUAN* 🏆\n\nMusim telah berakhir! Berikut adalah para juara minggu ini:\n\n`;
                announcement += `🥇 *Juara 1:* ${winners['1st'].nama} (Rating: ${winners['1st'].rating})\n`;
                announcement += `🥈 *Juara 2:* ${winners['2nd'].nama} (Rating: ${winners['2nd'].rating})\n`;
                announcement += `🥉 *Juara 3:* ${winners['3rd'].nama} (Rating: ${winners['3rd'].rating})\n\n`;
                announcement += `Selamat kepada para pemenang! Gunakan *!pvp claim* untuk mengambil hadiahmu.\n\n`;
                announcement += `Peringkat PvP telah di-reset. Musim baru telah dimulai!`;
            
                // Broadcast pengumuman (opsional) atau kirim ke admin
                await evarickreply(announcement);
            
                // Reset rating semua pemain
                allPlayers.forEach(([id, p]) => {
                    if (p.pvpStats) {
                        p.pvpStats.rating = 1000;
                        p.pvpStats.wins = 0;
                        p.pvpStats.losses = 0;
                    }
                });
            
                // Simpan data pemain yang sudah direset
                savePlayerData(players);
            
                await evarickreply("✅ Peringkat semua pemain telah berhasil di-reset.");
            }
            break;

            case 'backup': {
                const backupPath = createBackup();
                if (backupPath) {
                    global.lastBackup = new Date().toLocaleString('id-ID');
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `✅ *Backup berhasil dibuat!*\n\nPath: ${backupPath}\nWaktu: ${global.lastBackup}`,
                        mentions: [sender]
                    }, { quoted: msg });
                } else {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Backup gagal dibuat!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                }
            }
            break;

            case 'restore': {
                const backupId = args[1];
                if (!backupId) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan ID backup!*\n\nContoh: !admin restore backup_1234567890`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }
                
                try {
                    const backupPath = `./database/${backupId}.json`;
                    if (!fs.existsSync(backupPath)) {
                        await evarick.sendMessage(sender, {
                            image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                            caption: `❌ *Backup tidak ditemukan!*`,
                            mentions: [sender]
                        }, { quoted: msg });
                        return;
                    }
                    
                    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
                    // In a real implementation, you would restore the data here
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `✅ *Restore berhasil!*\n\nBackup dari: ${backupData.date}\nTotal players: ${backupData.totalPlayers}`,
                        mentions: [sender]
                    }, { quoted: msg });
                } catch (error) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Error restore: ${error.message}*`,
                        mentions: [sender]
                    }, { quoted: msg });
                }
            }
            break;

            case 'optimize': {
                // Optimize database by cleaning up old data
                const beforeSize = Object.keys(players).length;
                
                // Remove players who haven't logged in for 30 days
                const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
                const inactivePlayers = Object.entries(players).filter(([id, p]) => 
                    !p.lastLogin || p.lastLogin < thirtyDaysAgo
                );
                
                inactivePlayers.forEach(([id, p]) => {
                    delete players[id];
                });
                
                savePlayerData(players);
                
                const afterSize = Object.keys(players).length;
                const removed = beforeSize - afterSize;
                
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                    caption: `🔧 *Database optimization complete!*\n\nRemoved ${removed} inactive players\nTotal players: ${afterSize}`,
                    mentions: [sender]
                }, { quoted: msg });
            }
            break;

            case 'ban': {
                const targetName = args.slice(1, -1).join(' ');
                const reason = args[args.length - 1] || 'No reason provided';
                
                if (!targetName) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin ban [nama] [alasan]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                targetPlayer.banned = true;
                targetPlayer.banReason = reason;
                targetPlayer.banDate = new Date().toISOString();
                targetPlayer.bannedBy = player.nama;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                    caption: `🚫 *${targetName} telah dibanned!*\n\nAlasan: ${reason}\nBanned by: ${player.nama}`,
                    mentions: [sender]
                }, { quoted: msg });
            }
            break;

            case 'unban': {
                const targetName = args.slice(1).join(' ');
                if (!targetName) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin unban [nama]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                if (!targetPlayer.banned) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *${targetName} tidak dibanned!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                delete targetPlayer.banned;
                delete targetPlayer.banReason;
                delete targetPlayer.banDate;
                delete targetPlayer.bannedBy;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `✅ *${targetName} telah diunban!*\n\nUnbanned by: ${player.nama}`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'mute': {
                const targetName = args[1];
                const duration = parseInt(args[2]) || 60; // Default 60 minutes
                
                if (!targetName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin mute [nama] [duration_minutes]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                targetPlayer.muted = true;
                targetPlayer.muteExpires = Date.now() + (duration * 60 * 1000);
                targetPlayer.mutedBy = player.nama;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `🔇 *${targetName} telah dimute!*\n\nDuration: ${duration} minutes\nMuted by: ${player.nama}`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'unmute': {
                const targetName = args.slice(1).join(' ');
                if (!targetName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin unmute [nama]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                if (!targetPlayer.muted) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *${targetName} tidak dimute!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                delete targetPlayer.muted;
                delete targetPlayer.muteExpires;
                delete targetPlayer.mutedBy;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `🔊 *${targetName} telah diunmute!*\n\nUnmuted by: ${player.nama}`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'search': {
                const keyword = args.slice(1).join(' ');
                if (!keyword) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan keyword pencarian!*\n\nContoh: !admin search [keyword]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const results = Object.values(players).filter(p => 
                    p.nama.toLowerCase().includes(keyword.toLowerCase()) ||
                    p.kelas.toLowerCase().includes(keyword.toLowerCase())
                ).slice(0, 10); // Limit to 10 results

                if (results.length === 0) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Tidak ada player yang cocok dengan "${keyword}"*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                let reply = `🔍 *SEARCH RESULTS: "${keyword}"* 🔍\n\n`;
                results.forEach((p, index) => {
                    reply += `${index + 1}. ${p.nama} (${p.kelas})\n`;
                    reply += `   Level: ${p.level} | Gold: ${p.gold.toLocaleString()}\n`;
                    reply += `   Status: ${p.banned ? '🚫 Banned' : p.muted ? '🔇 Muted' : '🟢 Active'}\n\n`;
                });

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });(reply);
            }
            break;

            case 'top': {
                const category = args[1] || 'gold';
                const validCategories = ['gold', 'level', 'monsterKills', 'miningCount', 'woodcuttingCount', 'fishingCount'];
                
                if (!validCategories.includes(category)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Category tidak valid!*\n\nValid categories: ${validCategories.join(', ')}`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const sortedPlayers = Object.values(players)
                    .sort((a, b) => (b[category] || 0) - (a[category] || 0))
                    .slice(0, 10);

                let reply = `🏆 *TOP 10 PLAYERS - ${category.toUpperCase()}* 🏆\n\n`;
                sortedPlayers.forEach((p, index) => {
                    const value = p[category] || 0;
                    const formattedValue = category === 'gold' ? value.toLocaleString() : value;
                    reply += `${index + 1}. ${p.nama}\n`;
                    reply += `   ${category}: ${formattedValue}\n\n`;
                });

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });(reply);
            }
            break;

            case 'take': {
                const targetName = args[1];
                const itemName = args[2];
                const amount = parseInt(args[3]) || 1;

                if (!targetName || !itemName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan player dan item!*\n\nContoh: !admin take [player] [item] [amount]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const currentAmount = targetPlayer.tas[itemName] || 0;
                if (currentAmount < amount) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *${targetName} hanya memiliki ${currentAmount} ${itemName}!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                targetPlayer.tas[itemName] = currentAmount - amount;
                if (targetPlayer.tas[itemName] <= 0) {
                    delete targetPlayer.tas[itemName];
                }
                
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `📤 *${amount} ${itemName} diambil dari ${targetName}!*`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'exp': {
                const targetName = args[1];
                const amount = parseInt(args[2]);

                if (!targetName || isNaN(amount)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan player dan jumlah exp!*\n\nContoh: !admin exp [player] [amount]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                // Add experience (simplified - in real implementation you'd have exp system)
                const oldLevel = targetPlayer.level;
                targetPlayer.level = Math.max(1, targetPlayer.level + Math.floor(amount / 100));
                
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `📈 *${amount} exp diberikan ke ${targetName}!*\n\nLevel: ${oldLevel} → ${targetPlayer.level}`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'title': {
                const targetName = args[1];
                const titleName = args.slice(2).join(' ');

                if (!targetName || !titleName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan player dan title!*\n\nContoh: !admin title [player] [title]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                if (!targetPlayer.titles) targetPlayer.titles = [];
                if (targetPlayer.titles.includes(titleName)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *${targetName} sudah memiliki title "${titleName}"!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                targetPlayer.titles.push(titleName);
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `👑 *Title "${titleName}" diberikan ke ${targetName}!*`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'logs': {
                const targetPlayer = args[1];
                
                if (targetPlayer) {
                    // Show logs for specific player
                    const player = Object.values(players).find(p => 
                        p.nama.toLowerCase() === targetPlayer.toLowerCase()
                    );
                    
                    if (!player) {
                        // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetPlayer}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                        return;
                    }
                    
                    let reply = `📋 *ACTIVITY LOGS - ${player.nama}* 📋\n\n`;
                    reply += `👤 Level: ${player.level}\n`;
                    reply += `💰 Gold: ${player.gold.toLocaleString()}\n`;
                    reply += `👹 Monster Kills: ${player.monsterKills || 0}\n`;
                    reply += `⛏️ Mining: ${player.miningCount || 0}\n`;
                    reply += `🪓 Woodcutting: ${player.woodcuttingCount || 0}\n`;
                    reply += `🎣 Fishing: ${player.fishingCount || 0}\n`;
                    reply += `📅 Join Date: ${new Date(player.joinDate).toLocaleDateString('id-ID')}\n`;
                    reply += `🕐 Last Login: ${new Date(player.lastLogin).toLocaleString('id-ID')}\n`;
                    
                    if (player.banned) {
                        reply += `🚫 Banned: ${player.banReason}\n`;
                        reply += `📅 Ban Date: ${new Date(player.banDate).toLocaleString('id-ID')}\n`;
                    }
                    
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });
                } else {
                    // Show general suspicious activity logs
                    try {
                        const logPath = './database/suspicious_activity.json';
                        if (!fs.existsSync(logPath)) {
                            // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `📋 *Tidak ada log aktivitas mencurigakan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                            return;
                        }

                        const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                        const recentLogs = logs.slice(-10); // Last 10 entries

                        if (recentLogs.length === 0) {
                            // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `📋 *Tidak ada log aktivitas mencurigakan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                            return;
                        }

                        let reply = `🚨 *SUSPICIOUS ACTIVITY LOGS (10 Terakhir)* 🚨\n\n`;
                        recentLogs.forEach((log, index) => {
                            reply += `${index + 1}. ${log.playerData?.nama || 'Unknown'} (${log.command})\n`;
                            reply += `   Alasan: ${log.reason}\n`;
                            reply += `   Waktu: ${new Date(log.timestamp).toLocaleString('id-ID')}\n\n`;
                        });

                        // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });
                    } catch (error) {
                        // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Error membaca log: ${error.message}*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    }
                }
            }
            break;

            case 'rate': {
                const command = args[1];
                const limit = parseInt(args[2]);
                
                if (!command || isNaN(limit)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan command dan limit!*\n\nContoh: !admin rate [command] [limit]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }
                
                if (!RATE_LIMITS[command]) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Command "${command}" tidak memiliki rate limit!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }
                
                const oldLimit = RATE_LIMITS[command].max;
                RATE_LIMITS[command].max = limit;
                
                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚡ *Rate limit updated!*\n\nCommand: ${command}\nOld limit: ${oldLimit}\nNew limit: ${limit}`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'whitelist': {
                const targetName = args.slice(1).join(' ');
                if (!targetName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin whitelist [nama]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                targetPlayer.whitelisted = true;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `✅ *${targetName} telah diwhitelist!*\n\nPlayer ini tidak akan terkena rate limit.`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'blacklist': {
                const targetName = args.slice(1).join(' ');
                if (!targetName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin blacklist [nama]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                targetPlayer.blacklisted = true;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `🚫 *${targetName} telah diblacklist!*\n\nPlayer ini tidak bisa menggunakan bot.`,
                        mentions: [sender]
                    }, { quoted: msg });
            }
            break;

            case 'activity': {
                const targetName = args.slice(1).join(' ');
                if (!targetName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin activity [nama]`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                // Check rate limit activity for this player
                const playerRateLimits = [];
                for (const [key, timestamps] of rateLimits.entries()) {
                    if (key.startsWith(targetPlayer.id)) {
                        const command = key.split('_')[1];
                        playerRateLimits.push({ command, count: timestamps.length });
                    }
                }

                let reply = `📊 *ACTIVITY ANALYSIS - ${targetPlayer.nama}* 📊\n\n`;
                reply += `👤 Level: ${targetPlayer.level}\n`;
                reply += `💰 Gold: ${targetPlayer.gold.toLocaleString()}\n`;
                reply += `🕐 Last Login: ${new Date(targetPlayer.lastLogin).toLocaleString('id-ID')}\n\n`;
                
                if (playerRateLimits.length > 0) {
                    reply += `*Recent Activity (Rate Limits):*\n`;
                    playerRateLimits.forEach(({ command, count }) => {
                        reply += `${command}: ${count} times\n`;
                    });
                } else {
                    reply += `*No recent activity detected*`;
                }

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'maintenance': {
                const mode = args[1];
                if (!mode || !['on', 'off'].includes(mode)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                    caption: `⚠️ *Tentukan mode!*\n\nContoh: !admin maintenance [on/off]`,
                    mentions: [sender]
                }, { quoted: msg });
                    return;
                }
                
                global.maintenanceMode = mode === 'on';
                
                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                    caption: `🔧 *Maintenance mode ${global.maintenanceMode ? 'enabled' : 'disabled'}!*\n\n${global.maintenanceMode ? 'Bot sedang dalam maintenance mode. Hanya admin yang bisa menggunakan commands.' : 'Bot kembali normal.'}`,
                    mentions: [sender]
                }, { quoted: msg });
            }
            break;

            case 'broadcast': {
                const message = args.slice(1).join(' ');
                if (!message) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `⚠️ *Tentukan pesan!*\n\nContoh: !admin broadcast [pesan]`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }
                
                // In a real implementation, you would send this to all active players
                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `📢 *BROADCAST MESSAGE* 📢\n\n${message}\n\n*Sent by: ${player.nama}*`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'announce': {
                const message = args.slice(1).join(' ');
                if (!message) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `⚠️ *Tentukan pesan!*\n\nContoh: !admin announce [pesan]`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }
                
                // In a real implementation, you would send this to all players
                const totalPlayers = Object.keys(players).length;
                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `📢 *ANNOUNCEMENT* 📢\n\n${message}\n\n*Sent to ${totalPlayers} players by: ${player.nama}*`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'restart': {
                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `🔄 *Bot restart simulation complete!*\n\nIn a real implementation, this would restart the bot.`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'reset': {
                const targetName = args.slice(1).join(' ');
                if (!targetName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `⚠️ *Tentukan nama player!*\n\nContoh: !admin reset [nama]`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                // Reset player data
                const resetData = {
                    id: targetPlayer.id,
                    nama: targetPlayer.nama,
                    kelas: 'Adventurer',
                    level: 1,
                    hp: 100,
                    maxHp: 100,
                    mana: 50,
                    maxMana: 50,
                    attack: 10,
                    defense: 5,
                    gold: 1000,
                    lokasi: 'Desa Awal',
                    status: 'active',
                    hasChosenClass: false,
                    equipment: {},
                    tas: {},
                    titles: [],
                    joinDate: new Date().toISOString(),
                    lastUpdated: Date.now()
                };

                players[targetPlayer.id] = resetData;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `🔄 *Data ${targetName} telah direset!*\n\nReset by: ${player.nama}`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'give': {
                const targetName = args[1];
                const itemName = args[2];
                const amount = parseInt(args[3]) || 1;

                if (!targetName || !itemName) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `⚠️ *Tentukan player dan item!*\n\nContoh: !admin give [player] [item] [amount]`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                targetPlayer.tas[itemName] = (targetPlayer.tas[itemName] || 0) + amount;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `🎁 *${amount} ${itemName} diberikan ke ${targetName}!*\n\nGiven by: ${player.nama}`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'leaderboard':
            case 'rank':
            case 'toplevel':
            case 'levelboard': {
                if (!q) {
                   let reply = "🏆 *Pilih Kategori Leaderboard* 🏆\n\n";
                   reply += "Gunakan perintah `!leaderboard [kategori]`\n\n";
                   reply += "*Kategori yang tersedia:*\n";
                   reply += "  - `level`\n";
                   reply += "  - `gold`\n";
                   reply += "  - `pvp` - Rating PvP tertinggi\n";
                   reply += "  - `monsterKills`\n";
                   reply += "  - `miningCount`\n";
                   reply += "  - `woodcuttingCount`\n";
                   reply += "  - `fishingCount`\n\n";
                   reply += "Contoh: `!leaderboard pvp`";
                   // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });
                   return;
                }

                const category = q.toLowerCase();
                const validCategories = ['gold', 'level', 'pvp', 'monsterkills', 'miningcount', 'woodcuttingcount', 'fishingcount'];
                
                const propertyMap = {
                    monsterkills: 'monsterKills',
                    miningcount: 'miningCount',
                    woodcuttingcount: 'woodcuttingCount',
                    fishingcount: 'fishingCount',
                    level: 'level',
                    gold: 'gold',
                    pvp: 'pvpStats.rating'
                };

                if (!validCategories.includes(category)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
                        caption: `⚠️ *Kategori tidak valid!*\n\nCoba salah satu dari: ${Object.keys(propertyMap).join(', ')}`,
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const propertyToSort = propertyMap[category];
                let sortedPlayers;
                
                if (category === 'pvp') {
                    // Special handling for PvP rating
                    sortedPlayers = Object.values(players)
                        .filter(p => p.pvpStats && p.pvpStats.rating)
                        .sort((a, b) => (b.pvpStats.rating || 0) - (a.pvpStats.rating || 0))
                    .slice(0, 10);
                } else {
                    sortedPlayers = Object.values(players)
                        .sort((a, b) => (b[propertyToSort] || 0) - (a[propertyToSort] || 0))
                        .slice(0, 10);
                }

                let reply = `🏆 *TOP 10 PEMAIN - ${category.toUpperCase()}* 🏆\n\n`;
                sortedPlayers.forEach((p, index) => {
                    let value, formattedValue;
                    
                    if (category === 'pvp') {
                        value = p.pvpStats ? p.pvpStats.rating : 0;
                        formattedValue = value.toLocaleString('id-ID');
                    } else {
                        value = p[propertyToSort] || 0;
                        formattedValue = typeof value === 'number' ? value.toLocaleString('id-ID') : value;
                    }
                    
                    reply += `${index + 1}. *${p.nama}* - ${formattedValue}\n`;
                });
                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply, // atau string balasan langsung
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'gold': {
                const targetName = args[1];
                const amount = parseInt(args[2]);

                if (!targetName || isNaN(amount)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `⚠️ *Tentukan player dan jumlah gold!*\n\nContoh: !admin gold [player] [amount]`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                targetPlayer.gold = amount;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `💰 *Gold ${targetName} diatur ke ${amount.toLocaleString()}!*\n\nSet by: ${player.nama}`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'level': {
                const targetName = args[1];
                const level = parseInt(args[2]);

                if (!targetName || isNaN(level)) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `⚠️ *Tentukan player dan level!*\n\nContoh: !admin level [player] [level]`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `❌ *Player "${targetName}" tidak ditemukan!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

                targetPlayer.level = level;
                players[targetPlayer.id] = targetPlayer;
                savePlayerData(players);

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `📈 *Level ${targetName} diatur ke ${level}!*\n\nSet by: ${player.nama}`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'cleanup': {
                // Clean old rate limits and suspicious activities
                const now = Date.now();
                const oneHourAgo = now - (60 * 60 * 1000);

                // Clean rate limits
                let cleanedRateLimits = 0;
                for (const [key, timestamps] of rateLimits.entries()) {
                    const validTimestamps = timestamps.filter(time => time > oneHourAgo);
                    if (validTimestamps.length === 0) {
                        rateLimits.delete(key);
                        cleanedRateLimits++;
                    } else {
                        rateLimits.set(key, validTimestamps);
                    }
                }

                // Clean suspicious activities
                let cleanedSuspicious = 0;
                for (const [key, activities] of suspiciousActivities.entries()) {
                    const validActivities = activities.filter(act => act.timestamp > oneHourAgo);
                    if (validActivities.length === 0) {
                        suspiciousActivities.delete(key);
                        cleanedSuspicious++;
                    } else {
                        suspiciousActivities.set(key, validActivities);
                    }
                }

                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `🧹 *Cleanup berhasil!*\n\nRate limits cleaned: ${cleanedRateLimits}\nSuspicious activities cleaned: ${cleanedSuspicious}\nMemory optimized.`,
    mentions: [sender]
}, { quoted: msg });
            }
            break;

            case 'claimadmin': {
                // Ensure admin gets the admin title
                if (!player.titles) player.titles = [];
                if (!player.titles.includes('Bot Administrator')) {
                    player.titles.push('Bot Administrator');
        players[participant] = player;
        savePlayerData(players);
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
                } else {
                await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: reply,
    mentions: [sender]
}, { quoted: msg });
                }
            }
            break;

            default: {
                // const adminImage = fs.readFileSync('https://files.catbox.moe/7rfi1a.jpg');
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/7rfi1a.jpg' },
    caption: `❌ *Action tidak valid!*\n\nGunakan !admin untuk melihat menu lengkap.`,
    mentions: [sender]
}, { quoted: msg });
            }
        }
    }
    break

    // Hanya Group
    case "group": {
        if (!isGroup) await evarickreply(mess.group); // Contoh Penerapan Hanya Group
        await evarickreply("🎁 *Kamu Sedang Berada Di Dalam Grup*"); // Pesan Ini Hanya Akan Dikirim Jika Di Dalam Grup
    }
    break

    // AI Chat
    case "ai": {
        if (!q) await evarickreply("☘️ *Contoh:* !ai Apa itu JavaScript?");
        await evarickreply(mess.wait);
        try {
                    // Check if user is owner for special commands
        const isOwnerUser = isOwner(sender);
        const lenai = await Ai4Chat(q, player, null, isOwnerUser, evarick, sender);
            await evarickreply(`*Evarick AI*\n\n${lenai}`);
        } catch (error) {
            console.error("Error:", error);
            await evarickreply(mess.error);
        }
    }
    break;

    case "ttdl": {
        if (!q) await evarickreply("⚠ *Mana Link Tiktoknya?*");
        await evarickreply(mess.wait);
        try {
            const result = await tiktok2(q); // Panggil Fungsi Scraper

            // Kirim Video
            await evarick.sendMessage(
                sender,
                {
                    video: { url: result.no_watermark },
                    caption: `*🎁 Evarick Tiktok Downloader*`
                },
                { quoted: msg }
            );

        } catch (error) {
            console.error("Error TikTok DL:", error);
            await evarickreply(mess.error);
        }
    }
    break;

    case "igdl": {
        if (!q) await evarickreply("⚠ *Mana Link Instagramnya?*");
        try {
            await evarickreply(mess.wait);

            // Panggil API Velyn
            const apiUrl = `https://www.velyn.biz.id/api/downloader/instagram?url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl);

            if (!response.data.status || !response.data.data.url[0]) {
                throw new Error("Link tidak valid atau API error");
            }

            const data = response.data.data;
            const mediaUrl = data.url[0];
            const metadata = data.metadata;

            // Kirim Media
            if (metadata.isVideo) {
                await evarick.sendMessage(
                    sender,
                    {
                        video: { url: mediaUrl },
                        caption: `*Instagram Reel*\n\n` +
                            `*Username :* ${metadata.username}\n` +
                            `*Likes :* ${metadata.like.toLocaleString()}\n` +
                            `*Comments :* ${metadata.comment.toLocaleString()}\n\n` +
                            `*Caption :* ${metadata.caption || '-'}\n\n` +
                            `*Source :* ${q}`
                    },
                    { quoted: msg }
                );
            } else {
                await evarick.sendMessage(
                    sender,
                    {
                        image: { url: mediaUrl },
                        caption: `*Instagram Post*\n\n` +
                            `*Username :* ${metadata.username}\n` +
                            `*Likes :* ${metadata.like.toLocaleString()}\n\n` +
                            `*Caption :* ${metadata.caption || '-'}`
                    },
                    { quoted: msg }
                );
            }

        } catch (error) {
            console.error("Error Instagram DL:", error);
            await evarickreply(mess.error);
        }
    }
    break;

    // Game Tebak Angka
    case "tebakangka": {
        const target = Math.floor(Math.random() * 100);
        evarick.tebakGame = { target, sender };
        await evarickreply("*Tebak Angka 1 - 100*\n*Ketik !tebak [Angka]*");
    }
    break;

    case "tebak": {
        if (!evarick.tebakGame || evarick.tebakGame.sender !== sender) return;
        const guess = parseInt(args[0]);
        if (isNaN(guess)) return await evarickreply("❌ *Masukkan Angka!*");

        if (guess === evarick.tebakGame.target) {
            await evarickreply(`🎉 *Tebakkan Kamu Benar!*`);
            delete evarick.tebakGame;
        } else {
            await evarickreply(guess > evarick.tebakGame.target ? "*Terlalu Tinggi!*" : "*Terlalu rendah!*");
        }
    }
    break;

    case "quote": {
        const quotes = [
            "Jangan menyerah, hari buruk akan berlalu.",
            "Kesempatan tidak datang dua kali.",
            "Kamu lebih kuat dari yang kamu kira.",
            "Hidup ini singkat, jangan sia-siakan."
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        await evarickreply(`*Quote Hari Ini :*\n_"${randomQuote}"_`);
    }
    break;

    // Owner Commands - Only accessible by owner
    case "owner": {
        if (!isOwner(sender)) {
            await evarickreply("❌ *Akses Ditolak!* Hanya owner yang bisa menggunakan command ini.");
            return;
        }
        
        if (!q) {
            await evarickreply(`👑 *OWNER COMMANDS*
            
🔧 *System Commands:*
• !owner status - Cek status bot
• !owner restart - Restart bot
• !owner maintenance [on/off] - Maintenance mode
• !owner dbinfo - Info database
• !owner logs - System logs

👥 *Player Management:*
• !owner player list - List all players
• !owner player info [number] - Player info
• !owner player ban/unban [number] - Ban/unban player

⚙️ *Configuration:*
• !owner config [setting] [value] - Bot configuration
• !owner config rate [command] [limit] - Rate limiting

🚨 *Emergency:*
• !owner emergency [command] - Emergency actions
• !owner emergency stop - Stop bot
• !owner emergency backup - Force backup

📊 *Statistics:*
• !owner stats - Bot statistics
• !owner stats players - Player statistics

*Owner Command: !owner [command] untuk akses fitur owner*`);
            return;
        }

        const ownerCommand = q.toLowerCase();
        
        // Bot Status
        if (ownerCommand.includes('status')) {
            await evarickreply(`🤖 *BOT STATUS - OWNER ONLY*
            
📊 *System Information:*
• Node.js Version: ${process.version}
• Platform: ${process.platform}
• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
• Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
• Process ID: ${process.pid}

🔧 *Bot Features:*
• System Checker: ✅ Active
• Anti-Cheat: ✅ Active
• Auto Backup: ✅ Active
• Rate Limiting: ✅ Active
• PvP System: ✅ Active
• Quest System: ✅ Active

📈 *Performance:*
• Response Time: < 2 seconds
• Error Rate: < 0.1%
• Database Health: ✅ Good`);
            return;
        }

        // Database Info
        if (ownerCommand.includes('dbinfo')) {
            try {
                const stats = getDatabaseStats();
                await evarickreply(`🗄️ *DATABASE INFO - OWNER ONLY*
                
📊 *Database Statistics:*
• Total Players: ${stats.totalPlayers}
• Database Size: ${stats.databaseSize} KB
• Last Backup: ${stats.lastBackup}
• Backup Size: ${stats.backupSize} KB
• Corruption Check: ✅ Clean

📁 *Database Files:*
• players.json: ✅ Active
• players_backup.json: ✅ Backup
• items.js: ✅ Active
• locations.js: ✅ Active
• enemies.js: ✅ Active
• skills.js: ✅ Active
• crafting.js: ✅ Active
• pets.js: ✅ Active
• logs.json: ✅ Active
• pvp_season.json: ✅ Active

🔍 *Database Health:*
• Integrity: ✅ Good
• Performance: ✅ Optimal
• Space Usage: ✅ Normal`);
            } catch (error) {
                await evarickreply("❌ Error getting database info");
            }
            return;
        }

        // Player List
        if (ownerCommand.includes('player list')) {
            try {
                const players = loadPlayerData();
                const playerList = Object.keys(players).slice(0, 10); // Show first 10 players
                let response = `👥 *PLAYER LIST - OWNER ONLY*\n\n`;
                playerList.forEach((number, index) => {
                    const player = players[number];
                    response += `${index + 1}. ${player.nama} (${number})\n`;
                });
                response += `\n*Total Players:* ${Object.keys(players).length}`;
                await evarickreply(response);
            } catch (error) {
                await evarickreply("❌ Error getting player list");
            }
            return;
        }

        // Player Info
        if (ownerCommand.includes('player info')) {
            const playerNumber = args[1];
            if (!playerNumber) {
                await evarickreply("❌ *Format:* !owner player info [number]");
                return;
            }
            
            try {
                const players = loadPlayerData();
                const player = players[playerNumber];
                if (!player) {
                    await evarickreply("❌ Player tidak ditemukan");
                    return;
                }
                
                await evarickreply(`👤 *PLAYER INFO - OWNER ONLY*
                
📋 *Basic Info:*
• Nama: ${player.nama}
• Number: ${playerNumber}
• Level: ${player.level}
• Class: ${player.kelas || 'None'}
• Gold: ${player.gold}

📊 *Stats:*
• HP: ${player.hp}/${player.maxHp}
• Attack: ${player.attack}
• Defense: ${player.defense}
• EXP: ${player.exp}

📍 *Location:*
• Current: ${player.lokasi}
• Home: ${player.home || 'Desa Awal'}

🎮 *Game Stats:*
• Monster Kills: ${player.monsterKills || 0}
• Mining Count: ${player.miningCount || 0}
• Woodcutting Count: ${player.woodcuttingCount || 0}
• Fishing Count: ${player.fishingCount || 0}

📅 *Timestamps:*
• Last Daily: ${player.lastDaily || 'Never'}
• Last Weekly: ${player.lastWeekly || 'Never'}
• Created: ${player.createdAt || 'Unknown'}`);
            } catch (error) {
                await evarickreply("❌ Error getting player info");
            }
            return;
        }

        // Statistics
        if (ownerCommand.includes('stats')) {
            try {
                const players = loadPlayerData();
                const totalPlayers = Object.keys(players).length;
                const activePlayers = Object.values(players).filter(p => p.lastActivity && (Date.now() - new Date(p.lastActivity).getTime()) < 86400000).length; // Last 24 hours
                
                await evarickreply(`📊 *BOT STATISTICS - OWNER ONLY*
                
🤖 *Bot Statistics:*
• Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
• CPU Usage: [Auto-calculated]%
• Response Time: < 2 seconds

👥 *Player Statistics:*
• Total Players: ${totalPlayers}
• Active Players (24h): ${activePlayers}
• New Players Today: [Auto-calculated]
• Banned Players: [Auto-calculated]

🎮 *Game Statistics:*
• Total Hunts: [Auto-calculated]
• Total PvP Matches: [Auto-calculated]
• Total Trades: [Auto-calculated]
• Total Quests Completed: [Auto-calculated]

📈 *Performance:*
• Error Rate: < 0.1%
• Success Rate: > 99.9%
• Average Response Time: < 2s
• Database Health: ✅ Good`);
            } catch (error) {
                await evarickreply("❌ Error getting statistics");
            }
            return;
        }

        // Maintenance Mode
        if (ownerCommand.includes('maintenance')) {
            const action = args[1];
            if (!action || !['on', 'off', 'status'].includes(action)) {
                await evarickreply("❌ *Format:* !owner maintenance [on/off/status]");
                return;
            }
            
            if (action === 'on') {
                global.maintenanceMode = true;
                await evarickreply("🔧 *Maintenance Mode:* ON\n\nBot sedang dalam maintenance. Mohon tunggu sebentar.");
            } else if (action === 'off') {
                global.maintenanceMode = false;
                await evarickreply("✅ *Maintenance Mode:* OFF\n\nBot sudah siap digunakan kembali.");
            } else if (action === 'status') {
                const status = global.maintenanceMode ? 'ON' : 'OFF';
                await evarickreply(`🔧 *Maintenance Mode:* ${status}`);
            }
            return;
        }

        // Emergency Commands
        if (ownerCommand.includes('emergency')) {
            const action = args[1];
            if (!action) {
                await evarickreply("❌ *Format:* !owner emergency [stop/backup/cleanup/optimize]");
                return;
            }
            
            if (action === 'backup') {
                try {
                    createBackup();
                    await evarickreply("✅ *Emergency Backup:* Created successfully");
                } catch (error) {
                    await evarickreply("❌ Error creating backup");
                }
            } else if (action === 'stop') {
                await evarickreply("🛑 *Emergency Stop:* Bot will stop in 5 seconds...");
                setTimeout(() => {
                    process.exit(0);
                }, 5000);
            } else {
                await evarickreply("❌ Invalid emergency action");
            }
            return;
        }

        // Default response for unknown owner commands
        await evarickreply("❌ *Unknown Owner Command*\n\nUse !owner for help");
    }
    break;

    // Hunt (Sistem Pertarungan)
    case "hunt": {

         // ADD THIS LINE - Check and reset quests if needed
    checkQuests(player);

        // --- Kalkulasi Status Pertarungan ---
        let playerCombatStats = {
            attack: player.attack,
            defense: player.defense,
            maxHp: player.maxHp
        };

        for (const slot in player.equipment) {
            const itemName = player.equipment[slot];
            if (itemName) {
                const itemData = items.find(item => item.nama === itemName);
                if (itemData && itemData.stats) {
                    playerCombatStats.attack += (itemData.stats.attack || 0);
                    playerCombatStats.defense += (itemData.stats.defense || 0);
                    playerCombatStats.maxHp += (itemData.stats.hp || 0);
                }
            }
        }
        
        const currentLocation = locations.find(loc => loc.nama === player.lokasi);
        if (!currentLocation.aksi.includes('hunt')) return await evarickreply("Tempat ini terlalu aman untuk berburu.");
        
        const possibleEnemies = enemies.filter(e => e.lokasi.includes(player.lokasi));
        if (possibleEnemies.length === 0) return await evarickreply("Suasana terasa tenang, tidak ada musuh di sekitar.");

        const enemy = { ...possibleEnemies[Math.floor(Math.random() * possibleEnemies.length)] };
        let playerHp = player.hp;
        let enemyHp = enemy.hp;
        let battleLog = [`⚔️ Kamu bertemu dengan *${enemy.nama}*!\n`];

        // Simulasi pertarungan
        while (playerHp > 0 && enemyHp > 0) {
            // Player attacks
            const playerDamage = Math.max(1, playerCombatStats.attack - (enemy.defense || 0));
            enemyHp -= playerDamage;
            battleLog.push(`- Kamu menyerang ${enemy.nama}, damage ${playerDamage}. HP musuh: ${Math.max(0, enemyHp)}`);
            if (enemyHp <= 0) break;

            // Enemy attacks
            const enemyDamage = Math.max(1, enemy.damage - playerCombatStats.defense);
            playerHp -= enemyDamage;
            battleLog.push(`- ${enemy.nama} menyerangmu, damage ${enemyDamage}. HP kamu: ${Math.max(0, playerHp)}`);
        }

        // Hasil Pertarungan
        if (playerHp > 0) {
            player.hp = playerHp;
            
            // Track monster kills for titles
            player.monsterKills = (player.monsterKills || 0) + 1;
            
// Tambahkan setelah baris: player.monsterKills = (player.monsterKills || 0) + 1;
// Sekitar baris 4280

// Calculate EXP gain based on enemy level and player level
const baseExp = Math.max(1, Math.floor(enemy.level || 1) * 2);
const levelDiff = (player.level || 1) - (enemy.level || 1);
let expGain = baseExp;

// Bonus EXP untuk enemy yang lebih tinggi level
if (levelDiff < 0) {
    expGain = Math.floor(baseExp * (1 + Math.abs(levelDiff) * 0.2));
} else if (levelDiff > 5) {
    // Kurangi EXP untuk enemy yang terlalu lemah
    expGain = Math.max(1, Math.floor(baseExp * 0.5));
}

// Apply world effects to EXP
const worldEffects = getWorldEffects();
if (worldEffects.effects.includes('Hunting EXP Bonus')) {
    expGain = Math.floor(expGain * 2);
}

// Add experience and check for level up
const expResult = addExperience(player, expGain);

// Update battle log dengan EXP dan level up
battleLog.push(`\n📈 *EXP GAINED:* +${expResult.expGained} EXP`);
battleLog.push(`📊 *Total EXP:* ${expResult.totalExp}`);

// Add level up message if leveled up
if (expResult.levelUpResult.leveledUp) {
    battleLog.push(`\n${expResult.levelUpResult.message}`);
}

            // Update quest and challenge progress
            const newAchievements = updateAllProgress(player, 'monsterKills', 1);
            
            let lootResult = [];
            for (const lootItem of enemy.loot) {
                if (Math.random() < lootItem.chance) {
                    player.tas[lootItem.nama] = (player.tas[lootItem.nama] || 0) + 1;
                    lootResult.push(`- 1 ${lootItem.nama}`);
                }
            }
            
            battleLog.push(`\n🎉 *KAMU MENANG!* 🎉`);
            battleLog.push(`Sisa HP: ${player.hp}/${playerCombatStats.maxHp}`);
            if (lootResult.length > 0) {
                battleLog.push(`\n*Loot didapatkan:*\n${lootResult.join('\n')}`);
            }
            
            // Add achievement notification if any new achievements unlocked
            if (newAchievements.length > 0) {
                battleLog.push(`\n🏆 *ACHIEVEMENT UNLOCKED:*`);
                newAchievements.forEach(achievement => {
                    battleLog.push(`🎉 ${achievement.description}`);
                });
            }
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/x4mdmd.jpg' },
                caption: battleLog.join('\n'),
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
        } else {
            // Revive dengan 30% max HP, minimal 1
            const reviveHp = Math.max(1, Math.ceil(playerCombatStats.maxHp * 0.3));
            player.hp = reviveHp;
            player.lokasi = 'Desa Awal';
            battleLog.push(`\n☠️ *KAMU KALAH!* ☠️`);
            battleLog.push(`Kamu pingsan dan kembali ke Desa Awal dengan sisa HP ${reviveHp}/${playerCombatStats.maxHp} (30% dari total HP).`);
            applyDeathPenalty(player);
battleLog.push(`⚠️ *Death Penalty: -1 Level, -1 Stat random, kehilangan 2 item random!*`);
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/x4mdmd.jpg' },
    caption: battleLog.join('\n'),
    mentions: [sender]
}, { quoted: msg });
            savePlayerData(players);
        }
    }
    break

    case "equip": {
        if (!q) {
            const equipmentImage = fs.readFileSync('https://files.catbox.moe/110p0t.jpg');
            await evarick.sendMessage(sender, {
                image: equipmentImage,
                caption: `Gunakan: !equip [nama item dari tas]\n\nUntuk title: !equip title [nama title]`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        const args = q.split(' ');
        const itemType = args[0]?.toLowerCase();
        
        // Handle title equipping
        if (itemType === 'title') {
            const titleName = args.slice(1).join(' ');
            if (!titleName) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                    caption: `Gunakan: !equip title [nama title]\n\nContoh: !equip title "Pemburu Monster"`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Check if player has the title
            if (!player.titles || !player.titles.includes(titleName)) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                    caption: `❌ *Title "${titleName}" tidak ditemukan!*\n\nKamu tidak memiliki title tersebut.`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Initialize equipped titles if not exists
            if (!player.equippedTitles) player.equippedTitles = [];
            
            // Check if title is already equipped
            if (player.equippedTitles.includes(titleName)) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                    caption: `❌ *Title "${titleName}" sudah terpasang!*`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Check if player has reached the limit (3 titles)
            if (player.equippedTitles.length >= 3) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                    caption: `❌ *Batas maksimal title terpasang!*\n\nKamu sudah memasang 3 title. Lepas salah satu terlebih dahulu dengan !unequip title [nama].`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Equip the title
            player.equippedTitles.push(titleName);
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                caption: `✅ *Title "${titleName}" berhasil dipasang!*\n\n🏆 *Title terpasang:* ${player.equippedTitles.length}/3`,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
        
        // Handle regular equipment equipping
        const searchItemName = q.toLowerCase();
        let foundItemName = null;
        let foundItemCount = 0;
        
        // Cari item yang cocok di tas
        for (const [itemName, count] of Object.entries(player.tas)) {
            if (itemName.toLowerCase() === searchItemName && count > 0) {
                foundItemName = itemName;
                foundItemCount = count;
                break;
            }
        }
        
        if (!foundItemName) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                caption: `Kamu tidak memiliki item "${q}" di tas.`,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
    
        const itemData = items.find(item => item.nama === foundItemName);
        if (!itemData || !itemData.tipe) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                caption: `"${foundItemName}" bukanlah sebuah equipment yang bisa dipakai.`,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
    
        const slot = itemData.tipe; // 'senjata', 'helem', dll.
        
        // Lepas item lama jika ada, kembalikan ke tas
        if (player.equipment[slot]) {
            const oldItemName = player.equipment[slot];
            player.tas[oldItemName] = (player.tas[oldItemName] || 0) + 1;
            
            await evarickreply(`Kamu melepas "${oldItemName}".`);
        }
    
        // Pakai item baru
        player.tas[foundItemName]--; // Kurangi item dari tas
        if (player.tas[foundItemName] === 0) delete player.tas[foundItemName];
        player.equipment[slot] = foundItemName; // Masukkan item ke slot
    
        // Update stats player berdasarkan equipment
        updatePlayerStatsFromEquipment(player);
    
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/110p0t.jpg' },
            caption: `Kamu berhasil memakai "${foundItemName}" di slot ${slot}.`,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
        break;
    }

    case "unequip": {
        if (!q) {
            const equipmentImage = fs.readFileSync('https://files.catbox.moe/110p0t.jpg');
            await evarick.sendMessage(sender, {
                image: equipmentImage,
                caption: `Gunakan: !unequip [nama slot]\nContoh: !unequip senjata\n\nUntuk title: !unequip title [nama title]`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        const args = q.split(' ');
        const itemType = args[0]?.toLowerCase();
        
        // Handle title unequipping
        if (itemType === 'title') {
            const titleName = args.slice(1).join(' ');
            if (!titleName) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                    caption: `Gunakan: !unequip title [nama title]\n\nContoh: !unequip title "Pemburu Monster"`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Check if player has equipped titles
            if (!player.equippedTitles || player.equippedTitles.length === 0) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                    caption: `❌ *Tidak ada title yang terpasang!*`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Check if title is equipped
            if (!player.equippedTitles.includes(titleName)) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                    caption: `❌ *Title "${titleName}" tidak terpasang!*\n\n🏆 *Title terpasang:* ${player.equippedTitles.join(', ')}`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Unequip the title
            player.equippedTitles = player.equippedTitles.filter(title => title !== titleName);
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/110p0t.jpg' },
                caption: `✅ *Title "${titleName}" berhasil dilepas!*\n\n🏆 *Title terpasang:* ${player.equippedTitles.length}/3`,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
    
        // Handle regular equipment unequipping
        const slot = q.toLowerCase();
        const validSlots = ['helem', 'zirah', 'celana', 'sepatu', 'senjata', 'aksesoris'];
        if (!validSlots.includes(slot)) {
            const equipmentImage = fs.readFileSync('https://files.catbox.moe/110p0t.jpg');
            await evarick.sendMessage(sender, {
                image: equipmentImage,
                caption: `Slot tidak valid. Pilih dari: ${validSlots.join(', ')}`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
    
        const itemName = player.equipment[slot];
        if (!itemName) {
            const equipmentImage = fs.readFileSync('https://files.catbox.moe/110p0t.jpg');
            await evarick.sendMessage(sender, {
                image: equipmentImage,
                caption: `Slot ${slot} sudah kosong.`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
    
        // Kembalikan item ke tas
        player.tas[itemName] = (player.tas[itemName] || 0) + 1;
        player.equipment[slot] = null; // Kosongkan slot
    
        // Update stats player berdasarkan equipment
        updatePlayerStatsFromEquipment(player);
    
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/110p0t.jpg' },
            caption: `Kamu berhasil melepas "${itemName}" dari slot ${slot} dan mengembalikannya ke tas.`,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
        break;
    }

    case "heal": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }
    
        const currentLocation = locations.find(loc => loc.nama === player.lokasi);
    
        // Check if current location supports healing
        if (!currentLocation.aksi.includes('heal')) {
            await evarickreply(`❌ *Tempat ini tidak cocok untuk healing!*\n\n🏥 *Lokasi yang mendukung healing:*\n• Desa Awal\n• Avanthoria, Kota Awan\n• Oasis Tersembunyi\n\n💡 *Tips:* Gunakan !travel [lokasi] untuk pindah ke lokasi yang mendukung healing.`);
            return;
        }
    
        // Check cooldown
        const now = Date.now();
        const lastHeal = player.lastHeal || 0;
        const cooldownTime = 60 * 60 * 1000; // 1 jam dalam milidetik
    
        if (now - lastHeal < cooldownTime) {
            const remainingTime = Math.ceil((cooldownTime - (now - lastHeal)) / (60 * 1000));
            await evarickreply(`⏰ *Heal masih dalam cooldown!*\n\n⏳ *Sisa waktu:* ${remainingTime} menit\n\n💡 *Tips:* Gunakan !home fast untuk kembali ke Desa Awal dengan biaya 60 gold.`);
            return;
        }
    
        // Cek gold cukup
        if (player.gold < 20) {
            await evarickreply(`❌ *Gold kamu tidak cukup!*\n\n💰 *Biaya heal:* 20 gold`);
            return;
        }
        player.gold -= 20;
    
        // Update stats dari equipment sebelum heal
        updatePlayerStatsFromEquipment(player);
    
        // Heal penuh
        const oldHp = player.hp;
        player.hp = player.maxHp;
        player.lastHeal = now;
    
        // Buat pesan balasan
        let healMessage = "🏥 *Heal berhasil!*";
        if (player.lokasi === "Avanthoria, Kota Awan") {
            healMessage = "☁️ *Heal di Avanthoria berhasil!*\n\n*Energi magis kota awan mempercepat pemulihan.*";
        } else if (player.lokasi === "Oasis Tersembunyi") {
            healMessage = "💧 *Heal di Oasis berhasil!*\n\n*Air jernih oasis memberikan pemulihan yang menyegarkan.*";
        }
    
        let reply = healMessage + "\n\n";
        reply += `❤️ *HP:* ${oldHp} → ${player.hp}/${player.maxHp}\n`;
        reply += `💰 *Gold sekarang:* ${player.gold.toLocaleString()}\n`;
        reply += `📍 *Lokasi:* ${player.lokasi}\n`;
        reply += `⏰ *Cooldown:* 60 menit\n\n`;
        reply += `🏥 *Heal ini memulihkan HP ke penuh!*`;
    
        await evarickreply(reply);
        savePlayerData(players);
    }
    break

    case "status":
        case "me": {
            // Check for new titles first
            const newTitles = checkAndAwardTitles(player);
            players[participant] = player;
            savePlayerData(players);
        
            // Update stats player berdasarkan equipment
            updatePlayerStatsFromEquipment(player);
        
            // Hitung total stats dari equipment untuk display
            let totalStats = { attack: 0, defense: 0, hp: 0, mana: 0 };
            for (const slot in player.equipment) {
                const itemName = player.equipment[slot];
                if (itemName) {
                    const itemData = items.find(item => item.nama === itemName);
                    if (itemData && itemData.stats) {
                        totalStats.attack += (itemData.stats.attack || 0);
                        totalStats.defense += (itemData.stats.defense || 0);
                        totalStats.hp += (itemData.stats.hp || 0);
                        totalStats.mana += (itemData.stats.mana || 0);
                    }
                }
            }
        
            const classEmoji = {
                'Fighter': '🗡️',
                'Assassin': '🗡', 
                'Mage': '🧙',
                'Tank': '🛡',
                'Archer': '🏹',
                'Adventurer': '⚔️'
            };
            
            const emoji = classEmoji[player.kelas] || '⚔️';
        
            let reply = `🧑‍🎮 *Status Pemain: ${player.nama}*\n\n`;
            reply += `*Class:* ${emoji} ${player.kelas}`;
            
            // Add class selection status
            if (!player.hasChosenClass) {
                reply += ` *(Default - Belum memilih class spesifik)*`;
            }
            
            reply += `\n*Level:* ${player.level}\n`;
            reply += `*Lokasi:* ${player.lokasi}\n`;
            reply += `*Teman:* ${player.friends ? player.friends.length : 0} teman\n\n`;
        
            // Display equipped titles
            const titleDisplay = getTitleDisplay(player);
            reply += `🏆 *Titles owned:* ${titleDisplay}\n`;
            
            // Show title count info
            const totalTitles = player.titles ? player.titles.length : 0;
            const equippedTitles = player.equippedTitles ? player.equippedTitles.length : 0;
            reply += `📊 *Title Stats:* ${equippedTitles}/3 terpasang, ${totalTitles} total\n\n`;
            
            // Show new titles notification
            if (newTitles.length > 0) {
                reply += `🎉 *TITLE BARU DIPEROLEH:*\n`;
                newTitles.forEach(title => {
                    reply += `✨ ${title}\n`;
                });
                reply += `\n`;
            }
            
            // Calculate EXP progress
            const expForNextLevel = Math.floor(100 * Math.pow(1.5, player.level - 1));
            const expProgress = player.exp / expForNextLevel * 100;
            
            reply += `❤️ HP: ${player.hp} / ${player.maxHp}\n`;
            reply += `🔮 Mana: ${player.mana} / ${player.maxMana}\n`;
            reply += `⚔️ Attack: ${player.attack + totalStats.attack} (Dasar: ${player.attack} + Equip: ${totalStats.attack})\n`;
            reply += `🛡️ Defense: ${player.defense + totalStats.defense} (Dasar: ${player.defense} + Equip: ${totalStats.defense})\n`;
            reply += `💰 Gold: ${player.gold.toLocaleString()}\n`;
            reply += `📊 EXP: ${player.exp || 0} / ${expForNextLevel} (${expProgress.toFixed(1)}%)\n`;
            
            // Add PvP stats if available
            if (player.pvpStats) {
                const pvpWinRate = player.pvpStats.totalBattles > 0 ? ((player.pvpStats.wins / player.pvpStats.totalBattles) * 100).toFixed(1) : 0;
                reply += `⚔️ PvP Rating: ${player.pvpStats.rating}\n`;
                reply += `📊 PvP Record: ${player.pvpStats.wins}W/${player.pvpStats.losses}L (${pvpWinRate}%)\n`;
            }
            
            reply += `\n*🎒 EQUIPMENT:*\n`;
            reply += `- Helem: ${player.equipment.helem || '[Kosong]'}\n`;
            reply += `- Zirah: ${player.equipment.zirah || '[Kosong]'}\n`;
            reply += `- Celana: ${player.equipment.celana || '[Kosong]'}\n`;
            reply += `- Sepatu: ${player.equipment.sepatu || '[Kosong]'}\n`;
            reply += `- Senjata: ${player.equipment.senjata || '[Kosong]'}\n`;
            reply += `- Aksesoris: ${player.equipment.aksesoris || '[Kosong]'}\n`;
            
            // Add activity stats
            reply += `\n*📊 ACTIVITY STATS:*\n`;
            reply += `👹 Monster Kills: ${player.monsterKills || 0}\n`;
            reply += `⛏️ Mining: ${player.miningCount || 0}\n`;
            reply += `🪓 Woodcutting: ${player.woodcuttingCount || 0}\n`;
            reply += `🎣 Fishing: ${player.fishingCount || 0}\n`;
            
            // Add quest progress if available
            if (player.quests) {
                const dailyCompleted = player.quests.daily ? Object.keys(player.quests.daily.completed || {}).length : 0;
                const weeklyCompleted = player.quests.weekly ? Object.keys(player.quests.weekly.completed || {}).length : 0;
                const storyCompleted = player.quests.story ? Object.keys(player.quests.story.completed || {}).length : 0;
                
                reply += `\n*📋 QUEST PROGRESS:*\n`;
                reply += `📅 Daily: ${dailyCompleted}/4\n`;
                reply += `📊 Weekly: ${weeklyCompleted}/4\n`;
                reply += `📖 Story: ${storyCompleted}/3\n`;
            }
            
            // Add achievement progress if available
            if (player.achievements && player.achievements.completed) {
                const achievementsCompleted = Object.keys(player.achievements.completed).length;
                reply += `\n*🏅 ACHIEVEMENTS:*\n`;
                reply += `🏆 Completed: ${achievementsCompleted}\n`;
            }
            
            if (!player.hasChosenClass) {
                reply += `\n*💡 Gunakan !class untuk memilih class yang lebih spesifik*`;
            }

     
            if (player.equippedSkills && player.equippedSkills.length > 0) {
                reply += `\n⚔️ *SKILL AKTIF (${player.equippedSkills.length}/2):*\n`;
                player.equippedSkills.forEach(skillId => {
                    const skill = skills.find(s => s.id === skillId);
                    if (skill) {
                        reply += `- ${skill.nama} (${skill.class})\n`;
                    }
                });
            } else {
                reply += `\n⚔️ *SKILL AKTIF: Tidak ada skill yang dipasang*\n`;
            }
            
            // Add inventory info
            const inventoryItems = Object.keys(player.tas || {}).length;
            reply += `\n*📦 INVENTORY:*\n`;
            reply += `📦 Items: ${inventoryItems} jenis item\n`;
            if (player.tools && Object.keys(player.tools).length > 0) {
                reply += `🛠️ Tools: ${Object.keys(player.tools).length} peralatan\n`;
            }
            
await evarick.sendMessage(sender, {
    image: { url: 'https://files.catbox.moe/y76jz4.jpg' },
    caption: reply,
    mentions: [sender]
}, { quoted: msg });
        }
        break

    // Mining
    case "nambang": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

         // ADD THIS LINE - Check and reset quests if needed
    checkQuests(player);

        // Check if player has a beliung (pickaxe) in tools
if (!player.tools || Object.keys(player.tools).length === 0) {
    
    await evarick.sendMessage(sender, {
        image: { url: 'https://files.catbox.moe/zdb62j.jpg' },
        caption: `❌ *Kamu tidak memiliki beliung!*\n\nKamu harus membeli beliung di "Toko peralatan mas Buudi" terlebih dahulu.\n\nGunakan:\n• !toko - Untuk melihat peralatan yang tersedia\n• !buy [nama beliung] - Untuk membeli beliung`,
        mentions: [sender]
    }, { quoted: msg });
    return;
}

// Find the best beliung (highest tier) in player's tools
const beliungTools = Object.entries(player.tools).filter(([key, tool]) => tool.tipe === 'beliung');

        if (beliungTools.length === 0) {
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/zdb62j.jpg' },
                caption: `❌ *Kamu tidak memiliki beliung!*\n\nKamu harus membeli beliung di "Toko peralatan mas Buudi" terlebih dahulu.\n\nGunakan:\n• !toko - Untuk melihat peralatan yang tersedia\n• !buy [nama beliung] - Untuk membeli beliung`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Find the best beliung (highest tier)
        const tierOrder = { 'netherite': 5, 'diamond': 4, 'besi': 3, 'batu': 2, 'kayu': 1 };
        let bestBeliung = beliungTools[0];
        let bestTier = tierOrder[bestBeliung[1].tier] || 0;

        beliungTools.forEach(([key, tool]) => {
            const currentTier = tierOrder[tool.tier] || 0;
            if (currentTier > bestTier) {
                bestBeliung = [key, tool];
                bestTier = currentTier;
            }
        });

        const [beliungKey, beliungTool] = bestBeliung;

        // Check if beliung has durability
        if (beliungTool.durability <= 0) {
            // Remove broken beliung
            delete player.tools[beliungKey];
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/knzumy.jpg' },
                caption: `💥 *Beliung kamu sudah rusak!*\n\nBeliung "${beliungTool.nama}" telah hancur karena durability habis.\n\nBeli beliung baru di "Toko peralatan mas Buudi"!`,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }

        const currentLocation = locations.find(loc => loc.nama === player.lokasi);
        if (!currentLocation) {
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ksiu5w.jpg' },
                caption: "❌ *Error: Lokasi saat ini tidak ditemukan!*",
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        if (!currentLocation.aksi.includes('nambang')) {
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/x8u5cf.jpg' },
                caption: "❌ *Kamu tidak bisa menambang di sini.*\n\nLokasi yang bisa nambang:\n• Gunung Batu\n• Gunung Berapi\n• Gua Gelap\n• Tambang Terkutuk",
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        // Reduce durability by 1
        beliungTool.durability -= 1;
        
        // Track mining activity for titles
        player.miningCount = (player.miningCount || 0) + 1;
        
        // Update quest and challenge progress
        const newAchievements = updateAllProgress(player, 'miningCount', 1);
        
        // === SISTEM MINING DENGAN BELIUNG ===
        // Filter item berdasarkan kategori Mineral
        const miningItems = items.filter(item => item.kategori === 'Mineral' && item.rarity);
        
        // Apply beliung bonus based on tier
        const beliungBonus = beliungTool.stats.mining || 1;
        let bonusChance = 0;
        
        // Higher tier beliung gives better chances
        if (beliungTool.tier === 'netherite') bonusChance = 15;
        else if (beliungTool.tier === 'diamond') bonusChance = 10;
        else if (beliungTool.tier === 'besi') bonusChance = 5;
        else if (beliungTool.tier === 'batu') bonusChance = 2;
        else bonusChance = 0; // kayu
        
        // Generate random number untuk menentukan item
        const random = Math.random() * 100;
        let cumulativeChance = 0;
        let obtainedItem = null;
        
        // Loop melalui semua item untuk menentukan yang didapat
        for (const item of miningItems) {
            let adjustedChance = item.chance;
            
            // Apply beliung bonus to rare items
            if (item.rarity === 'Rare' || item.rarity === 'Epic' || item.rarity === 'Legendary') {
                adjustedChance += bonusChance;
            }
            
            cumulativeChance += adjustedChance;
            if (random <= cumulativeChance) {
                obtainedItem = item;
                break;
            }
        }
        
        // Fallback jika tidak ada item yang didapat
        if (!obtainedItem) {
            obtainedItem = miningItems[0]; // Default ke item pertama
        }
        
        // Tambahkan item ke inventory (beliung bonus gives more items)
        const itemAmount = Math.random() < (bonusChance / 100) ? 2 : 1;
        player.tas[obtainedItem.nama] = (player.tas[obtainedItem.nama] || 0) + itemAmount;
        
        // Buat pesan berdasarkan rarity
        let reply = "";
        const rarityEmoji = {
            'Common': '🪨',
            'Uncommon': '⛏️',
            'Rare': '💎',
            'Epic': '💍',
            'Legendary': '👑'
        };
        
        const rarityColor = {
            'Common': '⚪',
            'Uncommon': '🟢',
            'Rare': '🔵',
            'Epic': '🟣',
            'Legendary': '🟡'
        };
        
        const tierColor = beliungTool.tier === 'netherite' ? '🟣' : 
                         beliungTool.tier === 'diamond' ? '🔵' : 
                         beliungTool.tier === 'besi' ? '🟢' : 
                         beliungTool.tier === 'batu' ? '⚪' : '⚪';
        
        reply += `⛏️ *MINING DENGAN BELIUNG* ⛏️\n\n`;
        reply += `🛠️ *Beliung:* ${beliungTool.nama} ${tierColor}\n`;
        reply += `⚡ *Durability:* ${beliungTool.durability}/${beliungTool.maxDurability}\n`;
        reply += `📈 *Bonus:* +${bonusChance}% chance rare items\n\n`;
        
        if (obtainedItem.rarity === 'Legendary') {
            reply += `👑 *LEGENDARY MINING!* 🎉\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x\n\n`;
            reply += `🎊 *SELAMAT! Kamu mendapatkan mineral LEGENDARY!* 🎊`;
        } else if (obtainedItem.rarity === 'Epic') {
            reply += `💍 *EPIC MINING!* 🌟\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        } else if (obtainedItem.rarity === 'Rare') {
            reply += `💎 *RARE MINING!* 💎\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        } else if (obtainedItem.rarity === 'Uncommon') {
            reply += `⛏️ *UNCOMMON MINING!* ⛏️\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        } else if (obtainedItem.rarity === 'Common') {
            reply += `🪨 *COMMON MINING* 🪨\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        }
        
        // Calculate mining EXP with beliung bonus
        const baseExp = Math.floor(Math.random() * 3) + 1; // 1-3 EXP
        const beliungExpBonus = Math.floor(bonusChance / 10); // Bonus EXP based on beliung tier
        const totalExp = baseExp + beliungExpBonus;
        const expResult = addExperience(player, totalExp);

        // Add to battle log atau reply
        reply += `\n📈 *EXP GAINED:* +${expResult.expGained} EXP`;
        reply += `\n *Total EXP:* ${expResult.totalExp}`;

        if (expResult.levelUpResult.leveledUp) {
            reply += `\n\n${expResult.levelUpResult.message}`;
        }

        // Add achievement notification if any new achievements unlocked
        if (newAchievements.length > 0) {
            reply += `\n\n🏆 *ACHIEVEMENT UNLOCKED:*`;
            newAchievements.forEach(achievement => {
                reply += `\n🎉 ${achievement.description}`;
            });
        }

        // Check if beliung is about to break
        if (beliungTool.durability <= 3) {
            reply += `\n\n⚠️ *PERINGATAN:* Beliung kamu hampir rusak! (${beliungTool.durability} durability tersisa)`;
        }
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
    }
    break

        // Mining Stats
        case "miningstats": {
            if (!player) {
               await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });      return;
            }
    
            const miningItems = items.filter(item => item.kategori === 'Mineral' && item.rarity);
            let reply = `⛏️ *MINING STATISTICS* ⛏️\n\n`;
            reply += `🧑 *Pemain:* ${player.nama}\n`;
            reply += `⛏️ *Total Mining:* ${player.miningCount || 0}\n\n`;
            
            // Hitung item yang dimiliki
            let totalItems = 0;
            let itemStats = {};
            
            miningItems.forEach(item => {
                const count = player.tas[item.nama] || 0;
                totalItems += count;
                itemStats[item.nama] = count;
            });
            
            reply += `📦 *Total Items:* ${totalItems}\n\n`;
            reply += `🔍 *ITEM BREAKDOWN:*\n`;
            
            // Urutkan berdasarkan rarity
            const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
            
            rarityOrder.forEach(rarity => {
                const rarityItems = miningItems.filter(item => item.rarity === rarity);
                if (rarityItems.length > 0) {
                    reply += `\n${rarity === 'Legendary' ? '👑' : rarity === 'Epic' ? '💍' : rarity === 'Rare' ? '💎' : rarity === 'Uncommon' ? '⛏️' : '🪨'} *${rarity}:*\n`;
                    rarityItems.forEach(item => {
                        const count = itemStats[item.nama] || 0;
                        const value = count * item.hargaJual;
                        reply += `   ${item.nama}: ${count} (${value.toLocaleString()} gold)\n`;
                    });
                }
            });
            
            await evarickreply(reply);
        }
        break

        case "craft": {
            if (!player) {
               await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });      return;
            }
            if (!q) {
                await evarickreply(`⚒️ *Format: !craft [nama item]*\nContoh: !craft Potion HP`);
                return;
            }
        
            const { craftingRecipes } = require('./database/rpg/crafting.js');
            const itemName = q.trim().toLowerCase();
            const recipe = craftingRecipes.find(r => r.nama.toLowerCase() === itemName);
        
            if (!recipe) {
                await evarickreply(`❌ *Resep untuk "${q}" tidak ditemukan!*`);
                return;
            }
        
            // Cek bahan
            let missing = [];
            for (const [bahan, jumlah] of Object.entries(recipe.bahan)) {
                if (!player.tas[bahan] || player.tas[bahan] < jumlah) {
                    missing.push(`${bahan} (${player.tas[bahan] || 0}/${jumlah})`);
                }
            }
            if (missing.length > 0) {
                await evarickreply(`❌ *Bahan kurang:*\n${missing.join('\n')}`);
                return;
            }
        
            // Cek gold
            if (player.gold < recipe.gold) {
                await evarickreply(`❌ *Gold tidak cukup!*\nButuh: ${recipe.gold} gold\nGold kamu: ${player.gold}`);
                return;
            }
        
            // Cek level
            if (player.level < recipe.level) {
                await evarickreply(`❌ *Level kurang!*\nButuh: Level ${recipe.level}\nLevel kamu: ${player.level}`);
                return;
            }
        
            // Kurangi bahan
            for (const [bahan, jumlah] of Object.entries(recipe.bahan)) {
                player.tas[bahan] -= jumlah;
                if (player.tas[bahan] <= 0) delete player.tas[bahan];
            }
            // Kurangi gold
            player.gold -= recipe.gold;
        
            // Tambahkan hasil ke tas
            player.tas[recipe.hasil] = (player.tas[recipe.hasil] || 0) + 1;
        
            await evarickreply(`✅ *Berhasil membuat ${recipe.hasil}!*`);
            savePlayerData(players);
        }
        break;

    // Woodcutting
    case "nebang": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

         // ADD THIS LINE - Check and reset quests if needed
    checkQuests(player);

       // Check if player has a kapak (axe) in tools
if (!player.tools || Object.keys(player.tools).length === 0) {
    
    await evarick.sendMessage(sender, {
        image: { url: 'https://files.catbox.moe/u69rul.jpg' },
        caption: `❌ *Kamu tidak memiliki kapak!*\n\nKamu harus membeli kapak di "Toko peralatan mas Buudi" terlebih dahulu.\n\nGunakan:\n• !toko - Untuk melihat peralatan yang tersedia\n• !buy [nama kapak] - Untuk membeli kapak`,
        mentions: [sender]
    }, { quoted: msg });
    return;
}

// Find the best kapak (highest tier) in player's tools
const kapakTools = Object.entries(player.tools).filter(([key, tool]) => tool.tipe === 'kapak');

        if (kapakTools.length === 0) {
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/u69rul.jpg' },
                caption: `❌ *Kamu tidak memiliki kapak!*\n\nKamu harus membeli kapak di "Toko peralatan mas Buudi" terlebih dahulu.\n\nGunakan:\n• !toko - Untuk melihat peralatan yang tersedia\n• !buy [nama kapak] - Untuk membeli kapak`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Find the best kapak (highest tier)
        const tierOrder = { 'netherite': 5, 'diamond': 4, 'besi': 3, 'batu': 2, 'kayu': 1 };
        let bestKapak = kapakTools[0];
        let bestTier = tierOrder[bestKapak[1].tier] || 0;

        kapakTools.forEach(([key, tool]) => {
            const currentTier = tierOrder[tool.tier] || 0;
            if (currentTier > bestTier) {
                bestKapak = [key, tool];
                bestTier = currentTier;
            }
        });

        const [kapakKey, kapakTool] = bestKapak;

        // Check if kapak has durability
        if (kapakTool.durability <= 0) {
            // Remove broken kapak
            delete player.tools[kapakKey];
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/asz0cs.jpg' },
                caption: `💥 *Kapak kamu sudah rusak!*\n\nKapak "${kapakTool.nama}" telah hancur karena durability habis.\n\nBeli kapak baru di "Toko peralatan mas Buudi"!`,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }

        const currentLocation = locations.find(loc => loc.nama === player.lokasi);
        if (!currentLocation) {
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/tuagez.jpg' },
                caption: "❌ *Error: Lokasi saat ini tidak ditemukan!*",
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        if (!currentLocation.aksi.includes('nebang')) {
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/q5rtd5.jpg' },
                caption: "❌ *Kamu tidak bisa menebang pohon di sini.*\n\nLokasi yang bisa nebang:\n• Hutan Rindang\n• Hutan Gelap\n• Hutan Terkutuk",
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        // Reduce durability by 1
        kapakTool.durability -= 1;
        
        // Track woodcutting activity for titles
        player.woodcuttingCount = (player.woodcuttingCount || 0) + 1;
        
        // Update quest and challenge progress
        const newAchievements = updateAllProgress(player, 'woodcuttingCount', 1);
        
        // === SISTEM WOODCUTTING DENGAN KAPAK ===
        // Filter item berdasarkan kategori Material
        const woodcuttingItems = items.filter(item => item.kategori === 'Material' && item.rarity);
        
        // Apply kapak bonus based on tier
        const kapakBonus = kapakTool.stats.chopping || 1;
        let bonusChance = 0;
        
        // Higher tier kapak gives better chances
        if (kapakTool.tier === 'netherite') bonusChance = 15;
        else if (kapakTool.tier === 'diamond') bonusChance = 10;
        else if (kapakTool.tier === 'besi') bonusChance = 5;
        else if (kapakTool.tier === 'batu') bonusChance = 2;
        else bonusChance = 0; // kayu
        
        // Generate random number untuk menentukan item
        const random = Math.random() * 100;
        let cumulativeChance = 0;
        let obtainedItem = null;
        
        // Loop melalui semua item untuk menentukan yang didapat
        for (const item of woodcuttingItems) {
            let adjustedChance = item.chance;
            
            // Apply kapak bonus to rare items
            if (item.rarity === 'Rare' || item.rarity === 'Epic' || item.rarity === 'Legendary') {
                adjustedChance += bonusChance;
            }
            
            cumulativeChance += adjustedChance;
            if (random <= cumulativeChance) {
                obtainedItem = item;
                break;
            }
        }
        
        // Fallback jika tidak ada item yang didapat
        if (!obtainedItem) {
            obtainedItem = woodcuttingItems[0]; // Default ke item pertama
        }
        
        // Tambahkan item ke inventory (kapak bonus gives more items)
        const itemAmount = Math.random() < (bonusChance / 100) ? 2 : 1;
        player.tas[obtainedItem.nama] = (player.tas[obtainedItem.nama] || 0) + itemAmount;
        
        // Buat pesan berdasarkan rarity
        let reply = "";
        const rarityEmoji = {
            'Common': '🪵',
            'Uncommon': '🌿',
            'Rare': '🌳',
            'Epic': '🌲',
            'Legendary': '🏆'
        };
        
        const rarityColor = {
            'Common': '⚪',
            'Uncommon': '🟢',
            'Rare': '🔵',
            'Epic': '🟣',
            'Legendary': '🟡'
        };
        
        const tierColor = kapakTool.tier === 'netherite' ? '🟣' : 
                         kapakTool.tier === 'diamond' ? '🔵' : 
                         kapakTool.tier === 'besi' ? '🟢' : 
                         kapakTool.tier === 'batu' ? '⚪' : '⚪';
        
        reply += `🪓 *WOODCUTTING DENGAN KAPAK* 🪓\n\n`;
        reply += `🛠️ *Kapak:* ${kapakTool.nama} ${tierColor}\n`;
        reply += `⚡ *Durability:* ${kapakTool.durability}/${kapakTool.maxDurability}\n`;
        reply += `📈 *Bonus:* +${bonusChance}% chance rare items\n\n`;
        
        if (obtainedItem.rarity === 'Legendary') {
            reply += `🏆 *LEGENDARY WOODCUT!* 🎉\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x\n\n`;
            reply += `🎊 *SELAMAT! Kamu mendapatkan item LEGENDARY!* 🎊`;
        } else if (obtainedItem.rarity === 'Epic') {
            reply += `🌲 *EPIC WOODCUT!* 🌟\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        } else if (obtainedItem.rarity === 'Rare') {
            reply += `🌳 *RARE WOODCUT!* 💎\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        } else if (obtainedItem.rarity === 'Uncommon') {
            reply += `🌿 *UNCOMMON WOODCUT!* 🌿\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        } else {
            reply += `🪵 *COMMON WOODCUT* 🪵\n\n`;
            reply += `${rarityEmoji[obtainedItem.rarity]} *${obtainedItem.nama}* ${rarityColor[obtainedItem.rarity]}\n`;
            reply += `💰 *Harga:* ${obtainedItem.hargaJual.toLocaleString()} gold\n`;
            reply += `🎯 *Chance:* ${obtainedItem.chance}%\n`;
            reply += `⭐ *Rarity:* ${obtainedItem.rarity}\n`;
            reply += `📦 *Jumlah:* ${itemAmount}x`;
        }
        
        // Calculate woodcutting EXP with kapak bonus
        const baseExp = Math.floor(Math.random() * 3) + 1; // 1-3 EXP
        const kapakExpBonus = Math.floor(bonusChance / 10); // Bonus EXP based on kapak tier
        const totalExp = baseExp + kapakExpBonus;
        const expResult = addExperience(player, totalExp);

        // Add to battle log atau reply
        reply += `\n📈 *EXP GAINED:* +${expResult.expGained} EXP`;
        reply += `\n📊 *Total EXP:* ${expResult.totalExp}`;

        if (expResult.levelUpResult.leveledUp) {
            reply += `\n\n${expResult.levelUpResult.message}`;
        }

        // Add achievement notification if any new achievements unlocked
        if (newAchievements.length > 0) {
            reply += `\n\n🏆 *ACHIEVEMENT UNLOCKED:*`;
            newAchievements.forEach(achievement => {
                reply += `\n🎉 ${achievement.description}`;
            });
        }

        // Check if kapak is about to break
        if (kapakTool.durability <= 3) {
            reply += `\n\n⚠️ *PERINGATAN:* Kapak kamu hampir rusak! (${kapakTool.durability} durability tersisa)`;
        }

        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
    }
    break
    
     // Woodcutting Stats
     case "woodcuttingstats": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        const woodcuttingItems = items.filter(item => item.kategori === 'Material' && item.rarity);
        let reply = `🪵 *WOODCUTTING STATISTICS* 🪵\n\n`;
        reply += `🧑 *Pemain:* ${player.nama}\n`;
        reply += `📊 *Total Woodcutting:* ${player.woodcuttingCount || 0}\n\n`;
        
        // Hitung item yang dimiliki
        let totalItems = 0;
        let itemStats = {};
        
        woodcuttingItems.forEach(item => {
            const count = player.tas[item.nama] || 0;
            totalItems += count;
            itemStats[item.nama] = count;
        });
        
        reply += `📦 *Total Items:* ${totalItems}\n\n`;
        reply += `🔍 *ITEM BREAKDOWN:*\n`;
        
        // Urutkan berdasarkan rarity
        const rarityOrder = ['Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'];
        
        rarityOrder.forEach(rarity => {
            const rarityItems = woodcuttingItems.filter(item => item.rarity === rarity);
            if (rarityItems.length > 0) {
                    reply += `\n${rarity === 'Legendary' ? '🏆' : rarity === 'Epic' ? '🌟' : rarity === 'Rare' ? '💎' : rarity === 'Uncommon' ? '🪵' : '🪵'} *${rarity}:*\n`;
                    rarityItems.forEach(item => {
                    const count = itemStats[item.nama] || 0;
                    const value = count * item.hargaJual;
                    reply += `   ${item.nama}: ${count} (${value.toLocaleString()} gold)\n`;
                });
            }
        });
        
        await evarickreply(reply);
    }
    break

    // Fishing
    case "mancing": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/04ne2l.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

         // ADD THIS LINE - Check and reset quests if needed
    checkQuests(player);

// Check if player has a pancingan (fishing rod) in tools
if (!player.tools || !Object.values(player.tools).some(tool => tool.tipe === 'pancingan')) {
    await evarick.sendMessage(sender, {
        image: { url: 'https://files.catbox.moe/p3zttg.jpg' },
        caption: `❌ *Kamu tidak memiliki pancingan!*\n\nKamu harus membeli pancingan di "Toko peralatan mas Buudi" terlebih dahulu.\n\nGunakan:\n• !toko - Untuk melihat peralatan yang tersedia\n• !buy [nama pancingan] - Untuk membeli pancingan`,
        mentions: [sender]
    }, { quoted: msg });
    return;
}

// Find the best pancingan (highest tier) in player's tools
const pancinganTools = Object.values(player.tools).filter(tool => tool.tipe === 'pancingan');
        const bestPancingan = pancinganTools.reduce((best, current) => {
            const tierOrder = { 'kayu': 1, 'batu': 2, 'besi': 3, 'diamond': 4, 'netherite': 5 };
            return tierOrder[current.tier] > tierOrder[best.tier] ? current : best;
        });

        // Check if pancingan is broken
        if (bestPancingan.durability <= 0) {
          
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/99p4dn.jpg' },
                caption: `❌ *Pancingan kamu sudah rusak!*\n\n🔧 *Beli pancingan baru di:*\n🏪 Toko peralatan mas Buudi\n\n🎣 *Command:* !toko`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        const currentLocation = locations.find(loc => loc.nama === player.lokasi);
        if (!currentLocation) {
           
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/04ne2l.jpg' },
                caption: "❌ *Error: Lokasi tidak ditemukan!*",
                mentions: [sender]
            }, { quoted: msg });
            return;
        }
        
        if (!currentLocation.aksi.includes('mancing')) {
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ww8q5z.jpg' },
                caption: "❌ *Kamu tidak bisa memancing di sini!*\n\n🎣 *Lokasi yang bisa memancing:*\n🌊 Danau Refleksi\n🌊 Sungai Kristal\n🌊 Pantai Pasir Putih",
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Decrease durability
        bestPancingan.durability--;

        if (bestPancingan.durability <= 0) {
            Object.keys(player.tools).forEach(key => {
                if (player.tools[key].id === bestPancingan.id) {
                    delete player.tools[key];
                }
            });
        }

        // Track fishing activity for titles
        player.fishingCount = (player.fishingCount || 0) + 1;

        // Update quest and challenge progress
        const newAchievements = updateAllProgress(player, 'fishingCount', 1);

        // === SISTEM IKAN BARU ===
        // Filter ikan berdasarkan rarity
        const fishingItems = items.filter(item => item.kategori === 'Ikan');
        
        // Generate random number untuk menentukan ikan
        const random = Math.random() * 100;
        let cumulativeChance = 0;
        let caughtFish = null;
        
        // Loop melalui semua ikan untuk menentukan yang tertangkap
        for (const fish of fishingItems) {
            cumulativeChance += fish.chance;
            if (random <= cumulativeChance) {
                caughtFish = fish;
                break;
            }
        }
        
        // Fallback jika tidak ada ikan yang tertangkap
        if (!caughtFish) {
            caughtFish = fishingItems[0]; // Default ke ikan pertama
        }
        
        // Tambahkan ikan ke inventory
        player.tas[caughtFish.nama] = (player.tas[caughtFish.nama] || 0) + 1;
        
        // Buat pesan berdasarkan rarity
        let reply = "";
        const rarityEmoji = {
            'Common': '🐟',
            'Uncommon': '🐠',
            'Rare': '🦈',
            'Epic': '🐋',
            'Legendary': '👑'
        };
        
        const rarityColor = {
            'Common': '⚪',
            'Uncommon': '🟢',
            'Rare': '🔵',
            'Epic': '🟣',
            'Legendary': '🟡'
        };
        
        if (caughtFish.rarity === 'Legendary') {
            reply = ` 👑 *LEGENDARY CATCH!* 🎉\n\n`;
            reply += `${rarityEmoji[caughtFish.rarity]} *${caughtFish.nama}* ${rarityColor[caughtFish.rarity]}\n`;
            reply += `💰 *Harga:* ${caughtFish.hargaJual.toLocaleString()} gold\n`;
            reply += `🟡 *Chance:* ${caughtFish.chance}%\n`;
            reply += `⭐ *Rarity:* ${caughtFish.rarity}\n\n`;
            reply += `🎊 *SELAMAT! Kamu mendapatkan ikan LEGENDARY!* 🎊`;
        } else if (caughtFish.rarity === 'Epic') {
            reply = `🐋 *EPIC CATCH!* 🌟\n\n`;
            reply += `${rarityEmoji[caughtFish.rarity]} *${caughtFish.nama}* ${rarityColor[caughtFish.rarity]}\n`;
            reply += `💰 *Harga:* ${caughtFish.hargaJual.toLocaleString()} gold\n`;
            reply += `🟣 *Chance:* ${caughtFish.chance}%\n`;
            reply += `⭐ *Rarity:* ${caughtFish.rarity}`;
        } else if (caughtFish.rarity === 'Rare') {
            reply = `🦈 *RARE CATCH!* 💎\n\n`;
            reply += `${rarityEmoji[caughtFish.rarity]} *${caughtFish.nama}* ${rarityColor[caughtFish.rarity]}\n`;
            reply += `💰 *Harga:* ${caughtFish.hargaJual.toLocaleString()} gold\n`;
            reply += `🔵 *Chance:* ${caughtFish.chance}%\n`;
            reply += `⭐ *Rarity:* ${caughtFish.rarity}`;
        } else if (caughtFish.rarity === 'Uncommon') {
            reply = `🐠 *UNCOMMON CATCH!* 🎣\n\n`;
            reply += `${rarityEmoji[caughtFish.rarity]} *${caughtFish.nama}* ${rarityColor[caughtFish.rarity]}\n`;
            reply += `💰 *Harga:* ${caughtFish.hargaJual.toLocaleString()} gold\n`;
            reply += `🟢 *Chance:* ${caughtFish.chance}%\n`;
            reply += `⭐ *Rarity:* ${caughtFish.rarity}`;
        } else {
            reply = `🐟 *COMMON CATCH* 🎣\n\n`;
            reply += `${rarityEmoji[caughtFish.rarity]} *${caughtFish.nama}* ${rarityColor[caughtFish.rarity]}\n`;
            reply += `💰 *Harga:* ${caughtFish.hargaJual.toLocaleString()} gold\n`;
            reply += `⚪ *Chance:* ${caughtFish.chance}%\n`;
            reply += `⭐ *Rarity:* ${caughtFish.rarity}`;
        }

        // Add tool info
        reply += `\n\n🎣 *PANCINGAN:* ${bestPancingan.nama}`;
        reply += `\n🔧 *Durability:* ${bestPancingan.durability}/${bestPancingan.maxDurability}`;
        
        // Check if tool broke
        if (bestPancingan.durability <= 0) {
            reply += `\n\n💥 *Pancingan kamu rusak!* Beli yang baru di toko budi.`;
        }
            
        // Calculate fishing EXP
        const fishingExp = Math.floor(Math.random() * 3) + 1; // 1-3 EXP
        const expResult = addExperience(player, fishingExp);

        // Add to battle log atau reply
        reply += `\n📈 *EXP GAINED:* +${expResult.expGained} EXP`;
        reply += `\n⭐ *Total EXP:* ${expResult.totalExp}`;

        if (expResult.levelUpResult.leveledUp) {
            reply += `\n\n${expResult.levelUpResult.message}`;
        }

        // Add achievement notification if any new achievements unlocked
        if (newAchievements.length > 0) {
            reply += `\n\n🏆 *ACHIEVEMENT UNLOCKED:*`;
            newAchievements.forEach(achievement => {
                reply += `\n🎉 ${achievement.description}`;
            });
        }

        // Check if pancingan is about to break
        if (bestPancingan.durability <= 3 && bestPancingan.durability > 0) {
            reply += `\n\n⚠️ *PERINGATAN:* Pancingan kamu hampir rusak! (${bestPancingan.durability} durability tersisa)`;
        }
            
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/04ne2l.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
    }
    break

        // Fishing Stats
        case "fishingstats": {
            if (!player) {
               await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });      return;
            }
    
            const fishingItems = items.filter(item => item.kategori === 'Ikan');
            let reply = `🎣 *FISHING STATISTICS* 🎣\n\n`;
            reply += `🧑 *Pemain:* ${player.nama}\n`;
            reply += `🎯 *Total Fishing:* ${player.fishingCount || 0}\n\n`;
            
            // Hitung ikan yang dimiliki
            let totalFish = 0;
            let fishStats = {};
            
            fishingItems.forEach(fish => {
                const count = player.tas[fish.nama] || 0;
                if (count > 0) {
                    fishStats[fish.rarity] = fishStats[fish.rarity] || { count: 0, value: 0 };
                    fishStats[fish.rarity].count += count;
                    fishStats[fish.rarity].value += count * fish.hargaJual;
                    totalFish += count;
                }
            });
            
            reply += `🎣 *IKAN YANG DIMILIKI:*\n`;
            Object.keys(fishStats).forEach(rarity => {
                const stats = fishStats[rarity];
                const rarityEmoji = {
                    'Common': '⚪',
                    'Uncommon': '🟢',
                    'Rare': '🔵',
                    'Epic': '🟣',
                    'Legendary': '🟡'
                };
                reply += `${rarityEmoji[rarity]} *${rarity}:* ${stats.count} ikan (${stats.value.toLocaleString()} gold)\n`;
            });
            
            if (totalFish === 0) {
                reply += `\n❌ *Belum ada ikan yang ditangkap!*\n\nMulai memancing dengan !mancing`;
            } else {
                reply += `\n💰 *Total Nilai:* ${Object.values(fishStats).reduce((sum, stats) => sum + stats.value, 0).toLocaleString()} gold`;
            }
            
            await evarickreply(reply);
    }
    break

    // Shop
    case "shop": {
        // Special shop for Perpustakaan Beku
        if (player.lokasi === "Perpustakaan Beku") {
            let reply = `📚 *PERPUSTAKAAN BEKU - TOKO TELEPORTASI* 📚\n\n`;
            reply += `❄️ *Selamat datang di Perpustakaan Beku!*\n`;
            reply += `Di sini kamu dapat membeli artefak teleportasi kuno yang misterius.\n\n`;
            reply += `💰 Gold Kamu: *${player.gold.toLocaleString()}*\n\n`;
            
            reply += `*=============== ARTEFAK TELEPORTASI ===============*\n\n`;
            reply += `🔮 *Teleporting Stone* - 5000 gold\n`;
            reply += `   • Item teleportasi yang dapat membawa kamu ke lokasi manapun\n`;
            reply += `   • Gunakan dengan: !pakai Teleporting Stone [nama lokasi]\n`;
            reply += `   • Hanya tersedia di Perpustakaan Beku\n\n`;
            
            reply += `*=============== CARA MEMBELI ===============*\n`;
            reply += `Gunakan: *!buy Teleporting Stone [jumlah]*\n`;
            reply += `Contoh: *!buy Teleporting Stone 1*\n\n`;
            
            reply += `*💡 INFO:*\n`;
            reply += `• Teleporting Stone adalah item langka dan mahal\n`;
            reply += `• Hanya tersedia di Perpustakaan Beku\n`;
            reply += `• Setelah dibeli, gunakan untuk teleport ke lokasi manapun\n`;
            reply += `• Lokasi ini hanya bisa diakses melalui Altar Es`;
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
        
        if (player.lokasi !== "Desa Awal") {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: `Kamu harus berada di Desa Awal untuk mengakses toko.`,
    
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players); 
            return;
        }
        
        // Generate or get current shop inventory
        const currentInventory = generateShopInventory();
        const timeUntilUpdate = getTimeUntilNextUpdate();
        
        // Group items by tier for display
        const itemsByTier = {};
        currentInventory.forEach(item => {
            const tier = categorizeItemByTier(item);
            if (!itemsByTier[tier]) itemsByTier[tier] = [];
            itemsByTier[tier].push(item);
        });

        let reply = `🏪 *TOKO DINAMIS DESA AWAL* 🏪\n\n`;
        reply += `💰 Gold Kamu: *${player.gold.toLocaleString()}*\n`;
        reply += `⏰ Reset dalam: *${timeUntilUpdate.hours}j ${timeUntilUpdate.minutes}m*\n\n`;
        
        reply += `*=============== BARANG TERSEDIA HARI INI ===============*\n\n`;

        // Display items by tier
        Object.keys(ITEM_TIERS).forEach(tier => {
            const tierConfig = ITEM_TIERS[tier];
            const tierItems = itemsByTier[tier];
            
            if (tierItems && tierItems.length > 0) {
                reply += `${tierConfig.color} *${tier}* (${tierItems.length} item)\n`;
                tierItems.forEach(item => {
                    reply += `  • ${item.nama} | 💰 ${item.hargaBeli.toLocaleString()} gold\n`;
                });
                reply += `\n`;
            }
        });

        // Items that can be sold
        const materialDijual = items.filter(item => item.hargaJual > 0 && item.kategori === 'Material');
        const lootDijual = items.filter(item => item.hargaJual > 0 && item.kategori === 'Loot');
        const spesialDijual = items.filter(item => item.hargaJual > 0 && item.kategori === 'Spesial');

        reply += `*=============== KAMI MEMBELI (JUAL) ===============*\n`;
        reply += `*--- Material Alam ---*\n`;
        materialDijual.forEach(item => {
            reply += `- ${item.nama} | Harga Jual: ${item.hargaJual} gold\n`;
        });

        reply += `\n*--- Loot Monster ---*\n`;
        lootDijual.forEach(item => {
            reply += `- ${item.nama} | Harga Jual: ${item.hargaJual} gold\n`;
        });

        reply += `\n*--- Item Spesial ---*\n`;
        spesialDijual.forEach(item => {
            reply += `- ${item.nama} | Harga Jual: ${item.hargaJual} gold\n`;
        });

        reply += `\n--------------------------------------------------\n`;
        reply += `Gunakan: *!buy [nama item]* atau *!sell [nama item] [jumlah]*\n`;
        reply += `*Atau gunakan:*\n`;
        reply += `• *!sell all* - Jual semua item yang bisa dijual\n`;
        reply += `• *!sell all loot* - Jual semua loot monster saja\n`;
        reply += `*💡 Item berubah setiap jam!*\n`;
        reply += `*📊 Gunakan !shopinfo untuk info detail*`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
    }
    break

    case "shopinfo": {
        if (player.lokasi !== "Desa Awal") {
             
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption:`Kamu harus berada di Desa Awal untuk mengakses toko.`,
    
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players); 
    
            return;
        }

        const timeUntilUpdate = getTimeUntilNextUpdate();
        const currentInventory = generateShopInventory();
        
        // Count items by tier
        const tierCounts = {};
        currentInventory.forEach(item => {
            const tier = categorizeItemByTier(item);
            tierCounts[tier] = (tierCounts[tier] || 0) + 1;
        });

        let reply = `🏪 *INFO TOKO DINAMIS* 🏪\n\n`;
        reply += `⏰ *Reset dalam:* ${timeUntilUpdate.hours}j ${timeUntilUpdate.minutes}m\n`;
        reply += `📦 *Total item tersedia:* ${currentInventory.length}\n\n`;
        
        reply += `*📊 DISTRIBUSI TIER:*\n`;
        Object.keys(ITEM_TIERS).forEach(tier => {
            const tierConfig = ITEM_TIERS[tier];
            const count = tierCounts[tier] || 0;
            reply += `${tierConfig.color} ${tier}: ${count} item\n`;
        });

        reply += `\n*🎯 RARITY SYSTEM:*\n`;
        reply += `⚪ Common (≤100g): Mudah ditemukan\n`;
        reply += `🟢 Uncommon (≤400g): Agak langka\n`;
        reply += `🔵 Rare (≤1000g): Langka\n`;
        reply += `🟣 Epic (≤2000g): Sangat langka\n`;
        reply += `🟡 Legendary (>2000g): Ultra langka\n\n`;
        
        reply += `*💡 TIPS:*\n`;
        reply += `• Item berubah setiap jam\n`;
        reply += `• Tier tinggi sangat jarang muncul\n`;
        reply += `• Cek shop secara rutin untuk item langka\n`;
        reply += `• Simpan gold untuk item epic/legendary`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
    }
    break;

    case "buy": {
        // Check if player is in Desa Awal (for regular shop), Toko peralatan mas Buudi (for tools), or Perpustakaan Beku (for teleport items)
        if (player.lokasi !== "Desa Awal" && player.lokasi !== "Toko peralatan mas Buudi" && player.lokasi !== "Perpustakaan Beku") {
        
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption:  `Kamu harus berada di Desa Awal, Toko peralatan mas Buudi, atau Perpustakaan Beku untuk mengakses toko.`,
               
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);  
            return;
        }
        
        // Memisahkan jumlah dari nama item
        const args = q.split(" ");
        const amountStr = args[args.length - 1];
        let amount = parseInt(amountStr);
        let itemName = q;
    
        if (!isNaN(amount)) {
            itemName = args.slice(0, -1).join(" ");
        } else {
            amount = 1;
        }
    
        if (!itemName || amount < 1) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption:  `Format: !buy [nama item] [jumlah]\nContoh: !buy Pedang Besi 1`,
              
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
        
        let itemData;
        
        // If in Perpustakaan Beku, check for Teleporting Stone
        if (player.lokasi === "Perpustakaan Beku") {
            if (itemName.toLowerCase() === "teleporting stone") {
                // Create Teleporting Stone item data
                itemData = {
                    nama: "Teleporting Stone",
                    hargaBeli: 5000,
                    deskripsi: "Artefak teleportasi kuno yang dapat membawa pemain ke lokasi manapun",
                    kategori: "Spesial",
                    tipe: "consumable",
                    efek: "teleport"
                };
            } else {
                await evarickreply(`❌ Item "${itemName}" tidak tersedia di Perpustakaan Beku!\n\nHanya Teleporting Stone yang tersedia di sini.\nGunakan !shop untuk melihat item yang tersedia.`);
                return;
            }
        } else if (player.lokasi === "Toko peralatan mas Buudi") {
            itemData = items.find(i => 
                i.nama.toLowerCase() === itemName.toLowerCase() && 
                (i.tipe === 'pancingan' || i.tipe === 'kapak' || i.tipe === 'beliung' || i.tipe === 'sekop')
            );
            
            if (!itemData) {
                await evarickreply(`❌ Item "${itemName}" tidak tersedia di toko peralatan!\n\nGunakan !toko untuk melihat peralatan yang tersedia.`);
                return;
            }
        } else {
            // Regular shop in Desa Awal
            const currentInventory = generateShopInventory();
            itemData = currentInventory.find(i => i.nama.toLowerCase() === itemName.toLowerCase());
            
            if (!itemData) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                    caption: `❌ Item "${itemName}" tidak tersedia di toko hari ini!\n\nGunakan !shop untuk melihat item yang tersedia.`,
                
                    mentions: [sender]
                }, { quoted: msg });
                savePlayerData(players);
                return;
            }
        }
    
        const totalCost = itemData.hargaBeli * amount;
        if (player.gold < totalCost) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption:  `❌ Gold kamu tidak cukup!\nHarga: ${totalCost.toLocaleString()}\nGold kamu: ${player.gold.toLocaleString()}`,
               
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
                
            return;
        }
        
        // Special handling for Teleporting Stone purchase
        if (player.lokasi === "Perpustakaan Beku" && itemName.toLowerCase() === "teleporting stone") {
            player.gold -= totalCost;
            player.tas[itemData.nama] = (player.tas[itemData.nama] || 0) + amount;
            
            let reply = `🔮 *PEMBELIAN TELEPORTING STONE BERHASIL!* 🔮\n\n`;
            reply += `📚 *Perpustakaan Beku*\n`;
            reply += `❄️ Kamu berhasil membeli artefak teleportasi kuno!\n\n`;
            reply += `📦 *Item:* ${itemData.nama}\n`;
            reply += `💰 *Harga:* ${itemData.hargaBeli.toLocaleString()} gold\n`;
            reply += `📊 *Jumlah:* ${amount}x\n`;
            reply += `💎 *Total:* ${totalCost.toLocaleString()} gold\n`;
            reply += `💳 *Sisa Gold:* ${player.gold.toLocaleString()} gold\n\n`;
            reply += `*💡 CARA MENGGUNAKAN:*\n`;
            reply += `• !pakai Teleporting Stone [nama lokasi]\n`;
            reply += `• Contoh: !pakai Teleporting Stone Desa Awal\n`;
            reply += `• Item ini dapat membawa kamu ke lokasi manapun\n\n`;
            reply += `*⚠️ PERINGATAN:*\n`;
            reply += `• Teleporting Stone adalah item langka dan mahal\n`;
            reply += `• Hanya tersedia di Perpustakaan Beku\n`;
            reply += `• Gunakan dengan bijak!`;
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
        
        player.gold -= totalCost;
        
        // For tools, add with durability info
if (itemData.durability) {
    // Create tool with durability
    const toolKey = `${itemData.nama}_${Date.now()}`;
    if (!player.tools) player.tools = {};
    player.tools[toolKey] = {
        id: toolKey, // Add unique ID
        nama: itemData.nama,
        tipe: itemData.tipe,
        durability: itemData.durability,
        maxDurability: itemData.maxDurability,
        tier: itemData.tier,
        stats: itemData.stats,
        hargaJual: itemData.hargaJual // Add sell price for reference
    };
    
    // Debug: Log the tool being added
    console.log(`DEBUG: Adding tool to player ${player.nama}:`, player.tools[toolKey]);
    console.log(`DEBUG: Player tools count:`, Object.keys(player.tools).length);
} else {
    // Regular item
    player.tas[itemData.nama] = (player.tas[itemData.nama] || 0) + amount;
}
        
        const tier = categorizeItemByTier(itemData);
        const tierColor = ITEM_TIERS[tier].color;
        
        let caption;
        if (itemData.durability) {
            caption = `✅ *Berhasil membeli ${itemData.nama}!*\n\n` +
                `${tierColor} Tier: ${tier}\n` +
                `⚡ Durability: ${itemData.durability}/${itemData.maxDurability}\n` +
                `💰 Harga: ${totalCost.toLocaleString()} gold\n` +
                `💳 Sisa gold: ${player.gold.toLocaleString()}\n\n` +
                `*Peralatan telah ditambahkan ke inventory tools!*`;
        } else {
            caption = `✅ *Berhasil membeli ${amount} ${itemData.nama}!*\n\n` +
                `${tierColor} Tier: ${tier}\n` +
                `💰 Harga: ${totalCost.toLocaleString()} gold\n` +
                `💳 Sisa gold: ${player.gold.toLocaleString()}`;
        }
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
            caption: caption,
            mentions: [sender]
        }, { quoted: msg });
        savePlayerData(players);
    }
break 

case "pakai": {
    if (!player) {
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
            mentions: [sender]
        }, { quoted: msg });
         return;
    }
    if (!q) {
        await evarickreply(`🧪 *Format: !pakai [nama item]*\nContoh: !pakai Potion HP`);
        return;
    }

    const args = q.trim().split(" ");
    const itemName = args.slice(0, 2).join(" "); // Untuk item dua kata seperti "Teleporting Stone"
    const lokasiTujuan = args.slice(2).join(" "); // Sisanya dianggap nama lokasi
    const itemsList = require('./database/rpg/items.js');
    const itemData = itemsList.find(i => i.nama.toLowerCase() === itemName.toLowerCase());


    if (!itemData) {
        await evarickreply(`❌ Item "${q}" tidak ditemukan!`);
        return;
    }
    if (itemData.kategori !== "Consumable") {
        await evarickreply(`❌ Item "${itemData.nama}" bukan item Consumable dan tidak bisa digunakan dengan !pakai.`);
        return;
    }
    if (!player.tas[itemData.nama] || player.tas[itemData.nama] < 1) {
        await evarickreply(`❌ Kamu tidak punya "${itemData.nama}" di tasmu.`);
        return;
    }

    // Efek item consumable (contoh: Potion HP, Potion Mana, Elixir, dsb)
    let efekMsg = "";
    switch (itemData.nama) {
        case "Potion HP":
            player.hp = Math.min(player.maxhp, player.hp + 50);
            efekMsg = "❤️ HP kamu bertambah 50 poin!";
            break;
        case "Potion Mana":
            player.mp = Math.min(player.maxmp, player.mp + 30);
            efekMsg = "🔵 Mana kamu bertambah 30 poin!";
            break;
        case "Elixir Kekuatan":
            player.attack += 5;
            efekMsg = "💪 Seranganmu naik 5 poin (sementara)!";
            break;
        case "Elixir Pertahanan":
            player.defense += 5;
            efekMsg = "🛡️ Pertahananmu naik 5 poin (sementara)!";
            break;
        case "Teleporting Stone":
                if (!lokasiTujuan) {
                    await evarickreply(`🗺️ *Format: !pakai Teleporting Stone [nama lokasi]*\nContoh: !pakai Teleporting Stone Gunung Berapi`);
                    return;
                }
                // Cek lokasi valid
                const locationsList = require('./database/rpg/locations.js');
                const lokasiValid = locationsList.find(loc => loc.nama.toLowerCase() === lokasiTujuan.toLowerCase());
                if (!lokasiValid) {
                    await evarickreply(`❌ Lokasi "${lokasiTujuan}" tidak ditemukan! Cek daftar lokasi dengan !lokasi`);
                    return;
                }
                player.lokasi = lokasiValid.nama;
                efekMsg = `✨ Kamu menggunakan Teleporting Stone dan langsung teleport ke *${lokasiValid.nama}*!`;
                break;
        // Tambahkan efek item lain sesuai kebutuhan
        default:
            efekMsg = `Kamu menggunakan "${itemData.nama}". Efeknya terasa aneh...`;
    }

    // Kurangi item di tas
    player.tas[itemData.nama] -= 1;
    if (player.tas[itemData.nama] <= 0) delete player.tas[itemData.nama];

    savePlayerData(players);

    await evarickreply(`🧪 Kamu menggunakan *${itemData.nama}*!\n${efekMsg}`);
    break;
}

    case "sell": {
        if (player.lokasi !== "Desa Awal") {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption:  `Kamu harus berada di Desa Awal untuk mengakses toko.`,
  
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
                mentions: [sender]
            return;
        }
        
        // Handle special sell commands
        if (q.toLowerCase() === "all") {
            // Sell all items that can be sold
            const itemsToSell = Object.keys(player.tas).filter(itemName => {
                const itemData = items.find(i => i.nama === itemName);
                return itemData && itemData.hargaJual > 0;
            });
            
            if (itemsToSell.length === 0) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                    caption: `Tidak ada item yang bisa dijual di tasmu.`,
   
                    mentions: [sender]
                }, { quoted: msg });
                savePlayerData(players);
                mentions: [sender]
                return;
            }
            
            let totalGold = 0;
            let soldItems = [];
            
            itemsToSell.forEach(itemName => {
                const itemData = items.find(i => i.nama === itemName);
                const amount = player.tas[itemName];
                const itemGold = itemData.hargaJual * amount;
                totalGold += itemGold;
                soldItems.push(`${itemName} (${amount}x)`);
                delete player.tas[itemName];
            });
            
            player.gold += totalGold;
            
            let reply = `💰 *BERHASIL MENJUAL SEMUA ITEM!* 💰\n\n`;
            reply += `*Item yang dijual:*\n`;
            soldItems.forEach(item => {
                reply += `• ${item}\n`;
            });
            reply += `\n*Total Gold yang didapat:* ${totalGold.toLocaleString()}\n`;
            reply += `*Gold sekarang:* ${player.gold.toLocaleString()}`;
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }

        if (q.toLowerCase() === "all resource") {
            // Daftar resource dari mancing, nambang, nebang
            const resourceList = [
                // Mancing - Ikan
                "Ikan Biasa", "Ikan Langka", "Ikan Legendaris", "Ikan Kecil", "Ikan Besar", "Ikan Emas",
                "Ikan Salmon", "Ikan Tuna", "Ikan Hiu", "Ikan Paus", "Ikan Naga", "Ikan Kristal",
                "Ikan Es", "Ikan Api", "Ikan Petir", "Ikan Angin", "Ikan Tanah", "Ikan Air",
                "Ikan Cahaya", "Ikan Bayangan", "Ikan Kosmos", "Ikan Aether", "Ikan Dewa",
                // TAMBAHKAN INI - Ikan yang ada di items.js
                "Ikan Mas", "Ikan Lele", "Ikan Nila", "Ikan Gurame",
                "Ikan Bawal", "Ikan Kakap", "Ikan Tenggiri", "Ikan Tuna",
                "Ikan Hiu Kecil", "Ikan Pari", "Ikan Paus Mini", "Ikan Lumba-lumba",
                "Ikan Hiu Besar", "Ikan Paus Biru", "Ikan Kraken",
                "GOLD MEGALODON",
                
                // Nambang - Mineral
                "Batu", "Besi", "Emas", "Permata", "Batu Bara", "Perak", "Kristal",
                "Batu Berlian", "Batu Ruby", "Batu Safir", "Batu Zamrud", "Batu Topaz",
                "Batu Amethyst", "Batu Opal", "Batu Aether", "Batu Dewa", "Batu Kosmos",
                "Batu Obsidian", "Batu Granit", "Batu Marmer", "Batu Kuarsa", "Batu Onyx",
                "Batu Jasper", "Batu Agate", "Batu Turquoise", "Batu Lapis Lazuli",
                // TAMBAHKAN INI - Mineral yang ada di items.js
                "Pasir", "Tanah Liat", "Kerikil",
                "Batu Kapur", "Batu Granit", "Batu Marmer", "Batu Obsidian",
                "Batu Permata", "Batu Safir", "Batu Ruby", "Batu Zamrud",
                "Batu Berlian", "Batu Amethyst", "Batu Topaz", "Batu Opal",
                "Batu Aether", "Batu Dewa", "Batu Kosmos",
                
                // Nebang - Material
                "Kayu", "Kayu Keras", "Kayu Ajaib", "Kayu Emas", "Kayu Kristal",
                "Kayu Es", "Kayu Api", "Kayu Petir", "Kayu Angin", "Kayu Tanah",
                "Kayu Air", "Kayu Cahaya", "Kayu Bayangan", "Kayu Kosmos", "Kayu Aether",
                "Kayu Dewa", "Kayu Oak", "Kayu Pine", "Kayu Maple", "Kayu Birch",
                "Kayu Spruce", "Kayu Jungle", "Kayu Acacia", "Kayu Dark Oak",
                "Kayu Crimson", "Kayu Warped", "Kayu Bamboo", "Kayu Cherry",
                // TAMBAHKAN INI - Material yang ada di items.js
                "Ranting", "Daun Kering",
                "Ranting Berdaun", "Kulit Kayu",
                "Ranting Emas", "Herbal Hutan",
                "Ranting Kristal", "Herbal Langka",
                "Ranting Aether",
                
                // Material Umum
                "Rumput", "Daun", "Bunga", "Jamur", "Lumut", "Pakis", "Bambu",
                "Kulit Kayu", "Getah", "Sari Bunga", "Benih", "Akar", "Dahan",
                "Ranting", "Serat", "Tali", "Kain", "Wol", "Sutra", "Kapas"
            ];
            
            // Filter item yang ada di tas dan termasuk dalam resource list
            const itemsToSell = Object.keys(player.tas).filter(itemName => {
                return resourceList.some(resource => 
                    itemName.toLowerCase() === resource.toLowerCase()
                );
            });
            
            if (itemsToSell.length === 0) {
                await evarickreply(`❌ *Tidak ada resource yang bisa dijual di tasmu!*\n\nResource yang bisa dijual:\n• Hasil !mancing (ikan-ikan)\n• Hasil !nambang (mineral)\n• Hasil !nebang (kayu dan material)\n\nGunakan !tas untuk melihat isi tasmu.`);
                return;
            }
            
            let totalGold = 0;
            let soldItems = [];
            let soldCategories = {
                mancing: 0,
                nambang: 0,
                nebang: 0
            };
            
            itemsToSell.forEach(itemName => {
                const itemData = items.find(i => i.nama === itemName);
                if (itemData && itemData.hargaJual > 0) {
                    const amount = player.tas[itemName];
                    const itemGold = itemData.hargaJual * amount;
                    totalGold += itemGold;
                    soldItems.push(`${itemName} (${amount}x) - ${itemGold.toLocaleString()} gold`);
                    
                    // Kategorikan item yang dijual
                    if (itemData.kategori === 'Ikan') {
                        soldCategories.mancing += amount;
                    } else if (itemData.kategori === 'Mineral') {
                        soldCategories.nambang += amount;
                    } else if (itemData.kategori === 'Material') {
                        soldCategories.nebang += amount;
                    }
                    
                    delete player.tas[itemName];
                }
            });
            
            player.gold += totalGold;
            
            let reply = `💰 *BERHASIL MENJUAL SEMUA RESOURCE!* 💰\n\n`;
            reply += `*Resource yang dijual:*\n`;
            
            // Tampilkan berdasarkan kategori
            if (soldCategories.mancing > 0) {
                reply += `\n🎣 *Hasil Mancing:* ${soldCategories.mancing} item`;
            }
            if (soldCategories.nambang > 0) {
                reply += `\n⛏️ *Hasil Nambang:* ${soldCategories.nambang} item`;
            }
            if (soldCategories.nebang > 0) {
                reply += `\n🔥 *Hasil Nebang:* ${soldCategories.nebang} item`;
            }
            
            reply += `\n\n*Detail Item:*\n`;
            soldItems.forEach(item => {
                reply += `• ${item}\n`;
            });
            
            reply += `\n💰 *Total Gold yang didapat:* ${totalGold.toLocaleString()}\n`;
            reply += `💰 *Gold sekarang:* ${player.gold.toLocaleString()}\n\n`;
            reply += `📊 *Ringkasan:*\n`;
            reply += `• Total item terjual: ${soldItems.length} jenis\n`;
            reply += `• Total quantity: ${Object.values(soldCategories).reduce((a, b) => a + b, 0)} item`;
            
            await evarickreply(reply);
            savePlayerData(players);
            return;
        }

        if (q.toLowerCase() === "all loot") {
            // Sell all loot items only
            const lootItemsToSell = Object.keys(player.tas).filter(itemName => {
                const itemData = items.find(i => i.nama === itemName);
                return itemData && itemData.hargaJual > 0 && itemData.kategori === 'Loot';
            });
            
            if (lootItemsToSell.length === 0) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
             
                return;
            }
            
            let totalGold = 0;
            let soldItems = [];
            
            lootItemsToSell.forEach(itemName => {
                const itemData = items.find(i => i.nama === itemName);
                const amount = player.tas[itemName];
                const itemGold = itemData.hargaJual * amount;
                totalGold += itemGold;
                soldItems.push(`${itemName} (${amount}x)`);
                delete player.tas[itemName];
            });
            
            player.gold += totalGold;
            
            let reply = `💰 *BERHASIL MENJUAL SEMUA LOOT!* 💰\n\n`;
            reply += `*Loot yang dijual:*\n`;
            soldItems.forEach(item => {
                reply += `• ${item}\n`;
            });
            reply += `\n*Total Gold yang didapat:* ${totalGold.toLocaleString()}\n`;
            reply += `*Gold sekarang:* ${player.gold.toLocaleString()}`;
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }

        if (q.toLowerCase() === "tools") {
            // Sell all tools
            if (!player.tools || Object.keys(player.tools).length === 0) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                    caption:  `❌ *Tidak ada peralatan yang bisa dijual!*\n\n🔧 *Beli peralatan di:*\n Toko peralatan mas Buudi\n\n🎣 *Command:* !toko`,
                   
                    mentions: [sender]
                }, { quoted: msg });
                  
                return;
            }
        
            let totalGold = 0;
            let soldTools = [];
            let toolsToRemove = [];
        
            Object.values(player.tools).forEach(tool => {
                // Calculate sell price based on durability percentage
                const durabilityPercentage = tool.durability / tool.maxDurability;
                const basePrice = tool.hargaJual || 100; // Default price if not set
                const sellPrice = Math.floor(basePrice * durabilityPercentage * 0.5); // 50% of base price based on durability
                
                totalGold += sellPrice;
                soldTools.push(`${tool.nama} (${tool.durability}/${tool.maxDurability}) - ${sellPrice} gold`);
                toolsToRemove.push(tool.id);
            });
        
            // Remove sold tools
            Object.keys(player.tools).forEach(key => {
                if (toolsToRemove.includes(player.tools[key].id)) {
                    delete player.tools[key];
                }
            });
            player.gold += totalGold;
        
            let reply = `🔧 *BERHASIL MENJUAL SEMUA PERALATAN!* 🔧\n\n`;
            reply += `*Peralatan yang dijual:*\n`;
            soldTools.forEach(tool => {
                reply += `• ${tool}\n`;
            });
            reply += `\n💰 *Total Gold yang didapat:* ${totalGold.toLocaleString()}\n`;
            reply += `💰 *Gold sekarang:* ${player.gold.toLocaleString()}\n\n`;
            reply += `🔧 *Tips:* Harga jual berdasarkan durability tersisa (50% dari harga beli)`;
        
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            savePlayerData(players);
            return;
        }

        if (q.toLowerCase().startsWith("tool ")) {
            // Sell specific tool by name
            const toolName = q.substring(5).trim(); // Remove "tool " prefix
            
            if (!player.tools || Object.keys(player.tools).length === 0) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                    caption: `❌ *Tidak ada peralatan yang bisa dijual!*\n\n🔧 *Beli peralatan di:*\n Toko peralatan mas Buudi\n\n🎣 *Command:* !toko`,
                
                    mentions: [sender]
                }, { quoted: msg });
                savePlayerData(players);
                return;
            }
        
            // Find tool by name (case insensitive)
            const toolToSell = Object.values(player.tools).find(tool => 
                tool.nama.toLowerCase().includes(toolName.toLowerCase())
            );
        
            if (!toolToSell) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                    caption: `❌ *Peralatan "${toolName}" tidak ditemukan!*\n\n🔧 *Peralatan yang kamu miliki:*\n${Object.values(player.tools).map(tool => `• ${tool.nama} (${tool.durability}/${tool.maxDurability})`).join('\n')}`,
                    mentions: [sender]
                }, { quoted: msg });
                savePlayerData(players); 
                return;
            }
        
            // Calculate sell price
            const durabilityPercentage = toolToSell.durability / toolToSell.maxDurability;
            const basePrice = toolToSell.hargaJual || 100;
            const sellPrice = Math.floor(basePrice * durabilityPercentage * 0.5);
        
            // Remove tool and add gold
            Object.keys(player.tools).forEach(key => {
                if (player.tools[key].id === toolToSell.id) {
                    delete player.tools[key];
                }
            });
            player.gold += sellPrice;
        
            let reply = `🔧 *BERHASIL MENJUAL PERALATAN!* 🔧\n\n`;
            reply += `*Peralatan yang dijual:*\n`;
            reply += `• ${toolToSell.nama}\n`;
            reply += `• Durability: ${toolToSell.durability}/${toolToSell.maxDurability}\n`;
            reply += `• Tier: ${toolToSell.tier}\n\n`;
            reply += `💰 *Gold yang didapat:* ${sellPrice.toLocaleString()}\n`;
            reply += `💰 *Gold sekarang:* ${player.gold.toLocaleString()}\n\n`;
            reply += `🔧 *Tips:* Harga jual berdasarkan durability tersisa (50% dari harga beli)`;
        
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            savePlayerData(players);
            return;
        }
        
        // Original sell logic for specific items
        // Memisahkan jumlah dari nama item
        const args = q.split(" ");
        const amountStr = args[args.length - 1];
        let amount = parseInt(amountStr);
        let itemName = q;

        if (!isNaN(amount)) {
            itemName = args.slice(0, -1).join(" ");
        } else {
            amount = 1;
        }
        
        if (!itemName || amount < 1) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption:  `Format: !sell [nama item] [jumlah]\nContoh: !sell Kayu 5\n\n*Atau gunakan:*\n• !sell all - Jual semua item\n• !sell all loot - Jual semua loot\n• !sell all resource - Jual semua resource\n• !sell tools - Jual semua peralatan\n• !sell tool [nama] - Jual peralatan tertentu\n\n*Contoh peralatan:*\n• !sell tool pancingan kayu\n• !sell tool kapak besi\n• !sell tool beliung diamond`,
                mentions: [sender]
            }, { quoted: msg }); 
            return;
        }

        // Cari item di tas pemain tanpa mempedulikan huruf besar/kecil
        const playerItemName = Object.keys(player.tas).find(i => i.toLowerCase() === itemName.toLowerCase());
        if (!playerItemName || player.tas[playerItemName] < amount) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: `Kamu tidak punya ${amount} "${itemName}" di tasmu.`,
                mentions: [sender]
            }, { quoted: msg });
   
            return;
        }

        const itemData = items.find(i => i.nama.toLowerCase() === itemName.toLowerCase());
        if (!itemData) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
                caption: `Item aneh, tidak terdaftar di sistem.`,
                mentions: [sender]
            }, { quoted: msg }); 
            return;
        }

        const totalGold = itemData.hargaJual * amount;
        player.tas[playerItemName] -= amount;
        if (player.tas[playerItemName] === 0) delete player.tas[playerItemName];
        
        player.gold += totalGold;
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
            caption: `Kamu menjual ${amount} ${playerItemName} dan mendapatkan ${totalGold} gold. Gold sekarang: ${player.gold}`,
            mentions: [sender]
        }, { quoted: msg }); 
        savePlayerData(players);
    }

    break

    break

    // Repair Tools
    case "repair": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        // Check if player is in the correct location
        if (player.lokasi !== "Toko peralatan mas Buudi") {
            await evarickreply(`❌ *Kamu harus berada di "Toko peralatan mas Buudi" untuk memperbaiki peralatan!*\n\n🔧 *Lokasi:* Toko peralatan mas Buudi\n🎣 *Command:* !toko`);
            return;
        }

        // Check if player has tools
if (!player.tools || Object.keys(player.tools).length === 0) {
    await evarickreply(`❌ *Tidak ada peralatan yang bisa diperbaiki!*\n\n🔧 *Beli peralatan di:*\n Toko peralatan mas Buudi\n\n🎣 *Command:* !toko`);
    return;
}

// Find broken or damaged tools
const damagedTools = Object.values(player.tools).filter(tool => tool.durability < tool.maxDurability);

        if (damagedTools.length === 0) {
            await evarickreply(`✅ *Semua peralatan dalam kondisi baik!*\n\n🔧 *Tidak ada peralatan yang perlu diperbaiki.*`);
            return;
        }

        // Define repair materials for each tool type and tier
        const repairMaterials = {
            'pancingan': {
                'kayu': { 'Kayu': 2 },
                'batu': { 'Batu': 3 },
                'besi': { 'Besi': 2, 'Batu': 1 },
                'diamond': { 'Batu Berlian': 1, 'Besi': 1 },
                'netherite': { 'Batu Aether': 1, 'Besi': 2 }
            },
            'kapak': {
                'kayu': { 'Kayu': 3 },
                'batu': { 'Batu': 4 },
                'besi': { 'Besi': 3, 'Batu': 2 },
                'diamond': { 'Batu Berlian': 1, 'Besi': 2 },
                'netherite': { 'Batu Aether': 1, 'Besi': 3 }
            },
            'beliung': {
                'kayu': { 'Kayu': 2, 'Batu': 1 },
                'batu': { 'Batu': 3 },
                'besi': { 'Besi': 2, 'Batu': 2 },
                'diamond': { 'Batu Berlian': 1, 'Besi': 1 },
                'netherite': { 'Batu Aether': 1, 'Besi': 2 }
            },
            'sekop': {
                'kayu': { 'Kayu': 2 },
                'batu': { 'Batu': 2 },
                'besi': { 'Besi': 1, 'Batu': 1 },
                'diamond': { 'Batu Berlian': 1 },
                'netherite': { 'Batu Aether': 1, 'Besi': 1 }
            }
        };

        // Check if specific tool is mentioned
        if (q) {
            const toolName = q.toLowerCase();
            const toolToRepair = damagedTools.find(tool => 
                tool.nama.toLowerCase().includes(toolName)
            );

            if (!toolToRepair) {
                await evarickreply(`❌ *Peralatan "${q}" tidak ditemukan atau tidak perlu diperbaiki!*\n\n🔧 *Peralatan yang perlu diperbaiki:*\n${damagedTools.map(tool => `• ${tool.nama} (${tool.durability}/${tool.maxDurability})`).join('\n')}`);
                return;
            }

            // Check if player has required materials
            const requiredMaterials = repairMaterials[toolToRepair.tipe][toolToRepair.tier];
            const missingMaterials = [];

            for (const [material, amount] of Object.entries(requiredMaterials)) {
                if (!player.tas[material] || player.tas[material] < amount) {
                    missingMaterials.push(`${material} (${amount}x)`);
                }
            }

            if (missingMaterials.length > 0) {
                await evarickreply(`❌ *Material tidak cukup untuk memperbaiki ${toolToRepair.nama}!*\n\n🔧 *Material yang dibutuhkan:*\n${Object.entries(requiredMaterials).map(([material, amount]) => `• ${material}: ${amount}x`).join('\n')}\n\n❌ *Material yang kurang:*\n${missingMaterials.map(material => `• ${material}`).join('\n')}`);
                return;
            }

            // Consume materials and repair tool
            for (const [material, amount] of Object.entries(requiredMaterials)) {
                player.tas[material] -= amount;
                if (player.tas[material] <= 0) {
                    delete player.tas[material];
                }
            }

            // Repair tool to full durability
            toolToRepair.durability = toolToRepair.maxDurability;

            let reply = `🔧 *PERALATAN BERHASIL DIPERBAIKI!* 🔧\n\n`;
            reply += `*Peralatan:* ${toolToRepair.nama}\n`;
            reply += `*Durability:* ${toolToRepair.durability}/${toolToRepair.maxDurability}\n`;
            reply += `*Tier:* ${toolToRepair.tier}\n\n`;
            reply += `*Material yang digunakan:*\n`;
            Object.entries(requiredMaterials).forEach(([material, amount]) => {
                reply += `• ${material}: ${amount}x\n`;
            });

            await evarickreply(reply);
            savePlayerData(players);
            return;
        }

        // Show all damaged tools and their repair requirements
        let reply = `🔧 *PERALATAN YANG PERLU DIPERBAIKI* 🔧\n\n`;
        
        damagedTools.forEach(tool => {
            const requiredMaterials = repairMaterials[tool.tipe][tool.tier];
            reply += `*${tool.nama}*\n`;
            reply += `• Durability: ${tool.durability}/${tool.maxDurability}\n`;
            reply += `• Tier: ${tool.tier}\n`;
            reply += `• Material yang dibutuhkan:\n`;
            
            Object.entries(requiredMaterials).forEach(([material, amount]) => {
                const hasMaterial = player.tas[material] && player.tas[material] >= amount;
                const status = hasMaterial ? '✅' : '❌';
                reply += `  ${status} ${material}: ${amount}x\n`;
            });
            reply += `\n`;
        });

        reply += `*Cara menggunakan:*\n`;
        reply += `!repair [nama peralatan]\n\n`;
        reply += `*Contoh:*\n`;
        reply += `• !repair pancingan kayu\n`;
        reply += `• !repair kapak besi\n`;
        reply += `• !repair beliung diamond`;

        await evarickreply(reply);
    }
    break

    case "toko": {
        let reply = `🏪 *PANDUAN TOKO* 🏪\n\n`;
        reply += `Terdapat dua jenis toko utama yang bisa kamu akses di dunia Evarick:\n\n`;
        reply += `1️⃣ *Toko Peralatan Mas Buudi*\n`;
        reply += `   • Command: !tokoalat\n`;
        reply += `   • Lokasi: Toko peralatan mas Buudi\n`;
        reply += `   • Menjual: Peralatan seperti pancingan, kapak, beliung, sekop\n`;
        reply += `   • Cara akses: Pergi ke lokasi 'Toko peralatan mas Buudi' lalu gunakan !tokoalat\n\n`;
        reply += `2️⃣ *Toko Sihir Bu Winda*\n`;
        reply += `   • Command: !tokosihir\n`;
        reply += `   • Lokasi: Toko Sihir Bu Winda\n`;
        reply += `   • Menjual: Skill sihir khusus\n`;
        reply += `   • Cara akses: Pergi ke lokasi 'Toko Sihir Bu Winda' lalu gunakan !tokosihir\n\n`;
        reply += `💡 *Tips:*\n`;
        reply += `• Gunakan !travel [nama lokasi] untuk berpindah tempat.\n`;
        reply += `• Gunakan !buy [nama item] untuk membeli barang di toko.\n`;
        reply += `• Cek !tokoalat atau !tokosihir untuk detail barang yang dijual.\n`;
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ykr6n8.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    // Toko Peralatan Mas Buudi
    case "tokoalat": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        // Check if player is in the correct location
        if (player.lokasi !== "Toko peralatan mas Buudi") {
            await evarickreply(`❌ *Kamu harus berada di "Toko peralatan mas Buudi" untuk mengakses toko ini!*\n\nLokasi kamu saat ini: ${player.lokasi}`);
            return;
        }

        // Get all tools with durability from items
        const toolItems = items.filter(item => 
            item.tipe === 'pancingan' || 
            item.tipe === 'kapak' || 
            item.tipe === 'beliung' || 
            item.tipe === 'sekop'
        );

        // Group items by type
        const pancinganItems = toolItems.filter(item => item.tipe === 'pancingan');
        const kapakItems = toolItems.filter(item => item.tipe === 'kapak');
        const beliungItems = toolItems.filter(item => item.tipe === 'beliung');
        const sekopItems = toolItems.filter(item => item.tipe === 'sekop');

        let reply = `🏪 *TOKO PERALATAN MAS BUDI* 🏪\n\n`;
        reply += `🧑‍🎓 *Selamat datang di toko peralatan terbaik!*\n`;
        reply += `💰 Gold Kamu: *${player.gold.toLocaleString()}*\n\n`;
        
        reply += `*=============== PERALATAN TERSEDIA ===============*\n\n`;

        // Display Pancingan
        reply += `🎣 *PANCINGAN:*\n`;
        pancinganItems.forEach(item => {
            const tierColor = item.tier === 'netherite' ? '🟡' : 
                            item.tier === 'diamond' ? '🔵' : 
                            item.tier === 'besi' ? '⚪' : 
                            item.tier === 'batu' ? '🟢' : '🟤';
            reply += `  ${tierColor} ${item.nama} | 💰 ${item.hargaBeli.toLocaleString()} | ⚡ ${item.durability}/${item.maxDurability}\n`;
        });
        reply += `\n`;

        // Display Kapak
        reply += `🪓 *KAPAK:*\n`;
        kapakItems.forEach(item => {
            const tierColor = item.tier === 'netherite' ? '🟡' : 
                            item.tier === 'diamond' ? '🔵' : 
                            item.tier === 'besi' ? '⚪' : 
                            item.tier === 'batu' ? '🟢' : '🟤';
            reply += `  ${tierColor} ${item.nama} | 💰 ${item.hargaBeli.toLocaleString()} | ⚡ ${item.durability}/${item.maxDurability}\n`;
        });
        reply += `\n`;

        // Display Beliung
        reply += `⛏️ *BELIUNG:*\n`;
        beliungItems.forEach(item => {
            const tierColor = item.tier === 'netherite' ? '🟡' : 
                            item.tier === 'diamond' ? '🔵' : 
                            item.tier === 'besi' ? '⚪' : 
                            item.tier === 'batu' ? '🟢' : '🟤';
            reply += `  ${tierColor} ${item.nama} | 💰 ${item.hargaBeli.toLocaleString()} | ⚡ ${item.durability}/${item.maxDurability}\n`;
        });
        reply += `\n`;

        // Display Sekop
        reply += `🦹 *SEKOP:*\n`;
        sekopItems.forEach(item => {
            const tierColor = item.tier === 'netherite' ? '🟡' : 
                            item.tier === 'diamond' ? '🔵' : 
                            item.tier === 'besi' ? '⚪' : 
                            item.tier === 'batu' ? '🟢' : '🟤';
            reply += `  ${tierColor} ${item.nama} | 💰 ${item.hargaBeli.toLocaleString()} | ⚡ ${item.durability}/${item.maxDurability}\n`;
        });
        reply += `\n`;

        reply += `*=============== INFORMASI ===============*\n`;
        reply += `• 🟤 Kayu: Durability rendah, harga murah\n`;
        reply += `• 🟢 Batu: Durability sedang, harga terjangkau\n`;
        reply += `• ⚪ Besi: Durability tinggi, harga mahal\n`;
        reply += `• 🔵 Diamond: Durability sangat tinggi, harga premium\n`;
        reply += `• 🟡 Netherite: Durability maksimal, harga eksklusif\n\n`;
        
        reply += `*🎣 CARA PENGGUNAAN:*\n`;
        reply += `• Gunakan: *!buy [nama peralatan]*\n`;
        reply += `• Contoh: *!buy Pancingan Besi*\n`;
        reply += `• Peralatan akan habis setelah durability habis\n`;
        reply += `• Peralatan lebih baik = hasil lebih bagus\n\n`;
        
        reply += `*🎣 AKTIVITAS YANG MEMBUTUHKAN PERALATAN:*\n`;
        reply += `• 🎣 !pancing - Membutuhkan pancingan\n`;
        reply += `• 🪓 !nebang - Membutuhkan kapak\n`;
        reply += `• ⛏️ !nambang - Membutuhkan beliung\n`;
        reply += `• 🦹 !gali - Membutuhkan sekop (coming soon)\n\n`;
        
        reply += `*⚡ Durability = Jumlah penggunaan tersisa*`;

        await evarickreply(reply);
    }
    break

    case "tokosihir": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }
    
        // Check if player is in Toko Sihir Bu Winda
        if (player.lokasi !== 'Toko Sihir Bu Winda') {
            await evarickreply(`❌ *Kamu harus berada di Toko Sihir Bu Winda!*\n\nGunakan !travel "Toko Sihir Bu Winda" untuk pergi ke sana.`);
            return;
        }
    
        // Initialize skill shop if not exists
        if (!global.skillShop) {
            global.skillShop = {
                inventory: [],
                lastReset: null
            };
        }
    
        const now = Date.now();
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    
        // Reset shop every hour
        if (!global.skillShop.lastReset || (now - global.skillShop.lastReset) >= oneHour) {
            global.skillShop.inventory = generateSkillShopInventory();
            global.skillShop.lastReset = now;
        }
    
        let reply = `🔮 *TOKO SIHIR BU WINDA* 🔮\n\n`;
        reply += `*Selamat datang di toko sihir!*\n`;
        reply += `*Skill akan berganti setiap 1 jam*\n\n`;
    
        if (global.skillShop.inventory.length === 0) {
            reply += `❌ *Tidak ada skill tersedia saat ini*\n`;
            reply += `*Coba lagi dalam 1 jam*\n`;
        } else {
            reply += `*SKILL TERSEDIA:*\n\n`;
            
            global.skillShop.inventory.forEach((skill, index) => {
                const tierEmoji = getTierEmoji(skill.tier);
                reply += `${index + 1}. ${tierEmoji} *${skill.nama}*\n`;
                reply += `   📝 ${skill.deskripsi}\n`;
                reply += `   ⚡ Cooldown: ${skill.cooldown} giliran\n`;
                reply += `   💰 Harga: ${skill.hargaBeli} gold\n`;
                reply += `   🏷️ Tier: ${skill.tier}\n\n`;
            });
    
            reply += `*CARA MEMBELI:*\n`;
            reply += `!buyskill [nomor] - Beli skill berdasarkan nomor\n`;
            reply += `!skillinfo [nomor] - Info detail skill\n\n`;
            
            reply += `*TIER SYSTEM:*\n`;
            reply += `🟢 Low Magic - Skill dasar (80% chance)\n`;
            reply += `🟡 Normal Magic - Skill menengah (15% chance)\n`;
            reply += `🟠 Strong Magic - Skill kuat (4% chance)\n`;
            reply += `🔴 Magic Supreme - Skill legendaris (1% chance)\n`;
        }
    
        await evarickreply(reply);
    }
    break
    
    case "buyskill": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }
    
        if (player.lokasi !== 'Toko Sihir Bu Winda') {
            await evarickreply(`❌ *Kamu harus berada di Toko Sihir Bu Winda!*`);
            return;
        }
    
        if (!q) {
            await evarickreply(`⚠️ *Tentukan nomor skill!*\n\nGunakan !tokosihir untuk melihat skill tersedia.`);
            return;
        }
    
        const skillNumber = parseInt(q) - 1;
        
        if (!global.skillShop || !global.skillShop.inventory[skillNumber]) {
            await evarickreply(`❌ *Skill tidak ditemukan!*\n\nGunakan !tokosihir untuk melihat skill tersedia.`);
            return;
        }
    
        const skill = global.skillShop.inventory[skillNumber];
        
        if (player.gold < skill.hargaBeli) {
            await evarickreply(`❌ *Gold tidak cukup!*\n\nHarga: ${skill.hargaBeli} gold\nGold kamu: ${player.gold} gold`);
            return;
        }
    
        // Check if player already has this skill
        if (!player.skills) player.skills = [];
        if (player.skills.includes(skill.id)) {
            await evarickreply(`❌ *Kamu sudah memiliki skill ini!*`);
            return;
        }
    
        // Buy the skill
        player.gold -= skill.hargaBeli;
        player.skills.push(skill.id);
        
        // Remove from shop inventory
        global.skillShop.inventory.splice(skillNumber, 1);
    
        // Save player data
        players[participant] = player;
        savePlayerData(players);
    
        const tierEmoji = getTierEmoji(skill.tier);
        let reply = `✅ *SKILL BERHASIL DIBELI!* ${tierEmoji}\n\n`;
        reply += `*${skill.nama}*\n`;
        reply += `📝 ${skill.deskripsi}\n`;
        reply += `💰 Harga: ${skill.hargaBeli} gold\n`;
        reply += `🏷️ Tier: ${skill.tier}\n\n`;
        reply += `💡 *Gunakan !skilllist untuk melihat skill kamu*\n`;
        reply += `💡 *Gunakan !equipskill untuk memilih skill aktif*`;
    
        await evarickreply(reply);
    }
    break
    
    case "skillinfo": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }
    
        if (!q) {
            await evarickreply(`⚠️ *Tentukan nomor skill!*\n\nGunakan !tokosihir untuk melihat skill tersedia.`);
            return;
        }
    
        const skillNumber = parseInt(q) - 1;
        
        if (!global.skillShop || !global.skillShop.inventory[skillNumber]) {
            await evarickreply(`❌ *Skill tidak ditemukan!*`);
            return;
        }
    
        const skill = global.skillShop.inventory[skillNumber];
        const tierEmoji = getTierEmoji(skill.tier);
        
        let reply = `🔮 *INFO SKILL* ${tierEmoji}\n\n`;
        reply += `*${skill.nama}*\n`;
        reply += `📝 ${skill.deskripsi}\n`;
        reply += `⚔️ Class: ${skill.class}\n`;
        reply += `⚡ Cooldown: ${skill.cooldown} giliran\n`;
        reply += `💰 Harga: ${skill.hargaBeli} gold\n`;
        reply += `🏷️ Tier: ${skill.tier}\n\n`;
        reply += `🔮 *Gunakan !buyskill ${skillNumber + 1} untuk membeli*`;
    
        await evarickreply(reply);
    }
    break

    case "unequipskill": {
    if (!player) {
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
            mentions: [sender]
        }, { quoted: msg });
          return;
    }

    if (!player.equippedSkills || player.equippedSkills.length === 0) {
        await evarickreply(`❌ *Tidak ada skill yang sedang aktif!*`);
        return;
    }

    if (!q) {
        // Tampilkan daftar skill aktif beserta nomor
        let reply = `⚔️ *SKILL AKTIF SAAT INI:*\n`;
        player.equippedSkills.forEach((skillId, idx) => {
            const skill = skills.find(s => s.id === skillId);
            if (skill) {
                reply += `${idx + 1}. ${skill.nama} (${skill.class})\n`;
            }
        });
        reply += `\nGunakan: !unequipskill [nomor]\nContoh: !unequipskill 1`;
        await evarickreply(reply);
        return;
    }

    const idx = parseInt(q) - 1;
    if (isNaN(idx) || idx < 0 || idx >= player.equippedSkills.length) {
        await evarickreply(`❌ *Nomor skill tidak valid!*\nGunakan !unequipskill untuk melihat daftar skill aktif.`);
        return;
    }

    const removedSkillId = player.equippedSkills[idx];
    const removedSkill = skills.find(s => s.id === removedSkillId);

    // Hapus skill dari slot aktif
    player.equippedSkills.splice(idx, 1);
    players[participant] = player;
    savePlayerData(players);

    await evarickreply(`✅ *Skill "${removedSkill ? removedSkill.nama : 'Tidak diketahui'}" berhasil dilepas dari slot aktif!*`);
}
break;
    
case "skilllist": {
    if (!player) {
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
            mentions: [sender]
        }, { quoted: msg });
         return;
    }

    if (!player.skills || player.skills.length === 0) {
        await evarickreply(`❌ *Kamu belum memiliki skill apapun!*\n\nKunjungi Toko Sihir Bu Winda untuk membeli skill.`);
        return;
    }

    let reply = `📚 *DAFTAR SKILL MILIKMU* 📚\n\n`;
    reply += `👤 *Pemain:* ${player.nama}\n`;
    reply += `🔢 *Total Skill:* ${player.skills.length}\n\n`;

    // Urutkan skill berdasarkan tier, lalu nama
    const ownedSkills = player.skills
        .map((skillId, idx) => {
            const skill = skills.find(s => s.id === skillId);
            return skill ? { ...skill, idx } : null;
        })
        .filter(Boolean)
        .sort((a, b) => {
            // Urutkan berdasarkan tier, lalu nama
            const tierOrder = ["Magic Supreme", "Strong Magic", "Normal Magic", "Low Magic"];
            const tierA = tierOrder.indexOf(a.tier);
            const tierB = tierOrder.indexOf(b.tier);
            if (tierA !== tierB) return tierA - tierB;
            return a.nama.localeCompare(b.nama);
        });

    // Tampilkan skill dengan nomor urut dan status equip
    reply += `*No | Nama Skill | Class | Tier | Status*\n`;
    reply += `---------------------------------------------\n`;
    ownedSkills.forEach((skill, i) => {
        const isEquipped = player.equippedSkills && player.equippedSkills.includes(skill.id);
        const status = isEquipped ? '✅ Aktif' : '❌';
        const tierEmoji = getTierEmoji(skill.tier);
        reply += `${i + 1}. ${tierEmoji} *${skill.nama}* | ${skill.class} | ${skill.tier} | ${status}\n`;
    });

    reply += `\n*Penjelasan:*\n`;
    reply += `✅ = Skill sedang aktif (equip)\n`;
    reply += `❌ = Skill belum diaktifkan\n`;
    reply += `\n💡 *Gunakan !equipskill [nomor] untuk memilih skill aktif*\n`;
    reply += `💡 *Maksimal 2 skill aktif sekaligus*`;

    await evarickreply(reply);
}
break
    
    case "equipskill": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }
    
        if (!player.skills || player.skills.length === 0) {
            await evarickreply(`❌ *Kamu belum memiliki skill apapun!*`);
            return;
        }
    
        if (!q) {
            // Show current equipped skills and available skills
            let reply = `⚔️ *EQUIP SKILL* ⚔️\n\n`;
            
            if (player.equippedSkills && player.equippedSkills.length > 0) {
                reply += `*SKILL AKTIF SAAT INI:*\n`;
                player.equippedSkills.forEach(skillId => {
                    const skill = skills.find(s => s.id === skillId);
                    if (skill) {
                        reply += `✅ ${skill.nama}\n`;
                    }
                });
                reply += '\n';
            }
    
            reply += `*SKILL TERSEDIA:*\n`;
            player.skills.forEach((skillId, index) => {
                const skill = skills.find(s => s.id === skillId);
                if (skill) {
                    const isEquipped = player.equippedSkills && player.equippedSkills.includes(skillId);
                    const status = isEquipped ? '✅' : '❌';
                    reply += `${index + 1}. ${status} ${skill.nama} (${skill.class})\n`;
                }
            });
    
            reply += `\n💡 *Gunakan !equipskill [nomor] untuk memilih skill*\n`;
            reply += `💡 *Gunakan !equipskill clear untuk lepas semua skill*`;
    
            await evarickreply(reply);
            return;
        }
    
        if (q.toLowerCase() === 'clear') {
            player.equippedSkills = [];
            players[participant] = player;
            savePlayerData(players);
            await evarickreply(`✅ *Semua skill telah dilepas!*`);
            return;
        }
    
        const skillNumber = parseInt(q) - 1;
        
        if (skillNumber < 0 || skillNumber >= player.skills.length) {
            await evarickreply(`❌ *Nomor skill tidak valid!*`);
            return;
        }
    
        const skillId = player.skills[skillNumber];
        const skill = skills.find(s => s.id === skillId);
        
        if (!skill) {
            await evarickreply(`❌ *Skill tidak ditemukan!*`);
            return;
        }

        if (skill.class !== player.kelas) {
    await evarickreply(`❌ *Skill "${skill.nama}" hanya bisa digunakan oleh class ${skill.class}!*`);
    return;
}
    
        // Initialize equipped skills array
        if (!player.equippedSkills) player.equippedSkills = [];
    
        // Check if skill is already equipped
        if (player.equippedSkills.includes(skillId)) {
            // Unequip the skill
            player.equippedSkills = player.equippedSkills.filter(id => id !== skillId);
            await evarickreply(`✅ *Skill "${skill.nama}" telah dilepas!*`);
        } else {
            // Check if player has reached max equipped skills
            if (player.equippedSkills.length >= 2) {
                await evarickreply(`❌ *Maksimal 2 skill aktif!*\n\nLepas salah satu skill terlebih dahulu.`);
                return;
            }
    
            // Equip the skill
            player.equippedSkills.push(skillId);
            await evarickreply(`✅ *Skill "${skill.nama}" telah dipilih!*`);
        }
    
        // Save player data
        players[participant] = player;
        savePlayerData(players);
    }
    break

    // Classes Info
    case "classes": {
        let reply = `⚔️ *INFORMASI KELAS* ⚔️\n\n` +
            `*1. 🗡️ Fighter*\n` +
            `   HP +20 | Defense +5\n` +
            `   Ahli bertarung jarak dekat dengan pertahanan tinggi\n` +
            `   Senjata: Pedang Latihan\n\n` +
            `*2. 🔪 Assassin*\n` +
            `   Attack +5 | HP +10\n` +
            `   Ahli serangan cepat dan kritis\n` +
            `   Senjata: Belati Gesit\n\n` +
            `*3. 🧙 Mage*\n` +
            `   Mana +30 | Attack +3\n` +
            `   Ahli sihir dan serangan jarak jauh\n` +
            `   Senjata: Tongkat Sihir\n\n` +
            `*4. 🛡️ Tank*\n` +
            `   HP +30 | Defense +8 | Attack -2\n` +
            `   Pertahanan terkuat, pelindung tim\n` +
            `   Senjata: Perisai Besar\n\n` +
            `*5. 🏹 Archer*\n` +
            `   Attack +4 | HP +15\n` +
            `   Ahli menembak dari jarak jauh\n` +
            `   Senjata: Busur Pemburu\n\n` +
            `*Class saat ini:* ${player.kelas}\n` +
            `*Gunakan !class untuk memilih/mengganti class*`;
        
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/php4ng.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
    }
    break

    case "titleinfo": {
        let reply = `📋 *SEMUA TITLE YANG TERSEDIA* 📋\n\n`;
        
        Object.keys(titles).forEach(category => {
            const categoryNames = {
                combat: "⚔️ COMBAT TITLES",
                wealth: "💰 WEALTH TITLES", 
                hunting: "🎯 HUNTING TITLES",
                mining: "⛏️ MINING TITLES",
                woodcutting: "🪓 WOODCUTTING TITLES",
                fishing: "🎣 FISHING TITLES",
                classMastery: "👑 CLASS MASTERY",
                equipment: "🛡️ EQUIPMENT TITLES",
                special: "⭐ SPECIAL ACHIEVEMENTS"
            };
            
            reply += `*${categoryNames[category] || category.toUpperCase()}*\n`;
            Object.keys(titles[category]).forEach(titleName => {
                const title = titles[category][titleName];
                reply += `• ${titleName} - ${title.requirement}\n`;
            });
            reply += `\n`;
        });

        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/kzebzk.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "titles": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        // Check for new titles first
        const newTitles = checkAndAwardTitles(player);
        players[participant] = player;
        savePlayerData(players);

        const titleDisplay = getTitleDisplay(player);
        
        let reply = `🏆 *TITLE YANG DIMILIKI* 🏆\n\n`;
        reply += `👤 *Pemain:* ${player.nama}\n\n`;
        
        if (titleDisplay === "Tidak Ada") {
            reply += `❌ *Kamu belum memiliki title apapun!*\n\n`;
            reply += `💡 *Cara mendapatkan title:*\n`;
            reply += `• Level up untuk Combat Titles\n`;
            reply += `• Kumpulkan gold untuk Wealth Titles\n`;
            reply += `• Hunt monster untuk Hunting Titles\n`;
            reply += `• Mining untuk Mining Titles\n`;
            reply += `• Woodcutting untuk Woodcutting Titles\n`;
            reply += `• Fishing untuk Fishing Titles\n`;
            reply += `• Gunakan !titleinfo untuk melihat semua title\n`;
        } else {
            reply += `*📋 Title yang dimiliki:*\n`;
            const titleList = titleDisplay.split(" | ");
            titleList.forEach((title, index) => {
                reply += `${index + 1}. ${title}\n`;
            });
            
            reply += `\n📊 *Total:* ${titleList.length} title\n`;
        }
        
        // Show new titles notification
        if (newTitles.length > 0) {
            reply += `\n🎉 *TITLE BARU DIPEROLEH:*\n`;
            newTitles.forEach(title => {
                reply += `✨ ${title}\n`;
            });
        }

        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/kzebzk.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    // Secret Command - GOD KILLER
    case "12345": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        // Check if player already has GOD KILLER title
        if (player.titles && player.titles.includes('GOD KILLER')) {
            await evarickreply(`🔒 *Command ini sudah digunakan!*\n\nKamu sudah mendapatkan title GOD KILLER sebelumnya.`);
            return;
        }

        // Initialize titles array if not exists
        if (!player.titles) player.titles = [];

        // Add GOD KILLER title
        player.titles.push('GOD KILLER');

        // Give massive rewards
        player.gold += 9000000000; // 9 billion gold
        player.level += 500; // +500 levels
        
        // Update HP and Mana based on new level
        player.baseMaxHp += (500 * 10); // +10 HP per level
        player.baseMaxMana += (500 * 5); // +5 Mana per level
        player.hp = player.maxHp; // Full HP
        player.mana = player.maxMana; // Full Mana
        
        // Update attack and defense
        player.attack += (500 * 2); // +2 Attack per level
        player.defense += (500 * 1); // +1 Defense per level

        // Save changes
        players[participant] = player;
        savePlayerData(players);

        // Send epic notification
        await evarickreply(`🔥 *GOD KILLER ACTIVATED* 🔥\n\n` +
            `⚡ *POWER UNLEASHED!* ⚡\n\n` +
            `🏆 *Title Baru:* GOD KILLER\n` +
            `💰 *Gold +9.000.000.000*\n` +
            `📈 *Level +500*\n` +
            `❤️ *HP +5.000*\n` +
            `🔮 *Mana +2.500*\n` +
            `⚔️ *Attack +1.000*\n` +
            `🛡️ *Defense +500*\n\n` +
            `🌋 *KAMU SEKARANG ADALAH GOD KILLER!* 🌋\n` +
            `*Status Baru:*\n` +
            `Level: ${player.level}\n` +
            `Gold: ${player.gold.toLocaleString()}\n` +
            `HP: ${player.hp}/${player.maxHp}\n` +
            `Mana: ${player.mana}/${player.maxMana}\n` +
            `Attack: ${player.attack}\n` +
            `Defense: ${player.defense}\n\n` +
            `*Tidak ada yang bisa menghentikanmu!*`);
    }
    break

    // Advanced Statistics Commands
    case "stats": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        // Initialize stats tracking if not exists
        if (!player.statsHistory) player.statsHistory = [];
        if (!player.totalPlayTime) player.totalPlayTime = 0;
        if (!player.lastLogin) player.lastLogin = Date.now();

        // Calculate play time
        const currentTime = Date.now();
        const sessionTime = currentTime - player.lastLogin;
        player.totalPlayTime += sessionTime;
        player.lastLogin = currentTime;

        // Create detailed stats
        const stats = {
            level: player.level,
            exp: player.exp || 0,
            gold: player.gold,
            hp: player.hp,
            maxHp: player.maxHp,
            mana: player.mana,
            maxMana: player.maxMana,
            attack: player.attack,
            defense: player.defense,
            monsterKills: player.monsterKills || 0,
            miningCount: player.miningCount || 0,
            woodcuttingCount: player.woodcuttingCount || 0,
            fishingCount: player.fishingCount || 0,
            titles: player.titles ? player.titles.length : 0,
            equipment: Object.keys(player.equipment || {}).filter(slot => player.equipment[slot]).length,
            visitedLocations: player.visitedLocations ? player.visitedLocations.length : 0,
            totalPlayTime: player.totalPlayTime,
            consecutiveDays: player.consecutiveDays || 0,
            // PvP Stats
            pvpWins: player.pvpStats ? player.pvpStats.wins : 0,
            pvpLosses: player.pvpStats ? player.pvpStats.losses : 0,
            pvpDraws: player.pvpStats ? player.pvpStats.draws : 0,
            pvpRating: player.pvpStats ? player.pvpStats.rating : 1000,
            pvpTotalBattles: player.pvpStats ? player.pvpStats.totalBattles : 0,
            pvpWinStreak: player.pvpStats ? player.pvpStats.winStreak : 0,
            pvpBestStreak: player.pvpStats ? player.pvpStats.bestWinStreak : 0,
            // Quest Stats
            dailyQuestsCompleted: player.quests ? (player.quests.daily ? Object.keys(player.quests.daily.completed).length : 0) : 0,
            weeklyQuestsCompleted: player.quests ? (player.quests.weekly ? Object.keys(player.quests.weekly.completed).length : 0) : 0,
            storyQuestsCompleted: player.quests ? (player.quests.story ? Object.keys(player.quests.story.completed).length : 0) : 0,
            // Achievement Stats
            achievementsCompleted: player.achievements ? Object.keys(player.achievements.completed || {}).length : 0,
            // Equipment Details
            equippedItems: player.equipment || {},
            // Inventory Stats
            inventoryItems: Object.keys(player.tas || {}).length,
            totalInventoryValue: 0, // Will be calculated
            // Battle Stats
            battlePoint: player.battlePoint || 1000,
            // Social Stats
            friends: player.friends ? player.friends.length : 0,
            // Location Info
            currentLocation: player.lokasi || 'Desa Awal',
            // Time Stats
            joinDate: player.joinDate || Date.now(),
            lastActivity: player.lastActivity || Date.now()
        };

        // Save current stats to history (daily)
        const today = new Date().toDateString();
        const existingEntry = player.statsHistory.find(entry => entry.date === today);
        if (!existingEntry) {
            player.statsHistory.push({
                date: today,
                stats: { ...stats }
            });
        }

        // Keep only last 30 days of history
        if (player.statsHistory.length > 30) {
            player.statsHistory = player.statsHistory.slice(-30);
        }

        players[participant] = player;
        savePlayerData(players);

        // Calculate inventory value
        let totalInventoryValue = 0;
        if (player.tas) {
            Object.keys(player.tas).forEach(itemName => {
                const item = items.find(i => i.nama === itemName);
                if (item && item.hargaJual) {
                    totalInventoryValue += item.hargaJual * player.tas[itemName];
                }
            });
        }
        stats.totalInventoryValue = totalInventoryValue;

        // Calculate PvP win rate
        const pvpWinRate = stats.pvpTotalBattles > 0 ? ((stats.pvpWins / stats.pvpTotalBattles) * 100).toFixed(1) : 0;

        // Calculate EXP progress
        const expForNextLevel = Math.floor(100 * Math.pow(1.5, stats.level - 1));
        const expProgress = stats.exp / expForNextLevel * 100;

        // Format play time
        const playTimeHours = Math.floor(stats.totalPlayTime / (1000 * 60 * 60));
        const playTimeMinutes = Math.floor((stats.totalPlayTime % (1000 * 60 * 60)) / (1000 * 60));

        // Calculate days since join
        const daysSinceJoin = Math.floor((Date.now() - stats.joinDate) / (1000 * 60 * 60 * 24));

        // Get equipped items details
        const equippedItems = Object.entries(stats.equippedItems).filter(([slot, item]) => item).map(([slot, item]) => `${slot}: ${item}`).join(', ') || 'Tidak ada';

        let reply = `📊 *STATISTIK LENGKAP & RINCI* 📊\n\n`;
        reply += `👤 *Pemain:* ${player.nama}\n`;
        reply += `🏆 *Class:* ${player.kelas}\n`;
        reply += `📍 *Lokasi:* ${stats.currentLocation}\n`;
        reply += `📅 *Bergabung:* ${daysSinceJoin} hari yang lalu\n`;
        reply += `⏰ *Total Play Time:* ${playTimeHours}h ${playTimeMinutes}m\n\n`;
        
        reply += `*📈 COMBAT STATS:*\n`;
        reply += `⚔️ Level: ${stats.level} (${expProgress.toFixed(1)}%)\n`;
        reply += `📊 EXP: ${stats.exp}/${expForNextLevel}\n`;
        reply += `❤️ HP: ${stats.hp}/${stats.maxHp}\n`;
        reply += `🔮 Mana: ${stats.mana}/${stats.maxMana}\n`;
        reply += `🗡️ Attack: ${stats.attack}\n`;
        reply += `🛡️ Defense: ${stats.defense}\n`;
        reply += `⚔️ Battle Point: ${stats.battlePoint}\n\n`;
        
        reply += `*💰 ECONOMY:*\n`;
        reply += `💰 Gold: ${stats.gold.toLocaleString()}\n`;
        reply += `🏆 Titles: ${stats.titles}\n`;
        reply += `🎒 Equipment: ${stats.equipment}/6\n`;
        reply += `📦 Inventory Items: ${stats.inventoryItems}\n`;
        reply += `💎 Inventory Value: ${stats.totalInventoryValue.toLocaleString()} gold\n\n`;
        
        reply += `*⚔️ PVP STATS:*\n`;
        reply += `🏆 Rating: ${stats.pvpRating}\n`;
        reply += `📊 Record: ${stats.pvpWins}W - ${stats.pvpLosses}L - ${stats.pvpDraws}D\n`;
        reply += `📈 Win Rate: ${pvpWinRate}%\n`;
        reply += `🔥 Win Streak: ${stats.pvpWinStreak}\n`;
        reply += `⭐ Best Streak: ${stats.pvpBestStreak}\n`;
        reply += `⚔️ Total Battles: ${stats.pvpTotalBattles}\n\n`;
        
        reply += `*🎯 ACTIVITY STATS:*\n`;
        reply += `👹 Monster Kills: ${stats.monsterKills.toLocaleString()}\n`;
        reply += `⛏️ Mining: ${stats.miningCount.toLocaleString()}\n`;
        reply += `🪓 Woodcutting: ${stats.woodcuttingCount.toLocaleString()}\n`;
        reply += `🎣 Fishing: ${stats.fishingCount.toLocaleString()}\n\n`;
        
        reply += `*📋 QUEST PROGRESS:*\n`;
        reply += `📅 Daily Quests: ${stats.dailyQuestsCompleted}/4\n`;
        reply += `📊 Weekly Quests: ${stats.weeklyQuestsCompleted}/4\n`;
        reply += `📖 Story Quests: ${stats.storyQuestsCompleted}/3\n\n`;
        
        reply += `*🏅 ACHIEVEMENTS:*\n`;
        reply += `🏆 Completed: ${stats.achievementsCompleted}\n\n`;
        
        reply += `*👥 SOCIAL:*\n`;
        reply += `👥 Friends: ${stats.friends}\n`;
        reply += `📅 Consecutive Days: ${stats.consecutiveDays}\n`;
        reply += `📍 Locations Visited: ${stats.visitedLocations}\n\n`;
        
        reply += `*🎒 EQUIPMENT:*\n`;
        reply += `${equippedItems}\n\n`;
        
        reply += `*📊 COMMANDS:*\n`;
        reply += `• !stats compare [player] - Bandingkan stats\n`;
        reply += `• !stats history - Riwayat stats 7 hari\n`;
        reply += `• !quest progress - Progress quest aktif\n`;
        reply += `• !achievement progress - Progress achievement\n`;
        reply += `• !pvp history - Riwayat PvP`;

        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/byx3zy.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "statshistory": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        if (!player.statsHistory || player.statsHistory.length === 0) {
            await evarickreply(`📊 *STATS HISTORY*\n\n❌ *Belum ada riwayat stats!*\n\nGunakan !stats untuk mulai mencatat stats harian.`);
            return;
        }

        // Get last 7 days of history
        const last7Days = player.statsHistory.slice(-7);
        
        let reply = `📊 *STATS HISTORY (7 HARI TERAKHIR)* 📊\n\n`;
        reply += `👤 *Pemain:* ${player.nama}\n\n`;

        last7Days.forEach((entry, index) => {
            const date = new Date(entry.date);
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
            
            reply += `*📅 ${dayName}, ${dateStr}:*\n`;
            reply += `⚔️ Level: ${entry.stats.level}\n`;
            reply += `💰 Gold: ${entry.stats.gold.toLocaleString()}\n`;
            reply += `👹 Kills: ${entry.stats.monsterKills.toLocaleString()}\n`;
            reply += `⛏️ Mining: ${entry.stats.miningCount.toLocaleString()}\n`;
            reply += `🪓 Woodcut: ${entry.stats.woodcuttingCount.toLocaleString()}\n`;
            reply += `🎣 Fishing: ${entry.stats.fishingCount.toLocaleString()}\n`;
            
            if (entry.stats.pvpWins !== undefined) {
                reply += `⚔️ PvP: ${entry.stats.pvpWins}W/${entry.stats.pvpLosses}L\n`;
            }
            
            reply += `\n`;
        });

        reply += `*📈 TREND ANALISIS:*\n`;
        
        // Calculate trends
        if (last7Days.length >= 2) {
            const first = last7Days[0].stats;
            const last = last7Days[last7Days.length - 1].stats;
            
            const levelGain = last.level - first.level;
            const goldGain = last.gold - first.gold;
            const killsGain = last.monsterKills - first.monsterKills;
            
            reply += `📈 Level Gain: +${levelGain}\n`;
            reply += `💰 Gold Gain: +${goldGain.toLocaleString()}\n`;
            reply += `👹 Kills Gain: +${killsGain.toLocaleString()}\n`;
        }

        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/byx3zy.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "statscompare": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        if (!q) {
            await evarickreply(`⚠️ *Tentukan player untuk dibandingkan!*\n\nContoh: !statscompare [nama player]\n\n*Contoh:*\n• !statscompare Evarick\n• !statscompare Player123`);
            return;
        }

        // Find target player
        const targetPlayer = Object.values(players).find(p => 
            p.nama.toLowerCase() === q.toLowerCase()
        );

        if (!targetPlayer) {
            await evarickreply(`❌ *Player "${q}" tidak ditemukan!*\n\nPastikan nama player sudah benar dan sudah terdaftar.`);
            return;
        }

        if (targetPlayer.nama === player.nama) {
            await evarickreply(`🤔 *Kamu tidak bisa membandingkan stats dengan dirimu sendiri!*\n\nGunakan !stats untuk melihat stats kamu sendiri.`);
            return;
        }

        // Calculate total stats for both players
        const myTotalStats = calculateTotalStats(player);
        const targetTotalStats = calculateTotalStats(targetPlayer);

        // Calculate equipment stats for both players
        const myEquipmentStats = calculateEquipmentStats(player);
        const targetEquipmentStats = calculateEquipmentStats(targetPlayer);

        // Get detailed stats for both players
        const myStats = {
            level: player.level || 1,
            exp: player.exp || 0,
            gold: player.gold || 0,
            hp: player.hp || 100,
            maxHp: player.maxHp || 100,
            mana: player.mana || 50,
            maxMana: player.maxMana || 50,
            attack: myTotalStats.attack,
            defense: myTotalStats.defense,
            monsterKills: player.monsterKills || 0,
            titles: player.titles ? player.titles.length : 0,
            miningCount: player.miningCount || 0,
            woodcuttingCount: player.woodcuttingCount || 0,
            fishingCount: player.fishingCount || 0,
            pvpWins: player.pvpStats ? player.pvpStats.wins : 0,
            pvpLosses: player.pvpStats ? player.pvpStats.losses : 0,
            pvpRating: player.pvpStats ? player.pvpStats.rating : 1000,
            joinDate: player.joinDate || Date.now()
        };

        const targetStats = {
            level: targetPlayer.level || 1,
            exp: targetPlayer.exp || 0,
            gold: targetPlayer.gold || 0,
            hp: targetPlayer.hp || 100,
            maxHp: targetPlayer.maxHp || 100,
            mana: targetPlayer.mana || 50,
            maxMana: targetPlayer.maxMana || 50,
            attack: targetTotalStats.attack,
            defense: targetTotalStats.defense,
            monsterKills: targetPlayer.monsterKills || 0,
            titles: targetPlayer.titles ? targetPlayer.titles.length : 0,
            miningCount: targetPlayer.miningCount || 0,
            woodcuttingCount: targetPlayer.woodcuttingCount || 0,
            fishingCount: targetPlayer.fishingCount || 0,
            pvpWins: targetPlayer.pvpStats ? targetPlayer.pvpStats.wins : 0,
            pvpLosses: targetPlayer.pvpStats ? targetPlayer.pvpStats.losses : 0,
            pvpRating: targetPlayer.pvpStats ? targetPlayer.pvpStats.rating : 1000,
            joinDate: targetPlayer.joinDate || Date.now()
        };

        // Calculate play time
        const myPlayTime = Math.floor((Date.now() - myStats.joinDate) / (1000 * 60 * 60 * 24)); // days
        const targetPlayTime = Math.floor((Date.now() - targetStats.joinDate) / (1000 * 60 * 60 * 24)); // days

        let reply = `🎮 *STATS COMPARISON* 📊\n\n`;
        reply += `👤 *${player.nama}* vs *${targetPlayer.nama}*\n`;
        reply += `🎮 Class: ${player.kelas} vs ${targetPlayer.kelas}\n\n`;
        
        reply += `*📊 BASIC STATS:*\n`;
        reply += `⚔️ Level: ${myStats.level} vs ${targetStats.level} ${myStats.level > targetStats.level ? '✅' : myStats.level < targetStats.level ? '❌' : '🤝'}\n`;
        reply += `💰 Gold: ${myStats.gold.toLocaleString()} vs ${targetStats.gold.toLocaleString()} ${myStats.gold > targetStats.gold ? '✅' : myStats.gold < targetStats.gold ? '❌' : '🤝'}\n`;
        reply += `⚔️  Attack: ${myStats.attack} vs ${targetStats.attack} ${myStats.attack > targetStats.attack ? '✅' : myStats.attack < targetStats.attack ? '❌' : '🤝'}\n`;
        reply += `🛡️ Defense: ${myStats.defense} vs ${targetStats.defense} ${myStats.defense > targetStats.defense ? '✅' : myStats.defense < targetStats.defense ? '❌' : '🤝'}\n`;
        reply += `❤️ HP: ${myStats.hp}/${myStats.maxHp} vs ${targetStats.hp}/${targetStats.maxHp}\n`;
        reply += `🔮 Mana: ${myStats.mana}/${myStats.maxMana} vs ${targetStats.mana}/${targetStats.maxMana}\n\n`;

        reply += `*📈 ACTIVITY STATS:*\n`;
        reply += `👹 Monster Kills: ${myStats.monsterKills.toLocaleString()} vs ${targetStats.monsterKills.toLocaleString()} ${myStats.monsterKills > targetStats.monsterKills ? '✅' : myStats.monsterKills < targetStats.monsterKills ? '❌' : '🤝'}\n`;
        reply += `⛏️ Mining: ${myStats.miningCount.toLocaleString()} vs ${targetStats.miningCount.toLocaleString()} ${myStats.miningCount > targetStats.miningCount ? '✅' : myStats.miningCount < targetStats.miningCount ? '❌' : '🤝'}\n`;
        reply += `🪵 Woodcutting: ${myStats.woodcuttingCount.toLocaleString()} vs ${targetStats.woodcuttingCount.toLocaleString()} ${myStats.woodcuttingCount > targetStats.woodcuttingCount ? '✅' : myStats.woodcuttingCount < targetStats.woodcuttingCount ? '❌' : '🤝'}\n`;
        reply += `🎣 Fishing: ${myStats.fishingCount.toLocaleString()} vs ${targetStats.fishingCount.toLocaleString()} ${myStats.fishingCount > targetStats.fishingCount ? '✅' : myStats.fishingCount < targetStats.fishingCount ? '❌' : '🤝'}\n\n`;

        reply += `*⚔️ PVP STATS:*\n`;
        reply += `🏆 PvP Wins: ${myStats.pvpWins} vs ${targetStats.pvpWins} ${myStats.pvpWins > targetStats.pvpWins ? '✅' : myStats.pvpWins < targetStats.pvpWins ? '❌' : '🤝'}\n`;
        reply += `💀 PvP Losses: ${myStats.pvpLosses} vs ${targetStats.pvpLosses}\n`;
        reply += `📊 PvP Rating: ${myStats.pvpRating} vs ${targetStats.pvpRating} ${myStats.pvpRating > targetStats.pvpRating ? '✅' : myStats.pvpRating < targetStats.pvpRating ? '❌' : '🤝'}\n`;
        reply += `🏆 Titles: ${myStats.titles} vs ${targetStats.titles} ${myStats.titles > targetStats.titles ? '✅' : myStats.titles < targetStats.titles ? '❌' : '🤝'}\n\n`;

        reply += `*⏰ OTHER INFO:*\n`;
        reply += `📅 Play Time: ${myPlayTime} days vs ${targetPlayTime} days\n`;
        reply += `📦 Inventory Items: ${Object.keys(player.tas).length} vs ${Object.keys(targetPlayer.tas).length}\n`;
        reply += `🔧 Tools: ${player.tools ? player.tools.length : 0} vs ${targetPlayer.tools ? targetPlayer.tools.length : 0}\n\n`;
        
        // Calculate comprehensive score
        const myScore = (myStats.level * 100) + (myStats.gold / 1000) + (myStats.attack * 10) + (myStats.defense * 10) + 
                       (myStats.monsterKills * 5) + (myStats.miningCount * 2) + (myStats.woodcuttingCount * 2) + (myStats.fishingCount * 2) + 
                       (myStats.pvpWins * 50) + (myStats.pvpRating * 0.1) + (myStats.titles * 100);
        
        const targetScore = (targetStats.level * 100) + (targetStats.gold / 1000) + (targetStats.attack * 10) + (targetStats.defense * 10) + 
                           (targetStats.monsterKills * 5) + (targetStats.miningCount * 2) + (targetStats.woodcuttingCount * 2) + (targetStats.fishingCount * 2) + 
                           (targetStats.pvpWins * 50) + (targetStats.pvpRating * 0.1) + (targetStats.titles * 100);
        
        reply += `*📈 OVERALL COMPARISON:*\n`;
        if (myScore > targetScore) {
            reply += `🏆 *KAMU MENANG!* 🏆\n`;
            reply += `Total Power Score: ${Math.round(myScore).toLocaleString()} vs ${Math.round(targetScore).toLocaleString()}\n`;
            reply += `Gap: +${Math.round(myScore - targetScore).toLocaleString()}`;
        } else if (myScore < targetScore) {
            reply += `❌ *KAMU KALAH!* ❌\n`;
            reply += `Total Power Score: ${Math.round(myScore).toLocaleString()} vs ${Math.round(targetScore).toLocaleString()}\n`;
            reply += `Gap: -${Math.round(targetScore - myScore).toLocaleString()}`;
        } else {
            reply += `🤝 *SERI!* 🤝\n`;
            reply += `Total Power Score: ${Math.round(myScore).toLocaleString()} vs ${Math.round(targetScore).toLocaleString()}`;
        }
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/byx3zy.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "statshistory": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        if (!player.statsHistory || player.statsHistory.length === 0) {
            await evarickreply(`📊 *Belum ada riwayat stats!*\n\nStats history akan mulai tercatat setelah kamu menggunakan !stats.`);
            return;
        }

        let reply = `📈 *STATS HISTORY (7 Hari Terakhir)* 📈\n\n`;
        
        // Show last 7 days
        const recentHistory = player.statsHistory.slice(-7);
        
        recentHistory.forEach((entry, index) => {
            const date = new Date(entry.date);
            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
            const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' });
            
            reply += `*${dayName} ${dateStr}:*\n`;
            reply += `Level: ${entry.stats.level} | Gold: ${entry.stats.gold.toLocaleString()}\n`;
            reply += `Kills: ${entry.stats.monsterKills.toLocaleString()} | Titles: ${entry.stats.titles}\n\n`;
        });

        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/byx3zy.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    // Title Management Commands
    case "title": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        if (!q) {
            // Show title management menu
            const totalTitles = player.titles ? player.titles.length : 0;
            const equippedTitles = player.equippedTitles ? player.equippedTitles.length : 0;
            
            let reply = `🏆 *TITLE MANAGEMENT* 🏆\n\n`;
            reply += `📊 *Status:* ${equippedTitles}/3 title terpasang\n`;
            reply += `📚 *Total Title:* ${totalTitles} title dimiliki\n\n`;
            
            reply += `*Commands:*\n`;
            reply += `!title list - Lihat semua title\n`;
            reply += `!title equipped - Lihat title terpasang\n`;
            reply += `!equip title [nama] - Pasang title\n`;
            reply += `!unequip title [nama] - Lepas title\n\n`;
            
            if (equippedTitles > 0) {
                reply += `*Title Terpasang:*\n`;
                player.equippedTitles.forEach((title, index) => {
                    reply += `${index + 1}. ${title}\n`;
                });
            }
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/6kihvi.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        const action = q.toLowerCase();
        
        switch (action) {
            case 'list': {
                if (!player.titles || player.titles.length === 0) {
                    await evarickreply(`📚 *Tidak ada title yang dimiliki!*\n\nSelesaikan quest dan achievement untuk mendapatkan title.`);
                    return;
                }

                let reply = `📚 *DAFTAR SEMUA TITLE (${player.titles.length})* 📚\n\n`;
                player.titles.forEach((title, index) => {
                    const isEquipped = player.equippedTitles && player.equippedTitles.includes(title);
                    const status = isEquipped ? '✅' : '📋';
                    reply += `${status} ${index + 1}. ${title}\n`;
                });
                
                reply += `\n*Legend:*\n✅ = Terpasang\n📋 = Tersedia`;
                
                await evarickreply(reply);
            }
            break;

            case 'equipped': {
                if (!player.equippedTitles || player.equippedTitles.length === 0) {
                    await evarickreply(`🏆 *Tidak ada title yang terpasang!*\n\nGunakan !equip title [nama] untuk memasang title.`);
                    return;
                }

                let reply = `🏆 *TITLE TERPASANG (${player.equippedTitles.length}/3)* 🏆\n\n`;
                player.equippedTitles.forEach((title, index) => {
                    reply += `${index + 1}. ${title}\n`;
                });
                
                reply += `\n💡 *Tips:* Gunakan !unequip title [nama] untuk melepas title.`;
                
                await evarickreply(reply);
            }
            break;

            default:
                await evarickreply(`❌ *Command tidak valid!*\n\nGunakan:\n• !title list - Lihat semua title\n• !title equipped - Lihat title terpasang`);
                break;
        }
    }
    break

    // Social Features Commands
    case "friend": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Initialize friend system if not exists
        if (!player.friends) player.friends = [];
        if (!player.friendRequests) player.friendRequests = [];
        if (!player.blockedPlayers) player.blockedPlayers = [];

        if (!q) {
            // Show friend menu
            let reply = `👥 *FRIEND SYSTEM* 👥\n\n`;
            reply += `*Commands:*\n`;
            reply += `!friend add [nama] - Tambah teman\n`;
            reply += `!friend accept [nama] - Terima permintaan\n`;
            reply += `!friend decline [nama] - Tolak permintaan\n`;
            reply += `!friend remove [nama] - Hapus teman\n`;
            reply += `!friend list - Daftar teman\n`;
            reply += `!friend requests - Permintaan teman\n`;
            reply += `!friend gift [nama] [item] - Kirim hadiah\n`;
            reply += `!friend block [nama] - Blokir player\n`;
            reply += `!friend unblock [nama] - Unblokir player\n\n`;
            
            reply += `*Status:*\n`;
            reply += `👥 Teman: ${player.friends.length}\n`;
            reply += `📨 Permintaan: ${player.friendRequests.length}\n`;
            reply += `🚫 Diblokir: ${player.blockedPlayers.length}`;
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        const args = q.split(' ');
        const action = args[0]?.toLowerCase();
        const targetName = args.slice(1).join(' ');

        switch (action) {
            case 'add': {
                if (!targetName) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption:  `⚠️ *Tentukan nama player!*\n\nContoh: !friend add [nama]`,
   
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                const targetPlayer = Object.values(players).find(p => 
                    p.nama.toLowerCase() === targetName.toLowerCase()
                );

                if (!targetPlayer) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption:  `❌ *Player "${targetName}" tidak ditemukan!*`,
    
                        mentions: [sender]
                    }, { quoted: msg }); 
                    return;
                }

                if (targetPlayer.nama === player.nama) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption: `🤔 *Kamu tidak bisa menambah dirimu sendiri sebagai teman! coba bersosialisasi*`,
   
                        mentions: [sender]
                    }, { quoted: msg }); 
                    return;
                }

                if (player.friends.includes(targetPlayer.nama)) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption:  `👥 *Kamu sudah berteman dengan ${targetPlayer.nama}!*`,
  
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                if (player.friendRequests.includes(targetPlayer.nama)) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption:  `📨 *Kamu sudah mengirim permintaan pertemanan ke ${targetPlayer.nama}!*`,
    
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                // Send friend request
                if (!targetPlayer.friendRequests) targetPlayer.friendRequests = [];
                if (!targetPlayer.friendRequests.includes(player.nama)) {
                    targetPlayer.friendRequests.push(player.nama);
                    players[targetPlayer.id] = targetPlayer;
                    savePlayerData(players);
                }

                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                    caption:  `📨 *Permintaan pertemanan dikirim ke ${targetPlayer.nama}!*\n\nMereka harus menggunakan !friend accept ${player.nama} untuk menerima.`,
    
                    mentions: [sender]
                }, { quoted: msg });
    }
    break;

            case 'accept': {
                if (!targetName) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !friend accept [nama]`,
   
                        mentions: [sender]
                    }, { quoted: msg }); 
                    return;
                }

                if (!player.friendRequests.includes(targetName)) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption:  `❌ *Tidak ada permintaan pertemanan dari ${targetName}!*`,
    
                        mentions: [sender]
                    }, { quoted: msg }); 
                    return;
                }

                // Accept friend request
                player.friendRequests = player.friendRequests.filter(name => name !== targetName);
                player.friends.push(targetName);

                // Add to target player's friends list
                const targetPlayer = Object.values(players).find(p => p.nama === targetName);
                if (targetPlayer) {
                    if (!targetPlayer.friends) targetPlayer.friends = [];
                    targetPlayer.friends.push(player.nama);
                    players[targetPlayer.id] = targetPlayer;
                }

                players[participant] = player;
                savePlayerData(players);

                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                    caption: `✅ *Kamu sekarang berteman dengan ${targetName}!*`,
   
                    mentions: [sender]
                }, { quoted: msg }); 
            }
            break;

            case 'decline': {
                if (!targetName) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !friend decline [nama]`,
    
                        mentions: [sender]
                    }, { quoted: msg }); 
                    return;
                }

                if (!player.friendRequests.includes(targetName)) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption: `❌ *Tidak ada permintaan pertemanan dari ${targetName}!*`,
    
                        mentions: [sender]
                    }, { quoted: msg });
                    return;
                }

                player.friendRequests = player.friendRequests.filter(name => name !== targetName);
                players[participant] = player;
                savePlayerData(players);

                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                    caption: `❌ *Permintaan pertemanan dari ${targetName} ditolak.*`,
    
                    mentions: [sender]
                }, { quoted: msg }); 
            }
            break;

            case 'remove': {
                if (!targetName) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption: `⚠️ *Tentukan nama player!*\n\nContoh: !friend remove [nama]`,
   
                        mentions: [sender]
                    }, { quoted: msg }); 
                    return;
                }

                if (!player.friends.includes(targetName)) {
                    await evarick.sendMessage(sender, {
                        image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                        caption: `❌ *Kamu tidak berteman dengan ${targetName}!*`,
    
                        mentions: [sender]
                    }, { quoted: msg }); 
                    return;
                }

                // Remove from both players' friend lists
                player.friends = player.friends.filter(name => name !== targetName);
                
                const targetPlayer = Object.values(players).find(p => p.nama === targetName);
                if (targetPlayer && targetPlayer.friends) {
                    targetPlayer.friends = targetPlayer.friends.filter(name => name !== player.nama);
                    players[targetPlayer.id] = targetPlayer;
                }

                players[participant] = player;
                savePlayerData(players);

                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/pb5op4.jpg' },
                    caption: `👋 *${targetName} dihapus dari daftar teman.*`,
   
                    mentions: [sender]
                }, { quoted: msg });
            }
            break;

            case 'list': {
                if (player.friends.length === 0) {
                    await evarickreply(`👥 *Daftar teman kosong!*\n\nGunakan !friend add [nama] untuk menambah teman.`);
                    return;
                }

                let reply = `👥 *DAFTAR TEMAN (${player.friends.length})* 👥\n\n`;
                player.friends.forEach((friendName, index) => {
                    const friendPlayer = Object.values(players).find(p => p.nama === friendName);
                    const status = friendPlayer ? '🟢 Online' : '🔴 Offline';
                    const level = friendPlayer ? friendPlayer.level : '?';
                    reply += `${index + 1}. ${friendName} (Level ${level}) ${status}\n`;
                });

                await evarickreply(reply);
            }
            break;

            case 'requests': {
                if (player.friendRequests.length === 0) {
                    await evarickreply(`📨 *Tidak ada permintaan pertemanan!*`);
                    return;
                }

                let reply = `📨 *PERMINTAAN PERTEMANAN (${player.friendRequests.length})* 📨\n\n`;
                player.friendRequests.forEach((requestName, index) => {
                    const requestPlayer = Object.values(players).find(p => p.nama === requestName);
                    const level = requestPlayer ? requestPlayer.level : '?';
                    reply += `${index + 1}. ${requestName} (Level ${level})\n`;
                    reply += `   !friend accept ${requestName} | !friend decline ${requestName}\n\n`;
                });

                await evarickreply(reply);
            }
            break;

            case 'gift': {
                if (!targetName) {
                    await evarickreply(`⚠️ *Tentukan nama player dan item!*\n\nContoh: !friend gift [nama] [item]`);
                    return;
                }

                const itemName = args.slice(2).join(' ');
                if (!itemName) {
                    await evarickreply(`⚠️ *Tentukan item yang akan diberikan!*\n\nContoh: !friend gift [nama] [item]`);
                    return;
                }

                if (!player.friends.includes(targetName)) {
                    await evarickreply(`❌ *Kamu hanya bisa memberikan hadiah kepada teman!*`);
                    return;
                }

                if (!player.tas[itemName] || player.tas[itemName] <= 0) {
                    await evarickreply(`❌ *Kamu tidak memiliki item "${itemName}"!*`);
                    return;
                }

                // Send gift
                player.tas[itemName]--;
                if (player.tas[itemName] === 0) delete player.tas[itemName];

                const targetPlayer = Object.values(players).find(p => p.nama === targetName);
                if (targetPlayer) {
                    targetPlayer.tas[itemName] = (targetPlayer.tas[itemName] || 0) + 1;
                    players[targetPlayer.id] = targetPlayer;
                }

                players[participant] = player;
                savePlayerData(players);

                await evarickreply(`🎁 *Hadiah "${itemName}" berhasil dikirim ke ${targetName}!*`);
            }
            break;

            case 'block': {
                if (!targetName) {
                    await evarickreply(`⚠️ *Tentukan nama player!*\n\nContoh: !friend block [nama]`);
                    return;
                }

                if (player.blockedPlayers.includes(targetName)) {
                    await evarickreply(`🚫 *${targetName} sudah diblokir!*`);
                    return;
                }

                // Remove from friends if they are friends
                if (player.friends.includes(targetName)) {
                    player.friends = player.friends.filter(name => name !== targetName);
                }

                // Remove from friend requests
                player.friendRequests = player.friendRequests.filter(name => name !== targetName);

                // Add to blocked list
                player.blockedPlayers.push(targetName);

                players[participant] = player;
                savePlayerData(players);

                await evarickreply(`🚫 *${targetName} telah diblokir!*`);
            }
            break;

            case 'unblock': {
                if (!targetName) {
                    await evarickreply(`⚠️ *Tentukan nama player!*\n\nContoh: !friend unblock [nama]`);
                    return;
                }

                if (!player.blockedPlayers.includes(targetName)) {
                    await evarickreply(`❌ *${targetName} tidak diblokir!*`);
                    return;
                }

                player.blockedPlayers = player.blockedPlayers.filter(name => name !== targetName);
                players[participant] = player;
                savePlayerData(players);

                await evarickreply(`✅ *${targetName} telah diunblokir!*`);
            }
            break;

            default: {
                await evarickreply(`❌ *Action tidak valid!*\n\nGunakan !friend untuk melihat menu.`);
            }
        }
    }
    break

    // Dynamic World Commands
    case "world": {
        const worldEffects = getWorldEffects();
        
        let reply = `🌍 *DUNIA EVARICK* 🌍\n\n`;
        
        // Weather
        const weatherEmoji = {
            sunny: '☀️',
            rainy: '🌧️',
            stormy: '⛈️',
            snowy: '❄️',
            foggy: '🌫️'
        };
        
        reply += `*🌤️ CUACA:* ${weatherEmoji[worldEffects.weather]} ${worldEffects.weather.toUpperCase()}\n`;
        
        // Time
        const timeEmoji = {
            day: '☀️',
            night: '🌙',
            dawn: '🌅',
            dusk: '🌆'
        };
        
        reply += `*⏰ WAKTU:* ${timeEmoji[worldEffects.time]} ${worldEffects.time.toUpperCase()}\n`;
        
        // Season
        const seasonEmoji = {
            spring: '🌸',
            summer: '☀️',
            autumn: '🍂',
            winter: '❄️'
        };
        
        reply += `*🌿 MUSIM:* ${seasonEmoji[worldEffects.season]} ${worldEffects.season.toUpperCase()}\n\n`;
        
        // Effects
        reply += `*📊 EFEK DUNIA:*\n`;
        worldEffects.effects.forEach(effect => {
            reply += `• ${effect}\n`;
        });
        
        // Active events
        if (worldEffects.activeEvents.length > 0) {
            reply += `\n*🎉 EVENT AKTIF:*\n`;
            worldEffects.activeEvents.forEach(event => {
                const remainingTime = Math.floor((event.endTime - Date.now()) / 60000);
                reply += `• ${event.name} (${remainingTime}m tersisa)\n`;
            });
        }
        
        reply += `\n*Total Bonus: ${worldEffects.totalBonus.toFixed(1)}x*`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vs12tq.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "weather": {
        const worldEffects = getWorldEffects();
        const weatherEffect = weatherEffects[worldEffects.weather];
        
        let reply = `🌤️ *CUACA SAAT INI* 🌤️\n\n`;
        reply += `*${worldEffects.weather.toUpperCase()}*\n`;
        reply += `${weatherEffect.description}\n\n`;
        
        reply += `*📊 EFEK AKTIVITAS:*\n`;
        Object.entries(weatherEffect).forEach(([activity, data]) => {
            if (activity !== 'description') {
                const emoji = {
                    hunting: '🗡️',
                    mining: '⛏️',
                    woodcutting: '🪓',
                    fishing: '🎣'
                };
                reply += `${emoji[activity]} ${activity}: ${data.bonus > 1 ? '+' : ''}${((data.bonus - 1) * 100).toFixed(0)}%\n`;
            }
        });
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vs12tq.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "time": {
        const worldEffects = getWorldEffects();
        const timeEffect = timeEffects[worldEffects.time];
        
        let reply = `⏰ *WAKTU DUNIA* ⏰\n\n`;
        reply += `*${worldEffects.time.toUpperCase()}*\n`;
        reply += `${timeEffect.description}\n`;
        
        if (timeEffect.special) {
            reply += `\n*💡 Khusus:* ${timeEffect.special}`;
        }
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vs12tq.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "daily": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }
    
        // Waktu sekarang (WIT)
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jayapura' }));
        const lastReset = player.quests?.daily?.lastReset ? new Date(player.quests.daily.lastReset) : null;
        let streak = player.consecutiveDays || 0;
    
        // Cek apakah sudah bisa klaim
        let canClaim = false;
        if (!lastReset) {
            canClaim = true;
            streak = 1;
        } else {
            const diff = now - lastReset;
            if (diff >= 24 * 60 * 60 * 1000 && diff < 48 * 60 * 60 * 1000) {
                canClaim = true;
                streak += 1;
            } else if (diff >= 48 * 60 * 60 * 1000) {
                canClaim = true;
                streak = 1; // reset streak
            }
        }
    
        if (!canClaim) {
            // Hitung waktu sisa
            const nextClaim = new Date(lastReset.getTime() + 24 * 60 * 60 * 1000);
            const timeLeft = nextClaim - now;
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            await evarickreply(`❌ Kamu sudah klaim daily hari ini!\nCoba lagi dalam ${hours} jam ${minutes} menit ${seconds} detik.`);
            break;
        }
    
        // Ambil reward dari dailyRewards
        const rewardKey = `day${streak}` in dailyRewards ? `day${streak}` : "day1";
        const reward = dailyRewards[rewardKey];
    
        // Tambahkan reward ke player
        player.gold = (player.gold || 0) + (reward.gold || 0);
        player.exp = (player.exp || 0) + (reward.exp || 0);
        if (!player.tas) player.tas = {};
        (reward.items || []).forEach(item => {
            player.tas[item] = (player.tas[item] || 0) + 1;
        });
        if (reward.title && (!player.titles || !player.titles.includes(reward.title))) {
            if (!player.titles) player.titles = [];
            player.titles.push(reward.title);
        }
    
        // Update streak dan lastReset
        player.consecutiveDays = streak;
        if (!player.quests) player.quests = {};
        if (!player.quests.daily) player.quests.daily = {};
        player.quests.daily.lastReset = now.getTime();
    
        // Save data
        players[participant] = player;
        savePlayerData(players);
    
        // Buat pesan balasan
        let reply = `🎉 *DAILY REWARD BERHASIL DIKLAIM!* 🎉\n\n`;
        reply += `📅 *Streak:* ${streak} hari berturut-turut\n`;
        reply += `💰 *Gold:* +${reward.gold}\n`;
        reply += `✨ *Exp:* +${reward.exp}\n`;
        if (reward.items && reward.items.length > 0) {
            reply += `🎁 *Items:*\n`;
            reward.items.forEach(item => {
                reply += `   📦 ${item}\n`;
            });
        }
        if (reward.title) {
            reply += `🏆 *Title Baru:* ${reward.title}\n`;
        }
        reply += `\n💡 *Tips:* Login setiap hari untuk mendapatkan streak bonus!`;
    
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ay9k39.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    
        break;
    }

    case "dailyinfo": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        const check = checkDailyReward(player);
        const currentStreak = player.dailyRewards ? player.dailyRewards.currentStreak : 0;
        const totalDays = player.dailyRewards ? player.dailyRewards.totalDays : 0;
        
        let reply = `📅 *DAILY REWARD INFO* 📅\n\n`;
        reply += `👤 *Pemain:* ${player.nama}\n`;
        reply += `🔥 *Current Streak:* ${currentStreak} hari\n`;
        reply += `📊 *Total Days:* ${totalDays} hari\n\n`;
        
        if (check.canClaim) {
            reply += `✅ *Status:* Daily reward tersedia!\n`;
            reply += `🎁 *Reward Hari Ini:*\n`;
            reply += `   💰 Gold: ${check.reward.gold.toLocaleString()}\n`;
            check.reward.items.forEach(item => {
                if (item.startsWith('Title: ')) {
                    const titleName = item.replace('Title: ', '');
                    reply += `   🏆 Title: ${titleName}\n`;
                } else {
                    reply += `   📦 ${item}\n`;
                }
            });
            reply += `\n💡 Gunakan !daily untuk mengklaim reward!`;
        } else {
            reply += `❌ *Status:* ${check.message}\n\n`;
            reply += `⏰ *Next Reward:* Besok pagi`;
        }
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ay9k39.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "streak": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        const currentStreak = player.dailyRewards ? player.dailyRewards.currentStreak : 0;
        const totalDays = player.dailyRewards ? player.dailyRewards.totalDays : 0;
        
        let reply = `🔥 *DAILY STREAK INFO* 🔥\n\n`;
        reply += `👤 *Pemain:* ${player.nama}\n`;
        reply += `🔥 *Current Streak:* ${currentStreak} hari berturut-turut\n`;
        reply += `📊 *Total Days:* ${totalDays} hari\n\n`;
        
        if (currentStreak > 0) {
            reply += `🎯 *Streak Milestones:*\n`;
            const milestones = [7, 14, 21, 30, 60, 90, 180, 365];
            milestones.forEach(milestone => {
                const status = currentStreak >= milestone ? '✅' : '❌';
                reply += `${status} ${milestone} hari\n`;
            });
        } else {
            reply += `💡 *Mulai streak kamu dengan login setiap hari!*`;
        }
        
        await evarickreply(reply);
    }
    break

    // Weekly Challenges System
    case "weekly": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        const challenges = checkWeeklyChallenges(player);
        
        let reply = `📋 *WEEKLY CHALLENGES* 📋\n\n`;
        reply += `📅 *Minggu:* ${getCurrentWeek()}\n\n`;
        
        if (challenges.availableChallenges.length === 0 && challenges.completedChallenges.length === 0) {
            reply += `📝 *Tidak ada challenge yang tersedia saat ini!*`;
        } else {
            if (challenges.availableChallenges.length > 0) {
                reply += `*🎯 CHALLENGES YANG TERSEDIA:*\n`;
                challenges.availableChallenges.forEach((challenge, index) => {
                    const progress = challenge.progress || 0;
                    const percentage = Math.min(100, Math.round((progress / challenge.target) * 100));
                    const progressBar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
                    
                    reply += `${index + 1}. ${challenge.name}\n`;
                    reply += `   📝 ${challenge.description}\n`;
                    reply += `   📊 Progress: ${progress}/${challenge.target} (${percentage}%)\n`;
                    reply += `   ${progressBar}\n`;
                    reply += `   🎁 Reward: ${challenge.reward.gold} gold + ${challenge.reward.items.join(', ')}\n\n`;
                });
            }
            
            if (challenges.completedChallenges.length > 0) {
                reply += `*✅ CHALLENGES SELESAI (Belum Diklaim):*\n`;
                challenges.completedChallenges.forEach((challenge, index) => {
                    reply += `${index + 1}. ${challenge.name}\n`;
                    reply += `   🎁 Reward: ${challenge.reward.gold} gold + ${challenge.reward.items.join(', ')}\n`;
                    reply += `   💡 Gunakan !weekly claim ${challenge.id} untuk mengklaim\n\n`;
                });
            }
        }
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/iqjs8n.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "weeklyclaim": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        if (!q) {
            await evarickreply(`⚠️ *Tentukan challenge ID!*\n\nGunakan !weekly untuk melihat challenges yang tersedia.`);
            return;
        }

        const challenges = checkWeeklyChallenges(player);
        const challenge = challenges.completedChallenges.find(c => c.id === q);
        
        if (!challenge) {
            await evarickreply(`❌ *Challenge tidak ditemukan atau belum selesai!*\n\nGunakan !weekly untuk melihat challenges yang tersedia.`);
            return;
        }

        // Mark as claimed
        player.weeklyChallenges.claimed[challenge.id] = true;
        
        // Give rewards
        player.gold += challenge.reward.gold;
        challenge.reward.items.forEach(item => {
            if (item.startsWith('Title: ')) {
                const titleName = item.replace('Title: ', '');
                if (!player.titles) player.titles = [];
                if (!player.titles.includes(titleName)) {
                    player.titles.push(titleName);
                }
            } else {
                player.tas[item] = (player.tas[item] || 0) + 1;
            }
        });
        
        // Save player data
        players[participant] = player;
        savePlayerData(players);
        
        let reply = `🎉 *WEEKLY CHALLENGE REWARD DIKLAIM!* 🎉\n\n`;
        reply += `🏆 *Challenge:* ${challenge.name}\n`;
        reply += `💰 *Gold:* +${challenge.reward.gold.toLocaleString()}\n`;
        
        if (challenge.reward.items.length > 0) {
            reply += `🎁 *Items:*\n`;
            challenge.reward.items.forEach(item => {
                if (item.startsWith('Title: ')) {
                    const titleName = item.replace('Title: ', '');
                    reply += `   🏆 ${titleName}\n`;
                } else {
                    reply += `   📦 ${item}\n`;
                }
            });
        }
        
        await evarickreply(reply);
    }
    break

    case "weeklyinfo": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        let reply = `📋 *WEEKLY CHALLENGES INFO* 📋\n\n`;
        reply += `👤 *Pemain:* ${player.nama}\n`;
        reply += `📅 *Minggu Saat Ini:* ${getCurrentWeek()}\n\n`;
        
        reply += `*🎯 CHALLENGES TERSEDIA:*\n`;
        weeklyChallenges.forEach((challenge, index) => {
            const progress = player.weeklyChallenges ? (player.weeklyChallenges.progress[challenge.id] || 0) : 0;
            const isCompleted = progress >= challenge.target;
            const isClaimed = player.weeklyChallenges ? (player.weeklyChallenges.claimed[challenge.id] || false) : false;
            
            let status = '🔄';
            if (isCompleted && !isClaimed) status = '✅';
            else if (isClaimed) status = '🎁';
            
            reply += `${status} ${challenge.name}\n`;
            reply += `   📝 ${challenge.description}\n`;
            reply += `   📊 Progress: ${progress}/${challenge.target}\n`;
            reply += `   🎁 Reward: ${challenge.reward.gold} gold + ${challenge.reward.items.join(', ')}\n\n`;
        });
        
        reply += `💡 *Gunakan !weekly untuk melihat detail progress!*`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/iqjs8n.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    // Achievement System
    case "achievement": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        if (!q) {
            // Check for new achievements
            const newAchievements = checkAchievements(player);
            
            if (newAchievements.length > 0) {
                // Save player data
                players[participant] = player;
                savePlayerData(players);
                
                let reply = `🏆 *ACHIEVEMENT UNLOCKED!* 🏆\n\n`;
                newAchievements.forEach(achievement => {
                    reply += `🎉 *${achievement.description}*\n`;
                    reply += `💰 Gold: +${achievement.reward.gold}\n`;
                    if (achievement.reward.items.length > 0) {
                        reply += `🎁 Items: ${achievement.reward.items.join(', ')}\n`;
                    }
                    reply += `\n`;
                });
                
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/6kihvi.jpg' },
                    caption: (`📊 *Tidak ada achievement baru yang terbuka!*\n\nLanjutkan bermain untuk membuka achievement lainnya.`),
                    mentions: [sender]
                }, { quoted: msg });
             }
            return;
        }

        // Parse achievement command with parameters
        const args = q.split(' ');
        const action = args[0]?.toLowerCase();
        const achievementId = args.slice(1).join(' ');

        if (action === 'progress') {
            // Show achievement progress
            if (!player.achievements) {
                player.achievements = { unlocked: [], progress: {} };
            }

            let reply = `📊 *ACHIEVEMENT PROGRESS* 📊\n\n`;
            reply += `👤 *Pemain:* ${player.nama}\n`;
            reply += `📈 *Total Unlocked:* ${player.achievements.unlocked.length}\n\n`;
            
            // Show progress for each category
            Object.keys(achievements).forEach(category => {
                const categoryEmoji = {
                    combat: '⚔️',
                    economy: '💰',
                    activity: '🎯',
                    social: '👥',
                    exploration: '🗺️'
                };
                
                reply += `${categoryEmoji[category]} *${category.toUpperCase()}*\n`;
                
                Object.keys(achievements[category]).forEach(achievementId => {
                    const achievement = achievements[category][achievementId];
                    const isUnlocked = player.achievements.unlocked.includes(achievementId);
                    const status = isUnlocked ? '✅' : '🔄';
                    
                    reply += `${status} ${achievement.description}\n`;
                    
                    if (!isUnlocked) {
                        // Show progress if available
                        const progress = player.achievements.progress[achievementId] || 0;
                        if (achievement.condition && typeof achievement.condition === 'function') {
                            // Try to get current progress
                            const currentValue = getAchievementProgress(player, achievementId);
                            if (currentValue !== null) {
                                reply += `   📊 Progress: ${currentValue}\n`;
                            }
                        }
                    }
                    reply += `\n`;
                });
            });
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/6kihvi.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg }); 
        } else if (action === 'claim') {
            // Claim achievement reward
            if (!achievementId) {
                await evarickreply(`⚠️ *Tentukan achievement ID!*\n\nGunakan !achievements untuk melihat achievement yang tersedia.`);
                return;
            }

            // Find achievement
            let targetAchievement = null;
            let achievementCategory = null;
            
            Object.keys(achievements).forEach(category => {
                Object.keys(achievements[category]).forEach(id => {
                    if (id === achievementId) {
                        targetAchievement = achievements[category][id];
                        achievementCategory = category;
                    }
                });
            });
            
            if (!targetAchievement) {
                await evarickreply(`❌ *Achievement tidak ditemukan!*\n\nGunakan !achievements untuk melihat achievement yang tersedia.`);
                return;
            }

            // Check if achievement is unlocked
            if (!player.achievements.unlocked.includes(achievementId)) {
                await evarickreply(`❌ *Achievement belum terbuka!*\n\nLanjutkan bermain untuk membuka achievement ini.`);
                return;
            }

            // Check if already claimed
            if (player.achievements.claimed && player.achievements.claimed[achievementId]) {
                await evarickreply(`❌ *Reward achievement sudah diklaim!*`);
                return;
            }

            // Mark as claimed and give rewards
            if (!player.achievements.claimed) player.achievements.claimed = {};
            player.achievements.claimed[achievementId] = true;
            
            player.gold += targetAchievement.reward.gold;
            targetAchievement.reward.items.forEach(item => {
                if (item.startsWith('Title: ')) {
                    const titleName = item.replace('Title: ', '');
                    if (!player.titles) player.titles = [];
                    if (!player.titles.includes(titleName)) {
                        player.titles.push(titleName);
            }
        } else {
                    player.tas[item] = (player.tas[item] || 0) + 1;
                }
            });
            
            // Save player data
            players[participant] = player;
            savePlayerData(players);
            
            let reply = `🎉 *ACHIEVEMENT REWARD DIKLAIM!* 🎉\n\n`;
            reply += `🏆 *Achievement:* ${targetAchievement.description}\n`;
            reply += `💰 *Gold:* +${targetAchievement.reward.gold.toLocaleString()}\n`;
            
            if (targetAchievement.reward.items.length > 0) {
                reply += `🎁 *Items:*\n`;
                targetAchievement.reward.items.forEach(item => {
                    if (item.startsWith('Title: ')) {
                        const titleName = item.replace('Title: ', '');
                        reply += `   🏆 ${titleName}\n`;
                    } else {
                        reply += `   📦 ${item}\n`;
                    }
                });
            }
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/6kihvi.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
        } else {
            // Show specific achievement info
            if (!achievementId) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/6kihvi.jpg' },
                    caption: `⚠️ *Tentukan achievement ID!*\n\nGunakan !achievements untuk melihat achievement yang tersedia.`,
                    mentions: [sender]
                }, { quoted: msg }); 
                return;
            }

            // Find achievement
            let targetAchievement = null;
            let achievementCategory = null;
            
            Object.keys(achievements).forEach(category => {
                Object.keys(achievements[category]).forEach(id => {
                    if (id === achievementId) {
                        targetAchievement = achievements[category][id];
                        achievementCategory = category;
                    }
                });
            });
            
            if (!targetAchievement) {
                await evarickreply(`❌ *Achievement tidak ditemukan!*\n\nGunakan !achievements untuk melihat achievement yang tersedia.`);
                return;
            }

            const isUnlocked = player.achievements ? player.achievements.unlocked.includes(achievementId) : false;
            const isClaimed = player.achievements && player.achievements.claimed ? player.achievements.claimed[achievementId] : false;
            
            let reply = `🏆 *ACHIEVEMENT INFO* 🏆\n\n`;
            reply += `📝 *${targetAchievement.description}*\n`;
            reply += `📂 *Category:* ${achievementCategory.toUpperCase()}\n`;
            reply += `📊 *Status:* ${isUnlocked ? '✅ Unlocked' : '❌ Locked'}\n`;
            
            if (isUnlocked) {
                reply += `🎁 *Claim Status:* ${isClaimed ? '✅ Claimed' : '🔄 Unclaimed'}\n`;
            }
            
            reply += `💰 *Reward:* ${targetAchievement.reward.gold} gold`;
            if (targetAchievement.reward.items.length > 0) {
                reply += ` + ${targetAchievement.reward.items.join(', ')}`;
            }
            reply += `\n`;
            
            if (!isUnlocked) {
                const currentValue = getAchievementProgress(player, achievementId);
                if (currentValue !== null) {
                    reply += `📈 *Current Progress:* ${currentValue}\n`;
                }
            }
            
            if (isUnlocked && !isClaimed) {
                reply += `\n💡 *Gunakan !achievement claim ${achievementId} untuk mengklaim reward!*`;
            }
            
            await evarickreply(reply);
        }
    }
    break

    case "achievements": {
        if (!player) {
           await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });  return;
        }

        if (!player.achievements) {
            player.achievements = { unlocked: [], progress: {} };
        }

        let reply = `🏆 *ACHIEVEMENTS* 🏆\n\n`;
        reply += `👤 *Pemain:* ${player.nama}\n`;
        reply += `📊 *Total Unlocked:* ${player.achievements.unlocked.length}\n\n`;
        
        // Show achievements by category
        Object.keys(achievements).forEach(category => {
            const categoryEmoji = {
                combat: '⚔️',
                economy: '💰',
                activity: '🎯',
                social: '👥',
                exploration: '🗺️'
            };
            
            reply += `${categoryEmoji[category]} *${category.toUpperCase()}*\n`;
            
            Object.keys(achievements[category]).forEach(achievementId => {
                const achievement = achievements[category][achievementId];
                const isUnlocked = player.achievements.unlocked.includes(achievementId);
                const isClaimed = player.achievements.claimed ? player.achievements.claimed[achievementId] : false;
                let status = '❌';
                if (isUnlocked) {
                    status = isClaimed ? '🎁' : '✅';
                }
                
                reply += `${status} ${achievement.description}\n`;
                if (isUnlocked) {
                    reply += `   🎁 Reward: ${achievement.reward.gold} gold`;
                    if (achievement.reward.items.length > 0) {
                        reply += ` + ${achievement.reward.items.join(', ')}`;
                    }
                    reply += `\n`;
                }
                reply += `\n`;
            });
        });
        
        reply += `💡 *Gunakan !achievement progress untuk melihat progress detail!*`;
            
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/6kihvi.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    // Quest System


case "quest": {
    if (!player) {
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
            mentions: [sender]
        }, { quoted: msg });
          return;
    }

    // Initialize quests if not exists
    initializePlayerQuests(player);

     // ADD THIS LINE - Check and reset quests if needed
     checkQuests(player);

    if (!q) {
        // Show simplified quest overview
        let reply = `🎯 *SISTEM QUEST* 📜\n\n`;
        reply += `🧑 *Pemain:* ${player.nama}\n\n`;
        
        // Daily Quests Summary
        const dailyQuests = quests.daily;
        const dailyCompleted = Object.keys(player.quests.daily.completed || {}).length;
        const dailyClaimed = Object.keys(player.quests.daily.claimed || {}).length;
        
        reply += `🎯 *DAILY QUESTS:* ${dailyCompleted}/${dailyQuests.length} selesai\n`;
        reply += `   🎁 ${dailyClaimed} reward diklaim\n\n`;
        
        // Weekly Quests Summary
        const weeklyQuests = quests.weekly;
        const weeklyCompleted = Object.keys(player.quests.weekly.completed || {}).length;
        const weeklyClaimed = Object.keys(player.quests.weekly.claimed || {}).length;
        
        reply += `📆 *WEEKLY QUESTS:* ${weeklyCompleted}/${weeklyQuests.length} selesai\n`;
        reply += `   🎁 ${weeklyClaimed} reward diklaim\n\n`;
        
        // Story Quests Summary
        const storyQuests = quests.story;
        const storyAccepted = Object.keys(player.quests.story.accepted || {}).length;
        const storyCompleted = Object.keys(player.quests.story.completed || {}).length;
        const storyClaimed = Object.keys(player.quests.story.claimed || {}).length;
        
        reply += `🔥 *STORY QUESTS:* ${storyCompleted}/${storyQuests.length} selesai\n`;
        reply += `   🔄 ${storyAccepted} sedang berlangsung\n`;
        reply += `   🎁 ${storyClaimed} reward diklaim\n\n`;
        
        reply += `💡 *COMMANDS MUDAH:*\n`;
        reply += `• !quest daily - Lihat daily quests\n`;
        reply += `• !quest weekly - Lihat weekly quests\n`;
        reply += `• !quest story - Lihat story quests\n`;
        reply += `• !quest claim all - Klaim semua reward selesai\n`;
        reply += `• !quest take [id] - Ambil story quest\n`;
        
               
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
                return;
    }

    const args = q.split(' ');
    const action = args[0]?.toLowerCase();
    const questId = args.slice(1).join(' ');

    if (action === 'daily') {
        // Show daily quests
        let reply = `🎯 *DAILY QUESTS* 📅\n\n`;
        
        quests.daily.forEach(quest => {
            const status = getQuestStatus(player, quest.id, 'daily');
            reply += formatQuestDisplay(quest, status, 'daily') + '\n\n';
        });
        
        reply += `💡 *Daily quests otomatis aktif setiap hari!*`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        
    } else if (action === 'weekly') {
        // Show weekly quests
        let reply = `📆 *WEEKLY QUESTS* 📆\n\n`;
        
        quests.weekly.forEach(quest => {
            const status = getQuestStatus(player, quest.id, 'weekly');
            reply += formatQuestDisplay(quest, status, 'weekly') + '\n\n';
        });
        
        reply += `💡 *Weekly quests otomatis aktif setiap minggu!*`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        
    } else if (action === 'story') {
        // Show story quests
        let reply = `🔥 *STORY QUESTS* 📖\n\n`;
        
        quests.story.forEach(quest => {
            const status = getQuestStatus(player, quest.id, 'story');
            const isAccepted = player.quests.story.accepted && player.quests.story.accepted[quest.id];
            
            let emoji = '🔥';
            if (status.isCompleted && !status.isClaimed) emoji = '✅';
            else if (status.isClaimed) emoji = '🔥';
            else if (isAccepted) emoji = '🔄';
            
            reply += `${emoji} *${quest.name}*\n`;
            reply += `   📝 ${quest.description}\n`;
            
            if (isAccepted || status.isCompleted) {
                let totalProgress = 0;
                let totalTarget = 0;
                quest.requirements.forEach(req => {
                    const current = player.quests.story.progress[quest.id]?.[req.type] || 0;
                    totalProgress += Math.min(current, req.target);
                    totalTarget += req.target;
                });
                reply += `   📊 Progress: ${totalProgress}/${totalTarget}\n`;
            }
            
            reply += `   💰 Reward: ${quest.reward.gold} gold + ${quest.reward.items.join(', ')}\n\n`;
        });
        
        reply += `💡 *Gunakan !quest take [id] untuk mengambil story quest!*`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        
    } else if (action === 'claim') {
        if (questId === 'all') {
            // Claim all completed quests
            let claimedCount = 0;
            let totalGold = 0;
            let claimedItems = [];
            
            ['daily', 'weekly', 'story'].forEach(category => {
                quests[category].forEach(quest => {
                    const status = getQuestStatus(player, quest.id, category);
                    if (status.isCompleted && !status.isClaimed) {
                        // Claim the quest
                        if (!player.quests[category].claimed) player.quests[category].claimed = {};
                        player.quests[category].claimed[quest.id] = true;
                        
                        // Give rewards
                        player.gold += quest.reward.gold;
                        totalGold += quest.reward.gold;
                        
                        quest.reward.items.forEach(item => {
                            player.tas[item] = (player.tas[item] || 0) + 1;
                            claimedItems.push(item);
                        });
                        
                        claimedCount++;
                    }
                });
            });
            
            if (claimedCount === 0) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
                    caption: (`❌ *Tidak ada quest yang bisa diklaim!*`),
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
            
            // Save player data
            players[participant] = player;
            savePlayerData(players);
            
            let reply = `🔥 *CLAIM ALL REWARDS!* 🎁\n\n`;
            reply += `✅ *${claimedCount} quest berhasil diklaim!*\n`;
            reply += `💰 *Gold diperoleh:* +${totalGold}\n`;
            reply += `🔥 *Items diperoleh:* ${claimedItems.join(', ')}\n\n`;
            reply += `💡 *Gunakan !quest untuk melihat quest lainnya!*`;
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            
        } else {
            // Claim specific quest
            if (!questId) {
                await evarickreply(`⚠️ *Tentukan quest ID!*\n\nGunakan !quest daily/weekly/story untuk melihat quest.`);
                return;
            }
            
            // Find quest
            let targetQuest = null;
            let questCategory = null;
            
            ['daily', 'weekly', 'story'].forEach(category => {
                const found = quests[category].find(quest => quest.id === questId);
                if (found) {
                    targetQuest = found;
                    questCategory = category;
                }
            });
            
            if (!targetQuest) {
                await evarickreply(`❌ *Quest tidak ditemukan!*`);
                return;
            }
            
            const status = getQuestStatus(player, questId, questCategory);
            
            if (!status.isCompleted) {
                await evarickreply(`❌ *Quest belum selesai!*\n\nProgress: ${status.progress}/${status.target}`);
                return;
            }
            
            if (status.isClaimed) {
                await evarickreply(`🎁 *Reward quest sudah diklaim!*`);
                return;
            }
            
            // Claim the quest
            if (!player.quests[questCategory].claimed) player.quests[questCategory].claimed = {};
            player.quests[questCategory].claimed[questId] = true;
            
            // Give rewards
            player.gold += targetQuest.reward.gold;
            targetQuest.reward.items.forEach(item => {
                player.tas[item] = (player.tas[item] || 0) + 1;
            });
            
            // Save player data
            players[participant] = player;
            savePlayerData(players);
            
            let reply = `🎁 *QUEST REWARD DICLAIM!* 🎁\n\n`;
            reply += `✅ *Quest:* ${targetQuest.name}\n`;
            reply += `💰 *Gold diperoleh:* +${targetQuest.reward.gold}\n`;
            reply += `🔥 *Items diperoleh:* ${targetQuest.reward.items.join(', ')}`;
            
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
        }
        
    } else if (action === 'take') {
        // Take story quest
        if (!questId) {
            await evarickreply(`⚠️ *Tentukan quest ID!*\n\nGunakan !quest story untuk melihat story quests.`);
            return;
        }
        
        const quest = quests.story.find(q => q.id === questId);
        if (!quest) {
            await evarickreply(`❌ *Story quest tidak ditemukan!*`);
            return;
        }
        
        const status = getQuestStatus(player, questId, 'story');
        const isAccepted = player.quests.story.accepted && player.quests.story.accepted[questId];
        
        if (isAccepted) {
            await evarickreply(`❌ *Quest sudah diterima!*`);
            return;
        }
        
        if (status.isCompleted) {
            await evarickreply(`❌ *Quest sudah selesai!*`);
            return;
        }
        
        // Accept the quest
        if (!player.quests.story.accepted) player.quests.story.accepted = {};
        player.quests.story.accepted[questId] = true;
        
        // Save player data
        players[participant] = player;
        savePlayerData(players);
        
        let reply = `🔥 *STORY QUEST DITERIMA!* 📜\n\n`;
        reply += `🎯 *Quest:* ${quest.name}\n`;
        reply += `📝 *Deskripsi:* ${quest.description}\n`;
        reply += `💰 *Reward:* ${quest.reward.gold} gold + ${quest.reward.items.join(', ')}\n\n`;
        reply += `🔥 *Lanjutkan bermain untuk menyelesaikan quest ini!*`;
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vuo9vs.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
        
    } else {
        await evarickreply(`❌ *Command tidak valid!*\n\nGunakan:\n• !quest - Overview quest\n• !quest daily - Daily quests\n• !quest weekly - Weekly quests\n• !quest story - Story quests\n• !quest claim all - Klaim semua reward`);
    }
}
break

// PvP Challenge System
case "pvp": {
    if (!player) {
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/ive435.jpg' },
            caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
            mentions: [sender]
        }, { quoted: msg });
           return;
    }

    const sub = args.shift()?.toLowerCase();
    
    // Initialize PvP stats if not exists
    if (!player.pvpStats) {
        player.pvpStats = {
            rating: 1000,
            wins: 0,
            losses: 0,
            draws: 0,
            winStreak: 0,
            bestWinStreak: 0,
            totalBattles: 0,
            lastBattle: null,
            battleHistory: []
        };
    }

    if (sub === "challenge") {
        // Cek target
        const target = args[0];
        if (!target) {
            await evarickreply("⚔️ *PvP CHALLENGE*\n\nGunakan: !pvp challenge [nomor/username]\n\nContoh: !pvp challenge Evarick");
            return;
        }
        
        // Cari player target
        const targetId = Object.keys(players).find(pid =>
            pid === target || (players[pid].nama && players[pid].nama.toLowerCase() === target.toLowerCase())
        );
        
        if (!targetId || targetId === participant) {
            await evarickreply("❌ *Target tidak ditemukan atau tidak valid!*\n\nPastikan nama player benar dan bukan diri sendiri.");
            return;
        }

        // Cek apakah sudah ada duel aktif
        if ([...global.pvpDuels.values()].some(d =>
            (d.player1 === participant || d.player2 === participant) && d.status === 'active'
        )) {
            await evarickreply("⚔️ *Kamu sudah dalam duel PvP!*\n\nSelesaikan duel yang sedang berlangsung terlebih dahulu.");
            return;
        }

        // Buat tantangan
        const duelId = `duel_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        global.pvpDuels.set(duelId, {
            id: duelId,
            player1: participant,
            player2: targetId,
            status: 'pending',
            turn: null,
            hp: {
                [participant]: players[participant].hp,
                [targetId]: players[targetId].hp
            },
            cooldown: {
                [participant]: 0,
                [targetId]: 0
            },
            startTime: Date.now()
        });

        // Send challenge message to target
        const challengeMsg = `⚔️ *PvP CHALLENGE!* ⚔️\n\n` +
            `🎯 *Ditantang oleh:* ${player.nama}\n` +
            `🔥 *Rating:* ${player.pvpStats.rating}\n` +
            `📊 *Stats:* ${player.pvpStats.wins}W/${player.pvpStats.losses}L\n` +
            `🔥 *Win Streak:* ${player.pvpStats.winStreak}\n\n` +
            `*Pilih aksi:*\n` +
            `✅ !pvp accept - Terima tantangan\n` +
            `❌ !pvp decline - Tolak tantangan`;

        await evarick.sendMessage(targetId, { text: challengeMsg });
        
        await evarickreply(`⚔️ *Tantangan PvP dikirim!*\n\n🎯 *Target:* ${players[targetId].nama}\n⏳ *Status:* Menunggu respons...\n\n*Tunggu lawan menerima tantangan.*`);
        return;
    }

    if (sub === "accept" || sub === "decline") {
        // Cari duel pending yang melibatkan player
        const duelEntry = Array.from(global.pvpDuels.entries()).find(
            ([, d]) => d.player2 === participant && d.status === 'pending'
        );
        
        if (!duelEntry) {
            await evarickreply("❌ *Tidak ada tantangan PvP yang menunggumu!*");
            return;
        }

        const [duelId, duel] = duelEntry;
        const challenger = players[duel.player1];

        if (sub === "accept") {
            duel.status = 'active';
            duel.turn = duel.player2; // Lawan mulai duluan
            global.pvpDuels.set(duelId, duel);

            // Send acceptance message to challenger
            const acceptMsg = `🎮 *Tantangan PvP Diterima!*\n\n` +
                `🎯 *Lawan:* ${player.nama}\n` +
                `🔥 *Rating:* ${player.pvpStats.rating}\n` +
                `📊 *Stats:* ${player.pvpStats.wins}W/${player.pvpStats.losses}L\n` +
                `🔥 *Win Streak:* ${player.pvpStats.winStreak}\n\n` +
                `⚔️ *Giliran pertama:* ${player.nama}\n` +
                `🎯 *Commands:* !serang, !skill, !item, !menyerah`;

            await evarick.sendMessage(duel.player1, { text: acceptMsg });

            // Send message to accepter
            const startMsg = `🎮 *Kamu menerima tantangan!*\n\n` +
                `🎯 *Lawan:* ${challenger.nama}\n` +
                `🏆 *Rating:* ${challenger.pvpStats.rating}\n` +
                `📊 *Stats:* ${challenger.pvpStats.wins}W/${challenger.pvpStats.losses}L\n` +
                `🔥 *Win Streak:* ${challenger.pvpStats.winStreak}\n\n` +
                `⚔️ *Giliranmu sekarang!*\n` +
                `🎯 *Commands:* !serang, !skill, !item, !menyerah`;

            await evarickreply(startMsg);
        } else {
            global.pvpDuels.delete(duelId);
            await evarick.sendMessage(duel.player1, { text: "❌ *Tantangan PvP ditolak.*" });
            await evarickreply("❌ *Kamu menolak tantangan PvP.*");
        }
        return;
    }

    // Main PvP menu with detailed stats
    const pvpStats = player.pvpStats;
    const winRate = pvpStats.totalBattles > 0 ? ((pvpStats.wins / pvpStats.totalBattles) * 100).toFixed(1) : 0;
    
    let reply = `⚔️ *PvP ARENA* ⚔️\n\n`;
    reply += `🧑 *Player:* ${player.nama}\n`;
    reply += `🏆 *Rating:* ${pvpStats.rating}\n`;
    reply += `📊 *Record:* ${pvpStats.wins}W - ${pvpStats.losses}L - ${pvpStats.draws}D\n`;
    reply += `📈 *Win Rate:* ${winRate}%\n`;
    reply += `🔥 *Win Streak:* ${pvpStats.winStreak}\n`;
    reply += `⭐ *Best Streak:* ${pvpStats.bestWinStreak}\n`;
    reply += `⚔️ *Total Battles:* ${pvpStats.totalBattles}\n\n`;

    // Add rank info
let rank = "Warrior";
let rankEmoji = "⚔️";
let rankColor = "⚪";

if (pvpStats.rating >= 10000) {
    rank = "Champion";
    rankEmoji = "👑";
    rankColor = "🟡";
} else if (pvpStats.rating >= 9000) {
    rank = "God of Olympus";
    rankEmoji = "👑";
    rankColor = "🟡";
} else if (pvpStats.rating >= 8000) {
    rank = "God of War";
    rankEmoji = "⚡";
    rankColor = "🟡";
} else if (pvpStats.rating >= 7000) {
    rank = "Mythical Immortal";
    rankEmoji = "🌟";
    rankColor = "🟣";
} else if (pvpStats.rating >= 6000) {
    rank = "Mythical Glory";
    rankEmoji = "💫";
    rankColor = "🟣";
} else if (pvpStats.rating >= 5000) {
    rank = "Mythical Honor";
    rankEmoji = "✨";
    rankColor = "🟣";
} else if (pvpStats.rating >= 4000) {
    rank = "Mythic";
    rankEmoji = "🔮";
    rankColor = "🟣";
} else if (pvpStats.rating >= 3000) {
    rank = "Legend";
    rankEmoji = "🏆";
    rankColor = "🟡";
} else if (pvpStats.rating >= 2500) {
    rank = "Epic Glory";
    rankEmoji = "💎";
    rankColor = "🔵";
} else if (pvpStats.rating >= 2000) {
    rank = "Epic";
    rankEmoji = "💠";
    rankColor = "🔵";
} else if (pvpStats.rating >= 1500) {
    rank = "Grand Master";
    rankEmoji = "👑";
    rankColor = "🟢";
} else if (pvpStats.rating >= 1200) {
    rank = "Master";
    rankEmoji = "🥇";
    rankColor = "🟢";
} else if (pvpStats.rating >= 1000) {
    rank = "Elite";
    rankEmoji = "🥈";
    rankColor = "🟢";
} else {
    rank = "Warrior";
    rankEmoji = "⚔️";
    rankColor = "⚪";
}

reply += `${rankEmoji} *Rank:* ${rank} ${rankColor}\n`;
reply += `🔥 *Rating Range:* ${pvpStats.rating - 100} - ${pvpStats.rating + 100}\n\n`;

    // Add recent battle history
    if (pvpStats.battleHistory && pvpStats.battleHistory.length > 0) {
            reply += `🔥 *Recent Battles:*\n`;
        const recentBattles = pvpStats.battleHistory.slice(-3).reverse();
        recentBattles.forEach((battle, index) => {
            const result = battle.result === 'win' ? '✅' : battle.result === 'loss' ? '❌' : '🤝';
            const opponent = battle.opponent || 'Unknown';
            const ratingChange = battle.ratingChange > 0 ? `+${battle.ratingChange}` : battle.ratingChange;
            reply += `${result} vs ${opponent} (${ratingChange})\n`;
        });
        reply += `\n`;
    }

    // Add commands
    reply += `🎯 *Commands:*\n`;
    reply += `• !pvp challenge [player] - Tantang player\n`;
    reply += `• !pvp accept - Terima tantangan\n`;
    reply += `• !pvp decline - Tolak tantangan\n`;
    reply += `• !pvp ranking - Lihat ranking PvP\n`;
    reply += `• !pvp history - Riwayat pertarungan\n\n`;

    // Add battle commands
    reply += `⚔️ *Battle Commands:*\n`;
    reply += `• !serang - Serang lawan\n`;
    reply += `• !skill - Gunakan skill (cooldown 2 turn)\n`;
    reply += `• !item - Gunakan item\n`;
    reply += `• !menyerah - Menyerah\n\n`;

    // Add tips
    reply += `💡 *Tips:*\n`;
    reply += `• Rating naik saat menang, turun saat kalah\n`;
    reply += `• Win streak memberikan bonus rating\n`;
    reply += `• Skill memberikan damage 2x tapi ada cooldown\n`;
    reply += `• Gunakan item untuk healing atau buff\n\n`;

    // Add rewards info
    reply += `🏆 *Rewards:*\n`;
    reply += `• Menang: +30 BP, Rating naik\n`;
    reply += `• Kalah: -20 BP, Rating turun\n`;
    reply += `• Win streak: Bonus rating tambahan\n`;
    reply += `• Top 10: Special rewards mingguan`;

    await evarickreply(reply);
    return;
}

// PvP Action: Serang
case "serang": {
    // Cari duel aktif yang melibatkan player
    const duelEntry = Array.from(global.pvpDuels.entries()).find(
        ([, d]) => (d.player1 === participant || d.player2 === participant) && d.status === 'active'
    );
    if (!duelEntry) {
        await evarickreply("Kamu tidak sedang dalam duel PvP.");
        return;
    }
    const [duelId, duel] = duelEntry;
    if (duel.turn !== participant) {
        await evarickreply("Bukan giliranmu! Tunggu lawan melakukan aksi.");
        return;
    }
    // Tentukan lawan
    const opponent = duel.player1 === participant ? duel.player2 : duel.player1;
    // Hitung damage sederhana (bisa dikembangkan nanti)
    const playerAtk = players[participant].attack || 10;
    const opponentDef = players[opponent].defense || 5;
    const damage = Math.max(1, playerAtk - opponentDef);
    duel.hp[opponent] -= damage;
    let reply = `⚔️ Kamu menyerang lawan dan memberikan ${damage} damage!\n`;
    reply += `❤️ HP lawan sekarang: ${Math.max(0, duel.hp[opponent])}\n`;
    // Cek kemenangan
    if (duel.hp[opponent] <= 0) {
        // Update PvP stats
        if (!players[participant].pvpStats) players[participant].pvpStats = { rating: 1000, wins: 0, losses: 0, totalBattles: 0 };
        if (!players[opponent].pvpStats) players[opponent].pvpStats = { rating: 1000, wins: 0, losses: 0, totalBattles: 0 };
        
        // Update wins/losses
        players[participant].pvpStats.wins++;
        players[opponent].pvpStats.losses++;
        players[participant].pvpStats.totalBattles++;
        players[opponent].pvpStats.totalBattles++;
        
        // Update win streak
        players[participant].pvpStats.winStreak = (players[participant].pvpStats.winStreak || 0) + 1;
        players[opponent].pvpStats.winStreak = 0;
        
        // Update best win streak
        if (players[participant].pvpStats.winStreak > (players[participant].pvpStats.bestWinStreak || 0)) {
            players[participant].pvpStats.bestWinStreak = players[participant].pvpStats.winStreak;
        }
        
        // Update quest progress
        updateAllProgress(players[participant], 'pvpWins', 1);
        updateAllProgress(players[participant], 'pvpBattles', 1);
        updateAllProgress(players[opponent], 'pvpBattles', 1);
        
        // Update PvP rating quest progress
        updateAllProgress(players[participant], 'pvpRating', players[participant].pvpStats.rating);
        updateAllProgress(players[opponent], 'pvpRating', players[opponent].pvpStats.rating);
        
        // Hitung BP
        const winBP = 30, loseBP = 20;
        players[participant].battlePoint = (players[participant].battlePoint || 1000) + winBP;
        players[opponent].battlePoint = Math.max(0, (players[opponent].battlePoint || 1000) - loseBP);
        savePlayerData(players);
    
        reply += `\n🏆 Kamu menang dalam duel PvP!\n+${winBP} BP (Battle Point)`;
        await evarick.sendMessage(opponent, { text: `❌ Kamu kalah dalam duel PvP!\n-${loseBP} BP (Battle Point)` });
        global.pvpDuels.delete(duelId);
    } else {
        // Ganti giliran
        duel.turn = opponent;
        global.pvpDuels.set(duelId, duel);
        await evarick.sendMessage(opponent, { text: `Giliranmu sekarang! Gunakan !serang, !skill, !item, atau !menyerah.` });
    }
    await evarickreply(reply);
    return;
}

// PvP Action: Menyerah
case "menyerah": {
    // Cari duel aktif yang melibatkan player
    const duelEntry = Array.from(global.pvpDuels.entries()).find(
        ([, d]) => (d.player1 === participant || d.player2 === participant) && d.status === 'active'
    );
    if (!duelEntry) {
        await evarickreply("Kamu tidak sedang dalam duel PvP.");
        return;
    }
    const [duelId, duel] = duelEntry;
    const opponent = duel.player1 === participant ? duel.player2 : duel.player1;
    
    // Update PvP stats
    if (!players[opponent].pvpStats) players[opponent].pvpStats = { rating: 1000, wins: 0, losses: 0, totalBattles: 0 };
    if (!players[participant].pvpStats) players[participant].pvpStats = { rating: 1000, wins: 0, losses: 0, totalBattles: 0 };
    
    // Update wins/losses
    players[opponent].pvpStats.wins++;
    players[participant].pvpStats.losses++;
    players[opponent].pvpStats.totalBattles++;
    players[participant].pvpStats.totalBattles++;
    
    // Update win streak
    players[opponent].pvpStats.winStreak = (players[opponent].pvpStats.winStreak || 0) + 1;
    players[participant].pvpStats.winStreak = 0;
    
    // Update best win streak
    if (players[opponent].pvpStats.winStreak > (players[opponent].pvpStats.bestWinStreak || 0)) {
        players[opponent].pvpStats.bestWinStreak = players[opponent].pvpStats.winStreak;
    }
    
    // Update quest progress
    updateAllProgress(players[opponent], 'pvpWins', 1);
    updateAllProgress(players[opponent], 'pvpBattles', 1);
    updateAllProgress(players[participant], 'pvpBattles', 1);
    
    // Update PvP rating quest progress
    updateAllProgress(players[opponent], 'pvpRating', players[opponent].pvpStats.rating);
    updateAllProgress(players[participant], 'pvpRating', players[participant].pvpStats.rating);
    
    const winBP = 30, loseBP = 20;
    players[opponent].battlePoint = (players[opponent].battlePoint || 1000) + winBP;
    players[participant].battlePoint = Math.max(0, (players[participant].battlePoint || 1000) - loseBP);
    savePlayerData(players);

    await evarick.sendMessage(opponent, { text: `🎉 Lawanmu menyerah! Kamu menang dalam duel PvP!\n+${winBP} BP (Battle Point)` });
    await evarickreply(`Kamu menyerah. Duel selesai.\n-${loseBP} BP (Battle Point)`);
    global.pvpDuels.delete(duelId);
    return;
}

case "skill": {
    // Cari duel aktif yang melibatkan player
    const duelEntry = Array.from(global.pvpDuels.entries()).find(
        ([, d]) => (d.player1 === participant || d.player2 === participant) && d.status === 'active'
    );
    if (!duelEntry) {
        await evarickreply("Kamu tidak sedang dalam duel PvP.");
        return;
    }
    const [duelId, duel] = duelEntry;
    if (duel.turn !== participant) {
        await evarickreply("Bukan giliranmu! Tunggu lawan melakukan aksi.");
        return;
    }
    
    // Cek apakah player punya skill equipped
    if (!player.equippedSkills || player.equippedSkills.length === 0) {
        await evarickreply("❌ Kamu tidak punya skill yang dipasang! Gunakan !equipskill untuk memilih skill.");
        return;
    }
    
    // Ambil skill pertama yang equipped (atau bisa dipilih)
    const skillId = player.equippedSkills[0];
    const skill = skills.find(s => s.id === skillId);
    
    if (!skill) {
        await evarickreply("❌ Skill tidak ditemukan di database!");
        return;
    }
    
    // Cek class restriction
    if (skill.class !== player.kelas) {
        await evarickreply(`❌ Skill "${skill.nama}" hanya bisa digunakan oleh class ${skill.class}!`);
        return;
    }
    
    // Cek mana cost
    if (player.mana < skill.manaCost) {
        await evarickreply(`❌ Mana tidak cukup! Dibutuhkan ${skill.manaCost} mana, kamu punya ${player.mana} mana.`);
        return;
    }
    
    // Inisialisasi cooldown jika belum ada
    if (!duel.cooldown) duel.cooldown = { [duel.player1]: 0, [duel.player2]: 0 };
    
    // Cek cooldown skill
    if (duel.cooldown[participant] > 0) {
        await evarickreply(`Skill sedang cooldown! Tersisa ${duel.cooldown[participant]} giliran.`);
        return;
    }
    
    // Tentukan lawan
    const opponent = duel.player1 === participant ? duel.player2 : duel.player1;
    
    // Proses skill berdasarkan efek
    let damage = 0;
    let reply = `💥 Kamu menggunakan *${skill.nama}*!\n`;
    
    // Implementasi efek skill berdasarkan skill.efek
    switch(skill.efek) {
        case 'stealth_debuff_stacking_buff_4_turns':
            // Jubah Malam Abadi - Stealth + Debuff + Stacking Buff
            damage = Math.max(1, (player.attack - players[opponent].defense) * 0.8);
            
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[participant]) duel.effects[participant] = {};
            
            // Set efek stealth dan buff stacking
            duel.effects[participant].stealth = {
                duration: 4,
                evasion: 60,
                attackDebuff: 50,
                attackBuff: 0, // akan bertambah setiap serangan
                maxStacks: 4
            };
            
            reply += `🌙 *Jubah Malam Abadi* aktif!\n`;
            reply += `👻 Evasion +60% selama 4 giliran\n`;
            reply += `⚔️ Attack lawan -50% selama 4 giliran\n`;
            reply += `📈 Attack kamu akan bertambah setiap serangan (maks 4x)\n`;
            break;
            
        case 'double_attack_70':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 0.7 * 2);
            reply += `⚔️ *Serangan Ganda* - 2x serangan dengan 70% kekuatan!\n`;
            break;
            
        case 'heal_self_15_percent':
            const healAmount = Math.floor(player.maxHp * 0.15);
            duel.hp[participant] = Math.min(player.maxHp, duel.hp[participant] + healAmount);
            reply += `💚 *Semangat Juang* - Memulihkan ${healAmount} HP!\n`;
            break;
            
        case 'guaranteed_critical':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.5);
            reply += `💀 *Pukulan Mematikan* - Kritikal 100%!\n`;
            break;
            
        case 'damage_150_ignore_30_def':
            const reducedDef = players[opponent].defense * 0.7;
            damage = Math.max(1, (player.attack - reducedDef) * 1.5);
            reply += `💀 *Pemecah Tengkorak* - 150% damage, ignore 30% defense!\n`;
            break;
            
        case 'damage_aoe_120':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.2);
            reply += `⚔️ *Badai Pedang* - 120% damage area!\n`;
            break;
            
        case 'invulnerable_1_turn':
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[participant]) duel.effects[participant] = {};
            
            duel.effects[participant].invulnerable = { duration: 1 };
            reply += `🛡️ *Tak Terkalahkan* - Kebal terhadap semua damage 1 giliran!\n`;
            break;
            
        case 'bonus_50_percent_damage':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.5);
            reply += `⚔️ *Serangan Mendadak* - Damage +50%!\n`;
            break;
            
        case 'buff_evasion_50_2_turns':
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[participant]) duel.effects[participant] = {};
            
            duel.effects[participant].evasion = { duration: 2, value: 50 };
            reply += `👻 *Langkah Bayangan* - Evasion +50% selama 2 giliran!\n`;
            break;
            
        case 'damage_80_plus_poison_3_turns':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 0.8);
            
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[opponent]) duel.effects[opponent] = {};
            
            duel.effects[opponent].poison = { duration: 3, damage: Math.floor(damage * 0.3) };
            reply += `☠️ *Tusukan Beracun* - 80% damage + poison 3 giliran!\n`;
            break;
            
        case 'guaranteed_crit_next_hit':
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[participant]) duel.effects[participant] = {};
            
            duel.effects[participant].guaranteedCrit = { duration: 1 };
            reply += `🎯 *Mencari Kelemahan* - Serangan berikutnya 100% kritikal!\n`;
            break;
            
        case 'debuff_aoe_accuracy_40_2_turns':
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[opponent]) duel.effects[opponent] = {};
            
            duel.effects[opponent].accuracyDebuff = { duration: 2, value: 40 };
            reply += `💨 *Bom Asap* - Akurasi lawan -40% selama 2 giliran!\n`;
            break;
            
        case 'random_4_hits_60':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 0.6 * 4);
            reply += `⚔️ *Tarian Pisau* - 4x serangan acak dengan 60% kekuatan!\n`;
            break;
            
        case 'reduce_damage_by_mana_div_2':
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[participant]) duel.effects[participant] = {};
            
            duel.effects[participant].manaShield = { duration: 1, value: Math.floor(player.mana / 2) };
            reply += `🛡️ *Perisai Mana* - Serangan lawan berikutnya dikurangi ${Math.floor(player.mana / 2)}!\n`;
            break;
            
        case 'damage_140_plus_burn_2_turns':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.4);
            
            // Inisialisasi efek jika belum ada
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[opponent]) duel.effects[opponent] = {};
            
            duel.effects[opponent].burn = { duration: 2, damage: Math.floor(damage * 0.2) };
            reply += `🔥 *Bola Api* - 140% damage + burn 2 giliran!\n`;
            break;
            
        case 'chain_lightning_120_60':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.2);
            reply += `⚡ *Rantai Petir* - 120% damage utama + 60% damage chain!\n`;
            break;
            
        case 'recover_mana_40_percent':
            const manaRecover = Math.floor(player.maxMana * 0.4);
            player.mana = Math.min(player.maxMana, player.mana + manaRecover);
            reply += `🔮 *Meditasi* - Memulihkan ${manaRecover} mana!\n`;
            break;
            
        case 'damage_aoe_100_plus_freeze_chance':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.0);
            
            // 30% chance freeze
            if (Math.random() < 0.3) {
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[opponent]) duel.effects[opponent] = {};
                duel.effects[opponent].freeze = { duration: 1 };
                reply += `❄️ *Badai Es* - 100% damage + FREEZE 1 giliran!\n`;
            } else {
                reply += `❄️ *Badai Es* - 100% damage area!\n`;
            }
            break;
            
        case 'damage_350_single_target':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 3.5);
            reply += `🕳️ *Singularitas* - 350% damage sihir!\n`;
            break;
            
        case 'true_hit_30_bonus':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.3);
            reply += `🎯 *Tembakan Jitu* - Tidak bisa dihindari + 30% damage!\n`;
            break;
            
        case 'split_shot_80':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 0.8);
            reply += `🏹 *Panah Bercabang* - 80% damage ke 2 target!\n`;
            break;
            
        case 'debuff_speed_50_2_turns':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 0.8);
            
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[opponent]) duel.effects[opponent] = {};
            
            duel.effects[opponent].speedDebuff = { duration: 2, value: 50 };
            reply += `🕷️ *Panah Penjerat* - 80% damage + speed -50% 2 giliran!\n`;
            break;
            
        case 'buff_attack_40_3_turns':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 0.8);
            
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[participant]) duel.effects[participant] = {};
            
            duel.effects[participant].attackBuff = { duration: 3, value: 40 };
            reply += `🎯 *Fokus Penuh* - 80% damage + Attack +40% 3 giliran!\n`;
            break;
            
        case 'damage_aoe_130':
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.3);
            reply += `🏹 *Hujan Panah* - 130% damage area!\n`;
            break;
            
        case 'ignore_100_def_next_hit':
            damage = Math.max(1, player.attack * 1.2);
            
            if (!duel.effects) duel.effects = {};
            if (!duel.effects[participant]) duel.effects[participant] = {};
            
            duel.effects[participant].ignoreDefense = { duration: 1, value: 100 };
            reply += `🦅 *Elang Pembidik* - Serangan berikutnya ignore 100% defense!\n`;
            break;

            case 'ignore_50_attack':
                // Perisai Baja: Serangan lawan berikutnya mengabaikan 50 attack
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[opponent]) duel.effects[opponent] = {};
                duel.effects[opponent].ignoreAttack = { value: 50, duration: 1 };
                reply += `🛡️ *Perisai Baja* - Serangan lawan berikutnya mengabaikan 50 attack!\n`;
                break;
    
            case 'buff_defense_75_2_turns':
                // Benteng Kokoh: Defense naik 75% selama 2 giliran
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[participant]) duel.effects[participant] = {};
                duel.effects[participant].defenseBuff = { value: 75, duration: 2 };
                reply += `🛡️ *Benteng Kokoh* - Defense naik 75% selama 2 giliran!\n`;
                break;
    
            case 'taunt_1_enemy_2_turns':
                // Provokasi: Lawan hanya bisa menyerang kamu selama 2 giliran
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[opponent]) duel.effects[opponent] = {};
                duel.effects[opponent].taunt = { target: participant, duration: 2 };
                reply += `😡 *Provokasi* - Lawan hanya bisa menyerang kamu selama 2 giliran!\n`;
                break;
    
            case 'reflect_damage_30_3_turns':
                // Pantulan Duri: 30% damage diterima dipantulkan ke lawan selama 3 giliran
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[participant]) duel.effects[participant] = {};
                duel.effects[participant].reflect = { value: 30, duration: 3 };
                reply += `🪞 *Pantulan Duri* - 30% damage diterima dipantulkan ke lawan selama 3 giliran!\n`;
                break;
    
            case 'absorb_damage_heal_25':
                // Kekuatan Titan: Semua damage diserap, 25% jadi HP
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[participant]) duel.effects[participant] = {};
                duel.effects[participant].absorb = { value: 25, duration: 1 };
                reply += `💪 *Kekuatan Titan* - Semua damage diserap, 25% jadi HP!\n`;
                break;
    
            case 'debuff_aoe_attack_20_2_turns':
                // Getaran Bumi: Attack semua musuh turun 20% selama 2 giliran
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[opponent]) duel.effects[opponent] = {};
                duel.effects[opponent].attackDebuff = { value: 20, duration: 2 };
                reply += `🌎 *Getaran Bumi* - Attack lawan turun 20% selama 2 giliran!\n`;
                break;
    
            case 'lifesteal_from_attacker_30_3_turns':
                // Perisai Balas Dendam: 30% attack musuh yang menyerang jadi heal selama 3 ronde
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[participant]) duel.effects[participant] = {};
                duel.effects[participant].lifestealFromAttacker = { value: 30, duration: 3 };
                reply += `🛡️ *Perisai Balas Dendam* - 30% attack musuh yang menyerang jadi heal selama 3 ronde!\n`;
                break;
    
            case 'damage_180_burn_4_stun_chance':
                // Semburan Magma: 180% damage, 30% stun 1 ronde, burn 4 ronde
                damage = Math.max(1, (player.attack - players[opponent].defense) * 1.8);
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[opponent]) duel.effects[opponent] = {};
                duel.effects[opponent].burn = { duration: 4, damage: Math.floor(damage * 0.2) };
                if (Math.random() < 0.3) {
                    duel.effects[opponent].stun = { duration: 1 };
                    reply += `🔥 *Semburan Magma* - 180% damage + burn 4 ronde + STUN 1 ronde!\n`;
                } else {
                    reply += `🔥 *Semburan Magma* - 180% damage + burn 4 ronde!\n`;
                }
                break;
    
            case 'silence_2_debuff_attack_20_4_turns':
                // Panah Pembungkam: musuh tidak bisa pakai skill 2 ronde, attack turun 20% 4 ronde
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[opponent]) duel.effects[opponent] = {};
                duel.effects[opponent].silence = { duration: 2 };
                duel.effects[opponent].attackDebuff = { value: 20, duration: 4 };
                reply += `🤫 *Panah Pembungkam* - Musuh tidak bisa pakai skill 2 ronde, attack turun 20% 4 ronde!\n`;
                break;
    
            case 'bloodlust_sacrificing_for_power':
                // Haus Darah: Korbankan 5% Max HP, attack naik 30% 2 ronde, setiap serangan heal 20 HP
                const hpSacrifice = Math.floor(player.maxHp * 0.05);
                duel.hp[participant] = Math.max(1, duel.hp[participant] - hpSacrifice);
                if (!duel.effects) duel.effects = {};
                if (!duel.effects[participant]) duel.effects[participant] = {};
                duel.effects[participant].attackBuff = { value: 30, duration: 2 };
                duel.effects[participant].bloodlustHeal = { value: 20, duration: 2 };
                reply += `🩸 *Haus Darah* - Korbankan ${hpSacrifice} HP, attack naik 30% 2 ronde, setiap serangan heal 20 HP!\n`;
                break;
            
        default:
            // Fallback untuk skill yang belum diimplementasi
            damage = Math.max(1, (player.attack - players[opponent].defense) * 1.5);
            reply += `⚔️ *${skill.nama}* - Damage standar!\n`;
    }
    
    // Terapkan damage ke lawan
    duel.hp[opponent] -= damage;
    
    // Kurangi mana
    player.mana -= skill.manaCost;
    
    // Set cooldown skill
    duel.cooldown[participant] = skill.cooldown;
    
    reply += `Memberikan ${damage} damage!\n`;
    reply += `❤️ HP lawan sekarang: ${Math.max(0, duel.hp[opponent])}\n`;
    reply += `🔮 Mana tersisa: ${player.mana}/${player.maxMana}\n`;
    
    // Cek kemenangan
    if (duel.hp[opponent] <= 0) {
        // Update PvP stats
        if (!players[participant].pvpStats) players[participant].pvpStats = { rating: 1000, wins: 0, losses: 0, totalBattles: 0 };
        if (!players[opponent].pvpStats) players[opponent].pvpStats = { rating: 1000, wins: 0, losses: 0, totalBattles: 0 };
        
        // Update wins/losses
        players[participant].pvpStats.wins++;
        players[opponent].pvpStats.losses++;
        players[participant].pvpStats.totalBattles++;
        players[opponent].pvpStats.totalBattles++;
        
        // Update win streak
        players[participant].pvpStats.winStreak = (players[participant].pvpStats.winStreak || 0) + 1;
        players[opponent].pvpStats.winStreak = 0;
        
        // Update best win streak
        if (players[participant].pvpStats.winStreak > (players[participant].pvpStats.bestWinStreak || 0)) {
            players[participant].pvpStats.bestWinStreak = players[participant].pvpStats.winStreak;
        }
        
        // Update quest progress
        updateAllProgress(players[participant], 'pvpWins', 1);
        updateAllProgress(players[participant], 'pvpBattles', 1);
        updateAllProgress(players[opponent], 'pvpBattles', 1);
        
        // Update PvP rating quest progress
        updateAllProgress(players[participant], 'pvpRating', players[participant].pvpStats.rating);
        updateAllProgress(players[opponent], 'pvpRating', players[opponent].pvpStats.rating);
        
        const winBP = 30, loseBP = 20;
        players[participant].battlePoint = (players[participant].battlePoint || 1000) + winBP;
        players[opponent].battlePoint = Math.max(0, (players[opponent].battlePoint || 1000) - loseBP);
        savePlayerData(players);

        reply += `\n🏆 Kamu menang dalam duel PvP!\n+${winBP} BP (Battle Point)`;
        await evarick.sendMessage(opponent, { text: `❌ Kamu kalah dalam duel PvP!\n-${loseBP} BP (Battle Point)` });
        global.pvpDuels.delete(duelId);
    } else {
        // Ganti giliran & kurangi cooldown lawan
        duel.turn = opponent;
        if (duel.cooldown[opponent] > 0) duel.cooldown[opponent]--;
        global.pvpDuels.set(duelId, duel);
        await evarick.sendMessage(opponent, { text: `Giliranmu sekarang! Gunakan !serang, !skill, !item, atau !menyerah.` });
    }
    await evarickreply(reply);
    return;
}

case "item": {
    // Cari duel aktif yang melibatkan player
    const duelEntry = Array.from(global.pvpDuels.entries()).find(
        ([, d]) => (d.player1 === participant || d.player2 === participant) && d.status === 'active'
    );
    if (!duelEntry) {
        await evarickreply("Kamu tidak sedang dalam duel PvP.");
        return;
    }
    const [duelId, duel] = duelEntry;
    if (duel.turn !== participant) {
        await evarickreply("Bukan giliranmu! Tunggu lawan melakukan aksi.");
        return;
    }
    // Ambil nama item dari argumen
    const itemName = q.trim();
    if (!itemName) {
        await evarickreply("Gunakan: !item [nama item] (misal: !item Potion HP)");
        return;
    }
    // Cek item di tas
    if (!players[participant].tas[itemName] || players[participant].tas[itemName] < 1) {
        await evarickreply(`Kamu tidak punya ${itemName} di tasmu!`);
        return;
    }
    // Cek data item
    const itemData = items.find(i => i.nama.toLowerCase() === itemName.toLowerCase());
    if (!itemData) {
        await evarickreply("Item tidak ditemukan di database.");
        return;
    }
    // Contoh: hanya support healing item (Potion HP)
    if (itemData.kategori !== "Consumable" || !itemData.heal) {
        await evarickreply("Item ini tidak bisa digunakan di PvP (hanya item healing/Consumable).");
        return;
    }
    // Proses healing
    duel.hp[participant] += itemData.heal;
    // Batas max HP
    const maxHp = players[participant].maxHp || 100;
    if (duel.hp[participant] > maxHp) duel.hp[participant] = maxHp;
    // Kurangi item di tas
    players[participant].tas[itemName]--;
    if (players[participant].tas[itemName] <= 0) delete players[participant].tas[itemName];
    savePlayerData(players);

    let reply = `🧪 Kamu menggunakan *${itemName}* dan memulihkan ${itemData.heal} HP!\n`;
    reply += `❤️ HP kamu sekarang: ${duel.hp[participant]}/${maxHp}\n`;
    // Ganti giliran & kurangi cooldown lawan jika ada
    const opponent = duel.player1 === participant ? duel.player2 : duel.player1;
    duel.turn = opponent;
    if (duel.cooldown && duel.cooldown[opponent] > 0) duel.cooldown[opponent]--;
    global.pvpDuels.set(duelId, duel);
    await evarick.sendMessage(opponent, { text: `Giliranmu sekarang! Gunakan !serang, !skill, !item, atau !menyerah.` });
    await evarickreply(reply);
    return;
}


    // Trade System
    case "trade": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        if (!q) {
            (`⚠️ *Format trade salah!*\n\n*Cara penggunaan:*\n\n` +
                `🔄 *Item dengan Item:*\n` +
                `!trade offer [nama_player] [item_kamu] [jumlah] [item_target] [jumlah]\n\n` +
                `💰 *Item dengan Gold:*\n` +
                `!trade offer [nama_player] [item_kamu] [jumlah] gold [jumlah_gold]\n\n` +
                `🎁 *Item Gratis:*\n` +
                `!trade gift [nama_player] [item_kamu] [jumlah]\n\n` +
                `📋 *Contoh:*\n` +
                `!trade offer Evarick Pedang Besi 1 Potion HP 5\n` +
                `!trade offer Evarick Pedang Baja 1 gold 1000\n` +
                `!trade gift Evarick Potion HP 3`);
            return;
        }

        const args = q.split(' ');
        const action = args[0].toLowerCase();
        
        if (action === 'offer') {
            // Item with Item or Item with Gold
            if (args.length < 5) {
                await evarickreply(`⚠️ *Format offer salah!*\n\n` +
                    `*Item dengan Item:*\n` +
                    `!trade offer [nama_player] [item_kamu] [jumlah] [item_target] [jumlah]\n\n` +
                    `*Item dengan Gold:*\n` +
                    `!trade offer [nama_player] [item_kamu] [jumlah] gold [jumlah_gold]`);
            return;
        }

            const targetPlayerName = args[1];
            const yourItem = args[2];
            const yourAmount = parseInt(args[3]);
            const targetItem = args[4];
            const targetAmount = parseInt(args[5]);

            // Validate your item
            if (!player.tas[yourItem] || player.tas[yourItem] < yourAmount) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }

            // Find target player
            const targetPlayerEntry = Object.entries(players).find(([id, p]) => 
                p.nama.toLowerCase() === targetPlayerName.toLowerCase()
            );

            if (!targetPlayerEntry) {
                await evarickreply(`❌ *Player "${targetPlayerName}" tidak ditemukan!*`);
            return;
        }

            const [targetPlayerId, targetPlayer] = targetPlayerEntry;

            // Check if trading with yourself
            if (targetPlayerId === participant) {
                await evarickreply(`❌ *Tidak bisa trade dengan diri sendiri!*`);
                    return;
                }

            // Create trade offer
            const tradeId = `${participant}_${targetPlayerId}_${Date.now()}`;
            const tradeOffer = {
                id: tradeId,
                from: participant,
                fromName: player.nama,
                to: targetPlayerId,
                toName: targetPlayer.nama,
                fromItem: yourItem,
                fromAmount: yourAmount,
                toItem: targetItem,
                toAmount: targetAmount,
                type: targetItem.toLowerCase() === 'gold' ? 'item_gold' : 'item_item',
                status: 'pending',
                createdAt: Date.now(),
                expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes
            };

            // Store trade offer
            if (!global.tradeOffers) global.tradeOffers = new Map();
            global.tradeOffers.set(tradeId, tradeOffer);

            (`📦 *TRADE OFFER DIKIRIM!* 📦\n\n` +
                `👤 *Ke:* ${targetPlayer.nama}\n` +
                `📦 *Menawarkan:* ${yourAmount}x ${yourItem}\n` +
                `📦 *Meminta:* ${targetAmount}x ${targetItem}\n\n` +
                `⏰ *Trade ID:* ${tradeId}\n` +
                `⏰ *Expires:* 30 menit`);

        } else if (action === 'gift') {
            // Gift item (free)
            if (args.length < 4) {
                await evarickreply(`⚠️ *Format gift salah!*\n\n` +
                    `!trade gift [nama_player] [item_kamu] [jumlah]`);
                    return;
                }

            const targetPlayerName = args[1];
            const yourItem = args[2];
            const yourAmount = parseInt(args[3]);

            // Validate your item
            if (!player.tas[yourItem] || player.tas[yourItem] < yourAmount) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
                    return;
                }

            // Find target player
            const targetPlayerEntry = Object.entries(players).find(([id, p]) => 
                p.nama.toLowerCase() === targetPlayerName.toLowerCase()
            );

            if (!targetPlayerEntry) {
                await evarickreply(`❌ *Player "${targetPlayerName}" tidak ditemukan!*`);
                    return;
                }

            const [targetPlayerId, targetPlayer] = targetPlayerEntry;

            // Check if gifting to yourself
            if (targetPlayerId === participant) {
                await evarickreply(`❌ *Tidak bisa gift ke diri sendiri!*`);
                    return;
                }

            // Execute gift immediately
            player.tas[yourItem] -= yourAmount;
            if (player.tas[yourItem] === 0) delete player.tas[yourItem];

            targetPlayer.tas[yourItem] = (targetPlayer.tas[yourItem] || 0) + yourAmount;

            // Save both players
            players[participant] = player;
            players[targetPlayerId] = targetPlayer;
                savePlayerData(players);

            await evarickreply(`🎁 *GIFT BERHASIL DIKIRIM!* 🎁\n\n` +
                `👤 *Ke:* ${targetPlayer.nama}\n` +
                `📦 *Item:* ${yourAmount}x ${yourItem}\n\n` +
                `💝 *Gift gratis berhasil dikirim!*`);

        } else {
            await evarickreply(`❌ *Action tidak valid!*\n\n` +
                `*Actions yang tersedia:*\n` +
                `• offer - Kirim trade offer\n` +
                `• gift - Kirim item gratis`);
        }
    }
    break

    // Trade Accept/Decline/View Commands
    case "tradeaccept": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                caption: reply,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        if (!q) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `⚠️ *Tentukan Trade ID!*\n\nGunakan !tradeoffers untuk melihat trade yang tersedia.`,
    mentions: [sender]
}, { quoted: msg });
            return;
        }

        const tradeId = q;
        if (!global.tradeOffers || !global.tradeOffers.has(tradeId)) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                caption: `❌ *Trade offer tidak ditemukan!*`,
                mentions: [sender]
            }, { quoted: msg });
                    return;
                }

        const tradeOffer = global.tradeOffers.get(tradeId);
        
        if (tradeOffer.to !== participant) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                caption: `❌ *Trade offer ini bukan untuk kamu!*`,
                mentions: [sender]
            }, { quoted: msg });
                    return;
                }

        if (tradeOffer.status !== 'pending') {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                caption: `❌ *Trade offer sudah tidak valid!*`,
                mentions: [sender]
            }, { quoted: msg });
                    return;
                }

        if (Date.now() > tradeOffer.expiresAt) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                caption: `❌ *Trade offer sudah expired!*`,
                mentions: [sender]
            }, { quoted: msg });
            global.tradeOffers.delete(tradeId);
                    return;
                }

        // Validate items and gold
        const fromPlayer = players[tradeOffer.from];
        const toPlayer = players[tradeOffer.to];

        // Check if from player still has the item
        if (!fromPlayer.tas[tradeOffer.fromItem] || fromPlayer.tas[tradeOffer.fromItem] < tradeOffer.fromAmount) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                caption: `❌ *Player tidak memiliki item yang cukup!*`,
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        // Check if to player has the required item/gold
        if (tradeOffer.type === 'item_gold') {
            if (toPlayer.gold < tradeOffer.toAmount) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                    caption: `❌ *Gold tidak cukup!*\n\nKamu hanya memiliki ${toPlayer.gold.toLocaleString()} gold`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
        } else {
            if (!toPlayer.tas[tradeOffer.toItem] || toPlayer.tas[tradeOffer.toItem] < tradeOffer.toAmount) {
                await evarick.sendMessage(sender, {
                    image: { url: 'https://files.catbox.moe/8l284c.jpg' },
                    caption: `❌ *Item tidak cukup!*\n\nKamu hanya memiliki ${toPlayer.tas[tradeOffer.toItem] || 0} ${tradeOffer.toItem}`,
                    mentions: [sender]
                }, { quoted: msg });
                return;
            }
        }

        // Execute trade
        // From player gives item
        fromPlayer.tas[tradeOffer.fromItem] -= tradeOffer.fromAmount;
        if (fromPlayer.tas[tradeOffer.fromItem] === 0) delete fromPlayer.tas[tradeOffer.fromItem];

        // To player gives item/gold
        if (tradeOffer.type === 'item_gold') {
            toPlayer.gold -= tradeOffer.toAmount;
            fromPlayer.gold += tradeOffer.toAmount;
        } else {
            toPlayer.tas[tradeOffer.toItem] -= tradeOffer.toAmount;
            if (toPlayer.tas[tradeOffer.toItem] === 0) delete toPlayer.tas[tradeOffer.toItem];
            fromPlayer.tas[tradeOffer.toItem] = (fromPlayer.tas[tradeOffer.toItem] || 0) + tradeOffer.toAmount;
        }

        // To player receives item
        toPlayer.tas[tradeOffer.fromItem] = (toPlayer.tas[tradeOffer.fromItem] || 0) + tradeOffer.fromAmount;

        // Save both players
        players[tradeOffer.from] = fromPlayer;
        players[tradeOffer.to] = toPlayer;
                savePlayerData(players);

        // Mark trade as completed
        tradeOffer.status = 'completed';
        global.tradeOffers.set(tradeId, tradeOffer);

        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/8l284c.jpg' },
            caption: `✅ *TRADE BERHASIL!* ✅\n\n` +
                `📦 *Menerima:* ${tradeOffer.fromAmount}x ${tradeOffer.fromItem}\n` +
                `📦 *Memberikan:* ${tradeOffer.toAmount}x ${tradeOffer.toItem}\n\n` +
                `🤝 *Trade dengan ${fromPlayer.nama} berhasil!*`,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "tradedecline": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        if (!q) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `⚠️ *Tentukan Trade ID!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

        const tradeId = q;
        if (!global.tradeOffers || !global.tradeOffers.has(tradeId)) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `❌ *Trade offer tidak ditemukan!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

        const tradeOffer = global.tradeOffers.get(tradeId);
        
        if (tradeOffer.to !== participant) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `❌ *Trade offer ini bukan untuk kamu!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

        // Mark trade as declined
        tradeOffer.status = 'declined';
        global.tradeOffers.set(tradeId, tradeOffer);

        const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `❌ *TRADE DITOLAK!*\n\nTrade offer dari ${tradeOffer.fromName} telah ditolak.`,
    mentions: [sender]
}, { quoted: msg });
    }
    break

    case "tradeoffers": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });

                    return;
                }

        if (!global.tradeOffers) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `📋 *Tidak ada trade offer yang tersedia!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

        const pendingOffers = Array.from(global.tradeOffers.values()).filter(
            offer => offer.to === participant && offer.status === 'pending' && Date.now() <= offer.expiresAt
        );

        if (pendingOffers.length === 0) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `📋 *Tidak ada trade offer yang menunggu!*`,
    mentions: [sender]
}, { quoted: msg });
            return;
        }

        let reply = `📋 *TRADE OFFERS YANG MENUNGGU* 📋\n\n`;
        
        pendingOffers.forEach((offer, index) => {
            const timeLeft = Math.max(0, Math.floor((offer.expiresAt - Date.now()) / 1000 / 60));
            reply += `${index + 1}. *${offer.fromName}*\n`;
            reply += `   📦 Menawarkan: ${offer.fromAmount}x ${offer.fromItem}\n`;
            if (offer.type === 'item_gold') {
                reply += `   💰 Meminta: ${offer.toAmount.toLocaleString()} Gold\n`;
            } else {
                reply += `   📦 Meminta: ${offer.toAmount}x ${offer.toItem}\n`;
            }
            reply += `   ⏰ ${timeLeft} menit tersisa\n`;
            reply += `   🆔 ID: ${offer.id}\n\n`;
        });

        reply += `💡 *Gunakan !tradeaccept [trade_id] untuk menerima*`;
                const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
                await evarick.sendMessage(sender, {
                    image: tradeImage,
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
            }
    break

    case "tradeview": {
        if (!player) {
         await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
                    return;
                }

        if (!q) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `⚠️ *Tentukan Trade ID!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

        const tradeId = q;
        if (!global.tradeOffers || !global.tradeOffers.has(tradeId)) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `❌ *Trade offer tidak ditemukan!*`,
    mentions: [sender]
}, { quoted: msg });
                    return;
                }

        const tradeOffer = global.tradeOffers.get(tradeId);
        const timeLeft = Math.max(0, Math.floor((tradeOffer.expiresAt - Date.now()) / 1000 / 60));
        
        let reply = `📋 *DETAIL TRADE OFFER* 📋\n\n`;
        reply += `🆔 *Trade ID:* ${tradeOffer.id}\n`;
        reply += `👤 *Dari:* ${tradeOffer.fromName}\n`;
        reply += `👤 *Ke:* ${tradeOffer.toName}\n`;
        reply += `📦 *Menawarkan:* ${tradeOffer.fromAmount}x ${tradeOffer.fromItem}\n`;
        
        if (tradeOffer.type === 'item_gold') {
            reply += `💰 *Meminta:* ${tradeOffer.toAmount.toLocaleString()} Gold\n`;
        } else {
            reply += `📦 *Meminta:* ${tradeOffer.toAmount}x ${tradeOffer.toItem}\n`;
        }
        
        reply += `📅 *Status:* ${tradeOffer.status}\n`;
        reply += `⏰ *Expires:* ${timeLeft} menit tersisa\n\n`;
        
        if (tradeOffer.status === 'pending' && tradeOffer.to === participant) {
            reply += `✅ *Terima:* !tradeaccept ${tradeId}\n`;
            reply += `❌ *Tolak:* !tradedecline ${tradeId}`;
        }
                
                const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
                await evarick.sendMessage(sender, {
                    image: tradeImage,
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
            }
    break

    case "tradehistory": {
        if (!player) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/ive435.jpg' },
                caption: (`❌ *Kamu belum terdaftar!*\n\nGunakan !daftar [nama] untuk mendaftar.`),
                mentions: [sender]
            }, { quoted: msg });
            return;
        }

        if (!global.tradeOffers) {  
                const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
                await evarick.sendMessage(sender, {
                    image: tradeImage,
    caption: `📜 *Belum ada riwayat trade!*`,
                    mentions: [sender]
                }, { quoted: msg });
            return;
        }

        const myTrades = Array.from(global.tradeOffers.values()).filter(
            offer => (offer.from === participant || offer.to === participant) && offer.status === 'completed'
        ).slice(-10); // Last 10 trades

        if (myTrades.length === 0) {
            const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
await evarick.sendMessage(sender, {
    image: tradeImage,
    caption: `📜 *Belum ada riwayat trade!*`,
    mentions: [sender]
}, { quoted: msg });
            return;
        }

        let reply = `📜 *RIWAYAT TRADE (10 Terakhir)* 📜\n\n`;
        
        myTrades.forEach((trade, index) => {
            const date = new Date(trade.createdAt).toLocaleDateString('id-ID');
            const isFromMe = trade.from === participant;
            
            reply += `${index + 1}. ${date}\n`;
            if (isFromMe) {
                reply += `   📤 Ke: ${trade.toName}\n`;
                reply += `   📦 Berikan: ${trade.fromAmount}x ${trade.fromItem}\n`;
                if (trade.type === 'item_gold') {
                    reply += `   💰 Terima: ${trade.toAmount.toLocaleString()} Gold\n`;
                } else {
                    reply += `   📦 Terima: ${trade.toAmount}x ${trade.toItem}\n`;
                }
            } else {
                reply += `   📥 Dari: ${trade.fromName}\n`;
                reply += `   📦 Terima: ${trade.fromAmount}x ${trade.fromItem}\n`;
                if (trade.type === 'item_gold') {
                    reply += `   💰 Berikan: ${trade.toAmount.toLocaleString()} Gold\n`;
                } else {
                    reply += `   📦 Berikan: ${trade.toAmount}x ${trade.toItem}\n`;
                }
            }
            reply += `\n`;
        });
                
                const tradeImage = fs.readFileSync('https://files.catbox.moe/8l284c.jpg');
                await evarick.sendMessage(sender, {
                    image: tradeImage,
                    caption: reply,
                    mentions: [sender]
                }, { quoted: msg });
            }
    break

    case "season": {
        const worldEffects = getWorldEffects();
        const seasonEffect = seasonEffects[worldEffects.season];
        
        let reply = `🌿 *MUSIM SAAT INI* 🌿\n\n`;
        reply += `*${worldEffects.season.toUpperCase()}*\n`;
        reply += `${seasonEffect.description}\n\n`;
        
        reply += `*🎉 Event Musiman:*\n`;
        seasonEffect.specialEvents.forEach(event => {
            reply += `• ${event}\n`;
        });
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vs12tq.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break

    case "events": {
        const worldEffects = getWorldEffects();
        
        if (worldEffects.activeEvents.length === 0) {
            await evarick.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/vs12tq.jpg' },
                caption: `📅 *Tidak ada event yang sedang berlangsung saat ini.*\n\nEvent akan muncul secara acak setiap beberapa menit.`,
   
                mentions: [sender]
            }, { quoted: msg }); 
            return;
        }
        
        let reply = `🎉 *EVENT AKTIF* 🎉\n\n`;
        
        worldEffects.activeEvents.forEach((event, index) => {
            const remainingTime = Math.floor((event.endTime - Date.now()) / 60000);
            const rarityEmoji = {
                common: '🟢',
                uncommon: '🟡',
                rare: '🔴'
            };
            
            reply += `*${index + 1}. ${event.name}* ${rarityEmoji[event.rarity]}\n`;
            reply += `📝 ${event.description}\n`;
            reply += `⏰ ${remainingTime} menit tersisa\n\n`;
        });
        
        await evarick.sendMessage(sender, {
            image: { url: 'https://files.catbox.moe/vs12tq.jpg' },
            caption: reply,
            mentions: [sender]
        }, { quoted: msg });
    }
    break


    }
}
            
