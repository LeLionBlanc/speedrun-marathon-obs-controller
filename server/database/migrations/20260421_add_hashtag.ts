export async function up(knex: any): Promise<void> {
  await knex.schema.alterTable('incentives', (table: any) => {
    table.string('hashtag').nullable();
  });

  await knex.schema.alterTable('bid_war_options', (table: any) => {
    table.string('hashtag').nullable();
  });
}

export async function down(knex: any): Promise<void> {
  await knex.schema.alterTable('incentives', (table: any) => {
    table.dropColumn('hashtag');
  });
  await knex.schema.alterTable('bid_war_options', (table: any) => {
    table.dropColumn('hashtag');
  });
}
