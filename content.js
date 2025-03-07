const API_KEY = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "detectDeepfake") {
    detectDeepfake(message.imageUrl);
  } else if (message.action === "verifyFakeNews") {
    checkFact(message.selectedText);
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