// poem-manager.js

// Wrap in IIFE to avoid polluting global scope
// Expose functions to window where necessary for external calls (like from index.html inline script)

const firebaseDatabaseURL = 'https://poeams-b9b5a-default-rtdb.firebaseio.com/';

(function() {

    // initialPoems is defined but currently not used by loadPoems function
    // If you want to display these initially or as a fallback,
    // you'll need to add logic to loadPoems to handle this.
    const initialPoems = [
        {
            "id": "initial-whispers",
            "title": "Whispers of the Night",
            "poemId": "initial-whispers",
            "author": "Celestia Moon",
            "poem": "As the stars begin to gleam,\nAnd the world descends in a dream,\nA gentle hush, a whispered plea,\nFrom the moon, so bright and free.\n\nShadows dance in the pale moonlight,\nWhispering secrets to the quiet night,\nOf ancient tales and forgotten lore,\nAs the world outside begins to snore.\n\nIn this realm where silence thrives,\nA new sense of wonder truly survives,\nWith every heartbeat, soft and deep,\nAs the moonlit world does gently sleep.",
            "score": 72
        },
        {
            "id": "initial-dance",
            "title": "The Dance of Dawn",
            "poemId": "initial-dance",
            "author": "Aurora Light",
            "poem": "With hues of pink and gold so grand,\nDawn breaks across the sleeping land,\nA gentle breeze begins to sigh,\nAs darkness fades from the eastern sky.\n\nBirds awaken with songs so sweet,\nAs dewdrops kiss the flowers' feet,\nA symphony of life anew,\nAs nature wakes, refreshed and true.\n\nIn this dance of day's first light,\nAll shadows flee from the vibrant sight,\nWith every step, a new embrace,\nAs the world awakens with grace.",
            "score": 68
        },
        {
            "id": "initial-echoes",
            "title": "Echoes in the Heart",
            "poemId": "initial-echoes",
            "author": "Lyric Soul",
            "poem": "In chambers of the heart, memories reside,\nEchoes of laughter, where moments glide,\nOf love and loss, a bittersweet array,\nIn the silent theatre of yesterday.\n\nEach beat, a drum, to stories untold,\nIn the depths of feeling, both brave and bold,\nA tapestry woven with joy and pain,\nIn the heart's rhythm, a soft refrain.\n\nAs the echoes linger, clear and bright,\nThey paint the soul with day's warm light,\nIn this grand hall, where time is kept,\nWhere the heart's own secrets softly slept.",
            "score": 75
        }
    ];

    // Function to escape HTML characters for safety when using innerHTML
    function escapeHTML(str) {
        if (typeof str !== 'string') return ''; // Handle non-string input gracefully
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    }

    // Function to create a poem card DOM element
    function createPoemCard(poem, isTop = false) {
        const card = document.createElement('div');
        card.className = isTop ? "poem-card top-poem" : "poem-card";

        // Use escapeHTML for all user-generated text
        const poemTitle = escapeHTML(poem.title || "Untitled");
        const poemContent = escapeHTML(poem.poem).replace(/\n/g, "<br>"); // Preserve line breaks
        const authorName = escapeHTML(poem.author);

        card.innerHTML = `
        <h3>${poemTitle}</h3>
        <p>${poemContent}</p>
        <p><em>— ${authorName}</em> (Score: ${poem.score || 0})</p>
        `;
        return card;
    }

    // Function to load and display poems (specifically fetches and displays top 10)
    // Exposed globally so index.html can call it on load and after submission
    window.loadPoems = async function() {
        const topPoemsContainer = document.getElementById("topPoems");
         if (!topPoemsContainer) {
             console.error("#topPoems element not found. Cannot load poems.");
             return; // Exit if element is missing
         }

        // Clear current top poems list, keep the title
        const titleElement = topPoemsContainer.querySelector('h2');
        topPoemsContainer.innerHTML = ''; // Clear all content
        if(titleElement) {
             topPoemsContainer.appendChild(titleElement); // Re-add the title if it existed
        } else {
             // Add the title if it wasn't found (e.g., first load)
             const newTitle = document.createElement('h2');
             newTitle.textContent = '🏆 Top Poems';
             topPoemsContainer.appendChild(newTitle);
        }


        try {
            // Fetch top 10 poems from Firebase ordered by score (descending)
            // orderBy="score"&limitToLast=10 gets the last 10 items when ordered by score.
            // Since we want top scores, we sort descending in JS.
            const response = await fetch(`${firebaseDatabaseURL}/poems.json?orderBy="score"&limitToLast=10`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let data = null;
            try {
                // Attempt to parse JSON response
                data = await response.json();
            } catch (jsonError) {
                console.error("Error parsing JSON response from Firebase:", jsonError);
                 const message = document.createElement('p');
                 message.textContent = "Unable to load poems due to a data format issue.";
                 topPoemsContainer.appendChild(message);
                 return; // Stop execution if JSON is invalid
            }

            if (data) {
                // Convert data from object to array, add poemId (Firebase key), sort by score descending
                const poems = Object.entries(data)
                    .map(([key, value]) => ({ ...value, poemId: key })) // Add poemId using Firebase key
                    .sort((a, b) => (b.score || 0) - (a.score || 0)); // Sort by score, handle potential undefined

                // Append poem cards to the container
                poems.forEach((poem) => {
                    const card = createPoemCard(poem, true); // Mark as top poem if needed for styling
                    topPoemsContainer.appendChild(card);
                });
            } else {
                // Display a message if no poems are available
                const message = document.createElement('p');
                message.textContent = "No poems submitted yet! Be the first to add one!";
                topPoemsContainer.appendChild(message);
            }
        } catch (error) {
            console.error("Error fetching or processing poems:", error);
            const message = document.createElement('p');
            message.textContent = `Unable to load poems. Please check your connection or Firebase setup. Error: ${error.message}`;
            topPoemsContainer.appendChild(message);
        }
    }


    // Function to set up the poem submission form
    // Exposed globally so index.html can call it on load
    window.setupPoemForm = function() {
        const poemForm = document.getElementById("poemForm");
        const resultMsg = document.getElementById("resultMsg");

         if (!poemForm) {
             console.error("#poemForm element not found. Cannot setup form.");
             return; // Exit if element is missing
         }

        poemForm.addEventListener("submit", async function (e) {
            e.preventDefault(); // Prevent default form submission

            const authorInput = document.getElementById("author");
            const titleInput = document.getElementById("title");
            const poemTextarea = document.getElementById("poem");

            const poemContent = poemTextarea.value.trim(); // Renamed to avoid conflict
            const author = authorInput.value.trim();
            const title = titleInput.value.trim();

            if (!poemContent || !author) { // Simplified check
                 if(resultMsg) {
                    resultMsg.textContent = "Please write a poem and enter your name.";
                    resultMsg.style.color = 'orange';
                }
                return; // Stop execution if required fields are empty
            }

             if(resultMsg) {
                resultMsg.textContent = "Hana is analyzing your poem..."; // Provide user feedback while analyzing
                resultMsg.style.color = 'black'; // Optional styling
             }


            let result = null; // Initialize result to null

            // Check if analyzePoem function exists and call it within a try...catch
            if (typeof window.analyzePoem !== 'function') {
                console.error("analyzePoem function not available. Is poem-scoring.js loaded correctly?");
                 if(resultMsg) {
                    resultMsg.textContent = "Error: Scoring function not loaded. Please refresh.";
                    resultMsg.style.color = 'red';
                }
                return;
            }

            try {
                result = await window.analyzePoem(poemContent); // Pass poemContent
                // Check if analyzePoem returned a valid result object
                if (!result || typeof result.score === 'undefined' || !result.breakdown) {
                    throw new Error(result && result.error ? result.error : "Analysis returned invalid structure.");
                }

            } catch (error) {
                console.error("Error during poem analysis:", error);
                 if(resultMsg) {
                     resultMsg.textContent = `Analysis failed: ${error.message || error}`;
                     resultMsg.style.color = 'red';
                 }
                 // We return here because we cannot proceed without a valid score
                 return;
            }

            // If analysis was successful, create the new poem object
            const score = result.score;
            const newPoem = {
                author: author,
                poem: poemContent, // Use poemContent
                score: score,
                title: title || "Untitled" // Use title, default to "Untitled"
            };

            // Submit the poem to Firebase
            try {
                const response = await fetch(`${firebaseDatabaseURL}/poems.json`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(newPoem),
                });

                if (!response.ok) {
                    throw new Error(`Failed to submit poem to Firebase: ${response.status}`);
                }

                const data = await response.json();
                console.log("Poem successfully submitted:", data);

                // Now, refresh the list of poems to include the new one (if it's in the top)
                await loadPoems();

                // Show the score dialog using the result from analyzePoem
                 if (typeof window.showPoemScore === 'function') {
                    window.showPoemScore(result.score, result.breakdown); // Pass the score and breakdown
                } else {
                    console.error("showPoemScore function not available. Is poem-scoring.js loaded correctly?");
                     // Fallback: display score in the result message
                     if(resultMsg) {
                         resultMsg.textContent = `Poem submitted! Score: ${result.score}/100`;
                         resultMsg.style.color = 'black';
                     }
                }

                // Clear the form after successful submission
                poemForm.reset();

                // Speak as Hana (optional, depends on hana-bot.js)
                if (typeof window.speakAsHana === 'function') {
                     window.speakAsHana(`That was lovely, ${author}! You got ${score} out of 100!`);
                } else {
                     console.warn("speakAsHana function not available.");
                }

                 // Optional: Clear the result message after a short delay or revert it
                 if(resultMsg && typeof window.showPoemScore === 'function') { // Only clear if dialog was shown
                     // Clear the text after a delay, or set back to initial message
                     setTimeout(() => {
                         resultMsg.textContent = "(Hana will appear here and rate your poem!)";
                         resultMsg.style.color = 'black'; // Or default color
                     }, 5000); // Clear after 5 seconds
                 }


            } catch (error) {
                console.error("Error submitting poem:", error);
                 if(resultMsg) {
                    resultMsg.textContent = `Submission failed: ${error.message || error}. Poem analyzed with score ${score}/100, but could not save.`;
                    resultMsg.style.color = 'red';
                }
            }
        });
    }

})(); // End of IIFE
