const fs = require('fs');
const path = require('path');

// Path ke file players.json
const playerDataFile = './database/rpg/players.json';

function fixPlayerData() {
    try {
        console.log('🔧 Memperbaiki data player...');
        
        // Baca data player yang ada
        const playerData = JSON.parse(fs.readFileSync(playerDataFile, 'utf8'));
        
        let fixedCount = 0;
        const fixedPlayers = {};
        
        // Perbaiki setiap player
        Object.keys(playerData).forEach(playerId => {
            const player = playerData[playerId];
            const fixedPlayer = { ...player };
            
            // Tambahkan field yang hilang
            if (!fixedPlayer.hasOwnProperty('exp')) {
                fixedPlayer.exp = 0;
                fixedCount++;
                console.log(`✅ Fixed player ${playerId}: added missing 'exp' field`);
            }
            
            // Pastikan semua field wajib ada
            const requiredFields = {
                nama: player.nama || 'Unknown',
                kelas: player.kelas || 'Adventurer',
                level: player.level || 1,
                hp: player.hp || 100,
                maxHp: player.maxHp || 100,
                mana: player.mana || 50,
                maxMana: player.maxMana || 50,
                attack: player.attack || 10,
                defense: player.defense || 5,
                gold: player.gold || 100,
                lokasi: player.lokasi || 'Desa Awal',
                status: player.status || 'active',
                hasChosenClass: player.hasChosenClass || false,
                equipment: player.equipment || {},
                tas: player.tas || {},
                tools: player.tools || {},
                pvpStats: player.pvpStats || { rating: 1000, wins: 0, losses: 0 },
                titles: player.titles || [],
                skills: player.skills || [],
                monsterKills: player.monsterKills || 0,
                miningCount: player.miningCount || 0,
                woodcuttingCount: player.woodcuttingCount || 0,
                fishingCount: player.fishingCount || 0,
                visitedLocations: player.visitedLocations || ['Desa Awal'],
                consecutiveDays: player.consecutiveDays || 0,
                friends: player.friends || [],
                friendRequests: player.friendRequests || [],
                blockedPlayers: player.blockedPlayers || [],
                statsHistory: player.statsHistory || [],
                totalPlayTime: player.totalPlayTime || 0,
                lastLogin: player.lastLogin || Date.now(),
                exp: player.exp || 0,
                achievements: player.achievements || { unlocked: [], progress: {} },
                quests: player.quests || {
                    daily: { progress: {}, completed: {}, lastReset: null },
                    weekly: { progress: {}, completed: {}, lastReset: null },
                    story: { progress: {}, completed: {}, current: 'story_beginning' }
                },
                weeklyChallenges: player.weeklyChallenges || {
                    currentWeek: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)),
                    progress: {},
                    completed: {},
                    claimed: {}
                },
                joinDate: player.joinDate || Date.now(),
                lastUpdated: Date.now()
            };
            
            // Merge dengan data yang sudah ada
            Object.keys(requiredFields).forEach(field => {
                if (!fixedPlayer.hasOwnProperty(field)) {
                    fixedPlayer[field] = requiredFields[field];
                    if (field !== 'exp') {
                        console.log(`✅ Fixed player ${playerId}: added missing '${field}' field`);
                        fixedCount++;
                    }
                }
            });
            
            fixedPlayers[playerId] = fixedPlayer;
        });
        
        // Backup data lama
        const backupPath = `./database/rpg/players_backup_${Date.now()}.json`;
        fs.writeFileSync(backupPath, JSON.stringify(playerData, null, 2));
        console.log(`💾 Backup created: ${backupPath}`);
        
        // Simpan data yang sudah diperbaiki
        fs.writeFileSync(playerDataFile, JSON.stringify(fixedPlayers, null, 2));
        
        console.log(`\n🎉 Data player berhasil diperbaiki!`);
        console.log(`📊 Total players: ${Object.keys(fixedPlayers).length}`);
        console.log(`🔧 Fixed fields: ${fixedCount}`);
        console.log(`💾 Backup saved: ${backupPath}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Error fixing player data:', error);
        return false;
    }
}

// Jalankan perbaikan
if (require.main === module) {
    const success = fixPlayerData();
    if (success) {
        console.log('\n✅ Player data fixed successfully!');
        process.exit(0);
    } else {
        console.log('\n❌ Failed to fix player data!');
        process.exit(1);
    }
}

module.exports = { fixPlayerData }; 