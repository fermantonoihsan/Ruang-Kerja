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

export async function showReminderNotification(page) {
  if (!("Notification" in window)) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  const title = page.title || "Reminder";
  const options = {
    body: "Reminder from Atlas Workspace",
    icon: "/favicon.svg",
    tag: `atlas-reminder-${page.id || title}`,
    renotify: true,
  };

  if (navigator.serviceWorker?.ready) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration?.showNotification) {
        await registration.showNotification(title, options);
        return true;
      }
    } catch (error) {
      console.warn("[reminder.service] Service worker notification failed:", error);
    }
  }

  new Notification(title, options);

  return true;
}
