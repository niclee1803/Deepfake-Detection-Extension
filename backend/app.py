from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
from torchvision import models, transforms
from transformers import AutoModelForImageClassification, AutoImageProcessor, ViTImageProcessor
from PIL import Image
import io
    
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#########################################################################################################
# SDXL Detector
#########################################################################################################
sdxl_model = AutoModelForImageClassification.from_pretrained("Organika/sdxl-detector")
sdxl_processor = AutoImageProcessor.from_pretrained("Organika/sdxl-detector", use_fast=True)
def classify_with_sdxl_detector(image_data):
    try:
        # Load and preprocess the image
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        inputs = sdxl_processor(images=image, return_tensors="pt")
        
        # Perform inference
        with torch.no_grad():
            outputs = sdxl_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()

        # Map class indices to labels
        id2label = {0: "AI Generated", 1: "Real"}
        result = {
            "Classification": id2label[probs.index(max(probs))],  # Get predicted label
            "Probability Real": round(probs[1], 3)
        }
        
        print(f"sdxl result: {result}", flush=True)
        return result
    except Exception as e:
        print(f"Error in sdxl classification: {e}", flush=True)
        return {"error": str(e)}
    
#########################################################################################################
# MidJourneyV6 + SDXL Detector
#########################################################################################################
mjv6_sdxl_model = AutoModelForImageClassification.from_pretrained("ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL")
mjv6_sdxl_feature_extractor = ViTImageProcessor.from_pretrained("ideepankarsharma2003/AI_ImageClassification_MidjourneyV6_SDXL")
def classify_with_mjV6_sdxl_detector(image_data):
    try:
        # Load and preprocess the image
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        inputs = mjv6_sdxl_feature_extractor(images=image, return_tensors="pt")

        # Perform inference
        with torch.no_grad():
            outputs = mjv6_sdxl_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=1)
            real_prob = probs[0, 1].item()
            predicted_label = logits.argmax(-1).item()

        id2label = {0: "AI Generated", 1: "Real"}
        print("Predicted label:", id2label[predicted_label], "Probability Real:", real_prob)
        return real_prob, id2label[predicted_label]
    except Exception as e:
        print(f"Error in mjv6_sdxl classification: {e}", flush=True)
        return {"error": str(e)}
    
#########################################################################################################
# Flux Detector
########################################################################################################
def classify_with_flux_detector(image_data):
    def load_model(model_path, device):
        """Loads the TorchScript model."""
        model = torch.jit.load(model_path, map_location=device)
        model.to(device).eval()
        return model
    def preprocess_image(image_data):
        """Pre-processes the image for feeding into the model."""
        IMG_SIZE = 1024
        transform = transforms.Compose([
            transforms.Resize(IMG_SIZE + 32),
            transforms.CenterCrop(IMG_SIZE),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        return transform(img).unsqueeze(0)
    def predict(model, image_tensor, device, threshold=0.5):
        """Performs model prediction."""
        with torch.no_grad():
            outputs = model(image_tensor.to(device))
            prob = torch.sigmoid(outputs).item()
        label = "Real" if prob >= threshold else "AI Generated"
        return prob, label
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = load_model("fluxmodel.pt", device)
    image_tensor = preprocess_image(image_data)
    prob, label = predict(model, image_tensor, device)
    print(f"Model Prediction: {prob:.4f} -> {label}")
    return prob, label

#########################################################################################################
# FastAPI Routes
#########################################################################################################
@app.post("/detect/")
async def detect_deepfake(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        print(f"DEBUG: Received file size: {len(image_data)}", flush=True)
        
        sdxl_result = classify_with_sdxl_detector(image_data)
        print("sdxl processing complete", flush=True)
        
        mjv6_sdxl_result = classify_with_mjV6_sdxl_detector(image_data)
        print("mjv6_sdxl processing complete", flush=True)
        
        flux_result = classify_with_flux_detector(image_data)
        print("flux processing complete", flush=True)

        combined_result = {
            "Image generated by Stable Diffusion?": sdxl_result,
            "Image generated by MidJourneyV6 or Stable Diffusion?": mjv6_sdxl_result,
            "Image generated by Flux?": flux_result
        }

        print(f"Combined result: {combined_result}", flush=True)
        return combined_result
    except Exception as e:
        import traceback
        print(f"ERROR in endpoint: {str(e)}", flush=True)
        print(traceback.format_exc(), flush=True)
        return {"error": str(e)}

@app.get("/health/")
async def health_check():
    return {"status": "healthy"}

# Run the app locally (on port 8080)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)