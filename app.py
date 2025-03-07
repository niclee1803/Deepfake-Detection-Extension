from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import torch
from transformers import AutoImageProcessor, SiglipForImageClassification
from PIL import Image
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For testing. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and processor
model_name = "prithivMLmods/Deepfake-Real-Class-Siglip2"
model = SiglipForImageClassification.from_pretrained(model_name)
processor = AutoImageProcessor.from_pretrained(model_name)

def classify_image(image_data):
    """Classifies an image as Fake or Real."""
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")
    
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()
    
    labels = model.config.id2label
    predictions = {labels[i]: round(probs[i], 3) for i in range(len(probs))}
    
    return predictions

@app.post("/detect/")
async def detect_deepfake(file: UploadFile = File(...)):
    image_data = await file.read()
    print("DEBUG: Received file size:", len(image_data))
    result = classify_image(image_data)
    print(result)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
