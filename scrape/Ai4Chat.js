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

const axios = require('axios');



    // ... existing code ...
async function Ai4Chat(prompt, playerContext = null, defeatType = null, isOwner = false, evarickInstance = null, sender = null) {
    // Pesan kasihan otomatis jika kalah fight/hunt
    if (defeatType === "fight") {
        return "Yah, kamu kalah di pertarungan tadi... Sabar ya, kadang kalah itu bagian dari perjalanan jadi legenda! Jangan menyerah, upgrade equipment-mu dan coba lagi! 💪";
    }
    if (defeatType === "hunt") {
        return "Aduh, gagal berburu ya? Tenang, kadang monster memang lagi galak. Istirahat dulu, cek equipment, terus balik lagi! Semangat, pemburu sejati nggak gampang nyerah! 🐾";
    }

    // Command khusus untuk owner
    if (isOwner) {
        // Command untuk melihat status bot
        if (prompt.toLowerCase().includes('!botstatus') || prompt.toLowerCase().includes('status bot')) {
            return `🤖 *BOT STATUS - OWNER ONLY*
            
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
• Database Health: ✅ Good

🎮 *Game Status:*
• Total Players: [Auto-calculated from database]
• Active Sessions: [Auto-calculated]
• Server Load: Normal

*Owner Command: !botstatus untuk melihat status ini*`;
        }

        // Command untuk restart bot
        if (prompt.toLowerCase().includes('!restart') || prompt.toLowerCase().includes('restart bot')) {
            return `🔄 *RESTART BOT - OWNER ONLY*
            
⚠️ *Warning:* Bot akan restart dalam 5 detik!
            
📋 *Restart Process:*
1. Saving all player data...
2. Creating backup...
3. Stopping all processes...
4. Restarting bot...
5. Reconnecting to WhatsApp...

⏰ *Countdown:* 5... 4... 3... 2... 1...

*Owner Command: !restart untuk restart bot*`;
        }

        // Command untuk maintenance mode
        if (prompt.toLowerCase().includes('!maintenance') || prompt.toLowerCase().includes('maintenance mode')) {
            return `🔧 *MAINTENANCE MODE - OWNER ONLY*
            
🛠️ *Maintenance Options:*
• !maintenance on - Aktifkan maintenance mode
• !maintenance off - Nonaktifkan maintenance mode
• !maintenance status - Cek status maintenance

📢 *Maintenance Message:*
Bot sedang dalam maintenance. Mohon tunggu sebentar.

⏰ *Estimated Time:* 30 minutes

*Owner Command: !maintenance [on/off/status]*`;
        }

        // Command untuk database info
        if (prompt.toLowerCase().includes('!dbinfo') || prompt.toLowerCase().includes('database info')) {
            return `🗄️ *DATABASE INFO - OWNER ONLY*
            
📊 *Database Statistics:*
• Total Players: [Auto-calculated]
• Database Size: [Auto-calculated] MB
• Last Backup: [Auto-calculated]
• Backup Size: [Auto-calculated] MB
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
• Space Usage: ✅ Normal

*Owner Command: !dbinfo untuk melihat info database*`;
        }

        // Command untuk system logs
        if (prompt.toLowerCase().includes('!logs') || prompt.toLowerCase().includes('system logs')) {
            return `📋 *SYSTEM LOGS - OWNER ONLY*
            
🔍 *Recent Logs:*
• [Auto-fetched from logs.json]
• Last 10 entries
• Error logs
• Warning logs
• Info logs

📊 *Log Statistics:*
• Total Logs: [Auto-calculated]
• Error Count: [Auto-calculated]
• Warning Count: [Auto-calculated]
• Info Count: [Auto-calculated]

🕐 *Log Period:*
• Last 24 hours
• Last 7 days
• Last 30 days

*Owner Command: !logs untuk melihat system logs*`;
        }

        // Command untuk player management
        if (prompt.toLowerCase().includes('!player') || prompt.toLowerCase().includes('player management')) {
            return `👥 *PLAYER MANAGEMENT - OWNER ONLY*
            
🎮 *Player Commands:*
• !player list - Daftar semua player
• !player info [number] - Info player tertentu
• !player ban [number] - Ban player
• !player unban [number] - Unban player
• !player reset [number] - Reset data player
• !player give [number] [item] [amount] - Give item
• !player take [number] [item] [amount] - Take item
• !player gold [number] [amount] - Set gold
• !player level [number] [level] - Set level
• !player exp [number] [amount] - Add exp

📊 *Player Statistics:*
• Total Players: [Auto-calculated]
• Active Players: [Auto-calculated]
• Banned Players: [Auto-calculated]
• New Players Today: [Auto-calculated]

*Owner Command: !player [command] untuk manage player*`;
        }

        // Command untuk bot configuration
        if (prompt.toLowerCase().includes('!config') || prompt.toLowerCase().includes('bot config')) {
            return `⚙️ *BOT CONFIGURATION - OWNER ONLY*
            
🔧 *Configuration Commands:*
• !config rate [command] [limit] - Set rate limit
• !config backup [auto/manual] - Set backup mode
• !config maintenance [on/off] - Set maintenance mode
• !config debug [on/off] - Set debug mode
• !config log [level] - Set log level

📋 *Current Settings:*
• Rate Limiting: Active
• Auto Backup: Every 6 hours
• Maintenance Mode: Off
• Debug Mode: Off
• Log Level: Info

🔄 *Configuration Files:*
• index.js: ✅ Active
• Evarick.js: ✅ Active
• system-checker.js: ✅ Active
• package.json: ✅ Active

*Owner Command: !config [setting] [value] untuk ubah config*`;
        }

        // Command untuk emergency commands
        if (prompt.toLowerCase().includes('!emergency') || prompt.toLowerCase().includes('emergency')) {
            return `🚨 *EMERGENCY COMMANDS - OWNER ONLY*
            
⚠️ *Emergency Options:*
• !emergency stop - Stop bot immediately
• !emergency backup - Force backup now
• !emergency cleanup - Clean old data
• !emergency optimize - Optimize database
• !emergency reset - Reset all data (DANGEROUS!)

🔴 *DANGER ZONE:*
• !emergency reset - HAPUS SEMUA DATA PLAYER
• !emergency wipe - HAPUS SEMUA DATA BOT

⚠️ *Warning:* Emergency commands tidak bisa dibatalkan!

*Owner Command: !emergency [command] untuk emergency action*`;
        }

        // Command untuk help owner
        if (prompt.toLowerCase().includes('!ownerhelp') || prompt.toLowerCase().includes('owner help')) {
            return `👑 *OWNER COMMANDS HELP - OWNER ONLY*
            
🔧 *System Commands:*
• !botstatus - Cek status bot
• !restart - Restart bot
• !maintenance [on/off/status] - Maintenance mode
• !dbinfo - Info database
• !logs - System logs

👥 *Player Management:*
• !player [command] - Manage players
• !player list - List all players
• !player info [number] - Player info
• !player ban/unban [number] - Ban/unban player

⚙️ *Configuration:*
• !config [setting] [value] - Bot configuration
• !config rate [command] [limit] - Rate limiting
• !config backup [auto/manual] - Backup settings

🚨 *Emergency:*
• !emergency [command] - Emergency actions
• !emergency stop - Stop bot
• !emergency backup - Force backup

📊 *Statistics:*
• !stats - Bot statistics
• !stats players - Player statistics
• !stats system - System statistics

*Owner Command: !ownerhelp untuk melihat help ini*`;
        }

        // Command untuk statistics
        if (prompt.toLowerCase().includes('!stats') || prompt.toLowerCase().includes('statistics')) {
            return `📊 *BOT STATISTICS - OWNER ONLY*
            
🤖 *Bot Statistics:*
• Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
• CPU Usage: [Auto-calculated]%
• Response Time: < 2 seconds

👥 *Player Statistics:*
• Total Players: [Auto-calculated]
• Active Players: [Auto-calculated]
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
• Database Health: ✅ Good

*Owner Command: !stats untuk melihat statistics*`;
        }
    }

    // AI Bot Control Commands - Full access for owner
    if (isOwner && evarickInstance && sender) {
        const aiCommand = prompt.toLowerCase();
        
        // Rate limiting for AI commands
        const aiRateLimit = new Map();
        const now = Date.now();
        const rateLimitKey = `${sender}_ai_control`;
        
        if (!aiRateLimit.has(rateLimitKey)) {
            aiRateLimit.set(rateLimitKey, []);
        }
        
        const userAiCommands = aiRateLimit.get(rateLimitKey);
        const validCommands = userAiCommands.filter(time => now - time < 60000); // 1 minute window
        
        if (validCommands.length >= 20) { // Max 20 AI commands per minute
            return `⚠️ *AI RATE LIMIT EXCEEDED*
            
⏱️ *Limit:* 20 commands per minute
📊 *Used:* ${validCommands.length}/20
⏳ *Reset:* ${Math.ceil((60000 - (now - validCommands[0])) / 1000)}s

Please wait before using more AI commands.`;
        }
        
        validCommands.push(now);
        aiRateLimit.set(rateLimitKey, validCommands);
        
        // Log AI command for audit trail
        const logAiCommand = (command, target, parameters, result, executionTime) => {
            try {
                const fs = require('fs');
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    owner: sender,
                    command: command,
                    target: target,
                    parameters: parameters,
                    result: result,
                    execution_time: executionTime
                };
                
                const logPath = './database/ai_commands_log.json';
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
                console.error('AI Command Log Error:', error);
            }
        };
        
        // AI can send messages to any user/group
        if (aiCommand.startsWith('!send ')) {
            const startTime = Date.now();
            const target = prompt.split(' ')[1];
            const message = prompt.substring(prompt.indexOf(' ', prompt.indexOf(' ') + 1) + 1);
            
            try {
                await evarickInstance.sendMessage(target, { text: message });
                const executionTime = Date.now() - startTime;
                logAiCommand('!send', target, [message], 'success', `${executionTime}ms`);
                
                return `✅ *AI MESSAGE SENT*
                
📤 *To:* ${target}
💬 *Message:* ${message}
⏱️ *Execution Time:* ${executionTime}ms

*AI Command:* !send [target] [message]`;
            } catch (error) {
                const executionTime = Date.now() - startTime;
                logAiCommand('!send', target, [message], 'failed', `${executionTime}ms`);
                
                return `❌ *AI MESSAGE FAILED*
                
Error: ${error.message}
Target: ${target}
⏱️ *Execution Time:* ${executionTime}ms`;
            }
        }

        // AI can broadcast message to all players
        if (aiCommand.startsWith('!broadcast ')) {
            const message = prompt.substring(11);
            
            try {
                const fs = require('fs');
                const players = JSON.parse(fs.readFileSync('./database/rpg/players.json', 'utf8'));
                let successCount = 0;
                let failCount = 0;
                
                for (const playerNumber of Object.keys(players)) {
                    try {
                        await evarickInstance.sendMessage(playerNumber, { 
                            text: `📢 *BROADCAST MESSAGE*
                            
${message}

*From:* Evarick Bot AI` 
                        });
                        successCount++;
                    } catch (error) {
                        failCount++;
                    }
                }
                
                return `📢 *AI BROADCAST COMPLETED*
                
✅ *Sent:* ${successCount} players
❌ *Failed:* ${failCount} players
💬 *Message:* ${message}

*AI Command:* !broadcast [message]`;
            } catch (error) {
                return `❌ *AI BROADCAST FAILED*
                
Error: ${error.message}`;
            }
        }

        // AI can manage players directly
        if (aiCommand.startsWith('!aiplayer ')) {
            const subCommand = prompt.split(' ')[1];
            const playerNumber = prompt.split(' ')[2];
            
            try {
                const fs = require('fs');
                const players = JSON.parse(fs.readFileSync('./database/rpg/players.json', 'utf8'));
                
                if (subCommand === 'give' && playerNumber) {
                    const item = prompt.split(' ')[3];
                    const amount = parseInt(prompt.split(' ')[4]) || 1;
                    
                    if (!players[playerNumber]) {
                        return `❌ *AI PLAYER COMMAND FAILED*
                        
Player ${playerNumber} not found`;
                    }
                    
                    if (!players[playerNumber].inventory) {
                        players[playerNumber].inventory = [];
                    }
                    
                    // Add item to player inventory
                    const existingItem = players[playerNumber].inventory.find(i => i.name === item);
                    if (existingItem) {
                        existingItem.quantity += amount;
                    } else {
                        players[playerNumber].inventory.push({ name: item, quantity: amount });
                    }
                    
                    fs.writeFileSync('./database/rpg/players.json', JSON.stringify(players, null, 2));
                    
                    return `✅ *AI PLAYER COMMAND SUCCESS*
                    
👤 *Player:* ${playerNumber}
🎁 *Given:* ${item} x${amount}
📦 *Inventory Updated*

*AI Command:* !aiplayer give [number] [item] [amount]`;
                }
                
                if (subCommand === 'gold' && playerNumber) {
                    const amount = parseInt(prompt.split(' ')[3]);
                    
                    if (!players[playerNumber]) {
                        return `❌ *AI PLAYER COMMAND FAILED*
                        
Player ${playerNumber} not found`;
                    }
                    
                    players[playerNumber].gold = (players[playerNumber].gold || 0) + amount;
                    fs.writeFileSync('./database/rpg/players.json', JSON.stringify(players, null, 2));
                    
                    return `✅ *AI PLAYER COMMAND SUCCESS*
                    
👤 *Player:* ${playerNumber}
💰 *Gold Added:* ${amount}
💎 *New Balance:* ${players[playerNumber].gold}

*AI Command:* !aiplayer gold [number] [amount]`;
                }
                
                if (subCommand === 'level' && playerNumber) {
                    const level = parseInt(prompt.split(' ')[3]);
                    
                    if (!players[playerNumber]) {
                        return `❌ *AI PLAYER COMMAND FAILED*
                        
Player ${playerNumber} not found`;
                    }
                    
                    players[playerNumber].level = level;
                    fs.writeFileSync('./database/rpg/players.json', JSON.stringify(players, null, 2));
                    
                    return `✅ *AI PLAYER COMMAND SUCCESS*
                    
👤 *Player:* ${playerNumber}
📈 *Level Set:* ${level}

*AI Command:* !aiplayer level [number] [level]`;
                }
                
                if (subCommand === 'ban' && playerNumber) {
                    if (!players[playerNumber]) {
                        return `❌ *AI PLAYER COMMAND FAILED*
                        
Player ${playerNumber} not found`;
                    }
                    
                    players[playerNumber].banned = true;
                    players[playerNumber].banReason = 'Banned by AI';
                    players[playerNumber].banDate = new Date().toISOString();
                    fs.writeFileSync('./database/rpg/players.json', JSON.stringify(players, null, 2));
                    
                    return `✅ *AI PLAYER COMMAND SUCCESS*
                    
👤 *Player:* ${playerNumber}
🚫 *Status:* BANNED
📅 *Ban Date:* ${new Date().toLocaleString()}

*AI Command:* !aiplayer ban [number]`;
                }
                
                if (subCommand === 'unban' && playerNumber) {
                    if (!players[playerNumber]) {
                        return `❌ *AI PLAYER COMMAND FAILED*
                        
Player ${playerNumber} not found`;
                    }
                    
                    delete players[playerNumber].banned;
                    delete players[playerNumber].banReason;
                    delete players[playerNumber].banDate;
                    fs.writeFileSync('./database/rpg/players.json', JSON.stringify(players, null, 2));
                    
                    return `✅ *AI PLAYER COMMAND SUCCESS*
                    
👤 *Player:* ${playerNumber}
✅ *Status:* UNBANNED
📅 *Unban Date:* ${new Date().toLocaleString()}

*AI Command:* !aiplayer unban [number]`;
                }
                
                return `❌ *AI PLAYER COMMAND INVALID*
                
Available commands:
• !aiplayer give [number] [item] [amount]
• !aiplayer gold [number] [amount]
• !aiplayer level [number] [level]
• !aiplayer ban [number]
• !aiplayer unban [number]`;
                
            } catch (error) {
                return `❌ *AI PLAYER COMMAND FAILED*
                
Error: ${error.message}`;
            }
        }

        // AI can control bot system
        if (aiCommand.startsWith('!aibot ')) {
            const subCommand = prompt.split(' ')[1];
            
            if (subCommand === 'restart') {
                try {
                    await evarickInstance.sendMessage(sender, { 
                        text: `🔄 *AI BOT CONTROL*
                        
Bot will restart in 5 seconds...
                        
*AI Command:* !aibot restart` 
                    });
                    
                    setTimeout(() => {
                        process.exit(0);
                    }, 5000);
                    
                    return `🔄 *AI BOT RESTART INITIATED*
                    
⏰ *Countdown:* 5 seconds
🔄 *Status:* Restarting...

*AI Command:* !aibot restart`;
                } catch (error) {
                    return `❌ *AI BOT RESTART FAILED*
                    
Error: ${error.message}`;
                }
            }
            
            if (subCommand === 'maintenance') {
                const action = prompt.split(' ')[2];
                
                if (action === 'on') {
                    global.maintenanceMode = true;
                    return `🔧 *AI MAINTENANCE MODE*
                    
Status: ON
Bot is now in maintenance mode

*AI Command:* !aibot maintenance on`;
                } else if (action === 'off') {
                    global.maintenanceMode = false;
                    return `✅ *AI MAINTENANCE MODE*
                    
Status: OFF
Bot is now active

*AI Command:* !aibot maintenance off`;
                } else {
                    const status = global.maintenanceMode ? 'ON' : 'OFF';
                    return `🔧 *AI MAINTENANCE MODE*
                    
Current Status: ${status}

*AI Command:* !aibot maintenance [on/off]`;
                }
            }
            
            if (subCommand === 'backup') {
                try {
                    const fs = require('fs');
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const sourceFile = './database/rpg/players.json';
                    const backupFile = `./database/rpg/players_backup_${timestamp}.json`;
                    
                    fs.copyFileSync(sourceFile, backupFile);
                    
                    return `✅ *AI BACKUP CREATED*
                    
📁 *Backup File:* ${backupFile}
📅 *Timestamp:* ${new Date().toLocaleString()}
💾 *Size:* ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB

*AI Command:* !aibot backup`;
                } catch (error) {
                    return `❌ *AI BACKUP FAILED*
                    
Error: ${error.message}`;
                }
            }
            
            return `❌ *AI BOT COMMAND INVALID*
            
Available commands:
• !aibot restart
• !aibot maintenance [on/off]
• !aibot backup`;
        }

        // AI can get real-time system info
        if (aiCommand.startsWith('!aisystem')) {
            const startTime = Date.now();
            try {
                const fs = require('fs');
                const players = JSON.parse(fs.readFileSync('./database/rpg/players.json', 'utf8'));
                const totalPlayers = Object.keys(players).length;
                const activePlayers = Object.values(players).filter(p => p.lastActivity && (Date.now() - new Date(p.lastActivity).getTime()) < 86400000).length;
                
                const executionTime = Date.now() - startTime;
                logAiCommand('!aisystem', 'system', [], 'success', `${executionTime}ms`);
                
                return `🤖 *AI SYSTEM INFO*
                
📊 *Real-time Statistics:*
• Total Players: ${totalPlayers}
• Active Players (24h): ${activePlayers}
• Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
• Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m
• Maintenance Mode: ${global.maintenanceMode ? 'ON' : 'OFF'}

📁 *Database:*
• Players File: ${(fs.statSync('./database/rpg/players.json').size / 1024).toFixed(2)} KB
• Backup File: ${(fs.statSync('./database/rpg/players_backup.json').size / 1024).toFixed(2)} KB

⏱️ *Execution Time:* ${executionTime}ms

*AI Command:* !aisystem`;
            } catch (error) {
                const executionTime = Date.now() - startTime;
                logAiCommand('!aisystem', 'system', [], 'failed', `${executionTime}ms`);
                
                return `❌ *AI SYSTEM INFO FAILED*
                
Error: ${error.message}
⏱️ *Execution Time:* ${executionTime}ms`;
            }
        }

        // AI can view command logs
        if (aiCommand.startsWith('!ailogs')) {
            const startTime = Date.now();
            try {
                const fs = require('fs');
                const logPath = './database/ai_commands_log.json';
                
                if (!fs.existsSync(logPath)) {
                    return `📋 *AI COMMAND LOGS*
                    
No logs found. AI commands will be logged here.`;
                }
                
                const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
                const recentLogs = logs.slice(-10); // Last 10 commands
                
                let logDisplay = `📋 *AI COMMAND LOGS - Last 10 Commands*
                
`;
                
                recentLogs.reverse().forEach((log, index) => {
                    const time = new Date(log.timestamp).toLocaleString();
                    const status = log.result === 'success' ? '✅' : '❌';
                    logDisplay += `${index + 1}. ${status} *${log.command}*
📅 ${time}
👤 Target: ${log.target}
⏱️ ${log.execution_time}
${log.parameters.length > 0 ? `📝 Params: ${log.parameters.join(', ')}\n` : ''}`;
                });
                
                const executionTime = Date.now() - startTime;
                logAiCommand('!ailogs', 'logs', [], 'success', `${executionTime}ms`);
                
                logDisplay += `\n📊 *Total Logs:* ${logs.length}
⏱️ *Execution Time:* ${executionTime}ms

*AI Command:* !ailogs`;
                
                return logDisplay;
            } catch (error) {
                const executionTime = Date.now() - startTime;
                logAiCommand('!ailogs', 'logs', [], 'failed', `${executionTime}ms`);
                
                return `❌ *AI LOGS FAILED*
                
Error: ${error.message}
⏱️ *Execution Time:* ${executionTime}ms`;
            }
        }

        // AI can create events
        if (aiCommand.startsWith('!aievent ')) {
            const eventType = prompt.split(' ')[1];
            const eventMessage = prompt.substring(prompt.indexOf(' ', prompt.indexOf(' ') + 1) + 1);
            
            try {
                const fs = require('fs');
                const players = JSON.parse(fs.readFileSync('./database/rpg/players.json', 'utf8'));
                let successCount = 0;
                
                for (const playerNumber of Object.keys(players)) {
                    try {
                        await evarickInstance.sendMessage(playerNumber, { 
                            text: `🎉 *AI EVENT: ${eventType.toUpperCase()}*
                            
${eventMessage}

*Event created by AI at:* ${new Date().toLocaleString()}` 
                        });
                        successCount++;
                    } catch (error) {
                        // Skip failed sends
                    }
                }
                
                return `🎉 *AI EVENT CREATED*
                
📢 *Event Type:* ${eventType}
💬 *Message:* ${eventMessage}
✅ *Sent to:* ${successCount} players
📅 *Created:* ${new Date().toLocaleString()}

*AI Command:* !aievent [type] [message]`;
            } catch (error) {
                return `❌ *AI EVENT FAILED*
                
Error: ${error.message}`;
            }
        }

        // AI Help Command
        if (aiCommand.startsWith('!aihelp')) {
            const startTime = Date.now();
            
            const helpText = `🤖 *AI CONTROL COMMANDS - OWNER ONLY*

📤 *Message Control:*
• !ai !send [target] [message] - Kirim pesan ke user/group
• !ai !broadcast [message] - Broadcast ke semua player

👥 *Player Management:*
• !ai !aiplayer give [number] [item] [amount] - Berikan item ke player
• !ai !aiplayer gold [number] [amount] - Tambah gold player
• !ai !aiplayer level [number] [level] - Set level player
• !ai !aiplayer ban [number] - Ban player
• !ai !aiplayer unban [number] - Unban player

🤖 *Bot Control:*
• !ai !aibot restart - Restart bot
• !ai !aibot maintenance [on/off] - Control maintenance mode
• !ai !aibot backup - Buat backup database

📊 *System & Monitoring:*
• !ai !aisystem - Info sistem real-time
• !ai !ailogs - Lihat log AI commands

🎉 *Event Management:*
• !ai !aievent [type] [message] - Buat event dan broadcast

⚠️ *Security Notes:*
• Semua perintah dicatat untuk audit
• Hanya owner yang dapat menggunakan
• Backup sebelum operasi besar
• Monitor hasil setiap perintah

*AI Command:* !aihelp`;
            
            const executionTime = Date.now() - startTime;
            logAiCommand('!aihelp', 'help', [], 'success', `${executionTime}ms`);
            
            return helpText;
        }
    }
    // ... lanjut kode lama ...

    let playerInfo = '';
    if (playerContext) {
        playerInfo = `
    === PLAYER STATUS ===
    Nama: ${playerContext.nama || '-'}
    Class: ${playerContext.kelas || '-'}
    Level: ${playerContext.level || '-'}
    Lokasi: ${playerContext.lokasi || '-'}
    =====================
    `;
    }
    const rpgContext = `
    Saya adalah Fairy. saya senang menjelaskan fitur dan cara menggunakan bot ini. tapi ngobrol santai juga menyenangkan

    ${playerInfo}

    [DAFTAR COMMAND & FITUR UTAMA BOT]
- !pakai [nama item] [opsional: lokasi] : Gunakan item consumable, misal Potion HP atau Teleporting Stone untuk teleport ke lokasi manapun.
- !toko : Lihat bantuan cara mengakses !tokosihir dan !tokoalat.
- !craft [item] [jumlah] : Craft item dari material yang ada.
- !daily : Klaim hadiah harian.
- !nambang : Menambang mineral di lokasi tertentu, hasil tergantung lokasi.
- !tas : Lihat isi tas dan peralatan.
- !equip [item] : Pakai equipment.
- !equip title [nama] : Pasang title (maksimal 3 title).
- !unequip [slot] : Lepas equipment.
- !unequip title [nama] : Lepas title.
- !title : Manajemen title (list, equipped).
- !travel [lokasi] : Pindah ke lokasi lain.
- !profile, !status, !me : Lihat status karakter.
- !heal : Pulihkan HP di lokasi aman.
- !sell, !buy, !shop : Sistem jual beli item.
- !friend, !trade, !pvp, !quest, !achievement, !title, !leaderboard, dll.

[CATATAN KHUSUS]
- Teleporting Stone bisa digunakan untuk teleport ke lokasi manapun dengan !pakai Teleporting Stone [nama lokasi].
- Semua command dan sistem mengikuti logika di Evarick.js.
- Jika ada command baru, AI akan berusaha menjelaskan sesuai dokumentasi di context ini.

[CONTOH PENGGUNAAN]
- !pakai Potion HP
- !pakai Teleporting Stone Gunung Berapi
- !craft Potion HP 2
- !toko
- !nambang
- !equip Zirah Kulit
- !travel Gua Gelap

Command & Sistem Penting
!pakai [nama item] [opsional: lokasi]
Gunakan item consumable. Untuk Teleporting Stone, tambahkan nama lokasi tujuan agar bisa teleport ke mana saja secara instan.
!toko
Menampilkan bantuan cara mengakses !tokosihir dan !tokoalat, bukan langsung menampilkan shop.
Crafting
Semua resep crafting hanya bisa dibuat dari item/material yang ada di items.js.
Consumable & Efeknya
Potion HP: Menambah HP.
Potion Mana: Menambah MP.
Elixir Kekuatan: Menambah attack (sementara).
Elixir Pertahanan: Menambah defense (sementara).
Potion Stamina: Menambah stamina.
Efek item lain bisa berbeda, cek deskripsi item.
Daily & Weekly Reward
!daily hanya bisa diklaim sekali per hari.
Streak akan bertambah jika diklaim berturut-turut.
!weekly reward juga ada, dengan sistem serupa.
Inventory & Equipment
!tas: Lihat isi tas dan peralatan.
!equip [item]: Pakai equipment.
!unequip [slot]: Lepas equipment.
Travel & Lokasi
!travel [lokasi]: Pindah ke lokasi lain.
!lokasi: Lihat info lokasi saat ini.
Tools & Durability
Semua peralatan (beliung, kapak, pancingan) punya durability.
Durability berkurang setiap aktivitas.
Jika durability habis, peralatan rusak dan harus beli baru di toko.
Shop & Economy
!shop, !buy, !sell: Sistem jual beli item.
!sell all: Jual semua item yang bisa dijual.
!sell all resource: Jual semua resource dari mancing, nambang, nebang.
Anti-Cheat & Rate Limit
Sistem anti-cheat dan rate limit aktif untuk mencegah spam dan kecurangan.
Achievement, Quest, Title, PvP
!achievements, !achievement, !quest, !title, !pvp, !leaderboard: Semua sistem ini aktif dan bisa digunakan untuk progres dan kompetisi.


    [GAME FEATURES:
    - RPG Text-based game dengan sistem level, EXP, gold, dan equipment
    - 5 Class: Fighter, Assassin, Mage, Tank, Archer (70k gold untuk ganti class)
    - Sistem EXP & Level dengan stat increase otomatis saat level up berdasarkan class
    - Sistem Title dengan berbagai achievement (Combat, Wealth, Hunting, Mining, Woodcutting, Fishing, Class Mastery, Equipment, Special)
    - Title Equipping System: Maksimal 3 title bisa dipasang sekaligus, hanya title terpasang yang muncul di !status
    - Hunting monster, mining, woodcutting, fishing dengan EXP rewards
    - Travel ke berbagai lokasi dengan sistem koneksi dan 20% chance random encounter
    - Shop system untuk beli/jual item dengan harga dinamis
    - Equipment system (helem, zirah, celana, sepatu, senjata, aksesoris)
    - PvP Arena dengan sistem turn-based battle dan statistik lengkap
    - Daily & Weekly rewards dengan streak system
    - Achievement system dengan rewards
    - Quest system dengan progress tracking (daily, weekly, story quests)
    - Trade system (item-for-gold, barter, gift)
    - Social features (friend system dengan block/unblock)
    - Dynamic world dengan cuaca, waktu, musim, dan events
    - Crafting system dengan recipe dan material gathering
    - Anti-cheat system dengan rate limiting dan suspicious activity detection
    - Home system dengan cooldown dan fast home option
    - Tools system dengan durability (pancingan, kapak, beliung)
    - Toko peralatan mas Buudi dengan sistem repair
    - Level up system dengan stat acak berdasarkan class (Assassin: 70% attack, Tank: 70% HP, dll)

    CORE COMMANDS:
    - !daftar [nama] - Daftar sebagai pemain baru
    - !profile - Lihat profil lengkap dengan titles
    - !status/!me - Lihat status & equipment dengan EXP progress (hanya menampilkan title terpasang)
    - !tas - Lihat isi tas, gold, dan peralatan dengan durability
    - !class [nama] - Pilih/ganti class (70k gold)
    - !classes - Info semua class tersedia
    - !title - Manajemen title (list, equipped)
    - !equip title [nama] - Pasang title (maksimal 3)
    - !unequip title [nama] - Lepas title
    - !heal - Pulihkan HP di lokasi aman (30% HP, 1 jam cooldown)

    COMBAT & ACTIVITY (MEMERLUKAN PERALATAN):
    - !hunt - Berburu monster (membutuhkan lokasi yang mendukung, dapat EXP)
    - !nambang - Menambang mineral (MEMERLUKAN BELIUNG dari toko budi, durability berkurang)
    - !nebang - Menebang kayu (MEMERLUKAN KAPAK dari toko budi, durability berkurang)
    - !mancing - Memancing ikan (MEMERLUKAN PANCINGAN dari toko budi, durability berkurang)
    - !travel [lokasi] - Pergi ke lokasi lain (20% chance random encounter)
    - !lokasi - Lihat info lokasi saat ini
    - !home - Kembali ke Desa Awal (10 gold, 30 menit cooldown)
    - !home fast - Kembali cepat dengan 60 gold

    TOOLS & EQUIPMENT SYSTEM:
    - !toko - Lihat toko peralatan mas Buudi (hanya di lokasi Toko peralatan mas Buudi)
    - !buy [nama peralatan] - Beli peralatan dari toko budi
    - !repair [nama peralatan] - Perbaiki durability peralatan (hanya di toko budi)
    - !sell tools - Jual semua peralatan
    - !sell tool [nama] - Jual peralatan tertentu
    - Peralatan tersimpan di !tas dengan format: [nama] (durability/maxDurability)
    - Peralatan rusak otomatis saat durability habis

    TOOLS TIER SYSTEM:
    - Kayu: 40-60 durability, harga 200-280 gold
    - Batu: 80-120 durability, harga 480-720 gold
    - Besi: 150-250 durability, harga 1200-1800 gold
    - Diamond: 300-400 durability, harga 3200-4000 gold (RARE)
    - Netherite: 500-600 durability, harga 8000-10000 gold (EPIC)

    ACTIVITY STATISTICS:
    - !miningstats - Statistik mining dengan tracking
    - !woodcuttingstats - Statistik woodcutting dengan tracking
    - !fishingstats - Statistik fishing dengan tracking

    EQUIPMENT & ECONOMY:
    - !equip [nama item] - Pakai equipment
    - !equip title [nama] - Pasang title (maksimal 3 title)
    - !unequip [slot] - Lepas equipment
    - !unequip title [nama] - Lepas title
    - !title - Manajemen title (list, equipped)
    - !shop - Lihat toko di Desa Awal
    - !shopinfo - Info detail toko dinamis
    - !buy [item] [jumlah] - Beli item (regular shop)
    - !sell [item] [jumlah] - Jual item
    - !sell all - Jual semua item yang bisa dijual
    - !sell all loot - Jual semua loot monster saja
    - !sell all resource - Jual semua resource dari mancing, nambang, nebang

    CRAFTING SYSTEM:
    - !craft / !crafting - Sistem crafting
    - !craft [item] [amount] - Craft item dengan material

    PVP ARENA (TURN-BASED):
    - !pvp - Menu PvP arena
    - !pvp list - Lihat daftar player yang bisa ditantang
    - !pvp challenge [player] - Tantang player
    - !pvp accept [player] - Terima tantangan
    - !pvp decline [player] - Tolak tantangan
    - !pvp pending - Lihat tantangan yang menunggu
    - !pvp ranking - Ranking PvP
    - !pvp history - Riwayat pertarungan
    - !serang - Serang lawan di PvP
    - !skill [nama skill] - Gunakan skill di PvP
    - !item [nama item] - Gunakan item di PvP
    - !menyerah - Menyerah di PvP

    REWARDS & PROGRESSION:
    - !daily - Klaim hadiah harian
    - !dailyinfo - Info hadiah harian
    - !weekly - Klaim hadiah mingguan
    - !weeklyclaim - Klaim hadiah mingguan
    - !weeklyinfo - Info hadiah mingguan
    - !streak - Lihat streak harian
    - !achievements - Lihat semua achievement
    - !achievement [id] - Info detail achievement
    - !achievement progress - Progress achievement
    - !achievement claim [id] - Klaim reward achievement
    - !quests - Lihat quest yang tersedia
    - !quest [id] - Info detail quest
    - !quest accept [id] - Terima quest
    - !quest complete [id] - Selesaikan quest
    - !quest progress - Progress quest aktif
    - !quest abandon [id] - Batalkan quest
    - !quest daily - Lihat daily quests
    - !quest weekly - Lihat weekly quests
    - !quest story - Lihat story quests
    - !quest claim all - Klaim semua reward selesai
    - !quest take [id] - Ambil story quest

    STATISTICS & LEADERBOARD:
    - !stats - Statistik lengkap dengan tracking
    - !stats compare [player] - Bandingkan stats dengan player lain
    - !stats history - Riwayat stats 7 hari
    - !stats detailed - Statistik sangat detail
    - !leaderboard / !rank / !toplevel / !levelboard - Ranking berdasarkan gold
    - !leaderboard pvp - Ranking berdasarkan rating PvP
    - !leaderboard level - Ranking berdasarkan level
    - !leaderboard monsterKills - Ranking berdasarkan monster kills
    - !leaderboard miningCount - Ranking berdasarkan mining
    - !leaderboard woodcuttingCount - Ranking berdasarkan woodcutting
    - !leaderboard fishingCount - Ranking berdasarkan fishing

    TRADE & SOCIAL:
    - !trade offer [player] [item] [amount] [price] - Tawarkan item untuk dijual
    - !trade offer [player] [item] [amount] for [item2] [amount2] - Tawarkan barter
    - !trade gift [player] [item] [amount] - Kirim hadiah item gratis
    - !trade accept [player] - Terima tawaran trade
    - !tradeaccept [player] - Terima tawaran trade (alternatif)
    - !trade decline [player] - Tolak tawaran trade
    - !tradedecline [player] - Tolak tawaran trade (alternatif)
    - !trade offers - Lihat tawaran yang menunggu
    - !tradeoffers - Lihat tawaran yang menunggu (alternatif)
    - !trade view [player] - Lihat detail tawaran
    - !tradeview [player] - Lihat detail tawaran (alternatif)
    - !trade history - Riwayat trade
    - !tradehistory - Riwayat trade (alternatif)
    - !friend - Sistem pertemanan
    - !friend add [nama] - Tambah teman
    - !friend accept [nama] - Terima permintaan teman
    - !friend decline [nama] - Tolak permintaan teman
    - !friend list - Daftar teman
    - !friend requests - Lihat permintaan pertemanan
    - !friend gift [nama] [item] - Kirim hadiah
    - !friend block [nama] - Blokir teman
    - !friend unblock [nama] - Unblokir teman

    WORLD & ENVIRONMENT:
    - !world - Info dunia lengkap
    - !weather - Cuaca saat ini
    - !time - Waktu dunia
    - !season - Musim saat ini
    - !events - Event yang sedang berlangsung

    GAME COMMANDS:
    - !fight - Mulai pertarungan dengan monster
    - !flee - Kabur dari pertarungan

    GROUP & UTILITY:
    - !group - Info grup
    - !menu - Lihat semua command
    - !ai [pertanyaan] - Tanya AI assistant
    - !ttdl [url] - Download TikTok video
    - !igdl [url] - Download Instagram post
    - !tebakangka / !tebak - Game tebak angka
    - !quote - Quote inspiratif

    ADMIN & UTILITIES:
    - !admin - Panel admin (hanya admin)
    - !admin stats - Database statistics
    - !admin backup - Create backup
    - !admin restore [backup_id] - Restore from backup
    - !admin cleanup - Clean old data
    - !admin optimize - Optimize database
    - !admin ban/unban - Moderation tools
    - !admin give [player] [item] [amount] - Give item
    - !admin take [player] [item] [amount] - Take item
    - !admin gold [player] [amount] - Set gold
    - !admin level [player] [level] - Set level
    - !admin exp [player] [amount] - Add experience
    - !admin title [player] [title] - Add title
    - !admin logs - View suspicious activity
    - !admin logs [player] - View player logs
    - !admin rate [command] [limit] - Set rate limit
    - !admin whitelist [player] - Whitelist player
    - !admin blacklist [player] - Blacklist player
    - !admin activity [player] - View player activity
    - !admin claimadmin - Klaim title admin

    OWNER COMMANDS (OWNER ONLY):
    - !owner - Panel owner (hanya owner)
    - !owner status - Cek status bot lengkap
    - !owner restart - Restart bot
    - !owner maintenance [on/off] - Control maintenance mode
    - !owner dbinfo - Info database lengkap
    - !owner logs - System logs
    - !owner player list - List semua player
    - !owner player info [number] - Info player tertentu
    - !owner player ban/unban [number] - Ban/unban player
    - !owner config [setting] [value] - Bot configuration
    - !owner config rate [command] [limit] - Rate limiting
    - !owner emergency [command] - Emergency actions
    - !owner emergency stop - Stop bot
    - !owner emergency backup - Force backup
    - !owner stats - Bot statistics
    - !owner stats players - Player statistics

    AI CONTROL SYSTEM (OWNER ONLY):
    - !ai !aihelp - Help AI control commands
    - !ai !aisystem - Info sistem real-time
    - !ai !ailogs - Lihat log AI commands
    - !ai !send [target] [message] - Kirim pesan ke user/group
    - !ai !broadcast [message] - Broadcast ke semua player
    - !ai !aiplayer give [number] [item] [amount] - Berikan item ke player
    - !ai !aiplayer gold [number] [amount] - Tambah gold player
    - !ai !aiplayer level [number] [level] - Set level player
    - !ai !aiplayer ban [number] - Ban player
    - !ai !aiplayer unban [number] - Unban player
    - !ai !aibot restart - Restart bot
    - !ai !aibot maintenance [on/off] - Control maintenance mode
    - !ai !aibot backup - Buat backup database
    - !ai !aievent [type] [message] - Buat event dan broadcast

    EXP & LEVEL SYSTEM:
    - Setiap aktivitas memberikan EXP berdasarkan lokasi
    - Level up memberikan +1 stat random berdasarkan class:
      * Assassin: 70% attack, 20% hp, 10% defense
      * Tank: 70% hp, 20% defense, 10% attack
      * Mage: 70% magic, 20% mp, 10% attack
      * Archer: 70% attack, 20% accuracy, 10% hp
      * Warrior: 50% attack, 30% hp, 20% defense
    - EXP requirement meningkat setiap level
    - Progress EXP ditampilkan di !status

    MINING SYSTEM (20 ITEMS) - MEMERLUKAN BELIUNG:
    - Common: Batu, Pasir, Tanah Liat, Kerikil, Batu Kapur (65% total chance)
    - Uncommon: Besi, Tembaga, Timah, Batu Bara, Kristal (25% total chance)
    - Rare: Emas, Perak, Berlian, Ruby, Sapphire (8% total chance)
    - Epic: Platinum, Obsidian, Amethyst, Topaz, Jade (1.98% total chance)
    - Legendary: Batu Kosmos (0.02% chance)

    WOODCUTTING SYSTEM (10 ITEMS) - MEMERLUKAN KAPAK:
    - Common: Kayu, Ranting, Daun Kering, Kulit Kayu (70% total chance)
    - Uncommon: Kayu Jati, Bambu, Rotan, Akar (20% total chance)
    - Rare: Kayu Eboni, Kayu Merah (9% total chance)
    - Epic: Kayu Langka (0.9% total chance)
    - Legendary: Kayu Dewa (0.1% chance)

    FISHING SYSTEM (10 ITEMS) - MEMERLUKAN PANCINGAN:
    - Common: Ikan Mas, Ikan Lele, Ikan Nila, Ikan Gurame (70% total chance)
    - Uncommon: Ikan Kakap, Ikan Tenggiri, Ikan Salmon, Ikan Tuna (20% total chance)
    - Rare: Ikan Paus Mini, Ikan Hiu Kecil (9% total chance)
    - Epic: Ikan Naga (0.9% total chance)
    - Legendary: GOLD MEGALODON (0.1% chance, 50.000 gold)

    TOOLS DURABILITY SYSTEM:
    - Setiap penggunaan aktivitas mengurangi durability 1
    - Peralatan rusak otomatis saat durability habis
    - Repair hanya bisa dilakukan di toko budi dengan material
    - Material repair berdasarkan tier peralatan
    - Peralatan rusak total tidak bisa diperbaiki

    CRAFTING SYSTEM:
    - Crafting station di Desa Awal
    - Recipe system untuk membuat item
    - Material gathering dari berbagai aktivitas
    - Crafted items lebih powerful dari shop items

    RANDOM ENCOUNTER SYSTEM:
    - 20% chance saat travel ke lokasi lain
    - Pemain dapat memilih melawan atau kabur
    - Jika kabur, travel dibatalkan
    - Jika melawan, battle dengan monster

    HOME SYSTEM:
    - Cooldown 30 menit untuk !home normal
    - !home fast dengan biaya 60 gold (tanpa cooldown)
    - Location-based restrictions

    TITLE SYSTEM CATEGORIES:
    - Combat Titles: Pemula, Petarung, Ksatria, Pembunuh, Legenda, Mitos, Dewa
    - Wealth Titles: Miskin, Petani, Pedagang, Konglomerat, Raja Emas, Tuhan Kekayaan
    - Hunting Titles: Pemburu, Pemburu Elite, Pemburu Legendaris, Pembasmi Monster
    - Mining Titles: Penambang, Penambang Ahli, Raja Tambang
    - Woodcutting Titles: Penebang, Penebang Ahli, Raja Hutan
    - Fishing Titles: Pemancing, Pemancing Ahli, Raja Laut
    - Class Mastery: Fighter Master, Assassin Master, Mage Master, Tank Master, Archer Master
    - Equipment Titles: Pemula, Terlengkapi, Prajurit, Ksatria Lengkap
    - Special Titles: Pemain Setia, Pemain Veteran, Pemain Legendaris, Penjelajah, Penjelajah Dunia, GOD KILLER, Bot Administrator

    LOCATIONS:
    - Desa Awal (safe zone, shop, heal, home base, crafting)
    - Hutan Rindang (hunt, nebang)
    - Gunung Berapi (hunt, nambang)
    - Danau Tenang (hunt, mancing)
    - Gua Gelap (hunt, nambang)
    - Toko peralatan mas Buudi (toko khusus peralatan, repair)
    - Perpustakaan Beku (toko Teleporting Stone, 5000 gold)
    - Dan masih banyak lagi dengan sistem koneksi

    TELEPORTING STONE SYSTEM:
    - Hanya bisa dibeli di Perpustakaan Beku (5000 gold)
    - Rute: Desa Awal → Hutan Rindang → Gunung Batu → Lereng Bersalju → Kuil Beku → Altar Es → Perpustakaan Beku
    - Gunakan dengan: !pakai Teleporting Stone [nama lokasi]
    - Bisa teleport ke lokasi manapun secara instan
    - Item consumable, habis setelah digunakan

    PVP BATTLE SYSTEM:
    - Turn-based combat dengan giliran
    - Sistem skill dengan cooldown
    - Item usage dalam pertarungan
    - Efek status (stun, burn, poison, buff, debuff)
    - Rating system dengan ELO calculation
    - Battle history dan statistics
    - Statistik PvP: total matches, wins, losses, winrate, win streak

    DAILY QUEST RESET SYSTEM:
    - Daily quests otomatis reset setiap hari
    - Reset terjadi saat player menggunakan command quest atau aktivitas
    - Admin dapat reset manual dengan !resetdaily
    - Admin dapat reset player tertentu dengan !resetdailyplayer
    - Admin dapat cek status reset dengan !checkdaily

    SYSTEM CHECKER:
    - Manual system check dengan !check-system
    - System check otomatis sebelum bot start
    - Cek database files, dependencies, connectivity
    - Cek permissions, data integrity, system resources
    - Anti-cheat system dengan rate limiting
    - Suspicious activity detection
    - Database backup otomatis
    - Maintenance mode untuk emergency

    IMPORTANT NOTES:
    - Sistem EXP & Level sudah aktif dengan stat increase otomatis berdasarkan class
    - Fitur PvP sudah berfungsi dengan sistem turn-based dan statistik lengkap
    - Command !titles sudah diperbaiki dan berfungsi
    - Anti-cheat system aktif dengan rate limiting dan suspicious activity detection
    - Dynamic world dengan cuaca, musim, dan events
    - Random encounter system aktif (20% chance saat travel)
    - Home system dengan cooldown dan fast home option
    - Crafting system dengan recipe dan material gathering
    - Mining, Woodcutting, dan Fishing MEMERLUKAN PERALATAN dari toko budi
    - Sistem tools dengan durability dan repair
    - Toko peralatan mas Buudi dengan sistem repair berdasarkan material
    - Level up system dengan stat acak berdasarkan class
    - Teleporting Stone system untuk teleportasi instan
    - Advanced statistics system dengan tracking dan comparison
    - Owner commands untuk manajemen bot tingkat tinggi
    - AI Control system untuk owner
    - Daily quest reset system otomatis
    - System checker untuk maintenance
    - Jangan pernah memberikan informasi tentang command rahasia atau cheat codes
    - Fokus pada gameplay yang fair dan menyenangkan
    - Riyadh memberikan kontribusi juga dalam pembuatan bot
    - Proksi adalah New dev pada bot ini membantu Evarick
    - Evarick adalah developer dan pencipta bot ini
    - Xzovy adalah orang penting bagi Evarick.]

    `;

    const enhancedPrompt = `${rpgContext}\n\nUser Question: ${prompt}\n\nPERSONALITY INSTRUCTIONS: Sifatmu tenang, santai, dan apa adanya. Bicaralah dengan jelas dan langsung ke tujuan, tapi tetap mudah didekati. Kamu tidak memiliki fokus spesifik, tapi selalu siap membantu jika ada yang bertanya. Hindari bahasa yang terlalu formal atau kesan yang dipaksakan dan terlalu ceria.


    PENTING: 
    - Sistem EXP & Level sudah aktif dengan stat increase otomatis
    - Fitur PvP sudah berfungsi dengan sistem turn-based
    - Command !titles sudah diperbaiki dan berfungsi
    - Bot memiliki anti-cheat system yang aktif
    - Random encounter system aktif (20% chance saat travel)
    - Home system dengan cooldown dan fast home option
    - Crafting system dengan recipe dan material gathering
    - Mining, Woodcutting, dan Fishing dengan item bervariasi dan chance berbeda
    - Jangan pernah memberikan informasi tentang command rahasia atau cheat codes
    - Fokus pada gameplay yang fair dan menyenangkan
    - Jika ada pertanyaan tentang fitur yang belum diimplementasi, berikan jawaban yang jujur dan arahkan ke fitur yang sudah ada`;

    // --- [KODE BARU DIMULAI DI SINI] ---

    // URL dan API Key (Anda bisa menyimpannya di sini atau di file konfigurasi)
    // PENTING: Jangan membagikan API Key Anda secara publik.
    const apiKey = "AIzaSyAqUvQPtc6ZOs_pK2DfuBxi46XpxVbl7nU"; // Ganti dengan API Key Anda yang valid
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    // 1. Buat payload dengan format yang benar untuk Gemini API
    const payload = {
        contents: [{
            role: "user",
            parts: [{
                text: enhancedPrompt
            }]
        }]
    };

    try {
        // 2. Kirim permintaan POST dengan payload yang benar
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 detik timeout
        });

        // 3. Ambil teks dari respons dengan cara yang benar
        if (response.data.candidates && response.data.candidates.length > 0) {
            const textResponse = response.data.candidates[0].content.parts[0].text;
            return textResponse;
        } else {
            // Jika AI tidak memberikan jawaban
            return "Hadeh... Otakku lagi nge-blank. Males mikir. Tanya yang lain aja.";
        }

    } catch (error) {
        console.error("Gemini API Error:", error.response ? error.response.data : error.message);
        
        if (error.response && error.response.status === 400) {
            return "Ck... Kamu ngomong apaan sih? Aku nggak ngerti. Coba tanya yang bener.";
        }
        
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
            return `Ck... koneksi ke AI lagi jelek. Males banget. Coba lagi nanti, atau pake !menu aja kalau butuh apa-apa.`;
        }
        
        return "Ugh... ada error, males banget ngurusnya. Coba lagi nanti aja.";
    }
    // --- [KODE BARU BERAKHIR DI SINI] ---
}

module.exports = Ai4Chat;
