document.addEventListener('DOMContentLoaded', () => {
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

  const hanaBubble = document.getElementById('hanaBubble');
  const hanaText = document.getElementById('hanaText');


  // Function to update text with fade effect
  function updateHanaText(newMessage) {
    hanaText.classList.add('fade-out');
    setTimeout(() => {
      hanaText.textContent = newMessage;
      hanaText.classList.remove('fade-out');
      hanaText.classList.add('fade-in');
      setTimeout(() => {
        hanaText.classList.remove('fade-in');
      }, 500);
    }, 500);
  }

    // Float around randomly (smoother movement)
    let x = window.innerWidth - 100;
    let y = window.innerHeight - 100;
    let dx = 1; // Horizontal direction
    let dy = 1; // Vertical direction
    
    setInterval(() => {
        const speed = 0.5; // Slower speed
        const maxX = window.innerWidth - 220;
        const maxY = window.innerHeight - 120;
    
        x += dx * speed;
        y += dy * speed;
    
        // Reverse direction if hitting bounds
        if (x <= 20 || x >= maxX) dx *= -1;
        if (y <= 20 || y >= maxY) dy *= -1;
    
        hanaBubble.style.right = `${window.innerWidth - x}px`;
        hanaBubble.style.bottom = `${window.innerHeight - y}px`;
    }, 20); // Smaller interval for smoother movement
    

  // Update poetic phrases with fade effect
  setInterval(() => {
    updateHanaText(getRandomMessage());
  }, 5000);

  // Button click event to open poem input

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit Your Poem';
    submitButton.classList.add('submit-poem-button');
    hanaBubble.appendChild(submitButton);
    submitButton.addEventListener('click', () => {
        const poemInput = prompt('Please enter your poem:');
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
    scoreBox.innerHTML=`<h3 style="margin-top: 0;">Poem Rating Score: ${result.score}/100</h3>\n<div style="margin-top: 10px;">\n  <div><strong>Word Diversity:</strong> ${result.breakdown.wordDiversity}%</div>\n  <div><strong>Grammar:</strong> ${result.breakdown.grammarScore}%</div>\n  <div><strong>Sentiment:</strong> ${result.breakdown.sentiment}%</div>\n  <div><strong>Themes:</strong> ${result.breakdown.themeScore}%</div>\n</div>\n<progress value="${result.score}" max="100" style="width: 100%; margin-top: 10px;"></progress>`;
    document.body.appendChild(scoreBox);
  }
});
