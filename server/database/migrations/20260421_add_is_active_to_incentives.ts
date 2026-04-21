export async function up(knex: any): Promise<void> {
  await knex.schema.alterTable('incentives', (table: any) => {
    table.boolean('is_active').notNullable().defaultTo(true);
  });
}

export async function down(knex: any): Promise<void> {
  await knex.schema.alterTable('incentives', (table: any) => {
    table.dropColumn('is_active');
  });
}
