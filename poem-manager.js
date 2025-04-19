// poem-manager.js

function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (m) {
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
    const poemList = document.getElementById("poemList");// Load poems from data/poems.json
     let initialPoems = [];
     try {
         const response = await fetch('data/poems.json');
         if (response.ok) {
             initialPoems = await response.json();
         } else {
             console.error('Failed to load data/poems.json:', response.status);
         }
     } catch (error) {
         console.error('Error loading data/poems.json:', error);
     }

     // Load existing poems from local storage
     const localStoragePoems = loadPoemsFromLocalStorage();

     // Merge poems, prioritize local storage
     const allPoems = [...localStoragePoems];
     const seen = new Set(localStoragePoems.map(p => p.id || `${p.author}-${p.poem}`));
     initialPoems.forEach(poem => {
         const identifier = poem.id || `${poem.author}-${poem.poem}`;
         if (!seen.has(identifier)) {
             allPoems.push(poem);
             seen.add(identifier);
         }
     });

      // Sort all poems by score
    allPoems.sort((a, b) => b.score - a.score);
    savePoemsToLocalStorage(allPoems);


    // Display top 5 poems from local storage.
    const top5Poems = allPoems.slice(0, 5);

    // Clear current poem list
    topPoemsList.innerHTML = '<h2>🏆 Top Poems</h2>';

    // Populate top 5 poems
    const top5Poems = uniquePoems.slice(0, 5);
    top5Poems.forEach((poem) => {
        const card = createPoemCard(poem)
        poemList.appendChild(card)
   });

    // Populate top 3 poems
   const top3Poems = allPoems.slice(0, 3);
   top3Poems.forEach((poem) => {
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

            showPoemScore(result.score, result.breakdown || {});

            poemForm.reset();
            speakAsHana(`That was lovely, ${author}! You got ${score} out of 100!`);

        }
           // Update top poems
            loadPoems();
    });
    
}

// Make loadPoems accessible globally
window.loadPoems = loadPoems;
window.setupPoemForm = setupPoemForm;