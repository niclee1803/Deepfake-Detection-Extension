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

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "detect-deepfake") {
    fetch(info.srcUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to fetch image: " + response.status);
        }
        return response.blob();
      })
      .then(blob => {
        console.log("blob received")
        const extension = blob.type.split("/")[1];
        const formData = new FormData();
        formData.append("file", blob, `image.${extension}`);
        return fetch("http://127.0.0.1:8000/detect/", {
          method: "POST",
          body: formData
        });
      })
      .then(response => response.json())
      .then(result => {
        console.log("Background: Received result from API:", result);
        chrome.tabs.sendMessage(tab.id, { action: "deepfakeResult", result: result });
      })
      .catch(error => {
        console.error("Deepfake detection error:", error);
      });
  } else if (info.menuItemId === "verify-fake-news") {
    chrome.tabs.sendMessage(tab.id, { action: "verifyFakeNews", selectedText: info.selectionText });
  }
});