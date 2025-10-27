# Baseboard Configurator

Optimize baseboard cuts and minimize waste with smart board length selection and cutting plans.

## Overview

Baseboard Configurator is a web application that helps you plan baseboard installations efficiently. Enter your wall measurements, select available board lengths, and get an optimized cutting plan that minimizes material waste. The app uses advanced bin packing algorithms to determine the most efficient way to cut your baseboards.

## Features

### Core Functionality
- **Smart Cut Optimization**: Uses Best Fit Decreasing bin packing algorithm to minimize waste
- **Multiple Board Length Support**: Select from common board lengths (48", 72", 96", 120", 144")
- **Saw Kerf Compensation**: Accounts for blade width in calculations
- **Real-time Updates**: Automatically recalculates as you modify inputs
- **Balanced Splits**: Option to split oversized measurements evenly instead of greedy cutting

### Advanced Features
- **Configuration Management**: Save and load configurations for different projects
- **Export Functionality**: Export cutting plans for reference
- **Room & Wall Labels**: Organize measurements by room and wall for easy reference
- **1/16" Precision**: Measurements snap to 1/16" increments for practical woodworking
- **Visual Results**: Clear display of boards, cuts, and waste calculations

### User Experience
- Clean, modern interface built with shadcn/ui components
- Responsive design works on desktop and mobile
- Increment measurements by 1/16" for precise input
- Dark mode support

## How to Use

### Basic Workflow

1. **Add Measurements**
   - Enter wall measurements in inches
   - Optionally label measurements by room and wall
   - Use the increment buttons for 1/16" precision
   - Add multiple measurement rows as needed

2. **Select Board Lengths**
   - Choose which board lengths are available at your store
   - Common lengths: 48", 72", 96", 120", 144"
   - Select multiple lengths for optimal results

3. **Adjust Saw Kerf**
   - Default is 0.125" (1/8")
   - Adjust based on your saw blade width

4. **Review Results**
   - See the cutting plan organized by board
   - View total boards needed by length
   - Check total waste in inches
   - Each board shows all cuts to make

### Advanced Features

#### Split Long Measurements
For measurements longer than your longest board:
- Toggle "Split Evenly" to divide into balanced pieces
- Without splitting: creates one large piece and one small piece
- With splitting: creates multiple equal-sized pieces

#### Save Configurations
- Save your current configuration for later
- Load previous configurations
- Great for multiple rooms or projects

#### Export Plans
- Export your cutting plan to reference while working
- Includes all measurements and cutting instructions

## Technology Stack

- **Runtime**: Bun
- **Framework**: React 19
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: Jotai
- **Type Safety**: TypeScript

## Algorithm

The app uses a **Best Fit Decreasing** bin packing algorithm:

1. Sorts measurements from largest to smallest
2. Tries multiple packing strategies:
   - Individual board lengths
   - All available lengths together
   - Pairs of board lengths (when ≤ 4 options)
3. For each cut, finds the existing board with the least remaining space
4. If no board fits, opens the smallest new board that works
5. Selects the strategy with minimum waste (fewer boards as tie-breaker)

For oversized measurements with "Split Evenly" enabled:
- Calculates minimum number of pieces needed
- Divides measurement into equal pieces (1/16" precision)
- Adjusts last piece to ensure exact total

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Built with care for woodworkers and DIY enthusiasts.
