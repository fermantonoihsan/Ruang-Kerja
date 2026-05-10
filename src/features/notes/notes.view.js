export function getSelectedPage(state = {}) {
  const pages = state.pages || [];
  return pages.find((page) => page.id === state.selectedPageId) || pages[0] || null;
}

export function getPageListViewModel(state = {}) {
  return {
    pages: state.pages || [],
    selectedPageId: state.selectedPageId || null
  };
}