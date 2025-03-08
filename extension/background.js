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
        const formattedResult = Object.entries(result)
          .map(
            ([label, probability]) =>
              `${label}: ${(probability * 100).toFixed(2)}%`
          )
          .join("<br>");
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: `<h2>Deepfake Detection Results:</h2><p>${formattedResult}</p>`,
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: `<p>Error detecting deepfake: ${error.message}</p>`,
        });
      });
  } else if (info.menuItemId === "verify-fake-news") {
    chrome.tabs.sendMessage(tab.id, {
      action: "showAnalysisResult",
      content: `<p>Verifying claim: "${info.selectionText}"...</p>`,
    });

    // Call the API directly from background.js (or refactor this to content.js if you prefer)
    verifyClaimWithPerplexity(info.selectionText)
      .then((result) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: `<h2>Verification of Claim:</h2><p>${result}</p>`,
        });
      })
      .catch((error) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "showAnalysisResult",
          content: `<p>Error verifying claim: ${error.message}</p>`,
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
      formattedContent = formattedContent.replace(/,\s*/g, "<br>");
      formattedContent = formattedContent.replace(
        /(https?:\/\/[^\s<>]+)/g,
        '• <a href="$1" target="_blank" style="color: #4da6ff; text-decoration: underline;">$1</a>'
      );

      return formattedContent;
    });
}
