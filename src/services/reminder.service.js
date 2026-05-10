export function isReminderDue(reminderAt, now = new Date()) {
  if (!reminderAt) {
    return false;
  }

  const reminderDate = new Date(reminderAt);

  if (Number.isNaN(reminderDate.getTime())) {
    return false;
  }

  return reminderDate <= now;
}

export function getDueReminders(pages = [], now = new Date()) {
  return pages.filter((page) => {
    return page.reminderAt && !page.reminderDone && isReminderDue(page.reminderAt, now);
  });
}

export function getUpcomingReminders(pages = [], now = new Date()) {
  return pages
    .filter((page) => {
      if (!page.reminderAt || page.reminderDone) {
        return false;
      }

      const reminderDate = new Date(page.reminderAt);
      return !Number.isNaN(reminderDate.getTime()) && reminderDate > now;
    })
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt));
}

export async function requestReminderPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  return Notification.requestPermission();
}

export function showReminderNotification(page) {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  new Notification(page.title || "Reminder", {
    body: "Reminder dari Atlas Workspace",
    icon: "/icons/icon-192.png"
  });

  return true;
}