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
    chrome.tabs.sendMessage(tab.id, { action: "detectDeepfake", imageUrl: info.srcUrl });
  } else if (info.menuItemId === "verify-fake-news") {
    chrome.tabs.sendMessage(tab.id, { action: "verifyFakeNews", selectedText: info.selectionText });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchImageBlob") {
    fetch(message.imageUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.blob();
      })
      .then(blob => {
        // Send the blob directly to the content script
        sendResponse({ blobData: blob });
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    return true; // Keep the messaging channel open for asynchronous response.
  }
});
