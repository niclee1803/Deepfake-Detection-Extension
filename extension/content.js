chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "deepfakeResult") {
    let resultMessage = "Deepfake detection results:\n";
    for (const label in message.result) {
      const probability = (message.result[label] * 100).toFixed(2);
      resultMessage += `${label}: ${probability}%\n`;
    }
    alert(resultMessage);
  } else if (message.action === "verifyFakeNews") {
    verifyClaimWithPerplexity(message.selectedText);
  }
});

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
