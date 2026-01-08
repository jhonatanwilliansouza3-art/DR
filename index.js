require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const STATS_FILE = './stats.json';
const VALORES = {goals:1e6,motm:2e6,assists:5e5,steals:350000,saves:3e5};
const TIPOS = {
  steal: {c:'!setsteal',n:'steals',m:'steal(s)',e:'<:Steals:1458727897408995360>'},
  goal: {c:'!setgoal',n:'goals',m:'gol(s)',e:'<:Goals:1458727896427270176>'},
  assist: {c:'!setassist',n:'assists',m:'assistência(s)',e:'<:Assist:1458727899107426316>'},
  mntm: {c:'!setmntm',n:'motm',m:'MNTM(s)',e:'<:mvp:1458727900256796858>'},
  save: {c:'!setsave',n:'saves',m:'save(s)',e:'<:Saves:1458727901657829511>'},
  valor: {e:':coin:'}
};

const calcVal = (d) => {
  const g = d?.goals||0;
  const m = d?.motm||0;
  const a = d?.assists||0;
  const s = d?.steals||0;
  const sv = d?.saves||0;
  return g*VALORES.goals + m*VALORES.motm + a*VALORES.assists + s*VALORES.steals + sv*VALORES.saves;
};

const carregar = () => {
  try {
    if(!fs.existsSync(STATS_FILE))return{};
    const dados = JSON.parse(fs.readFileSync(STATS_FILE,'utf8'));
    for(const id in dados){
      dados[id] = {
        steals:dados[id]?.steals||0,
        goals:dados[id]?.goals||0,
        assists:dados[id]?.assists||0,
        motm:dados[id]?.motm||0,
        saves:dados[id]?.saves||0,
        valor:calcVal(dados[id])
      };
    }
    salvar(dados);
    return dados;
  } catch(e){
    console.error('Erro ao carregar:',e);
    return{};
  }
};

const salvar = (d) => {
  try{fs.writeFileSync(STATS_FILE,JSON.stringify(d,null,2));}
  catch(e){console.error('Erro ao salvar:',e);}
};

client.on('clientReady',()=>console.log(`✅ Bot online: ${client.user.tag}`));

client.on('messageCreate',async(msg)=>{
  if(msg.author.bot)return;
  const cont = msg.content.toLowerCase();
  const part = msg.content.trim().split(/\s+/);
  const user = msg.mentions.users.first();
  
  let qtd=1;
  for(const p of part){
    const n=parseInt(p);
    if(!isNaN(n)&&n>0){qtd=n;break;}
  }

  for(const t in TIPOS){
    const {c,n,m} = TIPOS[t];
    if(c&&cont.startsWith(c)){
      if(!msg.member.permissions.has('Administrator'))return msg.reply('❌ Apenas admins podem alterar estatísticas!');
      if(!user)return msg.reply(`⚠️ Mencione um jogador para registrar ${m}!`);
      const stats = carregar();
      stats[user.id] = stats[user.id]||{steals:0,goals:0,assists:0,motm:0,saves:0,valor:0};
      stats[user.id][n]+=qtd;
      stats[user.id].valor=calcVal(stats[user.id]);
      salvar(stats);
      return msg.reply(`@${msg.author.username} setou ${qtd} ${m} para @${user.username}`);
    }
  }

  if(cont.startsWith('!stats')){
    const alvo=user||msg.author;
    const stats=carregar();
    const d=stats[alvo.id]||{steals:0,goals:0,assists:0,motm:0,saves:0,valor:0};
    const val=typeof d.valor==='number'?d.valor.toLocaleString('pt-BR'):'0';
    msg.reply(`📊 **Estatísticas de ${alvo.username}**
${TIPOS.steal.e} Steals: ${d.steals}
${TIPOS.goal.e} Gols: ${d.goals}
${TIPOS.assist.e} Assistências: ${d.assists}
${TIPOS.mntm.e} MNTM: ${d.motm}
${TIPOS.save.e} Saves: ${d.saves}
${TIPOS.valor.e} Valor total: ${val}`);
  }

  if(cont.startsWith('%ver')){
    const alvo=user||msg.author;
    const stats=carregar();
    const d=stats[alvo.id]||{steals:0,goals:0,assists:0,motm:0,saves:0,valor:0};
    const val=typeof d.valor==='number'?d.valor.toLocaleString('pt-BR'):'0';
    msg.reply(`📊 Stats de @${alvo.username}
${TIPOS.goal.e} Goals: ${d.goals}
${TIPOS.mntm.e} MOTM: ${d.motm}
${TIPOS.assist.e} Assists: ${d.assists}
${TIPOS.steal.e} Steals: ${d.steals}
${TIPOS.save.e} Saves: ${d.saves}
${TIPOS.valor.e} Valor total: ${val}`);
  }
});

client.login(process.env.DISCORD_TOKEN);
