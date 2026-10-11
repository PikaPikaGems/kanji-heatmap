const KANJI =
  "日一国会人年大十二本中長出三同時政事自行社見月分議後前民生連五発間対上部東者党地合市業内相方四定今回新場金員九入選立開手米力学問高代明実円関決子動京全目表戦経通外最言氏現理調体化田当八六約主題下首意法不来作性的要用制治度務強気小七成期公持野協取都和統以討党議海正思組家話水間山川森木林花草鳥魚犬猫火土空風雨雪星朝夜春夏秋冬赤青白黒金銀音楽読書字漢暗記熱図学習覚";
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function picker(r) {
  const a = [...new Set(KANJI)];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  let n = 0;
  return () => a[n++ % a.length];
}
