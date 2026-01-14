/**
 * Style definitions for the editor.
 *
 * These are used as fallback values. The backend is the source of truth
 * for available styles - fetch from /api/settings/default-prompts for full details.
 */

export const WRITING_STYLES = [
  { value: 'puitis', label: 'Puitis & Mendalam' },
  { value: 'naratif', label: 'Naratif Langsung' },
  { value: 'melankolik', label: 'Melankolik' },
  { value: 'dramatis', label: 'Dramatis' },
  { value: 'deskriptif', label: 'Deskriptif Sensorik' },
  { value: 'filosofis', label: 'Filosofis' },
  { value: 'romantis', label: 'Romantis' },
  { value: 'realis', label: 'Realis Sosial' },
  { value: 'dialog', label: 'Dialog-Focused' },
  { value: 'quote', label: 'Quote' },
];

export const TITLE_STYLES = [
  {
    value: 'click_bait',
    label: 'Click Bait',
    description: 'Catchy, attention-grabbing titles with suspense or curiosity'
  },
  {
    value: 'philosophy',
    label: 'Philosophy',
    description: 'Deep, thought-provoking, philosophical titles'
  },
  {
    value: 'mystery',
    label: 'Mystery',
    description: 'Enigmatic, mysterious titles that hint at secrets'
  },
  {
    value: 'poetic',
    label: 'Poetic',
    description: 'Artistic, lyrical titles with metaphors'
  },
  {
    value: 'direct',
    label: 'Direct',
    description: 'Clear, straightforward titles that describe the content'
  },
  {
    value: 'dramatic',
    label: 'Dramatic',
    description: 'Intense, emotional, high-stakes titles'
  },
  {
    value: 'symbolic',
    label: 'Symbolic',
    description: 'Titles using symbolism and deeper meanings'
  },
  {
    value: 'literary',
    label: 'Literary',
    description: 'Classic, elegant literary-style titles'
  },
];

export const AVAILABLE_MODELS = [
  { value: 'openai/gpt-oss-120b', label: 'OpenAI GPT OSS 120B' },
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
];

export const DEFAULT_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_WRITING_STYLE = 'puitis';
export const DEFAULT_TITLE_STYLE = 'click_bait';
