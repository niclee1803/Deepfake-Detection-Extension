const API_KEY = '-GOOGLE API KEY HERE';

function detectDeepfake(imageUrl, captionText) {
  checkImage(imageUrl);        // Use deepfake detection here.
  checkFact(captionText);      // Use Google Fact Check API on the caption.
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
