const API_KEY = "";
const GOOGLE_CUSTOM_SEARCH_API_KEY = "";
const CX = "221e99964660845fb"; // Google custom search engine ID (not secret)

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "detectDeepfake") {
    detectDeepfake(message.imageUrl);
  } else if (message.action === "verifyFakeNews") {
    googleCustomSearch(message.selectedText);
  }
});

// Your deepfake detection logic goes here
function detectDeepfake(imageUrl) {
  console.log("Analyzing image for deepfake:", imageUrl);
  alert("Deepfake analysis initiated for: " + imageUrl);

  // TODO: Add your deepfake detection logic here (API calls, processing, etc.)
}

//Function takes in a query and returns the fact check result
//Must use await because async
//Usage Example
//Const verdict = await checkFact("Covid-19 is a hoax")


//Put in the image caption as the query
//Returns "No fact check found" if no fact check is found
//Returns "Error fetching fact check" if there is an error
//Returns Verdict: Can be False or True
function checkFact(query) {
  const apiUrl = `https://factchecktools.googleapis.com/v1alpha1/claims:search?key=${API_KEY}&query=${encodeURIComponent(query)}&languageCode=en-US`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      let result;
      if (data.claims && data.claims.length > 0) {
        const firstClaim = data.claims[0];
        const firstReview = firstClaim.claimReview[0];
        const verdict = firstReview.textualRating;
        result = `Fact check result: ${verdict}`;
      } else {
        result = 'No fact check found';
      }
      console.log(result);
      alert(result);
    })
    .catch(error => {
      console.error('Error fetching fact check:', error);
      alert('Error fetching fact check');
    });
}

// Function for Google Custom Search
function googleCustomSearch(query) {
  // Set num=5 to request 5 results
  const apiUrl = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${CX}&key=${GOOGLE_CUSTOM_SEARCH_API_KEY}&num=5`;
  
  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.items && data.items.length > 0) {
        // Create a text representation of all results
        let resultsText = `Query: "${query}"\n\nFact Check Results:\n\n`;
        
        // Process each result
        data.items.forEach((item, index) => {
          resultsText += `Result ${index + 1}:\n`;
          resultsText += `Title: ${item.title}\n`;
          resultsText += `Source: ${item.displayLink}\n`;
          resultsText += `Link: ${item.link}\n`;
          
          // Add snippet if available
          if (item.snippet) {
            resultsText += `Summary: ${item.snippet}\n`;
          }
          
          // Add page content if available
          if (item.pagemap && item.pagemap.metatags && item.pagemap.metatags[0]) {
            if (item.pagemap.metatags[0]['og:description']) {
              resultsText += `Description: ${item.pagemap.metatags[0]['og:description']}\n`;
            }
          }
          
          resultsText += '\n---\n\n';
        });
        
        console.log(resultsText);
        
        // You can send this text to your LLM for reasoning
        // sendToLLM(resultsText);
        
        // For testing, just show a truncated version in the alert
        alert(`Found ${data.items.length} results. Check console for full text.`);
      } else {
        const result = 'No results found.';
        console.log(result);
        alert(result);
      }
    })
    .catch(error => {
      console.error('Error fetching custom search results:', error);
      alert('Error fetching search results');
    });
}