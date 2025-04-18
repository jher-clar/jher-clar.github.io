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

  hana.appendChild(avatar);
  hana.appendChild(text);
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

  function getRandomMessage() {
    return hanaMessages[Math.floor(Math.random() * hanaMessages.length)];
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }
});
