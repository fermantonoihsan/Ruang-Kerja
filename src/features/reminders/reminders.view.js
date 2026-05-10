import { getDueReminders, getUpcomingReminders } from "../../services/reminder.service.js";

export function getReminderViewModel(state = {}) {
  const pages = state.pages || [];

  return {
    due: getDueReminders(pages),
    upcoming: getUpcomingReminders(pages)
  };
}