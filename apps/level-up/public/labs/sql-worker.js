/* SQLite runs in a disposable worker. It never receives a server connection. */
globalThis.importScripts('./vendor/sql-wasm-browser.js');
const engine = globalThis.initSqlJs({ locateFile: (file) => new URL(`./vendor/${file}`, globalThis.location.href).href });

globalThis.onmessage = async ({ data }) => {
  let database;

  try {
    const { sql, fixture } = data;
    if (typeof sql !== 'string' || !sql.trim() || sql.length > 8000) {
      throw new Error('Enter a query of 1–8,000 characters.');
    }
    const start = sql.replace(/^\s*(?:(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)\s*)*/, '');
    if (!/^(SELECT|WITH|EXPLAIN)\b/i.test(start)) {
      throw new Error('Use one SELECT, WITH or EXPLAIN query. The dataset is read-only.');
    }
    const SQL = await engine;
    database = new SQL.Database();
    database.run('PRAGMA hard_heap_limit = 33554432');
    for (const table of fixture.tables) {
      database.run(
        `CREATE TABLE "${table.name}" (${table.columns.map((c) => `"${c.name}" ${c.type}`).join(', ')})`,
      );
      const insert = database.prepare(
        `INSERT INTO "${table.name}" VALUES (${table.columns.map(() => '?').join(', ')})`,
      );
      try {
        for (const row of table.rows) insert.run(row);
      } finally {
        insert.free();
      }
    }
    database.run('PRAGMA query_only = ON');
    let count = 0;
    let result;
    globalThis.postMessage({ type: 'executing' });
    for (const statement of database.iterateStatements(sql)) {
      count++;
      if (count > 1) throw new Error('Run one query at a time.');
      const columns = statement.getColumnNames();
      if (columns.length > 30) throw new Error('Select at most 30 columns.');
      const rows = [];
      let truncated = false;
      while (statement.step()) {
        if (rows.length >= 200) {
          truncated = true;
          break;
        }
        rows.push(
          statement.get().map((value) => {
            if (typeof value === 'string' && value.length > 1000) {
              truncated = true;
              return value.slice(0, 1000) + '…';
            }
            if (value instanceof Uint8Array) {
              if (value.length > 200) truncated = true;
              return (
                '0x' +
                Array.from(value.slice(0, 200), (byte) => byte.toString(16).padStart(2, '0')).join(
                  '',
                )
              );
            }
            return value;
          }),
        );
      }
      result = { ok: true, columns, rows, truncated };
    }
    if (count !== 1) throw new Error('Enter one SQL query.');
    globalThis.postMessage(result);
  } catch (error) {
    globalThis.postMessage({
      ok: false,
      error: error instanceof Error ? error.message.slice(0, 300) : 'Query failed.',
    });
  } finally {
    database?.close();
  }
};
