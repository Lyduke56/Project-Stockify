const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
envLocal.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabase.from('customer_notifications').insert({
      customer_id: '2c967798-a90e-4389-8f74-3b992b08b5ce',
      title: 'Test',
      message: 'Test message',
      notification_type: 'ORDER_CANCELLED',
      order_id: 'deb65ead-f469-4771-99e0-cc8068c850cc',
      is_read: false
  });
  console.log('Error:', error);
  console.log('Data:', data);
}

check();
