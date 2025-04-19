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

    // Check if dragging is active
    if (!isDragging) {
      hanaBubble.style.right = `${window.innerWidth - x}px`;
      hanaBubble.style.bottom = `${window.innerHeight - y}px`;
    }
  }, 20); // Smaller interval for smoother movement

  // Dragging functionality
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  hanaBubble.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - hanaBubble.getBoundingClientRect().left;
    offsetY = e.clientY - hanaBubble.getBoundingClientRect().top;
    hanaBubble.style.transition = 'none'; // Remove transition during dragging
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;
    
    const maxX = window.innerWidth - hanaBubble.offsetWidth;
    const maxY = window.innerHeight - hanaBubble.offsetHeight;

    const clampedX = clamp(newX, 0, maxX);
    const clampedY = clamp(newY, 0, maxY);

    hanaBubble.style.left = `${clampedX}px`;
    hanaBubble.style.top = `${clampedY}px`;
    hanaBubble.style.right = 'auto';
    hanaBubble.style.bottom = 'auto';


  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    hanaBubble.style.transition = ''; // Re-enable transition after dragging
  });

  // Function to update text with fade effect
  function updateHanaText(newMessage) {
    hanaText.classList.add('fade-out');
    setTimeout(() => {hanaText.textContent = newMessage;
      hanaText.classList.remove('fade-out');hanaText.classList.add('fade-in');setTimeout(() => {hanaText.classList.remove('fade-in');}, 500);}, 500);
  }

  // Update poetic phrases with fade effect
  setInterval(() => {
    updateHanaText(getRandomMessage());
  }, 5000);
    //Remove poem submission popup event
    hanaBubble.addEventListener('click', () => {
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
