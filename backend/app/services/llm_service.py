from groq import Groq
from app.config import get_settings
import re


def sanitize_user_input(text: str, max_length: int = 5000) -> str:
    """
    Sanitize user input to prevent prompt injection attacks.

    - Truncates to max_length
    - Removes potential prompt injection patterns
    - Strips dangerous control sequences
    """
    if not text:
        return ""

    # Truncate to max length
    text = text[:max_length]

    # Remove common prompt injection patterns (case-insensitive)
    injection_patterns = [
        r'(?i)ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)',
        r'(?i)disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)',
        r'(?i)forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)',
        r'(?i)you\s+are\s+now\s+',
        r'(?i)act\s+as\s+if\s+',
        r'(?i)pretend\s+(you\s+are|to\s+be)\s+',
        r'(?i)new\s+instructions?:',
        r'(?i)system\s*:\s*',
        r'(?i)assistant\s*:\s*',
        r'(?i)\[INST\]',
        r'(?i)\[/INST\]',
        r'(?i)<\|im_start\|>',
        r'(?i)<\|im_end\|>',
        r'(?i)<<SYS>>',
        r'(?i)<</SYS>>',
    ]

    for pattern in injection_patterns:
        text = re.sub(pattern, '[FILTERED]', text)

    return text.strip()


class LLMService:
    """Service for LLM operations using Groq API"""

    # Title style configurations
    TITLE_STYLES = {
        "click_bait": {
            "name": "Click Bait",
            "description": "Judul yang catchy, attention-grabbing dengan suspense atau curiosity"
        },
        "philosophy": {
            "name": "Philosophy",
            "description": "Judul yang deep, thought-provoking, dan filosofis"
        },
        "mystery": {
            "name": "Mystery",
            "description": "Judul yang enigmatic, mysterious yang memberi hint tentang rahasia"
        },
        "poetic": {
            "name": "Poetic",
            "description": "Judul yang artistic, lyrical dengan metafora"
        },
        "direct": {
            "name": "Direct",
            "description": "Judul yang clear, straightforward yang mendeskripsikan konten"
        },
        "dramatic": {
            "name": "Dramatic",
            "description": "Judul yang intense, emotional, high-stakes"
        },
        "symbolic": {
            "name": "Symbolic",
            "description": "Judul yang menggunakan simbolisme dan makna yang lebih dalam"
        },
        "literary": {
            "name": "Literary",
            "description": "Judul yang classic, elegant dengan gaya literary"
        }
    }

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
        },
        "dialog": {
            "name": "Dialog-Focused",
            "description": """Kamu adalah asisten penulis sastra Indonesia yang ahli dalam menulis dialog.

Ciri khas gaya penulisan:
- Fokus utama pada percakapan dan interaksi antar karakter
- Dialog yang natural, tajam, dan mengungkapkan karakter
- Setiap karakter memiliki voice yang unik dan konsisten
- Gunakan dialog untuk menggerakkan plot dan membangun tension
- Minimal narasi, biarkan dialog berbicara sendiri
- Tag dialog yang efisien ("kata," bukan "berkata dengan nada...")
- Subtext dalam dialog - karakter tidak selalu mengatakan yang mereka maksud
- Ritme percakapan yang natural dengan interruption, pause, dan incomplete sentences
- Gunakan action beats untuk menunjukkan emosi (contoh: Dia mengalihkan pandangan. "Tidak apa-apa.")
- Reveal karakter melalui cara mereka bicara: diksi, panjang kalimat, tick verbal

Contoh gaya yang diinginkan:
"Kamu akan pergi?"
"Ya."
Dia menutup buku yang sedang dibaca. "Kapan?"
"Besok pagi. Mungkin."
"Mungkin?"
"Belum pasti." Aku menggaruk kepala. "Tergantung—"
"Tergantung apa?"
"Tergantung kamu."

Tulis dengan fokus pada dialog yang powerful dan revealing. Selalu tulis dalam Bahasa Indonesia."""
        },
        "quote": {
            "name": "Quote",
            "description": """Kamu adalah asisten penulis sastra Indonesia dengan gaya yang kaya akan kutipan dan referensi.

Ciri khas gaya penulisan:
- Integrasikan kutipan dari tokoh, buku, atau pemikiran filosofis secara natural
- Gunakan kutipan untuk memperkaya makna dan memberikan depth
- Kutipan bisa berupa ucapan karakter yang memorable atau referensi eksternal
- Weave kutipan dengan narasi, jangan hanya menjepitkan
- Eksplorasi bagaimana kutipan resonates dengan situasi karakter
- Refleksi tentang makna kutipan dalam konteks cerita
- Kutipan bisa dalam bahasa Indonesia atau bahasa aslinya (dengan terjemahan jika perlu)
- Gunakan kutipan untuk membangun tema dan motif

Contoh gaya yang diinginkan:
"Seperti yang dikatakan Pramudya: 'Orang boleh pandai setinggi langit, tapi selama ia tidak menulis, ia akan hilang di dalam masyarakat dan dari sejarah.' Aku menatap halaman kosong di depanku, menyadari betapa beratnya makna kata-kata itu."

Atau:

"Kau ingat kata-kata Ibu dulu?" Dia tersenyum tipis. "Hidup itu seperti menulis—kadang kita perlu menghapus untuk memulai yang baru."

Tulis dengan memanfaatkan kutipan yang bermakna dan contextual. Selalu tulis dalam Bahasa Indonesia."""
        }
    }

    def __init__(self):
        self.settings = get_settings()
        print(f"✓ LLM Service initialized")

    def _get_client_for_model(self, model: str):
        """Get the appropriate client for the given model"""
        api_key = self.settings.get_api_key_for_model(model)

        if not api_key:
            raise ValueError(f"No API key configured for model: {model}")

        # For now, we use Groq client for all models
        # OpenRouter uses OpenAI-compatible API, so Groq client should work
        return Groq(api_key=api_key)

    async def generate_continuation(self, context: str, max_tokens: int = 2000, temperature: float = 0.7, writing_style: str = "puitis", paragraph_count: int = 1, brief_idea: str = "", model: str = "openai/gpt-oss-120b", custom_prompts: dict = None) -> str:
        """
        Generate text continuation based on context using LLM API.

        Args:
            context: The full text context from the editor
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0-1.0)
            writing_style: Writing style to use (puitis, naratif, melankolik, etc.)
            paragraph_count: Number of paragraphs to generate (1-5)
            brief_idea: Optional brief idea or direction for the continuation
            model: Model to use for generation

        Returns:
            Generated continuation text
        """
        # Get client for the specified model
        client = self._get_client_for_model(model)

        # Get style configuration
        # First check custom prompts, then fall back to default
        if custom_prompts and writing_style in custom_prompts:
            style_description = custom_prompts[writing_style]
        else:
            style_config = self.WRITING_STYLES.get(writing_style, self.WRITING_STYLES["puitis"])
            style_description = style_config["description"]

        # Build the task instruction based on whether brief_idea is provided
        if brief_idea and brief_idea.strip():
            # Sanitize user input to prevent prompt injection
            sanitized_brief_idea = sanitize_user_input(brief_idea.strip(), max_length=1000)
            task_instruction = f"""Tugas: Lanjutkan cerita di atas dengan gaya sastrawi yang sama. Pertahankan nada, ritme, dan kedalaman emosi.

Arah cerita: {sanitized_brief_idea}

Tulis {paragraph_count} paragraf yang mengembangkan ide tersebut dengan natural dan mengalir. Pastikan kalimat terakhir selesai dengan sempurna."""
        else:
            task_instruction = f"""Tugas: Lanjutkan cerita di atas dengan gaya sastrawi yang sama. Pertahankan nada, ritme, dan kedalaman emosi. Tulis {paragraph_count} paragraf yang mengalir natural. Pastikan kalimat terakhir selesai dengan sempurna."""

        messages = [
            {
                "role": "system",
                "content": style_description
            },
            {
                "role": "user",
                "content": f"""Konteks:
{context}

{task_instruction}

Kelanjutan:"""
            }
        ]

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stop=["\n\n", "Konteks:", "Kelanjutan:"]
        )

        generated_text = response.choices[0].message.content.strip()
        return generated_text

    async def improve_text(self, text: str, instruction: str = "Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya.", temperature: float = 0.7, writing_style: str = "puitis", model: str = "openai/gpt-oss-120b", custom_prompts: dict = None) -> str:
        """
        Improve text based on instruction using LLM API.

        Args:
            text: The text to improve
            instruction: Instruction for how to improve the text
            temperature: Sampling temperature (0.0-1.0)
            writing_style: Writing style to use (puitis, naratif, melankolik, etc.)
            model: Model to use for generation

        Returns:
            Improved text
        """
        # Get client for the specified model
        client = self._get_client_for_model(model)

        # Get style configuration
        # First check custom prompts, then fall back to default
        if custom_prompts and writing_style in custom_prompts:
            style_description = custom_prompts[writing_style]
        else:
            style_config = self.WRITING_STYLES.get(writing_style, self.WRITING_STYLES["puitis"])
            style_description = style_config["description"]

        # Sanitize user input to prevent prompt injection
        sanitized_instruction = sanitize_user_input(instruction, max_length=500)

        messages = [
            {
                "role": "system",
                "content": style_description
            },
            {
                "role": "user",
                "content": f"""Teks Asli:
{text}

Tugas: {sanitized_instruction}

ATURAN PENTING: Perbaiki teks dengan mengikuti gaya sastrawi yang dipilih. Pertahankan inti cerita dan suasana emosi, tetapi tingkatkan kualitas bahasa sesuai gaya penulisan. Tulis HANYA dalam BAHASA INDONESIA.

Teks yang Diperbaiki:"""
            }
        ]

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stop=["Teks Asli:", "Tugas:"]
        )

        improved_text = response.choices[0].message.content.strip()
        return improved_text

    async def suggest_title(self, content: str, title_style: str = "click_bait", temperature: float = 0.7, model: str = "openai/gpt-oss-120b") -> list[str]:
        """
        Generate title suggestions based on content using LLM API.

        Args:
            content: The story content to generate titles for
            title_style: Title style to use (click_bait, philosophy, mystery, etc.)
            temperature: Sampling temperature (0.0-1.0)
            model: Model to use for generation

        Returns:
            List of 5 suggested titles
        """
        # Get client for the specified model
        client = self._get_client_for_model(model)

        # Get style configuration, default to click_bait if not found
        style_config = self.TITLE_STYLES.get(title_style, self.TITLE_STYLES["click_bait"])
        style_desc = style_config["description"]

        messages = [
            {
                "role": "system",
                "content": f"""Kamu adalah asisten penulis yang ahli dalam membuat judul cerita yang menarik.

Gaya judul yang diminta: {style_desc}

Tugas: Buat 5 judul berbeda yang sesuai dengan gaya tersebut. Setiap judul harus unik dan menarik. Format output harus berupa list dengan format:
1. Judul pertama
2. Judul kedua
3. Judul ketiga
4. Judul keempat
5. Judul kelima

Tulis HANYA dalam BAHASA INDONESIA."""
            },
            {
                "role": "user",
                "content": f"""Konten Cerita:
{content[:2000]}

Berdasarkan konten di atas, buatlah 5 judul yang sesuai dengan gaya: {style_desc}

Judul:"""
            }
        ]

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=10000
        )

        # Parse the response to extract titles
        result = response.choices[0].message.content.strip()

        # Split by newlines and extract titles (remove numbering)
        lines = result.split('\n')
        titles = []
        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                # Remove numbering like "1. ", "- ", "• ", etc.
                title = line.lstrip('0123456789.-•) ').strip()
                if title:
                    titles.append(title)

        # Return at least 5 titles, or all if we got less
        return titles[:5] if len(titles) >= 5 else titles

    def check_model_available(self, model: str = "openai/gpt-oss-120b") -> bool:
        """Check if the specified model is available"""
        try:
            api_key = self.settings.get_api_key_for_model(model)
            return bool(api_key)
        except:
            return False

    def get_provider_info(self) -> dict:
        """Get information about available models and their configuration"""
        return {
            "available_models": [
                {
                    "model": "openai/gpt-oss-120b",
                    "provider": "openrouter",
                    "available": bool(self.settings.openrouter_api_key)
                },
                {
                    "model": "llama-3.3-70b-versatile",
                    "provider": "groq",
                    "available": bool(self.settings.groq_api_key)
                }
            ]
        }


# Singleton instance
llm_service = LLMService()
