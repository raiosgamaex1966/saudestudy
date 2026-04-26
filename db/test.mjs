
import mysql from 'mysql2/promise';
async function test() {
    const conn = await mysql.createConnection({
        host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
        port: 4000,
        user: '3V6mj7quBDwskdB.root',
        password: 'iJgancAhj3L8HpFWU0bMkaDpdgn6g879',
        database: '19daf75e-d982-8f42-8000-09f193f4fe52',
        connectTimeout: 5000
    });
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM users');
    console.log('Users count:', rows[0].count);
    await conn.end();
}
test().catch(e => { console.error(e.message); process.exit(1); });
