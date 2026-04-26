
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function run() {
    const conn = await mysql.createConnection({
        host: 'ep-t4ni387b5e83b7519dc8.epsrv-t4n281l4mrmemi4zls9a.ap-southeast-1.privatelink.aliyuncs.com',
        port: 4000,
        user: '3V6mj7quBDwskdB.root',
        password: 'iJgancAhj3L8HpFWU0bMkaDpdgn6g879',
        database: '19daf75e-d982-8f42-8000-09f193f4fe52',
        connectTimeout: 10000
    });

    const adminEmail = 'robsoncordeiro1966@gmail.com';
    const adminPassword = 'Binho2020@#$';
    const adminName = 'Robson Cordeiro dos Santos';

    // Check if exists
    const [existing] = await conn.execute('SELECT id FROM users WHERE email = ?', [adminEmail]);

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (existing.length === 0) {
        await conn.execute(
            'INSERT INTO users (email, password, name, role, credits, plan, blocked, createdAt, updatedAt, lastSignInAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())',
            [adminEmail, hashedPassword, adminName, 'admin', 9999, 'annual', false]
        );
        console.log('✅ Admin CREATED:', adminEmail);
    } else {
        await conn.execute(
            'UPDATE users SET password = ?, name = ?, role = ?, credits = ?, plan = ?, blocked = ?, updatedAt = NOW() WHERE email = ?',
            [hashedPassword, adminName, 'admin', 9999, 'annual', false, adminEmail]
        );
        console.log('✅ Admin UPDATED:', adminEmail);
    }

    // Also seed subjects if not exist
    const subjects = [
        ['Técnico em Radiologia', 'tecnico-radiologia', 'Procedimentos radiológicos, proteção radiológica, anatomia para radiologia e legislação', 'scan', 'Técnico'],
        ['Técnico em Enfermagem', 'tecnico-enfermagem', 'Cuidados de enfermagem, administração de medicamentos, biossegurança e ética', 'heart-pulse', 'Técnico'],
        ['Enfermeiro', 'enfermeiro', 'Processo de enfermagem, gestão em saúde, pesquisa e assistência de alta complexidade', 'stethoscope', 'Superior'],
        ['Sistema Único de Saúde (SUS)', 'sus', 'Legislação do SUS, princípios, organização e políticas de saúde pública', 'shield-plus', 'Legislação'],
        ['Raciocínio Lógico Matemático', 'raciocinio-logico', 'Lógica proposicional, argumentação, sequências, análise combinatória e probabilidade', 'brain', 'Geral'],
        ['Matemática', 'matematica', 'Aritmética, álgebra, geometria, trigonometria, estatística e análise matemática', 'calculator', 'Geral'],
        ['Redação', 'redacao', 'Técnicas de redação, coesão, coerência, tipologia textual e normas cultas', 'pen-tool', 'Geral'],
        ['Português', 'portugues', 'Gramática, interpretação de texto, literatura, ortografia e semântica', 'book-open', 'Geral'],
    ];

    for (const [name, slug, description, icon, category] of subjects) {
        await conn.execute(
            'INSERT INTO subjects (name, slug, description, icon, category, isActive, createdAt) VALUES (?, ?, ?, ?, ?, true, NOW()) ON DUPLICATE KEY UPDATE name = name',
            [name, slug, description, icon, category]
        );
    }
    console.log('✅ Subjects seeded!');

    await conn.end();
}

run().catch(e => { console.error(e); process.exit(1); });
