const {execute} = require('@evershop/postgres-query-builder');

// eslint-disable-next-line no-multi-assign
module.exports = exports = async (connection) => {
    await execute(connection, `
    CREATE OR REPLACE FUNCTION product_image_update_trigger()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO event (name, data)
        VALUES ('product_image_updated', row_to_json(NEW));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`);

    await execute(connection, `
    CREATE TRIGGER "PRODUCT_IMAGE_UPDATED"
      AFTER UPDATE ON product_image
      FOR EACH ROW
      EXECUTE PROCEDURE product_image_update_trigger();`);
};