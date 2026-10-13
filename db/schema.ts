import {sqliteTable,text,integer,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
export const tasks=sqliteTable('tasks',{id:text('id').primaryKey(),owner:text('owner').notNull(),latestVersion:text('latest_version').notNull(),createdAt:text('created_at').notNull()},table=>[index('tasks_owner_idx').on(table.owner)]);
export const versions=sqliteTable('versions',{id:text('id').primaryKey(),taskId:text('task_id').notNull(),number:integer('number').notNull(),state:text('state').notNull()},table=>[uniqueIndex('versions_task_number_idx').on(table.taskId,table.number)]);
