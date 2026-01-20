from flask import Flask, request, jsonify
import numpy as np
import cv2
import base64
import paddle
from paddleocr import PaddleOCR

app = Flask(__name__)

def check_gpu_status():
    """Check and print GPU availability status"""
    print("=" * 50)
    print("GPU STATUS CHECK")
    print("=" * 50)
    print(f"PaddlePaddle version: {paddle.__version__}")
    print(f"CUDA compiled: {paddle.is_compiled_with_cuda()}")
    
    if paddle.is_compiled_with_cuda():
        gpu_count = paddle.device.cuda.device_count()
        print(f"GPU count: {gpu_count}")
        if gpu_count > 0:
            print(f"GPU is AVAILABLE and will be USED")
            # Set device to GPU
            paddle.set_device('gpu:0')
        else:
            print("WARNING: CUDA compiled but no GPU detected!")
            paddle.set_device('cpu')
    else:
        print("Running on CPU (no CUDA support)")
        paddle.set_device('cpu')
    
    print(f"Current device: {paddle.get_device()}")
    print("=" * 50)


ocr_models = {}

def get_ocr(img, model):
    """
    Input: img, model type
    Output: OCR result
    Purpose: To call the OCR(older version), OCR2(v5)
    """
    
    if model not in ocr_models:
        if model == "ocr":
            ocr_models[model] = PaddleOCR(
                use_angle_cls=True,
                lang='en',
                det_db_score_mode='slow',
                rec_image_shape='3,48,320',
                det_db_box_thresh=0.3,
                det_db_unclip_ratio=1.5,
                det_limit_side_len=1280,
                use_dilation=True,
                show_log=False
            )
        elif model == "ocr2":
            ocr_models[model] = PaddleOCR(
                text_detection_model_name="PP-OCRv5_server_det",
                text_recognition_model_name="PP-OCRv5_server_rec",
                use_angle_cls=True,
                use_dilation=True,
                use_doc_orientation_classify=True,
                use_doc_unwarping=True,
                use_textline_orientation=True,
                det_db_score_mode='slow',
                det_db_box_thresh=0.1,
                det_db_unclip_ratio=1.8,
                det_limit_side_len=2560,
                rec_image_shape='3,96,960',
                rec_batch_num=1,
                det_batch_num=1,
                use_pdserving=False,
                use_tensorrt=False,
                cls_batch_num=1,
                cls_thresh=0.9,
                show_log=False
            )
    
    ocr = ocr_models[model]
    result = ocr.ocr(img, cls=True)
    return result

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "PaddleOCR API is running"})

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "paddle_version": paddle.__version__,
        "cuda_available": paddle.is_compiled_with_cuda(),
        "gpu_count": paddle.device.cuda.device_count() if paddle.is_compiled_with_cuda() else 0,
        "current_device": paddle.get_device()
    })

@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    try:
        if 'image' in request.files:        
            file = request.files['image']
            model = request.form.get('model','ocr')
            img_bytes = file.read()
        elif request.is_json:
            image_data = request.json.get("image")
            model = request.json.get('model', 'ocr')
            img_bytes = base64.b64decode(image_data)
        else:
            return jsonify({"error": "No Image Provided"}), 400
        
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        result = get_ocr(img, model)
        
        return jsonify({"result": result}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Check GPU status at startup
    check_gpu_status()
    
    print("\nStarting PaddleOCR API server...")
    print("Endpoints:")
    print("  GET  /        - Server info")
    print("  GET  /health  - Health check with GPU info")
    print("  POST /ocr     - OCR processing")
    print()
    
    app.run(host='0.0.0.0', port=5000)