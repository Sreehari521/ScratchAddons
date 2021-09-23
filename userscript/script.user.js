// ==UserScript==
// @name         Scratch Addons
// @namespace    https://scratchaddons.com/
// @version      0.0.1
// @author
// @description
// @homepage     https://scratchaddons.com/
// @icon         https://userscript.scratchaddons.cf/images/icon.svg
// @updateURL    https://userscript.scratchaddons.cf/userscript/script.user.js
// @supportURL   https://scratchaddons.com/feedback
// @match        https://scratch.mit.edu/*
// @require      https://userscript.scratchaddons.cf/content-scripts/prototype-handler.js
// @require      https://userscript.scratchaddons.cf/content-scripts/load-redux.js
// @require      https://userscript.scratchaddons.cf/content-scripts/fix-console.js
// @require      https://userscript.scratchaddons.cf/libraries/common/cs/text-color.js
// @run-at       document-start
// @grant        none
// ==/UserScript==

document.documentElement.append(
  Object.assign(document.createElement("script"), {
    src: "https://userscript.scratchaddons.cf/webpages/check-unsupported.js",
    type: "module",
  })
);

// https://stackoverflow.com/a/47614491/11866686
function setInnerHTML(elm, html) {
  elm.innerHTML = html;
  Array.from(elm.querySelectorAll("script")).forEach((oldScript) => {
    const newScript = document.createElement("script");
    Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

if (/^\/(scratch\-addons\-extension|sa\-ext)\/settings\/?$/i.test(location.pathname)) {
  window.stop();
  document.documentElement.innerHTML = "";
  fetch("https://raw.githubusercontent.com/SA-Userscript/ScratchAddons/master/webpages/settings/scratch.html")
    .then((r) => r.text())
    .then((html) => {
      const dom = new DOMParser().parseFromString(html, "text/html");
      setInnerHTML(document.documentElement.innerHTML, dom.documentElement.innerHTML);
    });
} else {
  document.documentElement.append(
    Object.assign(document.createElement("script"), {
      src: "https://userscript.scratchaddons.cf/userscript/module.js",
      type: "module",
    })
  );

  if (typeof scratchAddons === "undefined") window.scratchAddons = {};
  window.scratchAddons = { ...scratchAddons, classNames: { loaded: false }, session: {} };
  scratchAddons.eventTargets = {
    auth: [],
    settings: [],
    tab: [],
    self: [],
  };
  function loadClasses() {
    scratchAddons.classNames.arr = [
      ...new Set(
        [...document.styleSheets]
          .filter(
            (styleSheet) =>
              !(
                styleSheet.ownerNode.textContent.startsWith(
                  "/* DO NOT EDIT\n@todo This file is copied from GUI and should be pulled out into a shared library."
                ) &&
                (styleSheet.ownerNode.textContent.includes("input_input-form") ||
                  styleSheet.ownerNode.textContent.includes("label_input-group_"))
              )
          )
          .map((e) => {
            try {
              return [...e.cssRules];
            } catch (e) {
              return [];
            }
          })
          .flat()
          .map((e) => e.selectorText)
          .filter((e) => e)
          .map((e) => e.match(/(([\w-]+?)_([\w-]+)_([\w\d-]+))/g))
          .filter((e) => e)
          .flat()
      ),
    ];
    scratchAddons.classNames.loaded = true;

    const fixPlaceHolderClasses = () =>
      document.querySelectorAll("[class*='scratchAddonsScratchClass/']").forEach((el) => {
        [...el.classList]
          .filter((className) => className.startsWith("scratchAddonsScratchClass"))
          .map((className) => className.substring(className.indexOf("/") + 1))
          .forEach((classNameToFind) =>
            el.classList.replace(
              `scratchAddonsScratchClass/${classNameToFind}`,
              scratchAddons.classNames.arr.find(
                (className) =>
                  className.startsWith(classNameToFind + "_") && className.length === classNameToFind.length + 6
              ) || `scratchAddonsScratchClass/${classNameToFind}`
            )
          );
      });

    fixPlaceHolderClasses();
    new MutationObserver(fixPlaceHolderClasses).observe(document.documentElement, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  }

  if (document.querySelector("title")) loadClasses();
  else {
    const stylesObserver = new MutationObserver(() => {
      if (document.querySelector("title")) {
        stylesObserver.disconnect();
        loadClasses();
      }
    });
    stylesObserver.observe(document.documentElement, { childList: true, subtree: true });
  }
  const consoleOutput = (logAuthor = "[page]") => {
    const style = {
      leftPrefix: "background:  #ff7b26; color: white; border-radius: 0.5rem 0 0 0.5rem; padding: 0 0.5rem",
      rightPrefix:
        "background: #222; color: white; border-radius: 0 0.5rem 0.5rem 0; padding: 0 0.5rem; font-weight: bold",
      text: "",
    };
    return [`%cSA%c${logAuthor}%c`, style.leftPrefix, style.rightPrefix, style.text];
  };
  scratchAddons.console = {
    log: _realConsole.log.bind(_realConsole, ...consoleOutput()),
    warn: _realConsole.warn.bind(_realConsole, ...consoleOutput()),
    error: _realConsole.error.bind(_realConsole, ...consoleOutput()),
    logForAddon: (addonId) => _realConsole.log.bind(_realConsole, ...consoleOutput(addonId)),
    warnForAddon: (addonId) => _realConsole.warn.bind(_realConsole, ...consoleOutput(addonId)),
    errorForAddon: (addonId) => _realConsole.error.bind(_realConsole, ...consoleOutput(addonId)),
  };

  scratchAddons.methods = {};
}
