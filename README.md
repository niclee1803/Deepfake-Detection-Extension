# VerifyAI Chrome Extension
<p align="center">
  <img src="screenshot3.png?raw=true" height="500" width="750" alt="sample" />
  <br />
  <em>Context menu</em>
</p>

<p align="center">
  <img src="screenshot.png?raw=true" height="500" width="750" alt="sample" />
  <br />
  <em>Fake news detection feature</em>
</p>

<p align="center">
  <img src="screenshot2.png?raw=true" height="500" width="750" alt="sample" />
  <br />
  <em>Deepfake detection feature</em>
</p>



## About
With our Chrome extension, you can verify information online in just a few clicks, without even needing to leave your tab.
* **Verify Text Claims:** Highlight text, right-click, and select "Verify Claim" to see a verdict, confidence level, reasoning and links to sources. This feature is powered by Perplexity AI.
* **Detect Deepfakes:** Right-click on an image and select "Detect Deepfake" to view the likelihood of it being AI-generated using multiple techniques. This feature is powered by open-source models readily available on Hugging Face.

**Limitations:** It is important to note that AI detection is not correct 100% of the time, and due diligence is still required by the user. This is especially the case for the deepfake detection function, whose models are trained on specific datasets. While they may detect images generated by Stable Diffusion, MidJourneyV6 or Flux with a high accuracy, images generated through other models may not be flagged.

## How to use
1. Clone repository
``` bash
git clone
```

2. Put in Perplexity API key in the background.js file
``` javascript
const apiKey = "<PERPLEXITY_API_KEY>";
```

3. Open Chrome -> Manage Extensions. Make sure developer mode is enabled.
   
4. Load unpacked the "extension" directory.

5. Right click on any highlighted text/image. You should see a "Verify Claim"/"Detect Deepfake" option in the menu.

## Tools used
* Javascript, HTML, CSS for frontend
* Python, FastAPI for backend
* PyTorch library for deepfake detection models
* Docker for containerisation
* Google Cloud Run for deployment

## Sources
* [sonar by Perplexity](https://sonar.perplexity.ai/) model for fact checking
* [flux-detector by LukasT9](https://huggingface.co/LukasT9/flux-detector) for deepfake detection
* [AI_ImageClassification_MidjourneyV6_SDXL by ideepankarsharma2003](https://huggingface.co/ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL) for deepfake detection
* [sdxl-detector by Organika](https://huggingface.co/Organika/sdxl-detector) for deepfake detection
