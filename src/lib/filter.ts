export interface FilterState {
  category: string;
  difficulty: string;
}

export function matchesFilter(card: { category: string; difficulty: string }, state: FilterState): boolean {
  const categoryOk = state.category === 'all' || card.category === state.category;
  const difficultyOk = state.difficulty === 'all' || card.difficulty === state.difficulty;
  return categoryOk && difficultyOk;
}
