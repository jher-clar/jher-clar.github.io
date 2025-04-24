// poem-scoring.js

// Wrap in IIFE to avoid polluting global scope
(function() {
    let useModel = null;
    let modelLoadingPromise = null; // Promise to track model loading

    // Function to load the model, returns a promise
    function loadModel() {
        if (!modelLoadingPromise) {
            console.log("Loading Universal Sentence Encoder model...");
            modelLoadingPromise = use.load()
                .then(model => {
                    useModel = model;
                    console.log("Universal Sentence Encoder model loaded.");
                    return model;
                })
                .catch(error => {
                    console.error("Failed to load Universal Sentence Encoder:", error);
                    modelLoadingPromise = null; // Allow retrying if needed, though ideally fix root cause
                    throw error; // Re-throw the error so callers can catch it
                });
        }
        return modelLoadingPromise;
    }

    // Start loading the model as soon as the script executes
    loadModel();

    // Cosine similarity calculation
    function cosineSimilarity(vecA, vecB) {
        // Check for valid inputs
        if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
            console.error("Invalid input for cosineSimilarity");
            return 0; // Return 0 or throw error for invalid input
        }

        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

        // Avoid division by zero if magnitudes are zero
        if (magA === 0 || magB === 0) {
            return 0;
        }

        return dotProduct / (magA * magB);
    }

    // Main scoring function
    window.analyzePoem = async function(poemText) { // Expose to global scope if needed
        if (!poemText || poemText.trim() === "") {
             console.warn("analyzePoem called with empty text.");
             return { score: 0, breakdown: { wordDiversity: 0, grammarScore: 0, sentiment: 0, themeScore: 0 } };
        }

        // Wait for the model to be loaded
        if (!useModel) {
            console.log("Waiting for Universal Sentence Encoder model to load...");
            try {
                 await loadModel(); // Wait for the shared loading promise
            } catch (e) {
                 console.error("Model not available, cannot analyze poem.", e);
                 // Return a default error score or null
                 return { score: 0, error: "Model loading failed." };
            }
        }

        // Check for NLP library
        if (typeof window.nlp !== 'function') {
            console.error("Compromise NLP library (window.nlp) is not available. Cannot calculate grammar score.");
             // Proceed without grammar score or return an error
        }


        // --- Word Diversity ---
        // Clean text for word counting, preserving spaces and internal punctuation
        const cleanedForWords = poemText.trim().toLowerCase().replace(/[.,!?;:"'(){}[\]]/g, '');
        const words = cleanedForWords.split(/\s+/).filter(word => word.length > 0); // Split and remove empty strings

        let wordDiversity = 0;
        if (words.length > 0) {
            const uniqueWords = new Set(words);
            wordDiversity = uniqueWords.size / words.length;
        }
        const wordDiversityScore = Math.min(1, wordDiversity);


        // --- Grammar Score (Heuristic) ---
        // Use original text for NLP parsing
        let grammarScore = 0;
        if (typeof window.nlp === 'function' && words.length > 0) {
            try {
                 const nlpDoc = window.nlp(poemText); // Use original text for better parsing
                 // This is a density measure, not a true grammar check
                 grammarScore = (
                     (nlpDoc.sentences().length > 0 ? nlpDoc.sentences().length * 0.5 : 0) + // Avoid NaN if 0 sentences
                     nlpDoc.nouns().length * 0.3 +
                     nlpDoc.verbs().length * 0.2
                 ) / words.length; // Use total word count for normalization
                 grammarScore = Math.min(1, grammarScore); // Cap at 1
            } catch (e) {
                 console.error("Error during NLP grammar analysis:", e);
                 // grammarScore remains 0
            }
        } else if (words.length === 0) {
             grammarScore = 0; // No words, no grammar score
        }


        // --- Sentiment Score ---
        let sentimentScore = 0;
        try {
            const embeddings = await useModel.embed([poemText, "happy", "sad"]);
            const embeddingArray = await embeddings.array();

            const poemVec = embeddingArray[0];
            const happyVec = embeddingArray[1];
            const sadVec = embeddingArray[2];

            const happySimilarity = cosineSimilarity(poemVec, happyVec);
            const sadSimilarity = cosineSimilarity(poemVec, sadVec);

            // Normalize difference from -1 to 1 range to 0 to 1 range
            sentimentScore = (happySimilarity - sadSimilarity + 1) / 2;
            sentimentScore = Math.max(0, Math.min(1, sentimentScore)); // Ensure it's between 0 and 1
        } catch (e) {
             console.error("Error during sentiment analysis:", e);
             // sentimentScore remains 0
        }


        // --- Theme Match Score ---
        const themes = ["love", "nature", "sadness", "hope", "death", "friendship"];
        const lowerPoemText = poemText.toLowerCase();
        const themeMatches = themes.filter(theme => lowerPoemText.includes(theme));
        let themeScore = 0;
        if (themes.length > 0) { // Avoid division by zero if themes array is empty
            themeScore = themeMatches.length / themes.length;
        }
        const themeMatchScore = Math.min(1, themeScore);


        // --- Final Score Calculation ---
        // Weights: Word Diversity (30), Grammar (30), Sentiment (20), Themes (20)
        const rawScore = (wordDiversityScore * 30 + grammarScore * 30 + sentimentScore * 20 + themeMatchScore * 20);
        const score = Math.round(rawScore);

        return {
            score: Math.max(0, Math.min(100, score)), // Ensure score is between 0 and 100
            breakdown: {
                wordDiversity: Math.round(wordDiversityScore * 100),
                grammarScore: Math.round(grammarScore * 100),
                sentiment: Math.round(sentimentScore * 100),
                themeScore: Math.round(themeMatchScore * 100)
            }
        };
    }

    // UI-bound result renderer (now displays a popup dialog)
    // Expose to global scope if needed
    window.showPoemScore = function(score, breakdown) {
        // Create the dialog box container
        let dialog = document.getElementById('poemScoreDialog');
        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'poemScoreDialog';
            dialog.classList.add('poem-score-dialog');
            document.body.appendChild(dialog);
        }

        // Clear previous content
        dialog.innerHTML = '';

        // Create the close button
        const closeButton = document.createElement('span');
        closeButton.classList.add('close-button');
        closeButton.textContent = '\u00D7'; // X symbol using textContent
        closeButton.addEventListener('click', function() {
            dialog.classList.remove('show'); // Fade-out animation
            // Listen for the transition to end before hiding
            dialog.addEventListener('transitionend', function handler() {
                 dialog.style.display = 'none';
                 dialog.removeEventListener('transitionend', handler); // Clean up the listener
            }, { once: true }); // Use { once: true } for modern browsers
        });
        dialog.appendChild(closeButton);

        // Create the score title
        const title = document.createElement('h2');
        title.textContent = `Your Score: ${score}/100`;
        dialog.appendChild(title);

        // Create the breakdown container
        const breakdownDiv = document.createElement('div');
        breakdownDiv.classList.add('score-breakdown');

        // Use createElement and textContent for safety and clarity
        const items = [
            { label: '🌐 Word Diversity', value: breakdown.wordDiversity, title: 'Ratio of unique to total words' },
            { label: '🧠 Grammar Score', value: breakdown.grammarScore, title: 'Grammar composition including sentence, noun, and verb density (Heuristic)' },
            { label: '😊 Sentiment', value: breakdown.sentiment, title: 'Mood proximity between happiness and sadness' },
            { label: '🌈 Theme Match', value: breakdown.themeScore, title: 'Matches with known poetic themes (Keyword match)' }
        ];

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('breakdown-item');
            itemDiv.setAttribute('title', item.title); // Add tooltip

            const labelSpan = document.createElement('span');
            labelSpan.textContent = item.label + ':'; // Label text
            itemDiv.appendChild(labelSpan);

            const valueSpan = document.createElement('span');
            valueSpan.textContent = item.value + '%'; // Value text
            itemDiv.appendChild(valueSpan);

            breakdownDiv.appendChild(itemDiv);
        });


        dialog.appendChild(breakdownDiv);

        // Make the dialog box visible and trigger fade-in
        dialog.style.display = 'flex';
        // Use a small timeout to ensure display:flex is applied before adding the class
        requestAnimationFrame(() => {
             requestAnimationFrame(() => {
                 dialog.classList.add('show');
             });
        });
    };

    // Inject CSS for the dialog if it doesn't exist (alternative to a separate CSS file)
    if (!document.getElementById('poemScoreDialogStyles')) {
         const styles = document.createElement('style');
         styles.id = 'poemScoreDialogStyles'; // Add an ID to prevent duplicate injection
         styles.innerHTML = `
             .poem-score-dialog {
                 display: none; /* Hidden by default */
                 position: fixed; /* Stay in place */
                 z-index: 1000; /* Ensure it's on top, higher than bubble */
                 left: 50%;
                 top: 50%;
                 transform: translate(-50%, -50%);
                 width: 90%; /* Make responsive */
                 max-width: 400px; /* Max width on larger screens */
                 background-color: #fff0f5; /* Pastel pink */
                 padding: 20px;
                 border-radius: 15px;
                 box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
                 flex-direction: column;
                 align-items: center;
                 transition: opacity 0.3s ease; /* Smooth fade in/out with ease timing */
                 opacity: 0;
                 color: #333; /* Default text color */
             }
             .poem-score-dialog.show {
                 opacity: 1; /* Fully visible */
             }
             .poem-score-dialog h2 {
                 color: #ff69b4; /* Brighter pink for title */
                 margin-bottom: 15px; /* Increased margin */
                 font-size: 1.5em; /* Adjusted font size */
             }
             .score-breakdown {
                 display: flex;
                 flex-direction: column;
                 width: 100%;
             }
             .breakdown-item {
                 background-color: #f77fbe;
                 padding: 10px; /* Increased padding */
                 margin-bottom: 8px; /* Increased margin */
                 border-radius: 8px;
                 font-size: 0.9em;
                 display: flex;
                 align-items: center;
                 justify-content: space-between; /* Space out label and value */
                 color: #444; /* Text color for items */
             }
              .breakdown-item span:first-child {
                 font-weight: bold; /* Make labels bold */
                 margin-right: 10px; /* Space between label and value */
              }

             .close-button {
                 position: absolute;
                 right: 15px;
                 top: 10px;
                 cursor: pointer;
                 font-size: 1.8em; /* Slightly larger */
                 color: #888;
                 transition: color 0.2s ease; /* Added ease */
                 line-height: 1; /* Prevent extra space below X */
             }
             .close-button:hover {
                 color: #000;
             }

             /* Responsive adjustments for the dialog */
             @media (max-width: 450px) {
                 .poem-score-dialog {
                     width: 95%; /* Use more width on very small screens */
                     padding: 15px;
                 }
                 .poem-score-dialog h2 {
                    font-size: 1.3em;
                 }
                  .breakdown-item {
                     font-size: 0.85em;
                     flex-direction: column; /* Stack label and value on small screens */
                     align-items: flex-start;
                  }
                   .breakdown-item span:first-child {
                     margin-right: 0;
                     margin-bottom: 5px; /* Space when stacked */
                  }
             }
         `;
         document.head.appendChild(styles);
    }

})(); // End of IIFE
