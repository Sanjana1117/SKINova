import io
import logging
from PIL import Image

logger = logging.getLogger(__name__)


async def extract_text_from_image(image_bytes: bytes) -> str:
    try:
        import easyocr

        reader = easyocr.Reader(["en"], gpu=False)

        # 🔥 FIX: convert bytes → PIL → numpy
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image_np = np.array(image)

        results = reader.readtext(image_np, detail=0)

        return " ".join(results)

    except ImportError:
        pass

    try:
        import pytesseract

        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)

        return text.strip()

    except ImportError:
        logger.error("Neither easyocr nor pytesseract is available")
        raise RuntimeError("OCR library not installed. Install easyocr or pytesseract.")


    