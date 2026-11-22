// db:seed - loads the placeholder catalogue (R5.2). Idempotent (upserts by stable id)
// and refuses to run when APP_ENV=production. Uses pg directly so it runs under plain
// `node` without the generated Prisma client.
import { pathToFileURL } from "node:url";
import { seedCategories, seedCollection, seedProducts, seedRelated } from "./seed-data.ts";

export function assertSeedAllowed(appEnv: string | undefined = process.env.APP_ENV): void {
  if (appEnv === "production") {
    throw new Error("db:seed refuses to run when APP_ENV=production.");
  }
}

type Queryable = { query(text: string, values?: unknown[]): Promise<unknown> };

export async function seedDatabase(client: Queryable): Promise<void> {
  for (const c of seedCategories) {
    await client.query(
      `INSERT INTO "Category" ("id","name","slug") VALUES ($1,$2,$3)
       ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name","slug"=EXCLUDED."slug"`,
      [c.id, c.name, c.slug],
    );
  }

  const col = seedCollection;
  await client.query(
    `INSERT INTO "Collection" ("id","name","slug","tagline","story","mediaRef","sortOrder","published")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name","slug"=EXCLUDED."slug",
       "tagline"=EXCLUDED."tagline","story"=EXCLUDED."story","mediaRef"=EXCLUDED."mediaRef",
       "sortOrder"=EXCLUDED."sortOrder","published"=EXCLUDED."published"`,
    [
      col.id,
      col.name,
      col.slug,
      col.tagline,
      col.story,
      col.mediaRef,
      col.sortOrder,
      col.published,
    ],
  );

  for (const p of seedProducts) {
    await client.query(
      `INSERT INTO "Product" ("id","name","slug","shortDesc","description","story","categoryId",
         "status","featured","scentNotes","seoTitle","seoDescription","updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,'ACTIVE',$8,$9,$10,$11,CURRENT_TIMESTAMP)
       ON CONFLICT ("id") DO UPDATE SET "name"=EXCLUDED."name","slug"=EXCLUDED."slug",
         "shortDesc"=EXCLUDED."shortDesc","description"=EXCLUDED."description",
         "story"=EXCLUDED."story","categoryId"=EXCLUDED."categoryId","status"='ACTIVE',
         "featured"=EXCLUDED."featured","scentNotes"=EXCLUDED."scentNotes",
         "seoTitle"=EXCLUDED."seoTitle","seoDescription"=EXCLUDED."seoDescription",
         "updatedAt"=CURRENT_TIMESTAMP`,
      [
        p.id,
        p.name,
        p.slug,
        p.shortDesc,
        p.description,
        p.story,
        p.categoryId,
        p.featured,
        p.scentNotes,
        p.seoTitle,
        p.seoDescription,
      ],
    );

    for (const v of p.variants) {
      await client.query(
        `INSERT INTO "ProductVariant" ("id","productId","sku","name","priceCents","stockKey","weightGrams","active")
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)
         ON CONFLICT ("id") DO UPDATE SET "sku"=EXCLUDED."sku","name"=EXCLUDED."name",
           "priceCents"=EXCLUDED."priceCents","stockKey"=EXCLUDED."stockKey",
           "weightGrams"=EXCLUDED."weightGrams","active"=true`,
        [v.id, p.id, v.sku, v.name, v.priceCents, v.stockKey, v.weightGrams],
      );
    }

    for (const img of p.images) {
      await client.query(
        `INSERT INTO "ProductImage" ("id","productId","mediaRef","alt","sortOrder")
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT ("id") DO UPDATE SET "mediaRef"=EXCLUDED."mediaRef","alt"=EXCLUDED."alt",
           "sortOrder"=EXCLUDED."sortOrder"`,
        [img.id, p.id, img.mediaRef, img.alt, img.sortOrder],
      );
    }

    for (const a of p.attributes) {
      await client.query(
        `INSERT INTO "ProductAttribute" ("id","productId","key","value") VALUES ($1,$2,$3,$4)
         ON CONFLICT ("id") DO UPDATE SET "key"=EXCLUDED."key","value"=EXCLUDED."value"`,
        [a.id, p.id, a.key, a.value],
      );
    }

    await client.query(
      `INSERT INTO "ProductCollection" ("productId","collectionId","sortOrder") VALUES ($1,$2,$3)
       ON CONFLICT ("productId","collectionId") DO UPDATE SET "sortOrder"=EXCLUDED."sortOrder"`,
      [p.id, col.id, p.collectionSortOrder],
    );
  }

  for (const r of seedRelated) {
    await client.query(
      `INSERT INTO "RelatedProduct" ("fromId","toId") VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [r.fromId, r.toId],
    );
  }
}

async function main(): Promise<void> {
  assertSeedAllowed();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("db:seed - DATABASE_URL is not set.");
    process.exit(1);
  }
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    await seedDatabase(client);
    await client.query("COMMIT");
    console.log(
      `db:seed - OK (${seedProducts.length} products, ${seedProducts.flatMap((p) => p.variants).length} variants).`,
    );
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error("db:seed failed:", err);
    process.exit(1);
  });
}
