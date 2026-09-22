/**
 * Dealer document retention purge.
 *
 * Deletes stored documents (and their UploadedFile bytes) for:
 *   - REJECTED applications older than 90 days
 *   - stale PENDING applications older than 180 days
 *
 * Run manually or via cron/scheduler:  node scripts/purge-dealer-docs.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REJECTED_DAYS = 90;
const PENDING_DAYS = 180;

async function removeFile(storageKey) {
  try {
    await prisma.uploadedFile.delete({ where: { storageKey } });
  } catch {
    // file already gone
  }
}

async function main() {
  const now = Date.now();
  const rejectedBefore = new Date(now - REJECTED_DAYS * 24 * 60 * 60 * 1000);
  const pendingBefore = new Date(now - PENDING_DAYS * 24 * 60 * 60 * 1000);

  const documents = await prisma.dealerDocument.findMany({
    where: {
      OR: [
        { application: { status: "REJECTED", updatedAt: { lt: rejectedBefore } } },
        { application: { status: "PENDING", createdAt: { lt: pendingBefore } } },
      ],
    },
    select: { id: true, storageKey: true },
  });

  if (documents.length === 0) {
    console.log("[purge] no documents to purge");
    return;
  }

  for (const doc of documents) {
    await removeFile(doc.storageKey);
  }

  const ids = documents.map((d) => d.id);
  const result = await prisma.dealerDocument.deleteMany({ where: { id: { in: ids } } });

  console.log(`[purge] purged ${result.count} documents (${documents.length} files removed)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());