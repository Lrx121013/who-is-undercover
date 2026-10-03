-- =============================================================
-- 谁是卧底出题器 · Supabase 数据库完整脚本
-- 特点：可重复执行（幂等），整段粘进 SQL Editor 跑即可
-- =============================================================

-- ---------- 扩展 ----------
create extension if not exists "pgcrypto";

-- ---------- 表结构 ----------

-- 用户资料（与 auth.users 一对一）
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text unique not null,
  avatar_url text,
  bio text,
  gender text,
  birthday date,
  level int default 1,
  exp int default 0,
  total_games int default 0,
  win_count int default 0,
  short_id text unique,                       -- 唯一短 ID，可搜索
  show_online boolean default true,
  created_at timestamptz default now()
);

-- 好友关系
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz default now(),
  unique(user_a, user_b)
);

-- 好友申请
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references profiles(id) on delete cascade,
  to_user uuid references profiles(id) on delete cascade,
  message text,
  status text default 'pending' check (status in ('pending','accepted','rejected','expired')),
  created_at timestamptz default now(),
  expires_at timestamptz
);
create unique index if not exists friend_requests_pending_idx
  on friend_requests(from_user, to_user) where status = 'pending';

-- 黑名单
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  blocked_user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, blocked_user_id)
);

-- 房间
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  host_id uuid references profiles(id) on delete cascade,
  password text,
  max_players int default 8,
  settings jsonb default '{}'::jsonb,
  status text default 'waiting' check (status in ('waiting','playing','finished')),
  created_at timestamptz default now()
);

-- 房间成员
create table if not exists room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  is_ready boolean default false,
  role text,
  word text,
  is_alive boolean default true,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

-- 投票（每轮每人一票）
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  round int not null,
  voter_id uuid references profiles(id) on delete cascade,
  target_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(room_id, round, voter_id)
);

-- 对局记录
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  winner text check (winner in ('civilian','undercover','third_party')),
  started_at timestamptz,
  ended_at timestamptz
);

-- 每局玩家数据
create table if not exists game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text,
  word text,
  is_winner boolean default false,
  votes_received int default 0,
  unique(game_id, user_id)
);

-- 词库（系统词库 author_id 为 null）
create table if not exists word_packs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_url text,
  author_id uuid references profiles(id) on delete set null,
  is_public boolean default false,
  likes int default 0,
  created_at timestamptz default now()
);

-- 词对
create table if not exists word_pairs (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid references word_packs(id) on delete cascade,
  civilian_word text not null,
  undercover_word text not null,
  difficulty int default 3 check (difficulty between 1 and 5),
  category text
);

-- 成就定义
create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  icon text,
  condition jsonb
);
-- 兼容旧库清理：修复历史脚本重复执行产生的重复数据
-- （旧版种子数据无唯一约束，跑两次会出现同名成就 / 同名官方词库）
delete from word_packs a using word_packs b
 where a.author_id is null and b.author_id is null and a.name = b.name
   and (a.created_at > b.created_at or (a.created_at = b.created_at and a.ctid > b.ctid));
delete from achievements a using achievements b
 where a.name = b.name and a.ctid > b.ctid;

-- 成就名唯一，保证种子数据可重复执行
create unique index if not exists achievements_name_key on achievements(name);

-- 用户成就
create table if not exists user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  achievement_id uuid references achievements(id) on delete cascade,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- 通知
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text,
  content jsonb default '{}'::jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- 房间聊天
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text,
  created_at timestamptz default now()
);

-- ---------- 索引 ----------
create index if not exists idx_members_room on room_members(room_id);
create index if not exists idx_members_room_user on room_members(room_id, user_id);
create index if not exists idx_votes_room_round on votes(room_id, round);
create index if not exists idx_votes_round_target on votes(room_id, round, target_id);
create index if not exists idx_msg_room on messages(room_id, created_at);
create index if not exists idx_notify_user on notifications(user_id, is_read);
create index if not exists idx_pairs_pack on word_pairs(pack_id);
create index if not exists idx_pairs_category on word_pairs(category);
create index if not exists idx_rooms_status on rooms(status);

-- ---------- 实时同步（幂等：重复执行不报错） ----------
do $$
declare
  t text;
begin
  foreach t in array array['rooms','room_members','votes','messages','notifications','games'] loop
    begin
      execute format('alter publication supabase_realtime add table %I', t);
    exception
      when duplicate_object then null;   -- 已在 publication 中
      when undefined_object then null;   -- publication 不存在（非 Supabase 环境）
    end;
  end loop;
end;
$$;

-- ---------- RLS ----------
alter table profiles enable row level security;
alter table friendships enable row level security;
alter table friend_requests enable row level security;
alter table blocks enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table votes enable row level security;
alter table games enable row level security;
alter table game_players enable row level security;
alter table word_packs enable row level security;
alter table word_pairs enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table notifications enable row level security;
alter table messages enable row level security;

-- profiles：可读全部，只能改自己
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated using (true);
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated using (auth.uid() = id);

-- friendships
drop policy if exists friendships_select on friendships;
create policy friendships_select on friendships for select to authenticated
  using (auth.uid() in (user_a, user_b));
drop policy if exists friendships_write on friendships;
create policy friendships_write on friendships for all to authenticated
  using (auth.uid() in (user_a, user_b)) with check (auth.uid() in (user_a, user_b));

-- friend_requests
drop policy if exists fr_select on friend_requests;
create policy fr_select on friend_requests for select to authenticated
  using (auth.uid() in (from_user, to_user));
drop policy if exists fr_write on friend_requests;
create policy fr_write on friend_requests for all to authenticated
  using (auth.uid() in (from_user, to_user)) with check (auth.uid() in (from_user, to_user));

-- blocks
drop policy if exists blocks_all on blocks;
create policy blocks_all on blocks for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- rooms：等待中人人可见；房主可改
drop policy if exists rooms_select on rooms;
create policy rooms_select on rooms for select to authenticated
  using (
    status = 'waiting'
    or host_id = auth.uid()
    or exists (select 1 from room_members m where m.room_id = rooms.id and m.user_id = auth.uid())
  );
drop policy if exists rooms_update on rooms;
create policy rooms_update on rooms for update to authenticated using (host_id = auth.uid());

-- room_members：房间可见即可读；自己可改准备；房主可改全部
drop policy if exists rm_select on room_members;
create policy rm_select on room_members for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from rooms r where r.id = room_members.room_id
               and (r.status = 'waiting' or r.host_id = auth.uid()
                    or exists (select 1 from room_members m2 where m2.room_id = r.id and m2.user_id = auth.uid())))
  );
drop policy if exists rm_insert on room_members;
create policy rm_insert on room_members for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists rm_update on room_members;
create policy rm_update on room_members for update to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from rooms r where r.id = room_members.room_id and r.host_id = auth.uid())
  );
drop policy if exists rm_delete on room_members;
create policy rm_delete on room_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from rooms r where r.id = room_members.room_id and r.host_id = auth.uid())
  );

-- votes：房间成员可读，自己可投
drop policy if exists votes_select on votes;
create policy votes_select on votes for select to authenticated
  using (exists (select 1 from room_members m where m.room_id = votes.room_id and m.user_id = auth.uid()));
drop policy if exists votes_insert on votes;
create policy votes_insert on votes for insert to authenticated with check (auth.uid() = voter_id);

-- games / game_players：房间成员可读；房主可写（函数为 security definer）
drop policy if exists games_select on games;
create policy games_select on games for select to authenticated
  using (exists (select 1 from room_members m where m.room_id = games.room_id and m.user_id = auth.uid()));
drop policy if exists games_host on games;
create policy games_host on games for all to authenticated
  using (exists (select 1 from rooms r where r.id = games.room_id and r.host_id = auth.uid()));

drop policy if exists gp_select on game_players;
create policy gp_select on game_players for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from games g join room_members m on m.room_id = g.room_id
               where g.id = game_players.game_id and m.user_id = auth.uid())
  );

-- word_packs：公开可读；作者可写
drop policy if exists wp_select on word_packs;
create policy wp_select on word_packs for select to authenticated
  using (is_public or author_id = auth.uid());
drop policy if exists wp_write on word_packs;
create policy wp_write on word_packs for all to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

-- word_pairs：词库可读即可读；作者可写
drop policy if exists wpairs_select on word_pairs;
create policy wpairs_select on word_pairs for select to authenticated
  using (exists (select 1 from word_packs p where p.id = word_pairs.pack_id and (p.is_public or p.author_id = auth.uid())));
drop policy if exists wpairs_write on word_pairs;
create policy wpairs_write on word_pairs for all to authenticated
  using (exists (select 1 from word_packs p where p.id = word_pairs.pack_id and p.author_id = auth.uid()))
  with check (exists (select 1 from word_packs p where p.id = word_pairs.pack_id and p.author_id = auth.uid()));

-- achievements / user_achievements
drop policy if exists ach_select on achievements;
create policy ach_select on achievements for select to authenticated using (true);
drop policy if exists ua_select on user_achievements;
create policy ua_select on user_achievements for select to authenticated using (auth.uid() = user_id);
drop policy if exists ua_insert on user_achievements;
create policy ua_insert on user_achievements for insert to authenticated with check (auth.uid() = user_id);

-- notifications：自己的可读；可发他人（不能发自己）
drop policy if exists notif_select on notifications;
create policy notif_select on notifications for select to authenticated using (auth.uid() = user_id);
drop policy if exists notif_update on notifications;
create policy notif_update on notifications for update to authenticated using (auth.uid() = user_id);
drop policy if exists notif_insert on notifications;
create policy notif_insert on notifications for insert to authenticated with check (auth.uid() <> user_id);

-- messages：房间成员可读可写
drop policy if exists msg_select on messages;
create policy msg_select on messages for select to authenticated
  using (exists (select 1 from room_members m where m.room_id = messages.room_id and m.user_id = auth.uid()));
drop policy if exists msg_insert on messages;
create policy msg_insert on messages for insert to authenticated
  with check (auth.uid() = user_id
    and exists (select 1 from room_members m where m.room_id = messages.room_id and m.user_id = auth.uid()));

-- ---------- 新用户资料触发器 ----------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nick text;
  v_avatar text;
  v_short text;
  i int;
begin
  -- 优先用注册时传入的昵称，其次是 Microsoft（OAuth）返回的姓名/邮箱前缀
  v_nick := coalesce(
    nullif(new.raw_user_meta_data->>'nickname', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(new.raw_user_meta_data->>'preferred_username', new.email, ''), '@', 1), ''),
    '玩家' || upper(substr(md5(new.id::text), 1, 4))
  );
  -- OAuth 头像（Microsoft 可能返回 picture，Supabase 归一化为 avatar_url）
  v_avatar := coalesce(
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    nullif(new.raw_user_meta_data->>'picture', '')
  );
  while exists (select 1 from profiles where nickname = v_nick) loop
    v_nick := v_nick || floor(random() * 10)::int;
  end loop;
  for i in 1..5 loop
    v_short := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into profiles(id, nickname, short_id, avatar_url) values (new.id, v_nick, v_short, v_avatar);
      return new;
    exception when unique_violation then
      -- 换一个短 ID 重试
    end;
  end loop;
  insert into profiles(id, nickname, short_id, avatar_url)
    values (new.id, v_nick, upper(substr(md5(new.id::text), 1, 6)), v_avatar);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- 搜索用户 ----------
create or replace function search_users(keyword text)
returns table(id uuid, nickname text, avatar_url text, level int, bio text)
language sql security definer set search_path = public, extensions as $$
  select p.id, p.nickname, p.avatar_url, p.level, p.bio
  from profiles p
  where p.id <> auth.uid()
    and (
      p.nickname ilike '%' || keyword || '%'
      or p.short_id = upper(keyword)
      or p.id::text like lower(keyword) || '%'
      or (length(keyword) > 5 and p.id in (select u.id from auth.users u where u.email = keyword))
    )
  order by p.level desc
  limit 20;
$$;

-- ---------- 好友 ----------
create or replace function list_friends()
returns setof profiles language sql security definer set search_path = public, extensions as $$
  select p.* from profiles p
  where p.id in (
    select case when f.user_a = auth.uid() then f.user_b else f.user_a end
    from friendships f
    where f.status = 'accepted' and (f.user_a = auth.uid() or f.user_b = auth.uid())
  );
$$;

create or replace function send_friend_request(to_user_id uuid, msg text)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if to_user_id = auth.uid() then raise exception '不能添加自己'; end if;
  if not exists (select 1 from profiles where id = to_user_id) then raise exception '用户不存在'; end if;
  if exists (select 1 from blocks
             where (user_id = auth.uid() and blocked_user_id = to_user_id)
                or (user_id = to_user_id and blocked_user_id = auth.uid())) then
    raise exception '对方暂不接受好友申请';
  end if;
  if exists (select 1 from friendships where status = 'accepted'
             and ((user_a = auth.uid() and user_b = to_user_id)
               or (user_b = auth.uid() and user_a = to_user_id))) then
    raise exception '你们已经是好友了';
  end if;
  if exists (select 1 from friend_requests
             where from_user = auth.uid() and to_user = to_user_id and status = 'pending') then
    raise exception '已发送过申请，等待对方验证';
  end if;
  insert into friend_requests(from_user, to_user, message, expires_at)
  values (auth.uid(), to_user_id, msg, now() + interval '7 days');
  insert into notifications(user_id, type, content)
  values (to_user_id, 'friend_request',
          jsonb_build_object('text', coalesce(msg, '请求添加你为好友')));
end;
$$;

create or replace function accept_friend_request(request_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_req friend_requests;
  a uuid;
  b uuid;
begin
  select * into v_req from friend_requests where id = request_id;
  if v_req.id is null or v_req.to_user <> auth.uid() or v_req.status <> 'pending' then
    raise exception '申请不存在或已处理';
  end if;
  update friend_requests set status = 'accepted' where id = request_id;
  a := least(v_req.from_user, v_req.to_user);
  b := greatest(v_req.from_user, v_req.to_user);
  insert into friendships(user_a, user_b, status) values (a, b, 'accepted')
  on conflict do nothing;
  insert into notifications(user_id, type, content)
  values (v_req.from_user, 'friend_request', jsonb_build_object('text', '已同意你的好友申请'));
end;
$$;

create or replace function reject_friend_request(request_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update friend_requests set status = 'rejected'
  where id = request_id and to_user = auth.uid() and status = 'pending';
end;
$$;

create or replace function unfriend(friend_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from friendships
  where status = 'accepted'
    and ((user_a = auth.uid() and user_b = friend_id)
      or (user_b = auth.uid() and user_a = friend_id));
end;
$$;

create or replace function block_user(target_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from friendships
  where ((user_a = auth.uid() and user_b = target_id) or (user_b = auth.uid() and user_a = target_id));
  delete from friend_requests
  where status = 'pending'
    and ((from_user = auth.uid() and to_user = target_id)
      or (to_user = auth.uid() and from_user = target_id));
  insert into blocks(user_id, blocked_user_id) values (auth.uid(), target_id)
  on conflict do nothing;
end;
$$;

create or replace function unblock_user(target_id uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  delete from blocks where user_id = auth.uid() and blocked_user_id = target_id;
end;
$$;

-- ---------- 通知 ----------
create or replace function push_notification(p_user uuid, p_type text, p_content jsonb)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if p_user <> auth.uid() then
    insert into notifications(user_id, type, content) values (p_user, p_type, p_content);
  end if;
end;
$$;

-- ---------- 房间 ----------
create or replace function create_room(settings jsonb, pwd text)
returns rooms language plpgsql security definer set search_path = public, extensions as $$
declare
  v_room rooms;
  v_code text;
  v_cap int;
  i int := 0;
  j int;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  -- 人数上限收敛到 2~12，避免脏配置
  v_cap := greatest(2, least(12, coalesce((settings->>'max_players')::int, 6)));
  loop
    i := i + 1;
    if i > 10 then raise exception '生成房间号失败，请重试'; end if;
    v_code := '';
    for j in 1..6 loop
      v_code := v_code || substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1);
    end loop;
    begin
      insert into rooms(room_code, host_id, password, max_players, settings)
      values (v_code, auth.uid(), nullif(btrim(pwd), ''), v_cap,
              coalesce(settings, '{}'::jsonb) || jsonb_build_object('max_players', v_cap))
      returning * into v_room;
      exit;
    exception when unique_violation then
      -- 房间号撞了，重试
    end;
  end loop;
  insert into room_members(room_id, user_id, is_ready)
  values (v_room.id, auth.uid(), true);
  return v_room;
end;
$$;

create or replace function join_room(code text, pwd text)
returns rooms language plpgsql security definer set search_path = public, extensions as $$
declare
  v_room rooms;
  v_count int;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  select * into v_room from rooms where room_code = upper(btrim(code));
  if v_room.id is null then raise exception '房间不存在'; end if;
  if v_room.status <> 'waiting' then raise exception '该房间游戏已开始'; end if;
  if v_room.password is not null and coalesce(btrim(pwd), '') <> v_room.password then
    raise exception '房间密码不正确';
  end if;
  if exists (select 1 from room_members where room_id = v_room.id and user_id = auth.uid()) then
    return v_room;
  end if;
  select count(*) into v_count from room_members where room_id = v_room.id;
  if v_count >= v_room.max_players then raise exception '房间已满'; end if;
  if exists (select 1 from blocks
             where (user_id = v_room.host_id and blocked_user_id = auth.uid())
                or (user_id = auth.uid() and blocked_user_id = v_room.host_id)) then
    raise exception '无法加入该房间';
  end if;
  insert into room_members(room_id, user_id) values (v_room.id, auth.uid());
  return v_room;
end;
$$;

create or replace function leave_room(p_room uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_host uuid;
  v_next uuid;
begin
  select host_id into v_host from rooms where id = p_room;
  delete from room_members where room_id = p_room and user_id = auth.uid();
  if v_host = auth.uid() then
    select user_id into v_next from room_members where room_id = p_room order by joined_at limit 1;
    if v_next is not null then
      update rooms set host_id = v_next where id = p_room;
    else
      update rooms set status = 'finished' where id = p_room;
    end if;
  end if;
end;
$$;

create or replace function transfer_host(p_room uuid, p_host uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from rooms where id = p_room and host_id = auth.uid()) then
    raise exception '仅房主可以转让';
  end if;
  if not exists (select 1 from room_members where room_id = p_room and user_id = p_host) then
    raise exception '目标不是房间成员';
  end if;
  update rooms set host_id = p_host where id = p_room;
end;
$$;

-- ---------- 游戏 ----------

-- 开始游戏：分配角色与词（支持自由配比、难度与类别筛选，2 人即可开局）
create or replace function start_game(p_room uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  r rooms;
  mem uuid[];
  n int;
  uc int;
  roles text[] := '{}';
  pair word_pairs;
  i int;
  v_role text;
  v_pack uuid;
  v_cats text[];
  v_diff int;
  allowed text[] := array['white','detective','prophet','double','disturber','stand_in','third_party'];
begin
  select * into r from rooms where id = p_room;
  if r.host_id <> auth.uid() then raise exception '仅房主可以开始游戏'; end if;
  if r.status <> 'waiting' then raise exception '游戏已开始或已结束'; end if;
  select array_agg(user_id order by joined_at) into mem from room_members where room_id = p_room;
  n := coalesce(array_length(mem, 1), 0);
  if n < 2 then raise exception '至少需要 2 名玩家'; end if;

  -- 指定词库：仅限公开词库或自己创建的词库，避免越权读取他人私有词库
  v_pack := nullif(r.settings->>'word_pack_id', '')::uuid;
  if v_pack is not null and not exists (
    select 1 from word_packs where id = v_pack and (is_public or author_id = auth.uid())
  ) then
    v_pack := null;
  end if;

  -- 选词：优先指定词库，其次公开词库；按类别 + 难度优选，命中不到再逐级放宽
  select coalesce(array_agg(x), '{}') into v_cats
    from jsonb_array_elements_text(coalesce(r.settings->'categories', '[]'::jsonb)) x;
  v_diff := coalesce((r.settings->>'difficulty')::int, 3);

  if v_pack is not null then
    select wp.* into pair from word_pairs wp
    where wp.pack_id = v_pack
      and (array_length(v_cats, 1) is null or wp.category = any(v_cats))
    order by abs(wp.difficulty - v_diff), random() limit 1;
    if pair.id is null then
      select wp.* into pair from word_pairs wp where wp.pack_id = v_pack order by random() limit 1;
    end if;
  end if;
  if pair.id is null then
    select wp.* into pair from word_pairs wp
    join word_packs p on p.id = wp.pack_id
    where p.is_public
      and (array_length(v_cats, 1) is null or wp.category = any(v_cats))
    order by abs(wp.difficulty - v_diff), random() limit 1;
  end if;
  if pair.id is null then
    select wp.* into pair from word_pairs wp
    join word_packs p on p.id = wp.pack_id
    where p.is_public order by random() limit 1;
  end if;
  if pair.id is null then raise exception '词库为空，请选择含词条的词库'; end if;

  -- 卧底人数：显式配置优先，否则按人数自动；始终 1 ≤ uc ≤ n-1
  uc := case
    when coalesce(r.settings->>'undercover_count', '') <> '' then (r.settings->>'undercover_count')::int
    when n <= 5 then 1 when n <= 9 then 2 else 3 end;
  if uc < 1 then uc := 1; end if;
  if uc > n - 1 then uc := n - 1; end if;
  for i in 1..uc loop roles := roles || '{undercover}'; end loop;

  -- 自定义角色：新字段 special_roles 优先，旧 roles 布尔表兜底
  if jsonb_typeof(r.settings->'special_roles') = 'array' then
    for v_role in select jsonb_array_elements_text(r.settings->'special_roles') loop
      if v_role = any(allowed) then roles := roles || v_role; end if;
    end loop;
  else
    if coalesce((r.settings->'roles'->>'white')::boolean, false) then roles := roles || '{white}'; end if;
    if coalesce((r.settings->'roles'->>'detective')::boolean, false) then roles := roles || '{detective}'; end if;
    if coalesce((r.settings->'roles'->>'prophet')::boolean, false) then roles := roles || '{prophet}'; end if;
    if coalesce((r.settings->'roles'->>'double')::boolean, false) then roles := roles || '{double}'; end if;
    if coalesce((r.settings->'roles'->>'disturber')::boolean, false) then roles := roles || '{disturber}'; end if;
    if coalesce((r.settings->'roles'->>'stand_in')::boolean, false) then roles := roles || '{stand_in}'; end if;
    if coalesce((r.settings->'roles'->>'third_party')::boolean, false) then roles := roles || '{third_party}'; end if;
  end if;

  if array_length(roles, 1) > n then roles := roles[1:n]; end if;
  while array_length(roles, 1) < n loop roles := roles || '{civilian}'; end loop;

  select array_agg(x order by random()) into roles from unnest(roles) x;

  for i in 1..n loop
    v_role := roles[i];
    update room_members
      set role = v_role,
          word = case v_role
            when 'civilian' then pair.civilian_word
            when 'detective' then pair.civilian_word
            when 'prophet' then pair.civilian_word
            when 'disturber' then pair.civilian_word
            when 'stand_in' then pair.civilian_word
            when 'undercover' then pair.undercover_word
            when 'white' then null
            when 'double' then pair.civilian_word || ' / ' || pair.undercover_word
            when 'third_party' then '暗号'
            else null end,
          is_alive = true
    where room_id = p_room and user_id = mem[i];
  end loop;

  insert into games(room_id, winner, started_at) values (p_room, null, now());

  update rooms set status = 'playing',
    settings = coalesce(r.settings, '{}'::jsonb) || jsonb_build_object(
      'game_phase', 'deal', 'round', 1, 'current_speaker', null, 'phase_ends_at', null,
      'speak_order_ids', '[]'::jsonb, 'last_settled_round', 0)
  where id = p_room;
end;
$$;

-- 侦探查验：服务端判定目标是否为卧底，避免客户端读取身份作弊
create or replace function investigate(p_room uuid, p_target uuid)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare
  v_role text;
begin
  if not exists (select 1 from room_members
                 where room_id = p_room and user_id = auth.uid()
                   and role = 'detective' and is_alive) then
    raise exception '只有存活的侦探可以查验';
  end if;
  select role into v_role from room_members where room_id = p_room and user_id = p_target;
  if v_role is null then raise exception '目标不存在'; end if;
  return v_role = 'undercover';
end;
$$;

-- 投票
create or replace function submit_vote(p_room uuid, p_round int, p_target uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from room_members where room_id = p_room and user_id = auth.uid() and is_alive) then
    raise exception '你已被淘汰或不在房间';
  end if;
  if p_round <> coalesce((select (settings->>'round')::int from rooms where id = p_room), 1) then
    raise exception '投票轮次已过期，请刷新页面';
  end if;
  if not exists (select 1 from room_members where room_id = p_room and user_id = p_target and is_alive) then
    raise exception '投票目标无效';
  end if;
  if p_target = auth.uid() then raise exception '不能投自己'; end if;
  if exists (select 1 from votes where room_id = p_room and round = p_round and voter_id = auth.uid()) then
    raise exception '本轮已投票';
  end if;
  insert into votes(room_id, round, voter_id, target_id)
  values (p_room, p_round, auth.uid(), p_target);
end;
$$;

-- 结算本轮：淘汰最高票；平票默认无人出局（仅剩两人且开启投票时随机出局，避免僵局）
-- 胜负判定与客户端 checkWinner 保持一致
create or replace function settle_round(p_room uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  r rooms;
  v_round int;
  v_settled int;
  v_vote_on boolean;
  max_c int;
  n_top int;
  top_target uuid;
  winner text;
  alive_cnt int;
  eliminated int;
  alive_uc int;
  alive_other int;
  alive_third int;
  speak bigint;
begin
  select * into r from rooms where id = p_room;
  if r.host_id <> auth.uid() then raise exception '仅房主可以结算'; end if;
  if r.status <> 'playing' then return null; end if;
  v_round := coalesce((r.settings->>'round')::int, 1);
  -- 幂等：同一轮重复结算（如连点）直接忽略，避免跳轮
  v_settled := coalesce((r.settings->>'last_settled_round')::int, 0);
  if v_settled = v_round then return null; end if;
  v_vote_on := coalesce((r.settings->>'enable_vote')::boolean, true);

  select max(c), count(*) into max_c, n_top
  from (select count(*) c from votes
        where room_id = p_room and round = v_round group by target_id) t;

  select count(*) into alive_cnt from room_members where room_id = p_room and is_alive;

  if coalesce(n_top, 0) = 1 then
    select target_id into top_target from votes
    where room_id = p_room and round = v_round
    group by target_id having count(*) = max_c limit 1;
  elsif v_vote_on and alive_cnt = 2 then
    -- 平票 / 未投票且仅剩两人：随机淘汰一人
    select user_id into top_target from room_members
    where room_id = p_room and is_alive order by random() limit 1;
  end if;

  if top_target is not null then
    update room_members set is_alive = false where room_id = p_room and user_id = top_target;
  end if;

  select count(*) filter (where not is_alive) into eliminated from room_members where room_id = p_room;
  select count(*) filter (where role = 'undercover') into alive_uc from room_members where room_id = p_room and is_alive;
  select count(*) into alive_other from room_members where room_id = p_room and is_alive;
  alive_other := alive_other - alive_uc;
  select count(*) filter (where role = 'third_party') into alive_third from room_members where room_id = p_room and is_alive;

  winner := null;
  if alive_uc = 0 then winner := 'civilian';
  elsif alive_uc > alive_other then winner := 'undercover';
  elsif alive_uc = alive_other and alive_uc > 0 and eliminated > 0 then winner := 'undercover';
  elsif alive_third > 0 and alive_other <= 2 then winner := 'third_party';
  end if;

  if winner is not null then
    update rooms set status = 'finished',
      settings = coalesce(r.settings, '{}'::jsonb)
        || jsonb_build_object('game_phase', 'finished', 'last_settled_round', v_round)
    where id = p_room;
    return winner;
  end if;

  speak := coalesce((r.settings->>'speak_time')::bigint, 60);
  update rooms
    set settings = coalesce(r.settings, '{}'::jsonb) || jsonb_build_object(
      'game_phase', 'speak', 'round', v_round + 1, 'current_speaker', null,
      'phase_ends_at', (extract(epoch from now()) + speak) * 1000,
      'speak_order_ids', '[]'::jsonb, 'last_settled_round', v_round)
    where id = p_room;
  return null;
end;
$$;

-- 结束游戏：写战绩、更新统计与成就（幂等：重复调用不会重复加分）
create or replace function finish_game(p_room uuid, p_winner text)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  g games;
  r rooms;
begin
  select * into r from rooms where id = p_room;
  if r.host_id <> auth.uid() then raise exception '仅房主可以结算'; end if;
  if p_winner not in ('civilian', 'undercover', 'third_party') then
    raise exception '无效的胜方';
  end if;
  select * into g from games where room_id = p_room order by started_at desc limit 1;
  if g.id is null then return; end if;
  if g.ended_at is not null then return; end if;   -- 已结算过，直接返回

  update games set winner = p_winner, ended_at = now() where id = g.id;

  insert into game_players(game_id, user_id, role, word, is_winner, votes_received)
  select g.id, rm.user_id, rm.role, rm.word,
    case
      when p_winner = 'undercover' and rm.role = 'undercover' then true
      when p_winner = 'civilian' and rm.role not in ('undercover', 'third_party') then true
      when p_winner = 'third_party' and rm.role = 'third_party' then true
      else false end,
    (select count(*) from votes v where v.room_id = p_room and v.target_id = rm.user_id)
  from room_members rm where rm.room_id = p_room
  on conflict do nothing;

  update profiles p set
    total_games = p.total_games + 1,
    win_count = p.win_count + (case when gp.is_winner then 1 else 0 end),
    exp = p.exp + (case when gp.is_winner then 50 else 20 end),
    level = ((p.exp + (case when gp.is_winner then 50 else 20 end)) / 100) + 1
  from game_players gp
  where gp.game_id = g.id and gp.user_id = p.id;

  -- 解锁成就，并对本次真正新解锁的玩家发通知
  with newly as (
    insert into user_achievements(user_id, achievement_id)
    select gp.user_id, a.id
    from game_players gp cross join achievements a
    where gp.game_id = g.id
      and (
        (a.condition->>'type' = 'first_game')
        or (a.condition->>'type' = 'first_win' and gp.is_winner)
        or (a.condition->>'type' = 'undercover_win' and gp.is_winner and gp.role = 'undercover')
        or (a.condition->>'type' = 'games_10'
            and (select total_games from profiles where id = gp.user_id) >= (a.condition->>'count')::int)
        or (a.condition->>'type' = 'hot_seat' and gp.votes_received >= 3)
      )
    on conflict do nothing
    returning user_id
  )
  insert into notifications(user_id, type, content)
  select distinct user_id, 'achievement', jsonb_build_object('text', '解锁新成就，去成就墙看看')
  from newly;
end;
$$;

-- ---------- 词库 ----------
create or replace function like_pack(p_pack uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  update word_packs set likes = likes + 1 where id = p_pack and is_public;
end;
$$;

-- ---------- 种子数据（幂等，重复执行不会翻倍） ----------
insert into achievements(name, description, icon, condition)
select v.name, v.description, v.icon, v.condition::jsonb
from (values
  ('初出茅庐', '完成第一局游戏', '🌱', '{"type":"first_game"}'),
  ('首胜', '赢得第一局游戏', '🏅', '{"type":"first_win"}'),
  ('王牌卧底', '首次以卧底身份获胜（一穿三）', '🕵️', '{"type":"undercover_win"}'),
  ('十场老手', '累计完成 10 局游戏', '🎯', '{"type":"games_10","count":10}'),
  ('半百将军', '累计完成 50 局游戏', '⚔️', '{"type":"games_10","count":50}'),
  ('焦点人物', '单局获得 3 票及以上', '🔥', '{"type":"hot_seat"}')
) as v(name, description, icon, condition)
where not exists (select 1 from achievements a where a.name = v.name);

insert into word_packs(name, description, author_id, is_public, likes)
select v.name, v.description, null, true, v.likes
from (values
  ('官方 · 经典日常', '最常见的生活用品，适合破冰热局', 42),
  ('官方 · 影视娱乐', '电影梗与网络热词，年轻人最爱', 31),
  ('官方 · 地狱相似', '高相似度地狱词对，高手局专用', 18)
) as v(name, description, likes)
where not exists (select 1 from word_packs w where w.name = v.name and w.author_id is null);

-- 词对：仅在该词库还没有任何词条时写入，避免重复执行翻倍
insert into word_pairs(pack_id, civilian_word, undercover_word, difficulty, category)
select p.id, d.civ, d.und, d.diff, '日常生活'
from word_packs p
cross join (values
  ('牛奶', '豆浆', 1),
  ('西瓜', '冬瓜', 2),
  ('筷子', '刀叉', 2),
  ('自行车', '电动车', 2),
  ('沙发', '床', 2),
  ('雨伞', '雨衣', 3),
  ('咖啡', '奶茶', 3),
  ('毛巾', '浴巾', 4),
  ('耳机', '音箱', 3),
  ('公交', '地铁', 3),
  ('蛋糕', '面包', 4),
  ('苹果', '蛇果', 5)
) as d(civ, und, diff)
where p.name = '官方 · 经典日常'
  and not exists (select 1 from word_pairs w where w.pack_id = p.id);

insert into word_pairs(pack_id, civilian_word, undercover_word, difficulty, category)
select p.id, d.civ, d.und, d.diff, '影视娱乐'
from word_packs p
cross join (values
  ('周星驰', '成龙', 2),
  ('微信', 'QQ', 3),
  ('抖音', 'B站', 3),
  ('口红', '唇膏', 5),
  ('空调', '风扇', 3),
  ('红包', '打赏', 3),
  ('电视剧', '电影', 3),
  ('耳机', '耳麦', 4),
  ('奶茶', '可乐', 2),
  ('孙悟空', '猪八戒', 3)
) as d(civ, und, diff)
where p.name = '官方 · 影视娱乐'
  and not exists (select 1 from word_pairs w where w.pack_id = p.id);

insert into word_pairs(pack_id, civilian_word, undercover_word, difficulty, category)
select p.id, d.civ, d.und, d.diff, '地狱'
from word_packs p
cross join (values
  ('牛奶', '羊奶', 5),
  ('红茶', '绿茶', 4),
  ('风扇', '空调扇', 5),
  ('玫瑰', '月季', 5),
  ('菠萝', '凤梨', 4),
  ('红薯', '紫薯', 4),
  ('字典', '词典', 5),
  ('青蛙', '牛蛙', 4),
  ('樱桃', '车厘子', 4),
  ('粥', '稀饭', 5)
) as d(civ, und, diff)
where p.name = '官方 · 地狱相似'
  and not exists (select 1 from word_pairs w where w.pack_id = p.id);

-- ---------- Storage：头像桶 ----------
insert into storage.buckets(id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_read on storage.objects;
create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');

drop policy if exists avatars_write on storage.objects;
create policy avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_update on storage.objects;
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_delete on storage.objects;
create policy avatars_delete on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);