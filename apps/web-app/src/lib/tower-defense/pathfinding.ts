import type { Position } from './game-types';

export function findPath(
  start: Position,
  goals: Position[],
  towerPositions: Position[],
  gridSize: number,
): Position[] | null {
  const isTower = (x: number, y: number) =>
    towerPositions.some((t) => t.x === x && t.y === y);

  const isGoal = (x: number, y: number) =>
    goals.some((g) => g.x === x && g.y === y);

  const isValid = (x: number, y: number) => {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return false;
    if (isGoal(x, y)) return true;
    if (x === start.x && y === start.y) return true;
    return !isTower(x, y);
  };

  const heuristic = (p: Position) => {
    let min = Number.POSITIVE_INFINITY;
    for (const goal of goals) {
      const dist = Math.abs(p.x - goal.x) + Math.abs(p.y - goal.y);
      if (dist < min) min = dist;
    }
    return min;
  };

  const openSet: Position[] = [start];
  const closedSet = new Set<string>();
  const cameFrom = new Map<string, Position>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  const key = (p: Position) => `${p.x},${p.y}`;
  gScore.set(key(start), 0);
  fScore.set(key(start), heuristic(start));

  let iterations = 0;
  const maxIterations = gridSize * gridSize * 2;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    let currentIndex = 0;
    const firstPos = openSet[0];
    if (!firstPos) break;
    let lowestF = fScore.get(key(firstPos)) || Number.POSITIVE_INFINITY;
    for (let i = 1; i < openSet.length; i++) {
      const pos = openSet[i];
      if (!pos) continue;
      const f = fScore.get(key(pos)) || Number.POSITIVE_INFINITY;
      if (f < lowestF) {
        lowestF = f;
        currentIndex = i;
      }
    }

    const current = openSet[currentIndex];
    if (!current) break;
    openSet.splice(currentIndex, 1);
    const currentKey = key(current);

    if (isGoal(current.x, current.y)) {
      const path: Position[] = [current];
      let temp = current;
      while (cameFrom.has(key(temp))) {
        const nextTemp = cameFrom.get(key(temp));
        if (!nextTemp) break;
        temp = nextTemp;
        path.unshift(temp);
      }
      return path;
    }

    closedSet.add(currentKey);

    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ];

    for (const neighbor of neighbors) {
      const neighborKey = key(neighbor);

      if (!isValid(neighbor.x, neighbor.y) || closedSet.has(neighborKey)) {
        continue;
      }

      const tentativeGScore = (gScore.get(currentKey) || 0) + 1;

      const existingGScore = gScore.get(neighborKey);
      if (existingGScore === undefined || tentativeGScore < existingGScore) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor));

        if (!openSet.some((p) => key(p) === neighborKey)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null;
}

export function findPathsForMultipleStartsAndGoals(
  starts: Position[],
  goals: Position[],
  towerPositions: Position[],
  gridSize: number,
): (Position[] | null)[] {
  // If only one goal, just return paths from each start to that goal
  if (goals.length === 1) {
    return starts.map((start) =>
      findPath(start, goals, towerPositions, gridSize),
    );
  }

  // Calculate all possible paths from each start to each goal
  const pathMatrix: (Position[] | null)[][] = starts.map((start) =>
    goals.map((goal) => findPath(start, [goal], towerPositions, gridSize)),
  );

  // Track which goals have been assigned
  const goalAssigned = new Array(goals.length).fill(false);
  const startAssignments: number[] = new Array(starts.length).fill(-1);

  // First pass: assign each start to its closest valid goal that hasn't been assigned yet
  // This ensures each goal gets at least one path if possible
  for (let startIdx = 0; startIdx < starts.length; startIdx++) {
    let bestGoalIdx = -1;
    let shortestPath: Position[] | null = null;

    for (let goalIdx = 0; goalIdx < goals.length; goalIdx++) {
      // Skip if this goal already has an assignment and there are more starts than goals
      if (goalAssigned[goalIdx] && startIdx < goals.length) continue;

      const paths = pathMatrix[startIdx];
      if (!paths) continue;
      const path = paths[goalIdx];
      if (
        path &&
        (shortestPath === null || path.length < shortestPath.length)
      ) {
        shortestPath = path;
        bestGoalIdx = goalIdx;
      }
    }

    if (bestGoalIdx !== -1) {
      startAssignments[startIdx] = bestGoalIdx;
      goalAssigned[bestGoalIdx] = true;
    }
  }

  // Return the assigned paths
  return starts.map((_start, idx) => {
    const assignedGoalIdx = startAssignments[idx];
    if (assignedGoalIdx === undefined || assignedGoalIdx === -1) return null;
    const paths = pathMatrix[idx];
    if (!paths) return null;
    return paths[assignedGoalIdx] ?? null;
  });
}
