chrome.runtime.onInstalled.addListener(() => {
  // Create a context menu item to detect deepfake images
  chrome.contextMenus.create({
    id: "detect-deepfake",
    title: "Detect Deepfake Image",
    contexts: ["image"]
  });
});

// Add the detectDeepfake function definition
function detectDeepfake(imageUrl) {
  // This function will be executed in the context of the page
  console.log("Analyzing image for deepfake: ", imageUrl);
  // Implement your deepfake detection logic here
  // You might want to send this to a server or use a local model
  
  // For now, just show an alert as placeholder
  alert("Deepfake analysis initiated for: " + imageUrl);
}

// Fix: Use the correct event listener for context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "detect-deepfake") {
    // Send the image URL to the content script for deepfake detection
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: detectDeepfake, // Fix: Use 'function' instead of 'func' for Manifest V3
      args: [info.srcUrl] // Pass the image URL to the function
    });
  }
});