// poem-scoring.js

let useModel;

// Load TensorFlow USE model with error handling
(async () => {
  try {
    useModel = await use.load();
  } catch (error) {
    console.error("Failed to load Universal Sentence Encoder:", error);
  }
})();

// Cosine similarity calculation
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magA * magB);
}

// Main scoring function
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
  const embeddingArray = await embeddings.array();

  const poemVec = embeddingArray[0];
  const happyVec = embeddingArray[1];
  const sadVec = embeddingArray[2];
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

// Display poem score using the existing #poem-scorecard element
function displayPoemScore(result) {
  const card = document.getElementById('poem-scorecard');
  const bar = document.getElementById('scoreBar');
  const breakdownDiv = document.getElementById('scoreBreakdown');

  // Clear previous content
  breakdownDiv.innerHTML = '';
  card.classList.remove('show');
  
  bar.style.width = result.score + '%';
  
  breakdownDiv.innerHTML = `
    <div style="margin-top: 10px;">
      <div class="breakdown-item" title="Ratio of unique to total words">🌐 ${result.breakdown.wordDiversity}%</div>
      <div class="breakdown-item" title="Grammar composition including sentence, noun, and verb density">🧠 ${result.breakdown.grammarScore}%</div>
      <div class="breakdown-item" title="Mood proximity between happiness and sadness">😊 ${result.breakdown.sentiment}%</div>
      <div class="breakdown-item" title="Matches with known poetic themes">🌈 ${result.breakdown.themeScore}%</div>
    </div>
  `;

  card.classList.add('show');
}

// UI-bound result renderer
function showPoemScore(score, breakdown) {
  const card = document.getElementById('poem-scorecard');
  const bar = document.getElementById('score-bar');
  const breakdownDiv = document.getElementById('score-breakdown');

  card.style.display = 'block';
  card.classList.add('show'); // for fade-in

  bar.style.width = score + '%';

  breakdownDiv.innerHTML = `
    <div class="breakdown-item" title="Ratio of unique to total words">🌐 Word Diversity: ${breakdown.wordDiversity}%</div>
    <div class="breakdown-item" title="Grammar composition including sentence, noun, and verb density">🧠 Grammar Score: ${breakdown.grammarScore}%</div>
    <div class="breakdown-item" title="Mood proximity between happiness and sadness">😊 Sentiment: ${breakdown.sentiment}%</div>
    <div class="breakdown-item" title="Matches with known poetic themes">🌈 Theme Match: ${breakdown.themeScore}%</div>
  `;
}
