const fs = require('fs');
const { Client, Intents, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, EmbedBuilder, TextInputBuilder, ModalBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');
module.exports = {
  name: 'kayıt',
  description: 'Kayıt Yapar',
  aliases: ["k"],
  async execute(client, message, args) {

    // Gerekli rol ID'leri ve log kanalı ID'si
    const kayitsizRoleID = '1264249388516249631'; // Kayıtsız rolünün ID'sini burada değiştirin
    const kizRoleID = '1263218335361929256'; // Kız rolünün ID'sini burada değiştirin
    const erkekRoleID = '1264249044071612500'; // Erkek rolünün ID'sini burada değiştirin
    const logChannelID = '1242942289211560039'; // Log kanalının ID'sini burada değiştirin
    const yetkiliRoleID = '1264252101937070242'; // Yetkili rolünün ID'sini burada değiştirin

    // Komutu sadece belirli bir rolü olan yetkililer kullanabilir
    if (!message.member.roles.cache.has(yetkiliRoleID)) {
      return message.channel.send("Bu komutu kullanmak için yeterli izniniz yok.");
    }

    // Komut argümanları kontrolü
    if (args.length < 2) {
      return message.channel.send("Lütfen şu formatta komutu kullanın: .kayıt <id/@üye> <isim>");
    }

    const userMention = args[0];
    const name = args[1];

    // Kullanıcıyı bulma
    let user;
    if (message.mentions.members.size) {
      user = message.mentions.members.first();
    } else {
      user = message.guild.members.cache.get(userMention);
    }

    if (!user) {
      return message.channel.send("Belirtilen kullanıcı bulunamadı.");
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('register_kiz')
          .setLabel('Kız')
          .setEmoji('<:Kadin:1262016418359017515>')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('register_erkek')
          .setLabel('Erkek')
          .setEmoji('<:Erkek:1262016370896277614>')
          .setStyle(ButtonStyle.Primary)
      );

    const embed = new EmbedBuilder()
      .setTitle(`Yeni bir üye kayıt ediliyor<a:exdoki_aaaaa:1262017677916901518>`)
      .setDescription(`**Lütfen cinsiyetinizi seçiniz`)
      .addFields({name: `**Kayıt edilen kullanıcı**`, value: `<@${user.id}>`},
        {name: `**İsmi**`, value: `\`${name}\``})
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
      .setTimestamp()
    message.channel.send({ embeds: [embed], components: [row] })
      .then(sentMessage => {
        const collector = sentMessage.createMessageComponentCollector({ filter: i => i.user.id === message.author.id, time: 60000 });

        collector.on('collect', async interaction => {
          if (!user) {
            return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
          }

          let roleID;
          if (interaction.customId === 'register_kiz') {
            roleID = kizRoleID;
          } else if (interaction.customId === 'register_erkek') {
            roleID = erkekRoleID;
          }

          if (roleID) {
            await user.roles.add(roleID);
            await user.roles.remove(kayitsizRoleID);
            await user.setNickname(`${name}`);

            const logEmbed = new EmbedBuilder()
              .setTitle('Kayıt Log')
              .addFields(
                { name: 'Kayıt Edilen Kullanıcı', value: `<@${user.id}>` },
                { name: 'Yetkili', value: `<@${message.author.id}>` },
                { name: 'Cinsiyet', value: interaction.customId === 'register_kiz' ? 'Kız' : 'Erkek' },
                { name: 'İsim', value: `${name}` }
              )
              .setTimestamp();

            const logChannel = client.channels.cache.get(logChannelID);
            if (logChannel) {
              logChannel.send({ embeds: [logEmbed] });
            }

            
            // Embed'i güncelle
            const updatedEmbed = new EmbedBuilder()
              .setTitle('Üye başarıyla kayıt edildi.')
              .addFields({name: `**Yetkili**`, value: `<@${message.author.id}>`},
              {name: `**Kayıt Edilen Kullanıcı**`, value: `<@${user.id}>`},
              {name: `**İsmi**`, value: `${name}`},
              {name: `Cinsiyeti`, value: `${interaction.customId === 'register_kiz' ? 'Kız' : 'Erkek'}`}
              )
              .setThumbnail(client.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }))
              .setTimestamp()
            await interaction.update({ embeds: [updatedEmbed], components: [] });
          }

          collector.stop();
        });

        collector.on('end', collected => {
          if (collected.size === 0) {
            sentMessage.edit({ content: 'Kayıt süresi doldu.', components: [] });
          } else {
            sentMessage.edit({ components: [] });
          }
        });
      });
  }
}
