#!/usr/bin/env node
// REPL driver for Super Planner 9000 (Vite dev server + React + Playwright Chromium).
// An agent drives this via stdin (typically wrapped in tmux send-keys/capture-pane).
// Usage: node .claude/skills/run-app/driver.mjs
//   then: launch / nav / wait-for / click / fill / screenshot / console / quit

import { chromium } from "playwright";
import * as readline from "node:readline";
import * as fs from "node:fs";
import * as path from "node:path";

const SHOT_DIR = process.env.SCREENSHOT_DIR || "/tmp/shots";
const APP_URL = process.env.APP_URL || "http://localhost:5173/super-planner-9000/";
fs.mkdirSync(SHOT_DIR, { recursive: true });

let browser = null;
let page = null;
const consoleMessages = [];

const COMMANDS = {
  async launch() {
    if (browser) return console.log("already launched");
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
    page = await browser.newPage();
    page.on("console", (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
    page.on("pageerror", (err) => consoleMessages.push({ type: "pageerror", text: err.message }));
    console.log("launched.");
  },

  async nav(url) {
    if (!page) return console.log("ERROR: launch first");
    const target = url || APP_URL;
    await page.goto(target, { waitUntil: "domcontentloaded" });
    console.log("nav ->", target);
  },

  async "wait-for"(arg) {
    if (!page) return console.log("ERROR: launch first");
    try {
      if (arg.startsWith("text=")) {
        await page.getByText(arg.slice(5)).first().waitFor({ timeout: 10_000 });
      } else {
        await page.waitForSelector(arg, { timeout: 10_000 });
      }
      console.log("found:", arg);
    } catch {
      console.log("TIMEOUT:", arg);
    }
  },

  async screenshot(name) {
    if (!page) return console.log("ERROR: launch first");
    const file = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + ".png");
    await page.screenshot({ path: file });
    console.log("screenshot:", file);
  },

  async "screenshot-element"(arg) {
    if (!page) return console.log("ERROR: launch first");
    const [sel, name] = arg.split(/\s+/);
    const file = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + ".png");
    await page.locator(sel).first().screenshot({ path: file });
    console.log("screenshot:", file);
  },

  async click(sel) {
    if (!page) return console.log("ERROR: launch first");
    await page.locator(sel).first().click();
    console.log("click", sel);
  },

  async "click-text"(text) {
    if (!page) return console.log("ERROR: launch first");
    await page.getByText(text).first().click();
    console.log("click-text", JSON.stringify(text));
  },

  async fill(arg) {
    if (!page) return console.log("ERROR: launch first");
    const [sel, ...rest] = arg.split(/\s+/);
    const value = rest.join(" ");
    await page.locator(sel).first().fill(value);
    console.log("fill", sel, "=", JSON.stringify(value));
  },

  async type(text) {
    if (!page) return console.log("ERROR: launch first");
    await page.keyboard.type(text, { delay: 30 });
  },

  async press(key) {
    if (!page) return console.log("ERROR: launch first");
    await page.keyboard.press(key);
  },

  async text(sel) {
    if (!page) return console.log("ERROR: launch first");
    const result = await page.evaluate(
      (s) => (s ? document.querySelector(s) : document.body)?.innerText ?? "(null)",
      sel || null
    );
    console.log(result);
  },

  async eval(expr) {
    if (!page) return console.log("ERROR: launch first");
    try {
      console.log(JSON.stringify(await page.evaluate(expr)));
    } catch (e) {
      console.log("ERROR:", e.message);
    }
  },

  console(arg) {
    const errorsOnly = arg?.trim() === "--errors";
    const items = errorsOnly
      ? consoleMessages.filter((m) => m.type === "error" || m.type === "pageerror")
      : consoleMessages;

    if (items.length === 0) {
      console.log(errorsOnly ? "(no errors)" : "(no console output)");
    } else {
      items.forEach((m) => console.log(`[${m.type}] ${m.text}`));
    }
  },

  async quit() {
    if (browser) await browser.close().catch(() => {});
    browser = null;
    page = null;
  },

  help() {
    console.log("commands:", Object.keys(COMMANDS).join(", "));
  }
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "driver> " });

rl.on("line", async (line) => {
  const trimmed = line.trim();

  if (!trimmed) {
    return rl.prompt();
  }

  const spaceIndex = trimmed.indexOf(" ");
  const cmd = spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex);
  const rest = spaceIndex === -1 ? "" : trimmed.slice(spaceIndex + 1);
  const fn = COMMANDS[cmd];

  if (!fn) {
    console.log("unknown:", cmd, "— try: help");
    return rl.prompt();
  }

  try {
    await fn(rest);
  } catch (e) {
    console.log("ERROR:", e.message);
  }

  if (cmd === "quit") {
    rl.close();
    process.exit(0);
  }

  rl.prompt();
});

rl.on("close", async () => {
  await COMMANDS.quit();
  process.exit(0);
});

console.log(`Super Planner 9000 driver — "help" for commands, "launch" to start (target: ${APP_URL})`);
rl.prompt();
