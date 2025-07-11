const axios = require('axios');

/**
 * AI Roleplay Chat khusus private WhatsApp
 * Karakter: Cewek tomboy, calm, santai, suka ngobrol, tidak terlalu formal, tidak terlalu ceria, tidak kaku
 * Hanya untuk chat biasa (bukan command, bukan grup)
 *
 * @param {string} prompt - Pesan user
 * @param {Array<{role: 'user'|'bot', text: string}>} history - Riwayat chat (opsional)
 * @returns {Promise<string>} Balasan AI
 */
async function Ai4ChatRoleplay(prompt, history = null) {
    // Bangun konteks roleplay
    let enhancedPrompt = '';
    if (history && Array.isArray(history) && history.length > 0) {
        const context = history.map(msg => `${msg.role === 'user' ? 'Kamu' : 'Rai'}: ${msg.text}`).join('\n');
        enhancedPrompt = `Kamu adalah Ray, cowok softboy, baik banget, kalem, suka ngobrol santai, perhatian, dan tidak terlalu formal. Jawab dengan gaya santai, tidak terlalu ceria, tidak kaku, dan tetap ramah.

Percakapan sebelumnya:
${context}

User: ${prompt}
Ray:`;
    } else {
        enhancedPrompt = `Kamu adalah Ray, cowok softboy, baik banget, kalem, suka ngobrol santai, perhatian, dan tidak terlalu formal. Jawab dengan gaya santai, tidak terlalu ceria, tidak kaku, dan tetap ramah, berusaha menyenangkan hati pengguna.

User: ${prompt}
Ray:`;
    }

    const apiKey = "...";
    const apiUrl = `...`;
    const payload = {
        contents: [{
            role: "user",
            parts: [{ text: enhancedPrompt }]
        }]
    };
    try {
        const response = await axios.post(apiUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        if (response.data.candidates && response.data.candidates.length > 0) {
            const textResponse = response.data.candidates[0].content.parts[0].text;
            return textResponse;
        } else {
            return "Maaf ya, aku lagi nggak bisa mikir. Coba tanya yang lain, aku pasti bantu sebisaku nanti.";
        }
    } catch (error) {
        if (error.response && error.response.status === 400) {
            return "Hehe, kayaknya aku belum ngerti maksudmu. Bisa dijelasin lagi, nggak?";
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
            return "Aduh, koneksi aku lagi nggak bagus nih. Nanti aku balas lagi ya, jangan kapok ngobrol sama aku.";
        }
        return "Maaf ya, aku lagi error. Tapi aku bakal coba bantu lagi nanti. Makasih udah sabar nungguin aku.";
    }
}

module.exports = Ai4ChatRoleplay; 
