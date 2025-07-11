/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ███████╗██╗   ██╗ █████╗ ██████╗ ██╗  ██████╗██╗  ██╗                         ║
║  ██╔════╝██║   ██║██╔══██╗██╔══██╗██║ ██╔════╝██║ ██╔╝                         ║
║  █████╗  ██║   ██║███████║██████╔╝██║ ██║     █████╔╝                         ║
║  ██╔══╝  ╚██╗ ██╔╝██╔══██║██╔══██╗██║ ██║     ██╔═██╗                         ║
║  ███████╗ ╚████╔╝ ██║  ██║██║  ██║██║ ╚██████╗██║  ██╗                        ║
║  ╚══════╝  ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═════╝╚═╝  ╚═╝                        ║
║                                                                              ║
║  🎮 RPG WhatsApp Bot - Created by Evarick                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

// Resep crafting yang lebih logis, hanya menggunakan item/material dari items.js
define = (id, nama, kategori, bahan, gold, level, hasil) => ({id, nama, kategori, bahan, gold, level, hasil});

const craftingRecipes = [
    // Senjata & Alat Dasar
    define("pedang_kayu", "Pedang Kayu", "Peralatan", { "Kayu": 8 }, 0, 1, "Pedang Kayu"),
    define("tongkat_kayu", "Tongkat Kayu", "Peralatan", { "Kayu": 5 }, 0, 1, "Tongkat Kayu"),
    define("belati_kayu", "Belati Kayu", "Peralatan", { "Kayu": 4 }, 0, 1, "Belati Kayu"),
    define("busur_kayu", "Busur Kayu", "Peralatan", { "Kayu": 6, "Ranting": 2 }, 0, 1, "Busur Kayu"),
    define("kapak_kayu", "Kapak Kayu", "Peralatan", { "Kayu": 6, "Batu": 2 }, 0, 1, "Kapak Kayu"),
    define("beliung_kayu", "Beliung Kayu", "Peralatan", { "Kayu": 6, "Batu": 3 }, 0, 1, "Beliung Kayu"),
    define("sekop_kayu", "Sekop Kayu", "Peralatan", { "Kayu": 4, "Batu": 1 }, 0, 1, "Sekop Kayu"),

    // Armor & Equipment Dasar
    define("zirah_kulit", "Zirah Kulit", "Peralatan", { "Kulit Serigala": 8 }, 50, 3, "Zirah Kulit"),
    define("helem_kulit", "Helem Kulit", "Peralatan", { "Kulit Serigala": 4 }, 30, 2, "Helem Kulit"),
    define("celana_kain", "Celana Kain", "Peralatan", { "Kulit Serigala": 2, "Kayu": 2 }, 20, 2, "Celana Kain"),
    define("sepatu_kulit", "Sepatu Kulit", "Peralatan", { "Kulit Serigala": 2 }, 20, 2, "Sepatu Kulit"),

    // Aksesoris
    define("cincin_perak", "Cincin Perak", "Peralatan", { "Batu Permata": 1, "Batu": 2 }, 200, 5, "Cincin Perak"),
    define("kalung_kayu", "Kalung Kayu", "Peralatan", { "Kayu": 2, "Ranting": 1 }, 50, 2, "Kalung Kayu"),

    // Potion & Consumable
    define("potion_hp", "Potion HP", "Consumable", { "Ikan Mas": 2, "Kayu": 1 }, 10, 1, "Potion HP"),
    define("potion_mana", "Potion Mana", "Consumable", { "Ikan Mas": 1, "Batu Permata": 1 }, 15, 1, "Potion Mana"),
    // Potion Stamina
    define("potion_stamina", "Potion Stamina", "Consumable", { "Ikan Mas": 2, "Ranting": 1 }, 15, 1, "Potion Stamina"),
    // Elixir Kekuatan
    define("elixir_kekuatan", "Elixir Kekuatan", "Consumable", { "Ikan Kakap": 1, "Batu Safir": 1 }, 50, 5, "Elixir Kekuatan"),
    // Elixir Pertahanan
    define("elixir_pertahanan", "Elixir Pertahanan", "Consumable", { "Ikan Kakap": 1, "Batu": 2 }, 50, 5, "Elixir Pertahanan")
    // Tambahkan resep lain sesuai kebutuhan, pastikan semua bahan dan hasil ada di items.js
];

module.exports = {
    craftingRecipes
};