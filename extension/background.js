chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "detect-deepfake",
    title: "Detect Deepfake",
    contexts: ["image"],
  });

  chrome.contextMenus.create({
    id: "verify-fake-news",
    title: "Verify Claim",
    contexts: ["selection"],
  });
});

const apiKey = "pplx-";

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "detect-deepfake") {
    // Show loading spinner for image detection
    chrome.tabs.sendMessage(tab.id, {
      action: "showAnalysisResult",
      content: `
        <p style="color: #fff !important;">Analysing image <span class="deepfake-extension-loading-circle"></span></p>
      `,
    });
    
    fetch(info.srcUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const formData = new FormData();
        formData.append("file", blob);
        return fetch("http://127.0.0.1:8000/detect/", {
          method: "POST",
          body: formData,
        });
      })
      .then((response) => response.json())
      .then((result) => {
        // Handle the combined result format
        let formattedResult = "<h2>Deepfake Detection Results</h2>";
        
        // Process each model in the combined result
        for (const [modelName, predictions] of Object.entries(result)) {
          formattedResult += `<h3>${modelName} Results:</h3>`;
          
          // Handle different model output formats
          if (modelName === 'sdxl' || (typeof predictions === 'object' && !Array.isArray(predictions) && predictions !== null && !predictions[0])) {
            formattedResult += "<p>";
            for (const [label, probability] of Object.entries(predictions)) {
              formattedResult += `${label}: ${(probability * 100).toFixed(2)}%<br>`;
            }
            formattedResult += "</p>";
          } else if (modelName === 'flux' || (Array.isArray(predictions) && predictions.length === 2)) {
            const [prob, classification] = predictions;
            formattedResult += `<p>Classification: ${classification}<br>Probability Real: ${(prob * 100).toFixed(2)}%</p>`;
          } else {
            formattedResult += `<p>Classification: ${predictions}</p>`;
          }
        }
        
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: formattedResult
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: `<h2>Error</h2><p style="color: #ff6b6b !important;">Failed to detect deepfake: ${error.message}</p>`,
        });
      });
  } else if (info.menuItemId === "verify-fake-news") {
    // Show loading spinner for claim verification
    chrome.tabs.sendMessage(tab.id, {
      action: "showAnalysisResult",
      content: `
        <p style="color: #fff !important;">Verifying claim: "${info.selectionText.substring(0, 100)}${info.selectionText.length > 100 ? '...' : ''}" <span class="deepfake-extension-loading-circle"></span></p>
      `,
    });

    // Call the API directly from background.js
    verifyClaimWithPerplexity(info.selectionText)
      .then((result) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: `<h2>Verification Results</h2>${result}<br>`,
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: `<h2>Error</h2><p style="color: #ff6b6b !important;">Failed to verify claim: ${error.message}</p>`,
        });
      });
  }
});

function verifyClaimWithPerplexity(query) {
  const apiUrl = "https://api.perplexity.ai/chat/completions";

  const prompt = `
Fact-check the following claim:

"${query}"

Return output in this format:
VERDICT: [TRUE/FALSE/PARTIALLY TRUE/MISLEADING/UNVERIFIABLE]
CONFIDENCE: [HIGH/MEDIUM/LOW]
REASONING: [Max 100 words, evidence-based explanation]
SOURCES: [Max 2 URLs in plaintext format]

Definitions:
- TRUE: Supported by strong evidence.
- FALSE: Contradicted by credible sources.
- PARTIALLY TRUE: Some accuracy, but missing context.
- MISLEADING: Technically true, but distorts meaning.
- UNVERIFIABLE: Insufficient reliable evidence.

Be neutral, objective, and rely only on verifiable facts.
`;

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a fact-checking AI. Provide concise, unbiased assessments with credible sources.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      const content =
        data.choices[0]?.message?.content?.trim() || "No result returned.";

      let formattedContent = content
        .replace(/VERDICT:/g, "<strong>VERDICT:</strong>")
        .replace(/CONFIDENCE:/g, "<br><br><strong>CONFIDENCE:</strong>")
        .replace(/REASONING:/g, "<br><br><strong>REASONING:</strong>")
        .replace(/SOURCES:/g, "<br><br><strong>SOURCES:</strong><br>");
      
      formattedContent = formattedContent.replace(
        /(https?:\/\/[^\s<>]+)/g,
        (match) => match.replace(/,\s*/g, "<br>") 
      );
      
      formattedContent = formattedContent.replace(
        /(https?:\/\/[^\s<>]+)/g,
        '<a href="$1" target="_blank" style="color: #4da6ff !important; text-decoration: underline !important;">$1</a><br>'
      );

      return formattedContent;
    });
}