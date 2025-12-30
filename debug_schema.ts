
import { supabase } from './lib/supabase';

async function checkSchema() {
    console.log('Checking if name column exists...');
    const { data, error } = await supabase
        .from('saved_graphs')
        .select('name')
        .limit(1);

    if (error) {
        console.error('Error selecting name:', error);
        if (error.message.includes('does not exist') || error.code === '42703') {
            console.log('CONCLUSION: name column DOES NOT EXIST. Migration needed.');
        } else {
            console.log('CONCLUSION: Some other error occurred.');
        }
    } else {
        console.log('Success! Name column exists.');
        console.log('Data:', data);
    }
}

checkSchema();
