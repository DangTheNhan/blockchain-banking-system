import { network } from "hardhat";

async function main() {
  // Hardhat 3 requires network.create() to get helpers
  const { networkHelpers } = await network.create();
  
  const now = await networkHelpers.time.latest();
  console.log("Current block timestamp:", now);
  
  // Advance time by 91 days (91 * 24 * 60 * 60 = 7862400 seconds)
  const daysToAdvance = 91;
  const secondsToAdvance = daysToAdvance * 24 * 60 * 60;
  
  await networkHelpers.time.increase(secondsToAdvance);
  
  const newTime = await networkHelpers.time.latest();
  console.log(`\n⏳ Fast-forwarded time by ${daysToAdvance} days!`);
  console.log("New block timestamp:", newTime);
  console.log("\nRefresh your frontend! Deposits should now be marked as 'Matured'.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
