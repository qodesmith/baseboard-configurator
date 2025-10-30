# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Baseboard Configurator is a web application that optimizes baseboard cuts using bin packing algorithms. Users input wall measurements, select available board lengths, and get cutting plans that minimize waste.

## Development Commands

### Core Commands
- `bun dev` - Start development server with hot reloading
- `bun start` - Start production server
- `bun run build` - Build the application for production

### Code Quality
- `bun run check` - Run Biome checks (lint + format)
- `bun run check:fix` - Fix Biome issues automatically
- `bun run lint` - Run linting only
- `bun run lint:fix` - Fix linting issues
- `bun run format` - Check formatting
- `bun run format:fix` - Fix formatting issues

### Testing
- Test file: `src/lib/optimizeBaseboards.test.ts`
- No test runner script configured - run tests with `bun test` if needed

## Architecture

### Tech Stack
- **Runtime**: Bun with file-based routing
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Jotai atoms
- **Code Quality**: Biome (extends @qodestack/biome-config/react)

### Core Structure

**Server**: `src/index.ts` - Bun server with API routes and SPA serving
**App**: `src/App.tsx` - Root component with theme management
**Main Component**: `src/components/BaseboardConfigurator.tsx` - Core logic coordinator

### Key Components
- `MeasurementInputs.tsx` - Wall measurement input with room/wall labeling
- `BoardLengthSelector.tsx` - Available board length selection
- `ResultsDisplay.tsx` - Cutting plan visualization
- `ConfigurationManager.tsx` - Save/load configurations

### State Management (Jotai)
Located in `src/lib/atoms.ts`:
- `measurementsAtom` - Wall measurements with room/wall labels
- `availableLengthsAtom` - Selected board lengths
- `kerfAtom` - Saw blade width for cut calculations

### Core Algorithm
`src/lib/utils.ts` contains the `optimizeBaseboards` function using Best Fit Decreasing bin packing:
1. Tests multiple strategies (individual lengths, combinations, pairs)
2. Sorts measurements largest to smallest
3. Fits cuts to boards with least remaining space
4. Handles oversized measurements with even splitting option
5. Re-optimizes split pieces into existing boards to minimize waste

### UI Components
Located in `src/components/ui/` - shadcn/ui components with Tailwind styling

### Styling Conventions
- Use the `cn()` utility function from `src/lib/utils.ts` for conditional classNames
- `cn()` combines `clsx` and `tailwind-merge` for proper Tailwind class merging

### Code Style Guidelines
- **Line Length**: Maximum 80 characters per line
- **Comments**:
  - Single-line comments ≤80 characters: ALWAYS use `//` syntax - DO NOT convert to JSDoc
  - Multi-line comments >80 characters: use JSDoc-style `/** */` syntax
  - Each line in multi-line comments must stay within 80 character limit
  - Exception: Suppression comments (biome-ignore, @ts-ignore, etc.) can exceed 80 characters and remain single-line
  - IMPORTANT: Never convert short `//` comments to `/** */` format if the line is ≤80 characters

## Key Features
- Real-time optimization as inputs change
- 1/16" measurement precision
- Configuration save/load functionality
- Export cutting plans
- Balanced vs greedy splitting for oversized measurements
- Room and wall labeling for organization