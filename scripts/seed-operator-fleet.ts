import "dotenv/config";
import { config } from "dotenv";
import { and, eq, isNull } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drivers, staffUsers, trucks } from "../src/db/schema";

config({ path: ".env.local" });

const FLEET = [
  { plate: "EP3A01", label: "Camión 1 Norte", crewName: "Pedro Ramírez" },
  { plate: "EP3A02", label: "Camión 2 Centro", crewName: "Luis Contreras" },
  { plate: "EP3A03", label: "Camión 3 Sur", crewName: "Andrés Muñoz" },
  { plate: "EP3A04", label: "Camión 4 Poniente", crewName: "Diego Fuentes" },
  { plate: "EP3A05", label: "Camión 5 Oriente", crewName: "Héctor Vargas" },
] as const;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const operatorEmail = (
    process.env.OPERATOR_EMAIL ?? "camionero@transportesep3.cl"
  ).toLowerCase();

  const db = drizzle(neon(url));

  const [login] = await db
    .select({
      email: staffUsers.email,
      driverId: staffUsers.driverId,
      role: staffUsers.role,
    })
    .from(staffUsers)
    .where(eq(staffUsers.email, operatorEmail))
    .limit(1);

  if (!login?.driverId || login.role !== "driver") {
    throw new Error(
      `No operator login at ${operatorEmail}. Create the staff user (role=driver) first.`,
    );
  }

  const operatorId = login.driverId;
  const [operator] = await db
    .select({ id: drivers.id, name: drivers.name, operatorId: drivers.operatorId })
    .from(drivers)
    .where(eq(drivers.id, operatorId))
    .limit(1);

  if (!operator || operator.operatorId) {
    throw new Error(`${operatorEmail} is not linked to an operator (flota) row.`);
  }

  let crewCreated = 0;
  let trucksCreated = 0;

  for (let i = 0; i < FLEET.length; i++) {
    const row = FLEET[i];
    const crewEmail = `chofer${i + 1}@transportesep3.cl`;

    const [existingCrew] = await db
      .select({ id: drivers.id })
      .from(drivers)
      .where(
        and(eq(drivers.email, crewEmail), eq(drivers.operatorId, operatorId)),
      )
      .limit(1);

    let crewId = existingCrew?.id;
    if (!crewId) {
      const [created] = await db
        .insert(drivers)
        .values({
          name: row.crewName,
          email: crewEmail,
          phone: `+5691111000${i + 1}`,
          operatorId,
          active: true,
        })
        .returning({ id: drivers.id });
      crewId = created.id;
      crewCreated += 1;
    }

    const [existingTruck] = await db
      .select({ id: trucks.id })
      .from(trucks)
      .where(eq(trucks.plate, row.plate))
      .limit(1);

    if (!existingTruck) {
      await db.insert(trucks).values({
        plate: row.plate,
        label: row.label,
        operatorId,
        defaultDriverId: crewId,
        active: true,
      });
      trucksCreated += 1;
    } else {
      await db
        .update(trucks)
        .set({
          operatorId,
          label: row.label,
          defaultDriverId: crewId,
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(trucks.id, existingTruck.id));
    }
  }

  const [orphan] = await db
    .select({ id: trucks.id })
    .from(trucks)
    .where(and(eq(trucks.plate, "ABCD12"), isNull(trucks.operatorId)))
    .limit(1);
  if (orphan) {
    await db
      .update(trucks)
      .set({ operatorId, updatedAt: new Date() })
      .where(eq(trucks.id, orphan.id));
  }

  const crew = await db
    .select({ name: drivers.name, email: drivers.email })
    .from(drivers)
    .where(and(eq(drivers.operatorId, operatorId), eq(drivers.active, true)));
  const fleetTrucks = await db
    .select({ plate: trucks.plate, label: trucks.label })
    .from(trucks)
    .where(and(eq(trucks.operatorId, operatorId), eq(trucks.active, true)));

  console.log(
    `Operator ${operator.name} <${operatorEmail}>: +${crewCreated} crew, +${trucksCreated} trucks.`,
  );
  console.log(
    `Flota ahora: ${crew.length} conductores, ${fleetTrucks.length} camiones.`,
  );
  for (const t of fleetTrucks) {
    console.log(`  camión ${t.plate}${t.label ? ` — ${t.label}` : ""}`);
  }
  for (const c of crew) {
    console.log(`  conductor ${c.name} <${c.email}>`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
