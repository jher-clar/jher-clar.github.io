// poem-manager.js

const initialPoems = [
    {
        "title": "Whispers of the Night",
        "author": "Celestia Moon",
        "poem": "As the stars begin to gleam,\nAnd the world descends in a dream,\nA gentle hush, a whispered plea,\nFrom the moon, so bright and free.\n\nShadows dance in the pale moonlight,\nWhispering secrets to the quiet night,\nOf ancient tales and forgotten lore,\nAs the world outside begins to snore.\n\nIn this realm where silence thrives,\nA new sense of wonder truly survives,\nWith every heartbeat, soft and deep,\nAs the moonlit world does gently sleep.",
        "score": 92
    },
    {
        "title": "The Dance of Dawn",
        "author": "Aurora Light",
        "poem": "With hues of pink and gold so grand,\nDawn breaks across the sleeping land,\nA gentle breeze begins to sigh,\nAs darkness fades from the eastern sky.\n\nBirds awaken with songs so sweet,\nAs dewdrops kiss the flowers' feet,\nA symphony of life anew,\nAs nature wakes, refreshed and true.\n\nIn this dance of day's first light,\nAll shadows flee from the vibrant sight,\nWith every step, a new embrace,\nAs the world awakens with grace.",
        "score": 88
    },
    {
        "title": "Echoes in the Heart",
        "author": "Lyric Soul",
        "poem": "In chambers of the heart, memories reside,\nEchoes of laughter, where moments glide,\nOf love and loss, a bittersweet array,\nIn the silent theatre of yesterday.\n\nEach beat, a drum, to stories untold,\nIn the depths of feeling, both brave and bold,\nA tapestry woven with joy and pain,\nIn the heart's rhythm, a soft refrain.\n\nAs the echoes linger, clear and bright,\nThey paint the soul with day's warm light,\nIn this grand hall, where time is kept,\nWhere the heart's own secrets softly slept.",
        "score": 95
    }
];

function escapeHTML(str) {
    return str.replace(/[&<>\"\']/g, function (m) {
        return {
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#039;'
        }[m];
    });
}

// Function to load poems from local storage
function loadPoemsFromLocalStorage() {
    const storedPoems = localStorage.getItem('poems');
    return storedPoems ? JSON.parse(storedPoems) : [];
}

// Function to save poems to local storage
function savePoemsToLocalStorage(poems) {
    localStorage.setItem('poems', JSON.stringify(poems));
}

function createPoemCard(poem, isTop = false) {
    const card = document.createElement('div');
    card.className = isTop ? "poem-card top-poem" : "poem-card";
    card.innerHTML = `<p>${escapeHTML(poem.poem).replace(/\n/g, "<br>")}</p><p><em>— ${escapeHTML(poem.author)}</em> (Score: ${poem.score})</p>`;
    return card;
}

async function loadPoems() {
    const topPoemsList = document.getElementById("topPoems");
    const poemList = document.getElementById("poemList");

    // Load poems from local storage
    const localStoragePoems = loadPoemsFromLocalStorage();

    // Merge and deduplicate poems, prioritizing local storage
    let allPoems = [...localStoragePoems];
    const seenIds = new Set();
    localStoragePoems.forEach(poem => {
        const identifier = poem.id || `${poem.author}-${poem.poem}`;
        seenIds.add(identifier);
    });

    initialPoems.forEach(poem => {
        const identifier = poem.id || `${poem.author}-${poem.poem}`;
        if (!seenIds.has(identifier)) {
            allPoems.push(poem);
        }
    });

    // Sort poems by score
    allPoems.sort((a, b) => b.score - a.score);

    // Store merged poems in local storage
    savePoemsToLocalStorage(allPoems);

    // Clear current poem list
    poemList.innerHTML = '';
    topPoemsList.innerHTML = '<h2>🏆 Top Poems</h2>';

    // Populate top 5 poems
    const top5Poems = allPoems.slice(0, 5);
    top5Poems.forEach((poem) => {
        const card = createPoemCard(poem)
        poemList.appendChild(card)
    });

    // Populate top 3 poems
    const topPoems = allPoems.slice(0, 3);
    topPoems.forEach((poem) => {
        const card = createPoemCard(poem, true);
        topPoemsList.appendChild(card);
    });
}

function setupPoemForm() {
    const poemForm = document.getElementById("poemForm");
    const poemList = document.getElementById("poemList");
    const resultMsg = document.getElementById("resultMsg");

    poemForm?.addEventListener("submit", async function (e) {
        e.preventDefault();
        const poem = document.getElementById("poem").value.trim();
        const author = document.getElementById("author").value.trim();

        if (poem && author) {
            const result = await analyzePoem(poem); // Call analyzePoem from poem-scoring.js
            const score = result.score;
            const newPoem = { // Create a new object with the correct structure
                id: uuidv4(),
                author: author,
                poem: poem,
                score: score
            }

            // Save to local storage
            const currentPoems = loadPoemsFromLocalStorage();
            currentPoems.push(newPoem);
            savePoemsToLocalStorage(currentPoems);

            // Update the UI
            const card = createPoemCard(newPoem);
            poemList.insertBefore(card, poemList.firstChild); // Add to the beginning of the list

            // Update top poems
            loadPoems();

            showPoemScore(result.score, result.breakdown || {});

            poemForm.reset();
            speakAsHana(`That was lovely, ${author}! You got ${score} out of 100!`);

        }
    });
}

// Make loadPoems accessible globally
window.loadPoems = loadPoems;
window.setupPoemForm = setupPoemForm;
