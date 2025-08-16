import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Define certificate types locally since they don't exist in Prisma schema yet
export enum CertificateType {
  COURSE_COMPLETION = "COURSE_COMPLETION",
  ACHIEVEMENT = "ACHIEVEMENT",
  PARTICIPATION = "PARTICIPATION",
  SKILL_MASTERY = "SKILL_MASTERY",
  EXCELLENCE = "EXCELLENCE"
}

export interface CertificateData {
  id: string;
  recipientName: string;
  courseName: string;
  instructorName: string;
  issuedDate: Date;
  certificateNumber: string;
  verificationCode: string;
  grade?: string;
  finalScore?: number;
  hoursCompleted?: number;
  completionRate?: number;
  organizationName?: string;
  organizationLogo?: string;
  templateType: CertificateType;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  templateType: CertificateType;
  designData: {
    layout: 'portrait' | 'landscape';
    colorScheme: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      background: string;
    };
    typography: {
      title: string;
      body: string;
      signature: string;
    };
    elements: {
      showLogo: boolean;
      showBorder: boolean;
      showWatermark: boolean;
      showQRCode: boolean;
      showSignature: boolean;
      showGrade: boolean;
      showScore: boolean;
      showHours: boolean;
    };
    dimensions: {
      width: number;
      height: number;
      margin: number;
    };
  };
}

export class CertificateGenerator {
  private qrCodeSize = 100;
  private defaultTemplate: CertificateTemplate = {
    id: 'default',
    name: 'Default Certificate',
    templateType: CertificateType.COURSE_COMPLETION,
    designData: {
      layout: 'landscape',
      colorScheme: {
        primary: '#1f2937',
        secondary: '#3b82f6',
        accent: '#fbbf24',
        text: '#374151',
        background: '#ffffff'
      },
      typography: {
        title: 'Playfair Display',
        body: 'Inter',
        signature: 'Dancing Script'
      },
      elements: {
        showLogo: true,
        showBorder: true,
        showWatermark: false,
        showQRCode: true,
        showSignature: true,
        showGrade: true,
        showScore: true,
        showHours: true
      },
      dimensions: {
        width: 297, // A4 landscape width in mm
        height: 210, // A4 landscape height in mm
        margin: 20
      }
    }
  };

  async generateCertificate(
    data: CertificateData,
    template?: CertificateTemplate
  ): Promise<Buffer> {
    const activeTemplate = template || this.defaultTemplate;
    
    // Create HTML content based on template
    const htmlContent = this.generateHTMLContent(data, activeTemplate);
    
    // Convert HTML to canvas
    const canvas = await html2canvas(htmlContent, {
      width: activeTemplate.designData.dimensions.width * 3.78, // Convert mm to px
      height: activeTemplate.designData.dimensions.height * 3.78,
      scale: 2,
      useCORS: true,
      backgroundColor: activeTemplate.designData.colorScheme.background
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: activeTemplate.designData.layout === 'landscape' ? 'l' : 'p',
      unit: 'mm',
      format: [
        activeTemplate.designData.dimensions.width,
        activeTemplate.designData.dimensions.height
      ]
    });

    // Add canvas to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(
      imgData,
      'PNG',
      0,
      0,
      activeTemplate.designData.dimensions.width,
      activeTemplate.designData.dimensions.height
    );

    return Buffer.from(pdf.output('arraybuffer'));
  }

  private generateHTMLContent(data: CertificateData, template: CertificateTemplate): HTMLElement {
    const container = document.createElement('div');
    container.style.width = `${template.designData.dimensions.width}mm`;
    container.style.height = `${template.designData.dimensions.height}mm`;
    container.style.backgroundColor = template.designData.colorScheme.background;
    container.style.position = 'relative';
    container.style.fontFamily = template.designData.typography.body;
    container.style.color = template.designData.colorScheme.text;

    // Add border if enabled
    if (template.designData.elements.showBorder) {
      container.style.border = `3px solid ${template.designData.colorScheme.primary}`;
      container.style.borderRadius = '8px';
    }

    // Add content based on template type
    switch (template.templateType) {
      case CertificateType.COURSE_COMPLETION:
        this.addCourseCompletionContent(container, data, template);
        break;
      case CertificateType.SKILL_MASTERY:
        this.addSkillMasteryContent(container, data, template);
        break;
      case CertificateType.ACHIEVEMENT:
        this.addAchievementContent(container, data, template);
        break;
      case CertificateType.EXCELLENCE:
        this.addExcellenceContent(container, data, template);
        break;
      default:
        this.addCourseCompletionContent(container, data, template);
    }

    return container;
  }

  private addCourseCompletionContent(
    container: HTMLElement,
    data: CertificateData,
    template: CertificateTemplate
  ) {
    const { designData } = template;
    const { margin } = designData.dimensions;

    // Header section
    const header = document.createElement('div');
    header.style.textAlign = 'center';
    header.style.marginTop = `${margin}mm`;
    header.style.marginBottom = `${margin / 2}mm`;

    if (designData.elements.showLogo && data.organizationLogo) {
      const logo = document.createElement('img');
      logo.src = data.organizationLogo;
      logo.style.height = '40px';
      logo.style.marginBottom = '10px';
      header.appendChild(logo);
    }

    const title = document.createElement('h1');
    title.textContent = 'Certificate of Completion';
    title.style.fontSize = '36px';
    title.style.fontFamily = designData.typography.title;
    title.style.color = designData.colorScheme.primary;
    title.style.margin = '0';
    title.style.marginBottom = '10px';
    header.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = 'This is to certify that';
    subtitle.style.fontSize = '16px';
    subtitle.style.margin = '0';
    subtitle.style.marginBottom = '15px';
    header.appendChild(subtitle);

    container.appendChild(header);

    // Recipient name
    const recipientName = document.createElement('h2');
    recipientName.textContent = data.recipientName;
    recipientName.style.fontSize = '32px';
    recipientName.style.fontFamily = designData.typography.title;
    recipientName.style.color = designData.colorScheme.secondary;
    recipientName.style.textAlign = 'center';
    recipientName.style.margin = '0';
    recipientName.style.marginBottom = '15px';
    recipientName.style.borderBottom = `2px solid ${designData.colorScheme.secondary}`;
    recipientName.style.paddingBottom = '5px';
    recipientName.style.display = 'inline-block';
    container.appendChild(recipientName);

    // Course completion text
    const completionText = document.createElement('p');
    completionText.innerHTML = `has successfully completed the course<br><strong>${data.courseName}</strong>`;
    completionText.style.fontSize = '18px';
    completionText.style.textAlign = 'center';
    completionText.style.lineHeight = '1.6';
    completionText.style.margin = '20px 0';
    container.appendChild(completionText);

    // Performance metrics
    if (designData.elements.showGrade && data.grade) {
      const grade = document.createElement('p');
      grade.textContent = `Grade: ${data.grade}`;
      grade.style.fontSize = '14px';
      grade.style.textAlign = 'center';
      grade.style.margin = '5px 0';
      container.appendChild(grade);
    }

    if (designData.elements.showScore && data.finalScore) {
      const score = document.createElement('p');
      score.textContent = `Final Score: ${data.finalScore}%`;
      score.style.fontSize = '14px';
      score.style.textAlign = 'center';
      score.style.margin = '5px 0';
      container.appendChild(score);
    }

    if (designData.elements.showHours && data.hoursCompleted) {
      const hours = document.createElement('p');
      hours.textContent = `Total Hours: ${data.hoursCompleted}`;
      hours.style.fontSize = '14px';
      hours.style.textAlign = 'center';
      hours.style.margin = '5px 0';
      container.appendChild(hours);
    }

    // Footer section
    const footer = document.createElement('div');
    footer.style.position = 'absolute';
    footer.style.bottom = `${margin}mm`;
    footer.style.width = '100%';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';

    // Date and certificate number
    const leftInfo = document.createElement('div');
    leftInfo.style.textAlign = 'left';
    
    const date = document.createElement('p');
    date.textContent = `Date: ${data.issuedDate.toLocaleDateString()}`;
    date.style.fontSize = '12px';
    date.style.margin = '0';
    leftInfo.appendChild(date);

    const certNumber = document.createElement('p');
    certNumber.textContent = `Certificate No: ${data.certificateNumber}`;
    certNumber.style.fontSize = '12px';
    certNumber.style.margin = '5px 0 0 0';
    leftInfo.appendChild(certNumber);

    footer.appendChild(leftInfo);

    // QR Code for verification
    if (designData.elements.showQRCode) {
      const qrCode = document.createElement('div');
      qrCode.style.width = `${this.qrCodeSize}px`;
      qrCode.style.height = `${this.qrCodeSize}px`;
      qrCode.style.border = '1px solid #ccc';
      qrCode.style.display = 'flex';
      qrCode.style.alignItems = 'center';
      qrCode.style.justifyContent = 'center';
      qrCode.style.fontSize = '10px';
      qrCode.textContent = `Verify: ${data.verificationCode}`;
      footer.appendChild(qrCode);
    }

    // Signature
    if (designData.elements.showSignature) {
      const signature = document.createElement('div');
      signature.style.textAlign = 'right';
      
      const signatureLine = document.createElement('div');
      signatureLine.style.borderBottom = `1px solid ${designData.colorScheme.text}`;
      signatureLine.style.width = '150px';
      signatureLine.style.height = '40px';
      signatureLine.style.marginBottom = '5px';
      signature.appendChild(signatureLine);

      const instructorName = document.createElement('p');
      instructorName.textContent = data.instructorName;
      instructorName.style.fontSize = '12px';
      instructorName.style.margin = '0';
      instructorName.style.fontFamily = designData.typography.signature;
      signature.appendChild(instructorName);

      const title = document.createElement('p');
      title.textContent = 'Instructor';
      title.style.fontSize = '10px';
      title.style.margin = '0';
      signature.appendChild(title);

      footer.appendChild(signature);
    }

    container.appendChild(footer);
  }

  private addSkillMasteryContent(
    container: HTMLElement,
    data: CertificateData,
    template: CertificateTemplate
  ) {
    // Similar structure to course completion but with skill-focused content
    this.addCourseCompletionContent(container, data, template);
    
    // Override the title for skill mastery
    const title = container.querySelector('h1');
    if (title) {
      title.textContent = 'Certificate of Skill Mastery';
    }
  }

  private addAchievementContent(
    container: HTMLElement,
    data: CertificateData,
    template: CertificateTemplate
  ) {
    // Similar structure but with achievement-focused content
    this.addCourseCompletionContent(container, data, template);
    
    // Override the title for achievement
    const title = container.querySelector('h1');
    if (title) {
      title.textContent = 'Certificate of Achievement';
    }
  }

  private addExcellenceContent(
    container: HTMLElement,
    data: CertificateData,
    template: CertificateTemplate
  ) {
    // Similar structure but with excellence-focused content
    this.addCourseCompletionContent(container, data, template);
    
    // Override the title for excellence
    const title = container.querySelector('h1');
    if (title) {
      title.textContent = 'Certificate of Excellence';
    }
  }

  // Pre-defined templates
  static getDefaultTemplates(): CertificateTemplate[] {
    return [
      {
        id: 'professional-blue',
        name: 'Professional Blue',
        templateType: CertificateType.COURSE_COMPLETION,
        designData: {
          layout: 'landscape',
          colorScheme: {
            primary: '#1e40af',
            secondary: '#3b82f6',
            accent: '#fbbf24',
            text: '#374151',
            background: '#ffffff'
          },
          typography: {
            title: 'Playfair Display',
            body: 'Inter',
            signature: 'Dancing Script'
          },
          elements: {
            showLogo: true,
            showBorder: true,
            showWatermark: false,
            showQRCode: true,
            showSignature: true,
            showGrade: true,
            showScore: true,
            showHours: true
          },
          dimensions: {
            width: 297,
            height: 210,
            margin: 20
          }
        }
      },
      {
        id: 'elegant-gold',
        name: 'Elegant Gold',
        templateType: CertificateType.EXCELLENCE,
        designData: {
          layout: 'landscape',
          colorScheme: {
            primary: '#92400e',
            secondary: '#d97706',
            accent: '#fbbf24',
            text: '#374151',
            background: '#fefce8'
          },
          typography: {
            title: 'Playfair Display',
            body: 'Inter',
            signature: 'Dancing Script'
          },
          elements: {
            showLogo: true,
            showBorder: true,
            showWatermark: true,
            showQRCode: true,
            showSignature: true,
            showGrade: true,
            showScore: true,
            showHours: true
          },
          dimensions: {
            width: 297,
            height: 210,
            margin: 20
          }
        }
      },
      {
        id: 'modern-green',
        name: 'Modern Green',
        templateType: CertificateType.SKILL_MASTERY,
        designData: {
          layout: 'landscape',
          colorScheme: {
            primary: '#059669',
            secondary: '#10b981',
            accent: '#34d399',
            text: '#374151',
            background: '#ffffff'
          },
          typography: {
            title: 'Playfair Display',
            body: 'Inter',
            signature: 'Dancing Script'
          },
          elements: {
            showLogo: true,
            showBorder: true,
            showWatermark: false,
            showQRCode: true,
            showSignature: true,
            showGrade: true,
            showScore: true,
            showHours: true
          },
          dimensions: {
            width: 297,
            height: 210,
            margin: 20
          }
        }
      }
    ];
  }
}