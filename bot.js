const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://remaxbotmusic1.glitch.me/`);
}, 280000);

const Discord = require('discord.js');
const converter = require('number-to-words');
const moment = require('moment');
const dateformat = require('dateformat');
const ms = require('parse-ms')
const client = new Discord.Client({ disableEveryone: true});
const fs = require('fs');
const request = require('request');
const jimp = require('jimp')
const pretty = require("pretty-ms");



const prefix = process.env.PREFIX
const PREFIX = process.env.PREFIX
const ownerID = process.env.MYID


client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();


let cmds = {
  play: { cmd: 'play', a: ['p','شغل','تشغيل'] },
  skip: { cmd: 'skip', a: ['s','تخطي','next']},
  stop: { cmd: 'stop', a:['ايقاف','توقف'] },
  pause: { cmd: 'pause', a:['لحظة','مؤقت'] },
  resume: { cmd: 'resume', a: ['r','اكمل','استكمال'] },
  volume: { cmd: 'volume', a: ['vol','صوت'] },
  queue: { cmd: 'queue', a: ['q','list','قائمة'] },
  repeat: { cmd: 'repeat', a: ['re','تكرار','اعادة'] },
  forceskip: { cmd: 'forceskip', a: ['fs', 'fskip'] },
  skipto: { cmd: 'skipto', a: ['st','تخطي الي'] },
  nowplaying: { cmd: 'Nowplaying', a: ['np','الان'] }
};



Object.keys(cmds).forEach(key => {
var value = cmds[key];
  var command = value.cmd;
  client.commands.set(command, command);

  if(value.a) { // 14
    value.a.forEach(alias => {
    client.aliases.set(alias, command)
  })
  }
})

const ytdl = require('ytdl-core');
const getYoutubeID = require('get-youtube-id');
const fetchVideoInfo = require('youtube-info');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube(process.env.YTkey);
 // 14

let active = new Map();

client.on('warn', console.warn);

client.on('error', console.error);

client.on('ready', () => {
    console.log(`Created By: Kahrbaa`);
    console.log(`Guilds: ${client.guilds.size}`);
    console.log(`Users: ${client.users.size}`);
    client.user.setActivity(`${process.env.status.replace('[PREFIX]' ,PREFIX).replace('[SERVERS]',client.guilds.size).replace('[USERS]',client.users.size) || `Type ${prefix}help`}`,{type: 'Playing'});
});

client.on('message', async msg => {
    if(msg.author.bot) return undefined;
  if(!msg.content.startsWith(prefix)) return undefined;

  const args = msg.content.slice(prefix.length).trim().split(/ +/g);
const command = args.shift().toLowerCase();

    const url = args[1] ? args[1].replace(/<(.+)>/g, '$1') : '';

    let cmd = client.commands.get(command) || client.commands.get(client.aliases.get(command))

    let s;

    if(cmd === 'play') {
        const voiceChannel = msg.member.voiceChannel;
        if(!voiceChannel) return msg.channel.send(`يجب ان تكون مستمع في غرفة صوتية :no_entry_sign:`);
        const permissions = voiceChannel.permissionsFor(msg.client.user);
        if(!permissions.has('CONNECT')) {
            return msg.channel.send(`:no_entry_sign: I can't join Your voiceChannel because i don't have ` + '`' + '`CONNECT`' + '`' + ` permission!`);
        }

        if(!permissions.has('SPEAK')) {
            return msg.channel.send(`:no_entry_sign: I can't SPEAK in your voiceChannel because i don't have ` + '`' + '`SPEAK`' + '`' + ` permission!`);
        }
      voiceChannel.join()
      if(!args[0]) return msg.channel.send(`**:bulb: اوامر التشغيل. 
> \`\`!play \`\`تشغيل اول شيء باليوتيوب :  [نص البحث] 
> \`\`!play \`\` تتشغيل رابط يوتيوب : [الرابط] **`)

        if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
			const playlist = await youtube.getPlaylist(url);
			const videos = await playlist.getVideos();

			for (const video of Object.values(videos)) {
				const video2 = await youtube.getVideoByID(video.id); // eslint-disable-line no-await-in-loop
				await handleVideo(video2, msg, voiceChannel, true); // eslint-disable-line no-await-in-loop
			}
			return msg.channel.send(`Added to queue: ${playlist.title}`);
		} else {
			try {
// كههربا
				var video = await youtube.getVideo(url);
			} catch (error) {
				try {
					var videos = await youtube.searchVideos(args, 1);

					// eslint-disable-next-line max-depth
					var video = await youtube.getVideoByID(videos[0].id);
				} catch (err) {
					console.error(err);
					return msg.channel.send('I can\'t find any thing');
				}
			}

			return handleVideo(video, msg, voiceChannel);
		}

        async function handleVideo(video, msg, voiceChannel, playlist = false) {
	const serverQueue = active.get(msg.guild.id);


//	console.log('yao: ' + Util.escapeMarkdown(video.thumbnailUrl));
// Kahrbaa كههربا
let hrs = video.duration.hours > 0 ? (video.duration.hours > 9 ? `${video.duration.hours}:` : `0${video.duration.hours}:`) : '';
let min = video.duration.minutes > 9 ? `${video.duration.minutes}:` : `0${video.duration.minutes}:`;
let sec = video.duration.seconds > 9 ? `${video.duration.seconds}` : `0${video.duration.seconds}`;
let dur = `${hrs}${min}${sec}`

  let ms = video.durationSeconds * 1000;

	const song = {  // 04
		id: video.id,
		title: video.title,
    duration: dur,
    msDur: ms,
		url: `https://www.youtube.com/watch?v=${video.id}`
	};
	if (!serverQueue) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 50,
      requester: msg.author,
			playing: true,
      repeating: false
		};
		active.set(msg.guild.id, queueConstruct);

		queueConstruct.songs.push(song);

		try {
			var connection = await voiceChannel.join();
			queueConstruct.connection = connection;
			play(msg.guild, queueConstruct.songs[0]);
		} catch (error) {
			console.error(`I could not join the voice channel: ${error}`);
			active.delete(msg.guild.id);
			return msg.channel.send(`I cant join this voice channel`);
		} // 04
	} else {
		serverQueue.songs.push(song);

		if (playlist) return undefined;
		if(!args) return msg.channel.send('no results.');
		else return msg.channel.send(':watch: Loading... [`' + args + '`]').then(m => {
      setTimeout(() => {//:watch: Loading... [let]
        m.edit(`:notes: تم تشغيل **${song.title}**` + '(` ' + song.duration + ')`' + ` to the queue at position ` + `${serverQueue.songs.length}`);
      }, 500)
    }) 
	}
	return undefined;
}

function play(guild, song) {
	const serverQueue = active.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		active.delete(guild.id);
		return;
	}
	//console.log(serverQueue.songs);
  if(serverQueue.repeating) {
	console.log('Repeating');
  } else {
	serverQueue.textChannel.send(':notes: تم تشغيل` ' + song.title + ' (`' + song.duration + '`)`.');
}
	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', reason => {
			//if (reason === 'Stream is not generating quickly enough.') console.log('Song ended.');
			//else console.log(reason);
      if(serverQueue.repeating) return play(guild, serverQueue.songs[0])
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => console.error(error));
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 100);


}
} else if(cmd === 'stop') {
        if(msg.guild.me.voiceChannel !== msg.member.voiceChannel) return msg.channel.send(`You must be in ${msg.guild.me.voiceChannel.name}`)
        if(!msg.member.hasPermission('ADMINISTRATOR')) {
          msg.react('❌')
          return msg.channel.send('You don\'t have permission `ADMINSTRATOR`');
        }
        let queue = active.get(msg.guild.id);
        if(queue.repeating) return msg.channel.send('Repeating Mode is on, you can\'t stop the music, run `' + `${prefix}repeat` + '` to turn off it.')
        queue.songs = [];
        queue.connection.dispatcher.end();
        return msg.channel.send('تم خروج البوت وتوقيفه ومسح قائمة اللإنتظار :white_check_mark:');

    } else if(cmd === 'skip') {

      let vCh = msg.member.voiceChannel;

      let queue = active.get(msg.guild.id);

        if(!vCh) return msg.channel.send('يجب ان تكون مستمع في غرفة صوتية :no_entry_sign:');

        if(!queue) return msg.channel.send('لا يوجد أي موسيقى على قائمة الإنتظار :no_entry_sign:');

        if(queue.repeating) return msg.channel.send('You can\'t skip it, because repeating mode is on, run ' + `\`${prefix}forceskip\``);

        let req = vCh.members.size - 1;

        if(req == 1) {
            msg.channel.send('**تم تخطي الاغنيه الحاليه :white_check_mark: **' + args);
            return queue.connection.dispatcher.end('Skipping ..')
        }

        if(!queue.votes) queue.votes = [];

        if(queue.votes.includes(msg.member.id)) return msg.say(`You already voted for skip! ${queue.votes.length}/${req}`);

        queue.votes.push(msg.member.id);

        if(queue.votes.length >= req) {
            msg.channel.send('**:notes: Skipped **' + args);

            delete queue.votes;

            return queue.connection.dispatcher.end('Skipping ..')
        }

        msg.channel.send(`**لقد قمت بالتصويت بنجاح للتخطي! ${queue.votes.length}/${req}**`)

    } else if(cmd === 'pause') {

      let queue = active.get(msg.guild.id);

        let vCh = msg.member.voiceChannel;

        if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send(`يجب ان تكون مستمع في غرفة صوتية :no_entry_sign:`);

        if(!queue) {
            return msg.channel.send('No music playing to pause.')
        }

        if(!queue.playing) return msg.channel.send(':no_entry_sign: There must be music playing to use that!')

        let disp = queue.connection.dispatcher;

        disp.pause('Pausing..')

        queue.playing = false;

        msg.channel.send(':notes: Paused ' + args + '. **Type** `' + prefix + 'resume` to unpause!')

    } else if (cmd === 'resume') {

      let queue = active.get(msg.guild.id);

        let vCh = msg.member.voiceChannel;

        if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send(`يجب ان تكون مستمع في غرفة صوتية :no_entry_sign:`);

        if(!queue) return msg.channel.send(':notes: No music paused to resume.')

        if(queue.playing) return msg.channel.send(':notes: No music paused to resume.')

        let disp = queue.connection.dispatcher;

        disp.resume('Resuming..')
// 2-0-0-2
        queue.playing = true;

        msg.channel.send(':notes: Resumed.')

    } else if(cmd === 'volume') {

      let queue = active.get(msg.guild.id);

      if(!queue || !queue.songs) return msg.channel.send('لا يوجد أي موسيقى على قائمة الإنتظار :no_entry_sign:');

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('يجب ان تكون مستمع في ألغرفة الصوتية :no_entry_sign:');

      let disp = queue.connection.dispatcher;

      if(isNaN(args[0])) return msg.channel.send('يجب ان يكون مستوى من `10` الى `100` فقط :loud_sound:');

      if(parseInt(args[0]) > 100) return msg.channel.send('يجب ان يكون مستوى من `10` الى `100` فقط :loud_sound:')
//:speaker: Volume changed from 20 to 20 ! The volume has been changed from ${queue.volume} to ${args[0]}
      msg.channel.send(':speaker: تم تبديل مستوى **الصوت** من (`' + queue.volume + '`) الي (`' + args[0] + '`)');

      queue.volume = args[0];

      disp.setVolumeLogarithmic(queue.volume / 100);

    } else if (cmd === 'queue') {

      let queue = active.get(msg.guild.id);

      if(!queue) return msg.channel.send('لا يوجد أي موسيقى على قائمة الإنتظار :no_entry_sign:');

      let embed = new Discord.RichEmbed()
      .setAuthor(`${client.user.username}`, client.user.displayAvatarURL)
      let text = '';

      for (var i = 0; i < queue.songs.length; i++) {
        let num;
        if((i) > 8) {
          let st = `${i+1}`
          let n1 = converter.toWords(st[0])
          let n2 = converter.toWords(st[1])
          num = `:${n1}::${n2}:`
        } else {
        let n = converter.toWords(i+1)
        num = `:${n}:`
      }
        text += `${num} ${queue.songs[i].title} [${queue.songs[i].duration}]\n`
      }
      embed.setDescription(`الموسيقى على قائمة الإنتظار | ${msg.guild.name}\n\n ${text}`)
      msg.channel.send(embed)

    } else if(cmd === 'repeat') {

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('لا يوجد أي موسيقى على قائمة الإنتظار :no_entry_sign:');

      let queue = active.get(msg.guild.id);

      if(!queue || !queue.songs) return msg.channel.send('لا يوجد أي موسيقى لتكرارها :no_entry_sign:');

      if(queue.repeating) {
        queue.repeating = false;
        return msg.channel.send(':arrows_counterclockwise: **وضع التكرار** (`غير مفغل`)');
      } else {
        queue.repeating = true;
        return msg.channel.send(':arrows_counterclockwise: **وضع التكرار** (`مفغل`)');
      }

    } else if(cmd === 'forceskip') {

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('لا يوجد أي موسيقى على قائمة الإنتظار :no_entry_sign:');

      let queue = active.get(msg.guild.id);

      if(queue.repeating) {

        queue.repeating = false;

        msg.channel.send('ForceSkipped, Repeating mode is on.')

        queue.connection.dispatcher.end('ForceSkipping..')
// 2-0-0-2
        queue.repeating = true;

      } else {

        queue.connection.dispatcher.end('ForceSkipping..')

        msg.channel.send(':notes:تم تخطي الاغنيه الحاليه:notes:')

      }

     } else if(cmd === 'skipto') {

      let vCh = msg.member.voiceChannel;

      if(!vCh || vCh !== msg.guild.me.voiceChannel) return msg.channel.send('يجب ان تكون مستمع في غرفة صوتية :no_entry_sign:');

      let queue = active.get(msg.guild.id);

      if(!queue.songs || queue.songs < 2) return msg.channel.send('There is no music to skip to.');

    if(queue.repeating) return msg.channel.send('You can\'t skip, because repeating mode is on, run ' + `\`${prefix}repeat\` to turn off.`);

      if(!args[0] || isNaN(args[0])) return msg.channel.send('الرجاء إدخال رقم الأغنية للتخطي إليها  ' + prefix + `queue` + '  لعرض قائمة الانتظار لرؤية أرقام الأغاني.');

      let sN = parseInt(args[0]) - 1;

      if(!queue.songs[sN]) return msg.channel.send('There is no song with this number.');

      let i = 1;

      msg.channel.send(`:arrows_counterclockwise: تخطي الي :arrows_counterclockwise: **${queue.songs[sN].title}[${queue.songs[sN].duration}]**`)

      while (i < sN) {
        i++;
        queue.songs.shift();
      }

      queue.connection.dispatcher.end('SkippingTo..')

    } else if(cmd === 'Nowplaying') {

      let q = active.get(msg.guild.id);

      let now = npMsg(q)

      msg.channel.send(now.mes, now.embed)
      .then(me => {
        setInterval(() => {
          let noww = npMsg(q)
          me.edit(noww.mes, noww.embed)
        }, 5000)
      })

      function npMsg(queue) {

        let m = !queue || !queue.songs[0] ? ' ' : "شغال حالياً :musical_note:"

      const eb = new Discord.RichEmbed();

      eb.setColor(msg.guild.me.displayHexColor)

      if(!queue || !queue.songs[0]){
// 04
        eb.setTitle("لا يوجد أي موسيقى على قائمة الإنتظار :no_entry_sign:");
            eb.setDescription("\u23F9 "+bar(-1)+" "+volumeIcon(!queue?100:queue.volume));
      } else if(queue.songs) {

        if(queue.requester) {

          let u = msg.guild.members.get(queue.requester.id);

          if(!u)
            eb.setAuthor('Unkown (ID:' + queue.requester.id + ')')
          else
            eb.setAuthor(u.user.tag, u.user.displayAvatarURL)
        }

        if(queue.songs[0]) {
        try {
            eb.setTitle(queue.songs[0].title);
            eb.setURL(queue.songs[0].url);
        } catch (e) {
          eb.setTitle(queue.songs[0].title);
        }
}
        eb.setDescription(embedFormat(queue))

      }

      return {
        mes: m,
        embed: eb
      }

    }

      function embedFormat(queue) {

        if(!queue || !queue.songs) {
          return "No music playing\n\u23F9 "+bar(-1)+" "+volumeIcon(100);
        } else if(!queue.playing) {
          return "No music playing\n\u23F9 "+bar(-1)+" "+volumeIcon(queue.volume);
        } else { // 2-0-0-2


          let progress = (queue.connection.dispatcher.time / queue.songs[0].msDur);
          let prog = bar(progress);
          let volIcon = volumeIcon(queue.volume);
          let playIcon = (queue.connection.dispatcher.paused ? "\u23F8" : "\u25B6")
          let dura = queue.songs[0].duration;

          return playIcon + ' ' + prog + ' `[' + formatTime(queue.connection.dispatcher.time) + '/' + dura + ']`' + volIcon;


        }

      }

      function formatTime(duration) {
  var milliseconds = parseInt((duration % 1000) / 100),
    seconds = parseInt((duration / 1000) % 60),
    minutes = parseInt((duration / (1000 * 60)) % 60),
    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return (hours > 0 ? hours + ":" : "") + minutes + ":" + seconds;
}
// -0-4-
      function bar(precent) {

        var str = '';

        for (var i = 0; i < 12; i++) {

          let pre = precent
          let res = pre * 12;

          res = parseInt(res)

          if(i == res){
            str+="\uD83D\uDD18";
          }
          else {
            str+="▬";
          }
        }

        return str;

      }

      function volumeIcon(volume) {

        if(volume == 0)
           return "\uD83D\uDD07";
       if(volume < 30)
           return "\uD83D\uDD08";
       if(volume < 70)
           return "\uD83D\uDD09";
       return "\uD83D\uDD0A";

      }

    }

});

client.on("guildCreate", guild => {
  const embed = new Discord.RichEmbed()
   .setColor("GREEN")
   .setTitle(`**دخل البوت الي سيرفر جديد**`)
   .setDescription(`**  
    __Server Name__ → ${guild.name}
    __Server Owner__ → ${guild.owner}
    __Server ID__ → ${guild.id}
    __Mebmers Count__ → ${guild.memberCount}
    __Server Count__ → ${client.guilds.size}**`);
client.channels.get("735812544165576805").sendEmbed(embed)
});
client.on("guildDelete", guild => {
  const embed = new Discord.RichEmbed()
   .setColor("RED")
   .setTitle(`**خرج البوت من سيرفر**`)
   .setDescription(`**
     __Server Name__ → ${guild.name}
     __Server Owner__ → ${guild.owner}
     __Server ID__ → ${guild.id}
     __Mebmers Count__ → ${guild.memberCount}
     __Server Count__ → ${client.guilds.size}**`);
client.channels.get("735812544165576805").sendEmbed(embed)
});



client.on("message", m => {
  if (m.content === "!invite") {
    let Dashboard = "https://discord.gg/rgKfknS";
    var addserver ="https://discord.com/oauth2/authorize?client_id=690540717897941072&permissions=116751440&scope=bot";
    var SUPPORT = "https://discord.gg/rgKfknS";
    let embed = new Discord.RichEmbed().setTitle(`:robot: : رابط لإدخال البوت لسيرفرك`)
      .setDescription(` 
**[اضغط هنا للرابط](${addserver})** 

:wrench: : رابط سيرفر الدعم الفني للبوت
**[https://discord.gg/rgKfknS](${SUPPORT})**
   Remax Team :cyclone: 
`);
  
    m.react("✅");
    m.author.send(embed);
  }
});
client.on("message", m => {
  if (m.content === "!pay") {
    let Dashboard = "https://discord.gg/rgKfknS";
    var addserver ="https://discord.gg/rgKfknS";
    var SUPPORT = "https://discord.gg/rgKfknS";
    let embed = new Discord.RichEmbed().setTitle(` :receipt: معلومات عن اشتراك البوت وطريقة تجديده :receipt:`)
      .setDescription(` 
 :date:  :** وقت صلاحية انتهاء اشتراك البوت**
05/03/2024 5:28 am

:wrench: : رابط سيرفر الدعم الفني يمكن طلب إعادة تجديد او تمديد اشتراك البوت عن طريقه
**[https://discord.gg/rgKfknS](${addserver})**

:id: : **مع تقديم الرقم التالي**
    702581932848054312

`);
    m.react("✅");
    m.author.send(embed);
  }
});
client.on("message", m => {
  if (m.content === "!info") {
    let Dashboard = "https://discord.gg/rgKfknS";
    var addserver ="https://discord.gg/JZ3JWja";
    var SUPPORT = "https://discord.gg/rgKfknS";
    let embed = new Discord.RichEmbed().setTitle(`:robot: معلومات عن البوت :robot:`)
      .setDescription(` 
 :crown: :**صانع البوت**
**[Remax Team :cyclone: ](${addserver})**
:floppy_disk: : **اصدار البوت**
    V 1.0.2
:wrench: : **رابط سيرفر الدعم الفني للبوت**
**[https://discord.gg/rgKfknS](${SUPPORT})**`);
    m.react("✅");
    m.author.send(embed);
  }
});
client.on("message", m => {
  if (m.content ===  "!help") {
    let Dashboard = "https://discord.gg/rgKfknS";
    var addserver ="https://discord.gg/rgKfknS";
    var SUPPORT = "https://discord.gg/rgKfknS";
    let embed = new Discord.RichEmbed().setTitle(`:notes: قائمة الاوامر :notes:`)
      .setDescription(` 
> !Play : تشغيل الاغنية او اضافتها للقائمة او اكمال الاغنية [p] 
> !Pause : ايقاف مؤقت الاغنية  
> !Resume : اكمال الاغنية 
> !stop : لأيقاف الأغنية وخوج البوت من الروم
> !forceskip : لتخطي الأغنية بشكل مباشر
> !Queue : عرض القائمة 
> !skipto : لتخطي الأغنية الى الأغنية القادمة في طابور الموسيقى القادمة
> !Skip : تخطي للاغنية التالية 
> !Volume : تغيير الصوت [vol] 
> !Nowplaying : عرض مايتم تشغيله الان [np] 
> !Ping : سرعة استجابة البوت 
> !repeat : تكرار الاغنية 
> !Leave : الخروج من الروم الصوتي 

Remax bot support
**[https://discord.gg/rgKfknS](${addserver})**
`);
    
    m.react("✅");
    m.author.send(embed);
  }
});

const developers = ['533990626258059296'];
const adminprefix = "$";
client.on('message', message => {
    var argresult = message.content.split(` `).slice(1).join(' ');
      if (!developers.includes(message.author.id)) return;
      
  if (message.content.startsWith(adminprefix + 'setplay')) {
    client.user.setGame(argresult);
      message.channel.send("**:white_check_mark: | The Playing Status Has Been Changed To : ``"
   + `${argresult}` + "``**")
  } else 
  if (message.content.startsWith(adminprefix + 'setwatch')) {
  client.user.setActivity(argresult, {type:'WATCHING'});
      message.channel.send("**:white_check_mark: | The Watching Status Has Been Changed To : ``"
   + `${argresult}` + "``**")
  } else 
  if (message.content.startsWith(adminprefix + 'setlisten')) {
  client.user.setActivity(argresult , {type:'LISTENING'});
      message.channel.send("**:white_check_mark: | The Listening Status Has Been Changed To : ``"
   + `${argresult}` + "``**")
  } else 
  if (message.content.startsWith(adminprefix + 'setstream')) {
    client.user.setGame(argresult, "https://www.twitch.tv/remax");
      message.channel.send("**:white_check_mark: | The Streaming Status Has Been Changed To : ``"
   + `${argresult}` + "``**")
  }
  if (message.content.startsWith(adminprefix + 'setname')) {
  client.user.setUsername(argresult).then
      message.channel.send(`Changing The Name To ..**${argresult}** `)
} else
if (message.content.startsWith(adminprefix + 'setavatar')) {
  client.user.setAvatar(argresult);
    message.channel.send(`Changing The Avatar To :**${argresult}** `);
}
});




client.login(process.env.BOT_TOKEN).catch(err=> console.log("قد لايوجد توكن او التوكن متوقف . [KAHv1.6]"));