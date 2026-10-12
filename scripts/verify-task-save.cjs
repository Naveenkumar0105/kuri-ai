// Run with: node scripts/verify-task-save.cjs
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");

async function main() {
    const pending = [];
    const errors = [];
    let calendarCalls = 0;
    let failSave = false;
    const mocks = {
        "next/server": { NextResponse: Response, after: (callback) => pending.push(callback) },
        "next-auth": { getServerSession: async () => ({ user: { id: "user-1" } }) },
        "@/lib/auth": { authOptions: {} },
        "@/lib/prisma": { prisma: { task: { create: async ({ data }) => {
            if (failSave) throw new Error("Database unavailable");
            return { id: "task-1", ...data };
        } } } },
        "@/lib/calendar": { addToGoogleCalendar: async () => {
            calendarCalls++;
            throw new Error("Google Calendar is not linked");
        } },
    };
    const source = readFileSync(resolve(__dirname, "../src/app/api/tasks/route.ts"), "utf8");
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    });
    const exports = {};
    runInNewContext(outputText, {
        exports,
        require: (name) => { assert.ok(name in mocks, `Unexpected import: ${name}`); return mocks[name]; },
        console: { error: (...args) => errors.push(args) },
    });
    const save = (body) => exports.POST(new Request("http://localhost/api/tasks", {
        method: "POST", body: JSON.stringify(body),
    }));

    const response = await save({ text: "Call tomorrow", dueDate: "2026-10-04T12:00:00Z" });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id, "task-1");
    assert.equal(calendarCalls, 0, "Saving must finish before calendar sync starts");
    assert.equal(pending.length, 1);
    await pending.shift()();
    assert.equal(calendarCalls, 1);
    assert.equal(errors.length, 1, "Calendar failure should be logged without failing the save");

    assert.equal((await save({ text: "Buy milk" })).status, 200);
    assert.equal(pending.length, 0, "Undated tasks need no calendar sync");
    assert.equal((await save({ text: " " })).status, 400);
    failSave = true;
    assert.equal((await save({ text: "Call tomorrow", dueDate: "2026-10-04T12:00:00Z" })).status, 500);
    assert.equal(pending.length, 0, "Failed saves must not schedule calendar sync");
    console.log("Task save regression checks passed");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
