export async function up(knex: any): Promise<void> {
  // Add type column to incentives: 'goal' (default) or 'bid_war'
  await knex.schema.alterTable('incentives', (table: any) => {
    table.string('type').notNullable().defaultTo('goal');
  });

  // Create bid_war_options table
  await knex.schema.createTable('bid_war_options', (table: any) => {
    table.increments('id').primary();
    table.integer('incentive_id').unsigned().notNullable();
    table.string('name').notNullable();
    table.decimal('amount', 14, 2).notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('incentive_id')
      .references('id')
      .inTable('incentives')
      .onDelete('CASCADE');
  });
}

export async function down(knex: any): Promise<void> {
  await knex.schema.dropTableIfExists('bid_war_options');
  await knex.schema.alterTable('incentives', (table: any) => {
    table.dropColumn('type');
  });
}
