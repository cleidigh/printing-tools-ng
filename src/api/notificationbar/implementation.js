/*eslint no-fallthrough: ["error", { "commentPattern": "break[\\s\\w]*omitted" }]*/

"use strict";

var { EventEmitter, EventManager, ExtensionAPI } = ExtensionCommon;
var { ExtensionError } = ExtensionUtils;
var { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

class Notification {
  constructor(notificationId, properties, parent) {
    this.closedByUser = true;
    this.notificationId = notificationId;
    this.properties = properties;
    this.parent = parent;

    let iconURL =
      properties.icon && !properties.icon.includes(":")
        ? parent.extension.baseURI.resolve(properties.icon)
        : null;

    let self = this;
    let buttons = properties.buttons.map(function(button) {
      return {
        id: button.id,
        label: button.label,
        accesskey: button.accesskey,
        callback() {
          // Fire the event and keep the notification open, decided to close it
          // based on the return values later.
          self.parent.emitter
            .emit(
              "buttonclicked",
              self.properties.windowId,
              self.notificationId,
              button.id
            )
            .then(rv => {
              let keepOpen = rv.some(value => value?.close === false);
              if (!keepOpen) {
                self.remove(/* closedByUser */ true);
              }
            });

          // Keep the notification box open until we hear from the event
          // handlers.
          return true;
        },
      };
    });

    let callback = function(event) {
      // Every dismissed notification will also generate a removed notification
      if (event === "dismissed") {
        self.parent.emitter.emit(
          "dismissed",
          self.properties.windowId,
          self.notificationId
        );
      }
      if (event === "removed") {
        self.parent.emitter.emit(
          "closed",
          self.properties.windowId,
          self.notificationId,
          self.closedByUser
        );
        self.cleanup();
      }
    };

    let element = this.getNotificationBox().appendNotification(
      properties.label,
      `extension-notification-${notificationId}`,
      iconURL,
      properties.priority,
      buttons,
      callback
    );
    let whitelist = ["background", "color", "margin", "padding", "font"];

    if (properties.style) {
      let sanitizedStyles = Object.keys(properties.style).filter(style => {
        let parts = style.split("-");
        return (
          // check if first part is in whitelist
          parts.length > 0 &&
          whitelist.includes(parts[0]) &&
          // validate second part (if any) being a simple word
          (parts.length == 1 ||
            (parts.length == 2 && /^[a-zA-Z0-9]+$/.test(parts[1])))
        );
      });

      for (let style of sanitizedStyles) {
        element.style[style] = properties.style[style];
      }
    }
  }

  getNotificationBox() {
    let w = this.parent.extension.windowManager.get(
      this.properties.windowId,
      this.parent.context
    ).window;
    switch (this.properties.placement) {
      case "message":
        // below the receipient list in the message preview window
        if (w.gMessageNotificationBar) {
          return w.gMessageNotificationBar.msgNotificationBar;
        }
      // break omitted

      default:
      case "bottom":
        // default bottom notification in the mail3:pane
        if (w.specialTabs) {
          return w.specialTabs.msgNotificationBar;
        }
        // default bottom notification in message composer window and
        // most calendar dialogs (currently windows.onCreated event does not see these)
        if (w.gNotification) {
          return w.gNotification.notificationbox;
        }
        // if there is no default bottom box, use our own
        if (!w.gExtensionNotificationBottomBox) {
          let statusbar = w.document.querySelector('hbox[class~="statusbar"]');
          w.gExtensionNotificationBottomBox = new w.MozElements.NotificationBox(
            element => {
              element.id = "extension-notification-bottom-box";
              element.setAttribute("notificationside", "bottom");
              if (statusbar) {
                w.document.documentElement.insertBefore(element, statusbar);
              } else {
                w.document.documentElement.append(element);
              }
            }
          );
        }
        return w.gExtensionNotificationBottomBox;

      case "top":
        if (!w.gExtensionNotificationTopBox) {
          // try to add it before the toolbox, if that fails add it firstmost
          let toolbox = w.document.querySelector("toolbox");
          if (toolbox) {
            w.gExtensionNotificationTopBox = new w.MozElements.NotificationBox(
              element => {
                element.id = "extension-notification-top-box";
                element.setAttribute("notificationside", "top");
                toolbox.parentElement.insertBefore(
                  element,
                  toolbox.nextElementSibling
                );
              }
            );
          } else {
            w.gExtensionNotificationTopBox = new w.MozElements.NotificationBox(
              element => {
                element.id = "extension-notification-top-box";
                element.setAttribute("notificationside", "top");
                w.document.documentElement.insertBefore(
                  element,
                  w.document.documentElement.firstChild
                );
              }
            );
          }
        }
        return w.gExtensionNotificationTopBox;
    }
  }

  remove(closedByUser) {
    // The remove() method is called by button clicks and by notificationBox.clear()
    // but not by dismissal. In that case, the default value defined in the constructor
    // defines the value of closedByUser which is used by the event emitter.
    this.closedByUser = closedByUser;
    let notificationBox = this.getNotificationBox();
    let notification = notificationBox.getNotificationWithValue(
      `extension-notification-${this.notificationId}`
    );
    notificationBox.removeNotification(notification);
  }

  cleanup() {
    this.parent.notificationsMap.delete(this.notificationId);
  }
}

var notificationbar = class extends ExtensionAPI {
  constructor(extension) {
    super(extension);
    this.notificationsMap = new Map();
    this.emitter = new EventEmitter();
    this.nextId = 1;
    Services.obs.addObserver(this, "domwindowclosed");
  }

  onShutdown() {
    Services.obs.removeObserver(this, "domwindowclosed");
    for (let notification of this.notificationsMap.values()) {
      notification.remove(/* closedByUser */ false);
    }
  }

  // Observer for the domwindowclosed notification, to remove
  // obsolete notifications from the notificationsMap.
  observe(aSubject, aTopic, aData) {
    let win = this.context.extension.windowManager.convert(aSubject);
    this.notificationsMap.forEach((value, key) => {
      if (value.properties.windowId == win.id) {
        this.notificationsMap.delete(key);
      }
    });
  }

  getAPI(context) {
    this.context = context;
    let self = this;

    return {
      notificationbar: {
        async create(properties) {
          let notificationId = self.nextId++;
          self.notificationsMap.set(
            notificationId,
            new Notification(notificationId, properties, self)
          );
          return notificationId;
        },

        async clear(notificationId) {
          if (self.notificationsMap.has(notificationId)) {
            self.notificationsMap
              .get(notificationId)
              .remove(/* closedByUser */ false);
            return true;
          }
          return false;
        },

        async getAll() {
          let result = {};
          self.notificationsMap.forEach((value, key) => {
            result[key] = value.properties;
          });
          return result;
        },

        onDismissed: new EventManager({
          context,
          name: "notificationbar.onDismissed",
          register: fire => {
            let listener = (event, windowId, notificationId) => {
              fire.async(windowId, notificationId);
            };

            self.emitter.on("dismissed", listener);
            return () => {
              self.emitter.off("dismissed", listener);
            };
          },
        }).api(),

        onClosed: new EventManager({
          context,
          name: "notificationbar.onClosed",
          register: fire => {
            let listener = (event, windowId, notificationId, closedByUser) => {
              fire.async(windowId, notificationId, closedByUser);
            };

            self.emitter.on("closed", listener);
            return () => {
              self.emitter.off("closed", listener);
            };
          },
        }).api(),

        onButtonClicked: new EventManager({
          context,
          name: "notificationbar.onButtonClicked",
          register: fire => {
            let listener = (event, windowId, notificationId, buttonId) => {
              return fire.async(windowId, notificationId, buttonId);
            };

            self.emitter.on("buttonclicked", listener);
            return () => {
              self.emitter.off("buttonclicked", listener);
            };
          },
        }).api(),
      },
    };
  }
};
