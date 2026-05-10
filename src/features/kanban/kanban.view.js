const DEFAULT_COLUMNS = ["ideas", "doing", "review", "done"];

export function groupPagesByStatus(pages = [], columns = DEFAULT_COLUMNS) {
  return columns.reduce((groups, status) => {
    groups[status] = pages.filter((page) => page.status === status);
    return groups;
  }, {});
}