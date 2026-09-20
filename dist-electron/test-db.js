"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSQLite = testSQLite;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
function testSQLite() {
    const db = new better_sqlite3_1.default(":memory:");
    db.exec(`
    CREATE TABLE test (
      id INTEGER PRIMARY KEY,
      message TEXT NOT NULL
    );
  `);
    const insert = db.prepare("INSERT INTO test (message) VALUES (?)");
    insert.run("SQLite is working inside Electron");
    const result = db
        .prepare("SELECT * FROM test")
        .get();
    console.log("SQLite test result:", result);
    db.close();
}
