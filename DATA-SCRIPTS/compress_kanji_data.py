from functools import reduce
import json

# see issue: https://github.com/mithi/kanji-data/issues/6
OWN_KEYWORDS_OVERRIDE = {
    #Duplicate keywords
    "熙": "sunny",
    "凜": "severe",
    #Missing keywords:
    "呟": "mutter",
    "睨": "glaring at",
    "頷": "nod approval",
}
# -------------------
# JSON utilities
# -------------------

def compress_json(path_in, path_out):
    with open(path_in, mode="r", encoding="utf-8") as read_file:
        original_data = json.load(read_file)
        with open(path_out, mode="w", encoding="utf-8") as write_file:
            json.dump(
                original_data,
                write_file,
                indent=None,
                separators=(',', ':'),
                ensure_ascii=False
            )

INDENT = None
#INDENT = 4
SEPARATORS = (',', ':')
#SEPARATORS = None

def dump_json(file_name, data, indent=INDENT, separators=SEPARATORS):
    with open(file_name, mode="w", encoding="utf-8") as write_file:
        json.dump(data, write_file, indent=indent, separators=separators, ensure_ascii=False)


def get_data_from_file(file_path):
    with open(file_path, mode="r", encoding="utf-8") as read_file:
        return json.load(read_file)
    
    return {}


# -------------------
# JSON file paths
# -------------------

IN_DIR = "./DATA-SCRIPTS/original_data"
OUT_DIR = "./DATA-SCRIPTS/generated"

ORIGINAL_COMPONENTS_FILE_PATH = f"{IN_DIR}/missing_components.json"
REFORMATTED_COMPONENTS_FILE_PATH = f"{OUT_DIR}/generated_reformatted_part_keyword_info.json"

ORIGINAL_PHONETIC_FILE_PATH = f"{IN_DIR}/phonetic_components.json"
REFORMATTED_PHONETIC_FILE_PATH = f"{OUT_DIR}/generated_reformatted_phonetic.json"


compress_json(
    ORIGINAL_COMPONENTS_FILE_PATH,
    REFORMATTED_COMPONENTS_FILE_PATH
)
compress_json(
    ORIGINAL_PHONETIC_FILE_PATH,
    REFORMATTED_PHONETIC_FILE_PATH
)

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

def get_all_generic(all_, all_source_keys):

    def dig_main(source_key):
        main = all_.get(source_key, {}).get('main', None)
        if main is None:
            return None
        

        return main.strip().lower()
    
    def dig_others(source_key):
        if source_key == 'rtk5100':
            other = all_.get(source_key, {}).get('others', None)
            if other is not None:
                words = [word.strip().lower() for word in other.split(',')]
                return words

        raw_others = all_.get(source_key, {}).get('others', [])
        return [word.strip().lower() for word in raw_others]
    
    item_set = set(())
    for source_key in all_source_keys:
        main = dig_main(source_key)
        
        if main is not None:
            item_set.update([main])
        others = dig_others(source_key)

        item_set.update(others)
    
    item_set.discard('')

    item_list = list(item_set)

    if len(item_list) == 0:
        return None
    return item_list

def running_count_diff_GLOBAL_COUNT_UNSTABLE(a, b, c, r, pref):
    if (a and a != r) or (b and b != r) or (c and c != r):
        global global_count 
        global_count += 1
        print (global_count, pref, a, b, c)

# -------------------
# FUNCTIONS TO GET KANJI INFORMATION MINUS FREQUENCY INFO
# -------------------

def get_component_parts(kanji_info):
    deps = kanji_info.get('componentDependencies', {}).get('topoKanji', [])
    return deps

def get_keyword(kanji_info):
    all_ = kanji_info.get('meanings', {})
    def dig(source_key):
        return all_.get(source_key, {}).get('main', None)

    keyword = dig('kanjiKeys') \
        or dig('rtk5100') \
        or dig('davidluzgouveiaJlpt') \
        or dig('shirabeJishou') \
        or dig('waniKani')
    
    # https://github.com/mithi/kanji-data/issues/6

    # Duplicate keywords:
    # 明, 熙 - bright
    # 寒, 凜 - cold
    # For the kanji with missing keywords, they all rely on the meaning from rtk5100.
    # Missing keywords: 呟, 睨, 頷

    #New keywords to assign as follows...
    #Duplicate keywords:
    #熙 - sunny
    #凜 - severe
    #Missing keywords:
    #呟 - mutter
    #睨 - glaring at
    #頷 - nod approval

    override = OWN_KEYWORDS_OVERRIDE.get(kanji_info["kanji"], None)
    if override:
        keyword = override

    if keyword is None:
        print("No keyword:", kanji_info["kanji"])
        return None

    return keyword.strip().lower()

def get_all_meanings(kanji_info):
    all_source_keys = [
        'kanjiKeys',
        'rtk5100',
        'davidluzgouveiaJlpt',
        'shirabeJishou',
        'waniKani'
    ]
    all_ = kanji_info.get('meanings', {})
    return get_all_generic(all_, all_source_keys)

def get_main_on_reading(kanji_info):
    all_ = kanji_info.get('readings', {}).get('onyomi', {})
    def dig(source_key):
        return (all_.get(source_key, {}) or {}).get('main', None)

    return dig('davidluzgouveiaJlpt') or dig('waniKani') or dig('kanjiApi')

def get_all_on_readings(kanji_info):
    all_source_keys = [
        'davidluzgouveiaJlpt',
        'waniKani',
        'kanjiApi'
    ]
    all_ = kanji_info.get('readings', {}).get('onyomi', {})
    return get_all_generic(all_, all_source_keys)

def get_main_kun_reading(kanji_info):
    all_ = kanji_info.get('readings', {}).get('kunyomi', {})  
    def dig(source_key):
        return (all_.get(source_key, {}) or {}).get('main', None)

    return dig('davidluzgouveiaJlpt') or dig('waniKani')or dig('kanjiApi')

def get_all_kun_readings(kanji_info):
    all_source_keys = [
        'davidluzgouveiaJlpt',
        'waniKani',
        'kanjiApi'
    ]
    all_ = kanji_info.get('readings', {}).get('kunyomi', {})
    return get_all_generic(all_, all_source_keys)

def get_jlpt(kanji_info):
    all_ = kanji_info.get('jlpt', {})
    def dig(source_key):
        return all_.get(source_key, None)
    
    a = dig('shirabeJishou') 
    b = dig('kanjiSchool')
    c = dig('davidluzgouveiaJlpt')
    r = a or b or c

    # kanji = kanji_info["kanji"]
    # running_count_diff_GLOBAL_COUNT_UNSTABLE(a, b, c, r, f"{kanji} jl:")
    # 416 Kanji do not match

    return r

def get_jouyou(kanji_info):
    all_ = kanji_info.get('jouyouGrade', {})
    def dig(source_key):
        return all_.get(source_key, None)

    # KanjiSchool is more accurate
    # see: https://github.com/mithi/kanji-data/issues/5
    a = dig('kanjiSchool')
    b = dig('davidluzgouveiaJlpt')
    c = dig('kanjiApi')
    r = a or b or c

    #For the inconsistent Jouyou Grade between kanjiSchool and davidluzgouveiaJlpt 
    # (found 56 discrepancies), kanjiSchool is more accurate when verified against
    #  https://en.wikipedia.org/wiki/List_of_jōyō_kanji. 
    # Note that grades are from 1-6 for elementary school,
    # then kanjiSchool uses 9 while davidluzgouveiaJlpt uses 8 for secondary school.
    # When comparing kanjiSchool and scriptin kanjidic2-en-3.6.1.json, 
    # there are 55 kanji where kanjiSchool is 0 but kanjidic2 is 9:
    # kanjidic2 is from https://github.com/scriptin/jmdict-simplified

    if a == 9 and b == 8:
        return 9
    
    if a == 0 and b == 8:
        return 9
    
    if r == 8:
        return 9 

    # kanji = kanji_info["kanji"]
    # running_count_diff_GLOBAL_COUNT_UNSTABLE(a, b, b, r, f"{kanji} jy:")
    # Previously before new logic:: 1437 Kanji do not match
    # With the new logic 56 kanji do not match

    return r

def get_strokes(kanji_info):
    all_ = kanji_info.get('strokes', {})
    def dig(source_key):
        return all_.get(source_key, None)

    a = dig('kanjiSchool')
    b = dig('davidluzgouveiaJlpt')
    c = dig('kanjiApi')
    # d = dig('topoKanji')
    r = a or b or c

    # There are 48 discrepancies in stroke count between topoKanji vs kanjiSchool 
    # or davidluzgouveiaJlpt (latter two have the same count). 
    # By manually verifying the stroke count with the help of https://jisho.org,
    # topoKanji has been found to be consistently incorrect. 
    # see: https://github.com/mithi/kanji-data/issues/5

    # Found incorrect stroke count for davidluzgouveiaJlpt which indicates 稽 has stroke count of 16 when it should only have 15.
    #  Discovered when comparing it against scriptin's kanjidic2-en-3.6.1.json.
    # See also https://github.com/mithi/kanji-data/issues/8

    if kanji_info["kanji"] == "稽":
        return 15
    
    # running_count_diff_GLOBAL_COUNT_UNSTABLE(a, b, b, r, f"{kanji} sr:")
    # previous logic: 96 Kanji do not match
    # Now: Everything matches
    return r

def get_rtk_index(kanji_info):
    all_ = kanji_info.get('rtkIndex', {})
    def dig(source_key):
        return all_.get(source_key, None)
    
    return to_int(dig('rtk5100'))

def get_wanikani_lvl(kanji_info):
    return kanji_info.get('waniKani', {}).get('level', None)


def get_semantic_phonetic(kanji_info):
    phonetic = kanji_info.get("semanticPhonetic", {}).get('moeUsagi', None)
    return phonetic

DEFAULT_ARRAY_VAL = []

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
    
    DEFAULT_VAL = -1

    rank_aozora_char = dig_scriptin('aozora') or DEFAULT_VAL
    rank_aozora_doc = dig_scriptin('aozora', 'docRank') or DEFAULT_VAL
    rank_wikipedia_char = dig_scriptin('wikipedia') or DEFAULT_VAL
    rank_wikipedia_doc = dig_scriptin('wikipedia', 'docRank') or DEFAULT_VAL
    rank_online_news_char = dig_scriptin('news') or DEFAULT_VAL
    rank_online_news_doc = dig_scriptin('news', 'docRank') or DEFAULT_VAL

    rank_twitter_raw = all_.get('scriptin', {}).get('year2015', {}).get("twitter", {}).get("rank1224", None)
    rank_twitter = to_int(rank_twitter_raw) or DEFAULT_VAL

    rank_netflix = dig_1224('ohTalkWhoNetflix') or DEFAULT_VAL
    rank_novels_5100 = dig_1224('rtk5100') or DEFAULT_VAL
    rank_drama_subtitles = dig_1224('chriskempsonSubtitles') or DEFAULT_VAL

    rank_google = dig_ultimate("google") or DEFAULT_VAL
    rank_kuf = dig_ultimate("kuf") or DEFAULT_VAL
    rank_mcd = dig_ultimate("mcd") or DEFAULT_VAL
    rank_bunka = dig_ultimate("bunka") or DEFAULT_VAL
    rank_kd = dig_ultimate("kd") or DEFAULT_VAL
    rank_wkfr = dig_ultimate("wkfr") or DEFAULT_VAL

    rank_jisho = dig_ultimate("jisho") or DEFAULT_VAL

    # rank_newspapers_1 = all_.get('davidluzgouveiaJlpt', None) or None
    # rank_newspapers_2 = all_.get('kanjiSchool', None) or None

    # a = rank_jisho
    # b = rank_newspapers_1
    # c = rank_newspapers_2 
    # r = a or b or c
    # running_count_diff_GLOBAL_COUNT_UNSTABLE(a, b, c, r, f"{kanji} nw:")
    # only 6 kanji do not match
    # 1 飛 r: 619 580 580
    # 2 弁 r: 2077 619 619
    # 3 裁 r: 269 297 297
    # 4 逮 r: 1423 766 766
    # 5 殊 r: 1352 1361 1361
    # 6 緻 r: 2500 2460 None

    freqs = [
        rank_netflix,
        rank_twitter,
        
        rank_google,
        rank_wkfr,

        rank_wikipedia_char,
        rank_wikipedia_doc,
    
        rank_aozora_char,
        rank_aozora_doc,
        
        rank_online_news_char,
        rank_online_news_doc,
        
        rank_novels_5100,
        rank_drama_subtitles,
        
        rank_kuf,
        rank_mcd,
        rank_bunka,

        rank_kd,
        rank_jisho,
    ]

    has_ranks = list(filter(lambda x: x != -1, freqs))

    if len(has_ranks) == 0:
        # only 々 has no rank
        print("no_rank", kanji_info["kanji"], has_ranks)

    return freqs 

# *******************
# MAIN SCRIPT HERE
# *******************

kanji_data = get_data_from_file(f"{IN_DIR}/kanji.json") 
kanji_list = [kanji for kanji in kanji_data.keys()]

# .......................
# Transform schema from { [kanji]: [word]: { furigina, meaning} } to { [kanji]: [word, furigana, meaning][] }
# .......................


'''
########
Input
#########
{
    "為": {
        "行為": {
            "meaning": "act, deed, conduct",
            "parts": [
                ["行", "こう"],
                ["為","い"]
            ]
        },
        "為る": {
            "meaning": "to do, to carry out, to perform; to cause to become",
            "parts": [
                ["為", "す"],
                ["る"]
            ]
        }
    }
}

########
kanji_words
#########
{ "為": ["行為", "為る"] }


########
word_details
#########
{        
    "行為": {
        "meaning": "act, deed, conduct",
        "parts": [
            ["行", "こう"],
            ["為","い"]
        ]
    },
    "為る": {
        "meaning": "to do, to carry out, to perform; to cause to become",
        "parts": [
            ["為", "す"],
            ["る"]
        ]
    }
}

'''
kanji_vocab = get_data_from_file(f"{IN_DIR}/kanji_to_vocabulary.json") 
kanji_words = {}
word_details = {}

for kanji, words in kanji_vocab.items():
    kanji_words[kanji] = list(words.keys())
    for word, details in words.items():
        word_details[word] = [details.get('meaning', ''), details.get('parts', [])]

dump_json(f"{OUT_DIR}/word_details.json", word_details)


# .......................
# We just put the kanji as part of the value of the dictionary
# for quick access
# .......................
def convert_cum_use_point(point):
    [x, y] = point 
    return [x, round(float(y), 2)]

cum_use_data = get_data_from_file(f"{IN_DIR}/cum_use.json") 

for key, value in cum_use_data.items():
    cum_use_data[key] = [convert_cum_use_point(point) for point in value]

dump_json(f"{OUT_DIR}/cum_use.json", cum_use_data)


# .......................
# We  put the kanji as part of the value of the dictionary
# for quick access
# .......................

for kanji in kanji_list: 
    kanji_info = kanji_data[kanji]['kanji'] = kanji

# .......................
# This is a crutch to find use to count
# the number of items that various sources differ
# e.g source 1 says stroke is 15 while source 2 says it's 16.
# .......................

global global_count
global_count = 0

# .......................
# Creates two jsons main_info and other_info
# which contains information about each kanji
# .......................

kanji_main_reformatted = {}
kanji_other_reformatted = {}
for kanji in kanji_list:

    kanji_info = kanji_data[kanji]

    main_info = [
        get_keyword(kanji_info) or "",
        get_main_on_reading(kanji_info) or "",
        get_main_kun_reading(kanji_info) or "",
        get_jlpt(kanji_info) or -1,
        get_ranks(kanji_info),
    ]
    
    kanji_main_reformatted[kanji] = main_info

    kanji_other_reformatted[kanji] = [
        get_component_parts(kanji_info) or [],
        get_strokes(kanji_info) or -1,
        get_rtk_index(kanji_info) or -1,
        get_wanikani_lvl(kanji_info) or -1,
        get_jouyou(kanji_info) or -1,
        (get_all_meanings(kanji_info) or [])[:],
        get_all_on_readings(kanji_info) or [],
        get_all_kun_readings(kanji_info) or [],
        get_semantic_phonetic(kanji_info) or "",
        kanji_words.get(kanji, [])
    ]

# -----------------
# Dump Json
# -----------------

dump_json(f"{OUT_DIR}/kanji_main_reformatted.json" , kanji_main_reformatted)
dump_json(f"{OUT_DIR}/kanji_other_reformatted.json" , kanji_other_reformatted)

# -----------------
# Inspect Data 
# -----------------

def get_max_strokes(acc, iter):
    kanji = iter[1]
    kanji_info = kanji_data[kanji]
    new_acc = get_strokes(kanji_info)
    if new_acc is not None:
        new_acc = max(new_acc, acc)
        if new_acc > acc:
            print("{:<2} {:<5}".format(kanji, new_acc))
        return new_acc
    return acc

def generic_get_max(retrieve_data):
    def get_max(acc, iter):
        kanji = iter[1]
        kanji_info = kanji_data[kanji]
        items = retrieve_data(kanji_info) or []
        new_acc = max(len(items), acc)

        if new_acc > acc:
            print("{:<4} {:<2} {:<0}".format(kanji, len(items), str(items)[:100]))

        return new_acc

    return get_max

print("---> number of kanjis:", len(kanji_list))
# 2427

iter = [x for x in enumerate(kanji_list)]
max_strokes = reduce(get_max_strokes, iter, 0)
print("---> max strokes count:", max_strokes)
# 24

max_deps = reduce(generic_get_max(get_component_parts), iter, 0)
print("---> max dependencies count:", max_deps)
# max dependencies count: 8

max_on_readings = reduce(generic_get_max(get_all_on_readings), iter, 0)

print("---> max onyomi count:", max_on_readings)

max_kun_readings = reduce(generic_get_max(get_all_kun_readings), iter, 0)
print("---> max kun count:", max_kun_readings)
# max kun count: 21

max_meaning = reduce(generic_get_max(get_all_meanings), iter, 0)

print("---> max meaning count:", max_meaning)
# max meaning count: 16

# Verify if keyword is unique
keyword_list = [
    get_keyword(kanji_data[kanji]) for kanji in kanji_list
]

print("---> Unique Keywords", len(set(keyword_list)))
# Unique Keywords 2423

no_keys = list(filter(lambda x: get_keyword(kanji_data[x]) is None, kanji_list))
print("---> No keywords:", no_keys)
# No keywords: ['呟', '睨', '頷']

# TODO: Write a function to find duplicate keyword (there is atleast one)

def get_reading_stats(get_readings):
    # number of possible readings
    def get_reading_set(acc, kanji):
        kanji_info = kanji_data[kanji]
        items = get_readings(kanji_info) or []
        acc.update(items)
        return acc
    
    
    one_reading = list(filter(lambda x: len(get_readings(kanji_data[x]) or []) == 1, kanji_list))
    print("---> number of kanjis with one reading", len(one_reading))
    
    
    all_readings = reduce(get_reading_set, kanji_list, set())
    print("---> All possible readings", len(list(all_readings)))
    
    reading_counts = {}
    for kanji in kanji_list:
        readings = get_readings(kanji_data[kanji]) or []
        for reading in readings:
            reading_counts[reading] = reading_counts.get(reading, 0) + 1
    
    reading_counts_array = [ 
        { 'reading': reading , 'count': count } for reading, count in reading_counts.items()
    ]
    
    unique_reading_count = len(reading_counts_array)
    print("---> unique_readings", unique_reading_count)
    
    multiple_on_count = len(list(filter(lambda x: x['count'] > 1, reading_counts_array)))
    single_on_count = len(list(filter(lambda x: x['count'] <= 1, reading_counts_array)))
    
    print("---> reading with multiple kanjis:", multiple_on_count) 
    print("---> reading with single kanji:", single_on_count) 
    
    def sort_func(item):
        return item['count']
    
    # An array of items { kanji, count, fraction, cum_use } now sorted by frequency, most frequent at the top 
    reading_counts_array.sort(key=sort_func, reverse=True)
    
    
    # Top X readings
    top_x = 50
    # mapping count of reading
    print(f"---- Top {top_x} Readings ---")
    print("{:<10} {:<15}".format('Reading','Count'))
    for item in reading_counts_array[:top_x]:
        print("{:<10} {:<15}".format(item['count'], item['reading']))

print("..........")
print("ONYOMI")
print("..........")
get_reading_stats(get_all_on_readings)

print("..........")
print("KUNYOMI")
print("..........")
get_reading_stats(get_all_kun_readings)
