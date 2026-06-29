import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.ENVPATH });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Conversations keyed by group id. Each line = [slot, text]; slot indexes into the
// group's member list (0 = creator). Members are provisioned so every slot maps to a
// distinct person, giving each chat a real multi-person feel.
const CONVOS = {
  // dining — zrc*, Lucas, Alireza, kevin
  '89230db6-9663-4d7e-aed1-66ed9b44ebae': [
    [0,"Anyone been to the new ramen place on College Ave? Worth it?"],
    [1,"Yeah went last week, the tonkotsu is solid. Bit of a wait around 7pm tho"],
    [2,"Okonomi or Ramen Katsu? I keep mixing them up lol"],
    [1,"Ramen Katsu, next to CTB"],
    [3,"BRBs work there?"],
    [0,"Nope, cash or card only. But Trillium and Okenshields take BRBs if anyone wants to meet for lunch tmrw"],
    [2,"down for Trillium ~12:30?"],
    [0,"works, see y'all there"],
  ],
  // Cornell Running Club — zrc*, Lucas, Felix, Nick, hawk
  '15d04a8b-f0ac-4440-b213-6b3d3b9b947e': [
    [0,"Morning run tomorrow! Beebe Lake loop, meeting at the footbridge 7am"],
    [1,"how long is the full loop again?"],
    [0,"about 3.2 miles if we do the full perimeter, mostly flat"],
    [2,"I'll be there. Anyone have a spare headlamp, still kinda dark at 7"],
    [3,"I've got an extra, can bring it"],
    [4,"what pace are we thinking? trying not to die lol"],
    [0,"easy conversational, ~9:30/mi. nobody gets dropped 🙂"],
    [2,"perfect, see everyone at the bridge"],
  ],
  // CS Study Group — witty*, Kaiyi, Minseong, Charles
  '2468a760-1cdb-4922-a972-064de1babf1a': [
    [0,"prelim 2 for 2110 is next thursday, want to do a group review this weekend?"],
    [1,"yes please, the BST + heap stuff is killing me"],
    [2,"Uris or Mann? Mann has the bigger whiteboards"],
    [0,"Mann 3rd floor, sat 2pm. I'll grab a room"],
    [3,"can someone re-explain the difference between the recurrences for mergesort vs quicksort"],
    [1,"master theorem, quicksort worst case is O(n^2) when pivot is bad. I'll bring my notes"],
    [0,"booked Mann 360 for 2-5 sat. bring practice prelims"],
    [2,"🙏 lifesaver"],
  ],
  // Board Game Night — Charlle*, Dianeth, Marilyn, mayonaise, Alinaaaa, Cindy
  '8fa3e466-0e85-4a8b-a433-508b42e9a140': [
    [0,"Friday board game night is on! RPCC multipurpose room, 7pm"],
    [1,"what are we playing? please not 4 hour Twilight Imperium again 😭"],
    [0,"haha no. Catan, Codenames, maybe Avalon if enough people"],
    [2,"I can bring Codenames and Wingspan"],
    [3,"how many people so far?"],
    [0,"6 confirmed including me. room fits like 20 so bring friends"],
    [4,"I'll bring snacks 🍪"],
    [5,"count me in, haven't played Avalon in forever"],
    [0,"perfect see everyone friday 7!"],
  ],
  // 二手群 — Rex*, zrc, Roy, Marilyn  (Chinese secondhand context)
  '492c8fae-5523-4773-96e0-0c593659265e': [
    [0,"出一个宜家书桌，八成新，搬家急出，$25 自提 collegetown"],
    [1,"还在吗？桌子多大的"],
    [0,"120x60，白色的，腿可以拆"],
    [1,"行 我要了，今晚方便取吗"],
    [0,"可以 我发你地址"],
    [2,"有人出自行车吗 通勤用 二手就行"],
    [3,"我朋友有一辆 capitec 的 改天我问问价"],
    [2,"好的谢谢🙏"],
  ],
  // Cornell Photography — Alinaaaa*, Marilyn, Dianeth, Charles
  '6a195567-6b58-4dc4-bcea-c4b9ae98db18': [
    [0,"Golden hour photo walk this weekend? Libe Slope + Arts Quad"],
    [1,"yes! sunset is around 8:15 now so meet 7:30?"],
    [0,"perfect. I'll be the one with the tripod lol"],
    [2,"do I need a fancy camera or is phone ok"],
    [0,"phone is totally fine, it's more about the light + composition"],
    [3,"can someone show me how to shoot in manual, never figured out shutter speed"],
    [1,"I'll bring my Fuji, can walk you through it"],
    [0,"see everyone sat 7:30 at the top of Libe Slope 📷"],
  ],
  // Cooking & Foodie — Cindy*, Keer Wang, mayonaise, Charlle, Alinaaaa
  '723113fd-d777-4cf1-9187-4ffbc4a6dda2': [
    [0,"Hotpot potluck this weekend? My apartment in Collegetown has a big table"],
    [1,"YES it's finally cold enough for hotpot 🍲"],
    [0,"I'll get the broth base + meat, can people bring veggies / sides?"],
    [2,"I'll bring enoki, tofu, and fish balls"],
    [3,"I can do the dipping sauce bar, sesame + garlic + chili oil"],
    [4,"bringing drinks 🧋"],
    [0,"amazing. saturday 6pm, I'll drop the address. ~$8/person for the base stuff"],
    [1,"perfect see everyone sat!"],
  ],
  // Career Prep Network — Lucas*, zrc, witty
  'fb52c681-7cf9-487a-b368-19ff946bbabf': [
    [0,"Anyone else grinding new grad apps? Let's share leads + do resume swaps"],
    [1,"I'm in. Got a referral for Stripe if anyone's applying SWE"],
    [2,"oh that'd be huge, I'll dm you my resume"],
    [0,"also the career fair is week after next, Statler. bring printed resumes"],
    [1,"do people still bring printed ones? lol"],
    [0,"some recruiters still ask. doesn't hurt to have 10"],
    [2,"anyone done the Citadel OA? heard it's brutal"],
    [0,"yeah it's timed + hard. I have notes, will share"],
  ],
  // Cornell Hiking & Outdoors — Nick*, hawk, Felix, Keer Wang, Charles
  '2119d187-2a03-41ea-8c31-1ff6e30bcbc3': [
    [0,"Planning a Cascadilla Gorge hike sat morning, who's in?"],
    [1,"in! is it slippery after the rain?"],
    [0,"the gorge steps can be wet, wear real shoes not slides 😅"],
    [2,"can we carpool? I don't have a car"],
    [3,"I can drive 3, leaving from north campus 9am"],
    [4,"I'll join the carpool, thanks Felix"],
    [0,"great. trailhead is at the bottom of College Ave. ~1.5h round trip"],
    [1,"bringing water + granola bars for anyone who forgets"],
  ],
  // Chinese Student Association — Keer Wang*, zrc, Cindy, Kaiyi, Minseong, Alinaaaa
  '744f6267-aa33-4fe2-9839-290585c73eb8': [
    [0,"中秋活动定在下周五啦，Willard Straight，有月饼和游戏🥮"],
    [1,"太好了 需要帮忙布置吗"],
    [0,"需要！周五下午4点来帮忙摆桌子的扣1"],
    [2,"1 我可以来"],
    [3,"1 我也行 顺便带个相机拍照"],
    [4,"请问非会员可以参加吗 想带室友一起"],
    [0,"当然可以 欢迎带朋友 免费的"],
    [5,"好耶 周五见 🎑"],
  ],
  // Movie! — zrc* (+ provisioned members)
  'f2557feb-b5d0-446c-923f-15e5f390c2db': [
    [0,"Movie group! 🎬 Cinemapolis is showing Fargo this weekend — anyone want to go together?"],
    [1,"ooh I love the Coens, I'm down"],
    [2,"what time? saturday evening works for me"],
    [0,"7:10pm Saturday, tickets are ~$11"],
    [3,"can we grab dinner in collegetown before?"],
    [1,"yes! meet at 5:30?"],
    [0,"perfect, I'll book 4 tickets 🍿"],
    [2,"see you sat!"],
  ],
  // Vacation — zrc* (+ provisioned members)
  '9c83c24f-d743-478e-98b0-34772ee5fbce': [
    [0,"Vacation planning ✈️ thinking a weekend trip over break — NYC or Boston?"],
    [1,"NYC! the bus from Ithaca is ~$30 round trip if you book early"],
    [2,"Boston's nice but NYC has more to do for 2 days"],
    [0,"let's do NYC, fri–sun"],
    [3,"airbnb in Brooklyn is way cheaper than Manhattan, I can look"],
    [1,"I'll check the bus times and post them"],
    [0,"awesome, this is happening 🎉"],
  ],
  // Metalcore Musicians & Listeners — Fay* (+ provisioned members)
  'd4ad9583-e62c-4ad0-9599-84d456c8a26c': [
    [0,"Metalcore heads 🤘 been spinning the new Architects record, insane production"],
    [1,"yesss. if you like that check out ERRA and Spiritbox"],
    [2,"Spiritbox is so good. any shows near Ithaca soon?"],
    [0,"there's a metal night in Syracuse next month, could carpool"],
    [3,"down to carpool, I have a car"],
    [1,"post it on the rideshare board when it's closer 🤘"],
  ],
};

function membersOrdered(rows) {
  return rows.slice().sort((a, b) => (a.role === 'creator' ? -1 : b.role === 'creator' ? 1 : 0));
}

async function ensureMembers(gid, ordered, needed, pool) {
  if (ordered.length >= needed) return ordered;
  const have = new Set(ordered.map(m => m.user_id));
  const cands = pool.filter(u => !have.has(u.id));
  while (ordered.length < needed && cands.length) {
    const u = cands.splice(Math.floor(Math.random() * cands.length), 1)[0];
    const { error } = await sb.from('group_members').insert({ group_id: gid, user_id: u.id, role: 'member' });
    if (!error) { ordered.push({ user_id: u.id, role: 'member' }); have.add(u.id); }
  }
  await sb.from('groups').update({ member_count: ordered.length, updated_at: new Date().toISOString() }).eq('id', gid);
  return ordered;
}

async function main() {
  const dry = process.env.DRY === '1';
  const { data: pool } = await sb.from('users').select('id, first_name').eq('is_verified', true).limit(200);
  let totalPlanned = 0, totalInserted = 0, membersAdded = 0;

  for (const gid of Object.keys(CONVOS)) {
    const lines = CONVOS[gid];
    // skip if already seeded (avoid double-seeding)
    const { count: existing } = await sb.from('group_messages').select('id', { count: 'exact', head: true }).eq('group_id', gid).is('deleted_at', null);
    if ((existing || 0) > 2) { console.log(`skip ${gid} (already ${existing} msgs)`); continue; }

    const { data: mem } = await sb.from('group_members').select('user_id, role').eq('group_id', gid);
    if (!mem || mem.length === 0) { console.log(`skip ${gid} (no members)`); continue; }
    let ordered = membersOrdered(mem);

    const needed = Math.max(...lines.map(([slot]) => slot)) + 1;
    const before = ordered.length;
    if (!dry) ordered = await ensureMembers(gid, ordered, needed, pool);
    membersAdded += Math.max(0, ordered.length - before);

    const base = Date.now() - (1 + Math.floor(Math.random() * 4)) * 24 * 3600 * 1000;
    let t = base;
    const rows = lines.map(([slot, text]) => {
      t += (3 + Math.floor(Math.random() * 50)) * 60 * 1000; // 3–53 min gaps
      const sender = ordered[slot % ordered.length].user_id;
      return { group_id: gid, sender_id: sender, content: text, message_type: 'text', created_at: new Date(t).toISOString(), updated_at: new Date(t).toISOString() };
    });
    totalPlanned += rows.length;
    if (dry) { console.log(`[dry] ${gid}: ${rows.length} msgs, need ${needed} members (have ${before})`); continue; }
    const { data: ins, error } = await sb.from('group_messages').insert(rows).select('id');
    if (error) { console.log(`ERR ${gid}: ${error.message}`); continue; }
    totalInserted += ins.length;
    console.log(`✅ ${gid}: +${ins.length} messages (${ordered.length} members)`);
  }
  console.log(`\nPlanned ${totalPlanned}, inserted ${totalInserted}, members added ${membersAdded}${dry ? ' (dry run)' : ''}`);
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
