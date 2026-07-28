import { main } from "./humanities-review-courses";
import { prisma } from "@/lib/db/client";

main().finally(() => prisma.$disconnect()).catch((error) => { console.error(error); process.exitCode = 1; });
