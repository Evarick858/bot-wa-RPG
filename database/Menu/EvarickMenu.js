/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ███████╗██╗   ██╗ █████╗ ██████╗ ██╗  ██████╗██╗  ██╗                          ║
║  ██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔════╝██║ ██╔╝                          ║
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

global.evarickmenu = `*Evarick RPG Bot*

*👤 Karakter*
> !daftar [nama] - Daftar sebagai pemain baru.
> !profile - Lihat profil & status lengkap.
> !status / !me - Lihat status & equipment.
> !tas - Lihat isi tas & gold.
> !heal - Pulihkan HP di lokasi aman (30% HP, 1 jam cooldown).

*⚔️ Class System*
> !class [nama] - Pilih/ganti class (70k gold).
> !classes - Info semua class tersedia.

*🏆 Title System*
> !titles - Lihat title yang dimiliki.
> !titleinfo - Info semua title tersedia.

*📊 Advanced Statistics*
> !stats - Statistik lengkap dengan tracking.
> !stats compare [player] - Bandingkan stats dengan player lain.
> !stats history - Riwayat stats 7 hari.
> !stats detailed - Statistik sangat detail.

*🎁 Daily & Weekly Rewards*
> !daily - Klaim hadiah harian.
> !dailyinfo - Info hadiah harian.
> !weekly - Klaim hadiah mingguan.
> !weeklyclaim - Klaim hadiah mingguan.
> !weeklyinfo - Info hadiah mingguan.
> !streak - Lihat streak harian.

*🏅 Achievement System*
> !achievements - Lihat semua achievement.
> !achievement [id] - Info detail achievement.
> !achievement progress - Progress achievement.
> !achievement claim [id] - Klaim reward achievement.

*📋 Quest System*
> !quests - Lihat quest yang tersedia.
> !quest [id] - Info detail quest.
> !quest accept [id] - Terima quest.
> !quest complete [id] - Selesaikan quest.
> !quest progress - Progress quest aktif.
> !quest abandon [id] - Batalkan quest.
> !quest daily - Lihat daily quests.
> !quest weekly - Lihat weekly quests.
> !quest story - Lihat story quests.
> !quest claim all - Klaim semua reward selesai.
> !quest take [id] - Ambil story quest.

*🔄 Daily Quest Reset System*
- Daily quests otomatis reset setiap hari
- Reset terjadi saat player menggunakan command quest atau aktivitas
- Admin dapat reset manual dengan !resetdaily
- Admin dapat reset player tertentu dengan !resetdailyplayer
- Admin dapat cek status reset dengan !checkdaily

*🤝 Trade System*
> !trade offer [player] [item] [amount] [price] - Tawarkan item untuk dijual.
> !trade offer [player] [item] [amount] for [item2] [amount2] - Tawarkan barter item.
> !trade gift [player] [item] [amount] - Kirim hadiah item gratis.
> !trade accept [player] - Terima tawaran trade.
> !tradeaccept [player] - Terima tawaran trade (alternatif).
> !trade decline [player] - Tolak tawaran trade.
> !tradedecline [player] - Tolak tawaran trade (alternatif).
> !trade offers - Lihat tawaran yang menunggu.
> !tradeoffers - Lihat tawaran yang menunggu (alternatif).
> !trade view [player] - Lihat detail tawaran.
> !tradeview [player] - Lihat detail tawaran (alternatif).
> !trade history - Riwayat trade.
> !tradehistory - Riwayat trade (alternatif).

*👥 Social Features*
> !friend - Sistem pertemanan.
> !friend add [nama] - Tambah teman.
> !friend accept [nama] - Terima permintaan teman.
> !friend decline [nama] - Tolak permintaan teman.
> !friend list - Daftar teman.
> !friend requests - Lihat permintaan pertemanan.
> !friend gift [nama] [item] - Kirim hadiah.
> !friend block [nama] - Blokir teman.
> !friend unblock [nama] - Unblokir teman.

*🌍 Dynamic World*
> !world - Info dunia lengkap.
> !weather - Cuaca saat ini.
> !time - Waktu dunia.
> !season - Musim saat ini.
> !events - Event yang sedang berlangsung.

*⚔️ PvP Arena*
> !pvp - Menu PvP arena.
> !pvp list - Lihat daftar player yang bisa ditantang.
> !pvp challenge [player] - Tantang player.
> !pvp accept [player] - Terima tantangan.
> !pvp decline [player] - Tolak tantangan.
> !pvp pending - Lihat tantangan yang menunggu.
> !pvp ranking - Ranking PvP.
> !pvp history - Riwayat pertarungan.
> !serang - Serang lawan di PvP.
> !item - Gunakan item di PvP.
> !menyerah - Menyerah di PvP.
> !skill - Gunakan skill di PvP.

*🏆 Leaderboard*
> !leaderboard / !rank / !toplevel / !levelboard - Ranking berdasarkan gold.
> !leaderboard pvp - Ranking berdasarkan rating PvP tertinggi.
> !leaderboard level - Ranking berdasarkan level.
> !leaderboard monsterKills - Ranking berdasarkan monster kills.
> !leaderboard miningCount - Ranking berdasarkan mining.
> !leaderboard woodcuttingCount - Ranking berdasarkan woodcutting.
> !leaderboard fishingCount - Ranking berdasarkan fishing.

*🗺️ Eksplorasi*
> !lokasi - Lihat info lokasi saat ini.
> !travel [lokasi] - Pergi ke lokasi lain (20% chance random encounter).
> !home - Kembali ke Desa Awal (10 gold, 30 menit cooldown).
> !home fast - Kembali cepat dengan 60 gold.

*🔮 LOKASI KHUSUS - PERPUSTAKAAN BEKU*
> Rute: Desa Awal → Hutan Rindang → Gunung Batu → Lereng Bersalju → Kuil Beku → Altar Es → Perpustakaan Beku
> !shop - Toko Teleportasi (hanya di Perpustakaan Beku)
> !buy Teleporting Stone [jumlah] - Beli item teleportasi (5000 gold)

*⚔️ Aksi & Combat*
> !hunt - Berburu monster.
> !nambang - Menambang mineral.
> !nebang - Menebang kayu.
> !mancing - Memancing ikan.
> !fight - Mulai pertarungan dengan monster (random encounter).
> !flee - Kabur dari pertarungan.

*📊 Activity Statistics*
> !miningstats - Statistik mining.
> !woodcuttingstats - Statistik woodcutting.
> !fishingstats - Statistik fishing.

*🛡️ Equipment*
> !equip [nama item] - Pakai equipment.
> !equip title [nama] - Pasang title (maksimal 3).
> !unequip [slot] - Lepas equipment.
> !unequip title [nama] - Lepas title.
> !title - Manajemen title (list, equipped).
> !pakai [nama item] - Gunakan item consumable.

*🔧 Crafting System*
> !craft / !crafting - Sistem crafting.
> !craft [item] [amount] - Craft item.
> !craft list [kategori] - Lihat daftar item craftable.
> !craft info [nama item] - Info detail item craftable.

*🏪 Ekonomi*
> !shop - Lihat toko di Desa Awal.
> !shopinfo - Info detail toko dinamis.
> !buy [item] [jumlah] - Beli item.
> !sell [item] [jumlah] - Jual item.
> !sell all - Jual semua item yang bisa dijual.
> !sell all loot - Jual semua loot monster saja.
> !sell all resource - Jual semua resource dari mancing, nambang, nebang.
> !sell tools - Jual semua peralatan.
> !sell tool [nama] - Jual peralatan tertentu.

*🔧 Toko Peralatan*
> !toko - Lihat bantuan cara mengakses !tokosihir dan !tokoalat.
> !repair [nama peralatan] - Perbaiki durability peralatan (hanya di toko budi).

*🔧 Admin Commands*
> !admin - Panel admin (hanya admin).
> !admin stats - Database statistics.
> !admin backup - Create backup.
> !admin restore [backup_id] - Restore from backup.
> !admin cleanup - Clean old data.
> !admin optimize - Optimize database.
> !admin ban/unban - Moderation tools.
> !admin give [player] [item] [amount] - Give item.
> !admin take [player] [item] [amount] - Take item.
> !admin gold [player] [amount] - Set gold.
> !admin level [player] [level] - Set level.
> !admin exp [player] [amount] - Add experience.
> !admin title [player] [title] - Add title.
> !admin logs - View suspicious activity.
> !admin logs [player] - View player logs.
> !admin rate [command] [limit] - Set rate limit.
> !admin whitelist [player] - Whitelist player.
> !admin blacklist [player] - Blacklist player.
> !admin activity [player] - View player activity.
> !admin claimadmin - Klaim title admin.
> !resetdaily - Reset daily quest semua player.
> !resetdailyplayer [nama] - Reset daily quest player tertentu.
> !checkdaily - Cek status daily quest semua player.
> !checkdaily [nama] - Cek status daily quest player tertentu.

*🤖 AI Control System (Owner Only)*
> !ai !aihelp - Help AI control commands.
> !ai !aisystem - Info sistem real-time.
> !ai !ailogs - Lihat log AI commands.
> !ai !send [target] [message] - Kirim pesan ke user/group.
> !ai !broadcast [message] - Broadcast ke semua player.
> !ai !aiplayer give [number] [item] [amount] - Berikan item ke player.
> !ai !aiplayer gold [number] [amount] - Tambah gold player.
> !ai !aiplayer level [number] [level] - Set level player.
> !ai !aiplayer ban [number] - Ban player.
> !ai !aiplayer unban [number] - Unban player.
> !ai !aibot restart - Restart bot.
> !ai !aibot maintenance [on/off] - Control maintenance mode.
> !ai !aibot backup - Buat backup database.
> !ai !aievent [type] [message] - Buat event dan broadcast.

*🔍 System Checker*
> !check-system - Manual system check (terminal).
> System check otomatis sebelum bot start.
> Cek database files, dependencies, connectivity.
> Cek permissions, data integrity, system resources.
> Anti-cheat system dengan rate limiting.
> Suspicious activity detection.
> Database backup otomatis.
> Maintenance mode untuk emergency.

*👥 Group Commands*
> !group - Info grup.

*⚙️ Utility Commands*
> !ai [pertanyaan] - AI Chat Assistant.
> !ttdl [url] - Download TikTok video.
> !igdl [url] - Download Instagram post.
> !tebakangka / !tebak - Game tebak angka.
> !quote - Quote inspiratif.

*🔒 Anti-Cheat System*
- Rate limiting untuk mencegah spam
- Suspicious activity detection
- Admin moderation tools
- Database backup otomatis
- Player activity logging
- System checker otomatis
- Maintenance mode protection
- AI command logging & audit
- Owner-only access control

*🌍 Dynamic World Features*
- Cuaca dinamis mempengaruhi gameplay
- Waktu dunia (pagi/siang/malam)
- Musim yang berubah setiap 3 bulan
- Event dunia acak dengan bonus
- Random encounter saat travel (20% chance)

*⚔️ PvP Arena Features*
- Sistem rating ELO
- Challenge & accept battles
- Ranking top 20 players
- Riwayat pertarungan lengkap
- Statistik win/loss/draw
- Turn-based combat system

*🎁 Reward System Features*
- Daily rewards dengan streak bonus
- Weekly rewards dengan milestone
- Achievement system dengan rewards
- Quest system dengan rewards dinamis
- Title system dengan berbagai kategori

*🤝 Trade System Features*
- Item-for-gold trading
- Item-for-item bartering
- Free item gifting
- Trade validation & anti-cheat
- Trade history tracking

*🔧 Crafting System Features*
- Crafting station di Desa Awal
- Recipe system untuk membuat item
- Material gathering dari berbagai aktivitas
- Crafted items lebih powerful dari shop items
- Multiple crafting categories

*📊 Statistics Tracking*
- Mining statistics dengan tracking
- Woodcutting statistics dengan tracking
- Fishing statistics dengan tracking
- Activity history dan progress
- Advanced stats comparison
- Stats history tracking

*⚔️ Combat System*
- Turn-based combat system
- Equipment stats integration
- Monster encounter system
- Flee mechanism
- Combat rewards

*🔧 Tools System Features*
- Peralatan dengan durability (pancingan, kapak, beliung)
- Sistem tier: Kayu → Batu → Besi → Diamond → Netherite
- Durability berkurang setiap penggunaan
- Peralatan rusak otomatis saat durability habis
- Sistem repair dengan material
- Toko khusus peralatan di "Toko peralatan mas Buudi"

*🎯 Activity Requirements*
- !mancing memerlukan pancingan
- !nebang memerlukan kapak
- !nambang memerlukan beliung
- Peralatan dengan tier lebih tinggi memberikan bonus stats
- Durability berkurang setiap aktivitas

*📈 Level Up System*
- Sistem level up otomatis
- Stat acak berdasarkan class saat level up
- Assassin: 70% attack, 20% hp, 10% defense
- Tank: 70% hp, 20% defense, 10% attack
- Mage: 70% magic, 20% mp, 10% attack
- Archer: 70% attack, 20% accuracy, 10% hp
- Warrior: 50% attack, 30% hp, 20% defense

*🏪 Shop System Features*
- Toko dinamis dengan harga berubah
- Shop info dengan detail harga
- Multiple shop locations
- Specialized shops (tools, equipment, etc.)
- Buy/sell system dengan validation

*🎮 Game Features*
- Multiple locations untuk eksplorasi
- Random encounter system
- Dynamic weather effects
- Seasonal events
- Achievement system
- Quest system
- Title system
- PvP arena
- Trade system
- Crafting system
- Tools system dengan durability
- Level up system dengan stat acak
- Advanced statistics tracking
- Anti-cheat system
- Admin panel
- Owner panel
- AI Control system
- System checker otomatis
- Database backup system
- Daily quest reset system
- Maintenance mode
- Emergency response system

*🎯 Usage Tips*
- Gunakan !menu untuk melihat semua command
- Check !lokasi untuk info lokasi saat ini
- Use !travel untuk eksplorasi
- Monitor durability peralatan dengan !tas
- Repair peralatan di toko budi sebelum rusak
- Complete daily/weekly quests untuk rewards
- Participate in PvP untuk ranking
- Trade items dengan player lain
- Craft items untuk stats lebih baik
- Join events untuk bonus rewards
- Daily quests reset otomatis setiap hari
- Gunakan !quest daily untuk melihat daily quests
- Admin dapat reset daily quest manual jika diperlukan
- Owner dapat menggunakan AI Control untuk manajemen bot
- System check otomatis sebelum bot start
- Maintenance mode untuk emergency situations
- Backup database secara berkala

*⚠️ Important Notes*
- Peralatan rusak otomatis saat durability habis
- Durability tidak bisa diperbaiki setelah rusak total
- Beli peralatan baru di toko budi
- Repair hanya bisa dilakukan di toko budi
- Tier peralatan mempengaruhi efektivitas aktivitas
- Class mempengaruhi stat yang bertambah saat level up
- Daily/weekly rewards memiliki cooldown
- PvP battles bersifat turn-based
- Trade system memiliki anti-cheat
- Admin commands hanya untuk admin
- Owner commands hanya untuk owner
- AI Control commands hanya untuk owner
- Daily quests reset otomatis setiap hari pada pukul 00:00
- Progress daily quest hilang jika tidak diklaim sebelum reset
- Admin dapat reset daily quest manual untuk maintenance
- System check otomatis mencegah bot crash
- Maintenance mode memblokir user non-owner
- AI commands dicatat untuk audit trail
- Backup database sebelum operasi besar

*🎮 Have Fun Playing!*
- Explore the world
- Level up your character
- Collect rare items
- Battle other players
- Complete achievements
- Trade with friends
- Craft powerful equipment
- Master your class
- Earn prestigious titles
- Become the strongest player!
- Use AI Control for bot management (Owner)
- Monitor system health
- Manage player data efficiently
- Create amazing events

*📞 Support*
- Join WhatsApp group for help
- Check Discord server for updates
- Follow YouTube for tutorials
- Follow Instagram for news
- Report bugs to admin

*🔄 Updates*
- Regular feature updates
- Bug fixes
- Balance adjustments
- New content additions
- Performance improvements
- Security enhancements
- AI Control system
- System checker integration
- Owner panel features
- Maintenance mode system
- Enhanced anti-cheat
- Advanced logging system

*🎯 Goals*
- Reach max level
- Collect all achievements
- Win PvP tournaments
- Complete all quests
- Master all classes
- Get all titles
- Craft legendary items
- Become top player
- Help new players
- Contribute to community
- Master AI Control system (Owner)
- Maintain system stability
- Create engaging events
- Build strong community

*🌟 Special Thanks*
- Thanks to all players
- Thanks to beta testers
- Thanks to community
- Thanks to supporters
- Thanks to contributors
- Thanks to everyone who helped
- Thanks to AI development team
- Thanks to system security experts
- Thanks to bot management team

*🎉 Enjoy Your Adventure!*
- May your journey be epic
- May your battles be victorious
- May your loot be legendary
- May your friends be true
- May your achievements be many
- May your fun be endless!
- May your bot management be efficient
- May your system be stable
- May your community thrive!

*🏆 Good Luck, Adventurer!* 🎮⚔️🏰`;