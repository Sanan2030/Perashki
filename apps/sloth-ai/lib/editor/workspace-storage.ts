import { EMAIL_GREETINGS, type EmailGreeting } from './email-greetings';
import type { RichDocument } from '../ui/rich-document';
export const DRAFT_KEY = 'slothai-workspace-v1';
export const REVIEW_KEY = 'slothai-reviewed-tests-v1';
export type EditorDraft = {
  version: 1; activeModule: 'text' | 'mail'; textValue: string; mailValue: string;
  textOutput: string; mailOutput: string; textGenerated: string; mailGenerated: string;
  mailGreeting: EmailGreeting; preserveFormatting: boolean;
  textDocument?: RichDocument; mailDocument?: RichDocument; editingOutput?: boolean;
};
export function parseEditorDraft(raw: string): EditorDraft {
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || !['text', 'mail'].includes(value.activeModule) || !EMAIL_GREETINGS.includes(value.mailGreeting) || typeof value.preserveFormatting !== 'boolean') throw new Error('Sloth AI qaralaması uyğun deyil.');
  for (const key of ['textValue', 'mailValue', 'textOutput', 'mailOutput', 'textGenerated', 'mailGenerated']) {
    if (typeof value[key] !== 'string' || value[key].length > 100000) throw new Error('Sloth AI mətn sahəsi uyğun deyil.');
  }
  if (value.editingOutput !== undefined && typeof value.editingOutput !== 'boolean') throw new Error('Redaktor görünüşü uyğun deyil.');
  for (const key of ['textDocument', 'mailDocument']) {
    const document = value[key];
    if (document === undefined) continue;
    if (!document || !Array.isArray(document.blocks) || document.blocks.length > 10000) throw new Error('Mətnin formatı uyğun deyil.');
    let length = 0;
    for (const block of document.blocks) {
      if (!block || !['paragraph', 'bullet', 'ordered'].includes(block.type) || !Array.isArray(block.children) || block.children.length > 10000) throw new Error('Mətn abzası uyğun deyil.');
      for (const inline of block.children) {
        if (!inline || typeof inline.text !== 'string' || !Array.isArray(inline.marks) || inline.marks.length > 5 || !inline.marks.every((mark: unknown) => typeof mark === 'string' && ['bold', 'italic', 'underline', 'quote', 'code'].includes(mark))) throw new Error('Mətn formatı uyğun deyil.');
        length += inline.text.length;
      }
    }
    if (length > 100000) throw new Error('Formatlanmış mətn çox böyükdür.');
  }
  return value;
}
