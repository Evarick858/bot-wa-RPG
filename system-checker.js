const fs = require('fs');
const path = require('path');
const axios = require('axios');

class SystemChecker {
    constructor() {
        this.checkResults = {
            database: {},
            files: {},
            dependencies: {},
            connectivity: {},
            permissions: {},
            overall: { status: 'pending', issues: [] }
        };
    }

    // Pengecekan Database Files
    async checkDatabaseFiles() {
        console.log('🔍 Memeriksa file database...');
        
        const requiredFiles = [
            './database/rpg/players.json',
            './database/rpg/players_backup.json',
            './database/rpg/items.js',
            './database/rpg/locations.js',
            './database/rpg/enemies.js',
            './database/rpg/skills.js',
            './database/rpg/crafting.js',
            './database/rpg/pets.js',
            './database/rpg/logs.json',
            './database/rpg/pvp_season.json',
            './database/Menu/EvarickMenu.js'
        ];

        for (const file of requiredFiles) {
            try {
                if (fs.existsSync(file)) {
                    const stats = fs.statSync(file);
                    const size = stats.size;
                    
                    this.checkResults.database[file] = {
                        status: 'OK',
                        size: size,
                        lastModified: stats.mtime
                    };

                    // Pengecekan khusus untuk file JSON
                    if (file.endsWith('.json')) {
                        try {
                            const content = fs.readFileSync(file, 'utf8');
                            JSON.parse(content);
                            this.checkResults.database[file].validJson = true;
                        } catch (jsonError) {
                            this.checkResults.database[file].status = 'ERROR';
                            this.checkResults.database[file].error = 'Invalid JSON format';
                            this.checkResults.overall.issues.push(`Invalid JSON in ${file}`);
                        }
                    }
                } else {
                    this.checkResults.database[file] = {
                        status: 'MISSING',
                        error: 'File tidak ditemukan'
                    };
                    this.checkResults.overall.issues.push(`Missing file: ${file}`);
                }
            } catch (error) {
                this.checkResults.database[file] = {
                    status: 'ERROR',
                    error: error.message
                };
                this.checkResults.overall.issues.push(`Error accessing ${file}: ${error.message}`);
            }
        }
    }

    // Pengecekan Dependencies
    async checkDependencies() {
        console.log('📦 Memeriksa dependencies...');
        
        const requiredDependencies = [
            'baileys',
            'axios',
            'chalk',
            'pino',
            'readline'
        ];

        for (const dep of requiredDependencies) {
            try {
                require.resolve(dep);
                this.checkResults.dependencies[dep] = {
                    status: 'OK',
                    installed: true
                };
            } catch (error) {
                this.checkResults.dependencies[dep] = {
                    status: 'MISSING',
                    installed: false,
                    error: 'Dependency tidak terinstall'
                };
                this.checkResults.overall.issues.push(`Missing dependency: ${dep}`);
            }
        }
    }

    // Pengecekan File Utama
    async checkMainFiles() {
        console.log('📁 Memeriksa file utama...');
        
        const mainFiles = [
            './index.js',
            './Evarick.js',
            './len.js',
            './package.json'
        ];

        for (const file of mainFiles) {
            try {
                if (fs.existsSync(file)) {
                    const stats = fs.statSync(file);
                    this.checkResults.files[file] = {
                        status: 'OK',
                        size: stats.size,
                        lastModified: stats.mtime
                    };
                } else {
                    this.checkResults.files[file] = {
                        status: 'MISSING',
                        error: 'File tidak ditemukan'
                    };
                    this.checkResults.overall.issues.push(`Missing main file: ${file}`);
                }
            } catch (error) {
                this.checkResults.files[file] = {
                    status: 'ERROR',
                    error: error.message
                };
                this.checkResults.overall.issues.push(`Error accessing ${file}: ${error.message}`);
            }
        }
    }

    // Pengecekan Konektivitas
    async checkConnectivity() {
        console.log('🌐 Memeriksa konektivitas...');
        
        const testUrls = [
            'https://api.github.com',
            'https://httpbin.org/get'
        ];

        for (const url of testUrls) {
            try {
                const response = await axios.get(url, { timeout: 5000 });
                this.checkResults.connectivity[url] = {
                    status: 'OK',
                    responseTime: response.headers['x-response-time'] || 'N/A',
                    statusCode: response.status
                };
            } catch (error) {
                this.checkResults.connectivity[url] = {
                    status: 'ERROR',
                    error: error.message
                };
                this.checkResults.overall.issues.push(`Connectivity issue with ${url}: ${error.message}`);
            }
        }
    }

    // Pengecekan Permissions
    async checkPermissions() {
        console.log('🔐 Memeriksa permissions...');
        
        const testPaths = [
            './database',
            './database/rpg',
            './database/Menu',
            './database/image'
        ];

        for (const testPath of testPaths) {
            try {
                if (fs.existsSync(testPath)) {
                    // Test read permission
                    fs.accessSync(testPath, fs.constants.R_OK);
                    
                    // Test write permission
                    const testFile = path.join(testPath, '.test_write');
                    fs.writeFileSync(testFile, 'test');
                    fs.unlinkSync(testFile);
                    
                    this.checkResults.permissions[testPath] = {
                        status: 'OK',
                        readable: true,
                        writable: true
                    };
                } else {
                    this.checkResults.permissions[testPath] = {
                        status: 'MISSING',
                        error: 'Directory tidak ditemukan'
                    };
                    this.checkResults.overall.issues.push(`Missing directory: ${testPath}`);
                }
            } catch (error) {
                this.checkResults.permissions[testPath] = {
                    status: 'ERROR',
                    error: error.message
                };
                this.checkResults.overall.issues.push(`Permission issue with ${testPath}: ${error.message}`);
            }
        }
    }

    // Pengecekan Data Integrity
    async checkDataIntegrity() {
        console.log('🔍 Memeriksa integritas data...');
        
        try {
            // Pengecekan players.json
            const playersPath = './database/rpg/players.json';
            if (fs.existsSync(playersPath)) {
                const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf8'));
                
                // Pengecekan struktur data
                let playerCount = 0;
                let corruptedPlayers = 0;
                
                for (const [playerId, playerData] of Object.entries(playersData)) {
                    playerCount++;
                    
                    // Pengecekan field wajib
                    const requiredFields = ['nama', 'level', 'gold', 'hp', 'maxHp', 'exp'];
                    const missingFields = requiredFields.filter(field => !playerData.hasOwnProperty(field));
                    
                    if (missingFields.length > 0) {
                        corruptedPlayers++;
                        this.checkResults.overall.issues.push(`Player ${playerId} missing fields: ${missingFields.join(', ')}`);
                    }
                }
                
                this.checkResults.database['players_integrity'] = {
                    status: corruptedPlayers === 0 ? 'OK' : 'WARNING',
                    totalPlayers: playerCount,
                    corruptedPlayers: corruptedPlayers,
                    integrityPercentage: ((playerCount - corruptedPlayers) / playerCount * 100).toFixed(2) + '%'
                };
            }
        } catch (error) {
            this.checkResults.overall.issues.push(`Data integrity check failed: ${error.message}`);
        }
    }

    // Pengecekan Memory dan Disk Space
    async checkSystemResources() {
        console.log('💾 Memeriksa resources sistem...');
        
        try {
            // Pengecekan disk space untuk direktori database
            const databasePath = './database';
            if (fs.existsSync(databasePath)) {
                const stats = fs.statSync(databasePath);
                const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
                
                this.checkResults.system = {
                    databaseSize: sizeInMB + ' MB',
                    status: 'OK'
                };
                
                // Warning jika database terlalu besar
                if (parseFloat(sizeInMB) > 100) {
                    this.checkResults.system.status = 'WARNING';
                    this.checkResults.system.warning = 'Database size is large, consider cleanup';
                    this.checkResults.overall.issues.push('Database size is large (>100MB)');
                }
            }
        } catch (error) {
            this.checkResults.overall.issues.push(`System resource check failed: ${error.message}`);
        }
    }

    // Menjalankan semua pengecekan
    async runAllChecks() {
        console.log('🚀 Memulai sistem pengecekan otomatis Evarick Bot...\n');
        
        const startTime = Date.now();
        
        await this.checkMainFiles();
        await this.checkDatabaseFiles();
        await this.checkDependencies();
        await this.checkConnectivity();
        await this.checkPermissions();
        await this.checkDataIntegrity();
        await this.checkSystemResources();
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Menentukan status overall
        const totalIssues = this.checkResults.overall.issues.length;
        if (totalIssues === 0) {
            this.checkResults.overall.status = 'READY';
        } else if (totalIssues <= 3) {
            this.checkResults.overall.status = 'WARNING';
        } else {
            this.checkResults.overall.status = 'CRITICAL';
        }
        
        this.checkResults.overall.duration = duration + 'ms';
        this.checkResults.overall.totalIssues = totalIssues;
        
        return this.checkResults;
    }

    // Generate laporan pengecekan
    generateReport() {
        const results = this.checkResults;
        let report = '';
        
        report += '╔══════════════════════════════════════════════════════════════════════════════╗\n';
        report += '║                           EVARICK BOT SYSTEM CHECK REPORT                   ║\n';
        report += '╚══════════════════════════════════════════════════════════════════════════════╝\n\n';
        
        // Overall Status
        const statusEmoji = {
            'READY': '✅',
            'WARNING': '⚠️',
            'CRITICAL': '❌',
            'pending': '⏳'
        };
        
        report += `${statusEmoji[results.overall.status]} *OVERALL STATUS: ${results.overall.status}*\n`;
        report += `⏱️ Duration: ${results.overall.duration}\n`;
        report += `🔍 Total Issues: ${results.overall.totalIssues}\n\n`;
        
        // Main Files
        report += '📁 *MAIN FILES:*\n';
        for (const [file, status] of Object.entries(results.files)) {
            const emoji = status.status === 'OK' ? '✅' : '❌';
            report += `${emoji} ${file}: ${status.status}\n`;
        }
        report += '\n';
        
        // Database Files
        report += '🗄️ *DATABASE FILES:*\n';
        for (const [file, status] of Object.entries(results.database)) {
            const emoji = status.status === 'OK' ? '✅' : '❌';
            report += `${emoji} ${file}: ${status.status}`;
            if (status.size) report += ` (${(status.size / 1024).toFixed(2)} KB)`;
            report += '\n';
        }
        report += '\n';
        
        // Dependencies
        report += '📦 *DEPENDENCIES:*\n';
        for (const [dep, status] of Object.entries(results.dependencies)) {
            const emoji = status.installed ? '✅' : '❌';
            report += `${emoji} ${dep}: ${status.status}\n`;
        }
        report += '\n';
        
        // Connectivity
        report += '🌐 *CONNECTIVITY:*\n';
        for (const [url, status] of Object.entries(results.connectivity)) {
            const emoji = status.status === 'OK' ? '✅' : '❌';
            report += `${emoji} ${url}: ${status.status}\n`;
        }
        report += '\n';
        
        // Permissions
        report += '🔐 *PERMISSIONS:*\n';
        for (const [path, status] of Object.entries(results.permissions)) {
            const emoji = status.status === 'OK' ? '✅' : '❌';
            report += `${emoji} ${path}: ${status.status}\n`;
        }
        report += '\n';
        
        // Issues
        if (results.overall.issues.length > 0) {
            report += '⚠️ *ISSUES FOUND:*\n';
            results.overall.issues.forEach((issue, index) => {
                report += `${index + 1}. ${issue}\n`;
            });
            report += '\n';
        }
        
        // Recommendations
        if (results.overall.status === 'READY') {
            report += '🎉 *SYSTEM READY!* Bot dapat diaktifkan dengan aman. silahkan masukkan nomor wa berawalan 62\n';
        } else if (results.overall.status === 'WARNING') {
            report += '⚠️ *SYSTEM WARNING!* Beberapa masalah ditemukan, tetapi bot masih dapat berjalan.\n';
        } else {
            report += '❌ *SYSTEM CRITICAL!* Banyak masalah ditemukan. Perbaiki sebelum mengaktifkan bot.\n';
        }
        
        return report;
    }

    // Simpan laporan ke file
    saveReport() {
        const report = this.generateReport();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `./database/system-check-${timestamp}.txt`;
        
        try {
            fs.writeFileSync(filename, report);
            console.log(`📄 Laporan pengecekan disimpan: ${filename}`);
            return filename;
        } catch (error) {
            console.error('Gagal menyimpan laporan:', error);
            return null;
        }
    }
}

module.exports = SystemChecker; 