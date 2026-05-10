import "./services/firebase.service.js";
import "./services/storage.service.js";
import "./services/markdown.service.js";
import "./services/reminder.service.js";

import "./state/store.js";

import "./features/auth/auth.controller.js";
import "./features/auth/auth.service.js";
import "./features/auth/auth.view.js";

import "./features/editor/editor.controller.js";
import "./features/editor/editor.view.js";
import "./features/editor/editor.events.js";

import "./features/kanban/kanban.controller.js";
import "./features/kanban/kanban.view.js";
import "./features/kanban/kanban.dragdrop.js";

import "./features/reminders/reminders.controller.js";
import "./features/reminders/reminders.view.js";

import "./features/pages/pages.controller.js";
import "./features/pages/pages.view.js";

import "../app.js";