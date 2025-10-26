# Baseboard Configurator Project Plan

## Project Overview
A web application to optimize baseboard cutting plans, minimizing waste when cutting baseboards from available lengths of lumber.

## Technology Stack
- **Runtime**: Bun (instead of Node.js)
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Server**: Bun.serve() with built-in HMR
- **Testing**: bun:test
- **Code Quality**: Biome (linting and formatting)

## Completed Work

### 1. Core Algorithm Implementation
**File**: [src/lib/utils.ts](src/lib/utils.ts)

Implemented the `optimizeBaseboards` function using the **First Fit Decreasing** algorithm:

**Key Features**:
- Sorts measurements by size (largest first) for optimal packing
- Tries to fit cuts into existing boards before opening new ones
- Uses smallest available board that fits each measurement
- Handles oversized measurements that require multiple boards
- Accounts for saw kerf (blade width) between cuts
- Calculates waste and provides summary statistics

**Algorithm Logic**:
1. Sort measurements from largest to smallest
2. For each measurement:
   - If oversized (> max board length): split across multiple boards
   - Otherwise: try to fit in existing boards
   - If doesn't fit: open new board (smallest that fits)
3. Calculate totals and waste

**Types Defined**:
- `Measurement`: Input data (id, size)
- `BaseboardConfig`: Input configuration (measurements, available lengths, kerf)
- `Cut`: Individual cut on a board
- `Board`: Board with its cuts
- `BaseboardResult`: Output with boards and summary stats

### 2. Comprehensive Test Suite
**File**: [src/lib/optimizeBaseboards.test.ts](src/lib/optimizeBaseboards.test.ts)

**13 test cases** covering:
- ✅ Single measurement fitting
- ✅ Multiple measurements on one board
- ✅ Multiple boards required
- ✅ Oversized measurements splitting
- ✅ First Fit Decreasing algorithm verification
- ✅ Custom kerf values
- ✅ Waste calculation accuracy
- ✅ Board counts summary
- ✅ Complex real-world scenarios
- ✅ Very large measurements

All tests passing using `bun test`.

### 3. Server Setup
**File**: [src/index.ts](src/index.ts)

Basic Bun server configured with:
- HTML routing (serves index.html)
- Example API endpoints (/api/hello)
- HMR (Hot Module Replacement) enabled in development
- Automatic browser opening on start

**Scripts Available**:
- `bun run dev` - Development mode with hot reload
- `bun run start` - Production mode
- `bun run check` - Run Biome checks
- `bun test` - Run test suite

## Next Steps: Frontend Application

### Phase 1: UI Design & Components
1. **Input Form**:
   - Add measurement inputs (wall name/id + size in inches)
   - Dynamic add/remove measurement rows
   - Available board lengths selection (checkboxes for 96", 120", 144")
   - Kerf input (default 0.125")
   - Form validation

2. **Results Display**:
   - Visual representation of each board with cuts
   - Color-coded cuts by measurement ID
   - Shopping list (board counts by length)
   - Waste summary statistics
   - Total cost estimate (if prices provided)

3. **UI Components** (using Radix UI + Tailwind):
   - Input fields with labels
   - Add/remove buttons
   - Select dropdowns
   - Results cards/panels
   - Responsive layout

### Phase 2: Integration
1. Connect form to `optimizeBaseboards` function
2. Real-time calculation on input change
3. Display formatted results
4. Add print/export functionality

### Phase 3: Enhancements (Future)
- Save/load configurations
- Multiple projects management
- PDF export of cutting plans
- Cost calculator with lumber prices
- Unit conversion (inches/feet/cm)
- Board visualization with SVG
- Undo/redo functionality
- Share cutting plans via URL

## File Structure
```
baseboard-configurator/
├── src/
│   ├── index.ts           # Bun server entry point
│   ├── index.html         # Main HTML file
│   ├── lib/
│   │   ├── utils.ts       # Core optimization algorithm + types
│   │   └── optimizeBaseboards.test.ts  # Test suite
│   └── components/        # (To be created) React components
├── package.json
├── CLAUDE.md             # Development guidelines (use Bun)
└── plan.md               # This file
```

## Design Principles
1. **User-Friendly**: Simple, clear interface for non-technical users
2. **Efficient**: Real-time optimization without page reloads
3. **Accurate**: Properly account for kerf and provide reliable results
4. **Accessible**: Follow accessibility best practices
5. **Mobile-Ready**: Responsive design for use on job sites

## Success Criteria
- User can input measurements and get optimized cutting plan
- Results clearly show which cuts go on which boards
- Shopping list helps user buy correct materials
- Waste is minimized through smart optimization
- Interface is intuitive for contractors/DIYers
