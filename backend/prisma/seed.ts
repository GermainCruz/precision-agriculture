import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Roles
  const roles = ['administrador', 'agricultor', 'tecnico'];
  for (const nombre of roles) {
    await prisma.rol.upsert({
      where: { nombre },
      update: {},
      create: { nombre, descripcion: nombre },
    });
  }

  // Catálogo de cultivos (según CONTEXTO.md §5.2)
  const cultivosCatalog = [
    { nombre: 'Maíz',    variedad: 'Híbrido DK7500', cicloDias: 120, requerimientoAguaMm: 500, temperaturaOptima: 25, humedadOptima: 65 },
    { nombre: 'Soja',    variedad: 'DM 4670',         cicloDias: 110, requerimientoAguaMm: 450, temperaturaOptima: 24, humedadOptima: 60 },
    { nombre: 'Trigo',   variedad: 'Buck Pleno',      cicloDias: 130, requerimientoAguaMm: 400, temperaturaOptima: 20, humedadOptima: 55 },
    { nombre: 'Girasol', variedad: 'Paraíso 20',      cicloDias: 115, requerimientoAguaMm: 480, temperaturaOptima: 22, humedadOptima: 50 },
  ];

  for (const c of cultivosCatalog) {
    const existing = await prisma.cultivo.findFirst({ where: { nombre: c.nombre } });
    if (!existing) {
      await prisma.cultivo.create({ data: c });
    }
  }

  // Usuario administrador
  const adminRol = await prisma.rol.findFirst({ where: { nombre: 'administrador' } });
  const agricultorRol = await prisma.rol.findFirst({ where: { nombre: 'agricultor' } });

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@agriprecision.com' },
    update: {},
    create: {
      email: 'admin@agriprecision.com',
      passwordHash,
      nombre: 'Administrador',
      apellido: 'Sistema',
      telefono: '+54 9 261 000-0000',
      rolId: adminRol!.id,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'agricultor@agriprecision.com' },
    update: {},
    create: {
      email: 'agricultor@agriprecision.com',
      passwordHash,
      nombre: 'Juan',
      apellido: 'González',
      telefono: '+54 9 261 123-4567',
      rolId: agricultorRol!.id,
    },
  });

  console.log('✅ Seed completado exitosamente.');
  console.log('   Admin: admin@agriprecision.com / Admin123!');
  console.log('   Agricultor: agricultor@agriprecision.com / Admin123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
