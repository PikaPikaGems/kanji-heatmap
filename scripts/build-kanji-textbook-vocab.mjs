import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const INPUT_DIR = join(ROOT, 'docs/data/common-words')
const OUTPUT_DIR = process.argv[2] ?? join(ROOT, 'docs/data/kanji-textbook-vocab')

function extractKanji(str) {
  return [...str].filter(ch => {
    const code = ch.codePointAt(0)
    return (
      (code >= 0x4e00 && code <= 0x9fff) ||  // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4dbf) ||  // CJK Extension A
      (code >= 0xf900 && code <= 0xfaff)     // CJK Compatibility Ideographs
    )
  })
}

const allWords = {}

function addWord(word, reading, enTranslation) {
  if (!word || !reading || !enTranslation) return
  if (extractKanji(word).length === 0) return
  if (!allWords[word]) allWords[word] = { reading, enTranslation }
}

const flatFiles = [
  'DR-WORDS.json',
  'KA-WORDS.json',
  'KIC.json',
  'RF-WORDS.json',
  'kklc2300-words.json',
  'kklc30k-words.json',
  'kklc7200.json',
]

for (const file of flatFiles) {
  const data = JSON.parse(readFileSync(join(INPUT_DIR, file), 'utf8'))
  for (const [word, info] of Object.entries(data)) {
    addWord(word, info.reading, info.enTranslation)
  }
}

// kklc2300.json has nested format: kanji -> { words: { word -> { reading, enTranslation } } }
const kklc2300 = JSON.parse(readFileSync(join(INPUT_DIR, 'kklc2300.json'), 'utf8'))
for (const kanjiInfo of Object.values(kklc2300)) {
  if (!kanjiInfo.words) continue
  for (const [word, info] of Object.entries(kanjiInfo.words)) {
    addWord(word, info.reading, info.enTranslation)
  }
}

// Build kanji -> { word: [reading, enTranslation] } map
const kanjiMap = {}

for (const [word, { reading, enTranslation }] of Object.entries(allWords)) {
  for (const kanji of new Set(extractKanji(word))) {
    if (!kanjiMap[kanji]) kanjiMap[kanji] = {}
    kanjiMap[kanji][word] = [reading, enTranslation]
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true })

for (const [kanji, words] of Object.entries(kanjiMap)) {
  writeFileSync(
    join(OUTPUT_DIR, `${kanji}.json`),
    JSON.stringify({ [kanji]: words }, null, 2),
    'utf8'
  )
}

console.log(`Generated ${Object.keys(kanjiMap).length} kanji files → ${OUTPUT_DIR}`)
