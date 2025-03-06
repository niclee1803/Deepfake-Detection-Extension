//ignore this file, for testing purposes

const API_KEY = 'GOOGLE API KEY HERE';

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

    async function testCheckFact() {
        const verdict = await checkFact('The earth is flat');
        console.log('Verdict:', verdict);
      }
      
      testCheckFact();
      
