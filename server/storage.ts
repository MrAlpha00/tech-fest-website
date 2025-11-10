// Referenced from javascript_database blueprint
import {
  admins,
  teams,
  members,
  eventSettings,
  auditLogs,
  type Admin,
  type InsertAdmin,
  type Team,
  type InsertTeam,
  type Member,
  type InsertMember,
  type EventSetting,
  type InsertEventSetting,
  type AuditLog,
  type TeamWithMembers,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // Admin methods
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Team methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamById(id: string): Promise<Team | undefined>;
  getAllTeams(): Promise<TeamWithMembers[]>;
  updateTeamStatus(id: string, status: "VERIFIED" | "REJECTED", note?: string, verifiedBy?: string): Promise<Team>;
  updateTeamQrCode(id: string, qrCodeUrl: string): Promise<void>;

  // Member methods
  createMembers(teamId: string, members: InsertMember[]): Promise<Member[]>;
  getMembersByTeamId(teamId: string): Promise<Member[]>;

  // Event settings methods
  getSetting(key: string): Promise<EventSetting | undefined>;
  upsertSetting(setting: InsertEventSetting): Promise<EventSetting>;
  getAllSettings(): Promise<EventSetting[]>;

  // Audit log methods
  createAuditLog(teamId: string, action: string, performedBy: string, details?: string): Promise<AuditLog>;
  getAuditLogsByTeamId(teamId: string): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Admin methods
  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }

  // Team methods
  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async getAllTeams(): Promise<TeamWithMembers[]> {
    const allTeams = await db
      .select()
      .from(teams)
      .orderBy(desc(teams.createdAt));

    const teamsWithMembers = await Promise.all(
      allTeams.map(async (team) => {
        const teamMembers = await this.getMembersByTeamId(team.id);
        return { ...team, members: teamMembers };
      })
    );

    return teamsWithMembers;
  }

  async updateTeamStatus(
    id: string,
    status: "VERIFIED" | "REJECTED",
    note?: string,
    verifiedBy?: string
  ): Promise<Team> {
    const updates: any = {
      status,
      verificationNote: note,
      updatedAt: new Date(),
    };

    if (status === "VERIFIED") {
      updates.verifiedAt = new Date();
      updates.verifiedBy = verifiedBy || "admin";
    }

    const [team] = await db
      .update(teams)
      .set(updates)
      .where(eq(teams.id, id))
      .returning();

    return team;
  }

  async updateTeamQrCode(id: string, qrCodeUrl: string): Promise<void> {
    await db
      .update(teams)
      .set({ qrCodeUrl })
      .where(eq(teams.id, id));
  }

  // Member methods
  async createMembers(teamId: string, insertMembers: InsertMember[]): Promise<Member[]> {
    const membersWithTeamId = insertMembers.map((member) => ({
      ...member,
      teamId,
    }));
    const createdMembers = await db.insert(members).values(membersWithTeamId).returning();
    return createdMembers;
  }

  async getMembersByTeamId(teamId: string): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.teamId, teamId));
  }

  // Event settings methods
  async getSetting(key: string): Promise<EventSetting | undefined> {
    const [setting] = await db.select().from(eventSettings).where(eq(eventSettings.key, key));
    return setting || undefined;
  }

  async upsertSetting(insertSetting: InsertEventSetting): Promise<EventSetting> {
    const existing = await this.getSetting(insertSetting.key);

    if (existing) {
      const [updated] = await db
        .update(eventSettings)
        .set({ value: insertSetting.value, updatedAt: new Date() })
        .where(eq(eventSettings.key, insertSetting.key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(eventSettings).values(insertSetting).returning();
      return created;
    }
  }

  async getAllSettings(): Promise<EventSetting[]> {
    return await db.select().from(eventSettings);
  }

  // Audit log methods
  async createAuditLog(
    teamId: string,
    action: string,
    performedBy: string,
    details?: string
  ): Promise<AuditLog> {
    const [log] = await db
      .insert(auditLogs)
      .values({ teamId, action, performedBy, details })
      .returning();
    return log;
  }

  async getAuditLogsByTeamId(teamId: string): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.teamId, teamId))
      .orderBy(desc(auditLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
