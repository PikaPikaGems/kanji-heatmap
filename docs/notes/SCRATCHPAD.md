
# 1
Better Sample Words

# 2
Implement similarity search, when you paste a kanji, it displays all similar kanji to it based on the mapping on: similar_kanji_map.json it's just a lookup essentially. 

# 3
Implement Representative Word Feature

We have a new json file ./public/json/kanji_representative_words.json
This information would be displayed in various parts of the site

Todo:
1. Create a provider so that all parts of the site have access to this data
2. Create a useKanjiRepresentativeWord(kanji) hook to the information ---> return word, reading, englishGloss, tags or NULL
1. Create a RepresentativeWordSection component That uses useKanjiRepresentativeWord Hook
2. Kanji Button Expanded will now display the representative word at the bottom text-sm
3. Simple Kanji Button Expanded will also change to match KanjiButton expanded. This is used by the handwriting screen and the radical screen. The layout height of the result preview and the height of its adjacent components should change accordingly 
3. Kanji Loading Button Expanded will need to increase height to match the height of kanji button expanded
3. The kanji Reference card should also display the representative kanji word (just a small text below the keyword)

# 4
Implement Known Word Functionality 

- Be able to mark a representative kanji as known on the representative word section 
- Be able to see how many kanjis have a "known word" mark near the search input field
- Item presentation setting [x] Toggle switch to either add a green dot at the top left of the kanji button to show that marked as known 
- Sort and dialog filter: Filter out [] marked as known [] not marked as known (both checked by default)

# 5

Implement pop-quiz (writing)
Implement pop-quiz (reading)

# 6 

Uncommon Kanji Page 
/uncommon-kanji 
Explore a few kanji that didn't make the cut (but almost did!)

Show all the kanji and when you click a modal gets opened with accordion with the following sections only

Stroke Order
External Dictionaries 
Selected Words
Textbook Vocabulary

# 7 

AI Kanji Study Notes

# 8 

AI Representative Word Notes





+ Representative Study Word

-------------------------------------------
+ memorize this word      [✓] Mark as known


READING
WORD With popover
Translation 
Tag badges if any 

* Representative Study Word 
Is japanese word algorithmically selected by the Kanji Heatmap team to help remember the kanji. Each word is unique per kanji. 
