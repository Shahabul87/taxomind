'use client';

import type { HeroThemeConfig } from '../../../_config/hero-themes';
import { TiltImage } from './tilt-image';
import { StackedLayersImage } from './stacked-layers-image';
import { GlassFrameImage } from './glass-frame-image';
import { DiagonalSliceImage } from './diagonal-slice-image';
import { BrowserMockupImage } from './browser-mockup-image';
import { DashboardFrameImage } from './dashboard-frame-image';
import { ExecutiveCardImage } from './executive-card-image';
import { SocialEngagementImage } from './social-engagement-image';

export interface ImagePresentationProps {
  imageUrl: string | null;
  title: string;
  theme: HeroThemeConfig;
  shouldAnimate: boolean;
}

export function ImagePresentation(props: ImagePresentationProps) {
  switch (props.theme.imagePresentation.type) {
    case 'stacked-layers':
      return <StackedLayersImage {...props} />;
    case 'glass-frame':
      return <GlassFrameImage {...props} />;
    case 'diagonal-slice':
      return <DiagonalSliceImage {...props} />;
    case 'browser-mockup':
      return <BrowserMockupImage {...props} />;
    case 'dashboard-frame':
      return <DashboardFrameImage {...props} />;
    case 'executive-card':
      return <ExecutiveCardImage {...props} />;
    case 'social-engagement':
      return <SocialEngagementImage {...props} />;
    case '3d-tilt':
    default:
      return <TiltImage {...props} />;
  }
}
