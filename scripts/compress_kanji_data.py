from functools import reduce
import json

# Get Twitter Frequency Rank for Each Kanji 

# Build Data 
'''

TODO: 🚧 🚧 🚧  check if there is "disrepancy" for those with multiple sources

db stores: 
- main_info
- freq_info
- non-kanji component keywords map
- semantic component mapping
- 🚧 🚧 🚧 vocab_info: [WORD_WITH_KANJI, SPACED_KANA][]

Info to add:
// joyou grade
// all meanings
// all kun-readings
// all on-readings
// in: "component dependencies"
// out: kanjis dependent on this as a component
// 🚧 🚧 🚧 "Usually Confused with" Kanjis 

listItem: 
{ kanji, keyword, main_onyomi, main_kunyomi, bgRank, jlpt }

hoverItem:
main: { kanji, keyword }
vocab: { spacedKana, kanji, meaning }[]
components: { component, keyword }[]
phonetic: { component, kana }
---> badges[] 


infoDetails:
1. joyou grade
2. all meanings
3. all kun-readings
4. all on-readings
5. out: kanjis dependent on this kanji
6. badges[]
---> frequencyDetails

----------------
kanji_main_info_json
----------------

kanji_main_info[kanji] = [
    keyword,
    main_on_reading,
    main_kun_reading,
    jlpt,
    strokes,
    rtk_index,
    wanikani
]


----------------
kanji_frequency_info.json
----------------

1 to 6. aozora, online news and wikipedia - https://github.com/scriptin/kanji-frequency/
7. scanning 5100 Novels - https://drive.google.com/file/d/1zbClv0H5VgswEDAkVmF3ikiVnoi6yGsW/view, https://www.reddit.com/r/LearnJapanese/comments/fhx27j/comment/fkdyksq/
8. drama subtitles - https://github.com/Matchoo95/JP-Subtitles, https://github.com/chriskempson/japanese-subtitles-word-kanji-frequency-lists
9. netflix - OhTalkWho オタク - https://www.youtube.com/watch?v=DwJWld8hW0M 
10. newspapers 1 - https://github.com/Lemmmy/KanjiSchool/blob/master/src/data/jisho-data.json
11. newspapers 2 - https://github.com/davidluzgouveia/kanji-data
12. twitter - https://github.com/scriptin/kanji-frequency/
13+ 2242 KANJI FREQUENCY LIST VER. 1.1 https://docs.google.com/spreadsheets/d/1MBYfKPrlST3F51KIKbAlsGw1x4c_atuHfPwSSRN5sLs/edit?gid=479449032#gid=479449032, https://www.researchgate.net/publication/357159664_2242_Kanji_Frequency_List_ver_11


[
    rank_aozora_char,
    rank_online_news_char,
    rank_wikipedia_char,
    rank_aozora_doc,
    rank_online_news_doc,
    rank_wikipedia_doc,
    rank_novels_5100,
    rank_drama_subtitles,
    rank_netflix,
    rank_newspapers_1,
    rank_newspapers_2,
    rank_google,
    rank_kuf,
    rank_mcd,
    rank_bunka,
    rank_jisho,
    rank_kd,
    rank_avg,
    rank_weighted,
    rank_weighted5,
]
'''

# -------------------
# COMMON HELPER FUNCTIONS
# -------------------

def to_int(str, default_value=None):
    if isinstance(str, (int)):
        return str

    if not str:
        return default_value

    try: 
        num = int(str)
        return num
    except:
        return default_value

# -------------------
# FUNCTIONS TO GET MAIN INFORMATION
# -------------------
def get_meaning(kanji_info):
    all_ = kanji_info.get('meanings', {})
    def dig(source_key):
        return all_.get(source_key, {}).get('main', None)

    return dig('kanjiKeys') \
        or dig('rtk5100') \
        or dig('davidluzgouveiaJlpt') \
        or dig('shirabeJishou') \
        or dig('waniKani')

def get_on_reading(kanji_info):
    all_ = kanji_info.get('readings', {}).get('onyomi', {})
    def dig(source_key):
        return (all_.get(source_key, {}) or {}).get('main', None)

    return dig('davidluzgouveiaJlpt') or dig('waniKani')

def get_kun_reading(kanji_info):
    all_ = kanji_info.get('readings', {}).get('kunyomi', {})  
    def dig(source_key):
        return (all_.get(source_key, {}) or {}).get('main', None)

    return dig('davidluzgouveiaJlpt') or dig('waniKani')

def get_jlpt(kanji_info):
    all_ = kanji_info.get('jlpt', {})
    def dig(source_key):
        return all_.get(source_key, None)
    
    return dig('shirabeJishou') or dig('davidluzgouveiaJlpt') or dig('kanjiSchool')

def get_strokes(kanji_info):
    all_ = kanji_info.get('strokes', {})
    def dig(source_key):
        return all_.get(source_key, None)
    
    strokes = dig('topoKanji') or dig('davidluzgouveiaJlpt') or dig('kanjiSchool')
    return strokes

def get_rtk_index(kanji_info):
    all_ = kanji_info.get('rtkIndex', {})
    def dig(source_key):
        return all_.get(source_key, None)
    
    return to_int(dig('rtk5100'))

def get_wanikani_lvl(kanji_info):
    return kanji_info.get('waniKani', {}).get('level', None)

# -------------------
# FUNCTIONS TO GET FREQUENCY RANK INFORMATION
# -------------------

def get_ranks(kanji_info):
    all_ = kanji_info.get('frequency', {})
    def dig_1224(source_key):
        rank = all_.get(source_key, {}).get('rank1224', None)
        return to_int(rank)

    all_scriptin = all_.get('scriptin', {}).get('mostRecent', {})
    def dig_scriptin(source_key, rank_type_key = 'charRank'):
        rank = all_scriptin.get(source_key, {}).get(rank_type_key, None)
        return to_int(rank)

    all_ultimate = all_.get('ultimate', {})
    def dig_ultimate(source_key):
        rank = all_ultimate.get(source_key, None)
        return to_int(rank)
    
    rank_aozora_char = dig_scriptin('aozora')  or '❌'
    rank_online_news_char = dig_scriptin('news') or '❌'
    rank_wikipedia_char = dig_scriptin('wikipedia') or '❌'
    rank_aozora_doc = dig_scriptin('aozora', 'docRank') or '❌'
    rank_online_news_doc = dig_scriptin('news', 'docRank') or '❌'
    rank_wikipedia_doc = dig_scriptin('wikipedia', 'docRank')     or '❌'
    rank_novels_5100 = dig_1224('rtk5100') or '❌'
    rank_drama_subtitles = dig_1224('chriskempsonSubtitles') or '❌'
    rank_netflix = dig_1224('ohTalkWhoNetflix') or '❌'
    rank_newspapers_1 = all_.get('davidluzgouveiaJlpt', None) or '❌'
    rank_newspapers_2 = all_.get('kanjiSchool', None) or '❌'

    rank_google = dig_ultimate("google") or '❌'
    rank_kuf = dig_ultimate("kuf") or '❌'
    rank_mcd = dig_ultimate("mcd") or '❌'
    rank_bunka = dig_ultimate("bunka") or '❌'
    rank_jisho = dig_ultimate("jisho") or '❌'
    rank_kd = dig_ultimate("kd") or '❌'
    rank_avg = dig_ultimate("avg") or '❌'
    rank_weighted = dig_ultimate("weighted") or '❌'
    rank_weighted5 = dig_ultimate("weighted5") or '❌'

    return [
        rank_aozora_char,
        rank_online_news_char,
        rank_wikipedia_char,
        rank_aozora_doc,
        rank_online_news_doc,
        rank_wikipedia_doc,
        rank_novels_5100,
        rank_drama_subtitles,
        rank_netflix,
        rank_newspapers_1,
        rank_newspapers_2,
        rank_google,
        rank_kuf,
        rank_mcd,
        rank_bunka,
        rank_jisho,
        rank_kd,
        rank_avg,
        rank_weighted,
        rank_weighted5,
    ]
    

def get_sorted_by_twitter_occurence_data(kanji_data):

    def get_twitter_data(kanji):
        all_ = kanji_data[kanji].get('frequency', {}).get('scriptin', {}).get('year2015',{}).get('twitter', {})
        fraction =  all_.get('fraction', 0)

        result = {
            'kanji': kanji,
            'fraction': fraction,
            'count': all_.get('occurence', 0),
        }
        return result

    twitter_array = [get_twitter_data(kanji) for kanji in kanji_data.keys()]

    def sort_func(item):
        return item['count']

    running_cum_use = 0
    def include_rank(pair):
        [rank, item] = pair

        nonlocal running_cum_use 
        fraction = item['fraction'] 
        running_cum_use += fraction

        item['rank'] = rank + 1
        item['cum_use'] = running_cum_use
        return item

    # An array of items { kanji, count, fraction, cum_use } now sorted by frequency, most frequent at the top 
    twitter_array.sort(key=sort_func, reverse=True)
    twitter_array_with_rank = [include_rank(pair) for pair in enumerate(twitter_array)]
    return twitter_array_with_rank

 # { kanji, count }[]
def build_twitter_dictionary(twitter_array):
    twitter_freq_ranks = {}
    # A dictionary where key=kanji value={ rank, count, occurence, cum_use }
    for item in twitter_array:
        twitter_freq_ranks[item['kanji']] = { 'rank': item['rank'], 'count': item['count'] }

    return twitter_freq_ranks


# -------------------
# MAIN SCRIPT HERE
# -------------------

kanji_main_info = {}
kanji_frequency_rank_info = {}
kanji_list = []

ORIGINAL_KANJI_JSON = "./original_data/kanji.json"
ORIGINAL_KANJI_COMPONENTS = "./original_data/kanji_components.json"
ORIGINAL_KANJI_PHONETIC_COMPONENTS = "./original_data/phonetic_components.json"

with open("./original_data/kanji.json", mode="r", encoding="utf-8") as read_file:
    kanji_data = json.load(read_file);
    kanji_list = [kanji for kanji in kanji_data.keys()]
    print("number of kanjis:", len(kanji_list))

    # -----------
    # Main Info
    # -----------

    for kanji in kanji_list:
        kanji_info = kanji_data[kanji]

        meaning = get_meaning(kanji_info) or '❌'
        on_reading = get_on_reading(kanji_info) or '❌'
        kun_reading = get_kun_reading(kanji_info) or '❌'
        jlpt = get_jlpt(kanji_info) or '❌'
        strokes = get_strokes(kanji_info) or '❌'
        rtk_index = get_rtk_index(kanji_info) or '❌'
        wk_lvl = get_wanikani_lvl(kanji_info) or '❌'

        kanji_main_info[kanji] = [
            meaning,
            on_reading,
            kun_reading,
            jlpt,
            strokes,
            rtk_index,
            wk_lvl
        ]


    # -----------
    # Frequency Info
    # -----------
    twitter_freq_array = get_sorted_by_twitter_occurence_data(kanji_data)
    twitter_freq_data = build_twitter_dictionary(twitter_freq_array)

    for kanji in kanji_list:
        kanji_info = kanji_data[kanji]
        kanji_frequency_rank_info[kanji] = get_ranks(kanji_info)
        kanji_frequency_rank_info[kanji].append(twitter_freq_data[kanji]['rank'])
    

def get_max_strokes(acc, kanji):
    kanji_info = kanji_data[kanji]
    strokes = get_strokes(kanji_info)
    if isinstance(strokes, (int)):
        return max(strokes, acc)
    
    return acc

def get_max_deps(acc, kanji):
    kanji_info = kanji_data[kanji]
    deps = kanji_info.get('componentDependencies', {}).get('topoKanji', [])
    new_acc = max(len(deps), acc)

    if new_acc > acc:
        print(kanji, ":", deps)
    return new_acc
    

max_strokes = reduce(get_max_strokes, kanji_list, 0)
print("max strokes:", max_strokes)

max_deps = reduce(get_max_deps, kanji_list, 0)
print("max dependencies:", max_deps)

INDENT = None # 2 # None # 4
SEPARATORS = (',', ':') #None

def dump_json(file_name, data, indent=INDENT, separators=SEPARATORS):
    with open(file_name, mode="w", encoding="utf-8") as write_file:
        json.dump(data, write_file, indent=indent, separators=separators, ensure_ascii=False)

dump_json("./scripts/generated/generated_kanji_main.json", kanji_main_info)
dump_json("./scripts/generated/generated_kanji_list.json", kanji_list)
dump_json("./scripts/generated/generated_kanji_freq.json", kanji_frequency_rank_info)
dump_json("./scripts/generated/generated_kanji_twitter_freq.json", twitter_freq_array)
