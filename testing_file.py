import requests, os
import base64

image_path = "/Users/Revue/Desktop/Revue/Incorrect/incorrect.jpg"
if os.path.exists(image_path):
    print("File Exists")
else:
    print("No file")
with open(image_path, 'rb') as f:
    img_base64 = base64.b64encode(f.read()).decode('utf-8')

response = requests.post('http://localhost:5000/ocr', json={'image': img_base64, 'model': 'ocr2'})
print(response.json())