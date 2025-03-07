chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "detect-deepfake",
    title: "Detect Deepfake",
    contexts: ["image"]
  });
});

// Handle right-click event and send image URL to content.js
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "detect-deepfake") {
    chrome.tabs.sendMessage(tab.id, { action: "detectDeepfake", imageUrl: info.srcUrl });
  }
});
