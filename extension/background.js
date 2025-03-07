chrome.runtime.onInstalled.addListener(() => {
  // Check deepfake image
  chrome.contextMenus.create({
    id: "detect-deepfake",
    title: "Detect Deepfake",
    contexts: ["image"]
  });

  // Detect fake news
  chrome.contextMenus.create({
    id: "verify-fake-news",
    title: "Verify Fake News",
    contexts: ["selection"]
  });
});

// Handle right-click event and send image URL to content.js
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "detect-deepfake") {
    fetch(info.srcUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok: " + response.status);
        }
        console.log("Image fetched successfully");
        return response.blob();
      })
      .then(blob => {
        chrome.tabs.sendMessage(tab.id, { action: "detectDeepfake", blob: blob });
      })
      .catch(error => {
        console.error("Error fetching image blob:", error);
        chrome.tabs.sendMessage(tab.id, { action: "error", message: error.message });
      });
  } else if (info.menuItemId === "verify-fake-news") {
    chrome.tabs.sendMessage(tab.id, { action: "verifyFakeNews", selectedText: info.selectionText });
  }
});
