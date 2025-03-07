chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "detect-deepfake",
    title: "Detect Deepfake",
    contexts: ["image"]
  });

  chrome.contextMenus.create({
    id: "verify-fake-news",
    title: "Verify Fake News",
    contexts: ["selection"]
  });
});

const apiKey = "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";

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'detect-deepfake') {
    fetch(info.srcUrl)
      .then(response => response.blob())
      .then(blob => {
        const formData = new FormData();
        formData.append('file', blob);
        return fetch('http://127.0.0.1:8000/detect/', { method: 'POST', body: formData });
      })
      .then(response => response.json())
      .then(result => {
        const formattedResult = Object.entries(result)
          .map(([label, probability]) => `${label}: ${(probability * 100).toFixed(2)}%`)
          .join('<br>');
        chrome.tabs.sendMessage(tab.id, {
          action: 'showAnalysisResult',
          content: `<h2>Deepfake Detection Results:</h2><p>${formattedResult}</p>`
        });
      })
      .catch(error => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'showAnalysisResult',
          content: `<p>Error detecting deepfake: ${error.message}</p>`
        });
      });
  } else if (info.menuItemId === 'verify-fake-news') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showAnalysisResult',
      content: `<p>Verifying: "${info.selectionText}"...</p>`
    });

    // Call the API directly from background.js (or refactor this to content.js if you prefer)
    verifyClaimWithPerplexity(info.selectionText).then(result => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'showAnalysisResult',
        content: `<h2>Fake News Verification:</h2><p>${result}</p>`
      });
    }).catch(error => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'showAnalysisResult',
        content: `<p>Error verifying claim: ${error.message}</p>`
      });
    });
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

  return fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    .then(response => response.json())
    .then(data => data.choices[0]?.message?.content?.trim() || "No result returned.");
}

