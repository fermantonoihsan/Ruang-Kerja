export function getDashboardViewModel(state = {}) {
  const pages = state.pages || [];

  return {
    totalPages: pages.length,
    ideasCount: pages.filter((page) => page.status === "ideas").length,
    doingCount: pages.filter((page) => page.status === "doing").length,
    reviewCount: pages.filter((page) => page.status === "review").length,
    doneCount: pages.filter((page) => page.status === "done").length,
    dueReminderCount: pages.filter((page) => page.reminderAt && !page.reminderDone).length,
    recentPages: [...pages]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 5)
  };
}