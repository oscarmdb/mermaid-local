/**
 * Mermaid Configuration with Strict Security
 * 
 * SECURITY: 
 * - securityLevel: 'strict' - Prevents script execution
 * - No external font loading - Uses system fonts only
 * - External Iconify API allowed for architecture icons
 */

import mermaid from 'mermaid';

let iconsRegistered = false;

export interface MermaidThemeConfig {
  theme: 'default' | 'dark' | 'forest' | 'neutral' | 'base';
  themeVariables?: Record<string, string>;
}

// Light theme configuration
export const lightThemeConfig: MermaidThemeConfig = {
  theme: 'default',
  themeVariables: {
    // Use system fonts only - no external font loading
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    
    // Primary colors
    primaryColor: '#6366f1',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#4f46e5',
    
    // Secondary colors
    secondaryColor: '#f1f5f9',
    secondaryTextColor: '#1e293b',
    secondaryBorderColor: '#e2e8f0',
    
    // Tertiary colors
    tertiaryColor: '#ecfdf5',
    tertiaryTextColor: '#065f46',
    tertiaryBorderColor: '#a7f3d0',
    
    // Line and text colors
    lineColor: '#64748b',
    textColor: '#1e293b',
    
    // Background
    mainBkg: '#ffffff',
    
    // Notes
    noteBkgColor: '#fef3c7',
    noteTextColor: '#92400e',
    noteBorderColor: '#fcd34d',
    
    // Flowchart specific
    nodeBorder: '#4f46e5',
    clusterBkg: '#f8fafc',
    clusterBorder: '#e2e8f0',
    
    // Sequence diagram
    actorBkg: '#6366f1',
    actorTextColor: '#ffffff',
    actorBorder: '#4f46e5',
    actorLineColor: '#94a3b8',
    signalColor: '#1e293b',
    signalTextColor: '#1e293b',
    labelBoxBkgColor: '#f1f5f9',
    labelBoxBorderColor: '#e2e8f0',
    labelTextColor: '#1e293b',
    loopTextColor: '#1e293b',
    activationBkgColor: '#e0e7ff',
    activationBorderColor: '#6366f1',
    sequenceNumberColor: '#ffffff',
    
    // Git graph
    git0: '#6366f1',
    git1: '#10b981',
    git2: '#f59e0b',
    git3: '#ef4444',
    git4: '#8b5cf6',
    git5: '#06b6d4',
    git6: '#ec4899',
    git7: '#84cc16',
    gitBranchLabel0: '#ffffff',
    gitBranchLabel1: '#ffffff',
    gitBranchLabel2: '#ffffff',
    gitBranchLabel3: '#ffffff',
    
    // State diagram
    labelColor: '#1e293b',
    altBackground: '#f8fafc',
    
    // Class diagram
    classText: '#1e293b',
    
    // Pie chart
    pie1: '#6366f1',
    pie2: '#10b981',
    pie3: '#f59e0b',
    pie4: '#ef4444',
    pie5: '#8b5cf6',
    pie6: '#06b6d4',
    pie7: '#ec4899',
    pie8: '#84cc16',
    pie9: '#14b8a6',
    pie10: '#f97316',
    pie11: '#a855f7',
    pie12: '#0ea5e9',
    pieStrokeColor: '#ffffff',
    pieSectionTextColor: '#ffffff',
    pieLegendTextColor: '#1e293b',
  },
};

// Dark theme configuration
export const darkThemeConfig: MermaidThemeConfig = {
  theme: 'dark',
  themeVariables: {
    // Use system fonts only - no external font loading
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '14px',
    
    // Primary colors - using darker text for contrast on light node backgrounds
    primaryColor: '#fbbf24',
    primaryTextColor: '#1e1e1e',
    primaryBorderColor: '#f59e0b',
    
    // Secondary colors
    secondaryColor: '#1e293b',
    secondaryTextColor: '#1e1e1e',
    secondaryBorderColor: '#334155',
    
    // Tertiary colors
    tertiaryColor: '#064e3b',
    tertiaryTextColor: '#1e1e1e',
    tertiaryBorderColor: '#059669',
    
    // Line and text colors - using dark text for node labels
    lineColor: '#94a3b8',
    textColor: '#e2e8f0',
    
    // Background
    mainBkg: '#0f172a',
    
    // Node text specifically for dark mode - ensure contrast
    nodeTextColor: '#1e1e1e',
    
    // Notes
    noteBkgColor: '#422006',
    noteTextColor: '#fcd34d',
    noteBorderColor: '#92400e',
    
    // Flowchart specific
    nodeBorder: '#f59e0b',
    clusterBkg: '#1e293b',
    clusterBorder: '#334155',
    
    // Sequence diagram
    actorBkg: '#818cf8',
    actorTextColor: '#0f172a',
    actorBorder: '#6366f1',
    actorLineColor: '#64748b',
    signalColor: '#e2e8f0',
    signalTextColor: '#e2e8f0',
    labelBoxBkgColor: '#1e293b',
    labelBoxBorderColor: '#334155',
    labelTextColor: '#e2e8f0',
    loopTextColor: '#e2e8f0',
    activationBkgColor: '#312e81',
    activationBorderColor: '#818cf8',
    sequenceNumberColor: '#0f172a',
    
    // Git graph
    git0: '#818cf8',
    git1: '#34d399',
    git2: '#fbbf24',
    git3: '#f87171',
    git4: '#a78bfa',
    git5: '#22d3ee',
    git6: '#f472b6',
    git7: '#a3e635',
    gitBranchLabel0: '#0f172a',
    gitBranchLabel1: '#0f172a',
    gitBranchLabel2: '#0f172a',
    gitBranchLabel3: '#0f172a',
    
    // State diagram
    labelColor: '#e2e8f0',
    altBackground: '#1e293b',
    
    // Class diagram
    classText: '#e2e8f0',
    
    // Pie chart
    pie1: '#818cf8',
    pie2: '#34d399',
    pie3: '#fbbf24',
    pie4: '#f87171',
    pie5: '#a78bfa',
    pie6: '#22d3ee',
    pie7: '#f472b6',
    pie8: '#a3e635',
    pie9: '#2dd4bf',
    pie10: '#fb923c',
    pie11: '#c084fc',
    pie12: '#38bdf8',
    pieStrokeColor: '#0f172a',
    pieSectionTextColor: '#0f172a',
    pieLegendTextColor: '#e2e8f0',
  },
};

/**
 * Initialize Mermaid with strict security settings
 */
export function initializeMermaid(isDark: boolean = false): void {
  const themeConfig = isDark ? darkThemeConfig : lightThemeConfig;
  
  // Register icon packs once
  if (!iconsRegistered) {
    try {
      mermaid.registerIconPacks([
        {
          name: 'logos',
          loader: async () => {
            const icons = [
              'aws-lambda', 'aws-dynamodb', 'aws-aurora', 'aws-s3', 'aws-ec2',
              'aws-api-gateway', 'aws-cloudfront', 'aws-route53', 'aws-open-search',
              'kubernetes', 'docker-icon', 'google-cloud', 'microsoft-azure',
              'mongodb-icon', 'mongodb'
            ];
            const response = await fetch(`https://api.iconify.design/logos.json?icons=${icons.join(',')}`);
            return await response.json();
          },
        },
        {
          name: 'lucide',
          loader: async () => {
            const icons = [
              'server', 'database', 'cloud', 'user', 'hard-drive', 'globe', 'zap', 'box'
            ];
            const response = await fetch(`https://api.iconify.design/lucide.json?icons=${icons.join(',')}`);
            return await response.json();
          },
        },
      ]);
      iconsRegistered = true;
    } catch (error) {
      console.error('Failed to register icon packs:', error);
    }
  }

  mermaid.initialize({
    // SECURITY: Strict mode - no script execution allowed
    securityLevel: 'strict',
    
    // Start on load disabled - we control rendering manually
    startOnLoad: false,
    
    // Theme configuration
    theme: themeConfig.theme,
    themeVariables: themeConfig.themeVariables,
    
    // Logging for debugging (can be disabled in production)
    logLevel: 'error',
    
    // Flowchart defaults
    flowchart: {
      htmlLabels: true,
      curve: 'basis',
      padding: 15,
      useMaxWidth: true,
    },
    
    // Sequence diagram defaults
    sequence: {
      diagramMarginX: 50,
      diagramMarginY: 10,
      actorMargin: 50,
      width: 150,
      height: 65,
      boxMargin: 10,
      boxTextMargin: 5,
      noteMargin: 10,
      messageMargin: 35,
      mirrorActors: true,
      useMaxWidth: true,
    },
    
    // Gantt chart defaults
    gantt: {
      titleTopMargin: 25,
      barHeight: 20,
      barGap: 4,
      topPadding: 50,
      leftPadding: 75,
      gridLineStartPadding: 35,
      fontSize: 11,
      useMaxWidth: true,
    },
    
    // State diagram defaults
    state: {
      dividerMargin: 10,
      sizeUnit: 5,
      padding: 8,
      textHeight: 10,
      titleShift: -15,
      noteMargin: 10,
      forkWidth: 70,
      forkHeight: 7,
      useMaxWidth: true,
    },
    
    // Class diagram defaults
    class: {
      useMaxWidth: true,
    },
    
    // ER diagram defaults
    er: {
      diagramPadding: 20,
      layoutDirection: 'TB',
      minEntityWidth: 100,
      minEntityHeight: 75,
      entityPadding: 15,
      stroke: 'gray',
      fill: 'honeydew',
      fontSize: 12,
      useMaxWidth: true,
    },
    
    // Pie chart defaults
    pie: {
      textPosition: 0.75,
      useMaxWidth: true,
    },
    
    // Mindmap defaults
    mindmap: {
      useMaxWidth: true,
      padding: 10,
    },
    
    // Timeline defaults
    timeline: {
      useMaxWidth: true,
    },
    
    // Git graph defaults
    gitGraph: {
      useMaxWidth: true,
    },
    
    // Architecture diagram defaults
    architecture: {
      useMaxWidth: true,
      fontSize: 14,
      padding: 10,
    },
  });
}

/**
 * Render a Mermaid diagram
 * Returns the SVG string or throws an error
 */
export async function renderDiagram(
  code: string,
  elementId: string,
  isDark: boolean = false
): Promise<string> {
  // Re-initialize with correct theme before rendering
  initializeMermaid(isDark);
  
  try {
    const { svg } = await mermaid.render(elementId, code);
    return svg;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate Mermaid syntax without rendering
 */
export async function validateSyntax(code: string): Promise<{ valid: boolean; error?: string }> {
  try {
    await mermaid.parse(code);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown syntax error',
    };
  }
}

export { mermaid };
