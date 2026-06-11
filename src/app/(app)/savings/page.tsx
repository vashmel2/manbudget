import { requireUserId } from "@/lib/require-user";
import { getSavingsGoal } from "@/lib/queries";
import { SavingsClient } from "./savings-client";

export default async function SavingsPage() {
  const userId = await requireUserId();
  const goal = await getSavingsGoal(userId);
  return <SavingsClient goal={goal} />;
}
