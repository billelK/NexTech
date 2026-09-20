import Database from "better-sqlite3";

export function testSQLite() {
  const db = new Database(":memory:");

  db.exec(`
    CREATE TABLE test (
      id INTEGER PRIMARY KEY,
      message TEXT NOT NULL
    );
  `);

  const insert = db.prepare(
    "INSERT INTO test (message) VALUES (?)"
  );

  insert.run("SQLite is working inside Electron");

  const result = db
    .prepare("SELECT * FROM test")
    .get() as {
      id: number;
      message: string;
    };

  console.log("SQLite test result:", result);

  db.close();
}