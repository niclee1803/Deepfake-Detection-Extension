function detectDeepfake(imageUrl) {
  console.log("Analyzing image for deepfake:", imageUrl);
  // Implement your deepfake detection logic here
  alert("Deepfake analysis initiated for: " + imageUrl);
}


const API_KEY = 'YOUR_GOOGLE_API_KEY';

//Function takes in a query and returns the fact check result
//Usage example checkFact("COVID-19 is a hoax")
//Put in the image caption as the query
//Returns "No fact check found" if no fact check is found
//Returns "Error fetching fact check" if there is an error
//Returns Verdict: Can be False or True
function checkFact(query) {
  const apiUrl = `https://factchecktools.googleapis.com/v1alpha1/claims:search?key=${API_KEY}&query=${encodeURIComponent(query)}&languageCode=en-US`;

  return fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      if (data.claims && data.claims.length > 0) {
        const firstClaim = data.claims[0];
        const firstReview = firstClaim.claimReview[0];
        const verdict = firstReview.textualRating;

        return verdict;
      } else {
        return 'No fact check found';
      }
    })
    .catch(error => {
      console.error('Error fetching fact check:', error);
      return 'Error fetching fact check';
    });
}
