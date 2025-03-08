from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from pretrainedmodels import xception
from transformers import AutoImageProcessor, SiglipForImageClassification, ViTForImageClassification, ViTImageProcessor
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
siglip_processor = AutoImageProcessor.from_pretrained(siglip_model_name)

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
model = ViTForImageClassification.from_pretrained("prithivMLmods/Deep-Fake-Detector-v2-Model")
processor = ViTImageProcessor.from_pretrained("prithivMLmods/Deep-Fake-Detector-v2-Model")

# SigLIP classifier
def classify_with_siglip(image_data):
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    inputs = siglip_processor(images=image, return_tensors="pt")
    
    with torch.no_grad():
        outputs = siglip_model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()
    
    labels = siglip_model.config.id2label
    predictions = {labels[i]: round(probs[i], 3) for i in range(len(probs))}
    return predictions


# Xception classifier
def classify_with_xception(image_data):
    print("lmaop")
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


# Deep-Fake-Detector-v2-Model
def classify_with_deepfakedetectorv2(image_data):
    print("DEBUG: Calling classify_with_deepfakedetectorv2()...")

    # Load and preprocess the image
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    # Perform inference
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        predicted_class = torch.argmax(logits, dim=1).item()

    # Map class index to label
    label = model.config.id2label[predicted_class]
    return label


@app.post("/detect/")
async def detect_deepfake(file: UploadFile = File(...)):
    image_data = await file.read()
    print("DEBUG: Received file size:", len(image_data))

    siglip_result = classify_with_siglip(image_data)
    xception_result = classify_with_xception(image_data)
    deepfakeDetectorV2_result = classify_with_deepfakedetectorv2(image_data)

    combined_result = {
        "SigLIP": siglip_result,
        "XceptionNet": xception_result,
        "DeepfakeDetectorV2": deepfakeDetectorV2_result
    }

    print(combined_result)
    return combined_result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
