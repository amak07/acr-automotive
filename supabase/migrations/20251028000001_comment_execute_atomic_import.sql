-- Add documentation comment to execute_atomic_import function
COMMENT ON FUNCTION execute_atomic_import IS
  'Executes bulk import operations atomically. If ANY operation fails, ALL changes are rolled back automatically. This prevents partial imports that would leave the database in an inconsistent state.';
