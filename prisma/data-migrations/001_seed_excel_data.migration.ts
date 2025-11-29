import xlsx from "xlsx";
import type { DataMigration } from "./_types";
import path from "path";
import { fileURLToPath } from "url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export default {
  name: "001_seed_excel_data",

async up(prisma: any) {
  try {
    const filePath = path.resolve(__dirname, "./data/colleges.xlsx");
    console.log(`📘 Loading Excel file from: ${filePath}`);

    const workbook = xlsx.readFile(filePath);

    for (const sheetName of workbook.SheetNames) {
      const ws = workbook.Sheets[sheetName];

      const rows = xlsx.utils.sheet_to_json(ws, { defval: null });

      if (!rows.length) {
        console.log(`⚠️  Sheet '${sheetName}' is empty. Skipping.`);
        continue;
      }

      const modelName = sheetName.trim();
      if (!prisma[modelName]) {
        console.warn(
          `⚠️  No Prisma model found for sheet '${sheetName}' → expected prisma.${modelName}. Skipping.`
        );
        continue;
      }

      console.log(
        `📥 Inserting ${rows.length} rows into Prisma model '${modelName}'`
      );

      const cleanedRows = rows.map((row:any) => {
        const cleanedRow: any = {};

        for (const key of Object.keys(row)) {
          const trimmedKey = key.trim();
          if (!trimmedKey) continue;

          let value: any = row[key];

          // 1) Excel serial date for college.deadline
          if (modelName === "college" && trimmedKey === "deadline") {
            value =
              typeof value === "number" ? excelSerialToDate(value) : null;
          }

          // 2) Decimal fields that may contain text (like "8.5 LPA")
          if (
            modelName === "college_placement_stats" &&
            (trimmedKey === "min_package_lpa" ||
              trimmedKey === "highest_package_lpa")
          ) {
            value = normalizeDecimal(value);
          }

          // You can add similar rules for other models if needed later

          cleanedRow[trimmedKey] =
            typeof value === "string" ? value.trim() : value;
        }

        return cleanedRow;
      });

      const result = await prisma[modelName].createMany({
        data: cleanedRows,
        skipDuplicates: true,
      });

      if (result.count !== rows.length) {
        console.warn(
          `⚠️  Only ${result.count} out of ${rows.length} rows inserted into Prisma model '${modelName}'.`
        );
      }

      console.log(`✅ Done inserting into '${modelName}'`);
    }

    console.log("🎉 Excel data successfully seeded.");
  } catch (err) {
    console.error("❌ Error seeding Excel data:", err);
    throw err;
  }
},


} satisfies DataMigration;


function excelSerialToDate(serial: number | null) {
  if (!serial || typeof serial !== "number") return null;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel epoch
  return new Date(excelEpoch.getTime() + serial * 86400000); // 86400000 = ms per day
}

function normalizeDecimal(value: any): string | null {
  if (value == null) return null;

  if (typeof value === "number") {
    // Prisma Decimal accepts numeric or numeric string
    return value.toString();
  }

  if (typeof value === "string") {
    // Replace comma with dot and extract first number-like token
    const cleaned = value.replace(",", ".");
    const match = cleaned.match(/-?\d*\.?\d+/);

    return match ? match[0] : null;
  }

  return null;
}
