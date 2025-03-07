const API_KEY = "";

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "detectDeepfake") {
    detectDeepfake(message.imageUrl);
  } else if (message.action === "verifyFakeNews") {
    checkFact(message.selectedText);
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