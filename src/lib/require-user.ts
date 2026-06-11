import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function requireUserId(): Promise<number> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  return session.userId;
}

/** Returns { ownerId (data scope), actorId (who clicked the button), role }. */
export async function requireActor() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  return {
    ownerId: session.userId,
    actorId: session.actualUserId ?? session.userId,
    role: session.role ?? "owner",
    userName: session.userName ?? "",
  };
}

/** Throws if the signed-in user is a helper. Use to guard edit/delete actions. */
export async function requireOwner(): Promise<number> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (session.role === "helper") {
    throw new Error("Only the account owner can do that.");
  }
  return session.userId;
}

export async function getRole(): Promise<"owner" | "helper"> {
  const session = await getSession();
  return session.role ?? "owner";
}
