import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export interface FilterOptionsResponse {
  part_types: string[];
  position_types: string[];
  abs_types: string[];
  drive_types: string[];
  bolt_patterns: string[];
}

export async function GET() {
  try {

    // Query for distinct values in each filterable field
    const [partTypesResult, positionTypesResult, absTypesResult, driveTypesResult, boltPatternsResult] = 
      await Promise.all([
        // Part types
        supabase
          .from('parts')
          .select('part_type')
          .not('part_type', 'is', null)
          .not('part_type', 'eq', ''),
        
        // Position types  
        supabase
          .from('parts')
          .select('position_type')
          .not('position_type', 'is', null)
          .not('position_type', 'eq', ''),
          
        // ABS types
        supabase
          .from('parts')
          .select('abs_type')
          .not('abs_type', 'is', null)
          .not('abs_type', 'eq', ''),
          
        // Drive types
        supabase
          .from('parts')
          .select('drive_type')
          .not('drive_type', 'is', null)
          .not('drive_type', 'eq', ''),
          
        // Bolt patterns
        supabase
          .from('parts')
          .select('bolt_pattern')
          .not('bolt_pattern', 'is', null)
          .not('bolt_pattern', 'eq', '')
      ]);

    // Check for errors
    if (partTypesResult.error) throw partTypesResult.error;
    if (positionTypesResult.error) throw positionTypesResult.error;
    if (absTypesResult.error) throw absTypesResult.error;
    if (driveTypesResult.error) throw driveTypesResult.error;
    if (boltPatternsResult.error) throw boltPatternsResult.error;

    // Extract unique values and sort them
    const filterOptions: FilterOptionsResponse = {
      part_types: [...new Set(partTypesResult.data.map(row => row.part_type).filter(Boolean))].sort(),
      position_types: [...new Set(positionTypesResult.data.map(row => row.position_type).filter(Boolean))].sort(),
      abs_types: [...new Set(absTypesResult.data.map(row => row.abs_type).filter(Boolean))].sort(),
      drive_types: [...new Set(driveTypesResult.data.map(row => row.drive_type).filter(Boolean))].sort(),
      bolt_patterns: [...new Set(boltPatternsResult.data.map(row => row.bolt_pattern).filter(Boolean))].sort()
    };

    return NextResponse.json({
      success: true,
      data: filterOptions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching filter options:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch filter options',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}