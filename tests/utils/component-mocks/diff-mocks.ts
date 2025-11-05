// ============================================================================
// Diff Test Utilities - Mock data for diff preview component testing
// ============================================================================

/**
 * Diff item (matches component interface)
 */
export interface DiffItem<T = any> {
  operation: 'add' | 'update' | 'delete' | 'unchanged';
  row?: T;
  before?: T;
  after?: T;
  changes?: string[];
}

/**
 * Sheet diff (matches component interface)
 */
export interface SheetDiff<T = any> {
  sheetName: string;
  adds: DiffItem<T>[];
  updates: DiffItem<T>[];
  deletes: DiffItem<T>[];
  unchanged: DiffItem<T>[];
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
  };
}

/**
 * Diff result (matches component interface)
 */
export interface DiffResult {
  parts: SheetDiff;
  vehicleApplications: SheetDiff;
  crossReferences: SheetDiff;
  summary: {
    totalAdds: number;
    totalUpdates: number;
    totalDeletes: number;
    totalUnchanged: number;
    totalChanges: number;
    changesBySheet: {
      parts: number;
      vehicleApplications: number;
      crossReferences: number;
    };
  };
}

/**
 * Validation warning (matches component interface)
 */
export interface ValidationWarning {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  sheet?: string;
  row?: number;
  column?: string;
  value?: any;
  expected?: any;
}

/**
 * Create a mock part object
 */
export function createMockPart(overrides?: Partial<any>): any {
  return {
    _id: '123e4567-e89b-12d3-a456-426614174000',
    acr_sku: 'ACR-001',
    part_type: 'Rotor',
    position_type: 'Front',
    abs_type: 'With ABS',
    bolt_pattern: '5x114.3',
    drive_type: 'FWD',
    specifications: 'Premium brake rotor',
    ...overrides,
  };
}

/**
 * Create a mock diff item for ADD operation
 */
export function createMockAddItem<T = any>(row?: T): DiffItem<T> {
  return {
    operation: 'add',
    row: row || createMockPart() as T,
  };
}

/**
 * Create a mock diff item for UPDATE operation
 */
export function createMockUpdateItem<T = any>(
  before?: T,
  after?: T,
  changes?: string[]
): DiffItem<T> {
  return {
    operation: 'update',
    before: before || createMockPart() as T,
    after: after || createMockPart({ part_type: 'Pad' }) as T,
    changes: changes || ['part_type'],
  };
}

/**
 * Create a mock diff item for DELETE operation
 */
export function createMockDeleteItem<T = any>(row?: T): DiffItem<T> {
  return {
    operation: 'delete',
    row: row || createMockPart() as T,
  };
}

/**
 * Create a mock sheet diff
 */
export function createMockSheetDiff(
  adds: DiffItem[] = [],
  updates: DiffItem[] = [],
  deletes: DiffItem[] = [],
  unchanged: DiffItem[] = []
): SheetDiff {
  return {
    sheetName: 'Parts',
    adds,
    updates,
    deletes,
    unchanged,
    summary: {
      totalAdds: adds.length,
      totalUpdates: updates.length,
      totalDeletes: deletes.length,
      totalUnchanged: unchanged.length,
    },
  };
}

/**
 * Create an empty diff result (no changes)
 */
export function createEmptyDiffResult(): DiffResult {
  const emptySheetDiff = createMockSheetDiff();

  return {
    parts: emptySheetDiff,
    vehicleApplications: { ...emptySheetDiff, sheetName: 'Vehicle Applications' },
    crossReferences: { ...emptySheetDiff, sheetName: 'Cross References' },
    summary: {
      totalAdds: 0,
      totalUpdates: 0,
      totalDeletes: 0,
      totalUnchanged: 0,
      totalChanges: 0,
      changesBySheet: {
        parts: 0,
        vehicleApplications: 0,
        crossReferences: 0,
      },
    },
  };
}

/**
 * Create a diff result with only additions
 */
export function createDiffResultWithAdds(count: number = 3): DiffResult {
  const adds = Array.from({ length: count }, (_, i) =>
    createMockAddItem(createMockPart({ acr_sku: `ACR-ADD-${i + 1}` }))
  );

  const partsDiff = createMockSheetDiff(adds);

  return {
    parts: partsDiff,
    vehicleApplications: createMockSheetDiff(),
    crossReferences: createMockSheetDiff(),
    summary: {
      totalAdds: count,
      totalUpdates: 0,
      totalDeletes: 0,
      totalUnchanged: 0,
      totalChanges: count,
      changesBySheet: {
        parts: count,
        vehicleApplications: 0,
        crossReferences: 0,
      },
    },
  };
}

/**
 * Create a diff result with only updates
 */
export function createDiffResultWithUpdates(count: number = 3): DiffResult {
  const updates = Array.from({ length: count }, (_, i) =>
    createMockUpdateItem(
      createMockPart({ acr_sku: `ACR-UPD-${i + 1}`, part_type: 'Rotor' }),
      createMockPart({ acr_sku: `ACR-UPD-${i + 1}`, part_type: 'Pad' }),
      ['part_type']
    )
  );

  const partsDiff = createMockSheetDiff([], updates);

  return {
    parts: partsDiff,
    vehicleApplications: createMockSheetDiff(),
    crossReferences: createMockSheetDiff(),
    summary: {
      totalAdds: 0,
      totalUpdates: count,
      totalDeletes: 0,
      totalUnchanged: 0,
      totalChanges: count,
      changesBySheet: {
        parts: count,
        vehicleApplications: 0,
        crossReferences: 0,
      },
    },
  };
}

/**
 * Create a diff result with only deletes
 */
export function createDiffResultWithDeletes(count: number = 3): DiffResult {
  const deletes = Array.from({ length: count }, (_, i) =>
    createMockDeleteItem(createMockPart({ acr_sku: `ACR-DEL-${i + 1}` }))
  );

  const partsDiff = createMockSheetDiff([], [], deletes);

  return {
    parts: partsDiff,
    vehicleApplications: createMockSheetDiff(),
    crossReferences: createMockSheetDiff(),
    summary: {
      totalAdds: 0,
      totalUpdates: 0,
      totalDeletes: count,
      totalUnchanged: 0,
      totalChanges: count,
      changesBySheet: {
        parts: count,
        vehicleApplications: 0,
        crossReferences: 0,
      },
    },
  };
}

/**
 * Create a diff result with mixed operations
 */
export function createMixedDiffResult(
  addCount: number = 2,
  updateCount: number = 2,
  deleteCount: number = 2
): DiffResult {
  const adds = Array.from({ length: addCount }, (_, i) =>
    createMockAddItem(createMockPart({ acr_sku: `ACR-ADD-${i + 1}` }))
  );

  const updates = Array.from({ length: updateCount }, (_, i) =>
    createMockUpdateItem(
      createMockPart({ acr_sku: `ACR-UPD-${i + 1}`, part_type: 'Rotor' }),
      createMockPart({ acr_sku: `ACR-UPD-${i + 1}`, part_type: 'Pad' }),
      ['part_type']
    )
  );

  const deletes = Array.from({ length: deleteCount }, (_, i) =>
    createMockDeleteItem(createMockPart({ acr_sku: `ACR-DEL-${i + 1}` }))
  );

  const partsDiff = createMockSheetDiff(adds, updates, deletes);
  const totalChanges = addCount + updateCount + deleteCount;

  return {
    parts: partsDiff,
    vehicleApplications: createMockSheetDiff(),
    crossReferences: createMockSheetDiff(),
    summary: {
      totalAdds: addCount,
      totalUpdates: updateCount,
      totalDeletes: deleteCount,
      totalUnchanged: 0,
      totalChanges,
      changesBySheet: {
        parts: totalChanges,
        vehicleApplications: 0,
        crossReferences: 0,
      },
    },
  };
}

/**
 * Create a diff result with pagination (>20 items per section)
 */
export function createLargeDiffResult(): DiffResult {
  return createMixedDiffResult(25, 30, 15);
}

/**
 * Create a diff result with system updates
 */
export function createDiffResultWithSystemUpdates(): DiffResult {
  const vehicleUpdates = Array.from({ length: 5 }, (_, i) =>
    createMockUpdateItem(
      { _id: `va-${i}`, make: 'Toyota' },
      { _id: `va-${i}`, make: 'Toyota' },
      ['_part_id']
    )
  );

  const crossRefUpdates = Array.from({ length: 3 }, (_, i) =>
    createMockUpdateItem(
      { _id: `cr-${i}`, competitor_brand: 'Bosch' },
      { _id: `cr-${i}`, competitor_brand: 'Bosch' },
      ['_acr_part_id']
    )
  );

  const result = createMixedDiffResult(2, 2, 0);
  result.vehicleApplications = createMockSheetDiff([], vehicleUpdates);
  result.crossReferences = createMockSheetDiff([], crossRefUpdates);

  return result;
}

/**
 * Create cascade delete warnings
 */
export function createCascadeDeleteWarnings(partSku: string): ValidationWarning[] {
  return [
    {
      code: 'W6_VEHICLE_APPLICATION_DELETED',
      severity: 'warning',
      message: `Vehicle application deleted: ${partSku} - Toyota Camry 2020-2023`,
      sheet: 'Vehicle Applications',
      row: 10,
    },
    {
      code: 'W6_VEHICLE_APPLICATION_DELETED',
      severity: 'warning',
      message: `Vehicle application deleted: ${partSku} - Honda Accord 2018-2021`,
      sheet: 'Vehicle Applications',
      row: 11,
    },
    {
      code: 'W5_CROSS_REFERENCE_DELETED',
      severity: 'warning',
      message: `Cross-reference deleted: ${partSku} - Bosch BP123`,
      sheet: 'Cross References',
      row: 20,
    },
  ];
}

/**
 * Create general data change warnings
 */
export function createGeneralWarnings(): ValidationWarning[] {
  return [
    {
      code: 'W1_ACR_SKU_CHANGED',
      severity: 'warning',
      message: 'ACR SKU will be modified',
      sheet: 'Parts',
      row: 5,
      column: 'ACR_SKU',
    },
    {
      code: 'W3_PART_TYPE_CHANGED',
      severity: 'warning',
      message: 'Part type will be changed',
      sheet: 'Parts',
      row: 6,
      column: 'Part_Type',
    },
  ];
}
