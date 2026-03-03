/**
 * QTI (Question and Test Interoperability) Exporter
 *
 * Exports exams and questions to IMS QTI 2.1 format for use in:
 * - Canvas LMS
 * - Blackboard
 * - Moodle
 * - Brightspace
 * - Other QTI-compliant systems
 *
 * @see https://www.imsglobal.org/question/qtiv2p1/imsqti_implv2p1.html
 * @version 1.0.0
 */

import { BloomsLevel, QuestionType } from '@prisma/client';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// TYPES AND INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface QTIExportOptions {
  includeMetadata: boolean;
  includeBloomsLevel: boolean;
  includeFeedback: boolean;
  includeHints: boolean;
  version: '2.1' | '2.2';
  namespace: string;
}

export interface TaxomindQuestion {
  id: string;
  question: string;
  questionType: QuestionType;
  options?: { id: string; text: string }[];
  correctAnswer: string | string[];
  explanation?: string;
  hint?: string;
  points: number;
  bloomsLevel?: BloomsLevel;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit?: number; // seconds
}

export interface TaxomindExam {
  id: string;
  title: string;
  description?: string;
  timeLimit?: number; // minutes
  passingScore?: number;
  shuffleQuestions?: boolean;
  questions: TaxomindQuestion[];
  metadata?: {
    courseId?: string;
    courseName?: string;
    author?: string;
    createdAt?: Date;
  };
}

// ═══════════════════════════════════════════════════════════════
// XML ESCAPING UTILITY
// ═══════════════════════════════════════════════════════════════

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ═══════════════════════════════════════════════════════════════
// QTI EXPORTER CLASS
// ═══════════════════════════════════════════════════════════════

export class QTIExporter {
  private options: QTIExportOptions;

  constructor(options?: Partial<QTIExportOptions>) {
    this.options = {
      includeMetadata: true,
      includeBloomsLevel: true,
      includeFeedback: true,
      includeHints: true,
      version: '2.1',
      namespace: 'https://taxomind.com/qti',
      ...options
    };
  }

  /**
   * Export a complete exam to QTI 2.1 format
   */
  exportExam(exam: TaxomindExam): string {
    const questions = exam.questions.map(q => this.exportQuestion(q)).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<assessmentTest xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqti_v2p1 http://www.imsglobal.org/xsd/qti/qtiv2p1/imsqti_v2p1.xsd"
                identifier="${escapeXml(exam.id)}"
                title="${escapeXml(exam.title)}">

  ${this.options.includeMetadata ? this.generateExamMetadata(exam) : ''}

  <testPart identifier="part1" navigationMode="nonlinear" submissionMode="individual">
    <assessmentSection identifier="section1" title="${escapeXml(exam.title)}" visible="true">
      ${exam.shuffleQuestions ? '<ordering shuffle="true"/>' : ''}

      ${exam.questions.map(q => `
      <assessmentItemRef identifier="${escapeXml(q.id)}" href="items/${escapeXml(q.id)}.xml">
        ${q.timeLimit ? `<timeLimits maxTime="${q.timeLimit}"/>` : ''}
      </assessmentItemRef>`).join('\n')}

    </assessmentSection>
  </testPart>

  ${exam.timeLimit ? `<timeLimits maxTime="${exam.timeLimit * 60}"/>` : ''}

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

</assessmentTest>

<!-- Individual Assessment Items -->
${questions}`;
  }

  /**
   * Export a single question to QTI 2.1 format
   */
  exportQuestion(question: TaxomindQuestion): string {
    switch (question.questionType) {
      case 'MULTIPLE_CHOICE':
        return this.exportMultipleChoice(question);
      case 'TRUE_FALSE':
        return this.exportTrueFalse(question);
      case 'SHORT_ANSWER':
        return this.exportShortAnswer(question);
      case 'ESSAY':
        return this.exportEssay(question);
      case 'FILL_IN_BLANK':
        return this.exportFillInBlank(question);
      case 'MATCHING':
        return this.exportMatching(question);
      case 'ORDERING':
        return this.exportOrdering(question);
      default:
        return this.exportGeneric(question);
    }
  }

  /**
   * Export multiple questions to separate QTI items
   */
  exportQuestions(questions: TaxomindQuestion[]): { id: string; xml: string }[] {
    return questions.map(q => ({
      id: q.id,
      xml: this.exportQuestion(q)
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // QUESTION TYPE EXPORTERS
  // ─────────────────────────────────────────────────────────────

  private exportMultipleChoice(q: TaxomindQuestion): string {
    const options = q.options || [];
    const correctId = Array.isArray(q.correctAnswer) ? q.correctAnswer[0] : q.correctAnswer;

    return `
<!-- Assessment Item: ${escapeXml(q.id)} -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>${escapeXml(correctId)}</value>
    </correctResponse>
  </responseDeclaration>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
      <prompt>${escapeXml(q.question)}</prompt>
      ${options.map(opt => `
      <simpleChoice identifier="${escapeXml(opt.id)}">${escapeXml(opt.text)}</simpleChoice>`).join('')}
    </choiceInteraction>
  </itemBody>

  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>

  ${this.generateFeedback(q)}
</assessmentItem>`;
  }

  private exportTrueFalse(q: TaxomindQuestion): string {
    const correctAnswer = String(q.correctAnswer).toLowerCase() === 'true';

    return `
<!-- Assessment Item: ${escapeXml(q.id)} -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
    <correctResponse>
      <value>${correctAnswer ? 'true' : 'false'}</value>
    </correctResponse>
  </responseDeclaration>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="1">
      <prompt>${escapeXml(q.question)}</prompt>
      <simpleChoice identifier="true">True</simpleChoice>
      <simpleChoice identifier="false">False</simpleChoice>
    </choiceInteraction>
  </itemBody>

  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>

  ${this.generateFeedback(q)}
</assessmentItem>`;
  }

  private exportShortAnswer(q: TaxomindQuestion): string {
    const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];

    return `
<!-- Assessment Item: ${escapeXml(q.id)} -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">
    <correctResponse>
      ${correctAnswers.map(a => `<value>${escapeXml(a)}</value>`).join('\n      ')}
    </correctResponse>
    <mapping defaultValue="0">
      ${correctAnswers.map(a => `<mapEntry mapKey="${escapeXml(a)}" mappedValue="${q.points}"/>`).join('\n      ')}
    </mapping>
  </responseDeclaration>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <extendedTextInteraction responseIdentifier="RESPONSE" expectedLength="100">
      <prompt>${escapeXml(q.question)}</prompt>
    </extendedTextInteraction>
  </itemBody>

  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/map_response"/>

  ${this.generateFeedback(q)}
</assessmentItem>`;
  }

  private exportEssay(q: TaxomindQuestion): string {
    return `
<!-- Assessment Item: ${escapeXml(q.id)} -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <extendedTextInteraction responseIdentifier="RESPONSE" expectedLength="500" expectedLines="10">
      <prompt>${escapeXml(q.question)}</prompt>
    </extendedTextInteraction>
  </itemBody>

  <!-- Essay questions require manual grading -->
  <responseProcessing>
    <setOutcomeValue identifier="SCORE">
      <baseValue baseType="float">0</baseValue>
    </setOutcomeValue>
  </responseProcessing>

  ${this.generateFeedback(q)}

  <!-- Rubric for graders -->
  ${q.explanation ? `
  <rubricBlock view="scorer">
    <div>${escapeXml(q.explanation)}</div>
  </rubricBlock>` : ''}
</assessmentItem>`;
  }

  private exportFillInBlank(q: TaxomindQuestion): string {
    const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];

    return `
<!-- Assessment Item: ${escapeXml(q.id)} -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">
    <correctResponse>
      ${correctAnswers.map(a => `<value>${escapeXml(a)}</value>`).join('\n      ')}
    </correctResponse>
  </responseDeclaration>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <p>${this.convertFillInBlankText(q.question)}</p>
  </itemBody>

  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>

  ${this.generateFeedback(q)}
</assessmentItem>`;
  }

  private exportMatching(q: TaxomindQuestion): string {
    const options = q.options || [];
    // Assume options are pairs: [{ id: 'a1', text: 'Term 1' }, { id: 'b1', text: 'Definition 1' }, ...]
    const sources = options.filter((_, i) => i % 2 === 0);
    const targets = options.filter((_, i) => i % 2 === 1);

    return `
<!-- Assessment Item: ${escapeXml(q.id)} -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="multiple" baseType="directedPair">
    <correctResponse>
      ${sources.map((s, i) => `<value>${escapeXml(s.id)} ${escapeXml(targets[i]?.id || '')}</value>`).join('\n      ')}
    </correctResponse>
  </responseDeclaration>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <matchInteraction responseIdentifier="RESPONSE" shuffle="false" maxAssociations="${sources.length}">
      <prompt>${escapeXml(q.question)}</prompt>
      <simpleMatchSet>
        ${sources.map(s => `<simpleAssociableChoice identifier="${escapeXml(s.id)}" matchMax="1">${escapeXml(s.text)}</simpleAssociableChoice>`).join('\n        ')}
      </simpleMatchSet>
      <simpleMatchSet>
        ${targets.map(t => `<simpleAssociableChoice identifier="${escapeXml(t.id)}" matchMax="1">${escapeXml(t.text)}</simpleAssociableChoice>`).join('\n        ')}
      </simpleMatchSet>
    </matchInteraction>
  </itemBody>

  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>

  ${this.generateFeedback(q)}
</assessmentItem>`;
  }

  private exportOrdering(q: TaxomindQuestion): string {
    const options = q.options || [];
    const correctOrder = Array.isArray(q.correctAnswer) ? q.correctAnswer : q.correctAnswer.split(',');

    return `
<!-- Assessment Item: ${escapeXml(q.id)} -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="ordered" baseType="identifier">
    <correctResponse>
      ${correctOrder.map(id => `<value>${escapeXml(id)}</value>`).join('\n      ')}
    </correctResponse>
  </responseDeclaration>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <orderInteraction responseIdentifier="RESPONSE" shuffle="true">
      <prompt>${escapeXml(q.question)}</prompt>
      ${options.map(opt => `<simpleChoice identifier="${escapeXml(opt.id)}">${escapeXml(opt.text)}</simpleChoice>`).join('\n      ')}
    </orderInteraction>
  </itemBody>

  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>

  ${this.generateFeedback(q)}
</assessmentItem>`;
  }

  private exportGeneric(q: TaxomindQuestion): string {
    return `
<!-- Assessment Item: ${escapeXml(q.id)} (Generic) -->
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
                identifier="${escapeXml(q.id)}"
                title="Question"
                adaptive="false"
                timeDependent="false">

  ${this.generateItemMetadata(q)}

  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>

  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
    <defaultValue><value>0</value></defaultValue>
  </outcomeDeclaration>

  <itemBody>
    <extendedTextInteraction responseIdentifier="RESPONSE" expectedLength="200">
      <prompt>${escapeXml(q.question)}</prompt>
    </extendedTextInteraction>
  </itemBody>

  <responseProcessing>
    <setOutcomeValue identifier="SCORE">
      <baseValue baseType="float">0</baseValue>
    </setOutcomeValue>
  </responseProcessing>
</assessmentItem>`;
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────

  private generateExamMetadata(exam: TaxomindExam): string {
    if (!this.options.includeMetadata) return '';

    return `
  <assessmentMetadata>
    <description>${escapeXml(exam.description || '')}</description>
    ${exam.metadata?.author ? `<contributor role="Author">${escapeXml(exam.metadata.author)}</contributor>` : ''}
    ${exam.metadata?.createdAt ? `<dateCreated>${exam.metadata.createdAt.toISOString()}</dateCreated>` : ''}
    ${exam.passingScore ? `<passingScore>${exam.passingScore}</passingScore>` : ''}
    <totalQuestions>${exam.questions.length}</totalQuestions>
    <totalPoints>${exam.questions.reduce((sum, q) => sum + q.points, 0)}</totalPoints>
  </assessmentMetadata>`;
  }

  private generateItemMetadata(q: TaxomindQuestion): string {
    if (!this.options.includeMetadata) return '';

    const metadata: string[] = [];

    if (this.options.includeBloomsLevel && q.bloomsLevel) {
      metadata.push(`<lom:classification>
        <lom:purpose>
          <lom:source>LOMv1.0</lom:source>
          <lom:value>educational objective</lom:value>
        </lom:purpose>
        <lom:taxonPath>
          <lom:source>
            <lom:string>Bloom&apos;s Taxonomy</lom:string>
          </lom:source>
          <lom:taxon>
            <lom:id>${escapeXml(q.bloomsLevel)}</lom:id>
            <lom:entry>
              <lom:string>${escapeXml(q.bloomsLevel)}</lom:string>
            </lom:entry>
          </lom:taxon>
        </lom:taxonPath>
      </lom:classification>`);
    }

    if (q.difficulty) {
      metadata.push(`<lom:difficulty>${escapeXml(q.difficulty.toLowerCase())}</lom:difficulty>`);
    }

    if (metadata.length === 0) return '';

    return `
  <itemMetadata xmlns:lom="http://ltsc.ieee.org/xsd/LOM">
    <qti:weight>${q.points}</qti:weight>
    ${metadata.join('\n    ')}
  </itemMetadata>`;
  }

  private generateFeedback(q: TaxomindQuestion): string {
    const feedback: string[] = [];

    if (this.options.includeFeedback && q.explanation) {
      feedback.push(`
  <modalFeedback outcomeIdentifier="FEEDBACK" showHide="show" identifier="correct">
    <div>${escapeXml(q.explanation)}</div>
  </modalFeedback>`);
    }

    if (this.options.includeHints && q.hint) {
      feedback.push(`
  <feedbackBlock outcomeIdentifier="HINT" showHide="show" identifier="hint1">
    <div>${escapeXml(q.hint)}</div>
  </feedbackBlock>`);
    }

    return feedback.join('\n');
  }

  private convertFillInBlankText(text: string): string {
    // Convert [blank] or ___ to QTI textEntryInteraction
    return text.replace(/\[blank\]|___+/gi, '<textEntryInteraction responseIdentifier="RESPONSE" expectedLength="20"/>');
  }
}

// ═══════════════════════════════════════════════════════════════
// QTI IMPORTER
// ═══════════════════════════════════════════════════════════════

export class QTIImporter {
  /**
   * Import QTI XML to Taxomind question format
   * Note: This is a simplified parser - production use would need a full XML parser
   */
  importQuestion(qtiXml: string): TaxomindQuestion | null {
    try {
      // Extract identifier
      const idMatch = qtiXml.match(/identifier="([^"]+)"/);
      const id = idMatch ? idMatch[1] : `imported_${Date.now()}`;

      // Extract prompt/question text
      const promptMatch = qtiXml.match(/<prompt>([^<]+)<\/prompt>/);
      const question = promptMatch ? promptMatch[1] : '';

      // Determine question type
      const questionType = this.detectQuestionType(qtiXml);

      // Extract correct answer
      const correctAnswer = this.extractCorrectAnswer(qtiXml);

      // Extract options for choice questions
      const options = this.extractOptions(qtiXml);

      // Extract feedback
      const feedbackMatch = qtiXml.match(/<modalFeedback[^>]*>[\s\S]*?<div>([^<]+)<\/div>/);
      const explanation = feedbackMatch ? feedbackMatch[1] : undefined;

      return {
        id,
        question,
        questionType,
        options,
        correctAnswer,
        explanation,
        points: 1 // Default, can be extracted from weight if present
      };
    } catch {
      logger.error('Failed to parse QTI XML');
      return null;
    }
  }

  private detectQuestionType(xml: string): QuestionType {
    if (xml.includes('choiceInteraction') && xml.includes('maxChoices="1"')) {
      if (xml.includes('>True</simpleChoice>') && xml.includes('>False</simpleChoice>')) {
        return 'TRUE_FALSE';
      }
      return 'MULTIPLE_CHOICE';
    }
    if (xml.includes('extendedTextInteraction')) {
      if (xml.includes('expectedLines="10"') || xml.includes('expectedLength="500"')) {
        return 'ESSAY';
      }
      return 'SHORT_ANSWER';
    }
    if (xml.includes('textEntryInteraction')) {
      return 'FILL_IN_BLANK';
    }
    if (xml.includes('matchInteraction')) {
      return 'MATCHING';
    }
    if (xml.includes('orderInteraction')) {
      return 'ORDERING';
    }
    return 'SHORT_ANSWER';
  }

  private extractCorrectAnswer(xml: string): string | string[] {
    const valueMatches = xml.match(/<correctResponse>[\s\S]*?<\/correctResponse>/);
    if (!valueMatches) return '';

    const values = [...valueMatches[0].matchAll(/<value>([^<]+)<\/value>/g)];
    const answers = values.map(m => m[1]);

    return answers.length === 1 ? answers[0] : answers;
  }

  private extractOptions(xml: string): { id: string; text: string }[] {
    const options: { id: string; text: string }[] = [];
    const choiceMatches = [...xml.matchAll(/<simpleChoice identifier="([^"]+)">([^<]+)<\/simpleChoice>/g)];

    for (const match of choiceMatches) {
      options.push({ id: match[1], text: match[2] });
    }

    return options;
  }
}

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function createQTIExporter(options?: Partial<QTIExportOptions>): QTIExporter {
  return new QTIExporter(options);
}

export function createQTIImporter(): QTIImporter {
  return new QTIImporter();
}

export default QTIExporter;
