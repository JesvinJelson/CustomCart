from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import FileResponse
import uvicorn
import json
import urllib.request
import base64
import io
from PIL import Image
import websocket
import os
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
server_address = "http://127.0.0.1:8188/"  # ComfyUI server

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_workflow(product_id: str):
    with open(f"COMFY{product_id}.json", "r") as file:
        return json.load(file)

def encode_image(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode('utf-8')

def queue_prompt(workflow):
    data = json.dumps({"prompt": workflow}).encode('utf-8')
    req = urllib.request.Request(
        f"{server_address}prompt",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    return json.loads(urllib.request.urlopen(req).read())

def get_result(prompt_id: str) -> Image.Image:
    ws = websocket.WebSocket()
    ws.connect(f"{server_address.replace('http', 'ws')}ws")
    
    while True:
        message = ws.recv()
        if isinstance(message, str):
            data = json.loads(message)
            if data['type'] == 'executing' and data['data']['prompt_id'] == prompt_id:
                break
        elif isinstance(message, bytes):
            return Image.open(io.BytesIO(message[8:]))
    ws.close()

@app.post("/upload/")
async def process_image(file: UploadFile = File(...), productId: str = Form(...)):
    # Save uploaded image
    input_image = await file.read()
    with open("upload.jpg", "wb") as f:
        f.write(input_image)

    # Load workflow and update with image
    workflow = load_workflow(productId)
    workflow["25"]["inputs"]["image"] = encode_image(input_image)
    
    # Process with ComfyUI
    response = queue_prompt(workflow)
    result_image = get_result(response['prompt_id'])
    
    # Save processed image
    result_image.save("generated_image.png", "PNG")
    return {"image_url": "http://localhost:8001/generated_image.png"}

@app.get("/generated_image.png")
async def get_processed_image():
    if os.path.exists("generated_image.png"):
        return FileResponse("generated_image.png")
    return {"error": "Image not found"}, 404

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)