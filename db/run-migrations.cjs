
const mysql = require('mysql2/promise');
async function run() {
    const conn = await mysql.createConnection({
        host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
        port: 4000,
        user: '3V6mj7quBDwskdB.root',
        password: 'iJgancAhj3L8HpFWU0bMkaDpdgn6g879',
        database: '19daf75e-d982-8f42-8000-09f193f4fe52'
    });

    try { await conn.execute('ALTER TABLE users MODIFY COLUMN unionId VARCHAR(255) NULL'); console.log('✅ unionId nullable'); } catch(e) { console.log('unionId:', e.message); }
    try { await conn.execute('ALTER TABLE users ADD COLUMN password VARCHAR(255)'); console.log('✅ password column'); } catch(e) { console.log('password:', e.message); }
    try { await conn.execute('ALTER TABLE users ADD COLUMN blocked BOOLEAN NOT NULL DEFAULT FALSE'); console.log('✅ blocked column'); } catch(e) { console.log('blocked:', e.message); }
    try { await conn.execute('ALTER TABLE users ADD COLUMN blockReason VARCHAR(255)'); console.log('✅ blockReason column'); } catch(e) { console.log('blockReason:', e.message); }
    try { await conn.execute('ALTER TABLE materials ADD COLUMN isOfficial BOOLEAN NOT NULL DEFAULT FALSE'); console.log('✅ isOfficial column'); } catch(e) { console.log('isOfficial:', e.message); }
    try { await conn.execute('ALTER TABLE users ADD UNIQUE INDEX users_email_unique (email)'); console.log('✅ email unique'); } catch(e) { console.log('email unique:', e.message); }

    await conn.end();
}
run().catch(e => { console.error(e); process.exit(1); });
