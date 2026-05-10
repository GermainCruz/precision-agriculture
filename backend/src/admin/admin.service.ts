import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private async auditoria(actorId: string, accion: string, entidadTipo?: string, entidadId?: string, payload?: unknown) {
    await this.prisma.auditoriaAdmin.create({
      data: {
        actorId,
        accion,
        entidadTipo: entidadTipo ?? null,
        entidadId: entidadId ?? null,
        payload: payload !== undefined ? (payload as object) : undefined,
      },
    });
  }

  async listAudit(actorId: string, limit = 50) {
    await this.requireAdmin(actorId);
    return this.prisma.auditoriaAdmin.findMany({
      orderBy: { creadoEn: 'desc' },
      take: Math.min(limit, 200),
    });
  }

  async requireAdmin(actorId: string) {
    const u = await this.prisma.usuario.findUnique({
      where: { id: actorId },
      include: { rol: true },
    });
    if (!u || u.rol.nombre !== 'administrador') {
      throw new ForbiddenException('Solo administradores');
    }
    return u;
  }

  async listUsers(actorId: string) {
    await this.requireAdmin(actorId);
    return this.prisma.usuario.findMany({
      orderBy: { email: 'asc' },
      include: {
        rol: true,
        _count: { select: { fincas: true } },
      },
    });
  }

  async createUser(
    actorId: string,
    data: {
      email: string;
      password: string;
      nombre: string;
      apellido: string;
      rolNombre: 'administrador' | 'tecnico' | 'agricultor';
    },
  ) {
    await this.requireAdmin(actorId);
    const existed = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    });
    if (existed) throw new ConflictException('Email ya existe');
    const rol = await this.prisma.rol.findFirst({
      where: { nombre: data.rolNombre },
    });
    if (!rol) throw new BadRequestException('Rol no encontrado');
    const hash = await bcrypt.hash(data.password, 10);
    const u = await this.prisma.usuario.create({
      data: {
        email: data.email,
        passwordHash: hash,
        nombre: data.nombre,
        apellido: data.apellido,
        rolId: rol.id,
        activo: true,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        activo: true,
        telefono: true,
        rol: true,
      },
    });
    await this.auditoria(actorId, 'usuario.create', 'usuario', u.id, { email: u.email });
    return u;
  }

  async updateUser(
    actorId: string,
    userId: string,
    patch: {
      nombre?: string;
      apellido?: string;
      rolNombre?: 'administrador' | 'tecnico' | 'agricultor';
      activo?: boolean;
    },
  ) {
    await this.requireAdmin(actorId);
    if (userId === actorId && patch.activo === false) {
      throw new BadRequestException('No puedes desactivarte a ti mismo');
    }
    let rolId: string | undefined;
    if (patch.rolNombre) {
      const rol = await this.prisma.rol.findFirst({
        where: { nombre: patch.rolNombre },
      });
      if (!rol) throw new BadRequestException('Rol no encontrado');
      rolId = rol.id;
    }
    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        nombre: patch.nombre,
        apellido: patch.apellido,
        activo: patch.activo,
        ...(rolId ? { rolId } : {}),
      },
      include: { rol: true },
    });
    await this.auditoria(actorId, 'usuario.update', 'usuario', userId, patch);
    return updated;
  }
}
