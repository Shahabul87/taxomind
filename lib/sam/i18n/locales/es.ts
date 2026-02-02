/**
 * Spanish (es) Translation Dictionary
 *
 * Template locale demonstrating the multi-language pattern.
 * Add translations progressively — missing keys fall back to English.
 */

import type { TranslationDictionary } from '../types';

const es: TranslationDictionary = {
  // =========================================================================
  // MODE GREETINGS (selected modes — add more as needed)
  // =========================================================================
  'mode.general-assistant.greeting': 'Soy tu Asistente General. ¿En qué puedo ayudarte?',
  'mode.content-creator.greeting': 'Estoy en modo Creador de Contenido. ¿Qué te gustaría que cree?',
  'mode.blooms-analyzer.greeting': 'Estoy en modo Analizador de Bloom. Comparte cualquier texto y analizaré sus niveles cognitivos.',
  'mode.learning-coach.greeting': 'Soy tu Coach de Aprendizaje. ¿En qué estás trabajando?',
  'mode.socratic-tutor.greeting': 'Estoy en modo Tutor Socrático. ¿Qué concepto exploramos juntos?',
  'mode.exam-builder.greeting': 'Estoy en modo Constructor de Exámenes. Dime qué evaluación necesitas.',
  'mode.research-assistant.greeting': 'Estoy en modo Investigación. ¿Qué tema te gustaría que investigue?',
  'mode.course-architect.greeting': 'Soy tu Arquitecto de Cursos. Describe el curso que quieres diseñar.',

  // =========================================================================
  // DEGRADED MODE RESPONSES
  // =========================================================================
  'degraded.GREETING': '¡Hola! Estoy funcionando en modo limitado, pero todavía puedo ayudar con preguntas básicas.',
  'degraded.DEFAULT': 'Estoy operando temporalmente con capacidades reducidas. La asistencia básica sigue disponible.',

  // =========================================================================
  // SYSTEM MESSAGES
  // =========================================================================
  'system.welcome': '¡Bienvenido a SAM AI Tutor!',
  'system.error.generic': 'Algo salió mal. Por favor, inténtalo de nuevo.',
  'system.error.timeout': 'La solicitud tardó demasiado. Por favor, inténtalo de nuevo.',
  'system.error.rateLimit': 'Estás enviando mensajes demasiado rápido. Espera un momento.',
  'system.retry': 'Intentar de nuevo',
  'system.getHelp': 'Obtener ayuda',
  'system.processing': 'Pensando...',
  'system.streaming': 'Respondiendo...',

  // =========================================================================
  // UI LABELS
  // =========================================================================
  'ui.modeDropdown.smartAuto': 'Auto Inteligente',
  'ui.modeDropdown.smartAutoDesc': 'Selecciona automáticamente el mejor modo',
  'ui.modeDropdown.recent': 'Recientes',
  'ui.modeDropdown.favorites': 'Favoritos',
  'ui.modeDropdown.searchPlaceholder': 'Buscar modos...',
  'ui.chat.inputPlaceholder': 'Pregúntale a SAM...',
  'ui.chat.send': 'Enviar',
  'ui.suggestions.modeSwitchPrefix': 'Cambiar a',
  'ui.suggestions.modeSwitchConfirm': 'Cambiar',
};

export default es;
