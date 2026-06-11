import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function requireUserId(): Promise<number> {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  return session.userId;
}
