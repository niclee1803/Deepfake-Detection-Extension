from fastapi import FastAPI, File, UploadFile
import torch
from transformers import AutoImageProcessor, SiglipForImageClassification
from PIL import Image
import io

app = FastAPI()

# Load model and processor
model_name = "prithivMLmods/Deepfake-Real-Class-Siglip2"
model = SiglipForImageClassification.from_pretrained(model_name)
processor = AutoImageProcessor.from_pretrained(model_name)

def classify_image(image):
    """Classifies an image as Fake or Real."""
    image = Image.open(io.BytesIO(image)).convert("RGB")
    inputs = processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.nn.functional.softmax(logits, dim=1).squeeze().tolist()

    labels = model.config.id2label
    return {labels[i]: round(probs[i], 3) for i in range(len(probs))}

@app.post("/detect/")
async def detect_deepfake(file: UploadFile = File(...)):
    image_data = await file.read()
    result = classify_image(image_data)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
