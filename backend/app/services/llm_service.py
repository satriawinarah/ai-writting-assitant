from groq import Groq
from app.config import get_settings


class LLMService:
    """Service for LLM operations using Groq API"""

    def __init__(self):
        self.settings = get_settings()

        # Initialize Groq client
        if not self.settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is required. Please set it in your .env file.")

        self.client = Groq(api_key=self.settings.groq_api_key)
        self.model = self.settings.groq_model
        print(f"✓ Groq client initialized with model: {self.model}")

    async def generate_continuation(self, context: str, max_tokens: int = 150, temperature: float = 0.7) -> str:
        """
        Generate text continuation based on context using Groq API.

        Args:
            context: The current text context (last few paragraphs)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0-1.0)

        Returns:
            Generated continuation text
        """
        messages = [
            {
                "role": "system",
                "content": """Kamu adalah asisten penulis sastra Indonesia dengan gaya yang puitis dan mendalam.

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
            {
                "role": "user",
                "content": f"""Konteks:
{context}

Tugas: Lanjutkan cerita di atas dengan gaya sastrawi yang sama. Pertahankan nada, ritme, dan kedalaman emosi. Tulis 1-2 kalimat yang mengalir natural dengan imagery yang kuat dan metafora yang indah.

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

    async def improve_text(self, text: str, instruction: str = "Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya.", temperature: float = 0.7) -> str:
        """
        Improve text based on instruction using Groq API.

        Args:
            text: The text to improve
            instruction: Instruction for how to improve the text
            temperature: Sampling temperature (0.0-1.0)

        Returns:
            Improved text
        """
        messages = [
            {
                "role": "system",
                "content": """Kamu adalah asisten penulis sastra Indonesia dengan gaya yang puitis dan mendalam.

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
            {
                "role": "user",
                "content": f"""Teks Asli:
{text}

Tugas: {instruction}

ATURAN PENTING: Perbaiki teks dengan mengikuti gaya sastrawi yang puitis dan mendalam. Pertahankan inti cerita dan suasana emosi, tetapi tingkatkan keindahan bahasa dengan imagery yang kuat, metafora yang indah, dan personifikasi yang natural. Tulis HANYA dalam BAHASA INDONESIA.

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
