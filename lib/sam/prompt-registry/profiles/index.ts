/**
 * Profile Auto-Registration
 *
 * Importing this module registers all profiles with the registry.
 * Each profile file calls registerProfile() at module scope.
 */

// Phase 1: New profiles for routes with inline prompts
import './chapter-content';
import './chapter-sections';
import './exam-generation';
import './bulk-chapters';

// Phase 2: Wrapper profiles around existing prompt builders
import './course-stage-1';
import './course-stage-2';
import './course-stage-3';
import './skill-roadmap';
import './depth-analysis';
