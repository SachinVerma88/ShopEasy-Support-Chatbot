import fs from 'fs';
import path from 'path';
import { prisma } from './index';

/**
 * Splits a SQL file into individual statements for execution.
 * Prisma cannot run multiple commands in a single prepared statement.
 */
function splitSqlStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) =>
      statement
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((statement) => statement.length > 0);
}

/**
 * Runs SQL migration files from the migrations directory.
 */
async function migrate(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    const statements = splitSqlStatements(sql);

    console.log(`Running migration: ${file} (${statements.length} statements)`);

    for (const statement of statements) {
      await prisma.$executeRawUnsafe(statement);
    }

    console.log(`Completed: ${file}`);
  }

  console.log('All migrations completed successfully.');
}

migrate()
  .catch((err: unknown) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
