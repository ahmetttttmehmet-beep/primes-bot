require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Botun çalışıp çalışmadığını test eder'),
    new SlashCommandBuilder().setName('destek-paneli-kur').setDescription('Destek panelini kurar.').addChannelOption(option => option.setName('kanal').setDescription('Kanal').addChannelTypes(ChannelType.GuildText).setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('klan-paneli-kur').setDescription('Klan alım panelini kurar.').addChannelOption(option => option.setName('kanal').setDescription('Kanal').addChannelTypes(ChannelType.GuildText).setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    new SlashCommandBuilder().setName('sestop').setDescription('Ses kanallarında geçirdiğiniz süreyi gösterir.'),
    new SlashCommandBuilder().setName('çekiliş').setDescription('Yeni bir çekiliş başlatır.')
        .addStringOption(option => option.setName('süre').setDescription('Çekiliş süresi (örn: 10m, 1h, 1d)').setRequired(true))
        .addIntegerOption(option => option.setName('kazanan_sayisi').setDescription('Kaç kazanan olacak?').setRequired(true))
        .addStringOption(option => option.setName('ödül').setDescription('Çekiliş ödülü nedir?').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    // --- OYUN KOMUTLARI ---
    new SlashCommandBuilder().setName('sayi-saymaca-baslat').setDescription('Sayı saymaca oyununu başlatır.'),
    new SlashCommandBuilder().setName('bom-baslat').setDescription('Bom oyununu başlatır.'),
    new SlashCommandBuilder().setName('kelime-turetmece-baslat').setDescription('Kelime türetmece oyununu başlatır.'),
    // --- MODERASYON KOMUTLARI ---
    new SlashCommandBuilder()
        .setName('sil')
        .setDescription('Belirtilen miktarda mesajı siler.')
        .addIntegerOption(option => 
            option.setName('sayi')
                .setDescription('Silinecek mesaj sayısı (1-100 arası)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Mevcut kanalı sıfırlar ve yeni, boş bir kanal açar.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Slash komutları Discord\'a gönderiliyor...');
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Başarılı! Komutlar kaydedildi.');
    } catch (error) { console.error('❌ HATA:', error); }
})();