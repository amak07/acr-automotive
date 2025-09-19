# ACR Design System

> **Custom component library for ACR Automotive built on shadcn/ui principles**

## Overview

The ACR Design System is our custom component library built specifically for ACR Automotive's auto parts management interface. It extends shadcn/ui patterns with our own design tokens, business requirements, and Mexican B2B market considerations.

## Core Philosophy

### Component Ownership Strategy
We follow a **"copy, don't import"** philosophy for UI components:
- **Full Control**: Own all components in our codebase for maximum customization
- **No External Dependencies**: Avoid breaking changes from third-party component libraries
- **Business Alignment**: Tailor components specifically for auto parts management workflows
- **Maintenance Freedom**: Modify components without upstream constraints

### Design Decisions

#### Mobile-First Approach
- **Primary Use Case**: Tablet interfaces at parts counter workstations
- **Touch Targets**: Minimum 44px for reliable finger interaction
- **Responsive Strategy**: Mobile-optimized with desktop enhancements
- **Performance Focus**: Fast loading for business-critical operations

#### Mexican B2B Market Focus
- **Language**: Spanish-first with English development support
- **Cultural Considerations**: Professional styling appropriate for Mexican business culture
- **Industry Standards**: Auto parts terminology and workflow patterns
- **Business Context**: Distributor and parts counter staff as primary users

## Design System Architecture

### Component Categories

#### Core Interface Components
- **AcrButton**: Primary interaction element with variants for different action types
- **AcrCard System**: Content containers with consistent spacing and hierarchy
- **AcrInput/AcrTextarea**: Text input with validation states and accessibility features

#### Form Components
- **AcrSelect**: Dropdown selections with keyboard navigation
- **AcrLabel**: Proper form control association and accessibility
- **Validation States**: Consistent error, disabled, and readonly styling

#### Layout Components
- **Responsive Grid**: Mobile-first layouts with desktop enhancements
- **Navigation Elements**: Breadcrumbs, pagination, and action buttons
- **Data Display**: Tables, cards, and stats presentations

## Visual Design System

### Color Strategy
#### Brand Colors
- **ACR Red**: Primary brand color for actions and emphasis
- **Professional Gray**: Neutral palette for text, backgrounds, and UI elements
- **Status Colors**: Semantic colors for success, warning, error, and informational states

#### Color Usage Philosophy
- **Conservative Approach**: Prioritize readability and professionalism over visual complexity
- **Accessibility First**: WCAG AA compliant contrast ratios throughout
- **Business Context**: Colors appropriate for professional auto parts environment
- **Semantic Meaning**: Consistent color meanings across all interfaces

## Layout Philosophy

### Responsive Strategy
#### Mobile-First Approach
- **Primary Design Target**: Start with mobile constraints
- **Progressive Enhancement**: Add complexity for larger screens
- **Touch Optimization**: Finger-friendly interactions on tablets
- **Content Priority**: Most important content accessible on small screens

#### Grid System Decisions
- **Mobile**: Single-column, stacked layouts for clarity
- **Tablet**: 2-3 column grids for efficient space usage
- **Desktop**: Up to 6 columns for comprehensive data display
- **Breakpoint Strategy**: Focus on `lg:` (1024px+) for desktop layouts

### Content Organization
#### Information Hierarchy
- **Card-Based Layout**: Consistent content containers with clear boundaries
- **Progressive Disclosure**: Complex information revealed through interaction
- **Scannable Design**: Easy to quickly find relevant information
- **Action-Oriented**: Clear paths to complete business tasks

## Technical Architecture

### Component Structure
#### File Organization
```
src/components/acr/
├── Button.tsx          # Core interaction component
├── Card.tsx           # Content container system
├── Input.tsx          # Form input components
├── Select.tsx         # Dropdown selection system
├── [other-components]
├── index.ts           # Central export
├── README.md          # Architecture documentation
└── REFERENCE.md       # Developer quick reference
```

#### Naming Strategy
- **Consistent Prefix**: All components use `Acr` prefix for clear identification
- **Descriptive Names**: Component purpose clear from name
- **Hierarchical**: Related components grouped (AcrCard, AcrCardHeader, AcrCardContent)

## Implementation Principles

### Development Approach
#### Component Development Lifecycle
1. **Business Requirement**: Start with specific auto parts management need
2. **Mobile Design**: Design for tablet/mobile use first
3. **Accessibility Review**: Ensure WCAG compliance and keyboard navigation
4. **Desktop Enhancement**: Add desktop-specific improvements
5. **Translation Integration**: Ensure all text supports internationalization

#### Quality Standards
- **Type Safety**: Full TypeScript support with strict typing
- **Accessibility**: Screen reader support and keyboard navigation
- **Performance**: Optimized for business-critical operations
- **Maintainability**: Clear component APIs and consistent patterns

## Accessibility Strategy

### Inclusive Design Approach
- **Universal Usability**: Components work for all users regardless of ability
- **Business Context**: Counter staff may have varying technical comfort levels
- **Keyboard-First**: Complete functionality available without mouse/touch
- **Screen Reader Support**: Full compatibility with assistive technologies

### Implementation Standards
- **WCAG AA Compliance**: Color contrast and interaction requirements met
- **Focus Management**: Clear visual indicators and logical tab order
- **Error Communication**: Accessible error messages and validation feedback
- **Touch Accessibility**: Minimum 44px touch targets for reliable interaction

## Internationalization Strategy

### Language-First Design
- **Spanish Primary**: Production interface designed for Mexican auto parts market
- **English Development**: Development and testing in English for efficiency
- **Cultural Adaptation**: Component text and patterns appropriate for Mexican business culture
- **Technical Terminology**: Auto parts industry terms preserved in original language when appropriate

### Implementation Approach
- **Translation Key Architecture**: All component text uses structured translation keys
- **Context-Aware**: Component text considers business workflow context
- **Graceful Fallbacks**: English fallbacks for missing Spanish translations during development

## Technical Considerations

### Browser Strategy
- **Modern Browser Focus**: Target current versions of Chrome, Safari, Edge, Firefox
- **Mobile Priority**: iOS Safari and Chrome Mobile as primary targets
- **Business Environment**: Optimized for typical business computer and tablet configurations

### Performance Philosophy
- **Business-Critical Speed**: Fast loading and interaction for parts counter operations
- **Bundle Efficiency**: Tree-shaking and component-level imports
- **Memory Management**: Efficient rendering for data-heavy interfaces
- **Network Optimization**: Minimize requests for business reliability

## Maintenance Approach

### Evolution Strategy
- **Usage-Driven Updates**: Component improvements based on actual business usage
- **Accessibility Audits**: Regular compliance reviews for inclusive design
- **Performance Monitoring**: Ongoing optimization for business-critical operations
- **Documentation Currency**: Keep documentation aligned with implementation reality

### Decision Documentation
- **Architectural Decisions**: Document major design system choices and rationale
- **Pattern Evolution**: Track how component patterns evolve with business needs
- **User Feedback Integration**: Incorporate real user feedback from parts counter staff

---

## Getting Started

**For Developers**: See `REFERENCE.md` for quick component usage and code examples.

**For Stakeholders**: This document outlines our design system philosophy and technical approach for the ACR Automotive interface.

**For Future Development**: All components follow these established patterns and principles for consistency and maintainability.