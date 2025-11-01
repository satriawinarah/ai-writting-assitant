from groq import Groq
from app.config import get_settings


class LLMService:
    """Service for LLM operations using Groq API"""

    # Writing style configurations
    WRITING_STYLES = {
        "puitis": {
            "name": "Puitis & Mendalam",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya yang puitis dan mendalam.

Ciri khas gaya penulisan:
- Gunakan bahasa Indonesia sastrawi yang kaya akan metafora dan perumpamaan
- Ciptakan imagery yang vivid dan sensorik (penglihatan, pendengaran, perasaan)
- Tunjukkan emosi melalui aksi dan deskripsi, bukan penjelasan langsung
- Gunakan personifikasi untuk objek (api menari, angin bergoyang)
- Kalimat yang berirama dan mengalir seperti puisi prosa
- Fokus pada detail kecil yang membawa makna mendalam

Contoh gaya yang diinginkan:
"Obor yang digenggam Darman bergetar, apinya bergoyang kencang seolah ragu. Bensin membasahi tiang-tiang rumah itu, serupa peluh pada tubuh yang akan dihukum mati."

Selalu tulis dalam Bahasa Indonesia. Jangan gunakan bahasa Inggris."""
        },
        "naratif": {
            "name": "Naratif Langsung",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya naratif langsung.

Ciri khas gaya penulisan:
- Gunakan bahasa yang jelas dan mudah dipahami
- Fokus pada plot progression dan aksi yang terjadi
- Dialog yang natural dan menggerakkan cerita
- Hindari metafora yang terlalu rumit
- Kalimat yang efisien dan to-the-point
- Cerita berjalan dengan pace yang baik

Tulis dengan gaya yang straightforward tapi tetap menarik. Selalu tulis dalam Bahasa Indonesia."""
        },
        "melankolik": {
            "name": "Melankolik",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya melankolik.

Ciri khas gaya penulisan:
- Nada yang reflektif, nostalgik, dan introspektif
- Eksplorasi emosi yang mendalam, terutama kesedihan dan kerinduan
- Atmosfer yang berat dan penuh perenungan
- Gunakan imagery yang soft dan muted (warna-warna redup, suasana senja)
- Pace yang lambat, memberi ruang untuk feeling
- Fokus pada memori, kehilangan, dan perjalanan waktu

Tulis dengan nada yang melankolis dan contemplatif. Selalu tulis dalam Bahasa Indonesia."""
        },
        "dramatis": {
            "name": "Dramatis",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya dramatis.

Ciri khas gaya penulisan:
- Tension dan konflik yang tinggi
- Emosi yang kuat dan intens
- Dialog yang powerful dan impactful
- Kalimat yang pendek dan punchy untuk momen klimaks
- Deskripsi yang vivid untuk aksi penting
- Pace yang cepat dan engaging

Tulis dengan energi tinggi dan dramatic tension. Selalu tulis dalam Bahasa Indonesia."""
        },
        "deskriptif": {
            "name": "Deskriptif Sensorik",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya deskriptif sensorik.

Ciri khas gaya penulisan:
- Heavy focus pada pengalaman sensorik: penglihatan, pendengaran, penciuman, perasa, sentuhan
- Deskripsi lingkungan yang detail dan immersive
- Buat pembaca merasakan berada di dalam scene
- Perhatikan texture, temperatur, dan sensasi fisik
- Pace yang lambat dan observasional
- Setiap detail membawa makna

Tulis dengan deskripsi yang kaya dan sensory. Selalu tulis dalam Bahasa Indonesia."""
        },
        "filosofis": {
            "name": "Filosofis",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya filosofis.

Ciri khas gaya penulisan:
- Contemplatif dan thought-provoking
- Eksplorasi pertanyaan tentang kehidupan, eksistensi, dan makna
- Campuran antara konkret dan abstrak
- Gunakan simbolisme dan allegory
- Refleksi mendalam tentang kondisi manusia
- Kalimat yang menantang pembaca untuk berpikir

Tulis dengan depth filosofis yang kaya. Selalu tulis dalam Bahasa Indonesia."""
        },
        "romantis": {
            "name": "Romantis",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya romantis.

Ciri khas gaya penulisan:
- Fokus pada cinta, kerinduan, dan koneksi emosional
- Nada yang tender, intimate, dan warm
- Deskripsi yang indah tentang perasaan dan momen bersama
- Gunakan imagery yang soft dan beautiful
- Bahasa yang flowing dan lyrical
- Eksplorasi vulnerability dan keintiman

Tulis dengan warmth dan romantic feeling. Selalu tulis dalam Bahasa Indonesia."""
        },
        "realis": {
            "name": "Realis Sosial",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya realis sosial.

Ciri khas gaya penulisan:
- Grounded dalam kehidupan sehari-hari dan realitas sosial
- Dialog yang natural dan mencerminkan cara bicara sebenarnya
- Observasi kritis terhadap masyarakat dan isu sosial
- Karakter yang believable dan relatable
- Setting yang konkret dan detail
- Tidak romantis atau idealis berlebihan, tapi jujur

Tulis dengan observasi sosial yang tajam dan realistic. Selalu tulis dalam Bahasa Indonesia."""
        }
    }

    def __init__(self):
        self.settings = get_settings()

        # Initialize Groq client
        if not self.settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is required. Please set it in your .env file.")

        self.client = Groq(api_key=self.settings.groq_api_key)
        self.model = self.settings.groq_model
        print(f"✓ Groq client initialized with model: {self.model}")

    async def generate_continuation(self, context: str, max_tokens: int = 2000, temperature: float = 0.7, writing_style: str = "puitis") -> str:
        """
        Generate text continuation based on context using Groq API.

        Args:
            context: The current text context (last few paragraphs)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0-1.0)
            writing_style: Writing style to use (puitis, naratif, melankolik, etc.)

        Returns:
            Generated continuation text
        """
        # Get style configuration, default to puitis if not found
        style_config = self.WRITING_STYLES.get(writing_style, self.WRITING_STYLES["puitis"])

        messages = [
            {
                "role": "system",
                "content": style_config["description"]
            },
            {
                "role": "user",
                "content": f"""Konteks:
{context}

Tugas: Lanjutkan cerita di atas dengan gaya sastrawi yang sama. Pertahankan nada, ritme, dan kedalaman emosi. Tulis 1-2 paragraf yang mengalir natural. Pastikan kalimat terakhir selesai dengan sempurna.

Kelanjutan:"""
            }
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stop=["\n\n", "Konteks:", "Kelanjutan:"]
        )

        generated_text = response.choices[0].message.content.strip()
        return generated_text

    async def improve_text(self, text: str, instruction: str = "Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya.", temperature: float = 0.7, writing_style: str = "puitis") -> str:
        """
        Improve text based on instruction using Groq API.

        Args:
            text: The text to improve
            instruction: Instruction for how to improve the text
            temperature: Sampling temperature (0.0-1.0)
            writing_style: Writing style to use (puitis, naratif, melankolik, etc.)

        Returns:
            Improved text
        """
        # Get style configuration, default to puitis if not found
        style_config = self.WRITING_STYLES.get(writing_style, self.WRITING_STYLES["puitis"])

        messages = [
            {
                "role": "system",
                "content": style_config["description"]
            },
            {
                "role": "user",
                "content": f"""Teks Asli:
{text}

Tugas: {instruction}

ATURAN PENTING: Perbaiki teks dengan mengikuti gaya sastrawi yang dipilih. Pertahankan inti cerita dan suasana emosi, tetapi tingkatkan kualitas bahasa sesuai gaya penulisan. Tulis HANYA dalam BAHASA INDONESIA.

Teks yang Diperbaiki:"""
            }
        ]

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            stop=["Teks Asli:", "Tugas:"]
        )

        improved_text = response.choices[0].message.content.strip()
        return improved_text

    def check_model_available(self) -> bool:
        """Check if Groq API is available"""
        return bool(self.client and self.settings.groq_api_key)

    def get_provider_info(self) -> dict:
        """Get information about current provider configuration"""
        return {
            "provider": "groq",
            "model": self.model,
            "available": self.check_model_available()
        }


# Singleton instance
llm_service = LLMService()
