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

  // Add basic checks for element existence
  if (!hanaBubble || !hanaText) {
    console.error("Required DOM elements (#hanaBubble or #hanaText) not found.");
    return; // Stop execution if elements are missing
  }

  // Float around randomly (smoother movement)
  // Use left/top positioning consistently
  let x = window.innerWidth - 200; // Initialize near bottom right
  let y = window.innerHeight - 100; // Initialize near bottom right
  let dx = 1; // Horizontal direction
  let dy = 1; // Vertical direction

  const floatInterval = setInterval(() => {
    if (!isDragging) { // Only float if not dragging
      const speed = 0.5; // Slower speed

      // Calculate max boundaries considering element size
      const maxX = window.innerWidth - hanaBubble.offsetWidth - 20; // Keep 20px from right edge
      const maxY = window.innerHeight - hanaBubble.offsetHeight - 20; // Keep 20px from bottom edge
      const minX = 20; // Keep 20px from left edge
      const minY = 20; // Keep 20px from top edge

      x += dx * speed;
      y += dy * speed;

      // Reverse direction if hitting bounds
      if (x <= minX || x >= maxX) {
        dx *= -1;
        x = clamp(x, minX, maxX); // Clamp to prevent sticking outside bounds
      }
      if (y <= minY || y >= maxY) {
        dy *= -1;
        y = clamp(y, minY, maxY); // Clamp to prevent sticking outside bounds
      }

      hanaBubble.style.left = `${x}px`;
      hanaBubble.style.top = `${y}px`;
      // Remove right/bottom styles
      hanaBubble.style.right = 'auto';
      hanaBubble.style.bottom = 'auto';
    }
  }, 20); // Smaller interval for smoother movement

  // Dragging functionality
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  hanaBubble.addEventListener('mousedown', (e) => {
    isDragging = true;
    // Get the current left/top position to start dragging from
    const rect = hanaBubble.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    hanaBubble.style.transition = 'none'; // Remove transition during dragging
    hanaBubble.style.cursor = 'grabbing'; // Optional: Change cursor
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;

    // Calculate max boundaries considering element size
    const maxX = window.innerWidth - hanaBubble.offsetWidth;
    const maxY = window.innerHeight - hanaBubble.offsetHeight;
    const minX = 0;
    const minY = 0;


    const clampedX = clamp(newX, minX, maxX);
    const clampedY = clamp(newY, minY, maxY);

    hanaBubble.style.left = `${clampedX}px`;
    hanaBubble.style.top = `${clampedY}px`;
    hanaBubble.style.right = 'auto';
    hanaBubble.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) { // Only update if dragging was active
        isDragging = false;
        hanaBubble.style.transition = ''; // Re-enable transition after dragging
        hanaBubble.style.cursor = 'grab'; // Optional: Restore cursor

        // Recalculate x and y based on the final dragged position
        const rect = hanaBubble.getBoundingClientRect();
        x = rect.left;
        y = rect.top;
        // Optional: Adjust dx/dy based on recent movement for smoother transition back to floating
        // This would require tracking previous positions, adding complexity.
        // For now, just updating x and y is sufficient to prevent jumps.
    }
  });

  // Add touch support for dragging on mobile devices
  hanaBubble.addEventListener('touchstart', (e) => {
      // Prevent default touch behavior (like scrolling)
      e.preventDefault();
      isDragging = true;
      const touch = e.touches[0];
      const rect = hanaBubble.getBoundingClientRect();
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
      hanaBubble.style.transition = 'none';
      hanaBubble.style.cursor = 'grabbing';
  });

  document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const newX = touch.clientX - offsetX;
      const newY = touch.clientY - offsetY;

      const maxX = window.innerWidth - hanaBubble.offsetWidth;
      const maxY = window.innerHeight - hanaBubble.offsetHeight;
      const minX = 0;
      const minY = 0;

      const clampedX = clamp(newX, minX, maxX);
      const clampedY = clamp(newY, minY, maxY);

      hanaBubble.style.left = `${clampedX}px`;
      hanaBubble.style.top = `${clampedY}px`;
      hanaBubble.style.right = 'auto';
      hanaBubble.style.bottom = 'auto';
  });

  document.addEventListener('touchend', () => {
      if (isDragging) {
          isDragging = false;
          hanaBubble.style.transition = '';
          hanaBubble.style.cursor = 'grab';
          // Recalculate x and y based on the final dragged position
          const rect = hanaBubble.getBoundingClientRect();
          x = rect.left;
          y = rect.top;
      }
  });


  // Function to update text with fade effect
  function updateHanaText(newMessage) {
    hanaText.classList.add('fade-out');
    setTimeout(() => {
      hanaText.textContent = newMessage;
      hanaText.classList.remove('fade-out');
      hanaText.classList.add('fade-in');
      setTimeout(() => {
        hanaText.classList.remove('fade-in');
      }, 500); // Duration of fade-in CSS animation
    }, 500); // Duration of fade-out CSS animation
  }

  // Update poetic phrases with fade effect
  const textUpdateInterval = setInterval(() => {
    // Only update text if not dragging to avoid jarring changes during interaction
    if (!isDragging) {
       updateHanaText(getRandomMessage());
    }
  }, 5000);


  // Remove the empty click listener
  // hanaBubble.addEventListener('click', () => {});

  function getRandomMessage() {
    return hanaMessages[Math.floor(Math.random() * hanaMessages.length)];
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // Optional function to display poem score
  // This function is defined but not called in the provided script.
  // Consider where and when you want to call this.
  function displayPoemScore(result) {
    // Create a container for the score box, perhaps a modal or a fixed div
    const scoreContainer = document.getElementById('scoreContainer'); // Assumes a score container exists
    if (!scoreContainer) {
        console.error("Score container element not found.");
        // Fallback: append to body if no container, but this is less ideal
        // scoreContainer = document.body;
        return;
    }

    const scoreBox = document.createElement('div');
    // Add styling classes instead of inline styles for better separation of concerns
    scoreBox.classList.add('poem-score-box'); // Assume you have CSS for .poem-score-box

    // Use textContent for dynamic data to prevent XSS
    scoreBox.innerHTML = ''; // Clear previous content if reusing the box

    const title = document.createElement('h3');
    title.textContent = `Poem Rating Score: ${result.score}/100`;
    scoreBox.appendChild(title);

    const breakdownDiv = document.createElement('div');
    breakdownDiv.classList.add('score-breakdown'); // Assume you have CSS for .score-breakdown

    const diversity = document.createElement('div');
    diversity.textContent = `Word Diversity: ${result.breakdown.wordDiversity}%`;
    breakdownDiv.appendChild(diversity);

    const grammar = document.createElement('div');
    grammar.textContent = `Grammar: ${result.breakdown.grammarScore}%`;
    breakdownDiv.appendChild(grammar);

    const sentiment = document.createElement('div');
    sentiment.textContent = `Sentiment: ${result.breakdown.sentiment}%`;
    breakdownDiv.appendChild(sentiment);

    const themes = document.createElement('div');
    themes.textContent = `Themes: ${result.breakdown.themeScore}%`;
    breakdownDiv.appendChild(themes);

    scoreBox.appendChild(breakdownDiv);

    const progressBar = document.createElement('progress');
    progressBar.value = result.score;
    progressBar.max = 100;
    progressBar.classList.add('score-progress'); // Assume you have CSS for .score-progress
    scoreBox.appendChild(progressBar);

    scoreContainer.appendChild(scoreBox); // Append to the designated container

    // Optional: Add a close button or hide logic for the score box
  }

  // Optional: Add event listeners for window resize to adjust boundaries
  window.addEventListener('resize', () => {
      // Recalculate x and y to keep the element within bounds on resize
      const rect = hanaBubble.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - 20;
      const maxY = window.innerHeight - rect.height - 20;
      const minX = 20;
      const minY = 20;

      x = clamp(rect.left, minX, maxX);
      y = clamp(rect.top, minY, maxY);

      // Update position immediately on resize
      hanaBubble.style.left = `${x}px`;
      hanaBubble.style.top = `${y}px`;
  });

  // Optional: Initial positioning adjustment in case of late loading CSS or initial state
  window.dispatchEvent(new Event('resize')); // Trigger resize once on load

});
