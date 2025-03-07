chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "detectDeepfake") {
    detectDeepfake(message.blob);
  } else if (message.action === "verifyFakeNews") {
    verifyClaimWithPerplexity(message.selectedText);
  }
});

function detectDeepfake(imageBlob) {
  console.log("Analyzing image for deepfake:");

    // Use the received blob directly
    const blob = imageBlob;
    const formData = new FormData();
    formData.append("file", blob, "image.jpg");

    // Send the formData to your FastAPI backend
    fetch("http://127.0.0.1:8000/detect/", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(data => {
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
};




// function checkFact(query) {
//   const apiUrl = `https://factchecktools.googleapis.com/v1alpha1/claims:search?key=${API_KEY}&query=${encodeURIComponent(query)}&languageCode=en-US`;

//   fetch(apiUrl)
//     .then(response => response.json())
//     .then(data => {
//       let result;
//       if (data.claims && data.claims.length > 0) {
//         const firstClaim = data.claims[0];
//         const firstReview = firstClaim.claimReview[0];
//         const verdict = firstReview.textualRating;
//         result = `Fact check result: ${verdict}`;
//       } else {
//         result = 'No fact check found';
//       }
//       console.log(result);
//       alert(result);
//     })
//     .catch(error => {
//       console.error('Error fetching fact check:', error);
//       alert('Error fetching fact check');
//     });
// }


// function verifyClaimWithGemini(query) {
//   // Here, we skip the Google Custom Search API and go straight to the LLM (e.g., Gemini)
//   const prompt = `
// You are a fact-checking assistant. Based on the following claim, determine if it is True, False, Inaccurate, or Cannot Get (if there's not enough information).

// Claim: "${query}"

// Search results from trusted fact-checking sources:
// 1. Reuters: "Reuters fact-checked article"
// 2. Snopes: "Snopes fact-checking article"
// 3. FactCheck.org: "FactCheck.org result"

// or any reliable fact-checking source.

// Please provide your verdict and reasoning in the following format only:
// Verdict: [True/False/Inaccurate/Cannot get]
// Reasoning: [Detailed reasoning based on the search results]
// Link to source: [Optional: URL to the fact-checking article]
// `;

//   // Endpoint for Gemini (or similar LLM endpoint)
//   const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

//   fetch(`${geminiEndpoint}?key=${GEMINI_API_KEY}`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       contents: [
//         {
//           parts: [
//             {
//               text: prompt
//             }
//           ]
//         }
//       ]
//     })
//   })
//   .then(response => {
//     console.log("Status code:", response.status);
//     if (!response.ok) {
//       return response.text().then(text => {
//         throw new Error(`HTTP error! Status: ${response.status}, Response: ${text}`);
//       });
//     }
//     return response.json();
//   })
//   .then(data => {
//     console.log("Gemini response:", data);

//     // Extract the text from the response based on the structure we observed
//     let geminiResponse = "";
//     try {
//       if (data.candidates && data.candidates[0] && data.candidates[0].content) {
//         geminiResponse = data.candidates[0].content.parts[0].text || "";
//       }
//     } catch (e) {
//       console.error("Error parsing Gemini response:", e);
//       geminiResponse = "";
//     }

//     if (!geminiResponse) {
//       throw new Error("Could not extract text from Gemini response");
//     }

//     // Parse the response to get verdict and reasoning
//     let verdict = "Cannot get";
//     let reasoning = "Could not determine the accuracy of this claim.";

//     const verdictMatch = geminiResponse.match(/Verdict:\s*(True|False|Inaccurate|Cannot get)/i);
//     if (verdictMatch) {
//       verdict = verdictMatch[1];
//     }

//     const reasoningMatch = geminiResponse.match(/Reasoning:\s*([\s\S]+)$/i);
//     if (reasoningMatch) {
//       reasoning = reasoningMatch[1].trim();
//     }

//     // Show the results in a simple alert
//     const resultText = `Result: ${verdict}\nReasoning: ${reasoning}`;
//     alert(resultText);

//     // Also log to console for debugging
//     console.log("Fact Check Results:", {
//       verdict: verdict,
//       reasoning: reasoning
//     });
//   })
//   .catch(error => {
//     console.error("Error with Gemini analysis:", error);
//     alert(`Error: ${error.message}`);
//   });
// }

function verifyClaimWithPerplexity(query) {
  const apiUrl = 'https://api.perplexity.ai/chat/completions';  
  

  const prompt = `
You are a fact-checking assistant. Based on the following claim, determine if it is True, False, Inaccurate, or Cannot Get (if there's not enough information).

Claim: "${query}"

Search results from trusted fact-checking sources

Please provide your verdict and reasoning in the following format only:
Verdict: [True/False/Inaccurate/Cannot get]
Reasoning: [Detailed reasoning based on the search results]
Link to source: [Optional: URL to the fact-checking article]
`;

  fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user", content: prompt }
      ]
    }),
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw new Error(err.message || "Failed to connect to Perplexity API"); });
    }
    return response.json();
  })
  .then(data => {
    let resultText = "No result returned.";
    if (data && data.choices && data.choices.length > 0) {
      resultText = data.choices[0].message.content.trim();
    }

    // Show result in an alert
    alert(resultText);
  })
  .catch(error => {
    console.error("Error verifying the claim:", error);
    alert(`Error: ${error.message}`);
  });
}
