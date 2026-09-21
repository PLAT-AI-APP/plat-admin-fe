# -*- coding: utf-8 -*-
"""로컬 plat DB에 세계관 검수용 시드를 넣는 SQL을 만든다. 전부 INSERT 만 한다."""
import os, textwrap

B = 7350000000000000000
def i(n): return B + n

# ---- ids ----
U = {1: i(1), 2: i(2), 3: i(3)}                       # users
C = {1: i(11), 2: i(12), 3: i(13)}                    # creators
V = {n: i(100 + n) for n in range(1, 7)}              # universes
UP = {n: i(200 + n) for n in range(1, 7)}             # universe profile files
UA_F = {n: i(300 + n) for n in range(1, 10)}           # asset files
USR_F = {n: i(400 + n) for n in range(1, 4)}          # user profile files
CH_F = {n: i(500 + n) for n in range(1, 4)}           # character profile files

NOW = "NOW(6)"

users = [
    (1, "하늘빛작가", "로판만 8년째 씁니다. 기사물 좋아하시면 반가워요.", "FEMALE", "1994-03-12", "ACTIVE", USR_F[1], "sky@example.com"),
    (2, "밤의서고",   "밤에만 글이 써지는 사람. 호러 · 미스터리 위주.",       "MALE",   "1989-11-02", "ACTIVE", USR_F[2], "night@example.com"),
    (3, "무천도장",   "무협 한 우물.",                                        "MALE",   "1996-07-21", "SUSPENDED", USR_F[3], "moocheon@example.com"),
]
creators = [(1, 1, "GOLD", "APPROVED"), (2, 2, "SILVER", "APPROVED"), (3, 3, "BRONZE", "SUSPENDED")]

# n, creator, status, visibility, review, category, tendency, comment, chat, like, reject
universes = [
    (1, 1, "ACTIVE",   "PUBLIC",   "APPROVED", "ROMANCE",      "FEMALE_ORIENTED", 1, 128430, 9821, None),
    (2, 2, "ACTIVE",   "PUBLIC",   "PENDING",  "DRAMA",        "ALL",             1,   2140,  318, None),
    (3, 1, "ACTIVE",   "UNLISTED", "APPROVED", "FANTASY",      "ALL",             1,  45120, 3310, None),
    (4, 2, "INACTIVE", "PRIVATE",  "REJECTED", "HORROR",       "FEMALE_ORIENTED", 1,    310,   24,
     "선정적 표현이 앱 기준을 넘습니다. 3화 후반부 묘사를 수정한 뒤 다시 제출해 주세요."),
    (5, 3, "ACTIVE",   "PUBLIC",   "PENDING",  "MARTIAL_ARTS", "MALE_ORIENTED",   1,   8820,  641, None),
    (6, 1, "ACTIVE",   "PUBLIC",   "APPROVED", "MYSTERY",      "ALL",             0,  67310, 5204, None),
]

# n -> (title, introduce, description, detail_setting)
KO = {
    1: ("몰락 기사가문의 검사", "충성심 하나로 사는 여기사",
        "몰락한 기사 가문의 마지막 후예. 어릴 때부터 검술만 파고들어 왕국 기사단 중에서도 손꼽히는 실력자가 됐다. "
        "무뚝뚝하고 감정 표현이 서툴지만, 한번 정한 주군에게는 목숨을 걸 만큼 우직하다. 겉으론 냉정해 보여도 혼자 있을 땐 의외로 허당끼가 있다.",
        "전장에서 목숨을 구해준 낯선 용병에게, 갑옷도 벗지 않은 채 그녀가 무릎을 꿇는다. \"오늘부터 제 검은 당신의 것입니다.\""),
    2: ("심야의 편의점", "새벽 2시에만 열리는 가게",
        "도심 골목 끝, 새벽 2시부터 4시까지만 불이 켜지는 편의점. 손님은 하루에 한 명뿐이고, 그 한 명은 언제나 무언가를 잃어버린 사람이다. "
        "점원은 잃어버린 것의 이름을 물어보고, 값을 치를 수 있는 사람에게만 그것을 돌려준다.",
        "점원은 손님의 사연을 절대 먼저 캐묻지 않는다. 손님이 스스로 말할 때까지 계산대만 닦는다."),
    3: ("황혼의 마법학교", "해가 지면 수업이 시작된다",
        "낮에는 평범한 기숙학교, 해가 지면 마법학교가 되는 곳. 학생들은 자신이 밤에 무엇을 배웠는지 아침이면 잊는다. "
        "단 한 명, 기억을 잃지 않는 학생이 전학을 오면서 학교의 규칙이 흔들리기 시작한다.",
        "밤의 교사들은 학생의 이름을 부르지 않고 번호로 부른다. 이름을 부르면 기억이 남기 때문이다."),
    4: ("검은 달의 계약", "달이 검게 뜨는 밤의 거래",
        "한 달에 한 번, 달이 검게 뜨는 밤에만 열리는 시장. 무엇이든 팔 수 있지만 값은 반드시 '자신의 무언가'로 치러야 한다. "
        "기억, 목소리, 사람을 알아보는 능력 같은 것들이 매대에 올라온다.",
        "거래가 끝나면 상인은 값으로 받은 것을 그 자리에서 삼킨다. 되돌릴 방법은 없다."),
    5: ("무림 객잔의 주인", "강호의 소문이 모이는 곳",
        "강호 한복판, 어느 문파에도 속하지 않은 객잔. 주인은 무공을 쓰지 않는다고 알려져 있지만, 이 객잔에서 소란을 피운 자는 "
        "지금까지 한 명도 제 발로 걸어 나간 적이 없다.",
        "주인은 손님의 무공 수위를 첫 잔을 따르는 손목의 각도로 읽는다."),
    6: ("별을 삼킨 고래", "바다 밑에 가라앉은 이야기",
        "먼바다에서 별을 삼켰다는 고래를 쫓는 이야기. 고래를 본 사람은 많지만 돌아온 사람은 셋뿐이고, 셋 다 같은 날 같은 시각에 사라졌다. "
        "네 번째 목격자가 되려는 사람들이 항구로 모여든다.",
        "고래는 소리로 먼저 나타난다. 뱃사람들은 그 소리를 들으면 노래를 멈춘다."),
}
EN1 = ("Fallen House Knight", "A knight who lives on loyalty",
       "The last heir of a fallen knightly house. She has trained with the sword since childhood and is counted among "
       "the finest in the royal order. Blunt and clumsy with feelings, but once she chooses a liege she will give her "
       "life for them. Cold on the surface, surprisingly hapless when alone.",
       "She kneels before the stranger who saved her on the battlefield, still in her armor. \"From today my sword is yours.\"")
JA1 = ("没落騎士家の剣士", "忠誠心だけで生きる女騎士",
       "没落した騎士家の最後の後継者。幼い頃から剣術だけを磨き、王国騎士団でも指折りの実力者になった。無愛想で感情表現は苦手だが、"
       "一度主と決めた相手には命を懸けるほど一途である。",
       "戦場で命を救ってくれた見知らぬ傭兵に、鎧も脱がぬまま彼女が跪く。")

hashtag_map = {1: [3, 17], 2: [11, 18], 3: [5, 12], 4: [9, 7], 5: [10, 17], 6: [18, 19]}

assets = {
    1: [("왕국 기사단 훈련장", "주인공이 매일 새벽 검을 휘두르는 곳"),
        ("무너진 본가 성벽", "가문이 몰락한 뒤 방치된 폐성"),
        ("왕도 대전", "주군에게 검을 바치는 서약이 이뤄지는 자리"),
        ("야전 막사", "전투 사이 짧게 눈을 붙이는 곳"),
        ("낡은 가문 문장", "갑옷 안쪽에 몰래 새겨 둔 문장")],
    3: [("밤의 강의동", "해가 지면 교실이 나타나는 건물"),
        ("기숙사 복도", "아침이면 기억이 지워지는 통로")],
    6: [("항구 선술집", "목격자들이 마지막으로 모였던 자리")],
}

scenarios = {
    1: [(1, 1, "START",  "ACTIVE",     "서약의 밤",   "주군을 정하는 첫 만남입니다.",
         "전장의 연기가 걷히고, 낯선 용병이 그녀에게 손을 내민다. 갑옷은 피로 물들었고 검은 부러졌지만 눈빛만은 꺾이지 않았다.\n\n"
         "\"이름을 물어도 되겠습니까.\""),
        (2, 1, "NORMAL", "ACTIVE",     "첫 출정",     "주군과 함께 나서는 첫 전투입니다.",
         "국경으로 향하는 길. 그녀는 말 위에서 한 마디도 하지 않았다. 대신 반 발짝 앞에서 길을 텄다."),
        (3, 1, "EVENT",  "HIDDEN",     "가문의 밤",   "폐성으로 돌아가는 이벤트 회차입니다.",
         "무너진 성벽 아래에서 그녀가 처음으로 갑옷을 벗는다."),
        (2, 2, "NORMAL", "DEPRECATED", "첫 출정(구)", "2화의 이전 버전입니다.",
         "국경으로 향하는 길. 그녀는 계속 말이 없었다."),
    ],
    2: [(1, 1, "START", "ACTIVE", "새벽 2시",  "가게 문이 열리는 첫 회차입니다.",
         "셔터가 반쯤 올라가고, 형광등이 두 번 깜빡인 뒤 켜진다. 오늘의 손님이 문 앞에 서 있다.")],
    3: [(1, 1, "START", "ACTIVE", "전학 첫날", "기억을 잃지 않는 학생이 도착합니다.",
         "교문을 넘자 해가 졌다. 아무도 이상하게 여기지 않는다는 것이 가장 이상했다.")],
    6: [(1, 1, "START",  "ACTIVE", "네 번째 목격자", "항구에 모인 사람들의 첫 밤입니다.",
         "항구의 불이 하나씩 꺼진다. 누군가 \"들린다\"고 말했고, 술집 안의 노래가 멈췄다."),
        (2, 1, "NORMAL", "ACTIVE", "첫 출항",       "고래를 쫓아 바다로 나갑니다.",
         "배가 항구를 벗어나자 소리는 더 또렷해졌다.")],
}

# n -> (name, description, detail_setting)
chars = {
    1: ("세라핀", "몰락 기사 가문의 마지막 후예. 왕국 기사단 최연소 부단장.",
        "말수가 적다. 질문에는 사실만 답하고, 감정은 검을 쥔 손에만 드러난다."),
    3: ("루엔", "밤의 기억을 잃지 않는 유일한 학생.", "교사들이 번호로 부르면 일부러 이름으로 되받는다."),
    6: ("해도", "고래를 세 번 보고 돌아온 마지막 선원.", "바다 이야기를 할 때만 말이 길어진다."),
}

def q(s):
    return "NULL" if s is None else "'" + s.replace("\\", "\\\\").replace("'", "''") + "'"

out = []
add = out.append
add("SET NAMES utf8mb4;")
add("START TRANSACTION;")

# files
for n, fid in USR_F.items():
    add(f"INSERT INTO files (file_id,user_id,file_type,reference_count,status,created_at) VALUES ({fid},{U[n]},'USER_PROFILE',1,'ACTIVE',{NOW});")
for n, fid in UP.items():
    add(f"INSERT INTO files (file_id,user_id,file_type,reference_count,status,created_at) VALUES ({fid},{U[universes[n-1][1]]},'UNIVERSE_PROFILE',1,'ACTIVE',{NOW});")
for n, fid in CH_F.items():
    add(f"INSERT INTO files (file_id,user_id,file_type,reference_count,status,created_at) VALUES ({fid},{U[1]},'CHARACTER_PROFILE',1,'ACTIVE',{NOW});")

# users / auth / creators
for n, nick, bio, gender, birth, status, fid, email in users:
    add(f"INSERT INTO users (user_id,role_id,nickname,bio,gender,birth,status,adult_verified,profile_image_file_id,created_at,updated_at) "
        f"VALUES ({U[n]},2,{q(nick)},{q(bio)},{q(gender)},'{birth}',{q(status)},b'1',{fid},NOW(6) - INTERVAL {400-n*30} DAY,{NOW});")
    add(f"INSERT INTO authentications (auth_id,user_id,email,password,auth_provider,last_login_at,created_at) "
        f"VALUES ({i(600+n)},{U[n]},{q(email)},'{{noop}}seed',	'EMAIL',NOW(6) - INTERVAL {n*3} DAY,NOW(6) - INTERVAL {400-n*30} DAY);")
for n, un, grade, st in creators:
    add(f"INSERT INTO creators (creator_id,user_id,grade,status,created_at,updated_at) "
        f"VALUES ({C[n]},{U[un]},{q(grade)},{q(st)},NOW(6) - INTERVAL {380-n*30} DAY,{NOW});")

# universes
for (n, cn, status, vis, review, cat, tend, comment, chat, like, reject) in universes:
    add(f"INSERT INTO universes (universe_id,creator_id,status,visibility,review_status,category,tendency,"
        f"comment_enabled,chat_count,like_count,profile_image_file_id,review_rejection_reason,created_at,updated_at) "
        f"VALUES ({V[n]},{C[cn]},{q(status)},{q(vis)},{q(review)},{q(cat)},{q(tend)},b'{comment}',{chat},{like},{UP[n]},"
        f"{q(reject)},NOW(6) - INTERVAL {300-n*20} DAY,NOW(6) - INTERVAL {n} DAY);")
    t = KO[n]
    add(f"INSERT INTO universe_translations (universe_translation_id,universe_id,language,title,introduce,description,detail_setting,created_at) "
        f"VALUES ({i(700+n)},{V[n]},'KO',{q(t[0])},{q(t[1])},{q(t[2])},{q(t[3])},{NOW});")
    for hid in hashtag_map[n]:
        add(f"INSERT INTO universe_hashtag_mappings (universe_hashtag_id,universe_id,hashtag_id) VALUES ({i(800+n*10+hid)},{V[n]},{hid});")

for lang, t, off in (("EN", EN1, 1), ("JA", JA1, 2)):
    add(f"INSERT INTO universe_translations (universe_translation_id,universe_id,language,title,introduce,description,detail_setting,created_at) "
        f"VALUES ({i(750+off)},{V[1]},'{lang}',{q(t[0])},{q(t[1])},{q(t[2])},{q(t[3])},{NOW});")

# assets
k = 0
for n, items in assets.items():
    for name, sit in items:
        k += 1
        add(f"INSERT INTO universe_assets (universe_asset_id,universe_id,file_id,asset_name,asset_situation,created_at) "
            f"VALUES ({i(900+k)},{V[n]},{UA_F[k]},{q(name)},{q(sit)},{NOW});")
        add(f"INSERT INTO files (file_id,user_id,file_type,reference_count,status,created_at) "
            f"VALUES ({UA_F[k]},{U[1]},'UNIVERSE_ASSET',1,'ACTIVE',{NOW});")

# characters
ci = 0
for n, (name, desc, detail) in chars.items():
    ci += 1
    add(f"INSERT INTO characters (character_id,creator_id,character_image,status,created_at) "
        f"VALUES ({i(1000+ci)},{C[1]},{CH_F[ci]},'ACTIVE',{NOW});")
    add(f"INSERT INTO character_translations (character_translation_id,character_id,language,name,description,detail_setting,created_at) "
        f"VALUES ({i(1010+ci)},{i(1000+ci)},'KO',{q(name)},{q(desc)},{q(detail)},{NOW});")
    add(f"INSERT INTO universe_characters (universe_character_id,universe_id,source_character_id,profile_image_file_id,created_at) "
        f"VALUES ({i(1020+ci)},{V[n]},{i(1000+ci)},{CH_F[ci]},{NOW});")
    add(f"INSERT INTO universe_character_translations (universe_character_translation_id,universe_character_id,language,name,description,detail_setting,created_at) "
        f"VALUES ({i(1030+ci)},{i(1020+ci)},'KO',{q(name)},{q(desc)},{q(detail)},{NOW});")

# scenarios
si = 0
for n, items in scenarios.items():
    for (ep, ver, stype, sstatus, title, sdesc, content) in items:
        si += 1
        add(f"INSERT INTO scenarios (scenario_id,universe_id,episode_no,version_no,display_order,scenario_type,status,created_at) "
            f"VALUES ({i(1100+si)},{V[n]},{ep},{ver},{ep},{q(stype)},{q(sstatus)},{NOW});")
        add(f"INSERT INTO scenario_translations (scenario_translation_id,scenario_id,language,title,description,content,created_at) "
            f"VALUES ({i(1200+si)},{i(1100+si)},'KO',{q(title)},{q(sdesc)},{q(content)},{NOW});")
        if n == 1 and ep == 1 and ver == 1:
            add(f"INSERT INTO scenario_translations (scenario_translation_id,scenario_id,language,title,description,content,created_at) "
                f"VALUES ({i(1300+si)},{i(1100+si)},'EN','The Night of the Oath','Their first meeting.',"
                f"{q('The smoke of the battlefield clears, and a stranger offers her his hand.')},{NOW});")

add("COMMIT;")

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed.sql")
open(path, "w", encoding="utf-8").write("\n".join(out) + "\n")
print(path, len(out), "statements")

# ---- 이미지 ----
from PIL import Image, ImageDraw
BASE = "/Users/ksw/Desktop/PLAT/plat-be/plat-boot/files"
PAL = [(99,102,241),(236,72,153),(14,165,233),(245,158,11),(16,185,129),(139,92,246),(239,68,68),(59,130,246)]
def make(dirpath, variants, seedn, label):
    color = PAL[seedn % len(PAL)]
    for name, size in variants:
        img = Image.new("RGB", size, color)
        d = ImageDraw.Draw(img)
        d.rectangle([0, int(size[1]*0.72), size[0], size[1]], fill=tuple(max(0, c-45) for c in color))
        if size[0] >= 120:
            d.text((10, 10), label, fill=(255, 255, 255))
        os.makedirs(dirpath, exist_ok=True)
        img.save(os.path.join(dirpath, name), "WEBP", quality=88)

cnt = 0
for n, fid in UP.items():
    make(f"{BASE}/universes/profiles/{fid}", [("origin.webp",(640,640)),("sq80.webp",(80,80)),("sq140.webp",(140,140))], n, KO[n][0]); cnt += 1
for n, fid in USR_F.items():
    make(f"{BASE}/users/profiles/{fid}", [("origin.webp",(400,400)),("sq40.webp",(40,40)),("sq80.webp",(80,80))], n+3, users[n-1][1]); cnt += 1
for n, fid in CH_F.items():
    make(f"{BASE}/characters/profiles/{fid}", [("origin.webp",(512,512)),("sq40.webp",(40,40)),("sq140.webp",(140,140))], n+5, "character"); cnt += 1
for n, fid in UA_F.items():
    if n <= k:
        make(f"{BASE}/universes/assets/{fid}", [("origin.webp",(720,960)),("sq80.webp",(80,80))], n, f"asset {n}"); cnt += 1
print("images:", cnt)
