"""
LLM Service for AI-powered writing assistance.

This module provides the main LLMService class that coordinates
all AI operations including text continuation, improvement,
title suggestions, and live review.
"""

import json
import re

from .client import LLMClientFactory
from .sanitizer import sanitize_user_input
from .styles import get_writing_style, get_title_style, WRITING_STYLES, TITLE_STYLES


class LLMService:
    """Service for LLM operations using Groq/OpenRouter API."""

    # Expose styles for backward compatibility
    TITLE_STYLES = TITLE_STYLES
    WRITING_STYLES = WRITING_STYLES

    def __init__(self):
        self.client_factory = LLMClientFactory()
        print("✓ LLM Service initialized")

    async def generate_continuation(
        self,
        context: str,
        max_tokens: int = 2000,
        temperature: float = 0.7,
        writing_style: str = "puitis",
        paragraph_count: int = 1,
        brief_idea: str = "",
        model: str = "openai/gpt-oss-120b",
        custom_prompts: dict = None
    ) -> str:
        """
        Generate text continuation based on context using LLM API.

        Args:
            context: The full text context from the editor
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0-1.0)
            writing_style: Writing style to use
            paragraph_count: Number of paragraphs to generate (1-5)
            brief_idea: Optional brief idea or direction for the continuation
            model: Model to use for generation
            custom_prompts: Optional custom prompt overrides

        Returns:
            Generated continuation text
        """
        client = self.client_factory.get_client(model)
        style_description = get_writing_style(writing_style, custom_prompts)

        # Build task instruction
        task_instruction = self._build_continuation_instruction(
            paragraph_count, brief_idea
        )

        messages = [
            {"role": "system", "content": style_description},
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

        return response.choices[0].message.content.strip()

    async def improve_text(
        self,
        text: str,
        instruction: str = "Tolong poles teks berikut agar lebih hidup, jelas, dan memiliki gaya bahasa yang menarik serta alami untuk dibaca, tanpa mengubah inti cerita atau suasana emosinya.",
        temperature: float = 0.7,
        writing_style: str = "puitis",
        model: str = "openai/gpt-oss-120b",
        custom_prompts: dict = None
    ) -> str:
        """
        Improve text based on instruction using LLM API.

        Args:
            text: The text to improve
            instruction: Instruction for how to improve the text
            temperature: Sampling temperature (0.0-1.0)
            writing_style: Writing style to use
            model: Model to use for generation
            custom_prompts: Optional custom prompt overrides

        Returns:
            Improved text
        """
        client = self.client_factory.get_client(model)
        style_description = get_writing_style(writing_style, custom_prompts)
        sanitized_instruction = sanitize_user_input(instruction, max_length=500)

        messages = [
            {"role": "system", "content": style_description},
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

        return response.choices[0].message.content.strip()

    async def suggest_title(
        self,
        content: str,
        title_style: str = "click_bait",
        temperature: float = 0.7,
        model: str = "openai/gpt-oss-120b"
    ) -> list[str]:
        """
        Generate title suggestions based on content using LLM API.

        Args:
            content: The story content to generate titles for
            title_style: Title style to use
            temperature: Sampling temperature (0.0-1.0)
            model: Model to use for generation

        Returns:
            List of suggested titles (up to 5)
        """
        client = self.client_factory.get_client(model)
        style_desc = get_title_style(title_style)

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

        return self._parse_titles(response.choices[0].message.content.strip())

    async def live_review(
        self,
        content: str,
        temperature: float = 0.7,
        model: str = "openai/gpt-oss-120b"
    ) -> list[dict]:
        """
        Analyze text and return issues with suggestions for improvement.

        Args:
            content: The full text content to analyze
            temperature: Sampling temperature (0.0-1.0)
            model: Model to use for analysis

        Returns:
            List of issues with positions, severity, suggestions, and explanations
        """
        client = self.client_factory.get_client(model)

        messages = [
            {"role": "system", "content": self._get_review_system_prompt()},
            {
                "role": "user",
                "content": f"""Analisis teks berikut dan identifikasi bagian yang perlu diperbaiki:

{content}

Kembalikan hasil analisis dalam format JSON array:"""
            }
        ]

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=4000
        )

        result_text = response.choices[0].message.content.strip()
        return self._parse_review_issues(result_text, content)

    def check_model_available(self, model: str = "openai/gpt-oss-120b") -> bool:
        """Check if the specified model is available."""
        return self.client_factory.is_model_available(model)

    def get_provider_info(self) -> dict:
        """Get information about available models and their configuration."""
        return {
            "available_models": self.client_factory.get_available_models()
        }

    # Private helper methods

    def _build_continuation_instruction(
        self, paragraph_count: int, brief_idea: str
    ) -> str:
        """Build the task instruction for text continuation."""
        if brief_idea and brief_idea.strip():
            sanitized_brief_idea = sanitize_user_input(
                brief_idea.strip(), max_length=1000
            )
            return f"""Tugas: Lanjutkan cerita di atas dengan gaya sastrawi yang sama. Pertahankan nada, ritme, dan kedalaman emosi.

Arah cerita: {sanitized_brief_idea}

Tulis {paragraph_count} paragraf yang mengembangkan ide tersebut dengan natural dan mengalir. Pastikan kalimat terakhir selesai dengan sempurna."""

        return f"""Tugas: Lanjutkan cerita di atas dengan gaya sastrawi yang sama. Pertahankan nada, ritme, dan kedalaman emosi. Tulis {paragraph_count} paragraf yang mengalir natural. Pastikan kalimat terakhir selesai dengan sempurna."""

    def _parse_titles(self, result: str) -> list[str]:
        """Parse title suggestions from LLM response."""
        lines = result.split('\n')
        titles = []
        for line in lines:
            line = line.strip()
            if line and (line[0].isdigit() or line.startswith('-') or line.startswith('•')):
                title = line.lstrip('0123456789.-•) ').strip()
                if title:
                    titles.append(title)
        return titles[:5] if len(titles) >= 5 else titles

    def _get_review_system_prompt(self) -> str:
        """Get the system prompt for live review."""
        return """Kamu adalah editor profesional yang ahli dalam mengoreksi dan memperbaiki tulisan dalam Bahasa Indonesia.

Analisis teks yang diberikan dan identifikasi bagian-bagian yang perlu diperbaiki. Untuk setiap masalah yang ditemukan, berikan informasi berikut:

1. original_text: Teks asli yang bermasalah (harus EXACT substring dari input, copy paste persis)
2. severity: Tingkat keparahan:
   - "critical": kesalahan tata bahasa, ejaan, makna tidak jelas, atau struktur kalimat yang salah
   - "warning": masalah gaya, saran perbaikan, atau hal yang bisa ditingkatkan
3. issue_type: Jenis masalah - pilih salah satu:
   - "grammar": kesalahan tata bahasa, ejaan, tanda baca
   - "clarity": kalimat membingungkan, makna tidak jelas, ambigu
   - "style": gaya bahasa kurang tepat, nada tidak konsisten
   - "redundancy": pengulangan kata/frasa yang tidak perlu, kalimat bertele-tele
   - "word_choice": pilihan kata kurang tepat, bisa diganti kata yang lebih baik
   - "simplicity": kalimat terlalu panjang/rumit, bisa disederhanakan
   - "flow": alur kalimat tidak mengalir dengan baik, transisi kurang halus
   - "conciseness": bisa dipersingkat tanpa mengurangi makna
4. suggestion: Teks yang sudah diperbaiki (pengganti untuk original_text)
5. explanation: Penjelasan singkat dalam Bahasa Indonesia mengapa perlu diperbaiki (1-2 kalimat)

HAL YANG PERLU DIPERHATIKAN:
- Kalimat yang terlalu panjang dan rumit - sarankan untuk dipecah atau disederhanakan
- Kata-kata yang berlebihan atau tidak perlu - sarankan untuk dihapus
- Pengulangan ide atau kata yang sama - sarankan alternatif atau penghapusan
- Struktur kalimat yang bisa lebih efektif - sarankan perbaikan
- Kata serapan yang ada padanan Bahasa Indonesianya - sarankan padanan yang tepat
- Kalimat pasif yang berlebihan - sarankan bentuk aktif jika lebih baik
- Penggunaan kata penghubung yang salah atau berlebihan

ATURAN PENTING:
- original_text HARUS merupakan substring yang persis ada dalam teks input
- Jangan ubah atau modifikasi original_text, copy persis dari input
- Fokus pada masalah yang benar-benar penting dan berdampak
- Maksimal 10 masalah per review
- Jika tidak ada masalah, kembalikan array kosong []
- Prioritaskan masalah "critical" terlebih dahulu

Kembalikan HANYA JSON array tanpa penjelasan tambahan. Format:
[
  {
    "original_text": "teks asli yang bermasalah",
    "severity": "critical",
    "issue_type": "grammar",
    "suggestion": "teks yang diperbaiki",
    "explanation": "penjelasan singkat dalam Bahasa Indonesia"
  }
]"""

    def _parse_review_issues(self, result_text: str, content: str) -> list[dict]:
        """Parse review issues from LLM response and calculate positions."""
        try:
            json_match = re.search(r'\[[\s\S]*\]', result_text)
            if json_match:
                issues_raw = json.loads(json_match.group())
            else:
                issues_raw = json.loads(result_text)
        except json.JSONDecodeError:
            return []

        issues = []
        used_positions = set()

        for issue in issues_raw:
            original_text = issue.get("original_text", "")
            if not original_text:
                continue

            search_start = 0
            while True:
                start_offset = content.find(original_text, search_start)
                if start_offset == -1:
                    break
                end_offset = start_offset + len(original_text)

                position_key = (start_offset, end_offset)
                if position_key not in used_positions:
                    used_positions.add(position_key)
                    issues.append({
                        "original_text": original_text,
                        "start_offset": start_offset,
                        "end_offset": end_offset,
                        "severity": issue.get("severity", "warning"),
                        "issue_type": issue.get("issue_type", "style"),
                        "suggestion": issue.get("suggestion", original_text),
                        "explanation": issue.get("explanation", "")
                    })
                    break

                search_start = start_offset + 1

        return issues


# Singleton instance
llm_service = LLMService()
