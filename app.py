from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from pretrainedmodels import xception
from transformers import AutoModelForImageClassification, AutoImageProcessor, SiglipForImageClassification, ViTForImageClassification, ViTImageProcessor
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

# Load SigLIP model
siglip_model_name = "prithivMLmods/Deepfake-Real-Class-Siglip2"
siglip_model = SiglipForImageClassification.from_pretrained(siglip_model_name)
siglip_processor = AutoImageProcessor.from_pretrained(siglip_model_name, use_fast=True)

# Load Xception (PyTorch) model from local weights
xception_model = xception(num_classes=1000, pretrained=None)
local_weights = "xception-43020ad28.pth"
state_dict = torch.load(local_weights, map_location=torch.device('cpu'))

# Rename keys: change "fc.weight" and "fc.bias" to "last_linear.weight" and "last_linear.bias"
if 'fc.weight' in state_dict:
    state_dict['last_linear.weight'] = state_dict.pop('fc.weight')
if 'fc.bias' in state_dict:
    state_dict['last_linear.bias'] = state_dict.pop('fc.bias')

xception_model.load_state_dict(state_dict, strict=True)
# Replace the classifier layer for 2-class (real vs fake) output
xception_model.last_linear = nn.Linear(xception_model.last_linear.in_features, 2)
xception_model.eval()

# Xception preprocessing
xception_transform = transforms.Compose([
    transforms.Resize((299, 299)),
    transforms.ToTensor(),
    transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

# Load Deep-Fake-Detector-v2-Model
deepfake_detector_model = ViTForImageClassification.from_pretrained("prithivMLmods/Deep-Fake-Detector-v2-Model")
deepfake_detector_processor = ViTImageProcessor.from_pretrained("prithivMLmods/Deep-Fake-Detector-v2-Model", use_fast=True)

# SigLIP classifier
def classify_with_siglip(image_data):
    try:
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        inputs = siglip_processor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            outputs = siglip_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()
        
        labels = siglip_model.config.id2label
        predictions = {labels[i]: round(probs[i], 3) for i in range(len(probs))}
        return predictions
    except Exception as e:
        print(f"Error in SigLIP classification: {e}", flush=True)
        return {"error": str(e)}

# Xception classifier
def classify_with_xception(image_data):
    try:
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        image = xception_transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = xception_model(image)
            probs = torch.nn.functional.softmax(outputs, dim=1).squeeze().tolist()

        result = {
            "Real": round(probs[0], 3),
            "Fake": round(probs[1], 3)
        }
        return result
    except Exception as e:
        print(f"Error in Xception classification: {e}", flush=True)
        return {"error": str(e)}

# Deep-Fake-Detector-v2-Model classifier
def classify_with_deepfake_detector(image_data):
    try:
        print("Processing with Deep-Fake-Detector-v2-Model...", flush=True)
        
        # Load and preprocess the image
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        inputs = deepfake_detector_processor(images=image, return_tensors="pt")

        # Perform inference
        with torch.no_grad():
            outputs = deepfake_detector_model(**inputs)
            logits = outputs.logits
            predicted_class = torch.argmax(logits, dim=1).item()
            probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()

        # Map class indices to labels and create result dictionary
        result = {deepfake_detector_model.config.id2label[i]: round(probs[i], 3) 
                  for i in range(len(probs))}
        
        print(f"DeepfakeDetector result: {result}", flush=True)
        return result
    except Exception as e:
        print(f"Error in DeepfakeDetector classification: {e}", flush=True)
        return {"error": str(e)}
    
##################################################################
processor = AutoImageProcessor.from_pretrained("Organika/sdxl-detector")
model = AutoModelForImageClassification.from_pretrained("Organika/sdxl-detector")
def classify_with_sdxl_detector(image_data):
    try:
        # Load and preprocess the image
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        inputs = processor(images=image, return_tensors="pt")

        # Perform inference
        with torch.no_grad():
            outputs = deepfake_detector_model(**inputs)
            logits = outputs.logits
            probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()

        # Map class indices to labels and create result dictionary
        result = {model.config.id2label[i]: round(probs[i], 3) 
                for i in range(len(probs))}
        
        print(f"sdxl result: {result}", flush=True)
        return result
    except Exception as e:
        print(f"Error in sdxl classification: {e}", flush=True)
        return {"error": str(e)}
    
##################################################################
@app.post("/detect/")
async def detect_deepfake(file: UploadFile = File(...)):
    try:
        image_data = await file.read()
        print(f"DEBUG: Received file size: {len(image_data)}", flush=True)

        siglip_result = classify_with_siglip(image_data)
        print("SigLIP processing complete", flush=True)
        
        xception_result = classify_with_xception(image_data)
        print("Xception processing complete", flush=True)
        
        deepfake_detector_result = classify_with_deepfake_detector(image_data)
        print("DeepfakeDetector processing complete", flush=True)
        
        sdxl_result = classify_with_sdxl_detector(image_data)
        print("sdxl processing complete", flush=True)

        combined_result = {
            "SigLIP": siglip_result,
            "XceptionNet": xception_result,
            "DeepfakeDetectorV2": deepfake_detector_result,
            "sdxl": sdxl_result
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

if __name__ == "main":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)