document.addEventListener("DOMContentLoaded", () => {
  const hanaMessages = [
    "A poem is a whisper from the soul...",
    "Even silence has rhythm — listen closely.",
    "Every line you write is a flower blooming.",
    "Let your thoughts dance on paper ✨",
    "Hana believes your words hold magic.",
    "Dreams rhyme better when shared 🌙",
    "What verse will the wind bring today?",
    "In every pause... a poem hides."
  ];

  const hana = document.createElement("div");
  hana.classList.add("hana-bubble");

  const avatar = document.createElement("img");
  avatar.src = "avatar.png";
  avatar.alt = "Hana";
  avatar.classList.add("hana-avatar");

  const text = document.createElement("div");
  text.classList.add("hana-text");
  text.textContent = getRandomMessage();

  // Poem submission elements
  const submitButton = document.createElement("button");
  submitButton.textContent = "Submit Your Poem";
  submitButton.classList.add("submit-poem-button");
  
  // Append elements to Hana's bubble
  hana.appendChild(avatar);
  hana.appendChild(text);
  hana.appendChild(submitButton);
  document.body.appendChild(hana);

  // Float around randomly
  let x = window.innerWidth - 100;
  let y = window.innerHeight - 100;

  setInterval(() => {
    const dx = (Math.random() - 0.5) * 100;
    const dy = (Math.random() - 0.5) * 80;

    x = clamp(x + dx, 20, window.innerWidth - 220);
    y = clamp(y + dy, 20, window.innerHeight - 120);

    hana.style.right = `${window.innerWidth - x}px`;
    hana.style.bottom = `${window.innerHeight - y}px`;
  }, 4000);

  // Update poetic phrases
  setInterval(() => {
    text.textContent = getRandomMessage();
  }, 8000);

  // Button click event to open poem input
  submitButton.addEventListener("click", () => {
    const poemInput = prompt("Please enter your poem:");
    if (poemInput) {
      analyzePoem(poemInput).then(result => {
        displayPoemScore(result);
      });
    }
  });

  function getRandomMessage() {
    return hanaMessages[Math.floor(Math.random() * hanaMessages.length)];
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // Optional function to display poem score
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
});
