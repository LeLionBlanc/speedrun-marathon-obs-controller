export async function up(knex: any): Promise<void> {
  await knex.schema.createTable('incentives', (table: any) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.text('description');
    table.decimal('target_amount', 14, 2).notNullable();
    table.decimal('current_amount', 14, 2).notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('incentive_updates', (table: any) => {
    table.increments('id').primary();
    table.integer('incentive_id').unsigned().notNullable();
    table.decimal('amount', 14, 2).notNullable();
    table.timestamp('timestamp').defaultTo(knex.fn.now());
    table.text('notes');
    table.foreign('incentive_id').references('id').inTable('incentives').onDelete('CASCADE');
  });
}

export async function down(knex: any): Promise<void> {
  await knex.schema.dropTableIfExists('incentive_updates');
  await knex.schema.dropTableIfExists('incentives');
}