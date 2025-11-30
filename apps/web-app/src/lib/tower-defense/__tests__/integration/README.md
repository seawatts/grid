# Integration Tests - Domain-Driven Structure

This directory contains integration tests organized by domain/feature area. Each test file focuses on a specific domain of the game engine, making it easier to understand, maintain, and extend the test suite.

## Test Organization

### Core Game Flow
- **`game-flow-integration.test.ts`** - Complete game lifecycle, wave progression, full game scenarios

### Game Systems
- **`tower-integration.test.ts`** - Tower system: firing, upgrades, adjacent bonuses, all tower types
- **`enemy-integration.test.ts`** - Enemy system: movement, types, slow effects, reaching goals
- **`wave-integration.test.ts`** - Wave system: difficulty scaling, boss waves, adaptive difficulty
- **`pathfinding-integration.test.ts`** - Pathfinding: path recalculation, multiple starts/goals

### Economy & Progression
- **`economy-integration.test.ts`** - Money system: earning from kills, wave bonuses, multiple kills
- **`combo-integration.test.ts`** - Combo system: building combos, timeout resets

### Power-ups & Items
- **`powerup-integration.test.ts`** - Wave power-ups: damage boosts, fire rate boosts
- **`item-integration.test.ts`** - Placeable items: generation, traps on paths

### Game State
- **`game-over-integration.test.ts`** - Game over conditions: win/loss detection
- **`state-persistence-integration.test.ts`** - State management: maintaining state across updates

### Performance & Edge Cases
- **`performance-integration.test.ts`** - Stress tests: many enemies, many projectiles
- **`edge-cases-integration.test.ts`** - Edge cases: empty state, no path, paused state

## Shared Resources

### `integration-test-setup.ts`
Contains shared setup and utilities:
- `requestAnimationFrame` mock for Node/Bun environment
- `runGameUntil()` helper for running game until conditions are met

### `../test-helpers.ts`
Contains test data factories:
- `createTestState()` - Create game state with defaults
- `createTestEnemy()` - Create enemy test data
- `createTestTower()` - Create tower test data
- `advanceUntilCondition()` - Helper for conditional test execution

## Running Tests

Run all integration tests:
```bash
bun test apps/web-app/src/lib/tower-defense/__tests__/integration/
```

Run a specific domain:
```bash
bun test apps/web-app/src/lib/tower-defense/__tests__/integration/tower-integration.test.ts
```

## Test Principles

1. **Domain-Driven**: Each file tests a specific domain/feature area
2. **Isolated**: Tests can run independently, but share common setup
3. **Comprehensive**: Tests cover happy paths, edge cases, and error conditions
4. **Maintainable**: Clear naming, focused scope, easy to understand

## Adding New Tests

When adding new integration tests:

1. **Identify the domain** - Which feature/system does it test?
2. **Choose the right file** - Add to existing domain file or create new one
3. **Use shared helpers** - Leverage `test-helpers.ts` and `integration-test-setup.ts`
4. **Follow naming** - Use descriptive test names that explain what is being tested
5. **Keep focused** - Each test should verify one specific behavior

