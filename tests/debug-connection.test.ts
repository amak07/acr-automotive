/**
 * Minimal test to debug Supabase connection
 */

import { getTestClient } from './setup/test-client';

describe('Debug Supabase Connection', () => {
  test('should create Supabase client', () => {
    console.log('='.repeat(60));
    console.log('ENVIRONMENT DEBUG:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('URL includes localhost:', process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost'));
    console.log('='.repeat(60));

    console.log('Creating client...');
    const supabase = getTestClient();
    console.log('Client created:', !!supabase);
    expect(supabase).toBeDefined();
  });

  test('should connect to database', async () => {
    console.log('Testing database connection...');
    const supabase = getTestClient();

    console.log('Running query...');
    const { data, error } = await supabase
      .from('parts')
      .select('count')
      .limit(1);

    console.log('Query result:', { data, error });

    if (error) {
      console.error('Database error:', error);
    }

    expect(error).toBeNull();
  }, 15000); // 15 second timeout
});
