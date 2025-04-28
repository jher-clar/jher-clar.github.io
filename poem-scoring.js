// poem-scoring.js

// Wrap in IIFE to avoid polluting global scope
(function() {
    let useModel = null;
    let modelLoadingPromise = null; // Promise to track model loading

    // Common English Stopwords (can be expanded)
    const stopwords = new Set([
        "the", "a", "an", "is", "are", "am", "was", "were", "be", "been", "being",
        "of", "in", "to", "for", "with", "on", "at", "by", "about", "from", "into",
        "through", "during", "before", "after", "above", "below", "up", "down", "out",
        "over", "under", "again", "further", "then", "once", "here", "there", "when",
        "where", "why", "how", "all", "any", "both", "each", "few", "more", "most",
        "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
        "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
        "and", "but", "or", "because", "as", "until", "while", "of", "at", "by", "for",
        "with", "about", "against", "between", "into", "through", "during", "before",
        "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off",
        "over", "under", "again", "further", "then", "once", "here", "there", "when",
        "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other",
        "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too",
        "very", "can", "will", "just", "should", "now"
    ]);


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
                    modelLoadingPromise = null; // Allow retrying if needed
                    throw error; // Re-throw the error
                });
        }
        return modelLoadingPromise;
    }

    // Start loading the model as soon as the script executes
    // loadModel(); // Commenting this out, will load on first analyzePoem call instead,
                   // to avoid loading if the function is never called.
                   // If you want it to load immediately on page load, uncomment this.


    // Cosine similarity calculation
    function cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
            console.error("Invalid input for cosineSimilarity");
            return 0;
        }

        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

        if (magA === 0 || magB === 0) {
            return 0;
        }

        // Return similarity between -1 and 1
        return dotProduct / (magA * magB);
    }

    // Main scoring function
    window.analyzePoem = async function(poemText) {
        if (!poemText || poemText.trim() === "") {
             console.warn("analyzePoem called with empty text.");
             return { score: 0, breakdown: { wordDiversity: 0, structuralDensity: 0, sentiment: 0, themeMatch: 0, cohesion: 0 }, error: "Empty poem text." };
        }

        // Wait for the model to be loaded
        if (!useModel) {
            console.log("Waiting for Universal Sentence Encoder model to load...");
            try {
                 await loadModel();
            } catch (e) {
                 console.error("Model not available, cannot analyze poem.", e);
                 return { score: 0, error: "Model loading failed." };
            }
        }

        // Check for NLP library
        const nlpAvailable = typeof window.nlp === 'function';
        if (!nlpAvailable) {
            console.warn("Compromise NLP library (window.nlp) is not available. Some metrics will be affected.");
        }


        // --- Word Diversity (with Stopword Removal) ---
        const cleanedForWords = poemText.trim().toLowerCase().replace(/[.,!?;:"'(){}[\]]/g, ' '); // Replace punctuation with space
        const words = cleanedForWords.split(/\s+/).filter(word => word.length > 0 && !stopwords.has(word)); // Split, remove empty, and remove stopwords

        let wordDiversity = 0;
        const totalMeaningfulWords = words.length;
        if (totalMeaningfulWords > 0) {
            const uniqueWords = new Set(words);
            wordDiversity = uniqueWords.size / totalMeaningfulWords;
        }
        const wordDiversityScore = Math.min(1, wordDiversity);


        // --- Structural Density (Former Grammar Score) ---
        // This is still a density heuristic, not a grammar check.
        // Renamed and its weight will be reduced.
        let structuralDensityScore = 0;
        if (nlpAvailable && poemText.trim().length > 0) { // Use original text for parsing, check if non-empty
            try {
                 const nlpDoc = window.nlp(poemText);
                 const sentences = nlpDoc.sentences().length;
                 const nouns = nlpDoc.nouns().length;
                 const verbs = nlpDoc.verbs().length;
                 const totalParsedWords = nlpDoc.words().length; // Use NLP's word count

                 if (totalParsedWords > 0) {
                     structuralDensityScore = (
                         (sentences > 0 ? sentences * 0.5 : 0) +
                         nouns * 0.3 +
                         verbs * 0.2
                     ) / totalParsedWords;
                     structuralDensityScore = Math.min(1, structuralDensityScore);
                 }
            } catch (e) {
                 console.error("Error during NLP analysis for structural density:", e);
                 // structuralDensityScore remains 0
            }
        }


        // --- Sentiment Score (Keep for now, lower weight) ---
        let sentimentScore = 0; // Neutral default
        try {
            const embeddings = await useModel.embed([poemText, "happy", "sad"]);
            const embeddingArray = await embeddings.array();

            const poemVec = embeddingArray[0];
            const happyVec = embeddingArray[1];
            const sadVec = embeddingArray[2];

            const happySimilarity = cosineSimilarity(poemVec, happyVec);
            const sadSimilarity = cosineSimilarity(poemVec, sadVec);

            // Normalize difference from -1 to 1 range to 0 to 1 range
            // sentimentScore close to 1 means more 'happy' than 'sad'
            // sentimentScore close to 0 means more 'sad' than 'happy'
            // sentimentScore near 0.5 means neutral
            sentimentScore = (happySimilarity - sadSimilarity + 1) / 2;
            sentimentScore = Math.max(0, Math.min(1, sentimentScore));

        } catch (e) {
             console.error("Error during sentiment analysis:", e);
             // sentimentScore remains 0
        }


        // --- Theme Match Score (USE-based) ---
        // Define themes as phrases or single words
        const themes = ["love", "nature", "sadness", "hope", "death", "friendship", "beauty", "loss", "time", "journey"]; // Expanded themes
        let themeMatchScore = 0; // Default to 0 if no themes or embedding fails
        let themeEmbeddings = null;

        try {
             // Embed the poem and all themes
             const textsToEmbed = [poemText, ...themes];
             const embeddings = await useModel.embed(textsToEmbed);
             const embeddingArray = await embeddings.array();

             const poemVec = embeddingArray[0];
             themeEmbeddings = embeddingArray.slice(1); // Embeddings for each theme

             if (themeEmbeddings.length > 0 && poemVec) {
                 let maxSimilarity = -1; // Cosine similarity is between -1 and 1
                 for (const themeVec of themeEmbeddings) {
                     const similarity = cosineSimilarity(poemVec, themeVec);
                     if (similarity > maxSimilarity) {
                         maxSimilarity = similarity;
                     }
                 }
                 // Normalize max similarity from -1 to 1 range to 0 to 1 range
                 // A score near 1 means it's very similar to at least one theme
                 // A score near 0 means it's somewhat related (0 similarity)
                 // A score near -1 means it's conceptually opposite (unlikely for themes)
                 themeMatchScore = (maxSimilarity + 1) / 2;
                 themeMatchScore = Math.max(0, Math.min(1, themeMatchScore)); // Ensure 0-1

             } else {
                 console.warn("No themes or embedding failed for theme matching.");
             }
        } catch (e) {
             console.error("Error during USE-based theme analysis:", e);
             // themeMatchScore remains 0
        }


        // --- Cohesion Score (USE-based, Semantic Flow) ---
        let cohesionScore = 0; // Default to 0
        if (nlpAvailable && poemText.trim().length > 0) { // Need NLP to split sentences reliably
            try {
                 const nlpDoc = window.nlp(poemText);
                 const sentences = nlpDoc.sentences().out('array').filter(s => s.trim().length > 0); // Get sentences as array

                 if (sentences.length > 1) {
                     const sentenceEmbeddings = await useModel.embed(sentences).array();
                     let totalSimilarity = 0;
                     let pairCount = 0;

                     for (let i = 0; i < sentenceEmbeddings.length - 1; i++) {
                         const sim = cosineSimilarity(sentenceEmbeddings[i], sentenceEmbeddings[i+1]);
                         totalSimilarity += sim;
                         pairCount++;
                     }

                     if (pairCount > 0) {
                         const averageSimilarity = totalSimilarity / pairCount;
                         // Normalize average similarity from -1 to 1 range to 0 to 1 range
                         // Higher score means sentences are semantically closer on average
                         cohesionScore = (averageSimilarity + 1) / 2;
                         cohesionScore = Math.max(0, Math.min(1, cohesionScore)); // Ensure 0-1
                     } else {
                         console.warn("Only one sentence found, cannot calculate cohesion.");
                         cohesionScore = 0.5; // Or maybe 1? Hard to define for 1 sentence. Let's make it neutral.
                     }

                 } else if (sentences.length === 1) {
                     console.warn("Only one sentence found, cohesion metric not applicable. Setting to neutral (0.5).");
                     cohesionScore = 0.5; // Poem is a single unit, no flow *between* sentences to measure.
                 } else {
                      console.warn("No valid sentences found for cohesion calculation.");
                      cohesionScore = 0;
                 }

            } catch (e) {
                 console.error("Error during cohesion analysis:", e);
                 // cohesionScore remains 0
            }
        } else if (poemText.trim().length > 0) {
             console.warn("Compromise NLP not available, cannot calculate cohesion score.");
             // cohesionScore remains 0
        }


        // --- Final Score Calculation ---
        // Adjusted Weights:
        // Word Diversity (Meaningful words): 20% (Good vocabulary is important)
        // Structural Density (Former Grammar): 10% (Acknowledge its limitation, but some structure is good)
        // Sentiment: 10% (Acknowledge limitation, sentiment is a factor but not the only one)
        // Theme Match (USE-based): 30% (Semantic relevance to themes)
        // Cohesion (USE-based): 30% (Semantic flow between lines/sentences)
        // Total: 20 + 10 + 10 + 30 + 30 = 100%

        const rawScore = (
            wordDiversityScore * 20 +
            structuralDensityScore * 10 + // Reduced weight
            sentimentScore * 10 +         // Reduced weight
            themeMatchScore * 30 +        // Increased weight (USE)
            cohesionScore * 30            // New metric, significant weight (USE)
        );

        const score = Math.round(rawScore);

        return {
            score: Math.max(0, Math.min(100, score)), // Ensure score is between 0 and 100
            breakdown: {
                wordDiversity: Math.round(wordDiversityScore * 100),
                structuralDensity: Math.round(structuralDensityScore * 100),
                sentiment: Math.round(sentimentScore * 100),
                themeMatch: Math.round(themeMatchScore * 100),
                cohesion: Math.round(cohesionScore * 100)
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
            { label: '📚 Word Diversity', value: breakdown.wordDiversity, title: 'Ratio of unique meaningful words to total meaningful words' },
            { label: '🏗️ Structural Density', value: breakdown.structuralDensity, title: 'Density of sentences, nouns, and verbs (Heuristic, not grammar correctness)' },
            { label: '😊 Sentiment', value: breakdown.sentiment, title: 'Mood proximity towards positive/negative sentiment (Simple metric)' },
            { label: '💡 Theme Match', value: breakdown.themeMatch, title: 'Semantic similarity to common poetic themes (USE-based)' },
            { label: '🌊 Cohesion', value: breakdown.cohesion, title: 'Semantic flow/relatedness between adjacent sentences/lines (USE-based)' } // New item
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
                 max-width: 450px; /* Max width on larger screens */
                 background-color: #fff0f5; /* Pastel pink */
                 padding: 25px; /* Increased padding */
                 border-radius: 15px;
                 box-shadow: 0 6px 12px 0 rgba(0, 0, 0, 0.3), 0 8px 24px 0 rgba(0, 0, 0, 0.25); /* Stronger shadow */
                 flex-direction: column;
                 align-items: center;
                 transition: opacity 0.4s ease; /* Smooth fade in/out with ease timing */
                 opacity: 0;
                 color: #333; /* Default text color */
                 font-family: sans-serif; /* Use a common font */
                 box-sizing: border-box; /* Include padding in width */
             }
             .poem-score-dialog.show {
                 opacity: 1; /* Fully visible */
             }
             .poem-score-dialog h2 {
                 color: #e91e63; /* Stronger pink for title */
                 margin-top: 0; /* Remove top margin */
                 margin-bottom: 20px; /* Increased margin */
                 font-size: 1.6em; /* Adjusted font size */
                 text-align: center;
             }
             .score-breakdown {
                 display: flex;
                 flex-direction: column;
                 width: 100%;
                 gap: 8px; /* Add space between items */
             }
             .breakdown-item {
                 background-color: #ffb6c1; /* Lighter pink background */
                 padding: 12px; /* Increased padding */
                 border-radius: 8px;
                 font-size: 0.95em; /* Slightly larger font */
                 display: flex;
                 align-items: center;
                 justify-content: space-between; /* Space out label and value */
                 color: #444; /* Text color for items */
                 box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Subtle shadow for items */
             }
              .breakdown-item span:first-child {
                 font-weight: bold; /* Make labels bold */
                 margin-right: 15px; /* Space between label and value */
                 flex-shrink: 0; /* Prevent label from shrinking */
              }
              .breakdown-item span:last-child {
                  font-weight: normal; /* Ensure value is not bold */
              }

             .close-button {
                 position: absolute;
                 right: 15px;
                 top: 15px;
                 cursor: pointer;
                 font-size: 2em; /* Larger X */
                 color: #888;
                 transition: color 0.2s ease, transform 0.2s ease; /* Added transform transition */
                 line-height: 1; /* Prevent extra space below X */
             }
             .close-button:hover {
                 color: #e91e63; /* Hover color */
                 transform: rotate(90deg); /* Rotate on hover */
             }

             /* Responsive adjustments for the dialog */
             @media (max-width: 500px) {
                  .poem-score-dialog {
                      width: 95%; /* Use more width on very small screens */
                      padding: 20px;
                  }
                  .poem-score-dialog h2 {
                      font-size: 1.4em;
                  }
                   .breakdown-item {
                      font-size: 0.9em;
                      flex-direction: column; /* Stack label and value on small screens */
                      align-items: flex-start;
                      padding: 10px;
                   }
                    .breakdown-item span:first-child {
                      margin-right: 0;
                      margin-bottom: 4px; /* Space when stacked */
                    }
              }
         `;
         document.head.appendChild(styles);
    }

    // Optional: Trigger initial model load in the background
    // Uncomment if you want the model to start loading as soon as the script runs.
    // This can make the first analysis faster, but consumes resources on page load.
    // loadModel();


})(); // End of IIFE
