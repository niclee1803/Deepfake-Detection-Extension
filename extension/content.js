const API_KEY = "";
const GOOGLE_CUSTOM_SEARCH_API_KEY = "";
const CX = "221e99964660845fb"; // Google custom search engine ID (not secret)

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "detectDeepfake") {
    detectDeepfake(message.imageUrl);
  } else if (message.action === "verifyFakeNews") {
    googleCustomSearch(message.selectedText);
  }
});

function detectDeepfake(imageUrl) {
  console.log("Analyzing image for deepfake:", imageUrl);

  // Fetch the image data as a blob
  fetch(imageUrl)
    .then(response => response.blob())
    .then(blob => {
      // Prepare the FormData with the image blob
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      // Make the POST request to your FastAPI backend
      return fetch("http://127.0.0.1:8000/detect/", {
        method: "POST",
        body: formData
      });
    })
    .then(response => response.json())
    .then(data => {
      // Example response: { "Real": 0.92, "Fake": 0.08 }
      let resultMessage = "Deepfake detection results:\n";
      for (const label in data) {
        const probability = (data[label] * 100).toFixed(2);
        resultMessage += `${label}: ${probability}%\n`;
      }
      alert(resultMessage);
    })
    .catch(error => {
      console.error("Error in deepfake detection:", error);
      alert("Error processing the image.");
    });
}


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