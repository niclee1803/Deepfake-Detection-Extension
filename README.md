# VerifyAI Chrome Extension
![Alt text](https://github.com/niclee1803/deepfake-detection-extension/blob/main/path/to/screenshot.png?raw=true)

## About
With our Chrome extension, you can verify information online in just a few clicks, without even needing to leave your tab.
* Verify Text Claims: Highlight text, right-click, and select "Verify Claim" to see a verdict, confidence level, reasoning, and links to the sources it used.
* Detect Deepfakes: Right-click on an image and select "Detect Deepfake" to view the likelihood of it being AI-generated using multiple techniques.

## How to use
1. Clone repository
``` bash
git clone
```

2. Put in Perplexity API key in background.js (include link here later) file
``` javascript
const apiKey = "<PERPLEXITY_API_KEY>";
```

3. Open Chrome -> Extensions. Make sure developer mode is enabled (top-right)
   
4. Load unpacked the "extension" directory.

5. Right click on any highlighted text/image. You should see a "Verify Claim"/"Detect Deepfake" option in the menu.

## Tools used
* Javascript, HTML, CSS for frontend
* Perplexity sonar model for fact checking
* 

## Sources for our models
