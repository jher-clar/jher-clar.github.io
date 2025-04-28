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
                    // Optional: Pre-embed some common words like themes/sentiment to speed up first analysis
                    // This adds a small delay to initial load but makes first analyze call faster.
                    // Disabled for now, load on demand in analyzePoem.
                    // return useModel.embed(["happy", "sad", "love", "nature"]);
                })
                .catch(error => {
                    console.error("Failed to load Universal Sentence Encoder:", error);
                    modelLoadingPromise = null; // Allow retrying if needed
                    throw error; // Re-throw the error
                });
        }
        return modelLoadingPromise;
    }

    // Optional: Trigger initial model load in the background as soon as script is parsed
    // Uncomment if you want the model to start loading immediately on page load.
    // This can make the first analysis faster, but consumes resources on page load.
    // loadModel();


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
                 // Return a specific error object if model loading fails
                 return { score: 0, error: "Model loading failed." };
            }
        }

        // Check for NLP library
        const nlpAvailable = typeof window.nlp === 'function';
        if (!nlpAvailable) {
            console.warn("Compromise NLP library (window.nlp) is not available. Structural Density and Cohesion will be 0.");
        }


        // --- Word Diversity (with Stopword Removal) ---
        // Clean text for word counting, preserving spaces and internal punctuation initially
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
        let structuralDensityScore = 0; // Default to 0 if NLP not available or fails
        if (nlpAvailable && poemText.trim().length > 0) {
            try {
                 const nlpDoc = window.nlp(poemText);
                 const sentences = nlpDoc.sentences().length;
                 const nouns = nlpDoc.nouns().length;
                 const verbs = nlpDoc.verbs().length;
                 // FIX: Use nlpDoc.wordCount()
                 const totalParsedWords = nlpDoc.wordCount();

                 if (totalParsedWords > 0) {
                     structuralDensityScore = (
                         (sentences > 0 ? sentences * 0.5 : 0) +
                         nouns * 0.3 +
                         verbs * 0.2
                     ) / totalParsedWords;
                     structuralDensityScore = Math.min(1, structuralDensityScore);
                 } else {
                     console.warn("NLP parsed 0 words for structural density.");
                     structuralDensityScore = 0;
                 }
            } catch (e) {
                 console.error("Error during NLP analysis for structural density:", e);
                 structuralDensityScore = 0; // Ensure it's 0 on error
            }
        } else if (poemText.trim().length > 0) {
             // If NLP is not available but text is not empty, warn user
             console.warn("Compromise NLP not available, Structural Density score will be 0.");
             structuralDensityScore = 0;
        }


        // --- Sentiment Score & Theme Match Score (USE-based) ---
        let sentimentScore = 0; // Neutral default
        // FIX: Declare themeMatchScore here so it's accessible later
        let themeMatchScore = 0; // Default to 0

        const sentimentAndThemeTexts = [poemText, "happy", "sad"];
        const themes = ["love", "nature", "sadness", "hope", "death", "friendship", "beauty", "loss", "time", "journey"]; // Expanded themes
        sentimentAndThemeTexts.push(...themes); // Add themes to the list for embedding

        let sentimentThemeEmbeddingsTensor = null;

        try {
             // Embed the poem, sentiment words, and themes in one batch
             sentimentThemeEmbeddingsTensor = await useModel.embed(sentimentAndThemeTexts);
             // FIX: Separate await for .array() and add dispose
             const embeddingArray = await sentimentThemeEmbeddingsTensor.array();

             const poemVecSentimentTheme = embeddingArray[0];
             const happyVec = embeddingArray[1];
             const sadVec = embeddingArray[2];
             const themeEmbeddings = embeddingArray.slice(3); // Embeddings for each theme start from index 3

             // Dispose the tensor after getting the array data
             sentimentThemeEmbeddingsTensor.dispose();


             // Calculate Sentiment
             if (poemVecSentimentTheme && happyVec && sadVec) {
                 const happySimilarity = cosineSimilarity(poemVecSentimentTheme, happyVec);
                 const sadSimilarity = cosineSimilarity(poemVecSentimentTheme, sadVec);
                 sentimentScore = (happySimilarity - sadSimilarity + 1) / 2; // Normalize -1 to 1 range to 0 to 1 range
                 sentimentScore = Math.max(0, Math.min(1, sentimentScore)); // Ensure it's between 0 and 1
             } else {
                 console.warn("Sentiment embedding vectors not available.");
                 sentimentScore = 0;
             }


             // Calculate Theme Match (USE-based)
             if (themeEmbeddings.length > 0 && poemVecSentimentTheme) {
                 let maxSimilarity = -1; // Cosine similarity is between -1 and 1
                 for (const themeVec of themeEmbeddings) {
                     const similarity = cosineSimilarity(poemVecSentimentTheme, themeVec);
                     if (similarity > maxSimilarity) {
                         maxSimilarity = similarity;
                     }
                 }
                 // Normalize max similarity from -1 to 1 range to 0 to 1 range
                 themeMatchScore = (maxSimilarity + 1) / 2;
                 themeMatchScore = Math.max(0, Math.min(1, themeMatchScore)); // Ensure 0-1
             } else {
                 console.warn("No themes or poem embedding for theme matching.");
                 themeMatchScore = 0; // Ensure it's 0
             }

        } catch (e) {
             console.error("Error during sentiment/theme embedding or analysis:", e);
             // Ensure scores are 0 on error
             sentimentScore = 0;
             themeMatchScore = 0;
             // Dispose tensor if it was created before error
             if (sentimentThemeEmbeddingsTensor) {
                 sentimentThemeEmbeddingsTensor.dispose();
             }
        }


        // --- Cohesion Score (USE-based, Semantic Flow) ---
        let cohesionScore = 0; // Default to 0 if NLP not available or fails
        if (nlpAvailable && poemText.trim().length > 0) {
            try {
                 const nlpDoc = window.nlp(poemText);
                 const sentences = nlpDoc.sentences().out('array').filter(s => s.trim().length > 0); // Get sentences as array

                 if (sentences.length > 1) {
                     // FIX: Separate embed and array calls, add dispose
                     const sentenceEmbeddingsTensor = await useModel.embed(sentences);
                     const sentenceEmbeddings = await sentenceEmbeddingsTensor.array();
                     sentenceEmbeddingsTensor.dispose(); // Dispose the tensor

                     let totalSimilarity = 0;
                     let pairCount = 0;

                     for (let i = 0; i < sentenceEmbeddings.length - 1; i++) {
                         // Ensure sentence embeddings are valid before calculating similarity
                         if (sentenceEmbeddings[i] && sentenceEmbeddings[i+1] && sentenceEmbeddings[i].length > 0) {
                              const sim = cosineSimilarity(sentenceEmbeddings[i], sentenceEmbeddings[i+1]);
                              totalSimilarity += sim;
                              pairCount++;
                         } else {
                             console.warn(`Skipping similarity calculation for sentence pair ${i}-${i+1} due to invalid embeddings.`);
                         }
                     }

                     if (pairCount > 0) {
                         const averageSimilarity = totalSimilarity / pairCount;
                         // Normalize average similarity from -1 to 1 range to 0 to 1 range
                         cohesionScore = (averageSimilarity + 1) / 2;
                         cohesionScore = Math.max(0, Math.min(1, cohesionScore)); // Ensure 0-1
                     } else {
                         // If only one sentence or no valid pairs after filtering
                         console.warn("Not enough valid sentence pairs for cohesion calculation. Setting to neutral (0.5) if > 0 sentences, else 0.");
                         cohesionScore = sentences.length > 0 ? 0.5 : 0;
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
                 cohesionScore = 0; // Ensure it's 0 on error
            }
        } else if (poemText.trim().length > 0) {
             // If NLP is not available but text is not empty, warn user
             console.warn("Compromise NLP not available, Cohesion score will be 0.");
             cohesionScore = 0;
        }


        // --- Final Score Calculation ---
        // Adjusted Weights:
        // Word Diversity (Meaningful words): 20%
        // Structural Density (Former Grammar): 10%
        // Sentiment: 10%
        // Theme Match (USE-based): 30%
        // Cohesion (USE-based): 30%
        // Total: 20 + 10 + 10 + 30 + 30 = 100%

        const rawScore = (
            wordDiversityScore * 20 +
            structuralDensityScore * 10 +
            sentimentScore * 10 +
            themeMatchScore * 30 + // Now correctly scoped
            cohesionScore * 30
        );

        const score = Math.round(rawScore);

        // Return the structured result object
        return {
            score: Math.max(0, Math.min(100, score)), // Ensure score is between 0 and 100
            breakdown: {
                wordDiversity: Math.round(wordDiversityScore * 100),
                structuralDensity: Math.round(structuralDensityScore * 100),
                sentiment: Math.round(sentimentScore * 100),
                themeMatch: Math.round(themeMatchScore * 100), // Now correctly scoped
                cohesion: Math.round(cohesionScore * 100)
            }
        };
    }

    // UI-bound result renderer (now displays a popup dialog)
    // Expose to global scope if needed
    window.showPoemScore = function(score, breakdown) {
         // FIX: Check if breakdown is undefined before trying to access properties
         if (!breakdown) {
             console.error("showPoemScore called with undefined breakdown.");
             // Display a minimal error dialog or message instead
             let dialog = document.getElementById('poemScoreDialog');
              if (!dialog) {
                 dialog = document.createElement('div');
                 dialog.id = 'poemScoreDialog';
                 dialog.classList.add('poem-score-dialog');
                 document.body.appendChild(dialog);
              }
             dialog.innerHTML = '<h2>Error</h2><p>Could not retrieve poem breakdown.</p>';
             dialog.style.display = 'flex';
              requestAnimationFrame(() => { requestAnimationFrame(() => { dialog.classList.add('show'); }); });
             return; // Stop execution if breakdown is undefined
         }

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
            { label: '🏗️ Structural Density', value: breakdown.structuralDensity, title: 'Density of sentences, nouns, and verbs (Heuristic, relies on NLP parsing)' }, // Updated tooltip
            { label: '😊 Sentiment', value: breakdown.sentiment, title: 'Mood proximity towards positive/negative sentiment (Simple metric)' },
            { label: '💡 Theme Match', value: breakdown.themeMatch, title: 'Semantic similarity to common poetic themes (USE-based)' },
            { label: '🌊 Cohesion', value: breakdown.cohesion, title: 'Semantic flow/relatedness between adjacent sentences/lines (USE-based, relies on NLP parsing)' } // Updated tooltip
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
                 text-align: left; /* Align text left for readability */
                 border: 1px solid #ff69b4; /* Add a subtle border */
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
                 width: 100%; /* Ensure title is centered */
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
                 border: 1px solid #ff9cd0; /* Add a subtle border to items */
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

})(); // End of IIFE
