require('dotenv').config();
const { Client, GatewayIntentBits, Events, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice'); 
const express = require('express');
const db = require('./database'); 

// --- WEB SUNUCUSU ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot aktif!'));
app.listen(PORT, () => console.log(`🌐 Web sunucusu ${PORT} portunda çalışıyor`));

// --- SİSTEM AYARLARI ---
const AFK_SES_KANAL_ID = '1566432962633793626';
const TICKET_KATEGORI_ID = '1565415594319413468';
const KLAN_BASVURU_KANAL_ID = '1566027816590647398';
const YETKILI_ROL_ID = '1564274267657343056';

// GELEN GİDEN VE OTO ROL İÇİN AYARLAR
const LOG_KANAL_ID = '1564274316315594892'; 
const OTO_ROL_ID = '1564274286800273438'; 

// --- YAPAY ZEKA SOHBET CEVAPLARI (GENİŞLETİLMİŞ HAVUZ) ---
const sohbetCevaplari = {
    selam: [
        "Selam reis, hoş geldin! 👋", "Aleykümselam, umarım iyisindir! 😊", "Selamlar, klan sunucumuza hoş geldin! ⚔️", 
        "Merhaba, iyi ki geldin. Ne var ne yok? 👀", "Selam, bugün nasılsın bakalım? ✨", "Selamlar ortak, nasıl gidiyor? 🤝", 
        "Hoş geldin, selamlar! 🛡️", "Selam dostum, sunucuya renk kattın! 🎨"
    ],
    merhaba: [
        "Merhaba! Nasıl yardımcı olabilirim? 🛡️", "Merhaba reis, hoş geldin. 😎", "Merhabalar, sunucumuza şeref verdin! 🎉",
        "Selamlar, hoş geldin. Destek için buradayım. 🤝", "Merhaba, iyi ki varsın! 🙌", "Merhabalar, bugün nasıl yardımcı olabilirim? 💬",
        "Selamlar, merhabalar! Umarım günün harika geçiyordur. 🌟"
    ],
    naber: [
        "İyidir reis, senden naber? 😎", "Naber hoş geldin! Sunucu hareketlendi. 🎮", "İyiyim, botlar asla yorulmaz bilirsin! 😄",
        "Naber dostum, keyifler yerinde mi? 🔥", "İyiyim çok şükür, sen nasılsın? 🤖"
    ],
    "iyi misin": [
        "Ben bir botum, her zaman %100 çalışırım! Sen nasılsın? 🤖", "Harikayım, umarım sen de iyisindir! ✨",
        "Süperim, sorduğun için teşekkürler! Sen nasılsın? 🌟"
    ],
    sa: [
        "Aleykümselam, hoş geldin! 👋", "As, hoş geldin reis. ⚔️", "Aleykümselam, sunucuya şeref verdin! 🤝",
        "As dostum, nasılsın? 😎", "Aleykümselamlar, hoş geldin! ✨", "As, keyifler yerinde mi? 🔥"
    ],
    "günaydın": [
        "Günaydın reis, harika bir gün olsun! ☀️", "Günaydın! Kahveni aldın mı? ☕", "Günaydınlar, enerjin bol olsun! ⚡"
    ]
};

// --- YARDIMCI FONKSİYONLAR ---
function parseSure(sureStr) {
    const match = sureStr.match(/^(\d+)([smhd])$/i);
    if (!match) return null;
    const deger = parseInt(match[1]);
    const birim = match[2].toLowerCase();
    if (birim === 's') return deger * 1000;
    if (birim === 'm') return deger * 60 * 1000;
    if (birim === 'h') return deger * 60 * 60 * 1000;
    if (birim === 'd') return deger * 24 * 60 * 60 * 1000;
    return null;
}

// --- DISCORD BOT ---
const client = new Client({
    intents: [ 
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers, 
        GatewayIntentBits.GuildVoiceStates 
    ]
});

const sesGirisZamanlari = new Map();

// --- BOT HAZIR OLDUĞUNDA ---
client.once(Events.ClientReady, async (c) => {
    console.log(`✅ ${c.user.tag} olarak giriş yapıldı!`);
    try {
        const kanal = await c.channels.fetch(AFK_SES_KANAL_ID);
        if (kanal) {
            joinVoiceChannel({
                channelId: kanal.id,
                guildId: kanal.guild.id,
                adapterCreator: kanal.guild.voiceAdapterCreator,
                selfDeaf: true, 
            });
            console.log(`🎙️ Bot AFK ses kanalına katıldı: ${kanal.name}`);
        }
    } catch (error) { console.error('Sese girme hatası:', error); }
});

// --- GELEN GİDEN LOG VE OTO ROL ---
client.on(Events.GuildMemberAdd, async (member) => {
    if (OTO_ROL_ID && OTO_ROL_ID !== 'BURAYA_VERILECEK_ROL_ID_YAZ') {
        try { await member.roles.add(OTO_ROL_ID); } catch (e) { console.log('Rol verilemedi:', e); }
    }
    if (LOG_KANAL_ID && LOG_KANAL_ID !== 'BURAYA_LOG_KANAL_ID_YAZ') {
        try {
            const logKanali = await client.channels.fetch(LOG_KANAL_ID);
            if (logKanali) {
                const embed = new EmbedBuilder()
                    .setTitle('📥 Sunucuya Bir Üye Katıldı')
                    .setDescription(`👤 **Kullanıcı:** <@${member.id}> (${member.user.tag})\n🆔 **ID:** ${member.id}\n📅 **Hesap Kurulum:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>\n\n👥 **Güncel Üye Sayısı:** \`${member.guild.memberCount}\``)
                    .setColor('#2ecc71')
                    .setTimestamp();
                await logKanali.send({ embeds: [embed] });
            }
        } catch (e) { console.log('Log kanalına mesaj atılamadı:', e); }
    }
});

client.on(Events.GuildMemberRemove, async (member) => {
    if (LOG_KANAL_ID && LOG_KANAL_ID !== 'BURAYA_LOG_KANAL_ID_YAZ') {
        try {
            const logKanali = await client.channels.fetch(LOG_KANAL_ID);
            if (logKanali) {
                const embed = new EmbedBuilder()
                    .setTitle('📤 Sunucudan Bir Üye Ayrıldı')
                    .setDescription(`👤 **Kullanıcı:** ${member.user.tag}\n🆔 **ID:** ${member.id}\n\n👥 **Güncel Üye Sayısı:** \`${member.guild.memberCount}\``)
                    .setColor('#e74c3c')
                    .setTimestamp();
                await logKanali.send({ embeds: [embed] });
            }
        } catch (e) { console.log('Log kanalına mesaj atılamadı:', e); }
    }
});

// --- SES KANALI DİNLEYİCİSİ ---
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    const member = newState.member;
    if (member.user.bot) return; 

    if (!oldState.channelId && newState.channelId) {
        sesGirisZamanlari.set(member.id, Date.now());
    } else if (oldState.channelId && !newState.channelId) {
        const girisZamani = sesGirisZamanlari.get(member.id);
        if (girisZamani) {
            const gecenSaniye = Math.floor((Date.now() - girisZamani) / 1000);
            const mevcutVeri = db.prepare('SELECT * FROM ses_istatistik WHERE user_id = ?').get(member.id);
            if (mevcutVeri) {
                db.prepare('UPDATE ses_istatistik SET total_seconds = total_seconds + ? WHERE user_id = ?').run(gecenSaniye, member.id);
            } else {
                db.prepare('INSERT INTO ses_istatistik (user_id, total_seconds) VALUES (?, ?)').run(member.id, gecenSaniye);
            }
            sesGirisZamanlari.delete(member.id);
        }
    }
});

// --- SOHBET DİNLEYİCİSİ (YAPAY ZEKA TAKLİDİ) ---
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return; 
    const icerik = message.content.toLowerCase();

    for (const [anahtar, cevaplar] of Object.entries(sohbetCevaplari)) {
        if (icerik.includes(anahtar)) {
            if (Math.random() < 0.5) { 
                const rastgeleCevap = cevaplar[Math.floor(Math.random() * cevaplar.length)];
                await message.reply(rastgeleCevap);
            }
            break; 
        }
    }
});

// --- ETKİLEŞİMLER (KOMUTLAR, MENÜLER, BUTONLAR) ---
client.on(Events.InteractionCreate, async interaction => {
    
    // 1. SLASH KOMUTLARI
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'ping') await interaction.reply('Pong! 🏓');
        
        // SİL KOMUTU
        if (interaction.commandName === 'sil') {
            await interaction.deferReply({ ephemeral: true });
            const miktar = interaction.options.getInteger('sayi');
            try {
                const silinenMesajlar = await interaction.channel.bulkDelete(miktar, true);
                await interaction.editReply({ content: `✅ Başarıyla **${silinenMesajlar.size}** adet mesaj silindi.` });
            } catch (error) {
                console.error('Silme Hatası:', error);
                await interaction.editReply({ content: '❌ Mesajlar silinirken bir hata oluştu. (Discord, 14 günden eski mesajların toplu silinmesine izin vermez).' });
            }
        }

        // NUKE KOMUTU
        if (interaction.commandName === 'nuke') {
            await interaction.deferReply({ ephemeral: true });
            const kanal = interaction.channel;
            const pozisyon = kanal.position;
            const isim = kanal.name;
            const kategori = kanal.parentId;
            const izinler = kanal.permissionOverwrites.cache.map(overwrite => {
                return {
                    id: overwrite.id,
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray(),
                };
            });
            try {
                await kanal.delete();
                const yeniKanal = await interaction.guild.channels.create({
                    name: isim, type: kanal.type, parent: kategori, position: pozisyon, permissionOverwrites: izinler,
                });
                await yeniKanal.send('💥 **Kanal başarıyla nuke\'lendi!** Tertemiz bir sayfa açıldı.');
            } catch (error) { console.error('Nuke Hatası:', error); }
        }
        
        if (interaction.commandName === 'sestop') {
            await interaction.deferReply();
            const top10 = db.prepare('SELECT user_id, total_seconds FROM ses_istatistik ORDER BY total_seconds DESC LIMIT 10').all();
            if (top10.length === 0) return interaction.editReply({ content: '❌ Henüz kimse ses kanallarında vakit geçirmemiş.' });
            let aciklama = '';
            let sira = 1;
            for (const row of top10) {
                try {
                    const user = await client.users.fetch(row.user_id);
                    const saat = Math.floor(row.total_seconds / 3600);
                    const dakika = Math.floor((row.total_seconds % 3600) / 60);
                    let emoji = `${sira}.`;
                    if (sira === 1) emoji = '🥇';
                    if (sira === 2) emoji = '🥈';
                    if (sira === 3) emoji = '🥉';
                    aciklama += `**${emoji} \`${user.username}\`** - ${saat}sa ${dakika}dk\n`;
                    sira++;
                } catch (e) { continue; } 
            }
            const totalRow = db.prepare('SELECT SUM(total_seconds) as total FROM ses_istatistik').get();
            const toplamSaat = Math.floor((totalRow.total || 0) / 3600);
            const embed = new EmbedBuilder().setTitle('📊 Ses Sıralaması').setDescription(`🔊 **Ses aktiviten:** \`${toplamSaat}sa\`\n🏠 **Sunucu toplamı:** \`${toplamSaat}sa\`\n\n**Ses Sıralaması**\n${aciklama}`).setColor('#5865F2');
            await interaction.editReply({ embeds: [embed] });
        }

        if (interaction.commandName === 'çekiliş') {
            await interaction.deferReply();
            const sureStr = interaction.options.getString('süre');
            const kazananSayisi = interaction.options.getInteger('kazanan_sayisi');
            const odul = interaction.options.getString('ödül');
            const sureMs = parseSure(sureStr);
            if (!sureMs) return interaction.editReply({ content: '❌ Geçersiz süre formatı! (örn: 10m)' });
            const bitisZamani = Math.floor((Date.now() + sureMs) / 1000);
            const embed = new EmbedBuilder().setTitle('🎉 ÇEKİLİŞ BAŞLADI! 🎉').setDescription(`🎁 **Ödül:** ${odul}\n\n🎟️ Katılmak için aşağıdaki **🎉** emojisine tıklayın!\n\n⏳ **Bitiş:** <t:${bitisZamani}:R>`).setColor('#f1c40f');
            await interaction.editReply({ embeds: [embed] });
            const mesaj = await interaction.fetchReply();
            await mesaj.react('🎉');
            setTimeout(async () => {
                try {
                    const guncelMesaj = await mesaj.fetch();
                    const reaksiyon = guncelMesaj.reactions.cache.get('🎉');
                    if (!reaksiyon) return interaction.channel.send('❌ Çekilişe kimse katılmadı.');
                    const kullanicilar = await reaksiyon.users.fetch();
                    const katilimcilar = kullanicilar.filter(u => !u.bot).map(u => u);
                    if (katilimcilar.length === 0) return interaction.channel.send('❌ Çekilişe kimse katılmadı.');
                    const kazananlar = [];
                    for (let i = 0; i < kazananSayisi; i++) {
                        if (katilimcilar.length === 0) break;
                        const rastgeleIndex = Math.floor(Math.random() * katilimcilar.length);
                        kazananlar.push(katilimcilar.splice(rastgeleIndex, 1)[0]);
                    }
                    const kazananEtiketleri = kazananlar.map(u => `<@${u.id}>`).join(', ');
                    const sonucEmbed = new EmbedBuilder().setTitle('🎉 ÇEKİLİŞ SONA ERDİ! 🎉').setDescription(`🎁 **Ödül:** ${odul}\n\n🏆 **Kazanan(lar):** ${kazananEtiketleri}\n\n👤 **Başlatan:** <@${interaction.user.id}>`).setColor('#2ecc71').setTimestamp();
                    await mesaj.edit({ embeds: [sonucEmbed] });
                    await interaction.channel.send(`Tebrikler ${kazananEtiketleri}! 🎉`);
                } catch (error) { console.error('Çekiliş hatası:', error); }
            }, sureMs);
        }

        if (interaction.commandName === 'destek-paneli-kur') {
            await interaction.deferReply({ ephemeral: true });
            const kanal = interaction.options.getChannel('kanal');
            const embed = new EmbedBuilder().setTitle('🛡️ Primes Destek & İletişim Merkezi').setDescription('⭐ Sunucumuzda yardıma ihtiyacınız var mı?\n\n💬 Size en uygun destek kategorisini aşağıdaki menüden seçerek anında bir destek talebi oluşturabilirsiniz.').setColor('#5865F2');
            const menu = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('destek_kategori').setPlaceholder('🎫 Lütfen bir destek kategorisi seçin...').addOptions([
                { label: 'Sunucu Merge & Birleşme', value: 'merge', emoji: '🤝' }, { label: 'Klan Ally / İttifak', value: 'ally', emoji: '🤝' }, { label: 'İş Birliği & Partnerlik', value: 'partner', emoji: '💼' }, { label: 'Şikayet & Bildirim', value: 'sikayet', emoji: '⚠️' }, { label: 'Klan Alımı & Başvuru', value: 'klan_alim', emoji: '⚔️' } ]));
            await kanal.send({ embeds: [embed], components: [menu] });
            await interaction.editReply({ content: '✅ Destek paneli kuruldu!' });
        }

        if (interaction.commandName === 'klan-paneli-kur') {
            await interaction.deferReply({ ephemeral: true });
            const kanal = interaction.options.getChannel('kanal');
            const embed = new EmbedBuilder().setTitle('⚔️ Primes Klan Alım & Başvuru Merkezi').setDescription('🛡️ Güçlü kadromuza katılmak ister misiniz?\n\n✨ Aşağıdaki butona tıklayarak başvuru formunu doldurun!').setColor('#5865F2');
            const buton = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('klan_basvuru_btn').setLabel('Klan Başvurusu Yap').setEmoji('⚔️').setStyle(ButtonStyle.Primary));
            await kanal.send({ embeds: [embed], components: [buton] });
            await interaction.editReply({ content: '✅ Klan paneli kuruldu!' });
        }

        // --- OYUNLAR ---
        if (interaction.commandName === 'sayi-saymaca-baslat') {
            await interaction.deferReply();
            const kanal = interaction.channel;
            await interaction.editReply(`🔢 **Sayı Saymaca Başladı!**\nHadi bakalım, sırayla sayalım. İlk sayı: **1**. Sıradaki sayıyı yazın!`);
            let mevcutSayi = 1;
            const dinleyici = async (msg) => {
                if (msg.author.bot || msg.channel.id !== kanal.id) return;
                const girilen = parseInt(msg.content);
                if (isNaN(girilen)) return; 
                if (girilen === mevcutSayi + 1) {
                    mevcutSayi++;
                    if (mevcutSayi % 10 === 0) kanal.send(`Wow, **${mevcutSayi}** sayısına ulaştık! Harika gidiyorsunuz. Devam!`);
                } else if (girilen !== mevcutSayi) {
                    kanal.send(`❌ **Hop hop!** ${msg.author}, sıradaki sayı **${mevcutSayi + 1}** olmalıydı. Sen **${girilen}** yazdın. Baştan başlayalım: **1**`);
                    mevcutSayi = 1;
                } else if (girilen === mevcutSayi) {
                    kanal.send(`😅 ${msg.author}, **${girilen}** sayısını az önce saydık. Sıradaki sayı **${mevcutSayi + 1}** olmalı!`);
                }
            };
            client.on(Events.MessageCreate, dinleyici);
            setTimeout(() => { client.off(Events.MessageCreate, dinleyici); kanal.send('⏰ Oyun zaman aşımına uğradı.'); }, 300000);
        }

        if (interaction.commandName === 'bom-baslat') {
            await interaction.deferReply();
            const bomSayisi = Math.floor(Math.random() * 100) + 1;
            const kanal = interaction.channel;
            await interaction.editReply(`💣 **Bom Oyunu Başladı!**\nSırayla **1**'den başlayarak sayıları yazın. Bombaya basan patlar! (İlk sayı: **1**)`);
            let mevcutSayi = 1;
            const dinleyici = async (msg) => {
                if (msg.author.bot || msg.channel.id !== kanal.id) return;
                const tahmin = parseInt(msg.content);
                if (isNaN(tahmin)) return;
                if (tahmin === bomSayisi) {
                    kanal.send(`💥 **BOOM!** ${msg.author} bombaya bastı ve patladı! Oyun bitti.`);
                    client.off(Events.MessageCreate, dinleyici);
                    return;
                }
                if (tahmin !== mevcutSayi) return kanal.send(`⚠️ ${msg.author}, sıradaki sayı **${mevcutSayi}** olmalıydı. Karıştırmayalım lütfen!`);
                kanal.send(`✅ **${mevcutSayi}** güvende. Sıradaki sayı: **${mevcutSayi + 1}**`);
                mevcutSayi++;
            };
            client.on(Events.MessageCreate, dinleyici);
            setTimeout(() => { client.off(Events.MessageCreate, dinleyici); kanal.send('⏰ Oyun zaman aşımına uğradı.'); }, 300000); 
        }

        if (interaction.commandName === 'kelime-turetmece-baslat') {
            await interaction.deferReply();
            const kelimeler = ['elma', 'armut', 'masa', 'kalem', 'kitap', 'defter', 'bilgisayar', 'telefon', 'araba', 'ağaç'];
            let mevcutKelime = kelimeler[Math.floor(Math.random() * kelimeler.length)];
            const kanal = interaction.channel;
            await interaction.editReply(`📝 **Kelime Türetmece Başladı!**\nİlk kelimemiz: **${mevcutKelime}**\nLütfen **${mevcutKelime.slice(-1).toUpperCase()}** harfiyle başlayan yeni bir kelime türetin!`);
            const dinleyici = async (msg) => {
                if (msg.author.bot || msg.channel.id !== kanal.id) return;
                const kelime = msg.content.toLowerCase().trim();
                if (kelime === 'iptal') { kanal.send('Oyun iptal edildi. 👋'); client.off(Events.MessageCreate, dinleyici); return; }
                const sonHarf = mevcutKelime.slice(-1).toLowerCase();
                if (!kelime.startsWith(sonHarf) || kelime.length < 2) return kanal.send(`🤔 ${msg.author}, kelimen **${sonHarf.toUpperCase()}** harfiyle başlamalı ve geçerli bir kelime olmalı. Tekrar dene!`);
                mevcutKelime = kelime;
                kanal.send(`✅ Harika! **${mevcutKelime.toUpperCase()}** kabul edildi. Sıradaki harf: **${mevcutKelime.slice(-1).toUpperCase()}**`);
            };
            client.on(Events.MessageCreate, dinleyici);
            setTimeout(() => { client.off(Events.MessageCreate, dinleyici); kanal.send('⏰ Oyun zaman aşımına uğradı.'); }, 300000); 
        }
    }

    // 2. MENÜLER
    if (interaction.isStringSelectMenu() && interaction.customId === 'destek_kategori') {
        await interaction.deferReply({ ephemeral: true }); 
        const secilenKategori = interaction.values[0];
        const kullanici = interaction.user;
        const sunucu = interaction.guild;
        const kategoriIsimleri = { 'merge': 'Sunucu Merge', 'ally': 'Klan Ally', 'partner': 'Partnerlik', 'sikayet': 'Şikayet', 'klan_alim': 'Klan Alımı' };
        try {
            const temizIsim = kullanici.username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().substring(0, 15);
            const ticketKanal = await sunucu.channels.create({
                name: `ticket-${temizIsim}`,
                type: ChannelType.GuildText,
                parent: TICKET_KATEGORI_ID,
                permissionOverwrites: [
                    { id: sunucu.id, deny: [PermissionFlagsBits.ViewChannel] }, 
                    { id: kullanici.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
                    { id: YETKILI_ROL_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }, 
                ],
            });
            db.prepare('INSERT INTO tickets (channel_id, user_id, category) VALUES (?, ?, ?)').run(ticketKanal.id, kullanici.id, secilenKategori);
            const ticketEmbed = new EmbedBuilder().setTitle(`🎫 Destek Talebi: ${kategoriIsimleri[secilenKategori]}`).setDescription(`Merhaba ${kullanici}, destek talebiniz oluşturuldu.\nLütfen yetkili ekibimizin size ulaşmasını bekleyin.`).setColor('#2ecc71');
            const kapatButon = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('ticket_kapat_btn').setLabel('Talebi Kapat').setEmoji('🔒').setStyle(ButtonStyle.Danger));
            await ticketKanal.send({ content: `<@${kullanici.id}>`, embeds: [ticketEmbed], components: [kapatButon] });
            await interaction.editReply({ content: `✅ Destek talebiniz oluşturuldu! Lütfen <#${ticketKanal.id}> kanalına gidin.` });
        } catch (error) {
            console.error('TICKET HATASI:', error); 
            await interaction.editReply({ content: '❌ Ticket oluşturulurken hata oluştu.' });
        }
    }

    // 3. BUTONLAR
    if (interaction.isButton()) {
        if (interaction.customId === 'ticket_kapat_btn') {
            const modal = new ModalBuilder().setCustomId('ticket_kapat_modal').setTitle('Destek Talebini Kapat');
            const sebepInput = new TextInputBuilder().setCustomId('kapatma_sebebi').setLabel('Kapatma Sebebi').setStyle(TextInputStyle.Paragraph).setPlaceholder('Lütfen bu talebi neden kapatıyorsunuz?').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(sebepInput));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'klan_basvuru_btn') {
            const modal = new ModalBuilder().setCustomId('klan_basvuru_modal').setTitle('Primes Klan Başvuru Formu');
            const oyunAdi = new TextInputBuilder().setCustomId('oyun_adi').setLabel('Oyun İçi Adınız & Yaşınız').setStyle(TextInputStyle.Short).setPlaceholder('Örn: Primes Player, 17').setRequired(true);
            const tier = new TextInputBuilder().setCustomId('tier').setLabel('Tier Seviyeniz Nedir?').setStyle(TextInputStyle.Short).setPlaceholder('Mevcut tier seviyenizi belirtin.').setRequired(true);
            const aktivite = new TextInputBuilder().setCustomId('aktivite').setLabel('Günlük Aktivite Süreniz').setStyle(TextInputStyle.Short).setPlaceholder('Günde ortalama kaç saat aktif olabilirsiniz?').setRequired(true);
            const mikrofon = new TextInputBuilder().setCustomId('mikrofon').setLabel('Sesli Sohbet & Mikrofon Durumu').setStyle(TextInputStyle.Short).setPlaceholder('Sesli sohbette aktif olabilir misiniz?').setRequired(true);
            const deneyim = new TextInputBuilder().setCustomId('deneyim').setLabel('Deneyimleriniz & Kendiniz').setStyle(TextInputStyle.Paragraph).setPlaceholder('Oyun deneyiminizden ve kendinizden kısaca bahsedin.').setRequired(true);
            modal.addComponents(new ActionRowBuilder().addComponents(oyunAdi), new ActionRowBuilder().addComponents(tier), new ActionRowBuilder().addComponents(aktivite), new ActionRowBuilder().addComponents(mikrofon), new ActionRowBuilder().addComponents(deneyim));
            await interaction.showModal(modal);
        }

        if (interaction.customId === 'klan_onayla' || interaction.customId === 'klan_reddet') {
            await interaction.deferReply({ ephemeral: true });
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({ content: '❌ Bu işlemi sadece sunucu yöneticileri yapabilir.' });
            }
            const basvuru = db.prepare('SELECT user_id FROM klan_basvurular WHERE message_id = ?').get(interaction.message.id);
            if (!basvuru) return interaction.editReply({ content: '❌ Başvuru kaydı bulunamadı.' });
            try {
                const kullanici = await client.users.fetch(basvuru.user_id);
                if (interaction.customId === 'klan_onayla') {
                    const dmEmbed = new EmbedBuilder().setDescription(`🎉 Tebrikler Sayın <@${kullanici.id}>,\n\n⚔️ **PrimeS #KlanAlım** klan başvurunuz başarıyla **ONAYLANMIŞTIR!** Lütfen gerekli işlemler için sunucumuzda destek talebi oluşturun.`).setColor('#2ecc71');
                    await kullanici.send({ embeds: [dmEmbed] }).catch(() => console.log('DM gönderilemedi.'));
                    await interaction.message.edit({ components: [] }); 
                    await interaction.editReply({ content: '✅ Başvuru onaylandı.' });
                } else {
                    const dmEmbed = new EmbedBuilder().setDescription(`❌ Sayın <@${kullanici.id}>,\n\n⚔️ **PrimeS #KlanAlım** klan başvurunuz ne yazık ki **KABUL EDİLMEMİŞTİR.** İlginiz için teşekkür ederiz.`).setColor('#e74c3c');
                    await kullanici.send({ embeds: [dmEmbed] }).catch(() => console.log('DM gönderilemedi.'));
                    await interaction.message.edit({ components: [] }); 
                    await interaction.editReply({ content: '❌ Başvuru reddedildi.' });
                }
            } catch (error) { console.error(error); await interaction.editReply({ content: 'Bir hata oluştu.' }); }
        }
    }

    // 4. FORMLAR (MODALLAR)
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'ticket_kapat_modal') {
            await interaction.deferReply(); 
            const kapatmaSebebi = interaction.fields.getTextInputValue('kapatma_sebebi');
            const kanal = interaction.channel;
            try {
                const dmEmbed = new EmbedBuilder().setDescription(`🔒 **[Primes • Destek Talebi Kapatıldı]**\n\n👋 Merhaba <@${interaction.user.id}>,\n\n📌 Destek talebiniz yetkili ekibimiz tarafından kapatılmıştır.\n💬 **Kapatılma Sebebi:** ${kapatmaSebebi}\n\n🛡️ Bizimle iletişime geçtiğiniz için teşekkür ederiz!`).setColor('#FFA500'); 
                const ticketSahibiId = db.prepare('SELECT user_id FROM tickets WHERE channel_id = ?').get(kanal.id).user_id;
                const ticketSahibi = await client.users.fetch(ticketSahibiId);
                if (ticketSahibi) await ticketSahibi.send({ embeds: [dmEmbed] }).catch(() => console.log('DM gönderilemedi.'));
                db.prepare('UPDATE tickets SET status = ? WHERE channel_id = ?').run('closed', kanal.id);
                await interaction.editReply({ content: `🔒 Destek talebi kapatılıyor. Kanal 5 saniye içinde siliniyor...` });
                setTimeout(async () => { await kanal.delete().catch(() => console.log('Kanal silinemedi.')); }, 5000); 
            } catch (error) { console.error(error); await interaction.editReply({ content: 'Hata oluştu.' }); }
        }

        if (interaction.customId === 'klan_basvuru_modal') {
            await interaction.deferReply({ ephemeral: true });
            const oyunAdi = interaction.fields.getTextInputValue('oyun_adi');
            const tier = interaction.fields.getTextInputValue('tier');
            const aktivite = interaction.fields.getTextInputValue('aktivite');
            const mikrofon = interaction.fields.getTextInputValue('mikrofon');
            const deneyim = interaction.fields.getTextInputValue('deneyim');
            const kullanici = interaction.user;
            try {
                const basvuruKanali = await client.channels.fetch(KLAN_BASVURU_KANAL_ID);
                const basvuruEmbed = new EmbedBuilder()
                    .setTitle('📨 Yeni Klan Başvurusu Alındı')
                    .setDescription(`✨ **@${kullanici.username}** yeni bir klan başvurusunda bulundu.\n\n👤 **Başvuran**\n<@${kullanici.id}>\n\n🎮 **Oyun Adı & Yaş**\n${oyunAdi}\n\n⚡ **Tier Seviyesi**\n${tier}\n\n⏱️ **Günlük Aktivite**\n${aktivite}\n\n🎙️ **Ses & Mikrofon**\n${mikrofon}\n\n📁 **Deneyim & Bilgi**\n${deneyim}\n\n🆔 **Kullanıcı ID**\n${kullanici.id}`)
                    .setColor('#2b2d31');
                const butonlar = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('klan_onayla').setLabel('Onayla').setEmoji('✅').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('klan_reddet').setLabel('Reddet').setEmoji('❌').setStyle(ButtonStyle.Danger)
                );
                const mesaj = await basvuruKanali.send({ embeds: [basvuruEmbed], components: [butonlar] });
                db.prepare('INSERT INTO klan_basvurular (user_id, oyun_adi, tier, aktivite, mikrofon, deneyim, message_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(kullanici.id, oyunAdi, tier, aktivite, mikrofon, deneyim, mesaj.id);
                await interaction.editReply({ content: '✅ Başvurunuz başarıyla alındı!' });
            } catch (error) { console.error('KLAN BAŞVURU HATASI:', error); await interaction.editReply({ content: '❌ Başvuru gönderilirken bir hata oluştu.' }); }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);