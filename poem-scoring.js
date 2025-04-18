// poem-scoring.js

let useModel;

(async () => {
  useModel = await use.load();
})();

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

async function analyzePoem(poemText) {
  if (!useModel) useModel = await use.load();

  const cleanedPoem = poemText.trim().replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleanedPoem.split(/\s+/);
  const uniqueWords = new Set(words);
  const wordDiversity = Math.min(1, uniqueWords.size / words.length);

  const nlp = window.nlp(poemText);
  const grammarScore = Math.min(1, (
    nlp.sentences().length * 0.5 +
    nlp.nouns().length * 0.3 +
    nlp.verbs().length * 0.2
  ) / words.length);

  const embeddings = await useModel.embed([poemText, "happy", "sad"]);
  const poemVec = embeddings.arraySync()[0];
  const happyVec = embeddings.arraySync()[1];
  const sadVec = embeddings.arraySync()[2];
  const sentiment = (cosineSimilarity(poemVec, happyVec) - cosineSimilarity(poemVec, sadVec) + 1) / 2;

  const themes = ["love", "nature", "sadness", "hope", "death", "friendship"];
  const themeMatches = themes.filter(theme => poemText.toLowerCase().includes(theme));
  const themeScore = Math.min(1, themeMatches.length / themes.length);

  const score = Math.round(
    (wordDiversity * 30 + grammarScore * 30 + sentiment * 20 + themeScore * 20)
  );

  return {
    score,
    breakdown: {
      wordDiversity: Math.round(wordDiversity * 100),
      grammarScore: Math.round(grammarScore * 100),
      sentiment: Math.round(sentiment * 100),
      themeScore: Math.round(themeScore * 100)
    }
  };
}

// Optional UI function to display result
function displayPoemScore(result) {
  const scoreBox = document.createElement('div');
  scoreBox.style = `
    background: #fff;
    border-radius: 12px;
    padding: 16px;
    margin: 12px 0;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    font-family: 'Arial';
  `;

  scoreBox.innerHTML = `
    <h3 style="margin-top: 0;">Poem Rating Score: ${result.score}/100</h3>
    <div style="margin-top: 10px;">
      <div><strong>Word Diversity:</strong> ${result.breakdown.wordDiversity}%</div>
      <div><strong>Grammar:</strong> ${result.breakdown.grammarScore}%</div>
      <div><strong>Sentiment:</strong> ${result.breakdown.sentiment}%</div>
      <div><strong>Themes:</strong> ${result.breakdown.themeScore}%</div>
    </div>
    <progress value="${result.score}" max="100" style="width: 100%; margin-top: 10px;"></progress>
  `;

  document.body.appendChild(scoreBox);
}

function showPoemScore(score, breakdown) {
  const card = document.getElementById('poem-scorecard');
  const bar = document.getElementById('score-bar');
  const breakdownDiv = document.getElementById('score-breakdown');

  card.style.display = 'block';
  bar.style.width = score + '%';
  
  breakdownDiv.innerHTML = `
    <div class="breakdown-item">📖 Word Diversity: ${breakdown.diversity}%</div>
    <div class="breakdown-item">🧠 Grammar Score: ${breakdown.grammar}%</div>
    <div class="breakdown-item">😊 Sentiment: ${breakdown.sentiment}%</div>
    <div class="breakdown-item">🌈 Theme Match: ${breakdown.themeMatch}%</div>
  `;
}
